-- BoutForge demo seed: Mumbai Warriors club, 7 Youth 60kg fighters, knockout bracket in progress

-- Fixed IDs for reproducible local dev
-- Coach user
-- club: 22222222-2222-2222-2222-222222222201
-- fighters: 33333333-3333-3333-3333-3333333333XX
-- bracket: 44444444-4444-4444-4444-444444444401
-- bouts: 55555555-5555-5555-5555-5555555555XX

-- Auth user: coach@mumbaiwarriors.in / demo123456
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111101',
  'authenticated',
  'authenticated',
  'coach@mumbaiwarriors.in',
  crypt('demo123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Priya Deshmukh"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111101',
  '11111111-1111-1111-1111-111111111101',
  '{"sub":"11111111-1111-1111-1111-111111111101","email":"coach@mumbaiwarriors.in"}'::jsonb,
  'email',
  '11111111-1111-1111-1111-111111111101',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

UPDATE profiles
SET full_name = 'Priya Deshmukh', email = 'coach@mumbaiwarriors.in'
WHERE id = '11111111-1111-1111-1111-111111111101';

-- Clubs
INSERT INTO clubs (id, name, state_unit, settings) VALUES
  ('22222222-2222-2222-2222-222222222201', 'Mumbai Warriors Boxing Club', 'Maharashtra', '{}'),
  ('22222222-2222-2222-2222-222222222202', 'Pune Striking Academy', 'Maharashtra', '{}'),
  ('22222222-2222-2222-2222-222222222203', 'Nashik Fight Club', 'Maharashtra', '{}'),
  ('22222222-2222-2222-2222-222222222204', 'Delhi Champions BC', 'Delhi', '{}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO club_members (id, club_id, user_id, role) VALUES
  ('77777777-7777-7777-7777-777777777701', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'club_admin')
ON CONFLICT (id) DO NOTHING;

-- Resolve Youth 60kg male weight class
DO $$
DECLARE
  v_youth_id UUID := 'a0000000-0000-0000-0000-000000000002';
  v_wc60_id UUID;
  v_wc57_id UUID;
  v_wc69_id UUID;
  v_wc52f_id UUID;
  v_elite_id UUID := 'a0000000-0000-0000-0000-000000000003';
  v_bracket_id UUID := '44444444-4444-4444-4444-444444444401';
  v_club_id UUID := '22222222-2222-2222-2222-222222222201';
  v_bout1 UUID := '55555555-5555-5555-5555-555555555501';
  v_bout2 UUID := '55555555-5555-5555-5555-555555555502';
  v_bout3 UUID := '55555555-5555-5555-5555-555555555503';
  v_bout4 UUID := '55555555-5555-5555-5555-555555555504';
  v_bout5 UUID := '55555555-5555-5555-5555-555555555505';
  v_bout6 UUID := '55555555-5555-5555-5555-555555555506';
BEGIN
  SELECT id INTO v_wc60_id FROM weight_classes
  WHERE age_category_id = v_youth_id AND gender = 'male' AND name = '60 kg' LIMIT 1;

  SELECT id INTO v_wc57_id FROM weight_classes
  WHERE age_category_id = v_youth_id AND gender = 'male' AND name = '57 kg' LIMIT 1;

  SELECT id INTO v_wc69_id FROM weight_classes
  WHERE age_category_id = v_elite_id AND gender = 'male' AND name = '69 kg' LIMIT 1;

  SELECT id INTO v_wc52f_id FROM weight_classes
  WHERE age_category_id = v_youth_id AND gender = 'female' AND name = '52 kg' LIMIT 1;

  -- 7 Youth Male 60kg fighters
  INSERT INTO fighters (id, club_id, first_name, last_name, dob, gender, weight_kg, age_category_id, weight_class_id, wins, losses, draws, last_bout_at) VALUES
    ('33333333-3333-3333-3333-333333333301', v_club_id, 'Rahul', 'Sharma', '2008-03-15', 'male', 58, v_youth_id, v_wc60_id, 4, 1, 0, '2026-05-01'),
    ('33333333-3333-3333-3333-333333333302', v_club_id, 'Amit', 'Patel', '2009-07-22', 'male', 59, v_youth_id, v_wc60_id, 2, 3, 0, '2026-04-15'),
    ('33333333-3333-3333-3333-333333333303', v_club_id, 'Vikram', 'Singh', '2008-05-10', 'male', 60, v_youth_id, v_wc60_id, 3, 2, 0, '2026-06-01'),
    ('33333333-3333-3333-3333-333333333304', v_club_id, 'Suresh', 'Nair', '2009-01-08', 'male', 57, v_youth_id, v_wc60_id, 1, 4, 0, '2026-03-20'),
    ('33333333-3333-3333-3333-333333333305', v_club_id, 'Karan', 'Mehta', '2010-11-03', 'male', 58, v_youth_id, v_wc60_id, 0, 0, 0, NULL),
    ('33333333-3333-3333-3333-333333333306', v_club_id, 'Deepak', 'Rao', '2008-09-12', 'male', 59, v_youth_id, v_wc60_id, 2, 1, 0, '2026-05-10'),
    ('33333333-3333-3333-3333-333333333307', v_club_id, 'Arjun', 'Das', '2009-08-25', 'male', 60, v_youth_id, v_wc60_id, 3, 0, 1, '2026-06-28')
  ON CONFLICT (id) DO NOTHING;

  -- Extra fighters
  INSERT INTO fighters (id, club_id, first_name, last_name, dob, gender, weight_kg, age_category_id, weight_class_id, wins, losses, draws, last_bout_at) VALUES
    ('33333333-3333-3333-3333-333333333308', v_club_id, 'Rohan', 'Iyer', '2007-04-20', 'male', 68, v_elite_id, v_wc69_id, 5, 2, 0, '2026-05-20'),
    ('33333333-3333-3333-3333-333333333309', v_club_id, 'Manish', 'Gupta', '2008-12-01', 'male', 56, v_youth_id, v_wc57_id, 1, 2, 0, '2026-04-01'),
    ('33333333-3333-3333-3333-333333333310', v_club_id, 'Neha', 'Kulkarni', '2009-02-14', 'female', 52, v_youth_id, v_wc52f_id, 3, 1, 0, '2026-05-01')
  ON CONFLICT (id) DO NOTHING;

  -- Events (before brackets so event_id FK is valid)
  INSERT INTO events (id, name, date, venue, state_zone, status, is_cross_club, organizer_club_id, organizer_user_id) VALUES
    ('66666666-6666-6666-6666-666666666601', 'West Zone Inter-Club Championship 2026', '2026-08-15', 'Pune Indoor Stadium', 'West Zone', 'published', true, v_club_id, '11111111-1111-1111-1111-111111111101'),
    ('66666666-6666-6666-6666-666666666602', 'Mumbai Open Talent Hunt', '2026-09-20', 'NSCI Dome, Mumbai', 'Maharashtra', 'draft', true, v_club_id, '11111111-1111-1111-1111-111111111101')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO event_clubs (id, event_id, club_id) VALUES
    ('99999999-9999-9999-9999-999999999901', '66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222201'),
    ('99999999-9999-9999-9999-999999999902', '66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222202'),
    ('99999999-9999-9999-9999-999999999903', '66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222203')
  ON CONFLICT (id) DO NOTHING;

  -- Bracket
  INSERT INTO brackets (id, club_id, event_id, name, format, age_category_id, gender, weight_class_id, status, venue, scheduled_date, bye_fighter_id) VALUES
    (v_bracket_id, v_club_id, '66666666-6666-6666-6666-666666666601', 'Youth Male 60kg — July Knockout', 'progressive_knockout', v_youth_id, 'male', v_wc60_id, 'published', 'Mumbai Warriors Club Ring', '2026-07-18', '33333333-3333-3333-3333-333333333307')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO brackets (id, club_id, event_id, name, format, age_category_id, gender, weight_class_id, status, venue, scheduled_date, bye_fighter_id) VALUES
    ('44444444-4444-4444-4444-444444444402', v_club_id, '66666666-6666-6666-6666-666666666601', 'Elite Male 69kg — Sparring Day', 'round_robin', v_elite_id, 'male', v_wc69_id, 'published', 'Mumbai Warriors Club Ring', '2026-08-05', NULL)
  ON CONFLICT (id) DO NOTHING;

  -- Bouts (progressive knockout: 3 prelims, 2 semis, 1 final)
  INSERT INTO bouts (id, bracket_id, event_id, club_id, fighter_a_id, fighter_b_id, round_number, bout_order, winner_advances_to_bout_id, source_bout_a_id, source_bout_b_id, slot_a_type, slot_b_type, status, scheduled_at) VALUES
    (v_bout1, v_bracket_id, '66666666-6666-6666-6666-666666666601', v_club_id, '33333333-3333-3333-3333-333333333301', '33333333-3333-3333-3333-333333333302', 1, 1, v_bout4, NULL, NULL, 'fighter', 'fighter', 'scheduled', '2026-07-18 10:00:00+00'),
    (v_bout2, v_bracket_id, '66666666-6666-6666-6666-666666666601', v_club_id, '33333333-3333-3333-3333-333333333303', '33333333-3333-3333-3333-333333333304', 1, 2, v_bout5, NULL, NULL, 'fighter', 'fighter', 'scheduled', '2026-07-18 10:30:00+00'),
    (v_bout3, v_bracket_id, '66666666-6666-6666-6666-666666666601', v_club_id, '33333333-3333-3333-3333-333333333305', '33333333-3333-3333-3333-333333333306', 1, 3, v_bout5, NULL, NULL, 'fighter', 'fighter', 'scheduled', '2026-07-18 11:00:00+00'),
    (v_bout4, v_bracket_id, '66666666-6666-6666-6666-666666666601', v_club_id, NULL, '33333333-3333-3333-3333-333333333307', 2, 4, v_bout6, v_bout1, NULL, 'winner_of', 'fighter', 'pending_fighters', '2026-07-18 14:00:00+00'),
    (v_bout5, v_bracket_id, '66666666-6666-6666-6666-666666666601', v_club_id, NULL, NULL, 2, 5, v_bout6, v_bout2, v_bout3, 'winner_of', 'winner_of', 'pending_fighters', '2026-07-18 14:30:00+00'),
    (v_bout6, v_bracket_id, '66666666-6666-6666-6666-666666666601', v_club_id, NULL, NULL, 3, 6, NULL, v_bout4, v_bout5, 'winner_of', 'winner_of', 'pending_fighters', '2026-07-18 16:00:00+00')
  ON CONFLICT (id) DO NOTHING;
END $$;
