/**
 * /login — passwordless magic-link sign-in for TPP clients.
 *
 * Flow:
 *   1. User enters email
 *   2. Supabase sends a magic link to that email
 *   3. User clicks link → lands on /auth/callback → redirected to /portal
 *
 * Why magic link vs password:
 *   - No password to forget or leak
 *   - Removes registration/login distinction — same flow for both
 *   - User identity proven by email possession (sufficient for consumer use case)
 *
 * Redirect-back: if ?next=/some/path is set, the callback routes there.
 * Used by portal guard to bounce back after login.
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getSupabaseBrowser } from '../lib/supabaseBrowser';
import s from '../styles/auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [status, setStatus]     = useState('idle'); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');

  const next = typeof router.query.next === 'string' ? router.query.next : '/portal';

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !/.+@.+\..+/.test(email)) {
      setStatus('error');
      setErrorMsg('Podaj poprawny adres e-mail.');
      return;
    }

    const sb = getSupabaseBrowser();
    if (!sb) {
      setStatus('error');
      setErrorMsg('Uwierzytelnianie nie jest jeszcze skonfigurowane. Skontaktuj się z administratorem.');
      return;
    }

    setStatus('sending');
    setErrorMsg('');

    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message || 'Nie udało się wysłać linku.');
      return;
    }

    setStatus('sent');
  }

  return (
    <>
      <Head>
        <title>Zaloguj się — twojapomocprawna.pl</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className={s.page}>
        <Link href="/" className={s.brand}>twojapomoc<strong>prawna</strong>.pl</Link>

        <div className={s.card}>
          <h1 className={s.title}>Zaloguj się</h1>
          <p className={s.lead}>
            Wyślemy Ci link jednorazowy na e-mail. Bez haseł.
          </p>

          {status === 'sent' ? (
            <div className={s.success}>
              <div className={s.checkCircle}>✓</div>
              <h2>Sprawdź skrzynkę</h2>
              <p>
                Wysłaliśmy link do logowania na <strong>{email}</strong>.
                Kliknij go, żeby się zalogować.
              </p>
              <button
                type="button"
                className={s.secondaryBtn}
                onClick={() => { setStatus('idle'); setEmail(''); }}
              >
                Wyślij ponownie
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={s.form}>
              <label className={s.label}>
                Adres e-mail
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="ty@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'sending'}
                  required
                  className={s.input}
                />
              </label>

              {errorMsg && <div className={s.error}>{errorMsg}</div>}

              <button
                type="submit"
                disabled={status === 'sending'}
                className={s.primaryBtn}
              >
                {status === 'sending' ? 'Wysyłam…' : 'Wyślij link do logowania'}
              </button>
            </form>
          )}

          <div className={s.divider}><span>lub</span></div>

          <p className={s.altAction}>
            Nie masz sprawy? <Link href="/wizard">Opisz sprawę z AI</Link> —
            konto założymy po drodze.
          </p>
        </div>

        <p className={s.legal}>
          Logując się akceptujesz <Link href="/regulamin">Regulamin</Link> i{' '}
          <Link href="/prywatnosc">Politykę prywatności</Link>.
        </p>
      </main>
    </>
  );
}
