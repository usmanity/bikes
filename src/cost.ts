import type { Bike } from './db/read.ts';

/** Purchase price plus everything spent on it since. */
export function totalCost(bike: Bike): number {
	const events = bike.events.reduce((acc, e) => acc + e.cost, 0);
	const components = bike.components.reduce((acc, c) => acc + c.cost, 0);
	return bike.initial_price + events + components;
}

/** Miles ridden since acquisition, or 0 if nothing has been logged. */
export function milesRidden(bike: Bike): number {
	const latest = bike.mileage[0]?.mileage;
	if (latest === undefined) return 0;
	return Math.max(0, latest - bike.miles_at_acquire);
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
