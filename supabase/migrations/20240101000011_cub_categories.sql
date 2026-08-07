-- Cub 1–4 age categories (2026 baseline birth years) and 16–60+ kg weight classes (2 kg steps)

INSERT INTO age_categories (id, name, code, min_age, max_age, birth_year_from, birth_year_to, is_custom, club_id)
VALUES
  (
    'a0000000-0000-0000-0000-000000000005',
    'Cub 1',
    'cub_1',
    5,
    6,
    2020,
    2021,
    false,
    null
  ),
  (
    'a0000000-0000-0000-0000-000000000006',
    'Cub 2',
    'cub_2',
    7,
    8,
    2018,
    2019,
    false,
    null
  ),
  (
    'a0000000-0000-0000-0000-000000000007',
    'Cub 3',
    'cub_3',
    9,
    10,
    2016,
    2017,
    false,
    null
  ),
  (
    'a0000000-0000-0000-0000-000000000008',
    'Cub 4',
    'cub_4',
    11,
    12,
    2014,
    2015,
    false,
    null
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  min_age = EXCLUDED.min_age,
  max_age = EXCLUDED.max_age,
  birth_year_from = EXCLUDED.birth_year_from,
  birth_year_to = EXCLUDED.birth_year_to,
  is_custom = EXCLUDED.is_custom;

DO $$
DECLARE
  cub_ids UUID[] := ARRAY[
    'a0000000-0000-0000-0000-000000000005'::uuid,
    'a0000000-0000-0000-0000-000000000006'::uuid,
    'a0000000-0000-0000-0000-000000000007'::uuid,
    'a0000000-0000-0000-0000-000000000008'::uuid
  ];
  cub_id UUID;
  min_w INTEGER;
  gender_label TEXT;
BEGIN
  FOREACH cub_id IN ARRAY cub_ids LOOP
    IF EXISTS (
      SELECT 1 FROM weight_classes
      WHERE age_category_id = cub_id AND club_id IS NULL AND is_custom = false
    ) THEN
      CONTINUE;
    END IF;

    min_w := 16;
    WHILE min_w < 60 LOOP
      FOREACH gender_label IN ARRAY ARRAY['male', 'female'] LOOP
        INSERT INTO weight_classes (name, gender, age_category_id, min_weight_kg, max_weight_kg, is_custom, club_id)
        VALUES (
          min_w || '-' || (min_w + 2) || ' kg',
          gender_label::gender,
          cub_id,
          min_w,
          min_w + 2,
          false,
          null
        );
      END LOOP;
      min_w := min_w + 2;
    END LOOP;

    FOREACH gender_label IN ARRAY ARRAY['male', 'female'] LOOP
      INSERT INTO weight_classes (name, gender, age_category_id, min_weight_kg, max_weight_kg, is_custom, club_id)
      VALUES (
        '+60 kg',
        gender_label::gender,
        cub_id,
        60,
        NULL,
        false,
        null
      );
    END LOOP;
  END LOOP;
END $$;
