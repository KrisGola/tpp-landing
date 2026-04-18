/**
 * PortalWiadomosci — chat with the case's lawyer, Supabase-backed.
 *
 * - Loads message history from /api/messages on mount
 * - Subscribes to Supabase Realtime on `tpp_messages` for live delivery
 * - Posts new messages via /api/messages (server infers sender_role)
 * - Falls back to in-memory seed + local-echo when Supabase is unavailable
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { getSupabaseBrowser, authedFetch } from '../../lib/supabaseBrowser';
import s from './PortalWiadomosci.module.css';

const SEED_MESSAGES = [
  { id: 's1', role: 'lawyer', text: 'Dzień dobry. Zapoznałam się z opisem sprawy — zwolnienie bez pisemnego uzasadnienia. Klasyczny przypadek naruszenia Kodeksu pracy.', time: 'Wczoraj, 14:10' },
  { id: 's2', role: 'client', text: 'Dziękuję bardzo. Co powinnam teraz zrobić?', time: 'Wczoraj, 14:23' },
  { id: 's3', role: 'lawyer', text: 'Termin odwołania to 21 dni od daty wypowiedzenia — prekluzyjny. Proszę sprawdzić datę na piśmie.', time: 'Wczoraj, 14:31' },
];

export default function PortalWiadomosci({ caseData, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [sending, setSending]   = useState(false);
  const [loaded, setLoaded]     = useState(false);
  const bottomRef = useRef(null);
  const caseId    = caseData?.id;

  // ── Load history + subscribe to Realtime ───────────────
  useEffect(() => {
    if (!caseId) return;
    let cancelled = false;
    const sb = getSupabaseBrowser();

    async function loadHistory() {
      // Prefer messages already hydrated on caseData
      if (caseData?.messages?.length) {
        if (!cancelled) {
          setMessages(caseData.messages.map(mapDbMsg));
          setLoaded(true);
        }
        return;
      }
      try {
        const r = await authedFetch(`/api/messages?case_id=${encodeURIComponent(caseId)}`);
        if (!r.ok) throw new Error();
        const { messages: list } = await r.json();
        if (!cancelled) {
          setMessages(list?.map(mapDbMsg) ?? SEED_MESSAGES);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) { setMessages(SEED_MESSAGES); setLoaded(true); }
      }
    }

    loadHistory();

    if (!sb) return () => { cancelled = true; };

    const channel = sb
      .channel(`tpp-messages-${caseId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tpp_messages', filter: `case_id=eq.${caseId}` },
        (payload) => {
          setMessages(prev => {
            // De-dupe optimistic locals by DB id match
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, mapDbMsg(payload.new)];
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      sb.removeChannel(channel);
    };
  }, [caseId, caseData?.messages]);

  // ── Auto-scroll on new messages ─────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send ────────────────────────────────────────────────
  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !caseId) return;

    // Optimistic append
    const tempId = `local-${Date.now()}`;
    const optimistic = {
      id: tempId, role: 'client', text, time: 'Teraz', pending: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    setSending(true);

    try {
      const r = await authedFetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ case_id: caseId, content: text }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const { message } = await r.json();

      // Replace optimistic with confirmed
      setMessages(prev =>
        prev.map(m => m.id === tempId ? { ...mapDbMsg(message), pending: false } : m)
      );
    } catch (err) {
      console.error('[chat] send failed:', err);
      // Flag optimistic as failed but keep it visible
      setMessages(prev =>
        prev.map(m => m.id === tempId ? { ...m, pending: false, failed: true } : m)
      );
    } finally {
      setSending(false);
    }
  }, [input, sending, caseId]);

  if (!caseData?.lawyer) {
    return (
      <div className={s.wrap} style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#5a6b65' }}>Czat dostępny po dobraniu prawnika do sprawy.</p>
      </div>
    );
  }

  return (
    <div className={s.wrap}>
      <div className={s.lawyerBar}>
        <div className={s.lawyerAvatar}>{caseData.lawyer.initials}</div>
        <div>
          <div className={s.lawyerName}>{caseData.lawyer.name}</div>
          <div className={s.lawyerStatus}>{caseData.lawyer.status}</div>
        </div>
      </div>

      <div className={s.messages}>
        {messages.map(msg => (
          <div key={msg.id}>
            {msg.role === 'lawyer' ? (
              <div className={s.msgGroup}>
                <div className={s.msgSender}>{caseData.lawyer.name}</div>
                <div className={s.bubbleLawyer}>{msg.text}</div>
                <div className={s.msgTime}>{msg.time}</div>
              </div>
            ) : (
              <div className={s.msgGroupClient}>
                <div className={s.bubbleClient} style={msg.failed ? { opacity: 0.6 } : undefined}>
                  {msg.text}
                </div>
                <div className={s.msgTimeClient}>
                  {msg.failed ? '⚠️ Nie wysłano' : msg.pending ? 'Wysyłanie…' : msg.time}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className={s.inputBar}>
        <input
          className={s.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Napisz wiadomość..."
          disabled={sending || !loaded}
        />
        <button
          className={s.sendBtn}
          onClick={send}
          disabled={!input.trim() || sending}
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

// ─── helpers ──────────────────────────────────────────────────────

function mapDbMsg(row) {
  // Handle both API-shape (ours) and Supabase raw row
  const role    = row.role ?? row.sender_role ?? (row.sender === 'client' ? 'client' : 'lawyer');
  const text    = row.text ?? row.content ?? '';
  const time    = row.time ?? relTime(row.created_at ?? row.createdAt);
  return { id: row.id, role, text, time };
}

function relTime(iso) {
  if (!iso) return 'Teraz';
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 60000;
  if (diff < 1) return 'Teraz';
  if (diff < 60) return `${Math.round(diff)} min temu`;
  const today = now.toDateString() === d.toDateString();
  if (today) return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
    + ', ' + d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}
