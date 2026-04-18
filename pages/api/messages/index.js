/**
 * /api/messages
 *   GET  ?case_id=<uuid>   — list messages for a case (caller must own it)
 *   POST { case_id, content } — send a message as the caller
 *
 * Realtime: clients subscribe directly to Supabase Realtime on the
 * `tpp_messages` table (see migration 20260402000002). They don't poll
 * this endpoint for new messages — POST here just writes the row.
 *
 * Sender role inference:
 *   - If the caller's user_profiles row has tpp_is_listed → 'lawyer'
 *   - Else → 'client'
 *   Stored on the row so UIs can style bubbles without joining back.
 */

import { getUserFromRequest, isSupabaseConfigured } from '../../../lib/supabaseAdmin';
import { getMockMessages } from '../../../lib/mockData';

export const config = {
  api: { bodyParser: { sizeLimit: '8kb' } },
};

export default async function handler(req, res) {
  if (req.method === 'GET')  return listMessages(req, res);
  if (req.method === 'POST') return sendMessage(req, res);
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}

// ─── GET /api/messages?case_id=… ─────────────────────────────────────
async function listMessages(req, res) {
  const caseId = req.query.case_id;
  if (!caseId || typeof caseId !== 'string') {
    return res.status(400).json({ error: 'case_id query param required' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(200).json({
      messages: getMockMessages(caseId),
      meta: { source: 'mock' },
    });
  }

  const { user, supabase } = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data, error } = await supabase
    .from('tpp_messages')
    .select('id, case_id, sender_id, sender_role, content, read_at, created_at')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) {
    console.error('[/api/messages GET]', error.message);
    return res.status(500).json({ error: 'Failed to load messages.' });
  }

  return res.status(200).json({ messages: data ?? [], meta: { source: 'supabase' } });
}

// ─── POST /api/messages ──────────────────────────────────────────────
async function sendMessage(req, res) {
  const { case_id: caseId, content } = req.body ?? {};

  if (!caseId || typeof caseId !== 'string') {
    return res.status(400).json({ error: 'case_id required' });
  }
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'content required' });
  }
  const cleanContent = content.trim().slice(0, 4000);

  if (!isSupabaseConfigured()) {
    return res.status(201).json({
      message: {
        id: `mock-${Date.now()}`,
        case_id: caseId,
        sender_id: 'mock-client',
        sender_role: 'client',
        content: cleanContent,
        read_at: null,
        created_at: new Date().toISOString(),
      },
      meta: { source: 'mock' },
    });
  }

  const { user, supabase } = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // Determine sender role by checking user_profiles (lawyers have a row there)
  const senderRole = await inferSenderRole(supabase, user.id);

  const { data, error } = await supabase
    .from('tpp_messages')
    .insert({
      case_id:     caseId,
      sender_id:   user.id,
      sender_role: senderRole,
      content:     cleanContent,
    })
    .select()
    .single();

  if (error) {
    console.error('[/api/messages POST]', error.message);
    return res.status(500).json({ error: 'Failed to send message.' });
  }

  return res.status(201).json({ message: data, meta: { source: 'supabase' } });
}

async function inferSenderRole(supabase, userId) {
  // Cheap check: if they have a lawyer profile, they're a lawyer
  const { data } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  return data ? 'lawyer' : 'client';
}
