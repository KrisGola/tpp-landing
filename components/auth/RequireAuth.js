/**
 * <RequireAuth> — client-side auth guard.
 *
 * Wrap any page that should be logged-in-only. Unauthenticated users are
 * redirected to /login?next=<current-path>. While auth state is loading,
 * renders a minimal placeholder so there's no flash of content.
 *
 * Special mode: when Supabase is not configured (local dev without env
 * vars), renders children unconditionally with a "demo mode" banner so
 * the colleague can review the UI before wiring the DB.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../lib/AuthContext';
import s from './RequireAuth.module.css';

export default function RequireAuth({ children, redirectTo = '/login' }) {
  const router = useRouter();
  const { user, loading, isConfigured } = useUser();

  useEffect(() => {
    if (!isConfigured) return;       // mock mode: never redirect
    if (loading) return;
    if (!user) {
      const next = encodeURIComponent(router.asPath);
      router.replace(`${redirectTo}?next=${next}`);
    }
  }, [user, loading, isConfigured, router, redirectTo]);

  if (!isConfigured) {
    return (
      <>
        <div className={s.demoBanner} role="status">
          <span className={s.demoDot} /> Tryb demo — Supabase nie jest skonfigurowany. Dane są mockowe.
        </div>
        {children}
      </>
    );
  }

  if (loading) {
    return (
      <div className={s.loadingShell}>
        <div className={s.spinner} aria-hidden="true" />
      </div>
    );
  }

  if (!user) return null;
  return children;
}
