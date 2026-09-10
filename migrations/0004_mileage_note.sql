-- Migration number: 0004 	 2026-09-10T00:00:00.000Z
-- Lets a mileage entry carry a short explanation — mainly for an odometer
-- reset, where "the number went down" needs a "because" attached to it.
ALTER TABLE mileage_updates ADD COLUMN note TEXT;
