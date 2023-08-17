<script>
	import { browser } from '$app/environment';
	import { totalCost, perMileCost } from '$lib/bike';
	export let data;
	let urlParams;
	if (browser) {
		urlParams = new URLSearchParams(window.location.search);
	}
	let bikeId = urlParams?.get('bikeId') || 1;
	let currentBike = data.bikes[bikeId - 1];
	let showMileageModal = false;
	let newMiles = 0;
	let showComponentModal;
	let showEventModal;

	function formatDate(dateString) {
		const options = { year: 'numeric', month: 'long', day: 'numeric' };
		const date = new Date(dateString);
		return date.toLocaleDateString(undefined, options);
	}

	function deleteComponent(id) {
		fetch(`?/deleteComponent&id=${id}?bikeId={currentBike.id}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.type === 'success') {
					currentBike.Component = currentBike.Component.filter((comp) => comp.id !== id);
				}
			});
	}
	function deleteEvent(id) {
		fetch(`?/deleteEvent&id=${id}?bikeId={currentBike.id}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.type === 'success') {
					currentBike.Event = currentBike.Event.filter((comp) => comp.id !== id);
				}
			});
	}

	function deleteMileage(id) {
		fetch(`?/deleteMileageUpdate&id=${id}?bikeId={currentBike.id}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.type === 'success') {
					currentBike.MileageUpdate = currentBike.MileageUpdate.filter((comp) => comp.id !== id);
				}
			});
	}
</script>

<div>
	<div class="fixed inset-y-0 z-50 flex w-72 flex-col">
		<div class="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4">
			<div class="flex h-16 shrink-0 items-center">
				<img class="h-8 w-auto" src="/app-icon.svg" alt="Your Company" />
			</div>
			<nav class="flex flex-1 flex-col">
				<ul role="list" class="flex flex-1 flex-col gap-y-7">
					<li>
						<ul role="list" class="-mx-2 space-y-1">
							{#each data.bikes as bike}
								<li>
									<!-- Current: "bg-gray-800 text-white", Default: "text-gray-400 hover:text-white hover:bg-gray-800" -->
									<button
										on:click={() => (currentBike = bike)}
										class="w-full text-gray-400 hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
									>
										{bike.name}
									</button>
								</li>
							{/each}
						</ul>
					</li>

					<li class="mt-auto">
						<button
							class="group w-full -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white"
						>
							<svg
								class="h-6 w-6 shrink-0"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
							Settings
						</button>
					</li>
				</ul>
			</nav>
		</div>
	</div>
	<div class="mx-auto max-w-7xl ml-72">
		<div
			class="flex flex-col items-start justify-between gap-x-8 gap-y-4 bg-gray-800 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8"
		>
			<div>
				<div class="flex items-center gap-x-3">
					<div class="flex-none rounded-full bg-green-400 p-1 text-green-400">
						<div class="h-2 w-2 rounded-full bg-current" />
					</div>
					<h1 class="flex gap-x-3 text-lg leading-7">
						<span class="font-semibold text-white">{currentBike.brand}</span>
						<span class="text-gray-600">/</span>
						<span class="font-semibold text-white">{currentBike.model}</span>
					</h1>
				</div>
				<p class="mt-2 text-sm leading-6 text-gray-400">{currentBike.description}</p>
			</div>
			<div
				class="order-first capitalize flex-none rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ring-indigo-400/30 sm:order-none {currentBike.status ===
				'retired'
					? 'bg-gray-700 text-gray-300'
					: 'bg-indigo-400/10 text-indigo-400'}"
			>
				{currentBike.status}
			</div>
		</div>
	</div>
	<div class="mx-auto max-w-full ml-72 bg-gray-800 text-white">
		<div class="p-4 pt-8 border-t border-gray-700 shadow-inner">
			<div class="mx-auto max-w-7xl">
				<dl class="grid grid-cols-1 gap-x-4 gap-y-4 text-center lg:grid-cols-3">
					<div class="mx-auto flex max-w-xs flex-col gap-y-4">
						<dt class="text-base leading-7 text-gray-200">Miles ridden</dt>
						<dd class="order-first text-xl font-semibold tracking-tight text-gray-100 sm:text-3xl">
							{currentBike.MileageUpdate[0].mileage}
						</dd>
					</div>
					<div class="mx-auto flex max-w-xs flex-col gap-y-4">
						<dt class="text-base leading-7 text-gray-200">Total cost</dt>
						<dd class="order-first text-xl font-semibold tracking-tight text-gray-100 sm:text-3xl">
							${totalCost(currentBike).toFixed(2)}
						</dd>
					</div>
					<div class="mx-auto flex max-w-xs flex-col gap-y-4">
						<dt class="text-base leading-7 text-gray-200">Cost per mile</dt>
						<dd class="order-first text-xl font-semibold tracking-tight text-gray-100 sm:text-3xl">
							${perMileCost(currentBike)}
						</dd>
					</div>
				</dl>
			</div>
		</div>
	</div>
	<div class="mx-auto max-w-7xl ml-72 bg-gray-700 text-white">
		<div class="mx-auto">
			<h2 class="text-base font-semibold leading-6 px-7 pt-4">Update this bike</h2>

			<ul
				role="list"
				class="px-7 grid grid-cols-1 gap-6 border-b border-gray-600 py-6 sm:grid-cols-3"
			>
				<li class="flow-root">
					<div
						class="relative -m-2 flex items-center space-x-4 rounded-xl p-2 focus-within:ring-2 hover:bg-gray-500/20"
					>
						<div
							class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-green-500"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="w-6 h-6"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
								/>
							</svg>
						</div>
						<div>
							<h3 class="text-sm font-medium">
								<button class="focus:outline-none" on:click={() => (showMileageModal = true)}>
									<span class="absolute inset-0" aria-hidden="true" />
									<span>Update mileage</span>
									<span aria-hidden="true"> &rarr;</span>
								</button>
							</h3>
							<p class="mt-1 text-sm text-gray-400">Add miles</p>
						</div>
					</div>
				</li>
				<li class="flow-root">
					<div
						class="relative -m-2 flex items-center space-x-4 rounded-xl p-2 focus-within:ring-2 hover:bg-gray-500/20"
					>
						<div
							class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-pink-500"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="w-6 h-6"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M4.867 19.125h.008v.008h-.008v-.008z"
								/>
							</svg>
						</div>
						<div>
							<h3 class="text-sm font-medium">
								<button class="focus:outline-none" on:click={() => (showComponentModal = true)}>
									<span class="absolute inset-0" aria-hidden="true" />
									<span>Add a component</span>
									<span aria-hidden="true"> &rarr;</span>
								</button>
							</h3>
							<p class="mt-1 text-sm text-gray-400">Bike parts, replacements, upgrades, etc.</p>
						</div>
					</div>
				</li>
				<li class="flow-root">
					<div
						class="relative -m-2 flex items-center space-x-4 rounded-xl p-2 focus-within:ring-2 hover:bg-gray-500/20"
					>
						<div
							class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-500"
						>
							<svg
								class="h-6 w-6 text-white"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
								/>
							</svg>
						</div>
						<div>
							<h3 class="text-sm font-medium">
								<button class="focus:outline-none" on:click={() => (showEventModal = true)}>
									<span class="absolute inset-0" aria-hidden="true" />
									<span>Add an event</span>
									<span aria-hidden="true"> &rarr;</span>
								</button>
							</h3>
							<p class="mt-1 text-sm text-gray-400">Changes to bike, updates, and other events.</p>
						</div>
					</div>
				</li>
			</ul>
		</div>
	</div>
	<div class="mx-auto max-w-7xl ml-72 bg-gray-700 p-4 text-white flex">
		<div class="mx-auto max-w-2xl w-full">
			<div class="mx-auto px-4">Mileage Updates</div>
			<div class="mt-2 flow-root">
				<div class="overflow-x-auto sm:-mx-2 lg:-mx-4">
					<div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
						<div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
							<table class="min-w-full divide-y divide-gray-700">
								<thead class="bg-gray-900 text-white">
									<tr>
										<th
											scope="col"
											class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-100 sm:pl-6"
											>Miles</th
										>
										<th
											scope="col"
											class="px-3 py-3.5 text-left text-sm font-semibold text-gray-100">Date</th
										>
										<th
											scope="col"
											class="px-1 py-3.5 text-left text-sm font-semibold text-gray-100"
										/>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-700 bg-gray-800">
									{#each currentBike.MileageUpdate as update}
										<tr class="group">
											<td
												class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-100 sm:pl-6"
												>{update.mileage}</td
											>
											<td class="whitespace-nowrap px-3 py-4 text-sm text-gray-200"
												>{formatDate(update.createdAt)}</td
											>
											<td
												class="cursor-pointer whitespace-nowrap pr-3 py-4 w-8 text-sm text-gray-200"
											>
												<span class="invisible group-hover:visible"
													><button
														type="button"
														on:click={() => deleteMileage(update.id)}
														class="rounded-md bg-red-400 px-3.5 py-2.5 text-sm font-semibold text-gray-100 shadow-sm hover:bg-red-600 hover:text-white"
														><svg
															xmlns="http://www.w3.org/2000/svg"
															fill="none"
															viewBox="0 0 24 24"
															stroke-width="1.5"
															stroke="currentColor"
															class="w-6 h-6"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
															/>
														</svg>
													</button></span
												>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="mx-auto max-w-2xl w-full">
			<div class="mx-auto px-4">Events</div>
			<div class="mt-2 flow-root">
				<div class="overflow-x-auto sm:-mx-2 lg:-mx-4">
					<div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
						<div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
							<table class="min-w-full divide-y divide-gray-700">
								<thead class="bg-gray-900 text-white">
									<tr>
										<th
											scope="col"
											class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-100 sm:pl-6"
											>Event</th
										>
										<th
											scope="col"
											class="px-3 py-3.5 text-left text-sm font-semibold text-gray-100">Cost</th
										>
										<th
											scope="col"
											class="px-3 py-3.5 text-left text-sm font-semibold text-gray-100">Date</th
										>
										<th
											scope="col"
											class="px-1 py-3.5 text-left text-sm font-semibold text-gray-100"
										/>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-700 bg-gray-800">
									{#each currentBike.Event as update}
										<tr class="group">
											<td
												class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-100 sm:pl-6"
												>{update.name}</td
											>
											<td class="whitespace-nowrap px-3 py-4 text-sm text-gray-200"
												>${update.cost.toFixed(2)}</td
											>
											<td class="whitespace-nowrap px-3 py-4 text-sm text-gray-200"
												>{formatDate(update.createdAt)}</td
											>
											<td
												class="cursor-pointer whitespace-nowrap pr-3 py-4 w-8 text-sm text-gray-200"
											>
												<span class="invisible group-hover:visible"
													><button
														type="button"
														on:click={() => deleteEvent(update.id)}
														class="rounded-md bg-red-400 px-3.5 py-2.5 text-sm font-semibold text-gray-100 shadow-sm hover:bg-red-600 hover:text-white"
														><svg
															xmlns="http://www.w3.org/2000/svg"
															fill="none"
															viewBox="0 0 24 24"
															stroke-width="1.5"
															stroke="currentColor"
															class="w-6 h-6"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
															/>
														</svg>
													</button></span
												>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="mx-auto max-w-7xl ml-72 bg-gray-700 min-h-screen p-4 text-white flex">
		<div class="mx-auto w-full">
			<div class="mx-auto px-4">Components</div>
			<div class="mt-2 flow-root">
				<div class="overflow-x-auto sm:-mx-2 lg:-mx-4">
					<div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
						<div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
							<table class="min-w-full divide-y divide-gray-700">
								<thead class="bg-gray-900 text-white">
									<tr>
										<th
											scope="col"
											class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-100 sm:pl-6"
											>Component Name</th
										>
										<th
											scope="col"
											class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-100 sm:pl-6"
											>Brand</th
										>
										<th
											scope="col"
											class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-100 sm:pl-6"
											>Cost</th
										>
										<th
											scope="col"
											class="px-3 py-3.5 text-left text-sm font-semibold text-gray-100">Date</th
										>
										<th
											scope="col"
											class="px-1 py-3.5 text-left text-sm font-semibold text-gray-100"
										/>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-700 bg-gray-800">
									{#each currentBike.Component as comp}
										<tr class="group">
											<td
												class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-100 sm:pl-6"
												>{comp.name}</td
											>
											<td
												class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-100 sm:pl-6"
												>{comp.brand}</td
											>
											<td
												class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-100 sm:pl-6"
												>${comp.cost}</td
											>
											<td class="whitespace-nowrap px-3 py-4 text-sm text-gray-200"
												>{formatDate(comp.createdAt)}</td
											>
											<td
												class="cursor-pointer whitespace-nowrap pr-3 py-4 w-8 text-sm text-gray-200"
											>
												<span class="invisible group-hover:visible"
													><button
														type="button"
														on:click={() => deleteComponent(comp.id)}
														class="rounded-md bg-red-400 px-3.5 py-2.5 text-sm font-semibold text-gray-100 shadow-sm hover:bg-red-600 hover:text-white"
														><svg
															xmlns="http://www.w3.org/2000/svg"
															fill="none"
															viewBox="0 0 24 24"
															stroke-width="1.5"
															stroke="currentColor"
															class="w-6 h-6"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
															/>
														</svg>
													</button></span
												>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	{#if showMileageModal}
		<div>
			<div class="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
				<form method="POST" action="?/updateMiles&bikeId={currentBike.id}">
					<input type="hidden" name="bikeId" value={currentBike.id} />
					<div class="fixed inset-0 z-10 overflow-y-auto">
						<div
							class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
						>
							<div
								class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
							>
								<div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
									<div class="sm:flex sm:items-start">
										<div
											class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												stroke="currentColor"
												stroke-width="1.5"
												class="w-6 h-6"
												viewBox="0 0 24 24"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-5.94-2.28m5.94 2.28-2.28 5.941"
												/></svg
											>
										</div>
										<div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
											<h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
												Add miles for "{currentBike.name}"
											</h3>
											<div>
												<div class="relative mt-2 rounded-md shadow-sm w-full">
													<input
														type="text"
														name="miles"
														id="miles"
														class="block w-full rounded-md border-0 py-1.5 pr-12 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
														placeholder="0.00"
														aria-describedby="miles-ridden"
														bind:value={newMiles}
													/>
													<div
														class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
													>
														<span class="text-gray-500 sm:text-sm" id="price-currency">miles</span>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
									<button
										type="submit"
										class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
										>Add miles</button
									>
									<button
										on:click={() => (showMileageModal = false)}
										type="button"
										class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
										>Cancel</button
									>
								</div>
							</div>
						</div>
					</div>
				</form>
			</div>
		</div>
	{/if}

	{#if showComponentModal}
		<div>
			<div class="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
				<form method="POST" action="?/addComponent&bikeId={currentBike.id}">
					<input type="hidden" name="bikeId" value={currentBike.id} />
					<div class="fixed inset-0 z-10 overflow-y-auto">
						<div
							class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
						>
							<div
								class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
							>
								<div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
									<div class="sm:flex sm:items-start">
										<div
											class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												stroke="currentColor"
												stroke-width="1.5"
												class="w-6 h-6"
												viewBox="0 0 24 24"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-5.94-2.28m5.94 2.28-2.28 5.941"
												/></svg
											>
										</div>
										<div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
											<h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
												Add component for "{currentBike.name}"
											</h3>
											<div>
												<div class="relative mt-2 rounded-md shadow-sm w-full">
													<div class="mt-2 flex rounded-md shadow-sm">
														<span
															class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 px-3 text-gray-500 sm:text-sm"
															>Name</span
														>
														<input
															type="text"
															name="name"
															id="name"
															class="block w-full min-w-0 flex-1 rounded-none rounded-r-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
															placeholder="GX Eagle"
															autocomplete="off"
														/>
													</div>
													<div class="mt-2 flex rounded-md shadow-sm">
														<span
															class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 px-3 text-gray-500 sm:text-sm"
															>Brand</span
														>
														<input
															type="text"
															name="brand"
															id="brand"
															class="block w-full min-w-0 flex-1 rounded-none rounded-r-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
															placeholder="SRAM"
															autocomplete="off"
														/>
													</div>
													<div class="mt-2 flex rounded-md shadow-sm">
														<span
															class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 px-3 text-gray-500 sm:text-sm"
															>Cost</span
														>
														<input
															type="text"
															name="cost"
															id="cost"
															class="block w-full min-w-0 flex-1 rounded-none rounded-r-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
															placeholder="28.50"
															autocomplete="off"
														/>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
									<button
										type="submit"
										class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
										>Add component</button
									>
									<button
										on:click={() => (showComponentModal = false)}
										type="button"
										class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
										>Cancel</button
									>
								</div>
							</div>
						</div>
					</div>
				</form>
			</div>
		</div>
	{/if}

	{#if showEventModal}
		<div>
			<div class="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
				<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
				<form method="POST" action="?/addEvent&bikeId={currentBike.id}">
					<input type="hidden" name="bikeId" value={currentBike.id} />
					<div class="fixed inset-0 z-10 overflow-y-auto">
						<div
							class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
						>
							<div
								class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
							>
								<div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
									<div class="sm:flex sm:items-start">
										<div
											class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												stroke="currentColor"
												stroke-width="1.5"
												class="w-6 h-6"
												viewBox="0 0 24 24"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-5.94-2.28m5.94 2.28-2.28 5.941"
												/></svg
											>
										</div>
										<div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
											<h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
												Add event for "{currentBike.name}"
											</h3>
											<div>
												<div class="relative mt-2 rounded-md shadow-sm w-full">
													<div class="mt-2 flex rounded-md shadow-sm">
														<span
															class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 px-3 text-gray-500 sm:text-sm"
															>Name</span
														>
														<input
															type="text"
															name="name"
															id="name"
															class="block w-full min-w-0 flex-1 rounded-none rounded-r-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
															placeholder="Maintenance"
															autocomplete="off"
														/>
													</div>

													<div class="mt-2 flex rounded-md shadow-sm">
														<span
															class="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 px-3 text-gray-500 sm:text-sm"
															>Cost</span
														>
														<input
															type="text"
															name="cost"
															id="cost"
															class="block w-full min-w-0 flex-1 rounded-none rounded-r-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
															placeholder="43.25"
															autocomplete="off"
														/>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
									<button
										type="submit"
										class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
										>Add event</button
									>
									<button
										on:click={() => (showEventModal = false)}
										type="button"
										class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
										>Cancel</button
									>
								</div>
							</div>
						</div>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
