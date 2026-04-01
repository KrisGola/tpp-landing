# TPP — Guided Flow: Screen Specification
**File:** `guided-flow.html`
**Last updated:** 2026-04-01
**Status:** Interactive prototype — demo flow (work dismissal / prawo pracy)

---

## Architecture

### Pattern: State Machine Wizard
- Single HTML file, vanilla JS
- `state.screen` drives all rendering
- `SCREENS{}` — pure render functions per screen (return HTML string)
- `POST{}` — post-render hooks (restore text, focus)
- `state.history[]` — stack for back navigation
- `state.answers{}` — accumulated answers across steps
- `goTo(screenId)` / `back()` — the only navigation primitives
- No chat UI. No free-form AI responses in the main flow.

### Flow order (linear with optional branches)
```
landing → problem → clarify-1 → clarify-2 → clarify-3
       → calm → situation → plan
       ↓               ↓
   documents      lawyer-gate → matching → account
```

---

## Screen-by-screen Specification

---

### Screen 1 — Landing (`landing`)
**Goal:** User feels safe. Decides to start.

| Element | Content |
|---------|---------|
| Headline | "Masz problem prawny? Spokojnie — pokażemy Ci, co zrobić krok po kroku." |
| Sub | "Opisz swoją sytuację, a otrzymasz jasne wskazówki i możliwe rozwiązania" |
| Trust pills | Bezpłatne · Bez rejestracji · Prywatne i szyfrowane |
| How it works card | 4-row explainer (opis → analiza → plan → prawnik) |
| CTA | "Opisz swoją sytuację →" |
| Footer | Privacy note — no price visible |

**UX rules:**
- No pricing. No lawyer CTA. No registration gate.
- Calm visual — no aggressive color, no legal imagery.
- Single CTA only.

**Progress:** 0%

---

### Screen 2 — Opis problemu (`problem`)
**Goal:** User describes their situation in free text.

| Element | Content |
|---------|---------|
| AI card | "Wszystko co napiszesz jest prywatne..." |
| Textarea | Placeholder: "Opisz swoją sytuację (np. dostałem pismo z sądu...)" |
| CTA | "Przejdź dalej →" (disabled until ≥15 chars) |
| Char counter | Live counter, max 600 |

**UX rules:**
- CTA disabled until meaningful input (15+ chars)
- No required fields other than this one
- Text preserved if user navigates back

**Progress:** 12%
**Step badge:** "Krok 1 z 5"

---

### Screen 3 — Doprecyzowanie 1: Kategoria (`clarify-1`)
**Goal:** Classify the legal area.

**Question:** "Czego dotyczy Twoja sprawa?"

**Options (auto-advance on select):**
- 💼 Praca / zatrudnienie
- 👨‍👩‍👧 Rodzina / sprawy osobiste
- 📄 Umowa / zakup / sprzedaż
- 🏠 Mieszkanie / nieruchomości
- ⚖️ Pismo sądowe / urzędowe
- ❓ Nie wiem / coś innego

**UX rules:**
- One question, full screen
- Auto-advance 330ms after selection (no explicit "next" button)
- No "required" blocking — every option leads forward

**Progress:** 26%
**Step badge:** "Krok 2 z 5"

---

### Screen 4 — Doprecyzowanie 2: Pismo (`clarify-2`)
**Goal:** Detect if a formal document exists (= deadline risk).

**Question:** "Czy otrzymałeś/-aś oficjalne pismo?"

**Options:**
- 📬 Tak, mam pismo
- 🙅 Nie, nie mam żadnego pisma
- 🤔 Nie jestem pewny/-a

**Progress:** 40%
**Step badge:** "Krok 3 z 5"

---

### Screen 5 — Doprecyzowanie 3: Termin (`clarify-3`)
**Goal:** Detect urgency / running deadline.

**Question:** "Czy jakiś termin już biegnie?"

**Options:**
- 🔴 Tak — mam mniej niż 2 tygodnie (pilne)
- 🟡 Tak — mam jeszcze trochę czasu
- 🟢 Nie wiem / raczej nie

**Skip link:** Always visible ("Pomiń to pytanie")

**Progress:** 54%
**Step badge:** "Krok 4 z 5"

---

### Screen 6 — Uspokojenie / AI Moment (`calm`)
**Goal:** Reduce stress before delivering the analysis. This is the emotional pivot point.

