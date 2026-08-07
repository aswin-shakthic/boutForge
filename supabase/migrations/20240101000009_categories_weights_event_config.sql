-- Age categories (2026 baseline), Junior category, platform weight refresh, event category config

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS competition_year INTEGER,
  ADD COLUMN IF NOT EXISTS category_config JSONB;

-- Junior category
INSERT INTO age_categories (id, name, code, min_age, max_age, birth_year_from, birth_year_to, is_custom, club_id)
VALUES (
  'a0000000-0000-0000-0000-000000000004',
  'Junior',
  'junior',
  15,
  16,
  2010,
  2011,
  false,
  null
)
ON CONFLICT (id) DO NOTHING;

UPDATE age_categories SET
  min_age = 13,
  max_age = 14,
  birth_year_from = 2012,
  birth_year_to = 2013
WHERE code = 'sub_junior' AND club_id IS NULL;

UPDATE age_categories SET
  min_age = 15,
  max_age = 16,
  birth_year_from = 2010,
  birth_year_to = 2011
WHERE code = 'junior' AND club_id IS NULL;

UPDATE age_categories SET
  min_age = 17,
  max_age = 18,
  birth_year_from = 2008,
  birth_year_to = 2009
WHERE code = 'youth' AND club_id IS NULL;

UPDATE age_categories SET
  min_age = 19,
  max_age = 40,
  birth_year_from = 1900,
  birth_year_to = 2007
WHERE code = 'elite' AND club_id IS NULL;

-- Retire legacy platform weight classes (fighters/brackets keep historical references)
UPDATE weight_classes SET is_enabled = false WHERE club_id IS NULL AND is_custom = false;

