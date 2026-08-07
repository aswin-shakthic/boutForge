-- Allow event metadata edits by organizer-club staff (matches app canEditEvent)
DROP POLICY IF EXISTS events_update ON events;
CREATE POLICY events_update ON events FOR UPDATE
  USING (
    organizer_user_id = auth.uid()
    OR is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM club_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.club_id = events.organizer_club_id
        AND cm.role IN ('club_admin', 'coach')
    )
  );

CREATE POLICY events_delete ON events FOR DELETE
  USING (
    organizer_user_id = auth.uid()
    OR is_platform_admin()
    OR get_user_role_in_club(organizer_club_id) = 'club_admin'
  );

CREATE POLICY brackets_delete ON brackets FOR DELETE
  USING (
    get_user_role_in_club(club_id) IN ('club_admin', 'coach', 'matchmaker')
    OR is_platform_admin()
  );

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