**AI message:**
> "Rozumiem, że ta sytuacja może być stresująca.
> W wielu podobnych przypadkach masz jeszcze czas na reakcję i kilka możliwych rozwiązań.
> Pokażę Ci teraz, co dokładnie oznacza Twoja sytuacja i jakie masz opcje."

**Safe banner:** "Jesteś bezpieczny/-a. Masz czas i możliwości działania."

**CTA:** "Pokaż mi, co się dzieje →"

**Design notes:**
- Large emoji (🤝) as visual anchor
- No data, no facts — pure emotional reassurance
- White space dominant

**Progress:** 64%
**Step badge:** "Krok 5 z 5"

---

### Screen 7 — Co się dzieje (`situation`)
**Goal:** Explain the situation in plain language. No jargon.

**Sections:**
1. Safe banner (repeated — anchor)
2. "Oto co zrozumieliśmy" — bullet facts from user's input
3. "Co to oznacza dla Ciebie" — AI card with plain-language assessment

**Correction mechanism:** "✏️ Coś się nie zgadza? Popraw opis sytuacji" → back to screen 2

**CTA:** "Pokaż mi plan działania →"

**Design notes:**
- Bullet facts must be short (1 line each)
- AI assessment: max 2 short paragraphs
- NO legal citations, NO case law references
- Correction always visible and easy

**Progress:** 73%
**Step badge:** "Twoja sytuacja"

---

### Screen 8 — Plan działania (`plan`)
**Goal:** Deliver concrete, prioritized, time-aware action steps.

**Format:** Numbered step cards with urgency tags.

**Tags:**
- `⚠️ Pilne — termin X dni` (amber)
- `Ten tydzień` (blue)
- `Ważne` (green)

**Step cards (demo — work dismissal):**
1. Sprawdź termin na odwołanie do sądu pracy — ⚠️ Pilne 21 dni
2. Zażądaj pisemnego uzasadnienia — ⚠️ Pilne
3. Zbierz kluczowe dokumenty — Ten tydzień
4. Oceń możliwość odszkodowania — Ważne

**Bottom actions (3 buttons):**
- Primary: "Przygotuj pisma i dokumenty" → `documents`
- Secondary: "Połącz mnie z prawnikiem" → `lawyer-gate`
- Ghost: "Zapisz plan i wróć później" → `account`

**Design notes:**
- Steps use verbs ("Sprawdź", "Zażądaj", "Zbierz") — not nouns
- Deadlines always shown where applicable
- All 3 CTA paths are valid — no forcing toward paid

**Progress:** 83%
**Step badge:** "Plan działania"

---

### Screen 9 — Dokumenty (`documents`)
**Goal:** Help user take immediate action via generated documents.

**Options (doc tiles):**
- 📝 Żądanie pisemnego uzasadnienia zwolnienia
- ⚖️ Odwołanie do sądu pracy
- ✅ Lista dokumentów do zebrania

**Bottom escape:** "Wolę skonsultować z prawnikiem →" → `lawyer-gate`

**Production notes:**
- Each tile triggers AI document generation (Claude API)
- Output: pre-filled PDF or editable document
- User data from `state.answers` populates document fields

**Progress:** 88%
**Step badge:** "Dokumenty"

---

### Screen 10 — Czy potrzebujesz prawnika? (`lawyer-gate`)
**Goal:** Soft transition to monetization. User must feel this is for their benefit, not a sales pitch.

**AI message:**
> "Na tym etapie możesz działać samodzielnie używając planu, który przygotowaliśmy.
> Jeśli jednak chcesz mieć wsparcie eksperta — możemy połączyć Cię z prawnikiem..."

**Feature list:**
- Bezpłatna rozmowa wstępna (15 minut)
- Prawnik dobrany do Twojego przypadku
- Bez ukrytych opłat — cennik podany z góry
- Możliwość kontynuacji online lub stacjonarnie

**CTAs:**
- Primary: "Znajdź prawnika dla mojej sprawy →"
- Ghost: "Zostanę przy samodzielnym planie" → back to `plan`

**Design notes:**
- Non-paid exit always visible and styled equally to paid CTA
- No pressure language
- Price transparency shown before user commits

**Progress:** 92%

---

### Screen 11 — Matching (`matching`)
**Goal:** Show 2–3 matched lawyer profiles with transparent info.

