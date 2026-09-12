-- Migration number: 0005 	 2026-09-11T00:00:00.000Z
-- "Retired" covers too much: a bike that was sold, one that was stolen, and
-- one that just wore out are all off the road for different reasons, and the
-- first one came with money back. Status still says whether it's in service;
-- this says how it left. NULL means retired without a reason recorded.
ALTER TABLE bikes ADD COLUMN retirement_type TEXT;
