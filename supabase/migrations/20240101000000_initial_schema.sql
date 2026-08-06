-- BoutForge initial schema

-- Enums
CREATE TYPE user_role AS ENUM ('platform_admin', 'matchmaker', 'club_admin', 'coach', 'viewer');
CREATE TYPE gender AS ENUM ('male', 'female');
CREATE TYPE bout_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'pending_fighters');
CREATE TYPE fixture_format AS ENUM ('progressive_knockout', 'round_robin', 'manual');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'in_progress', 'completed');
CREATE TYPE bout_method AS ENUM ('KO', 'TKO', 'UD', 'SD', 'MD', 'DQ', 'RSC', 'NC', 'DRAW');
CREATE TYPE bracket_slot_type AS ENUM ('fighter', 'bye', 'winner_of', 'tbd');
CREATE TYPE fighter_status AS ENUM ('active', 'inactive');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clubs
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state_unit TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Club members
CREATE TABLE club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- Age categories
CREATE TABLE age_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  min_age INTEGER NOT NULL,
  max_age INTEGER NOT NULL,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Weight classes
CREATE TABLE weight_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gender gender NOT NULL,
  age_category_id UUID NOT NULL REFERENCES age_categories(id) ON DELETE CASCADE,
  min_weight_kg NUMERIC(5,2),
  max_weight_kg NUMERIC(5,2),
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Category overrides per club
CREATE TABLE category_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  weight_class_id UUID NOT NULL REFERENCES weight_classes(id) ON DELETE CASCADE,
  display_label TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(club_id, weight_class_id)
);

-- Fighters
CREATE TABLE fighters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dob DATE NOT NULL,
  gender gender NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  age_category_id UUID REFERENCES age_categories(id),
  weight_class_id UUID REFERENCES weight_classes(id),
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  status fighter_status NOT NULL DEFAULT 'active',
  last_bout_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  venue TEXT,
  state_zone TEXT,
  status event_status NOT NULL DEFAULT 'draft',
  is_cross_club BOOLEAN NOT NULL DEFAULT FALSE,
  organizer_club_id UUID REFERENCES clubs(id),
  organizer_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event clubs junction
CREATE TABLE event_clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  UNIQUE(event_id, club_id)
);

