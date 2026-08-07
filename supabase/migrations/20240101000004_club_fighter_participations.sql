-- Per-organizer-club participation log: each club keeps its own record of
-- fighters who fought in fixtures that club organized, keyed by fighter home club.

CREATE TYPE participation_outcome AS ENUM ('win', 'loss', 'draw', 'nc');

CREATE TABLE club_fighter_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  fighter_id UUID NOT NULL REFERENCES fighters(id) ON DELETE CASCADE,
  fighter_home_club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  bout_id UUID NOT NULL REFERENCES bouts(id) ON DELETE CASCADE,
  bracket_id UUID REFERENCES brackets(id) ON DELETE SET NULL,
  outcome participation_outcome NOT NULL,
  method bout_method,
  round_ended INTEGER,
  participated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (bout_id, fighter_id)
);

CREATE INDEX idx_cfp_organizer ON club_fighter_participations(organizer_club_id);
CREATE INDEX idx_cfp_home_club ON club_fighter_participations(fighter_home_club_id);
CREATE INDEX idx_cfp_fighter ON club_fighter_participations(fighter_id);

ALTER TABLE club_fighter_participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY club_fighter_participations_select ON club_fighter_participations
  FOR SELECT
  USING (
    organizer_club_id IN (SELECT get_user_club_ids())
    OR fighter_home_club_id IN (SELECT get_user_club_ids())
    OR is_platform_admin()
  );

CREATE OR REPLACE FUNCTION log_club_fighter_participations(
  p_bout_id UUID,
  p_winner_id UUID,
  p_method bout_method,
  p_round_ended INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bout bouts;
  v_fighter_id UUID;
  v_home_club_id UUID;
  v_outcome participation_outcome;
BEGIN
  SELECT * INTO v_bout FROM bouts WHERE id = p_bout_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  FOR v_fighter_id IN
    SELECT unnest(ARRAY[v_bout.fighter_a_id, v_bout.fighter_b_id])
  LOOP
    IF v_fighter_id IS NULL THEN
      CONTINUE;
    END IF;

    SELECT club_id INTO v_home_club_id FROM fighters WHERE id = v_fighter_id;
    IF v_home_club_id IS NULL THEN
      CONTINUE;
    END IF;

    IF p_method = 'NC' THEN
      v_outcome := 'nc';
    ELSIF p_method = 'DRAW' THEN
      v_outcome := 'draw';
    ELSIF p_winner_id IS NULL THEN
      CONTINUE;
    ELSIF p_winner_id = v_fighter_id THEN
      v_outcome := 'win';
    ELSE
      v_outcome := 'loss';
    END IF;

    INSERT INTO club_fighter_participations (
      organizer_club_id,
      fighter_id,
      fighter_home_club_id,
      bout_id,
      bracket_id,
      outcome,
      method,
      round_ended,
      participated_at
    )
    VALUES (
      v_bout.club_id,
      v_fighter_id,
      v_home_club_id,
      p_bout_id,
      v_bout.bracket_id,
      v_outcome,
      p_method,
      p_round_ended,
      NOW()
    )
    ON CONFLICT (bout_id, fighter_id) DO UPDATE
    SET
      outcome = EXCLUDED.outcome,
      method = EXCLUDED.method,
      round_ended = EXCLUDED.round_ended,
      participated_at = EXCLUDED.participated_at;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION record_bout_result(
  p_bout_id UUID,
  p_winner_id UUID,
  p_method bout_method,
  p_round_ended INTEGER DEFAULT NULL,
  p_scorecards JSONB DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result_id UUID;
  v_fighter_a UUID;
  v_fighter_b UUID;
  v_loser_id UUID;
BEGIN
  SELECT fighter_a_id, fighter_b_id INTO v_fighter_a, v_fighter_b
  FROM bouts WHERE id = p_bout_id;

  INSERT INTO bout_results (bout_id, winner_id, method, round_ended, scorecards, notes, recorded_by)
  VALUES (p_bout_id, p_winner_id, p_method, p_round_ended, p_scorecards, p_notes, auth.uid())
  RETURNING id INTO v_result_id;

  UPDATE bouts SET status = 'completed' WHERE id = p_bout_id;

  IF p_method != 'NC' AND p_method != 'DRAW' AND p_winner_id IS NOT NULL THEN
    v_loser_id := CASE
      WHEN p_winner_id = v_fighter_a THEN v_fighter_b
      ELSE v_fighter_a
    END;

    UPDATE fighters SET wins = wins + 1, last_bout_at = NOW() WHERE id = p_winner_id;
    IF v_loser_id IS NOT NULL THEN
      UPDATE fighters SET losses = losses + 1, last_bout_at = NOW() WHERE id = v_loser_id;
    END IF;

    PERFORM advance_bracket_winner(p_bout_id, p_winner_id);
  ELSIF p_method = 'DRAW' THEN
    UPDATE fighters SET draws = draws + 1, last_bout_at = NOW()
    WHERE id IN (v_fighter_a, v_fighter_b);
  END IF;

  PERFORM log_club_fighter_participations(p_bout_id, p_winner_id, p_method, p_round_ended);

  RETURN v_result_id;
END;
$$;

-- Backfill from existing completed bouts
INSERT INTO club_fighter_participations (
  organizer_club_id,
  fighter_id,
  fighter_home_club_id,
  bout_id,
  bracket_id,
  outcome,
  method,
  round_ended,
  participated_at
)
SELECT
  b.club_id,
  f.id,
  f.club_id,
  b.id,
  b.bracket_id,
  CASE
    WHEN br.method = 'NC' THEN 'nc'::participation_outcome
    WHEN br.method = 'DRAW' THEN 'draw'::participation_outcome
    WHEN br.winner_id = f.id THEN 'win'::participation_outcome
    ELSE 'loss'::participation_outcome
  END,
  br.method,
  br.round_ended,
  COALESCE(br.recorded_at, b.created_at)
FROM bouts b
JOIN bout_results br ON br.bout_id = b.id
CROSS JOIN LATERAL unnest(ARRAY[b.fighter_a_id, b.fighter_b_id]) AS fighter_id
JOIN fighters f ON f.id = fighter_id
WHERE b.status = 'completed'
  AND b.fighter_a_id IS NOT NULL
  AND b.fighter_b_id IS NOT NULL
  AND fighter_id IS NOT NULL
ON CONFLICT (bout_id, fighter_id) DO NOTHING;
