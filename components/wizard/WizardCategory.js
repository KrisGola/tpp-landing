import styles from './Wizard.module.css';
import s from './WizardCategory.module.css';

const CATEGORIES = [
  { id: 'praca',      label: 'Prawo pracy',       sub: 'Zwolnienie, mobbing, wynagrodzenie' },
  { id: 'rodzina',    label: 'Prawo rodzinne',     sub: 'Rozwód, alimenty, opieka nad dziećmi' },
  { id: 'umowa',      label: 'Umowy i długi',      sub: 'Umowy, windykacja, odszkodowania' },
  { id: 'mieszkanie', label: 'Nieruchomości',      sub: 'Najem, zakup, spółdzielnia' },
  { id: 'sad',        label: 'Postępowanie sądowe',sub: 'Odwołania, wezwania, reprezentacja' },
  { id: 'inne',       label: 'Inne',               sub: 'Inna sprawa prawna' },
];

export default function WizardCategory({ state, update, goTo }) {
  const select = (id) => {
    update({ category: id });
    setTimeout(() => goTo('describe'), 160);
  };

  return (
    <>
      <h2 className={styles.stepTitle}>Jaka to sprawa?</h2>
      <p className={styles.stepSubtitle}>
        Wybierz kategorię — pomoże to dokładniej przeanalizować Twoją sytuację.
      </p>

      <div className={s.grid}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`${styles.optionBtn} ${state.category === cat.id ? styles.optionBtnSelected : ''}`}
            onClick={() => select(cat.id)}
          >
            <div>
              <div className={styles.optionLabel}>{cat.label}</div>
              <div className={styles.optionSub}>{cat.sub}</div>
            </div>
            {state.category === cat.id && (
              <svg className={s.check} width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="var(--color-primary)"/>
                <path d="M6 10l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        ))}
      </div>
    </>
  );
}
