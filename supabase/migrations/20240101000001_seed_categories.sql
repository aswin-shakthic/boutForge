-- Seed BFI/IBA age categories and weight classes

INSERT INTO age_categories (id, name, code, min_age, max_age, is_custom, club_id) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Sub-Junior', 'sub_junior', 13, 14, false, null),
  ('a0000000-0000-0000-0000-000000000004', 'Junior', 'junior', 15, 16, false, null),
  ('a0000000-0000-0000-0000-000000000002', 'Youth', 'youth', 17, 18, false, null),
  ('a0000000-0000-0000-0000-000000000003', 'Elite', 'elite', 19, 40, false, null);

-- Elite Male weight classes
INSERT INTO weight_classes (name, gender, age_category_id, min_weight_kg, max_weight_kg, is_custom, club_id) VALUES
  ('46-49 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 46, 49, false, null),
  ('52 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 49.01, 52, false, null),
  ('56 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 52.01, 56, false, null),
  ('60 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 56.01, 60, false, null),
  ('64 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 60.01, 64, false, null),
  ('69 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 64.01, 69, false, null),
  ('75 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 69.01, 75, false, null),
  ('81 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 75.01, 81, false, null),
  ('91 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 81.01, 91, false, null),
  ('+91 kg', 'male', 'a0000000-0000-0000-0000-000000000003', 91.01, null, false, null);

-- Elite Female
INSERT INTO weight_classes (name, gender, age_category_id, min_weight_kg, max_weight_kg, is_custom, club_id) VALUES
  ('48 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 45, 48, false, null),
  ('51 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 48.01, 51, false, null),
  ('54 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 51.01, 54, false, null),
  ('57 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 54.01, 57, false, null),
  ('60 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 57.01, 60, false, null),
  ('64 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 60.01, 64, false, null),
  ('69 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 64.01, 69, false, null),
  ('75 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 69.01, 75, false, null),
  ('81 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 75.01, 81, false, null),
  ('+81 kg', 'female', 'a0000000-0000-0000-0000-000000000003', 81.01, null, false, null);

-- Youth Male
INSERT INTO weight_classes (name, gender, age_category_id, min_weight_kg, max_weight_kg, is_custom, club_id) VALUES
  ('48 kg', 'male', 'a0000000-0000-0000-0000-000000000002', null, 48, false, null),
  ('51 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 48.01, 51, false, null),
  ('54 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 51.01, 54, false, null),
  ('57 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 54.01, 57, false, null),
  ('60 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 57.01, 60, false, null),
  ('63 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 60.01, 63, false, null),
  ('66 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 63.01, 66, false, null),
  ('70 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 66.01, 70, false, null),
  ('75 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 70.01, 75, false, null),
  ('80 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 75.01, 80, false, null),
  ('+80 kg', 'male', 'a0000000-0000-0000-0000-000000000002', 80.01, null, false, null);

-- Youth Female
INSERT INTO weight_classes (name, gender, age_category_id, min_weight_kg, max_weight_kg, is_custom, club_id) VALUES
  ('48 kg', 'female', 'a0000000-0000-0000-0000-000000000002', null, 48, false, null),
  ('50 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 48.01, 50, false, null),
  ('52 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 50.01, 52, false, null),
  ('54 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 52.01, 54, false, null),
  ('57 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 54.01, 57, false, null),
  ('60 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 57.01, 60, false, null),
  ('63 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 60.01, 63, false, null),
  ('66 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 63.01, 66, false, null),
  ('70 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 66.01, 70, false, null),
  ('75 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 70.01, 75, false, null),
  ('80 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 75.01, 80, false, null),
  ('+80 kg', 'female', 'a0000000-0000-0000-0000-000000000002', 80.01, null, false, null);

-- Sub-Junior Male
INSERT INTO weight_classes (name, gender, age_category_id, min_weight_kg, max_weight_kg, is_custom, club_id) VALUES
  ('33-35 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 33, 35, false, null),
  ('37 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 35.01, 37, false, null),
  ('40 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 37.01, 40, false, null),
  ('43 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 40.01, 43, false, null),
  ('46 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 43.01, 46, false, null),
  ('49 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 46.01, 49, false, null),
  ('52 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 49.01, 52, false, null),
  ('55 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 52.01, 55, false, null),
  ('58 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 55.01, 58, false, null),
  ('61 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 58.01, 61, false, null),
  ('64 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 61.01, 64, false, null),
  ('67 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 64.01, 67, false, null),
  ('70 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 67.01, 70, false, null),
  ('+70 kg', 'male', 'a0000000-0000-0000-0000-000000000001', 70.01, null, false, null);

-- Sub-Junior Female
INSERT INTO weight_classes (name, gender, age_category_id, min_weight_kg, max_weight_kg, is_custom, club_id) VALUES
  ('31-33 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 31, 33, false, null),
  ('35 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 33.01, 35, false, null),
  ('37 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 35.01, 37, false, null),
  ('40 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 37.01, 40, false, null),
  ('43 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 40.01, 43, false, null),
  ('46 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 43.01, 46, false, null),
  ('49 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 46.01, 49, false, null),
  ('52 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 49.01, 52, false, null),
  ('55 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 52.01, 55, false, null),
  ('58 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 55.01, 58, false, null),
  ('61 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 58.01, 61, false, null),
  ('64 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 61.01, 64, false, null),
  ('67 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 64.01, 67, false, null),
  ('+67 kg', 'female', 'a0000000-0000-0000-0000-000000000001', 67.01, null, false, null);
