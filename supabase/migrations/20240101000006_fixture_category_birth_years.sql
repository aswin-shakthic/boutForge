-- Birth year bounds for custom fixture/tournament categories.
ALTER TABLE age_categories
  ADD COLUMN IF NOT EXISTS birth_year_from INTEGER,
  ADD COLUMN IF NOT EXISTS birth_year_to INTEGER;

-- Coaches need to define categories when running a fixture.
DROP POLICY IF EXISTS age_categories_insert ON age_categories;
CREATE POLICY age_categories_insert ON age_categories FOR INSERT
  WITH CHECK (
    is_platform_admin()
    OR (
      club_id IS NOT NULL
      AND get_user_role_in_club(club_id) IN ('club_admin', 'coach')
    )
  );

DROP POLICY IF EXISTS weight_classes_insert ON weight_classes;
CREATE POLICY weight_classes_insert ON weight_classes FOR INSERT
  WITH CHECK (
    is_platform_admin()
    OR (
      club_id IS NOT NULL
      AND get_user_role_in_club(club_id) IN ('club_admin', 'coach')
    )
  );
