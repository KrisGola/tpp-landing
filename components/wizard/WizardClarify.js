/**
 * WizardClarify — 2 quick questions before AI call
 * On submit: fires /api/analyze + /api/match in parallel, goes to 'analyzing'
 */
import { useState } from 'react';
import styles from './Wizard.module.css';
import s from './WizardClarify.module.css';

const PISMO_OPTIONS = [
  { id: 'tak',      label: 'Tak', sub: 'Mam pismo lub dokument' },
  { id: 'nie',      label: 'Nie', sub: 'Nie dostałem nic na piśmie' },
  { id: 'nie_wiem', label: 'Nie wiem', sub: 'Nie jestem pewien' },
];

const DEADLINE_OPTIONS = [
  { id: 'pilne', label: 'Tak, mam termin', sub: 'Termin za kilka dni lub tygodni' },
  { id: 'ok',    label: 'Mam czas',       sub: 'Kilka tygodni lub miesięcy' },
  { id: 'nie',   label: 'Bez terminu',    sub: 'Nie wiem o żadnym terminie' },
];

export default function WizardClarify({ state, update, goTo }) {
  const [hasPismo, setHasPismo]   = useState(state.hasPismo   || null);
  const [deadline, setDeadline]   = useState(state.deadline   || null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const canSubmit = hasPismo && deadline && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    // Save to state and go to analyzing immediately — calls happen in background
    update({ hasPismo, deadline });
    goTo('analyzing');

    try {
      // Fire both calls in parallel
      const [analyzeRes, matchRes] = await Promise.allSettled([
        fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userText:  state.userText,
            category:  state.category,
            hasPismo,
            deadline,
          }),
        }).then(r => r.json()),

        // Match call needs aiAnalysis — will be called again from analyzing step
        // with real data; this is a lightweight pre-fetch placeholder
        Promise.resolve(null),
      ]);

      const aiAnalysis = analyzeRes.status === 'fulfilled' ? analyzeRes.value : null;

      if (aiAnalysis && !aiAnalysis.error) {
        // Now fetch matching with real AI analysis
        const matchRes2 = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ aiAnalysis, topN: 3 }),
        }).then(r => r.json());

        update({
          aiAnalysis,
          matches: matchRes2.matches ?? [],
        });
      } else {
        update({ aiAnalysis, matches: [] });
      }

    } catch (err) {
      console.error('[WizardClarify] API error:', err);
      // Non-fatal — analyzing step will handle missing data
    }
  };

  return (
    <>
      <h2 className={styles.stepTitle}>Jeszcze dwa pytania</h2>
      <p className={styles.stepSubtitle}>
        Pomogą AI dokładniej ocenić pilność i opcje działania.
      </p>

      {/* Question 1 */}
      <div className={s.question}>
        <div className={s.qLabel}>Czy masz jakiś dokument lub oficjalne pismo?</div>
        <div className={s.options}>
          {PISMO_OPTIONS.map(opt => (
            <button
              key={opt.id}
              className={`${styles.optionBtn} ${hasPismo === opt.id ? styles.optionBtnSelected : ''}`}
              onClick={() => setHasPismo(opt.id)}
            >
              <div>
                <div className={styles.optionLabel}>{opt.label}</div>
                <div className={styles.optionSub}>{opt.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Question 2 */}
      <div className={s.question}>
        <div className={s.qLabel}>Czy biegnie już jakiś termin prawny?</div>
        <div className={s.options}>
          {DEADLINE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              className={`${styles.optionBtn} ${deadline === opt.id ? styles.optionBtnSelected : ''}`}
              onClick={() => setDeadline(opt.id)}
            >
              <div>
                <div className={styles.optionLabel}>{opt.label}</div>
                <div className={styles.optionSub}>{opt.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && <p className={s.error}>{error}</p>}

      <button
        className={styles.btnPrimary}
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        Analizuj moją sprawę
      </button>
    </>
  );
}
