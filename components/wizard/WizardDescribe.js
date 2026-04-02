import { useState } from 'react';
import styles from './Wizard.module.css';
import s from './WizardDescribe.module.css';

const MIN_LEN = 30;
const MAX_LEN = 600;

const PLACEHOLDERS = {
  praca:      'Np. "Dostałem wypowiedzenie po 5 latach pracy, bez pisemnego uzasadnienia. Termin mija za 21 dni..."',
  rodzina:    'Np. "Żona złożyła pozew o rozwód, mamy dwoje dzieci. Chcę ustalić opiekę naprzemienną..."',
  umowa:      'Np. "Kupiłem sprzęt przez internet, który nie działa. Sprzedawca odmawia zwrotu pieniędzy..."',
  mieszkanie: 'Np. "Wynajmuję mieszkanie, właściciel chce mnie wymeldować bez wypowiedzenia..."',
  sad:        'Np. "Dostałem nakaz zapłaty z sądu, mam 14 dni na odpowiedź..."',
  inne:       'Opisz swoją sytuację prawną jak najbardziej szczegółowo...',
};

export default function WizardDescribe({ state, update, goTo }) {
  const [text, setText] = useState(state.userText || '');
  const len = text.trim().length;
  const canContinue = len >= MIN_LEN;

  const handleNext = () => {
    update({ userText: text.trim() });
    goTo('clarify');
  };

  return (
    <>
      <h2 className={styles.stepTitle}>Opisz swoją sytuację</h2>
      <p className={styles.stepSubtitle}>
        Im więcej szczegółów, tym dokładniejsza analiza. Nie pisz danych osobowych.
      </p>

      <div className={s.textareaWrap}>
        <textarea
          className={s.textarea}
          value={text}
          onChange={e => setText(e.target.value.slice(0, MAX_LEN))}
          placeholder={PLACEHOLDERS[state.category] ?? PLACEHOLDERS.inne}
          rows={6}
          autoFocus
        />
        <div className={`${s.counter} ${len > MAX_LEN * 0.9 ? s.counterWarn : ''}`}>
          {len}/{MAX_LEN}
        </div>
      </div>

      {!canContinue && len > 0 && (
        <p className={s.hint}>Napisz jeszcze {MIN_LEN - len} znaków…</p>
      )}

      <button
        className={styles.btnPrimary}
        onClick={handleNext}
        disabled={!canContinue}
      >
        Dalej
      </button>
    </>
  );
}
