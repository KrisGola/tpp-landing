/**
 * /auth/callback — handles the redirect from Supabase magic-link emails.
 *
 * Supabase's detectSessionInUrl option (set in supabaseBrowser.js) already
 * extracts the access_token from the URL hash and creates the session. This
 * page only needs to:
 *
 *   1. Wait for the session to be ready
 *   2. Upsert the client_profiles row (idempotent)
 *   3. Pick the redirect target:
 *        - ?next=… from the query
 *        - /portal/onboarding if profile.onboarding_done is false
 *        - /portal otherwise
 *
 * Errors (expired link, invalid token) route to /login with an error flag.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { getSupabaseBrowser, authedFetch } from '../../lib/supabaseBrowser';
import s from '../../styles/auth.module.css';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('working'); // working | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!router.isReady) return;

    (async () => {
      const sb = getSupabaseBrowser();
      if (!sb) {
        setStatus('error');
        setErrorMsg('Brak konfiguracji Supabase. Skontaktuj się z administratorem.');
        return;
      }

      try {
        // Supabase processes the URL hash automatically; we wait for the session
        const { data, error } = await sb.auth.getSession();
        if (error || !data.session) {
          throw new Error(error?.message || 'Link wygasł lub jest nieprawidłowy.');
        }

        // Ensure client_profiles exists (idempotent upsert via /api/profile)
        const pendingName = (() => {
          try { return sessionStorage.getItem('tpp-pending-name'); } catch { return null; }
        })();

        const profileRes = await authedFetch('/api/profile', {
          method: 'POST',
          body: JSON.stringify({
            full_name: pendingName || data.session.user.user_metadata?.full_name || undefined,
          }),
        });

        if (!profileRes.ok && profileRes.status !== 401) {
          // 401 means our admin isn't configured — allowed in mock mode
          const text = await profileRes.text();
          console.warn('[callback] profile upsert warning:', text);
        }

        try { sessionStorage.removeItem('tpp-pending-name'); } catch {}

        // If the user came here via the wizard, complete the case save now
        const pendingCaseRaw = (() => {
          try { return sessionStorage.getItem('tpp-pending-case'); } catch { return null; }
        })();
        let createdCaseId = null;
        if (pendingCaseRaw) {
          try {
            const body = JSON.parse(pendingCaseRaw);
            const caseRes = await authedFetch('/api/cases', {
              method: 'POST',
              body: JSON.stringify(body),
            });
            if (caseRes.ok) {
              const { case: row } = await caseRes.json();
              createdCaseId = row?.id ?? null;
            } else {
              console.warn('[callback] pending case save failed:', await caseRes.text());
            }
          } catch (e) {
            console.warn('[callback] pending case parse failed:', e);
          } finally {
            try { sessionStorage.removeItem('tpp-pending-case'); } catch {}
          }
        }

        // Decide where to go next
        const nextParam = typeof router.query.next === 'string' ? router.query.next : null;
        const profile = await profileRes.json().catch(() => null);
        const target = nextParam
          || (createdCaseId ? `/portal?case=${createdCaseId}` : null)
          || (profile?.profile?.onboarding_done === false ? '/portal/onboarding' : '/portal');

        router.replace(target);
      } catch (err) {
        console.error('[/auth/callback]', err);
        setStatus('error');
        setErrorMsg(err.message || 'Wystąpił błąd podczas logowania.');
      }
    })();
  }, [router.isReady, router.query.next]);

  return (
    <>
      <Head>
        <title>Logowanie…</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className={s.page}>
        <div className={s.card}>
          {status === 'working' ? (
            <>
              <div className={s.spinner} aria-hidden="true" />
              <h1 className={s.title}>Logujemy Cię…</h1>
              <p className={s.lead}>Zaraz przeniesiemy Cię do portalu.</p>
            </>
          ) : (
            <>
              <h1 className={s.title}>Coś poszło nie tak</h1>
              <p className={s.error}>{errorMsg}</p>
              <a href="/login" className={s.primaryBtn}>Wróć do logowania</a>
            </>
          )}
        </div>
      </main>
    </>
  );
}
