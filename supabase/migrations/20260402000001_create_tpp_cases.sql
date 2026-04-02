-- TPP Migration: tpp_cases
-- Client legal cases created through the TPP wizard
-- lawyer_id references user_profiles from legal-portal (same Supabase project)

CREATE TABLE IF NOT EXISTS tpp_cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  lawyer_id       UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL
                  CHECK (category IN ('prawo-pracy','prawo-rodzinne','prawo-cywilne',
                                      'prawo-nieruchomosci','postepowanie-sadowe','inne')),
  description     TEXT,
  ai_analysis     JSONB,           -- full output from /api/analyze
  status          TEXT NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new','matched','active','closed','archived')),
  priority        TEXT NOT NULL DEFAULT 'medium'
                  CHECK (priority IN ('low','medium','high','urgent')),
  deadline_at     TIMESTAMPTZ,
  opened_at       TIMESTAMPTZ DEFAULT now(),
  closed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER tpp_cases_updated_at
  BEFORE UPDATE ON tpp_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX tpp_cases_client_id_idx ON tpp_cases(client_id);
CREATE INDEX tpp_cases_lawyer_id_idx ON tpp_cases(lawyer_id);
CREATE INDEX tpp_cases_status_idx ON tpp_cases(status);
CREATE INDEX tpp_cases_created_at_idx ON tpp_cases(created_at DESC);

-- RLS
ALTER TABLE tpp_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tpp_cases: client sees own cases"
  ON tpp_cases FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "tpp_cases: lawyer sees assigned cases"
  ON tpp_cases FOR SELECT
  USING (lawyer_id = auth.uid());

CREATE POLICY "tpp_cases: client inserts own case"
  ON tpp_cases FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "tpp_cases: client updates own case"
  ON tpp_cases FOR UPDATE
  USING (client_id = auth.uid());

CREATE POLICY "tpp_cases: lawyer updates assigned case"
  ON tpp_cases FOR UPDATE
  USING (lawyer_id = auth.uid());

CREATE POLICY "tpp_cases: service role full access"
  ON tpp_cases FOR ALL
  USING (auth.role() = 'service_role');
