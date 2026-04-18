/**
 * WizardConfirm — success screen after selecting a lawyer.
 *
 * Responsibilities:
 *   1. If the user is logged in, POST /api/cases immediately so the
 *      sprawa appears in /portal. Show "Przejdź do panelu".
 *   2. If not logged in, capture email + name, stash the wizard state
 *      in sessionStorage, and send a magic link. /auth/callback will
 *      read the stash and create the case after authentication.
 *   3. Always offer the booking CTA (/book/[slug]) for users who want
 *      to schedule the first consultation before creating a portal account.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../lib/AuthContext';
import { getSupabaseBrowser, authedFetch } from '../../lib/supabaseBrowser';
import styles from './Wizard.module.css';
import s from './WizardConfirm.module.css';

// Key for stashing pending wizard state through magic-link redirect
const PENDING_CASE_KEY = 'tpp-pending-case';

export default function WizardConfirm({ state }) {
  const router = useRouter();
  const { user, loading, isConfigured } = useUser();
  const lawyer = state.selectedLawyer;

  // "idle" | "saving" | "saved" | "awaitingEmail" | "emailSent" | "error"
  const [status, setStatus] = useState('idle');
  const [email, setEmail]       = useState('');
  const [name, setName]         = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedCaseId, setSavedCaseId] = useState(null);

  // Auto-save for logged-in users (or silently skip in mock mode)
  useEffect(() => {
    if (loading) return;
    if (status !== 'idle') return;

    if (user) {
      saveCase();
    } else if (!isConfigured) {
      // Mock mode — no persistence; pretend it worked so UI continues
      setStatus('saved');
    } else {
      setStatus('awaitingEmail');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, isConfigured]);

  async function saveCase() {
    setStatus('saving');
    setErrorMsg('');
    try {
      const body = buildCasePayload(state, lawyer);
      const r = await authedFetch('/api/cases', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }
      const { case: row } = await r.json();
      setSavedCaseId(row?.id ?? null);
      setStatus('saved');
    } catch (err) {
      console.error('[wizard/confirm] save case failed:', err);
      setErrorMsg(err.message);
      setStatus('error');
    }
  }

  async function handleSendMagicLink(e) {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanName  = name.trim();

    if (!/.+@.+\..+/.test(cleanEmail)) {
      setErrorMsg('Podaj poprawny adres e-mail.');
      return;
    }
    if (cleanName.length < 2) {
      setErrorMsg('Podaj imię i nazwisko.');
      return;
    }

    const sb = getSupabaseBrowser();
    if (!sb) {
      setErrorMsg('Uwierzytelnianie nie jest skonfigurowane.');
      return;
    }

    // Stash wizard state so /auth/callback can finish the job after login
    try {
      sessionStorage.setItem(PENDING_CASE_KEY, JSON.stringify(buildCasePayload(state, lawyer)));
      sessionStorage.setItem('tpp-pending-name', cleanName);
    } catch {
      // storage can fail in private browsing — soft-degrade
    }

    const { error } = await sb.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        data: { full_name: cleanName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/portal')}`,
      },
    });

    if (error) {
      setErrorMsg(error.message || 'Nie udało się wysłać linku.');
      return;
    }

    setStatus('emailSent');
  }

  // ───────────────────────────────────────────────────────────────

  return (
    <div className={s.wrap}>
      <div className={s.successCircle}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M10 20l7 7 13-13" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h2 className={s.title}>Świetnie! Prawnik wybrany</h2>
      <p className={s.sub}>
        {lawyer?.displayName
          ? `Wybrałeś ${lawyer.displayName}.`
          : 'Sprawa została przygotowana.'}
        {' '}Zapisujemy sprawę w Twoim panelu klienta.
      </p>

      {lawyer && (
        <div className={s.summaryCard}>
          <div className={s.summaryRow}>
            <div className={s.summaryAvatar}>
              {initialsOf(lawyer.displayName)}
            </div>
            <div>
              <div className={s.summaryName}>{lawyer.displayName}</div>
              <div className={s.summaryCity}>{lawyer.city}</div>
            </div>
          </div>
          {lawyer.priceConsult && (
            <div className={s.summaryPrice}>
              Pierwsza konsultacja: <strong>{lawyer.priceConsult}</strong>
            </div>
          )}
        </div>
      )}

      {/* ── Status-specific UI ──────────────────────────────── */}

      {status === 'saving' && (
        <p className={s.note}>Zapisywanie sprawy w portalu…</p>
      )}

      {status === 'saved' && (
        <>
          {lawyer?.slug && (
            <a href={`/book/${lawyer.slug}`} className={`${styles.btnPrimary} ${s.ctaBtn}`}>
              Umów konsultację
            </a>
          )}
          <a
            href={savedCaseId ? `/portal?case=${savedCaseId}` : '/portal'}
            className={`${styles.btnSecondary} ${s.portalBtn}`}
          >
            Przejdź do panelu klienta
          </a>
          <p className={s.note}>Sprawa i analiza zostały zapisane w Twoim panelu.</p>
        </>
      )}

      {status === 'awaitingEmail' && (
        <form onSubmit={handleSendMagicLink} className={s.signupForm}>
          <p className={s.formIntro}>
            Załóż konto, żeby zapisać sprawę i kontynuować z wybranym prawnikiem:
          </p>
          <input
            type="text"
            autoComplete="name"
            placeholder="Imię i nazwisko"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={s.formInput}
            required
          />
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Adres e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={s.formInput}
            required
          />
          {errorMsg && <div className={s.formError}>{errorMsg}</div>}
          <button type="submit" className={`${styles.btnPrimary} ${s.ctaBtn}`}>
            Zapisz sprawę i załóż konto
          </button>
          <p className={s.note}>Wyślemy link do logowania na e-mail — bez hasła.</p>
        </form>
      )}

      {status === 'emailSent' && (
        <>
          <div className={s.emailSent}>
            <div className={s.emailIcon}>✉️</div>
            <h3 className={s.emailTitle}>Sprawdź skrzynkę</h3>
            <p className={s.emailBody}>
              Wysłaliśmy link do <strong>{email}</strong>. Po kliknięciu
              utworzymy konto i przeniesiemy Cię do portalu z zapisaną sprawą.
            </p>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <div className={s.formError}>{errorMsg}</div>
          <button onClick={saveCase} className={`${styles.btnSecondary} ${s.portalBtn}`}>
            Spróbuj ponownie
          </button>
        </>
      )}
    </div>
  );
}

