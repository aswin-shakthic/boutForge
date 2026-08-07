-- Backfill bracket names to include birth-year ranges from linked age categories.
-- Matches app formatFixtureBracketName(): "Cub 1 male 16-18 kg (2020/2021)"

UPDATE brackets AS b
SET name = trim(
  ac.name
  || ' '
  || coalesce(b.gender, wc.gender)::text
  || ' '
  || wc.name
  || ' ('
  || least(ac.birth_year_from, ac.birth_year_to)::text
  || '/'
  || greatest(ac.birth_year_from, ac.birth_year_to)::text
  || ')'
)
FROM age_categories AS ac,
     weight_classes AS wc
WHERE b.age_category_id = ac.id
  AND b.weight_class_id = wc.id
  AND ac.birth_year_from IS NOT NULL
  AND ac.birth_year_to IS NOT NULL
  AND coalesce(b.gender, wc.gender) IS NOT NULL;
