# TPP — Guided UX Flow
## Emotional Architecture + Trust Map

> **Design principle:** The system is not a chatbot. It's a calm, structured companion that walks a frightened person through a legal problem — step by step — and only asks for money after it has already delivered real value.

---

## Meta: User Psychology at Entry

Before the first click, the user is already carrying:

| State | Manifestation |
|-------|---------------|
| **Anxiety** | "Something bad is happening to me" |
| **Cost fear** | "Lawyers are expensive, I'll be judged" |
| **Helplessness** | "I don't understand what this document means" |
| **Urgency** | "There might be a deadline I'm missing" |
| **Shame** | "I should have handled this earlier" |

The entire system must absorb this state before asking anything.

---

## STEP 0 — Landing / Entry Point

**What the user sees:** A single, calm screen. No pricing. No list of features. One sentence + one button.

**Example copy:**
> *"Masz problem prawny? Pomożemy Ci zrozumieć sytuację — bezpłatnie, w kilku krokach."*

### Emotional State
- High anxiety, high cognitive load
- Scanning for signals: "Is this safe? Will this cost me money? Do these people understand my problem?"
- Decision to stay or leave happens in ~3 seconds

### Trust Builders ✅
- Calm visual design (navy / slate blue, white space, no red)
- No price visible above the fold
- "Bezpłatnie" clearly stated
- No mandatory registration to start
- Subtle social proof: "Pomogliśmy już 3,000+ osobom" (once you have data)
- No aggressive CTA ("Zadzwoń teraz!" = fear trigger)

