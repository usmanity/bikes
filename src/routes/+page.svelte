<script>
	/** @type {import('./$types').PageData} */ export let data;
	import { totalCost, perMileCost } from '$lib/bike';
</script>

<div class="bg-stone-50 dark:bg-stone-950 dark:text-white antialiased">
	<div class="mx-auto max-w-2xl pt-12 sm:px-6 sm:py-16 lg:max-w-7xl lg:px-8">
		<div class="space-y-2 px-4 sm:flex sm:items-baseline sm:justify-between sm:space-y-0 sm:px-0">
			<div class="flex sm:items-baseline sm:space-x-4">
				<h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-neutral-100 sm:text-3xl">Bikes</h1>
			</div>
		</div>

		<div class="mt-6">
			<div class="space-y-8">
				{#each data.bikes as bike}
					<div class="border-b border-t border-gray-200 dark:border-stone-600/30 dark:hover:border-stone-600/60 
					bg-white dark:bg-stone-900 shadow-sm sm:rounded-lg sm:border transition-all duration-500">
						<div class="px-4 py-6 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:p-8">
							<div class="sm:flex lg:col-span-7">
								<div
									class="aspect-video w-full flex-shrink-0 overflow-hidden rounded-lg sm:aspect-none sm:w-64"
								>
									<img
										src={bike.photo}
										alt="A photo of my {bike.brand} bike"
										class="h-full w-full object-cover object-center sm:h-full sm:w-full
										dark:brightness-50 dark:hover:brightness-90 transition-all duration-500 ease-in-out
										dark:blur-[0.3px] dark:hover:blur-none"
									/>
								</div>

								<div class="mt-6 sm:ml-6 sm:mt-0">
									<h3 class="text-base font-medium text-gray-900 dark:text-stone-50">
										{bike.brand}
										{bike.model}
									</h3>
									<p class="mt-2 text-sm font-medium text-gray-900 dark:text-stone-50">“{bike.name}”</p>
									<p class="mt-3 text-sm text-gray-500 dark:text-stone-200">{bike.description}</p>
								</div>
							</div>

							<div class="mt-6 lg:col-span-5 lg:mt-0">
								<dl class="grid grid-cols-2 gap-x-6 text-sm">
									<div>
										<dt class="font-medium text-gray-900 dark:text-stone-300">Costs</dt>
										<dd class="mt-3 text-zinc-500 dark:text-zinc-400">
											<span class="block">Initial: ${bike.initialPrice}</span>
											<span class="block">Total estimate: ${totalCost(bike).toFixed(2)}</span>
											<span class="block">Per mile: ${perMileCost(bike)}</span>
										</dd>
									</div>
									<div>
										<dt class="font-medium text-gray-900 dark:text-stone-300">Mileage</dt>
										<dd class="mt-3 space-y-3 text-zinc-500 dark:text-zinc-400">
											<p>
												{bike.MileageUpdate[0]
													? bike.MileageUpdate[0].mileage - bike.milesAtAcquire
													: '0'} miles
											</p>
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
