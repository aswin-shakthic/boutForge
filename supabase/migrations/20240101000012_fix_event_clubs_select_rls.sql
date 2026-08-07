-- Fix infinite RLS recursion: events_select -> event_clubs -> events_select (500 on nested reads)

DROP POLICY IF EXISTS event_clubs_select ON event_clubs;
CREATE POLICY event_clubs_select ON event_clubs FOR SELECT
  USING (
    club_id IN (SELECT get_user_club_ids())
    OR is_platform_admin()
  );
