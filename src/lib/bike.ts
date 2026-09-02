export function perMileCost(bike) {
  const latestMiles = bike.MileageUpdate?.[0]?.mileage;
  if (latestMiles === undefined) return 'n/a';

  const milesSinceAcquire = latestMiles - bike.milesAtAcquire;
  // A bike logged but never ridden has no meaningful per-mile cost, and
  // dividing by it yields Infinity.
  if (milesSinceAcquire <= 0) return 'n/a';
  return '$' + (totalCost(bike) / milesSinceAcquire).toFixed(2);
}

export function totalCost(bike) {
  const eventsCost = bike.Event.reduce((acc, event) => {
    return acc + event.cost;
  }, 0);
  const componentsCost = bike.Component.reduce((acc, component) => {
    return acc + component.cost;
  }, 0);
  return bike.initialPrice + eventsCost + componentsCost;
}
