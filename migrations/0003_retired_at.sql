-- Migration number: 0003 	 2026-09-10T00:00:00.000Z
-- Status alone ("retired") has no date attached, so anything computing a
-- rate since acquisition (miles per year) has to run all the way to today
-- even for a bike retired years ago. This records when, so that math can
-- stop where the bike's life actually did.
ALTER TABLE bikes ADD COLUMN retired_at INTEGER;
