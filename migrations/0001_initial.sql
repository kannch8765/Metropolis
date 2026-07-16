CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  ward_id TEXT NOT NULL,
  languages_json TEXT NOT NULL DEFAULT '[]',
  audiences_json TEXT NOT NULL DEFAULT '[]',
  accessibility_tags_json TEXT NOT NULL DEFAULT '[]',
  start_at TEXT,
  end_at TEXT,
  cost_type TEXT,
  source_url TEXT NOT NULL,
  source_updated_at TEXT NOT NULL,
  ingested_at TEXT NOT NULL
);

CREATE INDEX resources_kind_idx ON resources(kind);
CREATE INDEX resources_ward_idx ON resources(ward_id);
CREATE INDEX resources_location_idx ON resources(latitude, longitude);

CREATE TABLE ward_metrics (
  ward_id TEXT PRIMARY KEY,
  resource_count INTEGER NOT NULL,
  language_count INTEGER NOT NULL,
  resources_per_1000_foreign_residents REAL,
  computed_at TEXT NOT NULL
);
