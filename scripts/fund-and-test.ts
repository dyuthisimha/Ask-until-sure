/**
 * Fund testnet accounts and send real micro-transactions so Lora shows activity.
 *
 * Usage: npx tsx scripts/fund-and-test.ts
 */
import 'dotenv/config';
import algosdk from 'algosdk';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required in .env`);
  return value;
}

const PAYER_MNEMONIC = requireEnv('CLIENT_MNEMONIC');
const RECEIVER_ADDRESS = requireEnv('PAY_TO_ADDRESS');

const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');

async function fundFromFaucet(address: string): Promise<boolean> {
  const addr = String(address);
  const url = `https://dispenser.testnet.aws.algodev.network/fund?account=${addr}&amount=10000000`;
  try {
    const res = await fetch(url, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      console.log(`  Faucet funded ${addr.substring(0, 8)}…: txId=${data.txId ?? 'ok'}`);
      return true;
    }
    console.log(`  Faucet returned ${res.status} for ${addr.substring(0, 8)}…`);
  } catch (e) {
    console.log(`  Faucet error for ${addr.substring(0, 8)}…:`, (e as Error).message);
  }
  return false;
}

async function getBalance(address: string): Promise<number> {
  try {
    const info = await algodClient.accountInformation(address).do();
    return Number(info.amount);
  } catch {
    return 0;
  }
}

async function sendMicroPayment(
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

async function main() {
  const payerAccount = algosdk.mnemonicToSecretKey(PAYER_MNEMONIC);
  const payerAddr = payerAccount.addr.toString();
  console.log('Payer address:', payerAddr);
  console.log('Receiver address:', RECEIVER_ADDRESS);
  console.log();

  // Check balances
  let payerBalance = await getBalance(payerAddr);
  const receiverBalanceBefore = await getBalance(RECEIVER_ADDRESS);
  console.log(`Payer balance: ${(payerBalance / 1e6).toFixed(6)} ALGO`);
  console.log(`Receiver balance: ${(receiverBalanceBefore / 1e6).toFixed(6)} ALGO`);
  console.log();

  // Fund if needed
  if (payerBalance < 1_000_000) {
    console.log('Payer needs funding. Trying faucet...');
    await fundFromFaucet(payerAddr);
    await new Promise(r => setTimeout(r, 5000));
    payerBalance = await getBalance(payerAddr);
    console.log(`Payer balance after funding: ${(payerBalance / 1e6).toFixed(6)} ALGO`);
  }

  if (payerBalance < 200_000) {
    console.log('\n⚠️  Payer account is not funded. Please fund it manually:');
    console.log(`   Go to: https://lora.algokit.io/testnet/fund`);
    console.log(`   Paste address: ${payerAddr}`);
    console.log(`   Then re-run this script.`);
    process.exit(1);
  }

  // Send 3 micro-transactions to simulate the research payment flow
  console.log('\nSending micro-transactions...\n');

  const sources = ['regulatory', 'caselaw', 'specialist'] as const;
  const amounts = [100_000, 150_000, 200_000] as const;

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i]!;
    const amount = amounts[i]!;
    try {
      const txId = await sendMicroPayment(
        PAYER_MNEMONIC,
        RECEIVER_ADDRESS,
        amount,
        `ask-until-sure:${source}:research-payment`,
      );
      console.log(`✅ ${source}: ${(amount / 1e6).toFixed(2)} ALGO`);
      console.log(`   TxId: ${txId}`);
      console.log(`   Lora: https://lora.algokit.io/testnet/transaction/${txId}`);
      console.log();
    } catch (e) {
      console.error(`❌ ${source} failed:`, (e as Error).message);
    }
  }

  // Final balances
  const payerFinal = await getBalance(payerAddr);
  const receiverFinal = await getBalance(RECEIVER_ADDRESS);
  console.log(`Final payer balance: ${(payerFinal / 1e6).toFixed(6)} ALGO`);
  console.log(`Final receiver balance: ${(receiverFinal / 1e6).toFixed(6)} ALGO`);
}

main().catch(console.error);
