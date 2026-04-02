-- TPP Migration: tpp_bookings
-- Adapter over consultation_slots/consultations from legal-portal
-- Links TPP cases to lawyer bookings

CREATE TABLE IF NOT EXISTS tpp_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
  case_id         UUID REFERENCES tpp_cases(id) ON DELETE SET NULL,
  client_id       UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  lawyer_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_min    INT NOT NULL DEFAULT 60,
  type            TEXT NOT NULL DEFAULT 'online'
                  CHECK (type IN ('online', 'in_person')),
  status          TEXT NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  google_meet_url TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER tpp_bookings_updated_at
  BEFORE UPDATE ON tpp_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX tpp_bookings_client_id_idx ON tpp_bookings(client_id);
CREATE INDEX tpp_bookings_lawyer_id_idx ON tpp_bookings(lawyer_id);
CREATE INDEX tpp_bookings_scheduled_at_idx ON tpp_bookings(scheduled_at);
CREATE INDEX tpp_bookings_case_id_idx ON tpp_bookings(case_id);

-- RLS
ALTER TABLE tpp_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tpp_bookings: client sees own bookings"
  ON tpp_bookings FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "tpp_bookings: lawyer sees own bookings"
  ON tpp_bookings FOR SELECT
  USING (lawyer_id = auth.uid());

CREATE POLICY "tpp_bookings: client inserts own booking"
  ON tpp_bookings FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "tpp_bookings: participants update booking"
  ON tpp_bookings FOR UPDATE
  USING (client_id = auth.uid() OR lawyer_id = auth.uid());

CREATE POLICY "tpp_bookings: service role full access"
  ON tpp_bookings FOR ALL
  USING (auth.role() = 'service_role');
