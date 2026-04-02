/**
 * WizardConfirm — success screen after selecting a lawyer
 * CTA: → /portal (client dashboard) or → /book/[slug] (booking)
 */
import styles from './Wizard.module.css';
import s from './WizardConfirm.module.css';

export default function WizardConfirm({ state }) {
  const lawyer = state.selectedLawyer;

  return (
    <div className={s.wrap}>
      {/* Success circle */}
      <div className={s.successCircle}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M10 20l7 7 13-13" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h2 className={s.title}>Świetnie! Prawnik wybrany</h2>
      <p className={s.sub}>
        {lawyer?.displayName
          ? `Wybrałeś ${lawyer.displayName}. Umów pierwszą konsultację.`
          : 'Możesz teraz umówić pierwszą konsultację.'}
      </p>

      {/* Summary card */}
      {lawyer && (
        <div className={s.summaryCard}>
          <div className={s.summaryRow}>
            <div className={s.summaryAvatar}>
              {lawyer.displayName?.split(' ').filter(w => /[A-ZŻŹĆĄŚĘŁÓŃ]/.test(w[0])).slice(-2).map(w => w[0]).join('')}
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

      {/* CTAs */}
      {lawyer?.slug && (
        <a
          href={`/book/${lawyer.slug}`}
          className={`${styles.btnPrimary} ${s.ctaBtn}`}
        >
          Umów konsultację
        </a>
      )}

      <a href="/portal" className={`${styles.btnSecondary} ${s.portalBtn}`}>
        Przejdź do swojego panelu
      </a>

      <p className={s.note}>
        Sprawa i analiza zostały zapisane w Twoim panelu klienta.
      </p>
    </div>
  );
}
