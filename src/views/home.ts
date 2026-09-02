import type { Bike } from '../db/read.ts';
import { totalCost, perMileCost, milesRidden, money } from '../cost.ts';
import { esc, page, photoUrl } from './layout.ts';

/** The public view. Read-only, and deliberately ships no JavaScript. */
export function homePage(bikes: Bike[]): string {
	return page(
		'Bikes',
		`<div class="bg-stone-50 dark:bg-stone-950 dark:text-white antialiased min-h-full">
	<div class="mx-auto max-w-2xl pt-12 sm:px-6 sm:py-16 lg:max-w-7xl lg:px-8">
		<div class="space-y-2 px-4 sm:flex sm:items-baseline sm:justify-between sm:space-y-0 sm:px-0">
			<h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-neutral-100 sm:text-3xl">Bikes</h1>
		</div>
		<div class="mt-6 space-y-8">
			${bikes.map(bikeCard).join('\n')}
		</div>
	</div>
</div>`
	);
}

function bikeCard(bike: Bike): string {
	return `<div class="border-b border-t border-gray-200 dark:border-stone-600/30 dark:hover:border-stone-600/60 bg-white dark:bg-stone-900 shadow-sm sm:rounded-lg sm:border transition-all duration-500">
	<div class="px-4 py-6 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:p-8">
		<div class="sm:flex lg:col-span-7">
			<div class="aspect-video w-full flex-shrink-0 overflow-hidden rounded-lg bg-stone-200 dark:bg-stone-800 sm:aspect-none sm:w-64">
				${
					photoUrl(bike)
						? `<img src="${esc(photoUrl(bike))}" alt="A photo of my ${esc(bike.brand)} bike" loading="lazy"
					class="h-full w-full object-cover object-center dark:brightness-50 dark:hover:brightness-90 transition-all duration-500 ease-in-out dark:blur-[0.3px] dark:hover:blur-none">`
						: ''
				}
			</div>
			<div class="mt-6 sm:ml-6 sm:mt-0">
				<h3 class="text-base font-medium text-gray-900 dark:text-stone-50">${esc(bike.brand)} ${esc(bike.model)}</h3>
				<p class="mt-2 text-sm font-medium text-gray-900 dark:text-stone-50">&ldquo;${esc(bike.name)}&rdquo;</p>
				<p class="mt-3 text-sm text-gray-500 dark:text-stone-200">${esc(bike.description)}</p>
			</div>
		</div>
		<div class="mt-6 lg:col-span-5 lg:mt-0">
			<dl class="grid grid-cols-2 gap-x-6 text-sm">
				<div>
					<dt class="font-medium text-gray-900 dark:text-stone-300">Costs</dt>
					<dd class="mt-3 text-zinc-500 dark:text-zinc-400">
						<span class="block">Initial: ${money(bike.initial_price)}</span>
						<span class="block">Total estimate: ${money(totalCost(bike))}</span>
						<span class="block">Per mile: ${perMileCost(bike)}</span>
					</dd>
				</div>
				<div>
					<dt class="font-medium text-gray-900 dark:text-stone-300">Mileage</dt>
					<dd class="mt-3 space-y-3 text-zinc-500 dark:text-zinc-400">
						<p>${milesRidden(bike).toLocaleString()} miles</p>
					</dd>
				</div>
			</dl>
		</div>
	</div>
</div>`;
}
