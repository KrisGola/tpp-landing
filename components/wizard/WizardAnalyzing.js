/**
 * WizardAnalyzing — calm loading screen shown while AI processes
 * Automatically advances to 'results' once aiAnalysis is available
 */
import { useEffect, useRef } from 'react';
import styles from './Wizard.module.css';
import s from './WizardAnalyzing.module.css';

const STEPS_TEXT = [
  'Czytam Twój opis…',
  'Identyfikuję obszar prawny…',
  'Oceniam pilność sprawy…',
  'Przygotowuję plan działania…',
  'Szukam najlepszych prawników…',
];

export default function WizardAnalyzing({ state, goTo }) {
  const timerRef = useRef(null);

  useEffect(() => {
    // Poll for aiAnalysis — advance when ready (or after max 12s)
    const maxWait = 12000;
    const pollInterval = 400;
    let elapsed = 0;

    const check = () => {
      elapsed += pollInterval;
      if (state.aiAnalysis || elapsed >= maxWait) {
        goTo('results');
        return;
      }
      timerRef.current = setTimeout(check, pollInterval);
    };

    timerRef.current = setTimeout(check, pollInterval);
    return () => clearTimeout(timerRef.current);
  }, [state.aiAnalysis, goTo]);

  return (
    <div className={s.wrap}>
      {/* Animated logo */}
      <div className={s.logoRing}>
        <div className={s.ringOuter} />
        <div className={s.ringInner} />
        <div className={s.logoCenter}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M8 14l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      <h2 className={s.title}>Analizuję Twoją sprawę</h2>
      <p className={s.sub}>To zajmie kilkanaście sekund</p>

      <div className={s.stepsList}>
        {STEPS_TEXT.map((text, i) => (
          <div key={i} className={s.stepItem} style={{ animationDelay: `${i * 0.7}s` }}>
            <div className={s.stepDot} />
            <span>{text}</span>
          </div>
        ))}
      </div>

      <p className={s.note}>
        AI analizuje tysiące podobnych spraw, żeby dać Ci dokładne wskazówki.
      </p>
    </div>
  );
}
