/**
 * /wizard — TPP Guided Flow Wizard
 *
 * Multi-step wizard: opis sprawy → AI analiza → kategoria → matching → profil → booking
 * State machine pattern — każdy krok to osobny komponent.
 *
 * Steps:
 *   intro → category → describe → clarify → analyzing → results → matching → confirm
 */

import { useState, useCallback } from 'react';
import Head from 'next/head';
import WizardIntro      from '../../components/wizard/WizardIntro';
import WizardCategory   from '../../components/wizard/WizardCategory';
import WizardDescribe   from '../../components/wizard/WizardDescribe';
import WizardClarify    from '../../components/wizard/WizardClarify';
import WizardAnalyzing  from '../../components/wizard/WizardAnalyzing';
import WizardResults    from '../../components/wizard/WizardResults';
import WizardMatching   from '../../components/wizard/WizardMatching';
import WizardConfirm    from '../../components/wizard/WizardConfirm';
import styles           from '../../components/wizard/Wizard.module.css';

// ── Step order (for progress & back navigation) ─────────
const STEPS = ['intro','category','describe','clarify','analyzing','results','matching','confirm'];

const STEP_LABELS = {
  intro:     '',
  category:  'Kategoria',
  describe:  'Opis',
  clarify:   'Szczegóły',
  analyzing: 'Analiza',
  results:   'Wyniki',
  matching:  'Prawnik',
  confirm:   'Gotowe',
};

// Steps where progress bar should show
const PROGRESS_STEPS = ['category','describe','clarify','results','matching'];

export default function WizardPage() {
  const [step, setStep]           = useState('intro');
  const [direction, setDirection] = useState('forward'); // 'forward' | 'back'
  const [state, setState]         = useState({
    category:    null,   // 'praca' | 'rodzina' | 'umowa' | 'mieszkanie' | 'sad' | 'inne'
    userText:    '',
    hasPismo:    null,
    deadline:    null,
    aiAnalysis:  null,   // output from /api/analyze
    matches:     [],     // output from /api/match
    selectedLawyer: null,
  });

  // ── Navigation ─────────────────────────────────────────
  const goTo = useCallback((nextStep) => {
    setDirection('forward');
    setStep(nextStep);
  }, []);

  const goBack = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) {
      setDirection('back');
      // Skip 'analyzing' when going back from results
      const prev = STEPS[idx - 1] === 'analyzing' ? STEPS[idx - 2] : STEPS[idx - 1];
      setStep(prev);
    }
  }, [step]);

  const update = useCallback((patch) => {
    setState(s => ({ ...s, ...patch }));
  }, []);

  // ── Progress ───────────────────────────────────────────
  const progressIdx   = PROGRESS_STEPS.indexOf(step);
  const showProgress  = progressIdx >= 0;
  const progressPct   = showProgress
    ? Math.round(((progressIdx + 1) / PROGRESS_STEPS.length) * 100)
    : 0;

  // ── Current step component ─────────────────────────────
  const stepProps = { state, update, goTo, goBack };

  const renderStep = () => {
    const cls = `${styles.stepWrap} ${direction === 'back' ? styles.animBack : styles.animIn}`;
    const key = step; // re-mount on step change for animation

    const components = {
      intro:     <WizardIntro     {...stepProps} />,
      category:  <WizardCategory  {...stepProps} />,
      describe:  <WizardDescribe  {...stepProps} />,
      clarify:   <WizardClarify   {...stepProps} />,
      analyzing: <WizardAnalyzing {...stepProps} />,
      results:   <WizardResults   {...stepProps} />,
      matching:  <WizardMatching  {...stepProps} />,
      confirm:   <WizardConfirm   {...stepProps} />,
    };

    return (
      <div key={key} className={cls}>
        {components[step]}
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Znajdź prawnika — Twoja Pomoc Prawna</title>
        <meta name="description" content="Opisz swoją sytuację prawną i znajdź najlepszego prawnika w kilka minut." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className={styles.shell}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <a href="/" className={styles.logo}>
              <span className={styles.logoLight}>twojapomoc</span>
              <span className={styles.logoBold}>prawna</span>
              <span className={styles.logoTld}>.pl</span>
            </a>

            {showProgress && (
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            )}

            {step !== 'intro' && step !== 'confirm' && (
              <button
                className={styles.backBtn}
                onClick={goBack}
                aria-label="Wróć"
              >
                ← Wróć
              </button>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className={styles.main}>
          {renderStep()}
        </main>
      </div>
    </>
  );
}
