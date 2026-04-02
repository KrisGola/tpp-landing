# TPP × LegalPortal — Integration Contract & Implementation Plan

**Wersja:** 1.0
**Data:** 2026-04-02
**Autor:** Kris (TPP) + Claude Sonnet 4.6
**Status:** Draft do uzgodnienia z kolega (legal-portal)

---

## 1. Kontekst i podział odpowiedzialności

### TPP (twojapomocprawna.pl)
Marketplace dwustronny B2C/B2B. Właściciel product vision.
**Odpowiada za:** onboarding klienta, AI matching, portal klienta, design system, brand.

### LegalPortal (legal-portal)
SaaS dla kancelarii — narzędzie pracy prawnika.
**Dostarcza jako moduły:** auth, wizytówka prawnika, publiczny booking, document RAG chat, Google Calendar.

### Zasada nadrzędna
TPP jest hostem. legal-portal dostarcza gotowe moduły przez uzgodnione interfejsy.
Każdy moduł ma jasno zdefiniowany **input**, **output** i **kontrakt URL**.

---

## 2. Wspólna infrastruktura

### 2.1 Jeden projekt Supabase
Jeden `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
Kolega dostaje dostęp do projektu TPP na Supabase (jako contributor).

### 2.2 Zmienne środowiskowe — wspólny `.env.local`

```env
# Supabase — jeden projekt, obaj używają
NEXT_PUBLIC_SUPABASE_URL=https://[projekt].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[klucz-publiczny]
SUPABASE_SERVICE_ROLE_KEY=[klucz-serwisowy]

# AI
ANTHROPIC_API_KEY=[klucz-claude]         # pipeline AI (TPP)
OPENAI_API_KEY=[klucz-openai]            # RAG embeddings (legal-portal)

# Email
RESEND_API_KEY=[klucz-resend]            # potwierdzenia bookingów

# Google OAuth (booking + calendar)
GOOGLE_CLIENT_ID=[id]
GOOGLE_CLIENT_SECRET=[secret]

# Opcjonalne
TECHNICAL_PAGES_PASSWORD=[haslo]
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=[klucz]
RECAPTCHA_SECRET_KEY=[klucz]
```

### 2.3 Stack techniczny
| Warstwa | Technologia |
|---------|-------------|
| Framework | Next.js 16, App Router |
| Język | TypeScript (strict) |
| Baza danych | Supabase (PostgreSQL + RLS) |
| Stylowanie | Tailwind CSS 4 |
| UI primitives | Radix UI |
| Formularze | React Hook Form + Zod |
| Animacje | Framer Motion |
| i18n | next-intl (pl/en) |
| Testy | Vitest + Playwright |
| Email | Resend |
| AI (matching/analiza) | Anthropic Claude |
| AI (RAG/embeddings) | OpenAI |

---

## 3. Schemat bazy danych — kontrakt

Poniżej tabele których TPP potrzebuje od kolegi (legal-portal dostarcza lub adaptuje).
Tabele oznaczone ★ są rozszerzeniem istniejących tabel z legal-portal.

### 3.1 Tabela: `lawyer_profiles` ★ (rozszerzenie `user_profiles`)

```sql
CREATE TABLE lawyer_profiles (
  id                  UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  slug                TEXT UNIQUE NOT NULL,          -- URL: /prawnik/[slug]
  display_name        TEXT NOT NULL,                 -- "mec. Anna Kowalska"
  specializations     TEXT[] NOT NULL DEFAULT '{}',  -- ["Prawo pracy", "Prawo cywilne"]
  city                TEXT,
  region              TEXT,
  description         TEXT,                          -- bio na wizytówce
  avatar_url          TEXT,
  rating              NUMERIC(3,2),                  -- 4.92
  review_count        INT DEFAULT 0,
  response_time_hours INT,                           -- mediana w godzinach
  is_published        BOOLEAN DEFAULT false,         -- czy wizytówka jest publiczna
  price_consult       TEXT,                          -- "bezpłatna 15 min"
  price_hour          TEXT,                          -- "280 PLN/godz."
  price_fixed         TEXT,                          -- "od 800 PLN"
  languages           TEXT[] DEFAULT '{pl}',
  bar_number          TEXT,                          -- nr wpisu na listę
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);
```

### 3.2 Tabela: `client_profiles` (NOWA — TPP)

```sql
CREATE TABLE client_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT,
  avatar_url      TEXT,
  onboarding_done BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### 3.3 Tabela: `tpp_cases` (NOWA — TPP, oddzielna od `cases` legal-portal)

