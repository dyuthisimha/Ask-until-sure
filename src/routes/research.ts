import type { Context } from 'hono';
import type { ResearchService } from '../services/research.js';

function getQuestion(c: Context): string | null {
  const q = c.req.query('q');
  if (!q || q.trim() === '') return null;
  if (q.length > 500) return null;
  return q;
}

export function createRegulatoryHandler(service: ResearchService) {
  return async (c: Context) => {
    const q = getQuestion(c);
    if (!q) {
      return c.json({ error: 'invalid_query', message: 'A valid question (q) is required (max 500 chars).' }, 400);
    }
    const result = await service.queryRegulatoryFilings(q);
    return c.json(result);
  };
}

export function createCaseLawHandler(service: ResearchService) {
  return async (c: Context) => {
    const q = getQuestion(c);
    if (!q) {
      return c.json({ error: 'invalid_query', message: 'A valid question (q) is required (max 500 chars).' }, 400);
    }
    const result = await service.queryCaseLaw(q);
    return c.json(result);
  };
}

export function createSpecialistHandler(service: ResearchService) {
  return async (c: Context) => {
    const q = getQuestion(c);
    if (!q) {
      return c.json({ error: 'invalid_query', message: 'A valid question (q) is required (max 500 chars).' }, 400);
    }
    const result = await service.querySpecialist(q);
    return c.json(result);
  };
}
