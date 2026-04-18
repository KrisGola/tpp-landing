/**
 * /api/cases
 *   GET   — list the caller's cases
 *   POST  — create a new tpp_case for the caller
 *
 * Auth: requires Bearer <access_token>. Without a token the route degrades
 * to mock data (for local dev / preview builds without Supabase).
 *
 * RLS policy (see migration 20260402000001):
 *   - SELECT: client_id = auth.uid()    OR lawyer_id = auth.uid()
 *   - INSERT: client_id = auth.uid()
 *
 * So we query with the user-JWT client — Postgres enforces ownership.
 */

import { getUserFromRequest, isSupabaseConfigured } from '../../../lib/supabaseAdmin';
import { getMockCases, buildMockCase } from '../../../lib/mockData';

const ALLOWED_CATEGORIES = [
  'prawo-pracy', 'prawo-rodzinne', 'prawo-cywilne',
  'prawo-nieruchomosci', 'postepowanie-sadowe', 'inne',
];
const ALLOWED_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export const config = {
  api: { bodyParser: { sizeLimit: '32kb' } },
};

export default async function handler(req, res) {
  if (req.method === 'GET')  return listCases(req, res);
  if (req.method === 'POST') return createCase(req, res);
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}

// ─── GET /api/cases ──────────────────────────────────────────────────
async function listCases(req, res) {
  if (!isSupabaseConfigured()) {
    return res.status(200).json({ cases: getMockCases(), meta: { source: 'mock' } });
  }

  const { user, supabase } = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data, error } = await supabase
    .from('tpp_cases')
    .select(`
      id, title, category, status, priority,
      deadline_at, opened_at, closed_at, created_at, updated_at,
      lawyer_id,
      ai_analysis
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[/api/cases GET]', error.message);
    return res.status(500).json({ error: 'Failed to load cases.' });
  }

  return res.status(200).json({
    cases: data ?? [],
    meta: { source: 'supabase', count: data?.length ?? 0 },
  });
}

// ─── POST /api/cases ─────────────────────────────────────────────────
async function createCase(req, res) {
  const body = req.body ?? {};
  const validation = validateCaseBody(body);
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }
  const payload = validation.payload;

  if (!isSupabaseConfigured()) {
    // Mock: echo back a synthetic case so the wizard flow completes
    return res.status(201).json({
      case: buildMockCase(payload),
      meta: { source: 'mock' },
    });
  }

  const { user, supabase } = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const insert = {
    client_id:   user.id,
    title:       payload.title,
    category:    payload.category,
    description: payload.description,
    ai_analysis: payload.aiAnalysis ?? null,
    priority:    payload.priority ?? derivePriority(payload.aiAnalysis),
    deadline_at: payload.deadline_at ?? null,
    lawyer_id:   payload.lawyer_id ?? null,
    status:      payload.lawyer_id ? 'matched' : 'new',
  };

  const { data, error } = await supabase
    .from('tpp_cases')
    .insert(insert)
    .select()
    .single();

  if (error) {
    console.error('[/api/cases POST]', error.message);
    return res.status(500).json({ error: 'Failed to create case.' });
  }

  return res.status(201).json({ case: data, meta: { source: 'supabase' } });
}

// ─── Helpers ─────────────────────────────────────────────────────────

function validateCaseBody(body) {
  const { title, category, description, aiAnalysis, priority, deadline_at, lawyer_id } = body;

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    return { error: 'title is required (min 3 chars).' };
  }
  if (!ALLOWED_CATEGORIES.includes(category)) {
    return { error: `category must be one of: ${ALLOWED_CATEGORIES.join(', ')}` };
  }
  if (description && typeof description !== 'string') {
    return { error: 'description must be a string.' };
  }
  if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
    return { error: `priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}` };
  }
  if (lawyer_id !== undefined && lawyer_id !== null && typeof lawyer_id !== 'string') {
    return { error: 'lawyer_id must be a UUID string.' };
  }

  return {
    payload: {
      title:       title.trim().slice(0, 200),
      category,
      description: description?.trim().slice(0, 4000) ?? null,
      aiAnalysis:  aiAnalysis ?? null,
      priority:    priority ?? null,
      deadline_at: deadline_at ?? null,
      lawyer_id:   lawyer_id ?? null,
    },
  };
}

function derivePriority(aiAnalysis) {
  const u = aiAnalysis?.classification?.urgencyLevel;
  if (u === 'critical') return 'urgent';
  if (u === 'high')     return 'high';
  if (u === 'low')      return 'low';
  return 'medium';
}
