# TPP — Execution-Ready UX & Logic Specification
**Status:** Build-ready MVP spec
**Last updated:** 2026-04-01
**Implements:** guided-flow.html prototype

---

## PART 1 — STEP-BY-STEP FLOW

Each screen: name · user input · system processing · AI input · AI output · what user sees

---

### SCREEN 1 — Landing

| Property | Detail |
|----------|--------|
| **User input** | Click CTA only |
| **System processing** | Initialize `Case` object with empty state |
| **AI input** | None |
| **AI output** | None |
| **User sees** | Headline, 3 trust pills, "how it works" explainer, single CTA |

---

### SCREEN 2 — Problem Input

| Property | Detail |
|----------|--------|
| **User input** | Free text — min 15 chars, max 600 chars |
| **System processing** | Store `case.userText`. CTA enabled at 15 chars. |
| **AI input** | None — collected for later |
| **AI output** | None |
| **User sees** | Single textarea, char counter, AI reassurance card, disabled CTA until threshold met |

**Edge cases:**
- User pastes 600+ chars → truncate silently, show char count
- User submits 1–14 chars → keep CTA disabled, no error message
- User hits back → restore text from `case.userText`

---

### SCREEN 3 — Clarify: Category

| Property | Detail |
|----------|--------|
| **User input** | Single choice from 6 options |
| **System processing** | Store `case.category`. Auto-advance after 330ms. |
| **AI input** | None |
| **AI output** | None |
| **User sees** | 6 choice buttons with emoji + plain-language label + sublabel |

**Categories:**
```
praca | rodzina | umowa | mieszkanie | sad | inne
```

**Edge case:** "inne" → proceeds normally, AI handles classification from `userText`

---

### SCREEN 4 — Clarify: Official Document

| Property | Detail |
|----------|--------|
| **User input** | Single choice: tak / nie / nie_wiem |
| **System processing** | Store `case.hasPismo`. Auto-advance. |
| **AI input** | None |
| **AI output** | None |
| **User sees** | 3 choice buttons, AI context card about why this matters |

---

### SCREEN 5 — Clarify: Deadline

| Property | Detail |
|----------|--------|
| **User input** | Single choice: pilne / ok / nie — OR skip |
| **System processing** | Store `case.deadline`. Advance to Screen 6. **Trigger AI pipeline here.** |
| **AI input** | Full `case` object (userText + category + hasPismo + deadline) |
| **AI output** | Full `AIOutput` object (async, shown on Screen 7) |
| **User sees** | 3 choices + skip link |

> **Note:** AI call is fired here in the background while user sees Screen 6. Screen 7 waits for resolution.

---

### SCREEN 6 — Calm Moment (AI processing happens here)

| Property | Detail |
|----------|--------|
| **User input** | Single CTA click |
| **System processing** | Await AI pipeline response. Show spinner if >2s. |
| **AI input** | (already fired in Screen 5) |
| **AI output** | (resolving in background) |
| **User sees** | Reassurance message, safe banner, CTA "Pokaż mi co się dzieje →" |

**States:**
- AI resolved before user clicks → Screen 7 renders instantly
- AI still pending when user clicks → show loading state on CTA button
- AI error → show fallback (see Edge Cases section)

---

### SCREEN 7 — Situation Explanation

| Property | Detail |
|----------|--------|
| **User input** | Read only. Optional: click "Popraw opis" |
| **System processing** | Render `aiOutput.summary` and `aiOutput.extraction.facts` |
| **AI input** | (already computed) |
| **AI output** | `summary.situationType`, `summary.plainExplanation`, `extraction.keyFacts[]` |
| **User sees** | Safe banner · Fact list (from extraction) · AI explanation card · Correction link · CTA |

---

### SCREEN 8 — Action Plan

| Property | Detail |
|----------|--------|
| **User input** | Choose one of 3 paths: documents / lawyer / save |
| **System processing** | Render `aiOutput.actionPlan.steps[]` sorted by urgency |
| **AI input** | (already computed) |
| **AI output** | `actionPlan.steps[]` with title, body, urgency, deadline |
| **User sees** | Numbered step cards with urgency tags · 3 CTA buttons |

---

### SCREEN 9 — Documents (optional path)

| Property | Detail |
|----------|--------|
| **User input** | Click document type to generate |
| **System processing** | Fire document generation API call with `case` object |
| **AI input** | `case` object + selected `documentType` |
| **AI output** | `{ documentType, content: string, filename: string }` |
| **User sees** | 3 doc option tiles → click triggers generation → download/preview |

---

### SCREEN 10 — Lawyer Gate

