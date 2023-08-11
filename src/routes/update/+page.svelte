<script>
	export let data;

	let currentBike = data.bikes[0];
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
	<div class="mx-auto max-w-7xl ml-72 bg-gray-700 min-h-screen p-4 text-white">
		<div class="mx-auto px-4">
			<h2 class="text-base font-semibold leading-6">Update this bike</h2>

			<ul
				role="list"
				class="mt-6 grid grid-cols-1 gap-6 border-b border-t border-gray-600 py-6 sm:grid-cols-3"
			>
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
								<button class="focus:outline-none">
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
								<button class="focus:outline-none">
									<span class="absolute inset-0" aria-hidden="true" />
									<span>Add an event</span>
									<span aria-hidden="true"> &rarr;</span>
								</button>
							</h3>
							<p class="mt-1 text-sm text-gray-400">Changes to bike, updates, and other events.</p>
						</div>
					</div>
				</li>
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
								<button class="focus:outline-none">
									<span class="absolute inset-0" aria-hidden="true" />
									<span>Update mileage</span>
									<span aria-hidden="true"> &rarr;</span>
								</button>
							</h3>
							<p class="mt-1 text-sm text-gray-400">Add miles</p>
						</div>
					</div>
				</li>
			</ul>
		</div>
	</div>
</div>
