import { useState, useRef, useEffect } from 'react';
import s from './PortalWiadomosci.module.css';

const SEED_MESSAGES = [
  { id: 1, role: 'lawyer', text: 'Dzień dobry. Zapoznałam się z opisem Pani sprawy — zwolnienie bez pisemnego uzasadnienia po 5 latach pracy. To klasyczny przypadek naruszenia przepisów Kodeksu pracy.', time: 'Wczoraj, 14:10' },
  { id: 2, role: 'client', text: 'Dziękuję bardzo. Co powinnam teraz zrobić?', time: 'Wczoraj, 14:23' },
  { id: 3, role: 'lawyer', text: 'Przede wszystkim złożyć odwołanie do sądu pracy. Termin to 21 dni od daty wypowiedzenia — prekluzyjny, nie można go przywrócić. Proszę sprawdzić dokładną datę na piśmie wypowiedzenia.', time: 'Wczoraj, 14:31' },
  { id: 4, role: 'client', text: 'Dziękuję bardzo. Kiedy najlepiej złożyć odwołanie? Mam jeszcze 18 dni.', time: 'Wczoraj, 15:01' },
  { id: 5, role: 'lawyer', text: 'Jak najszybciej. Przygotowałam wzór odwołania — proszę pobrać z zakładki Dokumenty i uzupełnić danymi pracodawcy. Jutro o 09:00 przejdziemy przez niego razem.', time: 'Wczoraj, 15:18' },
  { id: 6, role: 'client', text: 'Świetnie, dziękuję! Do zobaczenia jutro o 9:00.', time: 'Wczoraj, 15:30' },
  { id: 7, role: 'lawyer', text: 'Do zobaczenia. Proszę mieć pod ręką umowę o pracę i pismo wypowiedzenia.', time: 'Wczoraj, 15:31' },
];

export default function PortalWiadomosci({ caseData, user }) {
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const [input, setInput]       = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const newMsg = {
      id: messages.length + 1,
      role: 'client',
      text,
      time: 'Teraz',
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');

    // Simulated reply
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'lawyer',
        text: 'Dziękuję za wiadomość. Odpiszę wkrótce.',
        time: 'Teraz',
      }]);
    }, 2000);
  };

  return (
    <div className={s.wrap}>
      {/* Lawyer header */}
      <div className={s.lawyerBar}>
        <div className={s.lawyerAvatar}>{caseData.lawyer.initials}</div>
        <div>
          <div className={s.lawyerName}>{caseData.lawyer.name}</div>
          <div className={s.lawyerStatus}>{caseData.lawyer.status}</div>
        </div>
      </div>

      {/* Messages */}
      <div className={s.messages}>
        {messages.map(msg => (
          <div key={msg.id}>
            {msg.role === 'lawyer' && (
              <div className={s.msgGroup}>
                <div className={s.msgSender}>{caseData.lawyer.name}</div>
                <div className={s.bubbleLawyer}>{msg.text}</div>
                <div className={s.msgTime}>{msg.time}</div>
              </div>
            )}
            {msg.role === 'client' && (
              <div className={s.msgGroupClient}>
                <div className={s.bubbleClient}>{msg.text}</div>
                <div className={s.msgTimeClient}>{msg.time}</div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={s.inputBar}>
        <input
          className={s.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Napisz wiadomość..."
        />
        <button
          className={s.sendBtn}
          onClick={send}
          disabled={!input.trim()}
          aria-label="Wyślij"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M16 9L2 2l3 7-3 7 14-7z" fill="white"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