```sql
CREATE TABLE tpp_cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES client_profiles(id),
  lawyer_id       UUID REFERENCES lawyer_profiles(id),  -- nullable: może być bez prawnika
  title           TEXT NOT NULL,
  category        TEXT NOT NULL,  -- "prawo-pracy", "prawo-cywilne", etc.
  description     TEXT,
  ai_analysis     JSONB,          -- wynik pipeline AI z /api/analyze
  status          TEXT DEFAULT 'new'
                  CHECK (status IN ('new','matched','active','closed','archived')),
  priority        TEXT DEFAULT 'medium'
                  CHECK (priority IN ('low','medium','high','urgent')),
  deadline_at     TIMESTAMPTZ,
  opened_at       TIMESTAMPTZ DEFAULT now(),
  closed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

### 3.4 Tabela: `tpp_messages` (NOWA — TPP)

```sql
CREATE TABLE tpp_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES tpp_cases(id),
  sender_id   UUID NOT NULL REFERENCES auth.users(id),
  sender_role TEXT NOT NULL CHECK (sender_role IN ('client','lawyer')),
  content     TEXT NOT NULL,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### 3.5 Tabela: `tpp_documents` (NOWA — TPP, adapter nad `documents`)

```sql
CREATE TABLE tpp_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         UUID REFERENCES tpp_cases(id),
  client_id       UUID REFERENCES client_profiles(id),
  legal_doc_id    UUID REFERENCES documents(id),  -- FK do tabeli legal-portal
  display_name    TEXT NOT NULL,
  source          TEXT DEFAULT 'user'
                  CHECK (source IN ('user','ai_generated','lawyer')),
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 3.6 Tabela: `tpp_bookings` (adapter nad `consultations` legal-portal)

```sql
CREATE TABLE tpp_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id),  -- FK do legal-portal
  case_id         UUID REFERENCES tpp_cases(id),
  client_id       UUID NOT NULL REFERENCES client_profiles(id),
  lawyer_id       UUID NOT NULL REFERENCES lawyer_profiles(id),
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_min    INT DEFAULT 60,
  type            TEXT DEFAULT 'online'
                  CHECK (type IN ('online','in_person')),
  status          TEXT DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  google_meet_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 3.7 Tabela: `tpp_reviews` (NOWA — TPP)

```sql
CREATE TABLE tpp_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id   UUID NOT NULL REFERENCES lawyer_profiles(id),
  client_id   UUID NOT NULL REFERENCES client_profiles(id),
  booking_id  UUID REFERENCES tpp_bookings(id),
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content     TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. Routing — podział URL

| Ścieżka | Właściciel | Opis |
|---------|-----------|------|
| `/` | TPP | Landing page |
| `/pl`, `/en` | TPP | i18n root |
| `/wizard` | TPP | Guided flow — onboarding klienta |
| `/portal` | TPP | Portal klienta (auth required) |
| `/portal/sprawy` | TPP | Lista spraw klienta |
| `/portal/dokumenty` | TPP | Dokumenty klienta |
| `/portal/wiadomosci` | TPP | Chat z prawnikiem |
| `/portal/konto` | TPP | Ustawienia konta klienta |
| `/prawnik/[slug]` | legal-portal | Publiczna wizytówka prawnika |
| `/book/[slug]` | legal-portal | Publiczny booking (bez auth) |
| `/book/[slug]/confirm/[token]` | legal-portal | Potwierdzenie bookingu |
| `/dashboard` | legal-portal | Dashboard prawnika (auth required) |
| `/dashboard/sprawy` | legal-portal | Sprawy kancelarii |
| `/dashboard/klienci` | legal-portal | Klienci kancelarii |
| `/dashboard/dokumenty` | legal-portal | Dokumenty kancelarii |
| `/dashboard/kalendarz` | legal-portal | Kalendarz + sloty |
| `/dashboard/wizytowka` | legal-portal | Builder wizytówki |
| `/auth/login` | legal-portal | Logowanie (shared) |
| `/auth/signup` | legal-portal | Rejestracja (shared) |
| `/api/analyze` | TPP | AI analiza dokumentu klienta |
| `/api/match` | TPP | AI matching prawnik–klient |

---

## 5. Interfejsy API — kontrakt między modułami

### 5.1 TPP → legal-portal: tworzenie bookingu z portalu klienta

```
POST /api/tpp/booking
Authorization: Bearer [supabase-jwt]

