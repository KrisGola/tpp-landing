/**
 * WizardResults — AI analysis output display
 * Shows: situation assessment, action plan steps, key facts, then CTA to matching
 */
import styles from './Wizard.module.css';
import s from './WizardResults.module.css';

const URGENCY_LABELS = {
  critical: { label: 'Krytyczne', color: '#DC2626', bg: '#FEF2F2' },
  high:     { label: 'Pilne',     color: '#D97706', bg: '#FFFBEB' },
  medium:   { label: 'Ważne',     color: '#2E9465', bg: '#F0FDF4' },
  low:      { label: 'Spokojnie', color: '#6B7280', bg: '#F9FAFB' },
};

const URGENCY_STEP_COLORS = {
  critical: '#DC2626',
  high:     '#D97706',
  normal:   '#6B7280',
};

export default function WizardResults({ state, goTo }) {
  const ai = state.aiAnalysis;

  // Fallback if AI didn't return data
  if (!ai?.summary) {
    return (
      <>
        <h2 className={styles.stepTitle}>Analiza gotowa</h2>
        <p className={styles.stepSubtitle}>Mamy wstępną ocenę Twojej sytuacji.</p>
        <button className={styles.btnPrimary} onClick={() => goTo('matching')}>
          Znajdź prawnika
        </button>
      </>
    );
  }

  const urgencyData = URGENCY_LABELS[ai.classification?.urgencyLevel] ?? URGENCY_LABELS.medium;

  return (
    <>
      <h2 className={styles.stepTitle}>Analiza Twojej sprawy</h2>

      {/* Urgency badge */}
      <div
        className={s.urgencyBadge}
        style={{ background: urgencyData.bg, color: urgencyData.color }}
      >
        <span className={s.urgencyDot} style={{ background: urgencyData.color }} />
        {urgencyData.label} — {ai.classification?.caseType ?? 'Sprawa prawna'}
      </div>

      {/* AI Summary card */}
      <div className={s.summaryCard}>
        <div className={s.summaryLabel}>OCENA SYTUACJI</div>
        <p className={s.summaryText}>{ai.summary.plainExplanation}</p>
      </div>

      {/* Key facts */}
      {ai.extraction?.keyFacts?.length > 0 && (
        <div className={s.factsSection}>
          <div className={s.sectionLabel}>KLUCZOWE FAKTY</div>
          <div className={s.factsList}>
            {ai.extraction.keyFacts.map((fact, i) => (
              <div key={i} className={s.factRow}>
                <span className={s.factLabel}>{fact.label}</span>
                <span className={s.factValue}>{fact.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deadlines */}
      {ai.extraction?.deadlines?.length > 0 && (
        <div className={s.deadlineSection}>
          {ai.extraction.deadlines.map((d, i) => (
            <div key={i} className={s.deadlineRow}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#D97706" strokeWidth="1.5"/>
                <path d="M8 4.5v4l2.5 1.5" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span><strong>{d.days} dni</strong> — {d.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action plan */}
      {ai.actionPlan?.steps?.length > 0 && (
        <div className={s.planSection}>
          <div className={s.sectionLabel}>PLAN DZIAŁANIA</div>
          {ai.actionPlan.steps.map((step) => (
            <div key={step.order} className={s.planStep}>
              <div
                className={s.planNum}
                style={{ color: URGENCY_STEP_COLORS[step.urgency] ?? '#6B7280' }}
              >
                {step.order}
              </div>
              <div className={s.planContent}>
                <div className={s.planTitle}>{step.title}</div>
                <div className={s.planBody}>{step.body}</div>
                {step.deadlineLabel && (
                  <div className={s.planDeadline}>{step.deadlineLabel}</div>
                )}
                {!step.canDoAlone && (
                  <div className={s.planLawyerTag}>Wymaga prawnika</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className={styles.btnPrimary} onClick={() => goTo('matching')}>
        Znajdź prawnika dla tej sprawy
      </button>
    </>
  );
}
