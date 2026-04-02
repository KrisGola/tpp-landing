-- TPP Migration: extend user_profiles with marketplace fields
-- Adds TPP-specific columns to existing lawyer profiles
-- tpp_is_listed = true means the lawyer appears in the TPP directory

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS tpp_slug            TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS tpp_specializations TEXT[]       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tpp_city            TEXT,
  ADD COLUMN IF NOT EXISTS tpp_region          TEXT,
  ADD COLUMN IF NOT EXISTS tpp_is_listed       BOOLEAN      DEFAULT false,
  ADD COLUMN IF NOT EXISTS tpp_rating          NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS tpp_review_count    INT          DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tpp_response_hours  INT,         -- median response time in hours
  ADD COLUMN IF NOT EXISTS tpp_price_consult   TEXT,        -- e.g. "bezpłatna 15 min"
  ADD COLUMN IF NOT EXISTS tpp_price_hour      TEXT,        -- e.g. "280 PLN/godz."
  ADD COLUMN IF NOT EXISTS tpp_price_fixed     TEXT,        -- e.g. "od 800 PLN"
  ADD COLUMN IF NOT EXISTS tpp_languages       TEXT[]       DEFAULT '{pl}',
  ADD COLUMN IF NOT EXISTS tpp_availability    TEXT;        -- e.g. "Dostępna dziś"

-- Index for directory listing queries
CREATE INDEX IF NOT EXISTS user_profiles_tpp_listed_idx
  ON user_profiles(tpp_is_listed)
  WHERE tpp_is_listed = true;

CREATE INDEX IF NOT EXISTS user_profiles_tpp_slug_idx
  ON user_profiles(tpp_slug)
  WHERE tpp_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS user_profiles_tpp_specializations_idx
  ON user_profiles USING GIN(tpp_specializations);
