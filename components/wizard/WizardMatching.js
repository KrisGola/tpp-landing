/**
 * WizardMatching — lawyer cards from /api/match
 */
import { useState } from 'react';
import styles from './Wizard.module.css';
import s from './WizardMatching.module.css';

export default function WizardMatching({ state, update, goTo }) {
  const [selected, setSelected] = useState(state.selectedLawyer?.id ?? null);

  const matches = state.matches ?? [];

  const handleSelect = (lawyer) => {
    setSelected(lawyer.id);
    update({ selectedLawyer: lawyer });
    setTimeout(() => goTo('confirm'), 300);
  };

  return (
    <>
      <h2 className={styles.stepTitle}>Dopasowani prawnicy</h2>
      <p className={styles.stepSubtitle}>
        AI wybrał najlepszych specjalistów dla Twojej sprawy.
      </p>

      {matches.length === 0 && (
        <div className={s.empty}>
          <p>Brak dostępnych prawników. Spróbuj ponownie za chwilę.</p>
          <button className={styles.btnSecondary} onClick={() => goTo('results')}>
            Wróć do analizy
          </button>
        </div>
      )}

      <div className={s.list}>
        {matches.map((lawyer) => (
          <div key={lawyer.id} className={`${s.card} ${selected === lawyer.id ? s.cardSelected : ''}`}>
            {/* Header */}
            <div className={s.cardHeader}>
              <div className={s.avatar}>
                {lawyer.displayName?.split(' ').filter(w => /[A-ZŻŹĆĄŚĘŁÓŃ]/.test(w[0])).slice(-2).map(w => w[0]).join('')}
              </div>
              <div className={s.info}>
                <div className={s.name}>{lawyer.displayName}</div>
                <div className={s.location}>{lawyer.city}</div>
              </div>
              <div className={s.matchBadge} title="Wynik dopasowania">
                {lawyer.matchScore}%
              </div>
            </div>

            {/* Specs */}
            {lawyer.specializations?.length > 0 && (
              <div className={s.specs}>
                {lawyer.specializations.slice(0, 3).map(spec => (
                  <span key={spec} className={s.specTag}>{spec}</span>
                ))}
              </div>
            )}

            {/* Stats row */}
            <div className={s.stats}>
              {lawyer.rating && (
                <div className={s.stat}>
                  <span className={s.statVal}>{lawyer.rating}</span>
                  <span className={s.statLbl}>Ocena</span>
                </div>
              )}
              {lawyer.reviewCount > 0 && (
                <div className={s.stat}>
                  <span className={s.statVal}>{lawyer.reviewCount}</span>
                  <span className={s.statLbl}>Opinii</span>
                </div>
              )}
              {lawyer.responseHours && (
                <div className={s.stat}>
                  <span className={s.statVal}>{lawyer.responseHours}h</span>
                  <span className={s.statLbl}>Odpowiedź</span>
                </div>
              )}
            </div>

            {/* Match explanation */}
            {lawyer.explanation?.length > 0 && (
              <div className={s.explanation}>
                {lawyer.explanation.map((line, i) => (
                  <div key={i} className={s.explanationItem}>
                    <span className={s.checkmark}>✓</span> {line}
                  </div>
                ))}
              </div>
            )}

            {/* Pricing */}
            {lawyer.priceConsult && (
              <div className={s.pricing}>
                Pierwsza konsultacja: <strong>{lawyer.priceConsult}</strong>
              </div>
            )}

            {/* CTA */}
            <div className={s.actions}>
              {lawyer.slug && (
                <a
                  href={`/p/${lawyer.slug}`}
                  className={s.btnProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Zobacz profil
                </a>
              )}
              <button
                className={s.btnBook}
                onClick={() => handleSelect(lawyer)}
              >
                {lawyer.availability ?? 'Umów wizytę'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className={styles.btnSecondary} onClick={() => goTo('results')}>
        Wróć do analizy
      </button>
    </>
  );
}
