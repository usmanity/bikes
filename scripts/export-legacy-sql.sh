#!/usr/bin/env bash
# One-time: turn the legacy Prisma/SQLite DB into D1-loadable INSERTs.
# Renames columns to snake_case and converts Prisma's millisecond timestamps
# to unix seconds. Usage: ./scripts/export-legacy-sql.sh > seed.sql
set -euo pipefail
DB="${1:-prisma/bikes.db}"

sqlite3 "$DB" <<'SQL'
.mode list
.headers off
SELECT 'INSERT INTO bikes (id,name,brand,model,initial_price,photo,acquire_date,bike_type,miles_at_acquire,description,status,created_at,updated_at) VALUES ('
  || id || ',' || quote(name) || ',' || quote(brand) || ',' || quote(model) || ',' || initialPrice || ','
  || quote(photo) || ',' || COALESCE((acquireDate/1000), 'NULL') || ',' || quote(bikeType) || ',' || milesAtAcquire || ','
  || quote(description) || ',' || quote(status) || ',' || (createdAt/1000) || ',' || (updatedAt/1000) || ');'
FROM Bike ORDER BY id;

SELECT 'INSERT INTO mileage_updates (id,bike_id,mileage,created_at,updated_at) VALUES ('
  || id || ',' || bikeId || ',' || mileage || ',' || (createdAt/1000) || ',' || (updatedAt/1000) || ');'
FROM MileageUpdate ORDER BY id;

SELECT 'INSERT INTO components (id,bike_id,name,brand,cost,miles_at_install,installation_date,created_at,updated_at) VALUES ('
  || id || ',' || bikeId || ',' || quote(name) || ',' || quote(brand) || ',' || cost || ',' || milesAtInstall || ','
  || (installationDate/1000) || ',' || (createdAt/1000) || ',' || (updatedAt/1000) || ');'
FROM Component ORDER BY id;

SELECT 'INSERT INTO events (id,bike_id,name,date,cost,created_at,updated_at) VALUES ('
  || id || ',' || bikeId || ',' || quote(name) || ',' || (date/1000) || ',' || cost || ',' || (createdAt/1000) || ',' || (updatedAt/1000) || ');'
FROM Event ORDER BY id;
SQL
