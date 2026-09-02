import type { Bike } from '../db/read.ts';
import { totalCost, perMileCost, milesRidden, money, day } from '../cost.ts';
import { esc, page } from './layout.ts';

/**
 * Every mutation re-renders and swaps this one panel rather than patching
 * individual rows. At four bikes the extra bytes are irrelevant, and it means
 * there is exactly one code path producing the admin markup.
 */
const PANEL = 'admin-panel';

export function adminPage(bikes: Bike[], current: Bike, k: string): string {
	return page(
		`${current.name} · update`,
		`<div class="min-h-full bg-gray-800 text-white">
	<div class="fixed inset-y-0 z-50 hidden w-72 flex-col lg:flex">
		<div class="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4">
			<div class="flex h-16 shrink-0 items-center">
				<img class="h-8 w-auto" src="/app-icon.svg" alt="Bikes">
			</div>
			<nav class="flex flex-1 flex-col">
				<ul role="list" class="-mx-2 space-y-1">
					${bikes
						.map(
							(b) => `<li><a href="/update?bike=${b.id}&k=${encodeURIComponent(k)}"
						class="${b.id === current.id ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'} w-full group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold">${esc(b.name)}</a></li>`
						)
						.join('')}
				</ul>
			</nav>
		</div>
	</div>
	${adminPanel(current, k)}
</div>`,
		{ htmx: true }
	);
}

export function adminPanel(bike: Bike, k: string): string {
	const q = `?k=${encodeURIComponent(k)}&bike=${bike.id}`;
	// Every mutation posts here and replaces this whole element with the response.
	const hx = `hx-target="#${PANEL}" hx-swap="outerHTML"`;

	return `<div id="${PANEL}" class="lg:ml-72">
	<div class="flex flex-col items-start justify-between gap-x-8 gap-y-4 bg-gray-800 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
		<div>
			<div class="flex items-center gap-x-3">
				<div class="flex-none rounded-full bg-green-400 p-1 text-green-400"><div class="h-2 w-2 rounded-full bg-current"></div></div>
				<h1 class="flex gap-x-3 text-lg leading-7">
					<span class="font-semibold text-white">${esc(bike.brand)}</span>
					<span class="text-gray-600">/</span>
					<span class="font-semibold text-white">${esc(bike.model)}</span>
				</h1>
			</div>
			<p class="mt-2 text-sm leading-6 text-gray-400">${esc(bike.description)}</p>
		</div>
		<div class="order-first capitalize flex-none rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ring-indigo-400/30 sm:order-none ${
			bike.status === 'retired' ? 'bg-gray-700 text-gray-300' : 'bg-indigo-400/10 text-indigo-400'
		}">${esc(bike.status)}</div>
	</div>

	<div class="border-t border-gray-700 p-4 pt-8 shadow-inner">
		<dl class="mx-auto grid max-w-7xl grid-cols-1 gap-4 text-center lg:grid-cols-3">
			${stat('Miles ridden', milesRidden(bike).toLocaleString())}
			${stat('Total cost', money(totalCost(bike)))}
			${stat('Cost per mile', perMileCost(bike))}
		</dl>
	</div>

	<div class="bg-gray-700">
		<h2 class="px-7 pt-4 text-base font-semibold leading-6">Update this bike</h2>
		<ul role="list" class="grid grid-cols-1 gap-6 border-b border-gray-600 px-7 py-6 sm:grid-cols-3">
			${action('mileage-dlg', 'bg-green-500', 'Log mileage')}
			${action('component-dlg', 'bg-blue-500', 'Add component')}
			${action('event-dlg', 'bg-amber-500', 'Add event')}
		</ul>

		<div class="space-y-8 px-7 py-6">
			${table('Mileage', ['Reading', 'Logged'], bike.mileage.map((m) => [
				`${m.mileage.toLocaleString()} mi`,
				day(m.created_at)
			]), bike.mileage.map((m) => m.id), 'mileage', q, hx)}

			${table('Components', ['Component', 'Brand', 'Cost', 'Installed at'], bike.components.map((c) => [
				esc(c.name),
				esc(c.brand),
				money(c.cost),
				`${c.miles_at_install.toLocaleString()} mi`
			]), bike.components.map((c) => c.id), 'component', q, hx)}

			${table('Events', ['Event', 'Cost', 'Date'], bike.events.map((e) => [
				esc(e.name),
				money(e.cost),
				day(e.date)
			]), bike.events.map((e) => e.id), 'event', q, hx)}
		</div>
	</div>

	${dialog('mileage-dlg', 'Log mileage', `/update/mileage${q}`, hx, `
		${field('miles', 'Odometer reading', 'number', { step: 'any', required: true })}`)}

	${dialog('component-dlg', 'Add component', `/update/component${q}`, hx, `
		${field('name', 'Name', 'text', { required: true })}
		${field('brand', 'Brand', 'text', { required: true })}
		${field('cost', 'Cost', 'number', { step: '0.01', required: true })}`)}

	${dialog('event-dlg', 'Add event', `/update/event${q}`, hx, `
		${field('name', 'What happened', 'text', { required: true })}
		${field('cost', 'Cost', 'number', { step: '0.01' })}
		${field('date', 'Date', 'date', {})}`)}
</div>`;
}

