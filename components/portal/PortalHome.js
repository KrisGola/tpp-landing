import s from './PortalHome.module.css';

export default function PortalHome({ caseData, user, onOpenCase }) {
  const firstName = user.name.split(' ')[0];

  return (
    <div className={s.wrap}>
      {/* Deadline alert */}
      {caseData.deadlineDays <= 21 && (
        <div className={s.deadlineAlert}>
          <span className={s.alertDot} />
          <span>
            <strong>{caseData.deadlineDays} dni</strong> {caseData.deadlineLabel}
          </span>
          <button className={s.alertBtn} onClick={onOpenCase}>Zobacz</button>
        </div>
      )}

      {/* Hero */}
      <div className={s.hero}>
        <div className={s.heroContent}>
          <p className={s.greeting}>Dzień dobry,</p>
          <h1 className={s.heroName}>{user.name}</h1>
        </div>
        <div className={s.stats}>
          <div className={s.stat}>
            <span className={s.statNum}>1</span>
            <span className={s.statLbl}>AKTYWNA SPRAWA</span>
          </div>
          <div className={s.stat}>
            <span className={s.statNum}>{caseData.documents.length}</span>
            <span className={s.statLbl}>DOKUMENTY</span>
          </div>
          <div className={s.stat}>
            <span className={s.statNum}>{caseData.nextBooking?.date.split(' ')[0]} kwi</span>
            <span className={s.statLbl}>SPOTKANIE</span>
          </div>
        </div>
      </div>

      {/* Notification banner */}
      <div className={s.notifCard}>
        <span className={s.notifDot} />
        <p>
          <strong>{caseData.lawyer.name}</strong> odpowiedziała na Twoją wiadomość.{' '}
          Wzór odwołania gotowy do pobrania.
        </p>
      </div>

      {/* Case summary card */}
      <div className={s.section}>
        <div className={s.sectionLabel}>TWOJA SPRAWA</div>
        <button className={s.caseCard} onClick={onOpenCase}>
          <div className={s.caseTop}>
            <span className={s.caseTitle}>{caseData.title}</span>
            <span className={s.caseBadge}>W TOKU</span>
          </div>
          <p className={s.caseSub}>{caseData.category} · Sprawa pracownicza</p>
          <p className={s.caseDesc}>
            Zwolnienie bez pisemnego uzasadnienia po 5 latach pracy.{' '}
            Termin odwołania: 21 dni od wypowiedzenia.
          </p>

          {/* Progress timeline */}
          <div className={s.timeline}>
            {caseData.aiAnalysis.timeline.map((step, i) => (
              <div key={i} className={s.tlStep}>
                <div className={`${s.tlDot} ${step.done ? s.tlDone : ''} ${step.active ? s.tlActive : ''}`} />
                {i < caseData.aiAnalysis.timeline.length - 1 && (
                  <div className={`${s.tlLine} ${step.done ? s.tlLineDone : ''}`} />
                )}
              </div>
            ))}
          </div>
        </button>
      </div>

      {/* Appointment card */}
      {caseData.nextBooking && (
        <div className={s.section}>
          <div className={s.sectionLabel}>NAJBLIŻSZE SPOTKANIE</div>
          <div className={s.appointmentCard}>
            <div className={s.apptLeft}>
              <div className={s.apptDate}>{caseData.nextBooking.date}</div>
              <div className={s.apptTime}>{caseData.nextBooking.time}</div>
              <div className={s.apptType}>
                {caseData.nextBooking.type === 'online' ? 'Online · Google Meet' : 'Stacjonarnie'}
              </div>
            </div>
            <div className={s.apptRight}>
              <div className={s.apptAvatar}>{caseData.lawyer.initials}</div>
              <div className={s.apptName}>{caseData.lawyer.name}</div>
            </div>
          </div>
          {caseData.nextBooking.meetUrl && (
            <a href={caseData.nextBooking.meetUrl} className={s.meetBtn}>
              Dołącz do spotkania
            </a>
          )}
        </div>
      )}

      <div className={s.bottomPad} />
    </div>
  );
}