| Property | Detail |
|----------|--------|
| **User input** | Choose: find lawyer OR stay with plan |
| **System processing** | None — routing only |
| **AI input** | None |
| **AI output** | None |
| **User sees** | Soft sell: free call offer, 4 trust features, two equal-weight CTAs |

---

### SCREEN 11 — Matching

| Property | Detail |
|----------|--------|
| **User input** | Click "Umów rozmowę" on chosen lawyer |
| **System processing** | Query lawyer DB: `WHERE specialization = case.category AND active = true ORDER BY match_score DESC LIMIT 3` |
| **AI input** | None (matching is rule-based in MVP) |
| **AI output** | None |
| **User sees** | 2–3 lawyer cards with: name, spec, rating, match reason, pricing, CTA |

---

### SCREEN 12 — Account

| Property | Detail |
|----------|--------|
| **User input** | Email (required) + name (optional) |
| **System processing** | Create user record. Persist `Case` to DB. Send confirmation email. |
| **AI input** | None |
| **AI output** | None |
| **User sees** | 4 value props, email + name fields, CTA, existing login link |

---

## PART 2 — DATA STRUCTURE

### 2.1 User Input Collection

```typescript
interface CaseInput {
  userText:   string;                                      // Screen 2, min 15 chars
  category:   'praca'|'rodzina'|'umowa'|'mieszkanie'|'sad'|'inne'; // Screen 3
  hasPismo:   'tak'|'nie'|'nie_wiem'|null;               // Screen 4
  deadline:   'pilne'|'ok'|'nie'|null;                   // Screen 5 (nullable = skipped)
}
```

### 2.2 Internal Case Object

```typescript
interface Case {
  // Identity
  id:          string;          // uuid, generated on Screen 1
  createdAt:   Date;
  userId:      string | null;   // null until Screen 12

  // User input
  input:       CaseInput;

  // AI output
  ai:          AIOutput | null; // null until pipeline completes

  // Flow state
  flowState:   FlowState;       // see Part 4
  currentScreen: ScreenId;
  history:     ScreenId[];
}
```

### 2.3 What Is Passed to AI

Single API call after Screen 5 completes. Payload:

```typescript
interface AIRequest {
  userText:   string;       // raw user description
  category:   string;       // user-selected category (may be 'inne')
  hasPismo:   string | null;
  deadline:   string | null;
  language:   'pl';         // always Polish
}
```

### 2.4 What AI Returns (Structured)

```typescript
interface AIOutput {
  classification: Classification;
  extraction:     Extraction;
  summary:        Summary;
  actionPlan:     ActionPlan;
}

interface Classification {
  legalArea:      string;   // refined category (e.g. 'prawo_pracy')
  caseType:       string;   // specific type (e.g. 'nieuzasadnione_wypowiedzenie')
  urgencyLevel:   'critical'|'high'|'medium'|'low';
  confidence:     number;   // 0.0–1.0
}

interface Extraction {
  keyFacts: {
    label:  string;    // e.g. "Typ umowy"
    value:  string;    // e.g. "Na czas nieokreślony"
  }[];                 // max 5 facts
  deadlines: {
    description: string;   // e.g. "Odwołanie do sądu pracy"
    days:        number;   // e.g. 21
    fromEvent:   string;   // e.g. "daty zwolnienia"
  }[];
  missingInfo: string[];   // questions AI would ask if it could
}

interface Summary {
  safeToAct:        boolean;        // drives safe-banner visibility
  situationType:    string;         // short label, e.g. "Nieuzasadnione wypowiedzenie"
  plainExplanation: string;         // 2–3 sentences, plain Polish, no jargon
  riskLevel:        'low'|'medium'|'high';
}

interface ActionPlan {
  steps: ActionStep[];  // max 5, sorted by urgency desc
}

interface ActionStep {
  order:       number;
  title:       string;              // imperative verb, max 60 chars
  body:        string;              // plain explanation, max 120 chars
  urgency:     'critical'|'high'|'normal';
  deadlineDays: number | null;      // null if no hard deadline
  deadlineLabel: string | null;     // e.g. "21 dni od zwolnienia"
  canDoAlone:  boolean;             // false = lawyer recommended
}
```

---

## PART 3 — AI PIPELINE

Single Claude API call, single structured response. Four logical stages within one prompt.

---

### Stage 1 — Classification

**Input:**
```
userText, category (user-selected), hasPismo, deadline
```

**Task:** Determine the precise legal area and case type. Override user's category if text suggests otherwise.

