import type { Bike } from './db/read.ts';

/** Purchase price plus everything spent on it since. */
export function totalCost(bike: Bike): number {
	const events = bike.events.reduce((acc, e) => acc + e.cost, 0);
	const components = bike.components.reduce((acc, c) => acc + c.cost, 0);
	return bike.initial_price + events + components;
}

/**
 * Miles ridden since acquisition, or 0 if nothing has been logged. Walks the
 * mileage log chronologically (it's stored newest-first) and sums each
 * increasing run, so a bike computer resetting mid-life doesn't wipe out the
 * miles ridden before the reset.
 */
export function milesRidden(bike: Bike): number {
	const readings = [bike.miles_at_acquire, ...[...bike.mileage].reverse().map((m) => m.mileage)];
	let total = 0;
	let segmentStart = readings[0];
	let prev = readings[0];
	for (const reading of readings.slice(1)) {
		if (reading < prev) {
			// A drop means the odometer got reset, not ridden backwards.
			total += prev - segmentStart;
			// ponytail: assumes a reset always zeroes the odometer; if a
			// computer ever resets to some other value this undercounts the
			// gap, revisit if that turns out to happen.
			segmentStart = 0;
		}
		prev = reading;
	}
	total += prev - segmentStart;
	return Math.max(0, total);
}

/**
 * Formatted cost per mile, or 'n/a'. A bike that has been logged but never
 * ridden has no meaningful per-mile cost, and dividing by it yields Infinity.
 */
export function perMileCost(bike: Bike): string {
	const miles = milesRidden(bike);
	if (miles <= 0) return 'n/a';
	return '$' + (totalCost(bike) / miles).toFixed(2);
}

export const money = (n: number) => '$' + n.toFixed(2);

export const day = (unixSeconds: number) =>
	new Date(unixSeconds * 1000).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'UTC'
	});
