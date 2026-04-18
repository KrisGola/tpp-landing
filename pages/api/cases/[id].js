/**
 * /api/cases/[id]
 *   GET    — single case with lawyer profile, documents, recent messages
 *   PATCH  — update status/priority (owner only; RLS enforced)
 *
 * Response shape (GET):
 *   {
 *     case: { ...tpp_cases row },
 *     lawyer: { id, full_name, tpp_slug, avatar_url, tpp_city } | null,
 *     documents: TppDocument[],
 *     messages: TppMessage[]   // latest 50, oldest first
 *   }
 */

import { getUserFromRequest, isSupabaseConfigured } from '../../../lib/supabaseAdmin';
import { getMockCase } from '../../../lib/mockData';

const ALLOWED_STATUS   = ['new', 'matched', 'active', 'closed', 'archived'];
const ALLOWED_PRIORITY = ['low', 'medium', 'high', 'urgent'];

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'id is required' });
  }

  if (req.method === 'GET')   return getCase(req, res, id);
  if (req.method === 'PATCH') return updateCase(req, res, id);

  res.setHeader('Allow', 'GET, PATCH');
  return res.status(405).json({ error: 'Method not allowed' });
}

async function getCase(req, res, id) {
  if (!isSupabaseConfigured()) {
    return res.status(200).json(getMockCase(id));
  }

  const { user, supabase } = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: caseRow, error: caseErr } = await supabase
    .from('tpp_cases')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (caseErr) {
    console.error('[/api/cases/[id] GET case]', caseErr.message);
    return res.status(500).json({ error: 'Failed to load case.' });
  }
  if (!caseRow) return res.status(404).json({ error: 'Case not found' });

  // Parallel fetch: lawyer, docs, messages
  const [lawyerResult, docsResult, msgsResult] = await Promise.all([
    caseRow.lawyer_id
      ? supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url, tpp_slug, tpp_city, tpp_specializations, tpp_rating, tpp_review_count')
          .eq('id', caseRow.lawyer_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('tpp_documents')
      .select('id, name, source, mime_type, size_bytes, created_at, document_id')
      .eq('case_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('tpp_messages')
      .select('id, sender_id, sender_role, content, read_at, created_at')
      .eq('case_id', id)
      .order('created_at', { ascending: true })
      .limit(50),
  ]);

  return res.status(200).json({
    case:      caseRow,
    lawyer:    lawyerResult.data ?? null,
    documents: docsResult.data   ?? [],
    messages:  msgsResult.data   ?? [],
    meta: { source: 'supabase' },
  });
}

async function updateCase(req, res, id) {
  const { status, priority, deadline_at } = req.body ?? {};

  const patch = {};
  if (status !== undefined) {
    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${ALLOWED_STATUS.join(', ')}` });
    }
    patch.status = status;
    if (status === 'closed') patch.closed_at = new Date().toISOString();
  }
  if (priority !== undefined) {
    if (!ALLOWED_PRIORITY.includes(priority)) {
      return res.status(400).json({ error: `priority must be one of: ${ALLOWED_PRIORITY.join(', ')}` });
    }
    patch.priority = priority;
  }
  if (deadline_at !== undefined) patch.deadline_at = deadline_at;

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'No updatable fields provided.' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(200).json({ case: { id, ...patch }, meta: { source: 'mock' } });
  }

  const { user, supabase } = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data, error } = await supabase
    .from('tpp_cases')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[/api/cases/[id] PATCH]', error.message);
    return res.status(500).json({ error: 'Failed to update case.' });
  }

  return res.status(200).json({ case: data, meta: { source: 'supabase' } });
}
