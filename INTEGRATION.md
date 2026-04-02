# TPP — Integration & Implementation Plan

**Wersja:** 2.0 (zaktualizowana po analizie PRODu)
**Data:** 2026-04-02
**Status:** Aktywny plan

---

## 1. Sytuacja wyjściowa — co stoi na PRODzie

**twojapomocprawna.pl = legal-portal** — jeden system, już wdrożony na Vercel.
Aktualnie działa jako **narzędzie SaaS dla prawnika** (B2B).
Brakuje **strony klienta** (B2C) — marketplace, wizard, portal klienta.

### Co jest gotowe (nie budujemy od zera)

| Moduł | URL | Status |
|-------|-----|--------|
| Auth — logowanie, rejestracja (invite-only), reset | `/auth/*` | ✅ PROD |
| Dashboard prawnika | `/dashboard` | ✅ PROD |
| Zarządzanie sprawami | `/cases`, `/cases/[id]` | ✅ PROD |
| Zarządzanie klientami | `/clients` | ✅ PROD |
| Biblioteka dokumentów + AI analiza | `/documents` | ✅ PROD |
| Kalendarz + Google Calendar sync | `/calendar` | ✅ PROD |
| AI chat RAG (OpenAI + LlamaIndex) | `/chats` | ✅ PROD |
| Kreator wizytówki prawnika | `/landing-page` | ✅ PROD |
| Publiczny profil prawnika | `/p/[slug]` | ✅ PROD |
| Publiczny booking klienta | `/book/[slug]` | ✅ PROD |
| Email (Gmail) integration | `/emails` | ✅ (wymaga połączenia konta) |
| Powiadomienia | `/notifications` | ✅ PROD |
| Ustawienia, integracje | `/settings/*` | ✅ PROD |

### Co jest w toku (branch `redesign/new-design-system`)

- Nowy design system (Inter, warm colors, card radius)
- Collapsible sidebar z dark mode
- Globalna wyszukiwarka
- Poprawki UI (tabele, chat, kalendarz)

> ⚠️ Redesign **nie jest jeszcze na PRODzie**. Wdrożyć przed startem pracy nad klientem.

### Co jest wyłączone/stub

- Court module (PISP scraper stub) — niedostępny na prod
- Gmail integration — działa ale wymaga OAuth
- Rejestracja — invite-only (zarządzane z `/admin`)

---

## 2. Co trzeba zbudować — scope TPP B2C

Poniższe funkcje nie istnieją w legal-portal i są unikalną wartością TPP jako marketplace.

### 2.1 Rejestracja klienta (rola: `client`)

legal-portal ma tylko rolę `lawyer`. Potrzebna nowa rola z osobnym flow:
- Rejestracja bez kodu zaproszeniowego (marketplace jest otwarty dla klientów)
- `client_profiles` — osobna tabela od `user_profiles` prawników
- Po logowaniu → redirect do `/portal` zamiast `/dashboard`
- Middleware rozróżniający role

### 2.2 Guided flow wizard

Prototyp: `guided-flow.html` (nasz branch `feat/api-guided-flow`)
Przepisać na Next.js z prawdziwym backendem:
- Kroki: opis sprawy → AI analiza → kategoria → matching → profil prawnika → booking
- Podłączenie `/api/analyze` (Anthropic) — już zbudowany w naszym branchu
- Zapis sprawy do `tpp_cases` (nowa tabela) po zakończeniu
- Wynik matchingu z `lawyer_profiles`

### 2.3 Katalog prawników + wyszukiwarka

Publiczna strona `/prawnicy`:
- Lista opublikowanych wizytówek (`/p/[slug]` już istnieje, brak katalogu)
- Filtrowanie: specjalizacja, miasto, oceny, dostępność
- Paginacja, SEO (sitemap)

### 2.4 Portal klienta

