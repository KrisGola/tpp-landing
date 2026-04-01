/**
 * TPP AI Pipeline
 * Single Claude API call → fully structured AIOutput
 *
 * Pipeline stages (in one prompt):
 *   1. classification  — legal area + case type + urgency
 *   2. extraction      — key facts from user text + deadlines
 *   3. summarization   — plain Polish explanation, no jargon
 *   4. action plan     — ordered, urgent steps
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Jesteś asystentem prawnym dla użytkowników w Polsce.
Pomagasz osobom w stresujących sytuacjach prawnych — wyjaśniasz co się dzieje i co mogą zrobić.

ZASADY KRYTYCZNE:
- Odpowiadaj WYŁĄCZNIE poprawnym JSON zgodnym ze schematem poniżej. Żadnego dodatkowego tekstu.
- Nigdy nie używaj żargonu prawnego, numerów artykułów (Art. X §Y), terminologii łacińskiej ani orzeczeń sądowych w polach widocznych dla użytkownika.
- Nigdy nie wymyślaj faktów. Wyciągaj tylko to, co użytkownik wyraźnie napisał.
- Jeśli nie jesteś pewien danego faktu — pomiń go w keyFacts.
- Pisz jak do zestresowanego przyjaciela — jasno, spokojnie, do przodu.
- Ostatnie zdanie plainExplanation ZAWSZE jest zdaniem napędzającym do działania.
- Wszystkie pola tekstowe w języku polskim.
- Pole confidence: 1.0 = pełna pewność klasyfikacji, 0.0 = brak danych.

SCHEMAT WYJŚCIA (ścisły JSON, bez markdown):
{
  "classification": {
    "legalArea": "prawo_pracy | prawo_rodzinne | prawo_cywilne | postepowanie_sadowe | prawo_nieruchomosci | inne",
    "caseType": "string max 40 znaków — konkretny typ sprawy",
    "urgencyLevel": "critical | high | medium | low",
    "confidence": "liczba 0.0–1.0"
  },
  "extraction": {
    "keyFacts": [
      { "label": "string max 25 znaków", "value": "string max 60 znaków" }
    ],
    "deadlines": [
      { "description": "string", "days": "liczba całkowita", "fromEvent": "string" }
    ],
    "missingInfo": ["string — czego brakuje do pełnej oceny"]
  },
  "summary": {
    "safeToAct": "boolean — czy użytkownik ma opcje działania",
    "situationType": "string max 40 znaków — krótka etykieta np. Nieuzasadnione wypowiedzenie",
    "plainExplanation": "string — 2–3 zdania prostą polszczyzną, bez żargonu",
    "riskLevel": "low | medium | high"
  },
  "actionPlan": {
    "steps": [
      {
        "order": "liczba całkowita od 1",
        "title": "string max 60 znaków — zaczynam od czasownika np. Sprawdź, Zażądaj, Zbierz",
        "body": "string max 120 znaków — krótkie wyjaśnienie co i dlaczego",
        "urgency": "critical | high | normal",
        "deadlineDays": "liczba całkowita lub null",
        "deadlineLabel": "string np. 21 dni od daty zwolnienia lub null",
        "canDoAlone": "boolean — false oznacza że potrzebny prawnik"
      }
    ]
  }
}

LIMITY:
- keyFacts: max 5 pozycji, sortuj od najważniejszej
- actionPlan.steps: max 5 pozycji, sortuj: critical → high → normal
- deadlines: tylko rzeczywiste terminy prawne wynikające z opisu, nie wymyślaj`;

// ─────────────────────────────────────────────────────────
// RATE LIMITER (in-memory, per IP, MVP only)
// ─────────────────────────────────────────────────────────

const rateLimitMap = new Map(); // ip → { count, resetAt }
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '10', 10);
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true; // allowed
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false; // blocked
  }

  record.count++;
  return true; // allowed
}

// ─────────────────────────────────────────────────────────
// VALIDATE OUTPUT
// ─────────────────────────────────────────────────────────

function validateOutput(output) {
  const required = ['classification', 'extraction', 'summary', 'actionPlan'];
  for (const key of required) {
    if (!output[key]) throw new Error(`Missing required key: ${key}`);
  }
  if (!Array.isArray(output.actionPlan?.steps)) {
    throw new Error('actionPlan.steps must be an array');
  }
  if (!Array.isArray(output.extraction?.keyFacts)) {
    throw new Error('extraction.keyFacts must be an array');
  }
  if (typeof output.summary?.plainExplanation !== 'string') {
    throw new Error('summary.plainExplanation must be a string');
  }
  // Enforce limits
  output.extraction.keyFacts = output.extraction.keyFacts.slice(0, 5);
  output.actionPlan.steps = output.actionPlan.steps.slice(0, 5);
}

// ─────────────────────────────────────────────────────────
// MAIN PIPELINE
// ─────────────────────────────────────────────────────────

/**
 * @param {object} input
 * @param {string} input.userText       - Free text description from user
 * @param {string} input.category       - User-selected category
 * @param {string|null} input.hasPismo  - 'tak' | 'nie' | 'nie_wiem' | null
 * @param {string|null} input.deadline  - 'pilne' | 'ok' | 'nie' | null
 * @returns {Promise<AIOutput>}
 */
export async function analyzeCaseWithAI({ userText, category, hasPismo, deadline }) {
  const userMessage = [
    `Opis sytuacji: ${userText}`,
    `Kategoria wybrana przez użytkownika: ${category ?? 'nie podano'}`,
    `Czy jest oficjalne pismo lub dokument: ${hasPismo ?? 'nie podano'}`,
    `Czy termin już biegnie: ${deadline ?? 'nie podano'}`,
    '',
    'Przeanalizuj tę sytuację i zwróć odpowiedź jako JSON zgodny ze schematem.',
  ].join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1200,
    temperature: 0,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const rawText = response.content[0]?.text?.trim() ?? '';

  // Extract JSON (model may sometimes wrap in markdown fences)
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON object found in AI response. Raw: ${rawText.slice(0, 200)}`);
  }

  const parsed = JSON.parse(jsonMatch[0]);
  validateOutput(parsed);

  return parsed;
}
