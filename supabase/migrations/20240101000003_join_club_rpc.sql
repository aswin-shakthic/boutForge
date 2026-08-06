-- Invite join fails with direct REST calls:
-- 1) nested clubs(*) SELECT blocked before membership exists
-- 2) no RLS UPDATE policy on club_invites to mark used_at
CREATE OR REPLACE FUNCTION join_club_with_invite(p_token text)
RETURNS clubs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite club_invites;
  v_club clubs;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_invite
  FROM club_invites
  WHERE token = p_token
    AND used_at IS NULL
    AND expires_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite';
  END IF;

  IF EXISTS (
    SELECT 1 FROM club_members
    WHERE club_id = v_invite.club_id AND user_id = v_user_id
  ) THEN
    SELECT * INTO v_club FROM clubs WHERE id = v_invite.club_id;
    RETURN v_club;
  END IF;

  INSERT INTO club_members (club_id, user_id, role)
  VALUES (v_invite.club_id, v_user_id, v_invite.role);

  UPDATE club_invites SET used_at = NOW() WHERE id = v_invite.id;

  SELECT * INTO v_club FROM clubs WHERE id = v_invite.club_id;
  RETURN v_club;
END;
$$;

REVOKE ALL ON FUNCTION join_club_with_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION join_club_with_invite(text) TO authenticated;
