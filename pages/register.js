/**
 * /register — same magic-link flow as /login, but also collects the user's
 * name so we can populate client_profiles on first sign-in.
 *
 * The name is stashed in sessionStorage until /auth/callback reads it and
 * upserts the profile. We don't pass name through Supabase auth metadata
 * because magic-link OTP doesn't accept custom metadata cleanly.
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getSupabaseBrowser } from '../lib/supabaseBrowser';
import s from '../styles/auth.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [status, setStatus]     = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const next = typeof router.query.next === 'string' ? router.query.next : '/portal';

  async function handleSubmit(e) {
    e.preventDefault();
    const name = fullName.trim();

    if (name.length < 2) {
      setStatus('error');
      setErrorMsg('Imię i nazwisko: min. 2 znaki.');
      return;
    }
    if (!email || !/.+@.+\..+/.test(email)) {
      setStatus('error');
      setErrorMsg('Podaj poprawny adres e-mail.');
      return;
    }

    const sb = getSupabaseBrowser();
    if (!sb) {
      setStatus('error');
      setErrorMsg('Uwierzytelnianie nie jest jeszcze skonfigurowane.');
      return;
    }

    // Stash name for /auth/callback to pick up after the user clicks the link
    try { sessionStorage.setItem('tpp-pending-name', name); } catch {}

    setStatus('sending');
    setErrorMsg('');

    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: {
        data: { full_name: name }, // stored on auth.users.raw_user_meta_data
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
        <title>Załóż konto — twojapomocprawna.pl</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className={s.page}>
        <Link href="/" className={s.brand}>twojapomoc<strong>prawna</strong>.pl</Link>

        <div className={s.card}>
          <h1 className={s.title}>Załóż konto</h1>
          <p className={s.lead}>
            Dostęp do portalu klienta: sprawy, dokumenty, czat z prawnikiem.
          </p>

          {status === 'sent' ? (
            <div className={s.success}>
              <div className={s.checkCircle}>✓</div>
              <h2>Link wysłany</h2>
              <p>
                Sprawdź skrzynkę <strong>{email}</strong>. Po kliknięciu linku
                utworzymy konto i przeniesiemy Cię do portalu.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={s.form}>
              <label className={s.label}>
                Imię i nazwisko
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Jan Kowalski"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={status === 'sending'}
                  required
                  className={s.input}
                />
              </label>

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
                {status === 'sending' ? 'Wysyłam…' : 'Wyślij link rejestracji'}
              </button>
            </form>
          )}

          <div className={s.divider}><span>lub</span></div>

          <p className={s.altAction}>
            Masz już konto? <Link href="/login">Zaloguj się</Link>
          </p>
        </div>

        <p className={s.legal}>
          Zakładając konto akceptujesz <Link href="/regulamin">Regulamin</Link> i{' '}
          <Link href="/prywatnosc">Politykę prywatności</Link>.
        </p>
      </main>
    </>
  );
}