Body:
{
  "slot_id": "uuid",
  "case_id": "uuid",
  "client_name": "string",
  "client_email": "string",
  "client_phone": "string",
  "type": "online" | "in_person"
}

Response 201:
{
  "booking_id": "uuid",
  "consultation_id": "uuid",
  "scheduled_at": "ISO8601",
  "google_meet_url": "string | null",
  "confirmation_sent": true
}
```

### 5.2 TPP → legal-portal: pobranie dostępnych slotów prawnika

```
GET /api/tpp/slots?lawyer_id=[uuid]&from=[ISO8601]&to=[ISO8601]
(public, no auth)

Response 200:
{
  "slots": [
    {
      "id": "uuid",
      "start": "ISO8601",
      "end": "ISO8601",
      "duration_minutes": 60,
      "type": "online" | "in_person",
      "google_meet_available": true
    }
  ]
}
```

### 5.3 TPP → legal-portal: inicjalizacja chatu RAG dla sprawy

```
POST /api/tpp/chat/init
Authorization: Bearer [supabase-jwt]

Body:
{
  "case_id": "uuid",
  "document_ids": ["uuid"]
}

Response 201:
{
  "chat_id": "uuid"
}
```

### 5.4 legal-portal → TPP: webhook — booking potwierdzony

```
POST /api/webhooks/booking-confirmed
X-TPP-Signature: [hmac-sha256]

Body:
{
  "consultation_id": "uuid",
  "tpp_booking_id": "uuid",
  "status": "confirmed",
  "google_meet_url": "string | null"
}
```

---

## 6. Design system — tokeny kolorów

TPP używa własnych tokenów. legal-portal **musi** zaadaptować swoje komponenty wizytówki i bookingu do poniższej palety gdy są renderowane w domenie TPP:

```css
/* TPP Design System */
--color-primary:      #2E9465;   /* zielony główny */
--color-primary-dark: #124030;   /* ciemny zielony */
--color-bg:           #F5F0E8;   /* krem */
--color-surface:      #FFFFFF;
--color-text:         #1A1A1A;
--color-text-muted:   #6B7280;
--color-border:       #E5E0D8;
--color-accent:       #2E9465;