Prototyp: `client-portal.html` (nasz branch `feat/api-guided-flow`)
Przepisać na Next.js:
- Route: `/portal` (chronione, rola: client)
- Zakładki: Dom, Moje sprawy, Dokumenty, Wiadomości
- Dane z Supabase (tpp_cases, tpp_documents, tpp_messages)
- Real-time chat z prawnikiem (Supabase Realtime)
- Upload dokumentów (Supabase Storage)

### 2.5 AI matching engine

Endpoint `POST /api/match`:
- Input: `ai_analysis` ze sprawy klienta
- Query: `lawyer_profiles` z filtrowaniem
- Scoring: specjalizacja (50%) + lokalizacja (20%) + oceny (20%) + dostępność (10%)
- Output: top 3 prawnicy z wyjaśnieniem dopasowania

---

## 3. Nowe tabele w bazie danych

Dodać do istniejącego Supabase projektu legal-portal.

### `client_profiles`

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

ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client own data" ON client_profiles
  USING (auth.uid() = id);
```

### `tpp_cases`

```sql
CREATE TABLE tpp_cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES client_profiles(id),
  lawyer_id       UUID REFERENCES user_profiles(id),  -- FK do user_profiles legal-portal
  title           TEXT NOT NULL,
  category        TEXT NOT NULL,
  description     TEXT,
  ai_analysis     JSONB,         -- wynik /api/analyze
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

ALTER TABLE tpp_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client sees own cases" ON tpp_cases
  USING (client_id = auth.uid());
CREATE POLICY "lawyer sees assigned cases" ON tpp_cases
  USING (lawyer_id = auth.uid());
```

### `tpp_messages`

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

ALTER TABLE tpp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "case participants" ON tpp_messages
  USING (
    EXISTS (
      SELECT 1 FROM tpp_cases c
      WHERE c.id = case_id
        AND (c.client_id = auth.uid() OR c.lawyer_id = auth.uid())
    )
  );
```

### `tpp_documents`

```sql
CREATE TABLE tpp_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         UUID REFERENCES tpp_cases(id),
  client_id       UUID REFERENCES client_profiles(id),
  legal_doc_id    UUID REFERENCES documents(id),  -- opcjonalny link do tabeli legal-portal
  display_name    TEXT NOT NULL,
  storage_path    TEXT,
  file_type       TEXT,
  file_size_bytes BIGINT,
  source          TEXT DEFAULT 'user'
                  CHECK (source IN ('user','ai_generated','lawyer')),
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### `tpp_bookings`

```sql
-- Adapter nad consultation_slots/consultations z legal-portal
CREATE TABLE tpp_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id),
  case_id         UUID REFERENCES tpp_cases(id),
  client_id       UUID NOT NULL REFERENCES client_profiles(id),
  lawyer_id       UUID NOT NULL REFERENCES user_profiles(id),
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

### Rozszerzenie `user_profiles` — lawyer public data

```sql
-- Dodać kolumny do istniejącej tabeli user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS
  tpp_slug          TEXT UNIQUE,
  tpp_specializations TEXT[],
  tpp_city          TEXT,
  tpp_rating        NUMERIC(3,2),
  tpp_review_count  INT DEFAULT 0,
  tpp_is_listed     BOOLEAN DEFAULT false,  -- czy widoczny w katalogu TPP
  tpp_price_consult TEXT,
  tpp_price_hour    TEXT,
  tpp_price_fixed   TEXT;
```

---

## 4. Routing — nowe URL-e do dodania

Istniejące URL-e legal-portal zostają bez zmian.

| Nowy URL | Opis | Właściciel |
|----------|------|-----------|
| `/prawnicy` | Katalog prawników (public) | TPP |
| `/prawnicy?spec=prawo-pracy&miasto=warszawa` | Filtered search | TPP |
| `/wizard` | Guided flow klienta | TPP |
| `/portal` | Portal klienta — Dom | TPP |
| `/portal/sprawy` | Lista spraw klienta | TPP |
| `/portal/sprawy/[id]` | Szczegóły sprawy | TPP |
| `/portal/dokumenty` | Dokumenty klienta | TPP |
| `/portal/wiadomosci` | Chat z prawnikiem | TPP |
| `/portal/konto` | Konto klienta | TPP |
| `/api/analyze` | AI analiza sprawy (Anthropic) | TPP — już gotowy |
| `/api/match` | AI matching prawnik–klient | TPP |

