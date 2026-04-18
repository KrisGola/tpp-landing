/**
 * lib/AuthContext.js
 *
 * Client-side auth state, wired to Supabase auth events.
 *
 * The provider subscribes once to onAuthStateChange and re-renders children
 * when the session changes (login, logout, token refresh). Consumers use
 * `useUser()` which returns a stable shape regardless of whether Supabase
 * is configured:
 *
 *   { user, profile, loading, isConfigured, signOut }
 *
 * When Supabase is not configured (no NEXT_PUBLIC_SUPABASE_URL), `loading`
 * resolves to false immediately and `user` stays null. Pages must
 * gracefully fall back to mock data in that case.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSupabaseBrowser } from './supabaseBrowser';

const AuthCtx = createContext({
  user: null,
  profile: null,
  loading: true,
  isConfigured: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);

  const sb = typeof window !== 'undefined' ? getSupabaseBrowser() : null;
  const isConfigured = Boolean(sb);

  // Fetch the client's TPP profile row. Silent-fail: RLS will 404 for
  // lawyers logging in via TPP, which is fine — portal only needs
  // client_profiles.
  const loadProfile = useCallback(async (userId) => {
    if (!sb || !userId) { setProfile(null); return; }
    const { data, error } = await sb
      .from('client_profiles')
      .select('id, full_name, email, phone, avatar_url, onboarding_done')
      .eq('id', userId)
      .maybeSingle();

    if (error && process.env.NODE_ENV !== 'production') {
      console.warn('[AuthContext] profile load:', error.message);
    }
    setProfile(data ?? null);
  }, [sb]);

  // Initial session hydration + subscribe to future changes
  useEffect(() => {
    let cancelled = false;

    if (!sb) { setLoading(false); return; }

    (async () => {
      const { data } = await sb.auth.getSession();
      if (cancelled) return;
      const u = data.session?.user ?? null;
      setUser(u);
      await loadProfile(u?.id);
      setLoading(false);
    })();

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      loadProfile(u?.id);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [sb, loadProfile]);

  const signOut = useCallback(async () => {
    if (!sb) return;
    await sb.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [sb]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) await loadProfile(user.id);
  }, [user?.id, loadProfile]);

  return (
    <AuthCtx.Provider
      value={{ user, profile, loading, isConfigured, signOut, refreshProfile }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useUser() {
  return useContext(AuthCtx);
}
