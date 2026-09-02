-- Migration number: 0002 	 2026-09-02T00:00:00.000Z
-- Photos live in their own table so `SELECT * FROM bikes` never drags image
-- bytes through the Worker. One current photo per bike; re-uploading replaces
-- it. `bikes.photo` stays as the fallback path to a file in public/.
CREATE TABLE bike_photos (
  bike_id    INTEGER PRIMARY KEY REFERENCES bikes(id),
  mime       TEXT    NOT NULL,
  bytes      BLOB    NOT NULL,
  byte_size  INTEGER NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
