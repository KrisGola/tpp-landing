/**
 * /api/profile
 *   GET   — fetch the caller's client_profiles row (creates one if missing)
 *   POST  — upsert the caller's profile (name, phone, avatar_url)
 *
 * Called by:
 *   - /auth/callback after the user clicks the magic link (ensures row exists)
 *   - /portal settings drawer when the user edits their info
 *
 * Why upsert: with magic-link auth the user's first sign-in creates them
 * in auth.users but not in client_profiles. Trying to INSERT twice on
 * subsequent logins would fail — upsert is idempotent.
 */

import { getUserFromRequest, isSupabaseConfigured } from '../../lib/supabaseAdmin';

export const config = { api: { bodyParser: { sizeLimit: '4kb' } } };

export default async function handler(req, res) {
  if (req.method === 'GET')  return getProfile(req, res);
  if (req.method === 'POST') return upsertProfile(req, res);
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}

async function getProfile(req, res) {
  if (!isSupabaseConfigured()) {
    return res.status(200).json({
      profile: { id: 'mock', full_name: 'Gość (tryb mock)', email: 'demo@twojapomocprawna.pl', onboarding_done: false },
      meta: { source: 'mock' },
    });
  }

  const { user, supabase } = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data, error } = await supabase
    .from('client_profiles')
    .select('id, full_name, email, phone, avatar_url, onboarding_done, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[/api/profile GET]', error.message);
    return res.status(500).json({ error: 'Failed to load profile.' });
  }

  return res.status(200).json({ profile: data, meta: { source: 'supabase' } });
}

async function upsertProfile(req, res) {
  const { full_name, phone, avatar_url, onboarding_done } = req.body ?? {};

  if (full_name !== undefined && (typeof full_name !== 'string' || full_name.trim().length < 2)) {
    return res.status(400).json({ error: 'full_name must be at least 2 chars.' });
  }
  if (phone !== undefined && phone !== null && typeof phone !== 'string') {
    return res.status(400).json({ error: 'phone must be a string or null.' });
  }

  if (!isSupabaseConfigured()) {
    return res.status(200).json({
      profile: { id: 'mock', full_name: full_name?.trim() ?? 'Gość', phone: phone ?? null, onboarding_done: Boolean(onboarding_done) },
      meta: { source: 'mock' },
    });
  }

  const { user, supabase } = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const row = {
    id:    user.id,
    email: user.email, // sourced from auth.users so it stays in sync
    ...(full_name       !== undefined ? { full_name: full_name.trim().slice(0, 120) } : {}),
    ...(phone           !== undefined ? { phone: phone?.trim().slice(0, 40) ?? null }  : {}),
    ...(avatar_url      !== undefined ? { avatar_url: avatar_url ?? null }              : {}),
    ...(onboarding_done !== undefined ? { onboarding_done: Boolean(onboarding_done) }   : {}),
  };

  // Ensure full_name is present on first insert — required NOT NULL column
  if (!row.full_name) {
    row.full_name = user.user_metadata?.full_name
      ?? user.email?.split('@')[0]
      ?? 'Użytkownik';
  }

  const { data, error } = await supabase
    .from('client_profiles')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[/api/profile POST]', error.message);
    return res.status(500).json({ error: 'Failed to save profile.' });
  }

  return res.status(200).json({ profile: data, meta: { source: 'supabase' } });
}