-- Brackets
CREATE TABLE brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  format fixture_format NOT NULL DEFAULT 'progressive_knockout',
  age_category_id UUID REFERENCES age_categories(id),
  gender gender,
  weight_class_id UUID REFERENCES weight_classes(id),
  status event_status NOT NULL DEFAULT 'draft',
  venue TEXT,
  scheduled_date DATE,
  bye_fighter_id UUID REFERENCES fighters(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bouts
CREATE TABLE bouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id UUID REFERENCES brackets(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  fighter_a_id UUID REFERENCES fighters(id),
  fighter_b_id UUID REFERENCES fighters(id),
  round_number INTEGER NOT NULL DEFAULT 1,
  bout_order INTEGER NOT NULL DEFAULT 1,
  winner_advances_to_bout_id UUID REFERENCES bouts(id),
  source_bout_a_id UUID REFERENCES bouts(id),
  source_bout_b_id UUID REFERENCES bouts(id),
  slot_a_type bracket_slot_type NOT NULL DEFAULT 'fighter',
  slot_b_type bracket_slot_type NOT NULL DEFAULT 'fighter',
  status bout_status NOT NULL DEFAULT 'pending_fighters',
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bout results
CREATE TABLE bout_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bout_id UUID NOT NULL REFERENCES bouts(id) ON DELETE CASCADE UNIQUE,
  winner_id UUID REFERENCES fighters(id),
  method bout_method NOT NULL,
  round_ended INTEGER,
  scorecards JSONB,
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Club invites
CREATE TABLE club_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'viewer',
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_club_members_user ON club_members(user_id);
CREATE INDEX idx_club_members_club ON club_members(club_id);
CREATE INDEX idx_fighters_club ON fighters(club_id);
CREATE INDEX idx_fighters_category ON fighters(age_category_id, weight_class_id);
CREATE INDEX idx_bouts_bracket ON bouts(bracket_id);
CREATE INDEX idx_bouts_event ON bouts(event_id);
CREATE INDEX idx_bouts_club ON bouts(club_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_brackets_club ON brackets(club_id);

-- Helper: get user's club IDs
CREATE OR REPLACE FUNCTION get_user_club_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT club_id FROM club_members WHERE user_id = auth.uid();
$$;

-- Helper: check if user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_platform_admin FROM profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- Helper: get user role in club
CREATE OR REPLACE FUNCTION get_user_role_in_club(p_club_id UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM club_members
  WHERE user_id = auth.uid() AND club_id = p_club_id
  LIMIT 1;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE fighters ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bout_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_invites ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (id = auth.uid() OR is_platform_admin());
CREATE POLICY profiles_update ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Clubs policies
CREATE POLICY clubs_select ON clubs FOR SELECT
  USING (id IN (SELECT get_user_club_ids()) OR is_platform_admin());
CREATE POLICY clubs_insert ON clubs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY clubs_update ON clubs FOR UPDATE
  USING (get_user_role_in_club(id) = 'club_admin' OR is_platform_admin());

-- Club members policies
CREATE POLICY club_members_select ON club_members FOR SELECT
  USING (club_id IN (SELECT get_user_club_ids()) OR is_platform_admin());
CREATE POLICY club_members_insert ON club_members FOR INSERT
  WITH CHECK (
    is_platform_admin()
    OR get_user_role_in_club(club_id) = 'club_admin'
    OR NOT EXISTS (SELECT 1 FROM club_members cm WHERE cm.club_id = club_members.club_id AND cm.user_id = auth.uid())
  );
CREATE POLICY club_members_update ON club_members FOR UPDATE
  USING (get_user_role_in_club(club_id) = 'club_admin' OR is_platform_admin());

-- Age categories - readable by all authenticated
CREATE POLICY age_categories_select ON age_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY age_categories_insert ON age_categories FOR INSERT
  WITH CHECK (is_platform_admin() OR (club_id IS NOT NULL AND get_user_role_in_club(club_id) = 'club_admin'));

-- Weight classes
CREATE POLICY weight_classes_select ON weight_classes FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY weight_classes_insert ON weight_classes FOR INSERT
  WITH CHECK (is_platform_admin() OR (club_id IS NOT NULL AND get_user_role_in_club(club_id) = 'club_admin'));
CREATE POLICY weight_classes_update ON weight_classes FOR UPDATE
  USING (is_platform_admin() OR (club_id IS NOT NULL AND get_user_role_in_club(club_id) = 'club_admin'));

-- Category overrides
CREATE POLICY category_overrides_select ON category_overrides FOR SELECT
  USING (club_id IN (SELECT get_user_club_ids()) OR is_platform_admin());
CREATE POLICY category_overrides_all ON category_overrides FOR ALL
  USING (get_user_role_in_club(club_id) = 'club_admin' OR is_platform_admin());

-- Fighters
CREATE POLICY fighters_select ON fighters FOR SELECT
  USING (club_id IN (SELECT get_user_club_ids()) OR is_platform_admin());
CREATE POLICY fighters_insert ON fighters FOR INSERT
  WITH CHECK (
    get_user_role_in_club(club_id) IN ('club_admin', 'coach')
    OR is_platform_admin()
  );
CREATE POLICY fighters_update ON fighters FOR UPDATE
  USING (
    get_user_role_in_club(club_id) IN ('club_admin', 'coach')
    OR is_platform_admin()
  );
CREATE POLICY fighters_delete ON fighters FOR DELETE
  USING (get_user_role_in_club(club_id) = 'club_admin' OR is_platform_admin());

-- Events
CREATE POLICY events_select ON events FOR SELECT
  USING (
    is_platform_admin()
    OR organizer_user_id = auth.uid()
    OR id IN (SELECT event_id FROM event_clubs WHERE club_id IN (SELECT get_user_club_ids()))
  );
CREATE POLICY events_insert ON events FOR INSERT
  WITH CHECK (
    is_platform_admin()
    OR EXISTS (SELECT 1 FROM club_members WHERE user_id = auth.uid() AND role IN ('matchmaker', 'club_admin'))
  );
CREATE POLICY events_update ON events FOR UPDATE
  USING (organizer_user_id = auth.uid() OR is_platform_admin());

-- Event clubs
CREATE POLICY event_clubs_select ON event_clubs FOR SELECT
  USING (
    club_id IN (SELECT get_user_club_ids())
    OR is_platform_admin()
    OR event_id IN (SELECT id FROM events WHERE organizer_user_id = auth.uid())
  );
CREATE POLICY event_clubs_insert ON event_clubs FOR INSERT
  WITH CHECK (is_platform_admin() OR EXISTS (
    SELECT 1 FROM events e WHERE e.id = event_id AND (e.organizer_user_id = auth.uid() OR is_platform_admin())
  ));

-- Brackets
CREATE POLICY brackets_select ON brackets FOR SELECT
  USING (club_id IN (SELECT get_user_club_ids()) OR is_platform_admin());
CREATE POLICY brackets_insert ON brackets FOR INSERT
  WITH CHECK (
    get_user_role_in_club(club_id) IN ('club_admin', 'coach', 'matchmaker')
    OR is_platform_admin()
  );
CREATE POLICY brackets_update ON brackets FOR UPDATE
  USING (
    get_user_role_in_club(club_id) IN ('club_admin', 'coach', 'matchmaker')
    OR is_platform_admin()
  );

-- Bouts
CREATE POLICY bouts_select ON bouts FOR SELECT
  USING (club_id IN (SELECT get_user_club_ids()) OR is_platform_admin());
CREATE POLICY bouts_insert ON bouts FOR INSERT
  WITH CHECK (
    get_user_role_in_club(club_id) IN ('club_admin', 'coach', 'matchmaker')
    OR is_platform_admin()
  );
CREATE POLICY bouts_update ON bouts FOR UPDATE
  USING (
    get_user_role_in_club(club_id) IN ('club_admin', 'coach', 'matchmaker')
    OR is_platform_admin()
  );

-- Bout results
CREATE POLICY bout_results_select ON bout_results FOR SELECT
  USING (
    bout_id IN (SELECT id FROM bouts WHERE club_id IN (SELECT get_user_club_ids()))
    OR is_platform_admin()
  );
CREATE POLICY bout_results_insert ON bout_results FOR INSERT
  WITH CHECK (
    bout_id IN (
      SELECT id FROM bouts WHERE club_id IN (
        SELECT club_id FROM club_members
        WHERE user_id = auth.uid() AND role IN ('club_admin', 'coach', 'matchmaker')
      )
    )
    OR is_platform_admin()
  );

-- Club invites
CREATE POLICY club_invites_select ON club_invites FOR SELECT
  USING (
    club_id IN (SELECT get_user_club_ids())
    OR is_platform_admin()
    OR (used_at IS NULL AND expires_at > NOW())
  );
CREATE POLICY club_invites_insert ON club_invites FOR INSERT
  WITH CHECK (get_user_role_in_club(club_id) = 'club_admin' OR is_platform_admin());

-- Function to advance bracket winner
CREATE OR REPLACE FUNCTION advance_bracket_winner(p_bout_id UUID, p_winner_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_bout_id UUID;
  v_source_a UUID;
  v_source_b UUID;
  v_slot_a_type bracket_slot_type;
  v_slot_b_type bracket_slot_type;
BEGIN
  SELECT winner_advances_to_bout_id INTO v_next_bout_id
  FROM bouts WHERE id = p_bout_id;

  IF v_next_bout_id IS NULL THEN RETURN; END IF;

  SELECT source_bout_a_id, source_bout_b_id, slot_a_type, slot_b_type
  INTO v_source_a, v_source_b, v_slot_a_type, v_slot_b_type
  FROM bouts WHERE id = v_next_bout_id;

  IF v_source_a = p_bout_id THEN
    UPDATE bouts SET fighter_a_id = p_winner_id, slot_a_type = 'fighter',
      status = CASE
        WHEN fighter_b_id IS NOT NULL OR slot_b_type = 'bye' THEN 'scheduled'
        ELSE status
      END
    WHERE id = v_next_bout_id;
  ELSIF v_source_b = p_bout_id THEN
    UPDATE bouts SET fighter_b_id = p_winner_id, slot_b_type = 'fighter',
      status = CASE
        WHEN fighter_a_id IS NOT NULL THEN 'scheduled'
        ELSE status
      END
    WHERE id = v_next_bout_id;
  END IF;
END;
$$;

-- Function to record bout result and update fighter records
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

  RETURN v_result_id;
END;
$$;
