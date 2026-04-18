/**
 * lib/supabaseBrowser.js
 *
 * Singleton Supabase client for the browser.
 *
 * Why singleton: creating a fresh client on every import breaks the auth
 * listener chain and multiplies the WebSocket connection. Call
 * getSupabaseBrowser() wherever you need the client — it returns null
 * if env vars are missing so the app still renders on mock data.
 */
let _client = null;

export function getSupabaseBrowser() {
  if (typeof window === 'undefined') return null;
  if (_client) return _client;

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[supabaseBrowser] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — running in mock mode');
    }
    return null;
  }

  // Lazy-load — keeps bundle small when Supabase is not configured
  // and avoids SSR import cost on pages that don't need auth.
  const { createClient } = require('@supabase/supabase-js');

  _client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,   // handles /auth/callback email confirm
      storageKey: 'tpp-auth',     // namespace so legal-portal session doesn't clash
      flowType: 'pkce',
    },
    global: {
      headers: { 'x-tpp-client': 'web' },
    },
  });

  return _client;
}

/**
 * Convenience: returns the current access token (JWT) from the browser
 * session, or null if not logged in. Use this to authorise fetch() calls
 * to /api routes that need the user's context.
 */
export async function getAccessToken() {
  const sb = getSupabaseBrowser();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * fetch() wrapper that adds Authorization header automatically.
 * Works without login — falls back to unauthenticated request.
 */
export async function authedFetch(input, init = {}) {
  const token = await getAccessToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(input, { ...init, headers });
}
