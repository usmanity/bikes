<script>
    /** @type {import('./$types').PageData} */    export let data;
    function perMileCost(bike) {
      const totalCost = bike.initialPrice; // TODO more here
      const latestMiles = bike.MileageUpdate[0].mileage;
      const milesSinceAcquire = latestMiles - bike.milesAtAcquire;
      return (totalCost / milesSinceAcquire).toFixed(2);
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
        <div class="aspect-h-1 aspect-w-1 w-full flex-shrink-0 overflow-hidden rounded-lg sm:aspect-none sm:h-40 sm:w-40">
          <img src="{bike.photo}" alt="A photo of my {bike.brand} bike" class="h-full w-full object-cover object-center sm:h-full sm:w-full">
        </div>

        <div class="mt-6 sm:ml-6 sm:mt-0">
          <h3 class="text-base font-medium text-gray-900">
            {bike.name}
          </h3>
          <p class="mt-2 text-sm font-medium text-gray-900">{bike.brand} {bike.model}</p>
          <p class="mt-3 text-sm text-gray-500">{bike.description}</p>
        </div>
      </div>

      <div class="mt-6 lg:col-span-5 lg:mt-0">
        <dl class="grid grid-cols-2 gap-x-6 text-sm">
          <div>
            <dt class="font-medium text-gray-900">Costs</dt>
            <dd class="mt-3 text-gray-500">
              <span class="block">Initial: ${bike.initialPrice.toFixed(2)}</span>
              <span class="block">Total estimate: TODO</span>
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

    <!-- <div class="border-t border-gray-200 px-4 py-6 sm:px-6 lg:p-8">
      <h4 class="sr-only">Status</h4>
      <p class="text-sm font-medium text-gray-900">Preparing to ship on <time datetime="2021-03-24">March 24, 2021</time></p>
      <div class="mt-6" aria-hidden="true">
        <div class="overflow-hidden rounded-full bg-gray-200">
          <div class="h-2 rounded-full bg-indigo-600" style="width: calc((1 * 2 + 1) / 8 * 100%)"></div>
        </div>
        <div class="mt-6 hidden grid-cols-4 text-sm font-medium text-gray-600 sm:grid">
          <div class="text-indigo-600">Order placed</div>
          <div class="text-center text-indigo-600">Processing</div>
          <div class="text-center">Shipped</div>
          <div class="text-right">Delivered</div>
        </div>
      </div>
    </div> -->
  </div>
  {/each}
</div>
</div>


</div>
</div>
