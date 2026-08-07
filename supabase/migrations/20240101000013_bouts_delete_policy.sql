-- Allow club staff to delete bouts when regenerating bracket structures.
CREATE POLICY bouts_delete ON bouts FOR DELETE
  USING (
    get_user_role_in_club(club_id) IN ('club_admin', 'coach', 'matchmaker')
    OR is_platform_admin()
  );
