// Run with: node --test src/lib/bike.test.ts
import { test } from 'node:test';
import assert from 'node:assert';
import { perMileCost, totalCost } from './bike.ts';

const bike = (over = {}) => ({
  initialPrice: 100,
  milesAtAcquire: 10,
  Event: [{ cost: 20 }],
  Component: [{ cost: 30 }],
  MileageUpdate: [{ mileage: 110 }],
  ...over
});

test('totalCost sums initial price, events and components', () => {
  assert.equal(totalCost(bike()), 150);
});

test('perMileCost divides total by miles since acquire', () => {
  assert.equal(perMileCost(bike()), '$1.50'); // 150 / (110 - 10)
});

test('a bike with no mileage rows reads n/a instead of crashing', () => {
  assert.equal(perMileCost(bike({ MileageUpdate: [] })), 'n/a');
});

test('a bike that has never been ridden reads n/a instead of Infinity', () => {
  assert.equal(perMileCost(bike({ MileageUpdate: [{ mileage: 10 }] })), 'n/a');
});
