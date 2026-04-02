import styles from './Wizard.module.css';
import s from './WizardIntro.module.css';

export default function WizardIntro({ goTo }) {
  return (
    <div className={s.wrap}>
      {/* Hero gradient card */}
      <div className={s.hero}>
        <div className={s.heroIcon}>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <rect width="44" height="44" rx="22" fill="rgba(255,255,255,.15)"/>
            <path d="M14 22l5 5 11-11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className={s.heroTitle}>Opisz swoją sytuację,<br/>znajdź prawnika</h1>
        <p className={s.heroSub}>
          AI przeanalizuje Twoją sprawę i dopasuje prawnika w kilka minut
        </p>
      </div>

      {/* Feature pills */}
      <div className={s.features}>
        {[
          { icon: '⚡', text: 'Analiza w 30 sekund' },
          { icon: '🔒', text: 'Bezpiecznie i anonimowo' },
          { icon: '💬', text: 'Bezpłatna konsultacja' },
        ].map(f => (
          <div key={f.text} className={s.featurePill}>
            <span>{f.icon}</span>
            <span>{f.text}</span>
          </div>
        ))}
      </div>

      <button className={styles.btnPrimary} onClick={() => goTo('category')}
        style={{ marginTop: 32 }}>
        Zacznij teraz
      </button>

      <p className={s.disclaimer}>
        Platforma nie zastępuje porady prawnej. Używając serwisu, akceptujesz{' '}
        <a href="/regulamin" className={s.link}>regulamin</a>.
      </p>
    </div>
  );
}