/* Gradient — hero sections */
background: linear-gradient(150deg, #2E9465 0%, #124030 100%);

/* Czcionka */
font-family: 'Inter', sans-serif;
```

Komponenty legal-portal renderowane w `/prawnik/[slug]` i `/book/[slug]`
przyjmują `theme` prop: `"tpp" | "legal-portal"`.

---

## 7. Plan implementacji — fazy

---

### FAZA 0 — Setup (tydzień 1)
**Branch:** `feat/backend-foundation`
**Właściciel:** obaj razem

**Zadania:**
- [ ] Stworzenie projektu Supabase (jeden wspólny)
- [ ] Inicjalizacja Next.js 16 + TypeScript + Tailwind 4 w głównym repo TPP
- [ ] Konfiguracja next-intl (pl/en)
- [ ] Wgranie migracji z legal-portal + nowych tabel TPP (sekcja 3)
- [ ] Konfiguracja RLS na wszystkich tabelach
- [ ] Wspólny `.env.local` uzgodniony i podzielony bezpiecznie
- [ ] CI/CD pipeline (GitHub Actions: lint + test + preview deploy)
- [ ] Vercel project setup (preview per branch)

**Deliverable:** działające `npm run dev`, puste strony pod właściwymi URL-ami, połączenie z Supabase zweryfikowane.

---

### FAZA 1 — Auth (tydzień 1–2)
**Branch:** `feat/auth`
**Właściciel:** legal-portal

**Zadania:**
- [ ] Adaptacja auth z legal-portal do TPP repo
- [ ] Strony: `/auth/login`, `/auth/signup`, `/auth/reset-password`
- [ ] Middleware Next.js: ochrona `/portal/*` i `/dashboard/*`
- [ ] Rozróżnienie ról: `client` vs `lawyer` po zalogowaniu → redirect
- [ ] Tworzenie `client_profiles` i `lawyer_profiles` po rejestracji (trigger Supabase)
- [ ] Strona `/auth/verify-email`

**Deliverable:** pełen flow rejestracja → weryfikacja email → login → redirect według roli.

---

### FAZA 2 — Guided Flow (tydzień 2–3)
**Branch:** `feat/guided-flow`
**Właściciel:** TPP

**Zadania:**
- [ ] Przepisanie `guided-flow.html` na Next.js (App Router, Server + Client components)
- [ ] Wizard steps jako oddzielne komponenty
- [ ] Podłączenie `/api/analyze` (Anthropic) — real API call
- [ ] Zapis `tpp_cases` po ukończeniu wizarda
- [ ] Ekran `matching` — query do `lawyer_profiles` z filtrowaniem
- [ ] Ekran `lawyer-profile` — dane z `lawyer_profiles`
- [ ] Redirect do `/portal` po zakończeniu

**Deliverable:** działający wizard end-to-end, sprawa zapisana w bazie.

---

### FAZA 3 — Wizytówka prawnika (tydzień 3–4)
**Branch:** `feat/lawyer-profile`
**Właściciel:** legal-portal

**Zadania:**
- [ ] Adaptacja Landing Page Builder z legal-portal
- [ ] Route `/dashboard/wizytowka` — builder (auth, rola: lawyer)
- [ ] Route `/prawnik/[slug]` — publiczny widok (no auth)
- [ ] Aplikacja tokenów TPP design system (theme prop)
- [ ] Sekcje: bio, specjalizacje, opinie, cennik, CTA booking
- [ ] Generowanie `slug` z `display_name`
- [ ] Toggle `is_published` — kontrola widoczności

**Deliverable:** prawnik tworzy wizytówkę w dashboardzie, klient widzi ją pod `/prawnik/[slug]`.

---

### FAZA 4 — Booking (tydzień 4–5)
**Branch:** `feat/booking`
**Właściciel:** legal-portal

**Zadania:**
- [ ] Adaptacja publicznego booking flow z legal-portal
- [ ] Route `/book/[slug]` — wybór slotu (no auth)
- [ ] Route `/book/[slug]/confirm/[token]` — potwierdzenie
- [ ] Integracja z Google Calendar (istniejąca w legal-portal)
- [ ] Email potwierdzenia via Resend
- [ ] API endpoint `POST /api/tpp/booking` (sekcja 5.1)
- [ ] API endpoint `GET /api/tpp/slots` (sekcja 5.2)
- [ ] Zapis `tpp_bookings` po potwierdzeniu
- [ ] Webhook `POST /api/webhooks/booking-confirmed` (sekcja 5.4)
- [ ] Integracja CTA z wizytówki → booking

**Deliverable:** klient klika "Umów wizytę" na wizytówce → wybiera slot → dostaje email z potwierdzeniem i linkiem Google Meet.

---

### FAZA 5 — Portal klienta (tydzień 5–6)
**Branch:** `feat/client-portal`
**Właściciel:** TPP

**Zadania:**
- [ ] Przepisanie `client-portal.html` na Next.js
- [ ] Layout: fixed header + bottom nav + scroll container (jak w prototypie)
- [ ] Tab: Dom — dashboard z alertem terminu, hero stats, notyfikacje
- [ ] Tab: Sprawy — lista `tpp_cases` z bazy, klikalne → szczegóły
- [ ] Tab: Dokumenty — lista `tpp_documents`, upload (Supabase Storage)
- [ ] Tab: Wiadomości — real-time chat (Supabase Realtime) z `tpp_messages`
- [ ] Account drawer — dane z `client_profiles`, edycja
- [ ] Widok szczegółów sprawy — oś czasu, AI analiza, dokumenty, prawnik
- [ ] Podłączenie pod prawdziwe dane (Supabase queries)
- [ ] Supabase Realtime dla wiadomości (live updates)

**Deliverable:** pełen portal klienta z prawdziwymi danymi, real-time chat.

---

### FAZA 6 — Dashboard prawnika (tydzień 6–7)
**Branch:** `feat/lawyer-dashboard`
**Właściciel:** legal-portal

**Zadania:**
- [ ] Adaptacja dashboard z legal-portal do TPP kontekstu
- [ ] Widok spraw `tpp_cases` gdzie `lawyer_id = current_user`
- [ ] Chat z klientem (shared `tpp_messages`)
- [ ] Kalendarz konsultacji (`tpp_bookings`)
- [ ] Zarządzanie dokumentami sprawy
- [ ] Statystyki: liczba spraw, oceny, przychód
- [ ] Powiadomienia: nowe sprawy, wiadomości, bookingji

**Deliverable:** prawnik zarządza sprawami, rozmawia z klientami, widzi kalendarz.

---

### FAZA 7 — AI Matching (tydzień 7–8)
**Branch:** `feat/ai-matching`
**Właściciel:** TPP

**Zadania:**
- [ ] Endpoint `POST /api/match` — AI scoring prawnik vs sprawa klienta
- [ ] Algorytm: specjalizacja (50%) + lokalizacja (20%) + oceny (20%) + dostępność (10%)
- [ ] Integracja z ekranem `matching` w guided flow
- [ ] Ranking wyników — top 3 prawnicy
- [ ] Personalizacja na podstawie `ai_analysis` z `tpp_cases`

**Deliverable:** klient dostaje trafnie dopasowanych prawników na podstawie AI.

---

### FAZA 8 — RAG Chat (tydzień 8)
**Branch:** `feat/rag-chat`
**Właściciel:** legal-portal

**Zadania:**
- [ ] Adaptacja document RAG chat z legal-portal
- [ ] Podłączenie do `tpp_documents` (embeddingi po uploadzie)
- [ ] API `POST /api/tpp/chat/init` (sekcja 5.3)
- [ ] Interfejs chatu z dokumentami w portalu klienta (zakładka Dokumenty)
- [ ] Rate limiting (jak w legal-portal)

**Deliverable:** klient może zadawać pytania AI o swoje dokumenty.

---

### FAZA 9 — Polish & Launch prep (tydzień 9)
**Branch:** `feat/launch-prep`
**Właściciel:** obaj

**Zadania:**
- [ ] Testy E2E Playwright: pełen user journey (rejestracja → wizard → booking → portal)
- [ ] Testy jednostkowe Vitest: pokrycie >80%
- [ ] Audyt dostępności (jest-axe, WCAG AA)
- [ ] Audyt bezpieczeństwa (OWASP Top 10, RLS policies)
- [ ] Sprawdzenie i18n — wszystkie stringi przetłumaczone
- [ ] Performance: Lighthouse >90
- [ ] SEO: meta tags, OG, sitemap dla wizytówek
- [ ] Monitoring: error tracking (Sentry), analytics
- [ ] Dokumentacja `DEPLOY.md` — aktualizacja

**Deliverable:** aplikacja gotowa do beta launch z prawdziwymi użytkownikami.

---

## 8. Harmonogram (orientacyjny)

```
Tydzień 1:   Faza 0 (Setup) + Faza 1 (Auth)
Tydzień 2:   Faza 1 (Auth) + Faza 2 start (Wizard)
Tydzień 3:   Faza 2 (Wizard) + Faza 3 start (Wizytówka)
Tydzień 4:   Faza 3 (Wizytówka) + Faza 4 start (Booking)
Tydzień 5:   Faza 4 (Booking) + Faza 5 start (Portal)
Tydzień 6:   Faza 5 (Portal) + Faza 6 start (Dashboard)
Tydzień 7:   Faza 6 (Dashboard) + Faza 7 (Matching)
Tydzień 8:   Faza 7 (Matching) + Faza 8 (RAG)
Tydzień 9:   Faza 9 (Polish & Launch)
```

Łącznie: **~9 tygodni** do beta launch (zakładając 2 devów pracujących regularnie).

---

## 9. Pytania do uzgodnienia przed startem

- [ ] **Kto zakłada projekt Supabase?** (Kris lub kolega, ale jeden shared)
- [ ] **Jak dzielimy sekrety?** (1Password shared vault? Bitwarden?)
- [ ] **Który Vercel account?** (deploy preview per branch)
- [ ] **Jak zarządzamy branchami?** (forki vs jeden repo z uprawnieniami)
- [ ] **Kiedy startujemy Fazę 0?**

---

*Dokument do aktualizacji po każdym sprint review.*