---

## 5. Plan implementacji — fazy

---

### FAZA 0 — Merge redesign na PROD (priorytet natychmiastowy)
**Branch:** `redesign/new-design-system`
**Właściciel:** kolega (legal-portal)
**Czas:** 1–2 dni

**Zadania:**
- [ ] Review i merge `redesign/new-design-system` → `main`
- [ ] Deploy na Vercel
- [ ] Smoke test na PRODzie (sprawy, chat, kalendarz, booking)

**Dlaczego najpierw:** Nowy design system to fundament — nowe komponenty UI budujemy na nim, nie na starym.

---

### FAZA 1 — Client Auth (tydzień 1)
**Branch:** `feat/client-auth`
**Właściciel:** TPP + kolega razem

**Zadania:**
- [ ] Nowa tabela `client_profiles` w Supabase (migracja)
- [ ] Modyfikacja signup flow — rozróżnienie roli: `lawyer` vs `client`
- [ ] Klienci rejestrują się bez kodu zaproszeniowego
- [ ] Middleware: po logowaniu jako `client` → redirect `/portal`, jako `lawyer` → `/dashboard`
- [ ] Strona `/portal` — podstawowy layout (header, bottom nav)
- [ ] Ochrona `/portal/*` — tylko rola `client`

**Deliverable:** klient może się zarejestrować i zalogować, widzi `/portal`.

---

### FAZA 2 — Guided Flow Wizard (tydzień 1–2)
**Branch:** `feat/guided-flow`
**Właściciel:** TPP

**Zadania:**
- [ ] Przepisanie `guided-flow.html` na Next.js App Router
- [ ] Wizard jako `/wizard` — Server + Client Components
- [ ] Podłączenie `/api/analyze` (Anthropic) — migracja z naszego branchu
- [ ] Zapis `tpp_cases` po zakończeniu wizarda
- [ ] Ekran matching — query do `user_profiles` gdzie `tpp_is_listed = true`
- [ ] Link do `/p/[slug]` z wizarda (istniejąca wizytówka)
- [ ] Link do `/book/[slug]` z profilu prawnika (istniejący booking)
- [ ] Po bookingu → redirect do `/portal`

**Deliverable:** klient przechodzi przez wizard, sprawa zapisana, booking umówiony.

---

### FAZA 3 — Lawyer listing w katalogu (tydzień 2)
**Branch:** `feat/lawyer-directory`
**Właściciel:** TPP

**Zadania:**
- [ ] Migracja — dodanie kolumn `tpp_*` do `user_profiles`
- [ ] Strona `/prawnicy` — grid kart prawników z `tpp_is_listed = true`
- [ ] Filtry: specjalizacja, miasto, dostępność, cena
- [ ] Paginacja + SEO (metadata per strona)
- [ ] Sitemap: `/prawnicy` + wszystkie `/p/[slug]`
- [ ] W dashboardzie prawnika: toggle "Widoczny w katalogu TPP"

**Deliverable:** publiczna wyszukiwarka prawników.

---

### FAZA 4 — Portal klienta (tydzień 2–3)
**Branch:** `feat/client-portal`
**Właściciel:** TPP

**Zadania:**
- [ ] Migracja tabel: `tpp_cases`, `tpp_messages`, `tpp_documents`, `tpp_bookings`
- [ ] Layout `/portal` — fixed header + bottom nav (jak w prototypie `client-portal.html`)
- [ ] Tab **Dom** — deadline alert, stats, case-summary-card, appointment card
- [ ] Tab **Sprawy** — lista `tpp_cases`, klikalne → szczegóły
- [ ] Widok szczegółów sprawy — oś czasu, AI analiza, dokumenty, sekcja prawnika
- [ ] Tab **Dokumenty** — lista `tpp_documents`, upload (Supabase Storage)
- [ ] Tab **Wiadomości** — real-time chat (Supabase Realtime) z `tpp_messages`
- [ ] Account drawer — dane z `client_profiles`, edycja
- [ ] Powiadomienia push (Supabase Realtime) — nowe wiadomości

