-- Backfill brackets without an event, then require event_id on every bracket.

DO $$
DECLARE
  rec RECORD;
  new_event_id UUID;
BEGIN
  FOR rec IN
    SELECT
      b.club_id,
      MIN(COALESCE(b.scheduled_date, b.created_at::date)) AS event_date
    FROM brackets b
    WHERE b.event_id IS NULL
    GROUP BY b.club_id
  LOOP
    INSERT INTO events (name, date, status, organizer_club_id, is_cross_club)
    VALUES ('Legacy fixtures', rec.event_date, 'published', rec.club_id, false)
    RETURNING id INTO new_event_id;

    INSERT INTO event_clubs (event_id, club_id)
    VALUES (new_event_id, rec.club_id)
    ON CONFLICT (event_id, club_id) DO NOTHING;

    UPDATE brackets
    SET event_id = new_event_id
    WHERE club_id = rec.club_id
      AND event_id IS NULL;

    UPDATE bouts bt
    SET event_id = new_event_id
    FROM brackets b
    WHERE bt.bracket_id = b.id
      AND b.club_id = rec.club_id
      AND bt.event_id IS NULL;
  END LOOP;
END $$;

ALTER TABLE brackets
  DROP CONSTRAINT IF EXISTS brackets_event_id_fkey;

ALTER TABLE brackets
  ALTER COLUMN event_id SET NOT NULL;

ALTER TABLE brackets
  ADD CONSTRAINT brackets_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
