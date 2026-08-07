-- External / registry club name from CSV imports (e.g. tournament entries).
ALTER TABLE fighters
  ADD COLUMN IF NOT EXISTS affiliation_name TEXT;

CREATE INDEX IF NOT EXISTS idx_fighters_affiliation ON fighters(affiliation_name)
  WHERE affiliation_name IS NOT NULL;