**Deliverable:** pełen portal klienta z prawdziwymi danymi.

---

### FAZA 5 — AI Matching Engine (tydzień 3)
**Branch:** `feat/ai-matching`
**Właściciel:** TPP

**Zadania:**
- [ ] Endpoint `POST /api/match`
- [ ] Scoring algorytm: specjalizacja (50%) + lokalizacja (20%) + oceny (20%) + dostępność (10%)
- [ ] Integracja z ekranem matching w guided flow (Faza 2)
- [ ] Personalizacja na podstawie `ai_analysis` z `tpp_cases`
- [ ] Top 3 prawnicy z wyjaśnieniem dlaczego dopasowani
- [ ] A/B test placeholders (feature flag)

**Deliverable:** klient dostaje trafnie dopasowanych prawników.

---

### FAZA 6 — Powiadomienia prawnika o nowych sprawach (tydzień 3–4)
**Branch:** `feat/lawyer-notifications`
**Właściciel:** kolega (legal-portal)

**Zadania:**
- [ ] Powiadomienie w dashboardzie gdy klient dopasował prawnika (`tpp_is_listed`)
- [ ] Email (Resend) do prawnika: "Nowy klient czeka na Twoją odpowiedź"
- [ ] W dashboardzie: zakładka/widżet "Wnioski od klientów TPP"
- [ ] Prawnik może zaakceptować/odrzucić → aktualizacja `tpp_cases.status`
- [ ] Po akceptacji — chat odblokowany

**Deliverable:** prawnik widzi i obsługuje nowych klientów z TPP.

---

### FAZA 7 — Polish & Launch prep (tydzień 4)
**Branch:** `feat/launch-prep`
**Właściciel:** obaj

**Zadania:**
- [ ] Testy E2E Playwright: rejestracja klienta → wizard → booking → portal
- [ ] Testy E2E: rejestracja prawnika → wizytówka → dashboard
- [ ] Audyt RLS — sprawdzić czy klient nie widzi danych innych klientów
- [ ] Performance: Lighthouse >90 dla `/`, `/prawnicy`, `/wizard`
- [ ] SEO: OG tags dla wizytówek prawników
- [ ] Error monitoring: Sentry dla nowych routes
- [ ] Otwarcie rejestracji dla klientów (wyłączyć invite-only dla roli `client`)
- [ ] Landing page aktualizacja — CTA "Znajdź prawnika" → `/wizard`

**Deliverable:** beta launch gotowy.

---

## 6. Harmonogram

```
Tydzień 0:   Merge redesign → PROD
Tydzień 1:   Faza 1 (Auth) + Faza 2 (Wizard)
Tydzień 2:   Faza 2 finish + Faza 3 (Katalog) + Faza 4 start (Portal)
Tydzień 3:   Faza 4 finish + Faza 5 (Matching) + Faza 6 start (Notifications)
Tydzień 4:   Faza 6 finish + Faza 7 (Launch prep)
```

**Łącznie: ~4 tygodnie do beta launch.**

Skrócono z 9 do 4 tygodni — bo backend, auth, booking i wizytówka są już gotowe na PRODzie.

---

## 7. Pytania do ustalenia przed Fazą 1

- [ ] **Redesign merge** — kiedy kolega jest gotowy do merge?
- [ ] **Supabase migrations** — kto puszcza migracje na PRODzie? (rola service role)
- [ ] **Invite-only** — zostawiamy dla prawników, otwieramy dla klientów?
- [ ] **Anthropic API key** — wgrać do `.env` na Vercel (TPP pipeline AI)
- [ ] **Nazewnictwo ról** — `lawyer` / `client` w `user_profiles` czy osobne tabele?

---

*Dokument żywy — aktualizować po każdej fazie.*
