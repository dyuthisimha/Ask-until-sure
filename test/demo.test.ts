import algosdk from 'algosdk';
import { describe, expect, test } from 'vitest';
import { createApp } from '../src/app.js';
import { testConfig } from './config.js';

function freshMnemonic() {
  const account = algosdk.generateAccount();
  return { mnemonic: algosdk.secretKeyToMnemonic(account.sk), address: account.addr.toString() };
}

describe('Demo research route safety guards', () => {
  test('rejects when demo mode is disabled', async () => {
    const app = createApp({ ...testConfig, demoMode: false, demoMnemonic: undefined });
    const res = await app.request('/demo/research', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q: 'FDA drug approval' }),
    });
    expect(res.status).toBe(403);
  });

  test('rejects on mainnet even if demoMode is true', async () => {
    const app = createApp({ ...testConfig, networkName: 'mainnet', demoMode: true });
    const res = await app.request('/demo/research', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q: 'FDA drug approval' }),
    });
    expect(res.status).toBe(403);
  });

  test('rejects when CLIENT_MNEMONIC is missing', async () => {
    const app = createApp({ ...testConfig, demoMode: true, demoMnemonic: undefined });
    const res = await app.request('/demo/research', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q: 'FDA drug approval' }),
    });
    expect(res.status).toBe(403);
  });

  test('rejects when payer and receiver are the same account', async () => {
    const { mnemonic, address } = freshMnemonic();
    const app = createApp({ ...testConfig, demoMode: true, demoMnemonic: mnemonic, payTo: address });
    const res = await app.request('/demo/research', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q: 'FDA drug approval' }),
    });
    expect(res.status).toBe(403);
  });
});
