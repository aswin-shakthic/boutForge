-- Allow coaches/club admins to update birth year ranges on categories.
CREATE POLICY age_categories_update ON age_categories FOR UPDATE
  USING (
    is_platform_admin()
    OR (
      club_id IS NOT NULL
      AND get_user_role_in_club(club_id) IN ('club_admin', 'coach')
    )
    OR (
      club_id IS NULL
      AND EXISTS (
        SELECT 1 FROM club_members
        WHERE user_id = auth.uid()
        AND role IN ('club_admin', 'coach')
      )
    )
  );