INSERT INTO weight_classes (name, gender, age_category_id, min_weight_kg, max_weight_kg, is_custom, club_id) VALUES
  ('30-33 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 30, 33, false, null),
  ('33-35 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 33, 35, false, null),
  ('35-37 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 35, 37, false, null),
  ('37-40 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 37, 40, false, null),
  ('40-43 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 40, 43, false, null),
  ('43-46 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 43, 46, false, null),
  ('46-49 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 46, 49, false, null),
  ('49-52 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 49, 52, false, null),
  ('52-55 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 52, 55, false, null),
  ('55-58 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 55, 58, false, null),
  ('58-61 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 58, 61, false, null),
  ('61-64 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 61, 64, false, null),
  ('64-67 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 64, 67, false, null),
  ('67-70 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 67, 70, false, null),
  ('+70 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 70, NULL, false, null),
  ('30-33 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 30, 33, false, null),
  ('33-35 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 33, 35, false, null),
  ('35-37 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 35, 37, false, null),
  ('37-40 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 37, 40, false, null),
  ('40-43 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 40, 43, false, null),
  ('43-46 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 43, 46, false, null),
  ('46-49 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 46, 49, false, null),
  ('49-52 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 49, 52, false, null),
  ('52-55 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 52, 55, false, null),
  ('55-58 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 55, 58, false, null),
  ('58-61 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 58, 61, false, null),
  ('61-64 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 61, 64, false, null),
  ('64-67 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 64, 67, false, null),
  ('67-70 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 67, 70, false, null),
  ('+70 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 70, NULL, false, null),
  ('44-46 kg', 'male', 'a0000000-0000-0000-0000-000000000004', 44, 46, false, null),
  ('46-48 kg', 'male', 'a0000000-0000-0000-0000-000000000004', 46, 48, false, null),
  ('48-50 kg', 'male', 'a0000000-0000-0000-0000-000000000004', 48, 50, false, null),
  ('50-52 kg', 'male', 'a0000000-0000-0000-0000-000000000004', 50, 52, false, null),
  ('52-54 kg', 'male', 'a0000000-0000-0000-0000-000000000004', 52, 54, false, null),
  ('54-57 kg', 'male', 'a0000000-0000-0000-0000-000000000004', 54, 57, false, null),
  ('57-60 kg', 'male', 'a0000000-0000-0000-0000-000000000004', 57, 60, false, null),
  ('60-63 kg', 'male', 'a0000000-0000-0000-0000-000000000004', 60, 63, false, null),
  ('63-66 kg', 'male', 'a0000000-0000-0000-0000-000000000004', 63, 66, false, null),
  ('66-70 kg', 'male', 'a0000000-0000-0000-0000-000000000004', 66, 70, false, null),
  ('70-75 kg', 'male', 'a0000000-0000-0000-0000-000000000004', 70, 75, false, null),
  ('75-80 kg', 'male', 'a0000000-0000-0000-0000-000000000004', 75, 80, false, null),
  ('+80 kg', 'male', 'a0000000-0000-0000-0000-000000000004', 80, NULL, false, null),
  ('44-46 kg', 'female', 'a0000000-0000-0000-0000-000000000004', 44, 46, false, null),
  ('46-48 kg', 'female', 'a0000000-0000-0000-0000-000000000004', 46, 48, false, null),
  ('48-50 kg', 'female', 'a0000000-0000-0000-0000-000000000004', 48, 50, false, null),
  ('50-52 kg', 'female', 'a0000000-0000-0000-0000-000000000004', 50, 52, false, null),
  ('52-54 kg', 'female', 'a0000000-0000-0000-0000-000000000004', 52, 54, false, null),
  ('54-57 kg', 'female', 'a0000000-0000-0000-0000-000000000004', 54, 57, false, null),
  ('57-60 kg', 'female', 'a0000000-0000-0000-0000-000000000004', 57, 60, false, null),
  ('60-63 kg', 'female', 'a0000000-0000-0000-0000-000000000004', 60, 63, false, null),
  ('63-66 kg', 'female', 'a0000000-0000-0000-0000-000000000004', 63, 66, false, null),
  ('66-70 kg', 'female', 'a0000000-0000-0000-0000-000000000004', 66, 70, false, null),
  ('70-75 kg', 'female', 'a0000000-0000-0000-0000-000000000004', 70, 75, false, null),
  ('75-80 kg', 'female', 'a0000000-0000-0000-0000-000000000004', 75, 80, false, null),
  ('+80 kg', 'female', 'a0000000-0000-0000-0000-000000000004', 80, NULL, false, null),
  ('47-50 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 47, 50, false, null),
  ('50-55 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 50, 55, false, null),
  ('55-60 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 55, 60, false, null),
  ('60-65 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 60, 65, false, null),
  ('65-70 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 65, 70, false, null),
  ('70-75 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 70, 75, false, null),
  ('75-80 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 75, 80, false, null),
  ('80-85 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 80, 85, false, null),
  ('85-90 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 85, 90, false, null),
  ('+90 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 90, NULL, false, null),
  ('45-48 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 45, 48, false, null),
  ('48-51 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 48, 51, false, null),
  ('51-54 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 51, 54, false, null),
  ('54-57 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 54, 57, false, null),
  ('57-60 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 57, 60, false, null),
  ('60-65 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 60, 65, false, null),
  ('65-70 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 65, 70, false, null),
  ('70-75 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 70, 75, false, null),
  ('75-80 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 75, 80, false, null),
  ('+80 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 80, NULL, false, null),
  ('47-50 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 47, 50, false, null),
  ('50-55 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 50, 55, false, null),
  ('55-60 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 55, 60, false, null),
  ('60-65 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 60, 65, false, null),
  ('65-70 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 65, 70, false, null),
  ('70-75 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 70, 75, false, null),
  ('75-80 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 75, 80, false, null),
  ('80-85 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 80, 85, false, null),
  ('85-90 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 85, 90, false, null),
  ('+90 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 90, NULL, false, null),
  ('45-48 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 45, 48, false, null),
  ('48-51 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 48, 51, false, null),
  ('51-54 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 51, 54, false, null),
  ('54-57 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 54, 57, false, null),
  ('57-60 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 57, 60, false, null),
  ('60-65 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 60, 65, false, null),
  ('65-70 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 65, 70, false, null),
  ('70-75 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 70, 75, false, null),
  ('75-80 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 75, 80, false, null),
  ('+80 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 80, NULL, false, null);
