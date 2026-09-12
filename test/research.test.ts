import { describe, expect, test } from 'vitest';
import { ResearchService } from '../src/services/research.js';

describe('ResearchService', () => {
  const service = new ResearchService();

  test('queryRegulatoryFilings', async () => {
    const res = await service.queryRegulatoryFilings('FDA drug');
    expect(res.source).toBe('regulatory');
    expect(res.confidenceDelta).toBeGreaterThan(0);
    expect(res.findings.length).toBeGreaterThan(0);
  });

  test('queryCaseLaw', async () => {
    const res = await service.queryCaseLaw('FDA drug');
    expect(res.source).toBe('caselaw');
    expect(res.confidenceDelta).toBeGreaterThan(0);
    expect(res.findings.length).toBeGreaterThan(0);
  });

  test('querySpecialist', async () => {
    const res = await service.querySpecialist('FDA drug');
    expect(res.source).toBe('specialist');
    expect(res.confidenceDelta).toBeGreaterThan(0);
    expect(res.findings.length).toBeGreaterThan(0);
  });

  test('falls back to generic guidance for unmatched categories', async () => {
    const res = await service.queryRegulatoryFilings('unrelated niche topic');
    expect(res.confidenceDelta).toBeGreaterThan(0);
    expect(res.findings.length).toBeGreaterThan(0);
  });
});
