// Run with: node --test src/cost.test.ts
import { test } from 'node:test';
import assert from 'node:assert';
import { perMileCost, totalCost, milesRidden } from './cost.ts';

const bike = (over = {}) =>
	({
		initial_price: 100,
		miles_at_acquire: 10,
		events: [{ cost: 20 }],
		components: [{ cost: 30 }],
		mileage: [{ mileage: 110 }],
		...over
	}) as never;

test('totalCost sums initial price, events and components', () => {
	assert.equal(totalCost(bike()), 150);
});

test('milesRidden subtracts the odometer reading at acquisition', () => {
	assert.equal(milesRidden(bike()), 100);
});

test('perMileCost divides total by miles ridden', () => {
	assert.equal(perMileCost(bike()), '$1.50');
});

test('a bike with no mileage rows reads n/a instead of crashing', () => {
	assert.equal(perMileCost(bike({ mileage: [] })), 'n/a');
});

test('a bike that has never been ridden reads n/a instead of Infinity', () => {
	assert.equal(perMileCost(bike({ mileage: [{ mileage: 10 }] })), 'n/a');
});
