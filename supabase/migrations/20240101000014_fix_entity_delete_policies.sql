-- Delete policies required for event/fixture removal (cascade includes bouts + results).
-- Safe to re-run: drops existing policies first.

DROP POLICY IF EXISTS events_delete ON events;
CREATE POLICY events_delete ON events FOR DELETE
  USING (
    organizer_user_id = auth.uid()
    OR is_platform_admin()
    OR get_user_role_in_club(organizer_club_id) = 'club_admin'
  );

DROP POLICY IF EXISTS brackets_delete ON brackets;
CREATE POLICY brackets_delete ON brackets FOR DELETE
  USING (
    get_user_role_in_club(club_id) IN ('club_admin', 'coach', 'matchmaker')
    OR is_platform_admin()
  );

DROP POLICY IF EXISTS event_clubs_delete ON event_clubs;
CREATE POLICY event_clubs_delete ON event_clubs FOR DELETE
  USING (
    is_platform_admin()
    OR event_id IN (SELECT id FROM events WHERE organizer_user_id = auth.uid())
    OR event_id IN (
      SELECT e.id
      FROM events e
      JOIN club_members cm ON cm.club_id = e.organizer_club_id
      WHERE cm.user_id = auth.uid()
        AND cm.role IN ('club_admin', 'coach')
    )
  );

DROP POLICY IF EXISTS bouts_delete ON bouts;
CREATE POLICY bouts_delete ON bouts FOR DELETE
  USING (
    get_user_role_in_club(club_id) IN ('club_admin', 'coach', 'matchmaker')
    OR is_platform_admin()
  );

DROP POLICY IF EXISTS bout_results_delete ON bout_results;
CREATE POLICY bout_results_delete ON bout_results FOR DELETE
  USING (
    is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM bouts b
      WHERE b.id = bout_results.bout_id
        AND get_user_role_in_club(b.club_id) IN ('club_admin', 'coach', 'matchmaker')
    )
  );

DROP POLICY IF EXISTS club_fighter_participations_delete ON club_fighter_participations;
CREATE POLICY club_fighter_participations_delete ON club_fighter_participations FOR DELETE
  USING (
    is_platform_admin()
    OR get_user_role_in_club(organizer_club_id) IN ('club_admin', 'coach', 'matchmaker')
    OR get_user_role_in_club(fighter_home_club_id) IN ('club_admin', 'coach', 'matchmaker')
  );
