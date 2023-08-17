/** @type {import('./$types').PageData} */    export let data;
export function perMileCost(bike) {
  const latestMiles = bike.MileageUpdate[0].mileage;

  const milesSinceAcquire = latestMiles - bike.milesAtAcquire;
  return (totalCost(bike) / milesSinceAcquire).toFixed(2);
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
