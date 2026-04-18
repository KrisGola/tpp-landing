/**
 * lib/mockData.js
 *
 * Deterministic mock fixtures for /api/* endpoints when Supabase is
 * not configured. Keeps the whole wizard → portal flow clickable in
 * a fresh preview deployment (no env vars needed) so the colleague
 * can review UI/UX before wiring the DB.
 *
 * Shape mirrors the Supabase rows exactly — if you change a column
 * in the migration, mirror it here.
 */

const MOCK_CASE_ID = '00000000-0000-4000-8000-000000000001';
const MOCK_LAWYER_ID = '00000000-0000-4000-8000-00000000000a';
const MOCK_CLIENT_ID = '00000000-0000-4000-8000-00000000000b';

const MOCK_LAWYER = {
  id: MOCK_LAWYER_ID,
  full_name: 'mec. Anna Kowalska',
  avatar_url: null,
  tpp_slug: 'anna-kowalska',
  tpp_city: 'Warszawa',
  tpp_specializations: ['Prawo pracy', 'Odwołanie od zwolnienia', 'Mobbing'],
  tpp_rating: 4.9,
  tpp_review_count: 63,
};

const MOCK_AI_ANALYSIS = {
  classification: {
    legalArea: 'prawo-pracy',
    urgencyLevel: 'high',
    confidence: 0.91,
  },
  summary: {
    short: 'Nieuzasadnione zwolnienie dyscyplinarne — 21 dni na odwołanie.',
    keyFacts: [
      { label: 'Rodzaj zwolnienia', value: 'Dyscyplinarne (art. 52 KP)' },
      { label: 'Termin odwołania',  value: '21 dni od doręczenia' },
      { label: 'Staż pracy',         value: '4 lata' },
    ],
  },
  actionPlan: [
    { step: 1, urgency: 'critical', title: 'Odwołanie do sądu pracy',     detail: 'Przygotować i wnieść pozew w ciągu 21 dni.' },
    { step: 2, urgency: 'high',     title: 'Zebranie dokumentacji',       detail: 'Umowa, korespondencja, świadkowie.' },
    { step: 3, urgency: 'medium',   title: 'Konsultacja z prawnikiem',    detail: 'Analiza szans, wybór strategii.' },
  ],
  timeline: [
    { at: '2026-03-18', label: 'Zdarzenie: zwolnienie dyscyplinarne', done: true },
    { at: '2026-03-20', label: 'Złożenie sprawy w TPP',              done: true },
    { at: '2026-04-08', label: 'Deadline: wniesienie pozwu',         done: false },
  ],
};

// ─── Cases ──────────────────────────────────────────────────────────

export function getMockCases() {
  return [
    {
      id: MOCK_CASE_ID,
      client_id: MOCK_CLIENT_ID,
      lawyer_id: MOCK_LAWYER_ID,
      title: 'Nieuzasadnione zwolnienie dyscyplinarne',
      category: 'prawo-pracy',
      status: 'active',
      priority: 'high',
      deadline_at: '2026-04-08T23:59:59Z',
      opened_at:  '2026-03-20T09:00:00Z',
      closed_at:  null,
      created_at: '2026-03-20T09:00:00Z',
      updated_at: '2026-04-01T14:30:00Z',
      ai_analysis: MOCK_AI_ANALYSIS,
    },
    {
      id: '00000000-0000-4000-8000-000000000002',
      client_id: MOCK_CLIENT_ID,
      lawyer_id: null,
      title: 'Umowa najmu — niejasne klauzule',
      category: 'prawo-nieruchomosci',
      status: 'closed',
      priority: 'low',
      deadline_at: null,
      opened_at: '2025-12-10T10:00:00Z',
      closed_at: '2026-01-05T17:00:00Z',
      created_at: '2025-12-10T10:00:00Z',
      updated_at: '2026-01-05T17:00:00Z',
      ai_analysis: null,
    },
  ];
}

export function getMockCase(id) {
  const c = getMockCases().find(x => x.id === id) ?? getMockCases()[0];
  return {
    case: c,
    lawyer: c.lawyer_id ? MOCK_LAWYER : null,
    documents: getMockDocuments(c.id),
    messages: getMockMessages(c.id),
    meta: { source: 'mock' },
  };
}

export function buildMockCase(payload) {
  const now = new Date().toISOString();
  return {
    id: `mock-${Date.now().toString(36)}`,
    client_id: MOCK_CLIENT_ID,
    lawyer_id: payload.lawyer_id ?? null,
    title: payload.title,
    category: payload.category,
    description: payload.description,
    ai_analysis: payload.aiAnalysis ?? null,
    priority: payload.priority ?? 'medium',
    status: payload.lawyer_id ? 'matched' : 'new',
    deadline_at: payload.deadline_at ?? null,
    opened_at: now,
    closed_at: null,
    created_at: now,
    updated_at: now,
  };
}

// ─── Documents ──────────────────────────────────────────────────────

export function getMockDocuments(caseId) {
  return [
    {
      id: 'mock-doc-1',
      case_id: caseId,
      document_id: null,
      name: 'Umowa o pracę.pdf',
      source: 'user',
      mime_type: 'application/pdf',
      size_bytes: 124_000,
      created_at: '2026-03-20T09:15:00Z',
    },
    {
      id: 'mock-doc-2',
      case_id: caseId,
      document_id: null,
      name: 'Pozew do sądu pracy - projekt.docx',
      source: 'ai_generated',
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size_bytes: 34_000,
      created_at: '2026-03-22T16:40:00Z',
    },
  ];
}

// ─── Messages ───────────────────────────────────────────────────────

export function getMockMessages(caseId) {
  return [
    {
      id: 'm1', case_id: caseId, sender_id: MOCK_LAWYER_ID,
      sender_role: 'lawyer', content: 'Dzień dobry, zapoznałam się z dokumentami. Szanse oceniam wysoko.',
      read_at: '2026-03-22T09:20:00Z', created_at: '2026-03-22T09:00:00Z',
    },
    {
      id: 'm2', case_id: caseId, sender_id: MOCK_CLIENT_ID,
      sender_role: 'client', content: 'Dziękuję. Co powinienem przygotować przed rozprawą?',
      read_at: '2026-03-22T10:15:00Z', created_at: '2026-03-22T10:10:00Z',
    },
    {
      id: 'm3', case_id: caseId, sender_id: MOCK_LAWYER_ID,
      sender_role: 'lawyer', content: 'Przygotuję listę. Wyślę dziś wieczorem.',
      read_at: null, created_at: '2026-03-22T11:00:00Z',
    },
  ];
}

// ─── Constants exposed for integration ─────────────────────────────
export const MOCK_IDS = {
  case:   MOCK_CASE_ID,
  lawyer: MOCK_LAWYER_ID,
  client: MOCK_CLIENT_ID,
};
