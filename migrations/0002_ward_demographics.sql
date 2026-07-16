CREATE TABLE ward_demographics (
  ward_id TEXT PRIMARY KEY,
  foreign_residents INTEGER NOT NULL CHECK (foreign_residents >= 0),
  reference_date TEXT NOT NULL,
  source_url TEXT NOT NULL,
  ingested_at TEXT NOT NULL
);

CREATE INDEX ward_demographics_reference_date_idx
  ON ward_demographics(reference_date);