const stat = (label: string, value: string) => `<div class="mx-auto flex max-w-xs flex-col gap-y-4">
	<dt class="text-base leading-7 text-gray-200">${label}</dt>
	<dd class="order-first text-xl font-semibold tracking-tight text-gray-100 sm:text-3xl">${value}</dd>
</div>`;

const action = (dlg: string, colour: string, label: string) => `<li class="flow-root">
	<button type="button" onclick="document.getElementById('${dlg}').showModal()"
		class="relative -m-2 flex w-full items-center space-x-4 rounded-xl p-2 text-left hover:bg-gray-500/20">
		<span class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg ${colour}"></span>
		<span class="text-sm font-medium text-white">${label}</span>
	</button>
</li>`;

function table(
	title: string,
	headers: string[],
	rows: string[][],
	ids: number[],
	kind: string,
	q: string,
	hx: string
): string {
	if (rows.length === 0) {
		return `<section><h3 class="text-sm font-semibold text-gray-200">${title}</h3>
			<p class="mt-2 text-sm text-gray-400">Nothing recorded yet.</p></section>`;
	}
	return `<section>
	<h3 class="text-sm font-semibold text-gray-200">${title}</h3>
	<div class="mt-2 overflow-x-auto">
	<table class="min-w-full divide-y divide-gray-600 text-sm">
		<thead><tr>${headers.map((h) => `<th class="py-2 pr-4 text-left font-medium text-gray-300">${h}</th>`).join('')}<th class="sr-only">Delete</th></tr></thead>
		<tbody class="divide-y divide-gray-600/50">
			${rows
				.map(
					(cells, i) => `<tr>${cells.map((c) => `<td class="py-2 pr-4 text-gray-100">${c}</td>`).join('')}
				<td class="py-2 text-right">
					<button ${hx} hx-post="/update/delete${q}&kind=${kind}&id=${ids[i]}"
						hx-confirm="Delete this ${kind} entry?"
						class="text-xs text-red-400 hover:text-red-300">Delete</button>
				</td></tr>`
				)
				.join('')}
		</tbody>
	</table>
	</div>
</section>`;
}

function dialog(id: string, title: string, action: string, hx: string, fields: string): string {
	return `<dialog id="${id}" class="rounded-lg bg-gray-900 p-0 text-white backdrop:bg-black/50">
	<form method="dialog" class="absolute right-3 top-3"><button class="text-gray-400 hover:text-white" aria-label="Close">&times;</button></form>
	<form ${hx} hx-post="${action}" class="w-80 space-y-4 p-6">
		<h3 class="text-base font-semibold">${title}</h3>
		${fields}
		<button type="submit" class="w-full rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold hover:bg-indigo-400">Save</button>
	</form>
</dialog>`;
}

function field(
	name: string,
	label: string,
	type: string,
	attrs: Record<string, string | boolean>
): string {
	const extra = Object.entries(attrs)
		.map(([k, v]) => (v === true ? k : `${k}="${esc(v)}"`))
		.join(' ');
	return `<label class="block">
		<span class="text-sm text-gray-300">${label}</span>
		<input name="${name}" type="${type}" ${extra}
			class="mt-1 block w-full rounded-md border-0 bg-gray-800 py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-700 focus:ring-2 focus:ring-indigo-500 sm:text-sm">
	</label>`;
}
