/**
 * lib/portalAdapter.js
 *
 * Translates Supabase row shapes into the denormalised structure the
 * portal components expect. Keeps the DB schema portable: if columns
 * change we only update this adapter, not every component.
 *
 * Source shape (from /api/cases/[id]):
 *   { case, lawyer, documents, messages }
 *
 * Target shape (what portal components want):
 *   {
 *     id, title, category, status, priority,
 *     deadlineDays, deadlineLabel, openedAt,
 *     lawyer: { id, name, initials, status } | null,
 *     aiAnalysis: { summary, urgency, timeline, steps },
 *     documents: [{ id, name, source, size, date }],
 *     nextBooking: { date, time, type, meetUrl } | null
 *   }
 */

// ─── Utilities ──────────────────────────────────────────────────────

const CATEGORY_LABELS = {
  'prawo-pracy':        'Prawo pracy',
  'prawo-rodzinne':     'Prawo rodzinne',
  'prawo-cywilne':      'Prawo cywilne',
  'prawo-nieruchomosci':'Nieruchomości',
  'postepowanie-sadowe':'Postępowanie sądowe',
  'inne':               'Inna sprawa',
};

function initialsOf(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  const last2 = parts.slice(-2);
  return last2.map(p => p[0]?.toUpperCase() ?? '').join('') || '??';
}

function daysUntil(iso) {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  const now    = Date.now();
  return Math.max(0, Math.ceil((target - now) / 86400000));
}

function humanBytes(n) {
  if (!n && n !== 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function formatRelDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays < 1) return 'Dziś';
  if (diffDays < 2) return 'Wczoraj';
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
}

// ─── Main adapter ───────────────────────────────────────────────────

export function buildPortalCaseView(detail) {
  const { case: c, lawyer, documents = [], messages = [] } = detail ?? {};
  if (!c) return null;

  const ai = c.ai_analysis ?? {};
  const days = daysUntil(c.deadline_at);

  return {
    id:        c.id,
    title:     c.title,
    category:  CATEGORY_LABELS[c.category] ?? c.category,
    status:    c.status,
    priority:  c.priority,
    openedAt:  c.opened_at ?? c.created_at,
    deadlineDays:  days,
    deadlineLabel: days != null
      ? `${days} dni do terminu${ai?.summary?.short ? ` — ${ai.summary.short}` : ''}`
      : null,

    lawyer: lawyer ? {
      id:       lawyer.id,
      name:     lawyer.full_name,
      initials: initialsOf(lawyer.full_name),
      status:   'Aktywna · odpowiada w 1 godz.',
      avatarUrl: lawyer.avatar_url ?? null,
      slug:     lawyer.tpp_slug ?? null,
    } : null,

    aiAnalysis: {
      summary: ai.summary?.short
        ?? ai.summary
        ?? 'Analiza AI w trakcie — wrócimy do Ciebie wkrótce.',
      urgency: c.priority === 'urgent' ? 'urgent'
             : c.priority === 'high'   ? 'high'
             : 'normal',
      timeline: buildTimeline(c, ai),
      steps: (ai.actionPlan ?? []).map((step, i) => ({
        order: step.step ?? i + 1,
        title: step.title,
        urgency: mapUrgency(step.urgency),
        deadlineLabel: step.deadlineLabel ?? null,
        body: step.detail ?? step.body ?? '',
      })),
    },

    documents: documents.map(d => ({
      id: d.id,
      name: d.name ?? 'Dokument',
      source: d.source ?? 'user',
      size: humanBytes(d.size_bytes),
      date: formatRelDate(d.created_at),
    })),

    messages: messages.map(m => ({
      id: m.id,
      sender: m.sender_role,  // 'client' | 'lawyer'
      content: m.content,
      createdAt: m.created_at,
      readAt: m.read_at,
    })),

    nextBooking: null, // filled in once tpp_bookings is wired
  };
}

function buildTimeline(c, ai) {
  const hasLawyer = Boolean(c.lawyer_id);
  const closed    = c.status === 'closed';

  return [
    { label: 'Analiza AI', done: Boolean(ai?.summary), active: false },
    { label: 'Plan',       done: Boolean(ai?.actionPlan?.length), active: !hasLawyer },
    { label: 'Prawnik',    done: hasLawyer && !closed, active: hasLawyer && !closed },
    { label: 'Rozwiązanie',done: closed, active: false },
  ];
}

function mapUrgency(u) {
  if (u === 'critical') return 'critical';
  if (u === 'high')     return 'high';
  return 'normal';
}

// ─── Mock portal data ───────────────────────────────────────────────

export function buildMockPortalCase() {
  return {
    id: 'mock-case',
    title: 'Bezprawne zwolnienie z pracy',
    category: 'Prawo pracy',
    status: 'active',
    priority: 'urgent',
    deadlineDays: 18,
    deadlineLabel: '18 dni do złożenia odwołania do sądu pracy',
    openedAt: '2026-04-01',
    lawyer: {
      id: 'mock-ak',
      name: 'mec. Anna Kowalska',
      initials: 'AK',
      status: 'Aktywna · odpowiada w 1 godz.',
      avatarUrl: null,
      slug: 'anna-kowalska',
    },
    aiAnalysis: {
      summary: 'Twoja sprawa dotyczy prawa pracy. Zwolnienie bez pisemnego uzasadnienia po ponad 3 miesiącach pracy narusza przepisy Kodeksu pracy.',
      urgency: 'urgent',
      timeline: [
        { label: 'Analiza AI', done: true,  active: false },
        { label: 'Plan',       done: true,  active: false },
        { label: 'Prawnik',    done: false, active: true  },
        { label: 'Rozwiązanie',done: false, active: false },
      ],
      steps: [
        { order: 1, title: 'Złóż odwołanie do sądu pracy', urgency: 'critical', deadlineLabel: '21 dni od daty zwolnienia', body: 'Termin 21 dni jest prekluzyjny — po jego upływie tracisz prawo do odwołania.' },
        { order: 2, title: 'Zażądaj pisemnego uzasadnienia', urgency: 'high', deadlineLabel: null, body: 'Pracodawca ma obowiązek dostarczyć uzasadnienie na Twój wniosek.' },
        { order: 3, title: 'Zbierz dokumenty', urgency: 'normal', deadlineLabel: null, body: 'Umowa o pracę, paski wynagrodzeń, korespondencja.' },
      ],
    },
    documents: [
      { id: 'd1', name: 'Wzór odwołania do sądu pracy.docx', source: 'ai_generated', size: '28 KB', date: 'Wczoraj' },
      { id: 'd2', name: 'Umowa o pracę.pdf',                  source: 'user',         size: '156 KB', date: '1 kwi' },
      { id: 'd3', name: 'Pismo wypowiedzenia.pdf',            source: 'user',         size: '89 KB',  date: '1 kwi' },
    ],
    messages: [],
    nextBooking: {
      date: '2 kwi 2026',
      time: '09:00',
      type: 'online',
      meetUrl: '#',
    },
  };
}

export function buildMockPortalUser(user, profile) {
  if (profile || user) {
    const name = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Klient';
    return {
      id:       user?.id ?? 'anon',
      name,
      initials: initialsOf(name),
      email:    profile?.email ?? user?.email ?? '',
      plan:     'Free',
    };
  }
  return {
    id:       'mock-mw',
    name:     'Marta Wiśniewska',
    initials: 'MW',
    email:    'marta@example.com',
    plan:     'Free',
  };
}