// ─── helpers ────────────────────────────────────────────────────

function initialsOf(name = '') {
  return (name || '')
    .split(' ')
    .filter(w => /[A-ZŻŹĆĄŚĘŁÓŃ]/.test(w[0] || ''))
    .slice(-2)
    .map(w => w[0])
    .join('') || '??';
}

function buildCasePayload(state, lawyer) {
  // Map wizard state → /api/cases POST body
  const CATEGORY_MAP = {
    praca:      'prawo-pracy',
    rodzina:    'prawo-rodzinne',
    umowa:      'prawo-cywilne',
    mieszkanie: 'prawo-nieruchomosci',
    sad:        'postepowanie-sadowe',
    inne:       'inne',
  };
  return {
    title: state.aiAnalysis?.summary?.short
      ?? state.userText?.slice(0, 120)
      ?? 'Nowa sprawa',
    category:    CATEGORY_MAP[state.category] ?? 'inne',
    description: state.userText ?? '',
    aiAnalysis:  state.aiAnalysis ?? null,
    lawyer_id:   lawyer?.id && !String(lawyer.id).startsWith('mock-') ? lawyer.id : null,
  };
}

// Exported so /auth/callback can re-use key name and payload shape
export const WIZARD_PENDING_KEY = PENDING_CASE_KEY;
