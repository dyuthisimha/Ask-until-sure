import algosdk from 'algosdk';
import type { Context } from 'hono';
import type { RuntimeConfig } from '../config.js';
import { ResearchService } from '../services/research.js';

const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');

/**
 * Average confidenceDelta each mock source returns across its three
 * question categories (cosmetics/EU, FDA/drug, generic) in ResearchService.
 * Used only to rank sources by expected value (delta per dollar) — the
 * demo has oracle access to its own mock data, unlike the CLI agent.
 */
const AVG_CONFIDENCE_DELTA: Record<'regulatory' | 'caselaw' | 'specialist', number> = {
  regulatory: (0.35 + 0.45 + 0.15) / 3,
  caselaw: (0.25 + 0.3 + 0.1) / 3,
  specialist: (0.3 + 0.2 + 0.25) / 3,
};

/**
 * Demo handler for the browser dashboard. This is a *simulated* purchase
 * flow: it calls ResearchService directly instead of going through the real
 * x402 middleware, and (if a demo mnemonic is configured) sends a small real
 * ALGO transfer per source so the receipt log links to a genuine TestNet
 * transaction. It does NOT perform real x402/USDC verification or
 * settlement through GoPlausible — for that, use the CLI clients
 * (`pnpm client:paid`, `pnpm client:agent`).
 *
 * Because it still moves funds and is reachable without auth, it refuses to
 * run outside a safe local TestNet demo configuration.
 */
export function createDemoResearchHandler(config: RuntimeConfig) {
  const research = new ResearchService();

  return async (c: Context) => {
    if (!config.demoMode) {
      return c.json(
        { error: 'demo_disabled', message: 'Demo mode is disabled. Set DEMO_MODE=true for local TestNet only.' },
        403,
      );
    }
    if (config.networkName === 'mainnet') {
      return c.json({ error: 'demo_disabled', message: 'The demo agent refuses to run on MainNet.' }, 403);
    }
    if (!config.demoMnemonic) {
      return c.json({ error: 'demo_disabled', message: 'CLIENT_MNEMONIC is required to run the demo agent.' }, 403);
    }

    let payerAddr: string;
    try {
      payerAddr = algosdk.mnemonicToSecretKey(config.demoMnemonic).addr.toString();
    } catch {
      return c.json(
        { error: 'demo_disabled', message: 'CLIENT_MNEMONIC is not a valid 25-word Algorand mnemonic.' },
        403,
      );
    }
    if (payerAddr === config.payTo) {
      return c.json(
        { error: 'demo_disabled', message: 'Payer and PAY_TO_ADDRESS must be different accounts.' },
        403,
      );
    }

    const body: { q?: string; budgetCap?: number; confidenceThreshold?: number } = await c.req
      .json()
      .catch(() => ({}));
    const q = body.q?.trim();
    if (!q || q.length === 0 || q.length > 500) {
      return c.json({ error: 'invalid_query', message: 'Enter a valid question (max 500 chars).' }, 400);
    }

    const budgetCap = body.budgetCap ?? config.budgetCapUsd;
    const confidenceThreshold = Math.min(body.confidenceThreshold ?? config.confidenceThreshold, 100);

    const BASE_CONFIDENCE = 30;
    let currentConfidence = BASE_CONFIDENCE;
    let spentSoFar = 0;
    const receipts: any[] = [];

    const sources = [
      { name: 'regulatory' as const, price: parseFloat(config.prices.regulatory.replace('$', '')), query: (q: string) => research.queryRegulatoryFilings(q) },
      { name: 'caselaw' as const,    price: parseFloat(config.prices.caselaw.replace('$', '')),    query: (q: string) => research.queryCaseLaw(q) },
      { name: 'specialist' as const, price: parseFloat(config.prices.specialist.replace('$', '')), query: (q: string) => research.querySpecialist(q) },
    ].sort((a, b) => AVG_CONFIDENCE_DELTA[b.name] / b.price - AVG_CONFIDENCE_DELTA[a.name] / a.price);

    let sourcesUsed = 0;
    let sourcesSkipped = 0;

    for (const source of sources) {
      if (currentConfidence >= confidenceThreshold) {
        sourcesSkipped += (sources.length - sourcesUsed - sourcesSkipped);
        break;
      }
      if (spentSoFar + source.price > budgetCap) {
        sourcesSkipped++;
        continue;
      }

      const result = await source.query(q);
      const confidenceGain = result.confidenceDelta * 100;
      const newConfidence = Math.min(100, currentConfidence + confidenceGain);

      let txId = '';
      const amountMicroAlgo = Math.round(source.price * 1_000_000);

      if (config.demoMnemonic) {
        try {
          txId = await sendRealPayment(
            config.demoMnemonic,
            config.payTo,
            amountMicroAlgo,
            `ask-until-sure:${source.name}:${q.substring(0, 50)}`,
          );
        } catch (err: any) {
          console.warn(`Real tx failed for ${source.name}:`, err.message);
          txId = 'MOCK_' + generateMockAlgoTxId();
        }
      } else {
        txId = 'MOCK_' + generateMockAlgoTxId();
      }

      receipts.push({
        source: source.name,
        price: source.price,
        txId,
        confidenceBefore: currentConfidence,
        confidenceAfter: newConfidence,
        reason: `+${confidenceGain.toFixed(0)}% expected gain justifies $${source.price.toFixed(2)} cost.`,
        findings: result.findings,
        isRealTx: !txId.startsWith('MOCK_'),
      });

      currentConfidence = newConfidence;
      spentSoFar += source.price;
      sourcesUsed++;
    }

    const allFindings = receipts.flatMap((r: any) => r.findings);
    let finalAnswer: string;
    if (allFindings.length === 0) {
      finalAnswer = 'No sources were consulted within budget constraints.';
    } else {
      finalAnswer = allFindings.join(' ');
    }

    if (currentConfidence < confidenceThreshold) {
      finalAnswer += ` (Note: could only reach ${currentConfidence.toFixed(0)}% confidence within the $${budgetCap.toFixed(2)} budget.)`;
    }

    return c.json({
      answer: finalAnswer,
      confidence: Math.min(100, currentConfidence),
      baseConfidence: BASE_CONFIDENCE,
      receipts,
      totalCost: spentSoFar,
      sourcesUsed,
      sourcesSkipped,
      question: q,
      network: config.networkName,
      receiver: config.payTo,
    });
  };
}

async function sendRealPayment(
  senderMnemonic: string,
  receiverAddress: string,
  amountMicroAlgo: number,
  note: string,
): Promise<string> {
  const account = algosdk.mnemonicToSecretKey(senderMnemonic);
  const params = await algodClient.getTransactionParams().do();

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: account.addr.toString(),
    receiver: receiverAddress,
    amount: amountMicroAlgo,
    note: new TextEncoder().encode(note),
    suggestedParams: params,
  });

  const signedTxn = txn.signTxn(account.sk);
  const { txid } = await algodClient.sendRawTransaction(signedTxn).do();
  await algosdk.waitForConfirmation(algodClient, txid, 4);
  return txid;
}

function generateMockAlgoTxId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let id = '';
  for (let i = 0; i < 52; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
