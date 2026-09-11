import algosdk from 'algosdk';
import type { Context } from 'hono';
import type { RuntimeConfig } from '../config.js';
import { ResearchService } from '../services/research.js';

const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');

/**
 * Demo handler that performs real Algorand TestNet micro-transactions
 * for each research source queried, so transaction IDs are visible on Lora.
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
      return c.json({ error: 'demo_disabled', message: 'The demo agent is refused on MainNet.' }, 403);
    }
    if (!config.demoMnemonic) {
      return c.json({ error: 'demo_disabled', message: 'CLIENT_MNEMONIC is required for the demo agent.' }, 403);
    }

    const payerAddr = algosdk.mnemonicToSecretKey(config.demoMnemonic).addr.toString();
    if (payerAddr === config.payTo) {
      return c.json({ error: 'demo_disabled', message: 'Payer and PAY_TO_ADDRESS must be different accounts.' }, 403);
    }

    const body: { q?: string; budgetCap?: number; confidenceThreshold?: number } = await c.req
      .json()
      .catch(() => ({}));

  return async (c: Context) => {
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
      { name: 'regulatory', price: parseFloat(config.prices.regulatory.replace('$', '')), query: (q: string) => research.queryRegulatoryFilings(q) },
      { name: 'caselaw',    price: parseFloat(config.prices.caselaw.replace('$', '')),    query: (q: string) => research.queryCaseLaw(q) },
      { name: 'specialist', price: parseFloat(config.prices.specialist.replace('$', '')), query: (q: string) => research.querySpecialist(q) },
    ];

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

      // Use real ResearchService for question-aware findings
      const result = await source.query(q);
      const confidenceGain = result.confidenceDelta * 100;
      const newConfidence = Math.min(100, currentConfidence + confidenceGain);

      // Try to send a real Algorand testnet micro-transaction
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
          // Fall back to a mock ID so the demo still works
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

    // Build the final answer from all findings collected
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

/** Send a real ALGO micro-payment on TestNet. */
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

/** Fallback: Generate a mock Algorand-style transaction ID (52-char base32). */
function generateMockAlgoTxId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let id = '';
  for (let i = 0; i < 52; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