### Trust Killers ❌
- Any mention of price on the landing screen
- Legal jargon in hero copy
- "Skontaktuj się z prawnikiem" as the primary CTA
- Pop-up asking for email before they've done anything
- Slow load time (>2s = they're gone)
- Cookie consent modal blocking the screen

---

## STEP 1 — Problem Category Selection

**What the user does:** Chooses their legal area from a visual grid of plain-language categories.

**Categories (plain Polish, not legal taxonomy):**
- Zwolnienie z pracy / prawa pracownicze
- Sprawa rodzinna (rozwód, alimenty, opieka)
- Problem z mieszkaniem / wynajmem
- Zadłużenie i wierzyciele
- Wypadek lub odszkodowanie
- Umowa, którą podpisałem/-am
- Spór z firmą lub urzędem
- Inne / Nie wiem

### Emotional State
- Slight relief: "I can see my situation on the list"
- Risk: if their situation isn't visible → panic returns ("my case is too complicated")
- The "Inne / Nie wiem" option is emotionally critical — it's the safety net

### Trust Builders ✅
- Plain language (not "Prawo pracy", "Prawo rodzinne")
- Max 8 options — no cognitive overload
- "Nie wiem gdzie jestem" escape hatch, always visible
- Icons that are warm/human, not cold legal symbols (scales of justice = intimidating)
- Progress indicator: "Krok 1 z 4" (shows the end is near)
- No data asked for yet

### Trust Killers ❌
- Latin or formal Polish legal terminology
- More than 10 options
- No "I don't know" option
- Asking for name/email at this stage
- Greyed-out or "Coming soon" categories

---

## STEP 2 — Guided Intake Questions

**What the user does:** Answers 4–7 structured questions specific to their chosen category.

**Format:** One question at a time. Never a long form. Multiple-choice where possible, short free text where needed.

**Example for "Zwolnienie z pracy":**
1. Kiedy zostałeś/-aś zwolniony/-a? (date picker or range)
2. Jaką miałeś/-aś umowę? (na czas nieokreślony / określony / zlecenie / inne)
3. Czy podano Ci pisemny powód zwolnienia? (tak / nie / nie wiem)
4. Czy zwolnienie było natychmiastowe czy z wypowiedzeniem? (radio)
5. Czy pracujesz w firmie dłużej niż 2 lata? (tak / nie)
6. [Optional] Opisz krótko co się stało — własnymi słowami (textarea, skip available)

### Emotional State
- Feeling of being "processed" vs "heard" — this is the most delicate step
- Fear of saying the wrong thing ("will this be used against me?")
- Fear of not knowing the answer ("I don't know what type of contract I had")
- If questions feel like an interrogation → trust collapses
- If questions feel like a knowledgeable friend asking → trust builds

### Trust Builders ✅
- Empathetic framing on sensitive questions:
  > *"To normalne, że nie znasz dokładnej nazwy umowy — opisz, jak ją pamiętasz"*
- "Pomiń to pytanie" on every non-critical field
- Progress bar (visual: "Jesteś w połowie drogi")
- Reassurance between question groups:
  > *"Świetnie — to wystarczy, żeby zrozumieć Twoją sytuację"*
- No judgment language ("Niestety nie masz umowy?" → bad. "Powiedz nam co wiesz o swojej umowie" → good)
- Explicit privacy signal before sensitive questions:
  > *"Twoje odpowiedzi są szyfrowane i nie są udostępniane osobom trzecim"*
- Save progress silently (don't lose answers on back-button)

### Trust Killers ❌
- "Wymagane pole" blocking progress
- Legal terms in question text without explanation
- Questions that feel like they're determining fault
- More than 7 questions total
- Asking for personal data (name, PESEL, phone) during intake
- No "I don't know" option for factual questions
- Long free-text fields with no guidance ("Opisz swój problem" = blank page anxiety)

---

## STEP 3 — AI Situation Summary

**What the user sees:** The system shows a plain-language summary of what it understood.

> *"Oto jak rozumiemy Twoją sytuację:"*

**Structure:**
- 3–5 bullet points: facts as the system understood them
- One sentence framing: what type of situation this is
- A clear "Czy to się zgadza?" correction mechanism

**Example:**
> - Pracowałeś/-aś na umowie o pracę na czas nieokreślony
> - Zostałeś/-aś zwolniony/-a 3 tygodnie temu, bez pisemnego powodu
> - Staż pracy: ponad 2 lata
> - Nie podpisałeś/-aś żadnych dokumentów przy zwolnieniu
>
> **To wygląda jak potencjalnie nieuzasadnione wypowiedzenie** — sytuacja, w której masz prawa i konkretne możliwości działania.

### Emotional State
⚠️ **This is the highest-stakes moment in the entire flow.**

- If the summary is accurate → enormous trust gain. User feels: *"It understood me"*
- If the summary is wrong → total trust collapse. User feels: *"This is just a dumb bot"*
- The framing at the end ("masz prawa i możliwości działania") is the first moment of genuine relief

### Trust Builders ✅
- Prominent "Popraw" / "To nie jest dokładne" button — easy correction
- Warm but precise language — not clinical, not chatty
- Ending with a forward-looking, empowering sentence (not doom)
- Clear AI disclaimer, non-intrusive:
  > *"To wstępna analiza przygotowana przez AI. Nie zastępuje porady prawnej."*
- Don't display this until all questions are answered (no partial summaries)
- Show the summary before the action plan — don't rush to "solutions"

### Trust Killers ❌
- Any factual error in the summary (no recovery from this)
- Legalese in the summary
- Overly hedged language that says nothing: *"Twoja sytuacja może lub może nie..."*
- Missing a correction mechanism
- Hallucinated legal claims ("Masz prawo do odszkodowania w wysokości 50,000 PLN")
- Scary language: "poważna sytuacja prawna", "ryzyko przegranej"
- Small, hidden disclaimer that feels like a liability cover-up

---

## STEP 4 — Action Plan

**What the user sees:** A concrete, prioritized, time-aware list of next steps.

**Structure:**
- **Nagłówek:** "Oto co możesz teraz zrobić" (not "Oto twoje opcje")
- **3–5 steps**, ordered by urgency
- Each step includes:
  - What to do (plain Polish)
  - Why (one sentence)
  - Time horizon or deadline if applicable
  - "Co jeśli nie mogę tego zrobić?" fallback

**Example:**
> **1. Sprawdź termin na odwołanie się do sądu pracy** ⚠️ Pilne
> Masz 21 dni od daty zwolnienia na złożenie odwołania. Twój termin mija: ~[data].
> *Co jeśli to za mało czasu? → Możemy pomóc Ci znaleźć prawnika, który złoży pismo natychmiast.*
>
> **2. Zażądaj pisemnego uzasadnienia zwolnienia**
> Pracodawca ma obowiązek podać powód przy umowie na czas nieokreślony. Możemy wygenerować gotowe pismo.
>
> **3. Zbierz dokumenty**
> Umowa o pracę, ostatnie payslips, korespondencja z pracodawcą. Lista do pobrania →

### Emotional State
- **This is the cathartic moment.** Anxiety → relief.
- User goes from "I don't know what to do" to "I have a plan"
- If the plan is vague → anxiety returns ("but HOW do I do step 1?")
- If the plan has a deadline → urgency re-activates positively (mobilizes action)
- "Co jeśli nie mogę" fallback is crucial for users who feel stuck

### Trust Builders ✅
- Concrete, actionable steps (verbs: "Sprawdź", "Zażądaj", "Zbierz" — not "Rozważ")
- Visible deadlines with actual dates calculated from their intake data
- Download/save option for the plan (PDF or email — email capture here is acceptable)
- "Wygeneruj gotowe pismo" inline offer — adds immediate value
- Steps ordered by urgency, not by legal logic
- Acknowledgment that not every step requires a lawyer

### Trust Killers ❌
- Vague steps: "Skonsultuj się z prawnikiem" as step 1 (= the entire system was pointless)
- No time horizons
- Steps that assume resources they don't have ("Zatrudnij prawnika, który...")
- Overwhelming number of steps (>6)
- Legal jargon without explanation
- No way to save or share the plan
- Plan that looks identical regardless of their inputs

---

## STEP 5 — Document Upload (Optional)

**What the user does:** Uploads a document (contract, termination letter, court notice) for AI analysis.

**Trigger:** Offered proactively if their intake answers suggest a key document exists.
> *"Czy masz przy sobie pismo o wypowiedzeniu? Możemy je przeanalizować — to może ujawnić ważne szczegóły."*

**Output:** Plain-language analysis:
- "Co ten dokument mówi" (co zawiera)
- "Co to oznacza dla Ciebie" (implikacje)
- "Na co zwrócić uwagę" (red flags, key clauses)

### Emotional State
- High vulnerability: sharing a scary document
- Fear about privacy: "Where does this go?"
- Fear of what the analysis will reveal: "What if it's bad news?"
- But also: strong desire to know

### Trust Builders ✅
- Explicit privacy statement directly before the upload button:
  > *"Twój dokument jest przetwarzany lokalnie i nie jest przechowywany po analizie."*
- Upload button clearly labeled (not hidden in a menu)
- Progress indicator during analysis (no dead silence)
- Analysis output in two sections: facts vs. implications
- If there's bad news → deliver it with a path forward, never just "this is bad"
- Option to skip entirely without losing the action plan

### Trust Killers ❌
- No privacy statement before upload
- Generic "terms of service" link instead of plain statement
- Long wait without progress feedback
- Technical error with no recovery path
- Analysis output that uses legal jargon
- Presenting risk without a "what to do next"
- Mandatory document upload to proceed

---

## STEP 6 — Lawyer Connection (Monetization Gate)

**What the user sees:** A targeted offer to connect with a matched lawyer.

**Trigger:** Shown AFTER the action plan is delivered — never before. The free value must come first.

**Framing:**
> *"Twój plan działania jest gotowy. Jeśli chcesz, możemy połączyć Cię z prawnikiem specjalizującym się w dokładnie takim przypadku jak Twój."*

**Display:**
- 2–3 matched lawyer profiles (not a full directory)
- Each profile: name, photo, specialization match, years of experience, review score, estimated first-consultation cost
- "Bezpłatna 15-minutowa rozmowa wstępna" as the entry offer (lowers barrier)

### Emotional State
- User is now more informed and less afraid than when they arrived
- This is by design: the free flow reduces fear → makes the paid step easier
- Risk: if the transition to lawyer feels like a "gotcha" → trust collapse
- Key: user must feel the lawyer recommendation is for their benefit, not for TPP's revenue

### Trust Builders ✅
- Offer appears AFTER the action plan — never as step 1
- Clear match reasoning: "Ten prawnik prowadził 47 spraw z zakresu prawa pracy"
- Real reviews from real clients
- Transparent pricing: "Pierwsza rozmowa: bezpłatna. Dalsza pomoc: od 150 PLN"
- "Możesz też działać samodzielnie z Twoim planem" — always leave a non-paid path
- Option to "Zapisz swój plan i wróć później" — no pressure to decide now
- Lawyer response time indicator: "Odpowiada zwykle w ciągu 2 godzin"

### Trust Killers ❌
- Lawyer connection offered before any free value is delivered
- Generic lawyers not matched to their case type
- No pricing transparency (hidden costs = the thing they feared most)
- Pushy CTA: "Nie czekaj — działaj teraz!"
- No way to exit without engaging a lawyer
- Fake or low-quality reviews
- Price reveal feels like a bait-and-switch

---

## Cross-Cutting Trust Architecture

### Visual & Tone Design System

| Element | Do | Don't |
|---------|-----|-------|
| **Colors** | Navy, slate blue, warm white, soft green for CTAs | Red, orange, aggressive purple |
| **Typography** | Clean sans-serif, generous line height | Dense text blocks, small font |
| **Imagery** | Human faces (diverse, non-stock-looking), calm environments | Scales of justice, gavels, suits |
| **Tone** | Warm, clear, direct — like a knowledgeable friend | Clinical/cold OR overly chatty |
| **CTAs** | Action verbs: "Sprawdź", "Pobierz", "Porozmawiaj" | "Kup teraz", "Zadzwoń natychmiast" |

### Privacy & Data Trust Signals (always visible)
- GDPR badge in footer (always)
- "Twoje dane są bezpieczne" — shown at Step 2 start and Step 5 upload
- Clear data retention policy: plain language, one paragraph
- No account required until Step 6 (lawyer booking)

### The Trust Curve

```
Trust
  │
  │                          ████ Action Plan (peak)
  │                    ████████
  │              ████████
  │          ████
  │       ███
  │     ██  ← AI Summary (make or break)
  │   ██
  │  █
  │ █ ← Entry (near zero — earned nothing yet)
  └──────────────────────────────────────────── Steps
     0    1    2    3    4    5    6
```

**Key insight:** Trust is earned incrementally through delivered value. The lawyer monetization step works because by Step 6, the system has already proven it understands the user's situation. The user is buying access to a human for a problem the system has already helped them understand — not paying to figure out if they have a problem.

---

## Where Trust Can Be Lost — Summary Table

| Step | Highest Risk Moment | Recovery if Lost |
|------|---------------------|-----------------|
| 0 — Landing | Price visible, jargon, slow load | Almost none — they leave |
| 1 — Category | No matching category, "I don't know" missing | "Inne" category as escape valve |
| 2 — Intake | Blocked by required field, interrogation tone | "Pomiń" on every question |
| 3 — Summary | Factual error, legal jargon, no correction | "Popraw" flow — but 1 error = likely exit |
| 4 — Action Plan | Vague steps, no deadlines, "talk to a lawyer" as step 1 | Difficult — if plan is useless, product is useless |
| 5 — Document | No privacy statement, analysis error | Skip option always available |
| 6 — Lawyer | Price surprise, generic match, no exit path | "Działaj samodzielnie" always visible |

---

## Key Design Principle — The Companion Model

The system behaves like a **calm, knowledgeable friend** who:
1. Listens without judgment
2. Explains what's actually happening
3. Tells you what to do, in order
4. Knows when to refer you to a specialist

It never behaves like:
- A chatbot that waits for questions
- A form that collects data
- A sales funnel dressed as a helper

**Every screen should pass this test:** *"Would a scared person feel better or worse after reading this?"*
