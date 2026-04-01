# TPP — Product Context
**For AI continuity across sessions. Read this at the start of any TPP-related conversation.**
**Last updated:** 2026-04-01

---

## What is TPP?

**twojapomocprawna.pl** — AI-powered legal guidance platform for Poland.

A two-sided marketplace connecting individual clients (B2C) with solo/small law firms.
Think: "Znany Lekarz for legal services in Poland."

**Stage:** Pre-seed / idea validation. PRD drafted. PARP incubator application in progress.

---

## The Core UX Product

### What we are building NOW
An interactive guided flow (decision support system) that:
1. **Calms** the user — they arrive stressed, confused, afraid
2. **Structures** their problem — via guided questions
3. **Explains** what's happening — plain Polish, no jargon
4. **Gives a plan** — concrete, prioritized action steps with deadlines
5. **Optionally connects** to a matched lawyer (monetization)

### What this is NOT
- NOT a chatbot
- NOT a free-form AI conversation
- NOT a lawyer directory with search
- NOT a complex dashboard

### The key design decision
**Guided flow (wizard/state machine) + AI responses** — not open-ended chat.
The system leads. The user follows. Trust is built step by step.

---

## Current Files

| File | Purpose |
|------|---------|
| `guided-flow.html` | Interactive prototype — 12-screen wizard, self-contained |
| `ux-flow-spec.md` | Full screen-by-screen specification |
| `ux-guided-flow.md` | Emotional architecture + trust map (earlier doc) |
| `market-research-poland-legaltech.md` | Competitive landscape |
| `Product Requirements Document (PRD).pdf` | Full PRD |
| `dashboard.html` | Lawyer-side SaaS dashboard prototype |
| `landing-v2.html` | Landing page (latest version) |

---

## The 12-Screen Flow

```
1. Landing          — "Jesteś bezpieczny, zacznij"
2. Problem input    — Free text (min 15 chars)
3. Clarify: Category — Praca / Rodzina / Umowa / Mieszkanie / Sąd / Inne
4. Clarify: Pismo   — Czy jest oficjalne pismo?
5. Clarify: Termin  — Czy termin biegnie?
6. Calm moment      — AI reassurance (emotional pivot)
7. Situation        — What is happening (plain language)
8. Action plan      — Numbered steps with urgency tags
9. Documents        — Generate letters/pisma (optional)
10. Lawyer gate     — Soft monetization transition
11. Matching        — 2–3 matched lawyer profiles
12. Account         — Email capture (save plan / book lawyer)
```

---

## UX Non-Negotiables

1. **No chat UI** — no chat bubbles, no free-form AI responses in the main flow
2. **One question per screen** — never show a form with multiple questions
3. **Auto-advance** — choice buttons advance automatically (330ms delay)
4. **Progress always visible** — top progress bar + step badge
5. **Non-paid exit always visible** — user is never trapped toward paid
6. **Skip on every optional question** — "Pomiń to pytanie" always available
7. **Correction always possible** — "Popraw opis sytuacji" back to step 2
8. **AI messages are cards, not bubbles** — blue left-border card component

---

## Three Emotional States (Design Framework)

| State | Screen | Visual treatment |
|-------|--------|-----------------|
| "Jesteś bezpieczny/-a" | Screen 6, 7 | Green safe-banner component |
| "Oto co się dzieje" | Screen 7 | Fact list + AI card (blue) |
| "Oto co zrobić" | Screen 8 | Numbered action cards with urgency tags |

---

## AI Message Style Rules

- **Short** — max 3 short paragraphs per card
- **Reassuring** — always end with forward motion
- **No jargon** — no legal Latin, no statute citations
- **No hedging** — not "it may or may not be the case that..."
- **Plain Polish** — conversational, not academic

---

## Component System (guided-flow.html)

| Component | Class | When |
|-----------|-------|------|
| AI info card | `.ai-card` | All AI messages |
| Safe banner | `.safe-banner` | Calm + situation screens |
| Choice button | `.choice-btn` | All single-select questions |
| Action step | `.action-card` | Plan screen |
| Urgency tag | `.tag-urgent / .tag-week / .tag-ok` | Action steps |
| Lawyer card | `.lawyer-card` | Matching screen |
| Doc option | `.doc-option` | Documents screen |

---

## State Machine (JS)

```js
state = {
  screen:   'landing',
  history:  [],           // back-nav stack
  answers: {
    category:  null,      // 'praca' | 'rodzina' | 'umowa' | 'mieszkanie' | 'sad' | 'inne'
    hasPismo:  null,      // 'tak' | 'nie' | 'nie_wiem'
    deadline:  null,      // 'pilne' | 'ok' | 'nie'
  },
  userText: '',
}
```

Navigation: `goTo(screenId)` / `back()` only.

---

## Business Model

| Tier | Price |
|------|-------|
| Starter | 149 PLN/mo |
| Pro | 499 PLN/mo |
| Business | 1,999 PLN/mo |
| Pay-per-lead | Optional add-on |

Client side: **free guidance** → paid lawyer connection.

**Year 1 target:** 100 paying lawyers, 598k PLN ARR
**Year 3 target:** 2,000 paying lawyers, 21.5M PLN ARR

---

## What's Next (Product Roadmap)

| Priority | Feature | Notes |
|----------|---------|-------|
| 1 | Dynamic AI summary (Claude API) | Replace hardcoded demo text with real AI output |
| 2 | Dynamic action plan | Generated from `category + answers + userText` |
| 3 | Document generation | Claude API → PDF download |
| 4 | Real lawyer matching | DB query by category + location |
| 5 | Account / persistence | Supabase or Firebase |
| 6 | Category-specific clarify flows | Separate question trees per legal area |

---

## Key Design Decision History

| Decision | Rationale |
|----------|-----------|
| Guided flow, not chatbot | Users are stressed — open chat causes anxiety, not relief |
| Auto-advance on choice select | Reduces friction, feels responsive, no "Next" button needed |
| Free value before monetization | Lawyer CTA only appears at screen 10+, after full plan delivered |
| AI card (not bubble) | Bubbles imply conversation; card implies structured information |
| Correction link on summary | Single factual error = total trust collapse — escape valve critical |
| Non-paid exit always visible | Users must feel helped, not sold to — trust > conversion |

---

## Personas

### Client (demand side)
- Individual or SME needing legal help
- First-time legal service seeker
- Price-sensitive, stressed, confused
- 33–50% of Poles need legal help annually

### Lawyer (supply side)
- Solo practitioner or small firm (1–5 lawyers)
- Tech-open, wants more clients
- 85–90% of Polish law firms are this size

---

## Market Context (Poland)

- Legal services market: 10–18 billion PLN/year
- <20% of law firms digitized
- Strongest comparable: HUGO.legal (Estonia) — same model, 60,000+ users, 92% satisfaction
- Key competitors: PrawnikzPolecenia.pl (directory only), LegalDesk, Legavi.pl
- No Polish player combines: AI assessment + matching + firm SaaS

---

## Founder

**Kris (Krzysztof Golaszewski)** — Founder / Product lead
- Building TPP as a LegalTech startup in Poland
- Pre-seed stage, PARP incubator application submitted
- Language preference: Polish for product/market, English for docs and AI tools