**Output:**
```typescript
classification: {
  legalArea:    string,   // 'prawo_pracy' | 'prawo_rodzinne' | 'prawo_cywilne' | 'postepowanie_sadowe' | 'najem' | 'inne'
  caseType:     string,   // specific: 'wypowiedzenie' | 'rozwod' | 'nakaz_zaplaty' | etc.
  urgencyLevel: 'critical'|'high'|'medium'|'low',
  confidence:   number
}
```

**Rules:**
- If `userText` contradicts `category` → use `userText`
- If `category === 'inne'` → classify from `userText` only
- If confidence < 0.5 → set `caseType = 'unclear'`, flag for fallback

---

### Stage 2 — Extraction

**Input:**
```
userText + classification output
```

**Task:** Pull structured facts from the user's free text.

**Output:**
```typescript
extraction: {
  keyFacts:    [{ label, value }],    // max 5 facts shown on Screen 7
  deadlines:   [{ description, days, fromEvent }],
  missingInfo: string[]               // logged, not shown to user
}
```

**Rules:**
- Extract only what user stated — do not infer or hallucinate
- If a fact is uncertain, omit it (don't guess)
- `keyFacts` must be displayable as "Label: Value" pairs
- `missingInfo` is used internally (future: follow-up questions)

---

### Stage 3 — Summarization

**Input:**
```
userText + classification + extraction
```

**Task:** Write a plain-Polish explanation of what is happening and what it means for the user.

**Output:**
```typescript
summary: {
  safeToAct:        boolean,
  situationType:    string,     // max 40 chars, shown as badge
  plainExplanation: string,     // 2–3 sentences ONLY, no jargon
  riskLevel:        'low'|'medium'|'high'
}
```

**Style rules (enforced in system prompt):**
- No legal citations (no "Art. 30 §4 KP")
- No Latin
- No hedge phrases ("może być tak lub nie")
- End with a forward-looking sentence
- Max 3 sentences in `plainExplanation`

---

### Stage 4 — Action Plan Generation

**Input:**
```
classification + extraction + summary + deadline (user answer)
```

**Task:** Generate 3–5 concrete, prioritized action steps.

**Output:**
```typescript
actionPlan: {
  steps: [
    {
      order:         1,
      title:         "Sprawdź termin na odwołanie do sądu pracy",
      body:          "Masz 21 dni od daty zwolnienia. Działaj teraz.",
      urgency:       "critical",
      deadlineDays:  21,
      deadlineLabel: "21 dni od daty zwolnienia",
      canDoAlone:    false
    },
    ...
  ]
}
```

**Rules:**
- Steps sorted by urgency: critical → high → normal
- `title` starts with an imperative verb (Sprawdź / Zażądaj / Zbierz / Oceń)
- `body` max 2 sentences
- `deadlineDays` — only if a real legal deadline exists (don't invent)
- `canDoAlone: false` → triggers "consider a lawyer" note on that step

---

### AI Prompt Structure

```
SYSTEM PROMPT:
  You are a legal guidance assistant for Polish law.
  You help stressed, non-expert users understand their legal situation.
  Always respond in Polish.
  Return ONLY valid JSON matching the AIOutput schema.
  Never invent facts. Only extract what the user stated.
  Never use legal jargon, Latin, or article citations in user-facing fields.
  [+ full JSON schema appended]

USER MESSAGE:
  Opis sytuacji: {userText}
  Kategoria wybrana przez użytkownika: {category}
  Czy jest oficjalne pismo: {hasPismo}
  Czy termin już biegnie: {deadline}
```

**Model:** `claude-sonnet-4-6`
**Response format:** `{ type: "json_object" }`
**Max tokens:** 1200
**Temperature:** 0 (deterministic output for legal context)

---

## PART 4 — STATES

### 4.1 User Emotional States

| Screen | Emotional state | Design response |
|--------|----------------|-----------------|
| 1 — Landing | Anxious, scanning for safety signals | Trust pills, no price, single CTA |
| 2 — Problem input | Vulnerable, unsure what to say | "Describe it like talking to a friend" |
| 3–5 — Clarify | Slightly relieved (progress visible) | Auto-advance, short questions, skip always available |
| 6 — Calm moment | Peak anxiety point before "verdict" | Full reassurance screen, safe banner, no data |
| 7 — Situation | **Make or break.** Relief OR collapse | Correction always visible, no jargon, forward-looking ending |
| 8 — Action plan | Catharsis — "I know what to do" | Concrete verbs, deadlines visible, 3 equal paths |
| 9 — Documents | Empowered, taking action | Instant value, progress feedback during generation |
| 10 — Lawyer gate | Informed, less afraid | Soft framing, non-paid exit equally prominent |
| 11 — Matching | Evaluating, price-conscious | Transparent pricing, specific match reason, no pressure |
| 12 — Account | Low friction needed | Value props first, email only required field |

---

### 4.2 System States

```typescript
type SystemState =
  | 'idle'            // waiting for user input
  | 'collecting'      // screens 2–5
  | 'ai_pending'      // AI call fired, awaiting response (screens 5→6)
  | 'ai_complete'     // AIOutput available
  | 'ai_error'        // pipeline failed
  | 'doc_generating'  // document generation in progress
  | 'complete';       // account created, case persisted
```

**State transitions:**
```
idle
  → collecting         (user clicks CTA on Screen 1)
  → ai_pending         (user advances from Screen 5)
  → ai_complete        (API response received)
  → ai_error           (API timeout or error)
  → doc_generating     (user requests document on Screen 9)
  → complete           (account saved on Screen 12)
```

---

### 4.3 Edge Cases

| Scenario | Handling |
|----------|---------|
| AI call fails (timeout/error) | Show fallback generic plan per `category`. Log error. Do NOT block user. |
| AI confidence < 0.5 | Show generic summary + flag "Nasz system ma ograniczone informacje o tej sprawie" |
| User skips all clarify questions | AI still runs with `userText` only — classification from free text |
| userText too vague to classify | `caseType = 'unclear'` → generic action plan + recommend lawyer |
| User returns to Screen 2 (correction) | Clear `case.ai`, re-run pipeline after Screen 5 |
| User hits back during AI pending | Cancel in-flight request, allow re-trigger when advancing again |
| `hasPismo = 'tak'` + `deadline = 'pilne'` | Force `urgencyLevel = 'critical'`, highlight deadline prominently |
| No lawyers in DB matching category | Show 1 generic lawyer + "Skontaktuj się z nami" fallback |
| Account email already exists | Offer login flow, merge case into existing account |
| User exits mid-flow | Persist `case` to localStorage. Show "Kontynuuj gdzie skończyłeś" on next visit. |

---

## PART 5 — MVP SCOPE

### In MVP
- ✅ Full guided flow (12 screens)
- ✅ Single Claude API call (all 4 pipeline stages in one prompt)
- ✅ Structured JSON response rendered into screens 7 + 8
- ✅ 2 hardcoded lawyer profiles per category (no matching DB yet)
- ✅ Email capture → Resend/Mailgun confirmation
- ✅ Case persisted to Supabase on account creation
- ✅ localStorage fallback for in-progress sessions

### Not in MVP (Phase 2)
- ❌ Real-time lawyer matching DB query
- ❌ Document generation (AI → PDF)
- ❌ Category-specific clarify question trees
- ❌ Lawyer-side dashboard integration
- ❌ Multi-turn conversation / follow-up questions

---

## PART 6 — TECHNICAL IMPLEMENTATION NOTES

### API Call (single endpoint)

```
POST /api/analyze
Body: AIRequest
Returns: AIOutput
Auth: none (anonymous, rate-limited by IP)
Timeout: 10s (show loading state if >2s)
Retry: 1 automatic retry on timeout, then fallback
```

### Frontend State (localStorage + in-memory)

```typescript
// In-memory during session
const state = {
  screen:        ScreenId,
  history:       ScreenId[],
  case:          Case,
  flowState:     SystemState,
  aiPending:     Promise<AIOutput> | null,
}

// Persisted to localStorage on every screen advance
localStorage.setItem('tpp_case', JSON.stringify(state.case))
```

### Supabase Schema (minimal)

```sql
-- Users
users (id uuid, email text, name text, created_at timestamptz)

-- Cases
cases (
  id           uuid primary key,
  user_id      uuid references users,
  input        jsonb,   -- CaseInput
  ai_output    jsonb,   -- AIOutput
  created_at   timestamptz,
  updated_at   timestamptz
)
```

### Environment Variables

```
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
RESEND_API_KEY=
```

---

## QUICK REFERENCE — Build Checklist

```
[ ] Screen 1–5: static (done in guided-flow.html)
[ ] Fire AI call on Screen 5 advance
[ ] Screen 6: show loading state while AI pending
[ ] Screen 7: render extraction.keyFacts + summary.plainExplanation
[ ] Screen 8: render actionPlan.steps[] with urgency tags + deadlines
[ ] Screen 9: document generation endpoint (Phase 2 — skip in MVP)
[ ] Screen 11: hardcode 2 lawyers per category (no DB in MVP)
[ ] Screen 12: POST /api/account → create user + persist case
[ ] localStorage: save case on every screen transition
[ ] Error boundary: fallback plan if AI fails
[ ] Rate limiting: max 10 requests/IP/hour
```