**Each card shows:**
- Avatar, name, specialization, location
- Star rating + review count
- Match reason: "X spraw podobnych do Twojej"
- Pricing: first call free + ongoing rate
- CTA: "Umów bezpłatną rozmowę →"

**Bottom escape:** "Wróć do planu działania"

**Production notes:**
- Matching algorithm: `state.answers.category` + `state.answers.hasPismo` + `state.answers.deadline`
- Show lawyers with proven track record in user's specific case type
- Do NOT show all lawyers — curated 2–3 only

**Progress:** 96%
**Step badge:** "Dobór prawnika"

---

### Screen 12 — Konto (`account`)
**Goal:** Capture email to save user's case and build relationship.

**Trigger contexts:**
- Saving the action plan
- Before booking a lawyer consultation

**Fields:**
- Email (required, validated)
- Name (optional)

**Value props shown:**
- Plan zapisany bezpiecznie
- Powiadomienia o terminach
- Dostęp do dokumentów
- Historia sprawy

**CTA:** "Zapisz moją sprawę bezpłatnie"

**Design notes:**
- Registration framed as saving/protecting their case, not as product signup
- Login option visible for returning users

**Progress:** 100%
**Step badge:** "Twoje konto"

---

## UX Principles (enforced in prototype)

| Principle | Implementation |
|-----------|---------------|
| One question per screen | Each clarify screen has exactly 1 question |
| Auto-advance | Choice buttons advance after 330ms — no explicit "Next" |
| Always know where you are | Step badge + progress bar on every screen |
| Skip on every optional question | "Pomiń to pytanie" always visible on clarify-3 |
| Non-paid exit always visible | Ghost button on `lawyer-gate`, escape link on `matching` |
| Back navigation always works | Header back button, history stack |
| No jargon | All copy reviewed: no Latin, no legal terminology |
| Correction always possible | "Popraw opis sytuacji" link on `situation` screen |

---

## AI Message Style Guide

Used in: `ai-card` component (blue left-bordered card — NOT a chat bubble)

| Rule | Example |
|------|---------|
| Short paragraphs (max 3 lines) | ✅ |
| No legal citations | ❌ "Art. 30 §4 KP stanowi..." |
| No conditional hedging | ❌ "Może być tak lub może nie być..." |
| Reassuring forward motion | ✅ "Masz czas. Masz opcje." |
| Plain Polish | ✅ Conversational, not academic |

---

## Component Reference

| Component | CSS class | Usage |
|-----------|-----------|-------|
| AI info card | `.ai-card` | All AI messages — left blue border, light blue bg |
| Safe/calm banner | `.safe-banner` | Screens 6, 7 — green, with checkmark icon |
| Choice button | `.choice-btn` | Single-select questions — auto-advance |
| Action step card | `.action-card` | Screen 8 — numbered, with urgency tags |
| Urgency tag | `.tag .tag-urgent` `.tag-week` `.tag-ok` | Step urgency indicator |
| Lawyer card | `.lawyer-card` | Screens 11 — profile + booking CTA |
| Document option | `.doc-option` | Screen 9 — clickable doc tile |
| Info card | `.info-card` | White card with border for feature lists |
| Textarea | `.textarea` | Screen 2 — with char counter |
| Text input | `.text-input` | Screen 12 — email/name |

---

## State Object

```js
state = {
  screen:   'landing',    // current screen ID
  history:  [],           // navigation stack for back button
  answers: {
    category:  null,      // 'praca' | 'rodzina' | 'umowa' | 'mieszkanie' | 'sad' | 'inne'
    hasPismo:  null,       // 'tak' | 'nie' | 'nie_wiem'
    deadline:  null,       // 'pilne' | 'ok' | 'nie'
  },
  userText: '',            // free text from screen 2
}
```

---

## Production Roadmap

| Feature | Status | Notes |
|---------|--------|-------|
| Demo flow (work dismissal) | ✅ Done | `guided-flow.html` |
| Dynamic AI summary | 🔲 Next | Claude API call using `state.answers + state.userText` |
| Dynamic action plan | 🔲 Next | Generated per category + answers |
| Document generation | 🔲 Next | Claude API → PDF |
| Real lawyer matching | 🔲 Next | Database query by `category + location` |
| Account / persistence | 🔲 Next | Supabase or Firebase |
| Category-specific flows | 🔲 Later | Separate clarify questions per category |
