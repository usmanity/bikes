<script>
    /** @type {import('./$types').PageData} */    export let data;
    function perMileCost(bike) {
      const latestMiles = bike.MileageUpdate[0].mileage;
      
      const milesSinceAcquire = latestMiles - bike.milesAtAcquire;
      return (totalCost(bike) / milesSinceAcquire).toFixed(2);
    }

    function totalCost(bike) {
      const eventsCost = bike.Event.reduce((acc, event) => {
        return acc + event.cost;
      }, 0);
      const componentsCost = bike.Component.reduce((acc, component) => {
        return acc + component.cost;
      }, 0);
      return bike.initialPrice + eventsCost + componentsCost;
    }
</script>


<div class="bg-gray-50">
  <div class="mx-auto max-w-2xl pt-12 sm:px-6 sm:py-16 lg:max-w-7xl lg:px-8">
    <div class="space-y-2 px-4 sm:flex sm:items-baseline sm:justify-between sm:space-y-0 sm:px-0">
      <div class="flex sm:items-baseline sm:space-x-4">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Bikes</h1>
      </div>
    </div>

    <div class="mt-6">
      <div class="space-y-8">
  {#each data.bikes as bike}
  <div class="border-b border-t border-gray-200 bg-white shadow-sm sm:rounded-lg sm:border">
    <div class="px-4 py-6 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:p-8">
      <div class="sm:flex lg:col-span-7">
        <div class="aspect-video w-full flex-shrink-0 overflow-hidden rounded-lg sm:aspect-none sm:w-64">
          <img src="{bike.photo}" alt="A photo of my {bike.brand} bike" class="h-full w-full object-cover object-center sm:h-full sm:w-full">
        </div>

        <div class="mt-6 sm:ml-6 sm:mt-0">
          <h3 class="text-base font-medium text-gray-900">
            {bike.brand} {bike.model}
          </h3>
          <p class="mt-2 text-sm font-medium text-gray-900">“{bike.name}”</p>
          <p class="mt-3 text-sm text-gray-500">{bike.description}</p>
        </div>
      </div>

      <div class="mt-6 lg:col-span-5 lg:mt-0">
        <dl class="grid grid-cols-2 gap-x-6 text-sm">
          <div>
            <dt class="font-medium text-gray-900">Costs</dt>
            <dd class="mt-3 text-gray-500">
              <span class="block">Initial: ${bike.initialPrice}</span>
              <span class="block">Total estimate: ${totalCost(bike).toFixed(2)}</span>
              <span class="block">Per mile: ${perMileCost(bike)}</span>
            </dd>
          </div>
          <div>
            <dt class="font-medium text-gray-900">Mileage</dt>
            <dd class="mt-3 space-y-3 text-gray-500">
              <p>{bike.MileageUpdate[0] ? bike.MileageUpdate[0].mileage - bike.milesAtAcquire : '0'} miles</p>
            
            </dd>
          </div>
        </dl>
      </div>
    </div>

  </div>
  {/each}
</div>
</div>


</div>
</div>
