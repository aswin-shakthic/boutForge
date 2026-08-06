-- Club INSERT + RETURNING fails RLS: clubs_select only allows rows where the user
-- is already a club member, but membership is created after the club row.
CREATE OR REPLACE FUNCTION create_club_with_admin(
  p_name text,
  p_state_unit text DEFAULT NULL
)
RETURNS clubs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club clubs;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO clubs (name, state_unit)
  VALUES (p_name, p_state_unit)
  RETURNING * INTO v_club;

  INSERT INTO club_members (club_id, user_id, role)
  VALUES (v_club.id, v_user_id, 'club_admin');

  RETURN v_club;
END;
$$;

REVOKE ALL ON FUNCTION create_club_with_admin(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_club_with_admin(text, text) TO authenticated;
