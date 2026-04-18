/**
 * lib/supabaseAdmin.js
 *
 * Server-only Supabase clients.
 *
 *   getSupabaseAdmin()   — service-role client; bypasses RLS. Use ONLY for
 *                          admin ops (aggregate queries, background jobs,
 *                          cross-user reads). Never return this from a
 *                          serverless function that trusts client input.
 *
 *   getSupabaseForUser() — anon-role client authenticated with the user's
 *                          JWT. RLS policies apply as if the user made the
 *                          query directly. Use this in /api routes that
 *                          operate on the caller's own data.
 *
 * Both return null if env vars are not configured so /api routes can
 * gracefully fall back to mock data.
 */

function assertServer() {
  if (typeof window !== 'undefined') {
    throw new Error('[supabaseAdmin] Must only be called on the server.');
  }
}

let _admin = null;

export function getSupabaseAdmin() {
  assertServer();
  if (_admin) return _admin;

  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !service) return null;

  const { createClient } = require('@supabase/supabase-js');
  _admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}

export function getSupabaseForUser(accessToken) {
  assertServer();
  if (!accessToken) return null;

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) return null;

  const { createClient } = require('@supabase/supabase-js');
  // Fresh client per request — carries the user's JWT so RLS evaluates
  // as that user. Do NOT cache across requests.
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

/**
 * Extract the user from an API request. Returns:
 *   { user, token, supabase }  on success
 *   { user: null }             on failure (no token, invalid, or misconfigured)
 *
 * Never throws — callers decide whether to 401 or degrade to anonymous.
 */
export async function getUserFromRequest(req) {
  const header = req.headers?.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) return { user: null };

  const admin = getSupabaseAdmin();
  if (!admin) return { user: null };

  try {
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user) return { user: null };

    return {
      user:     data.user,
      token,
      supabase: getSupabaseForUser(token),
    };
  } catch (err) {
    console.error('[supabaseAdmin.getUserFromRequest]', err?.message);
    return { user: null };
  }
}

/**
 * True if Supabase is configured. Useful for branching into mock mode.
 */
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
