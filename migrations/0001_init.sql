-- Migration number: 0001 	 2026-09-01T00:00:00.000Z
-- Ported from the Prisma/SQLite schema this app used through 2024.
-- Two deliberate changes: snake_case names, and timestamps as unix SECONDS
-- (Prisma stored milliseconds) so downstream consumers get one obvious unit.

CREATE TABLE bikes (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT    NOT NULL,
  brand            TEXT    NOT NULL,
  model            TEXT    NOT NULL,
  initial_price    REAL    NOT NULL,
  photo            TEXT,
  acquire_date     INTEGER,
  bike_type        TEXT    NOT NULL DEFAULT 'road',
  miles_at_acquire REAL    NOT NULL DEFAULT 0,
  description      TEXT,
  status           TEXT    NOT NULL DEFAULT 'active',
  created_at       INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at       INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE mileage_updates (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  bike_id    INTEGER NOT NULL REFERENCES bikes(id),
  mileage    REAL    NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE components (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  bike_id           INTEGER NOT NULL REFERENCES bikes(id),
  name              TEXT    NOT NULL,
  brand             TEXT    NOT NULL,
  cost              REAL    NOT NULL,
  miles_at_install  REAL    NOT NULL,
  installation_date INTEGER NOT NULL,
  created_at        INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at        INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  bike_id    INTEGER NOT NULL REFERENCES bikes(id),
  name       TEXT    NOT NULL,
  date       INTEGER NOT NULL,
  cost       REAL    NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- The hot read is "latest mileage for this bike", one per bike on every page.
CREATE INDEX idx_mileage_bike_created ON mileage_updates(bike_id, created_at DESC);
CREATE INDEX idx_components_bike ON components(bike_id);
CREATE INDEX idx_events_bike ON events(bike_id);
