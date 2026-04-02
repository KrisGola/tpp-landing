-- TPP Migration: client_profiles
-- Separate table for marketplace clients (B2C role)
-- Distinct from user_profiles which belongs to lawyers in legal-portal

CREATE TABLE IF NOT EXISTS client_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT,
  avatar_url      TEXT,
  onboarding_done BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_profiles_updated_at
  BEFORE UPDATE ON client_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_profiles: user sees own row"
  ON client_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "client_profiles: user updates own row"
  ON client_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "client_profiles: insert own row"
  ON client_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Service role bypass (for server-side operations)
CREATE POLICY "client_profiles: service role full access"
  ON client_profiles FOR ALL
  USING (auth.role() = 'service_role');
