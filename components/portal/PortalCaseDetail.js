import s from './PortalCaseDetail.module.css';

const URGENCY_COLORS = {
  critical: { color: '#DC2626', bg: '#FEF2F2', label: 'PILNE' },
  high:     { color: '#D97706', bg: '#FFFBEB', label: 'WAŻNE' },
  normal:   { color: '#6B7280', bg: '#F9FAFB', label: '' },
};

export default function PortalCaseDetail({ caseData, onBack }) {
  return (
    <div className={s.wrap}>
      {/* Hero */}
      <div className={s.hero}>
        <button className={s.backBtn} onClick={onBack}>
          ← Moje sprawy
        </button>
        <h1 className={s.title}>{caseData.title}</h1>
        <p className={s.meta}>
          {caseData.category} · otwarta {new Date(caseData.openedAt).toLocaleDateString('pl-PL', { day:'numeric', month:'short', year:'numeric' })}
        </p>
      </div>

      {/* Timeline */}
      <div className={s.timelineWrap}>
        {caseData.aiAnalysis.timeline.map((step, i) => (
          <div key={i} className={s.tlItem}>
            <div className={`${s.tlDot} ${step.done ? s.tlDone : ''} ${step.active ? s.tlActive : ''}`} />
            {i < caseData.aiAnalysis.timeline.length - 1 && (
              <div className={`${s.tlLine} ${step.done ? s.tlLineDone : ''}`} />
            )}
            <span className={`${s.tlLabel} ${step.active ? s.tlLabelActive : ''}`}>{step.label}</span>
          </div>
        ))}
      </div>

      <div className={s.content}>
        {/* AI Summary */}
        <div className={s.sectionLabel}>ANALIZA AI</div>
        <div className={s.aiCard}>
          <div className={s.aiLabel}>OCENA SYTUACJI</div>
          <p className={s.aiText}>{caseData.aiAnalysis.summary}</p>
        </div>

        {/* Action plan */}
        <div className={s.sectionLabel}>PLAN DZIAŁANIA</div>
        {caseData.aiAnalysis.steps.map(step => {
          const u = URGENCY_COLORS[step.urgency] ?? URGENCY_COLORS.normal;
          return (
            <div key={step.order} className={s.planStep}>
              <div className={s.planNum} style={{ color: u.color }}>{step.order}</div>
              <div className={s.planContent}>
                <div className={s.planHeader}>
                  <span className={s.planTitle}>{step.title}</span>
                  {u.label && (
                    <span className={s.urgencyTag} style={{ color: u.color, background: u.bg }}>
                      {u.label}{step.deadlineLabel ? ` — ${step.deadlineLabel}` : ''}
                    </span>
                  )}
                </div>
                <p className={s.planBody}>{step.body}</p>
              </div>
            </div>
          );
        })}

        {/* Documents */}
        <div className={s.sectionLabel}>DOKUMENTY</div>
        <div className={s.docList}>
          {caseData.documents.map(doc => (
            <div key={doc.id} className={s.docRow}>
              <div className={s.docIcon}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M9 1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5L9 1z"
                    stroke="var(--color-primary)" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M9 1v4h4" stroke="var(--color-primary)" strokeWidth="1.3" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={s.docInfo}>
                <div className={s.docName}>{doc.name}</div>
                <div className={s.docMeta}>{doc.size} · {doc.date}</div>
              </div>
              <span className={`${s.docBadge} ${doc.source === 'ai_generated' ? s.docBadgeAi : ''}`}>
                {doc.source === 'ai_generated' ? 'AI' : 'Twój'}
              </span>
            </div>
          ))}
        </div>

        {/* Lawyer section */}
        <div className={s.sectionLabel}>PRAWNIK</div>
        <div className={s.lawyerCard}>
          <div className={s.lawyerAvatar}>{caseData.lawyer.initials}</div>
          <div className={s.lawyerInfo}>
            <div className={s.lawyerName}>{caseData.lawyer.name}</div>
            <div className={s.lawyerStatus}>{caseData.lawyer.status}</div>
          </div>
          <div className={s.lawyerActions}>
            <button className={s.lawyerMsgBtn}>Napisz</button>
            {caseData.nextBooking?.meetUrl && (
              <a href={caseData.nextBooking.meetUrl} className={s.lawyerMeetBtn}>Meet</a>
            )}
          </div>
        </div>
      </div>

      <div style={{ height: 32 }} />
    </div>
  );
}
