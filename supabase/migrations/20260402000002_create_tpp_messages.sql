-- TPP Migration: tpp_messages
-- Real-time chat between client and lawyer per case

CREATE TABLE IF NOT EXISTS tpp_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID NOT NULL REFERENCES tpp_cases(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('client', 'lawyer')),
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX tpp_messages_case_id_idx ON tpp_messages(case_id);
CREATE INDEX tpp_messages_created_at_idx ON tpp_messages(created_at ASC);
CREATE INDEX tpp_messages_sender_id_idx ON tpp_messages(sender_id);

-- RLS — both case participants can read and send
ALTER TABLE tpp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tpp_messages: case participants can read"
  ON tpp_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tpp_cases c
      WHERE c.id = case_id
        AND (c.client_id = auth.uid() OR c.lawyer_id = auth.uid())
    )
  );

CREATE POLICY "tpp_messages: case participants can insert"
  ON tpp_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tpp_cases c
      WHERE c.id = case_id
        AND (c.client_id = auth.uid() OR c.lawyer_id = auth.uid())
    )
  );

CREATE POLICY "tpp_messages: sender can update own message (mark read)"
  ON tpp_messages FOR UPDATE
  USING (sender_id = auth.uid());

CREATE POLICY "tpp_messages: service role full access"
  ON tpp_messages FOR ALL
  USING (auth.role() = 'service_role');

-- Enable Realtime for live chat
ALTER PUBLICATION supabase_realtime ADD TABLE tpp_messages;
