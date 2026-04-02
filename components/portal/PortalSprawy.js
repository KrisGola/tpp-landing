import s from './PortalSprawy.module.css';

export default function PortalSprawy({ caseData, onOpenCase }) {
  return (
    <div className={s.wrap}>
      <div className={s.header}>
        <h2 className={s.title}>Moje sprawy</h2>
      </div>

      {/* Active case */}
      <div className={s.sectionLabel}>AKTYWNE</div>
      <button className={s.caseCard} onClick={onOpenCase}>
        <div className={s.caseTop}>
          <span className={s.caseTitle}>{caseData.title}</span>
          <span className={s.badgeActive}>W TOKU</span>
        </div>
        <p className={s.caseMeta}>{caseData.category} · otwarta 1 kwi 2026</p>
        {caseData.deadlineDays && (
          <div className={s.deadline}>
            <span className={s.deadlineDot} />
            {caseData.deadlineDays} dni do terminu odwołania
          </div>
        )}
        <div className={s.lawyerRow}>
          <div className={s.lawyerAvatar}>{caseData.lawyer.initials}</div>
          <span className={s.lawyerName}>{caseData.lawyer.name}</span>
          <span className={s.arrow}>›</span>
        </div>
      </button>

      {/* Archived */}
      <div className={s.sectionLabel}>ARCHIWUM</div>
      <div className={s.caseCardClosed}>
        <div className={s.caseTop}>
          <span className={s.caseTitleMuted}>Porada prawna — umowa najmu</span>
          <span className={s.badgeClosed}>ZAMKNIĘTA</span>
        </div>
        <p className={s.caseMeta}>Prawo nieruchomości · zamknięta 15 sty 2026</p>
      </div>

      {/* New case CTA */}
      <a href="/wizard" className={s.newCaseBtn}>
        + Otwórz nową sprawę
      </a>

      <div style={{ height: 24 }} />
    </div>
  );
}
