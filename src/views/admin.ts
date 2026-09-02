import type { Bike, ComponentRow, EventRow, MileageRow } from '../db/read.ts';
import { totalCost, perMileCost, milesRidden, money, day } from '../cost.ts';
import { esc, page, photoUrl } from './layout.ts';

/**
 * Built phone-first: this is where the bike actually gets updated, usually
 * one-handed in a garage. Everything is reachable without horizontal scroll,
 * tap targets are at least 44px, and bike switching lives in a sticky tab bar
 * rather than the old sidebar, which was hidden entirely below `lg`.
 */
const PANEL = 'admin-panel';

// shadcn-ish dark tokens, kept in one place so the surfaces stay consistent.
const CARD = 'rounded-xl border border-zinc-800 bg-zinc-900';
const MUTED = 'text-zinc-400';
const BTN =
	'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800 active:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400';

export function adminPage(bikes: Bike[], current: Bike, k: string): string {
	return page(
		`${current.name} · update`,
		`<div class="min-h-full bg-zinc-950 text-zinc-50">${adminPanel(bikes, current, k)}</div>`,
		{ htmx: true, scripts: ['/photo-upload.js'] }
	);
}

export function adminPanel(bikes: Bike[], current: Bike, k: string): string {
	const q = `?k=${encodeURIComponent(k)}&bike=${current.id}`;
	const hx = `hx-target="#${PANEL}" hx-swap="outerHTML"`;

	return `<div id="${PANEL}">
	<header class="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur">
		<div class="mx-auto flex max-w-3xl items-center justify-between px-4 pt-3">
			<span class="text-sm font-semibold tracking-tight">Update</span>
			<a href="/" class="text-sm ${MUTED} hover:text-zinc-100">View site &rarr;</a>
		</div>
		${tabs(bikes, current, k, hx)}
	</header>

	<main class="mx-auto max-w-3xl space-y-6 px-4 py-5 pb-24">
		<section class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<div class="flex items-baseline gap-2">
					<h1 class="truncate text-xl font-semibold tracking-tight">${esc(current.name)}</h1>
					<span class="shrink-0 rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] capitalize ${MUTED}">${esc(current.status)}</span>
				</div>
				<p class="mt-1 text-sm ${MUTED}">${esc(current.brand)} ${esc(current.model)}</p>
				${current.description ? `<p class="mt-2 text-sm ${MUTED}">${esc(current.description)}</p>` : ''}
			</div>
			<button type="button" onclick="document.getElementById('bike-dlg').showModal()"
				class="${BTN} shrink-0 px-3">${ICON.pencil}Edit</button>
		</section>

		<section class="grid grid-cols-3 gap-2">
			${metric('Miles', milesRidden(current).toLocaleString())}
			${metric('Total', money(totalCost(current)))}
			${metric('Per mile', perMileCost(current))}
		</section>

		${photoCard(current, q, hx)}

		<section class="grid grid-cols-1 gap-2 sm:grid-cols-3">
			${actionBtn('mileage-dlg', 'Log mileage', ICON.gauge)}
			${actionBtn('component-dlg', 'Add part', ICON.wrench)}
			${actionBtn('event-dlg', 'Add event', ICON.calendar)}
		</section>

		${list('Mileage', current.mileage, q, hx, 'mileage', (m: MileageRow) => ({
			title: `${m.mileage.toLocaleString()} mi`,
			sub: day(m.created_at),
			right: ''
		}))}

		${list('Components', current.components, q, hx, 'component', (c: ComponentRow) => ({
			title: esc(c.name),
			sub: `${esc(c.brand)} &middot; at ${c.miles_at_install.toLocaleString()} mi`,
			right: money(c.cost)
		}))}

		${list('Events', current.events, q, hx, 'event', (e: EventRow) => ({
			title: esc(e.name),
			sub: day(e.date),
			right: e.cost > 0 ? money(e.cost) : ''
		}))}
	</main>

	${sheet('bike-dlg', 'Edit bike', `/update/bike${q}`, hx,
		field('name', 'Name', 'text', { required: true, value: current.name }) +
		field('brand', 'Brand', 'text', { required: true, value: current.brand }) +
		field('model', 'Model', 'text', { required: true, value: current.model }) +
		textarea('description', 'Description', current.description ?? '') +
		select('status', 'Status', ['active', 'retired'], current.status) +
		select('bike_type', 'Type', ['road', 'e-bike', 'motorcycle'], current.bike_type) +
		field('initial_price', 'Initial price', 'number', { step: '0.01', required: true, inputmode: 'decimal', value: String(current.initial_price) }) +
		field('miles_at_acquire', 'Miles at acquisition', 'number', { step: 'any', inputmode: 'decimal', value: String(current.miles_at_acquire) }) +
		field('photo', 'Photo path', 'text', { value: current.photo ?? '' }) +
		field('acquire_date', 'Acquired', 'date', { value: isoDay(current.acquire_date) }))}

	${sheet('mileage-dlg', 'Log mileage', `/update/mileage${q}`, hx,
		field('miles', 'Odometer reading', 'number', { step: 'any', required: true, inputmode: 'decimal' }))}

	${sheet('component-dlg', 'Add component', `/update/component${q}`, hx,
		field('name', 'Name', 'text', { required: true }) +
		field('brand', 'Brand', 'text', { required: true }) +
		field('cost', 'Cost', 'number', { step: '0.01', required: true, inputmode: 'decimal' }))}

	${sheet('event-dlg', 'Add event', `/update/event${q}`, hx,
		field('name', 'What happened', 'text', { required: true }) +
		field('cost', 'Cost', 'number', { step: '0.01', inputmode: 'decimal' }) +
		field('date', 'Date', 'date', {}))}
</div>`;
}

/**
 * Upload posts straight to the Worker rather than through htmx, because the
 * file is swapped for a downscaled copy first. photo-upload.js intercepts the
 * submit; without JS the form still posts the original and the server caps it.
 */
function photoCard(bike: Bike, q: string, hx: string): string {
	const src = photoUrl(bike);
	return `<section class="${CARD} overflow-hidden">
	<div class="aspect-video w-full bg-zinc-950">
		${
			src
				? `<img src="${esc(src)}" alt="${esc(bike.name)}" class="h-full w-full object-cover">`
				: `<div class="flex h-full items-center justify-center text-sm ${MUTED}">No photo yet</div>`
		}
	</div>
	<form data-photo-form action="/update/photo${q}" method="post" enctype="multipart/form-data"
		class="flex items-center gap-2 border-t border-zinc-800 p-3">
		<input type="file" name="photo" accept="image/*" required
			class="min-w-0 flex-1 text-xs ${MUTED} file:mr-3 file:min-h-9 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:text-xs file:font-medium file:text-zinc-100">
		<button type="submit" class="${BTN} shrink-0 px-3 text-xs">Upload</button>
		${
			bike.photo_version
				? `<button type="button" ${hx} hx-post="/update/photo/remove${q}" hx-confirm="Remove this photo?"
			class="${BTN} shrink-0 px-3 text-xs">Remove</button>`
				: ''
		}
	</form>
	<p data-photo-error class="px-3 pb-3 text-xs text-red-400 empty:hidden"></p>
</section>`;
}

/** Horizontally scrollable so four names never wrap or squash on a phone. */
function tabs(bikes: Bike[], current: Bike, k: string, hx: string): string {
	return `<nav class="mx-auto max-w-3xl overflow-x-auto px-4 pb-3 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
		<div class="inline-flex gap-1 rounded-lg bg-zinc-900 p-1">
			${bikes
				.map((b) => {
					const active = b.id === current.id;
					return `<button ${hx}
						hx-get="/update/panel?k=${encodeURIComponent(k)}&bike=${b.id}"
						hx-push-url="/update?k=${encodeURIComponent(k)}&bike=${b.id}"
						class="min-h-9 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ${
							active ? 'bg-zinc-800 text-zinc-50 shadow-sm' : 'text-zinc-400 hover:text-zinc-100'
						}">${esc(b.name)}</button>`;
				})
				.join('')}
		</div>
	</nav>`;
}

/** Tremor-style KPI: quiet label, prominent figure. */
const metric = (label: string, value: string) => `<div class="${CARD} px-3 py-3">
	<p class="text-[11px] uppercase tracking-wide ${MUTED}">${label}</p>
	<p class="mt-1 truncate text-lg font-semibold tabular-nums sm:text-2xl">${value}</p>
</div>`;

const actionBtn = (dlg: string, label: string, icon: string) =>
	`<button type="button" onclick="document.getElementById('${dlg}').showModal()" class="${BTN} w-full">${icon}${label}</button>`;

/**
 * Rows rather than a table: a four-column table forces horizontal scrolling on
 * a phone. Long histories collapse behind a native <details> so the mileage
 * log does not bury the rest of the page.
 */
function list<T extends { id: number }>(
	title: string,
	rows: T[],
	q: string,
	hx: string,
	kind: string,
	shape: (row: T) => { title: string; sub: string; right: string }
): string {
	const head = `<div class="mb-2 flex items-baseline justify-between">
		<h2 class="text-sm font-semibold">${title}</h2>
		<span class="text-xs ${MUTED}">${rows.length}</span>
	</div>`;

	if (rows.length === 0) {
		return `<section>${head}<div class="${CARD} px-4 py-6 text-center text-sm ${MUTED}">Nothing recorded yet.</div></section>`;
	}

	const item = (row: T) => {
		const { title: t, sub, right } = shape(row);
		return `<li class="flex items-center gap-3 px-4 py-3">
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-medium text-zinc-100">${t}</p>
				<p class="truncate text-xs ${MUTED}">${sub}</p>
			</div>
			${right ? `<span class="shrink-0 text-sm tabular-nums text-zinc-300">${right}</span>` : ''}
			<button ${hx} hx-post="/update/delete${q}&kind=${kind}&id=${row.id}"
				hx-confirm="Delete this entry?"
				aria-label="Delete"
				class="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-red-400">${ICON.trash}</button>
		</li>`;
	};

	const VISIBLE = 5;
	const shown = rows.slice(0, VISIBLE);
	const rest = rows.slice(VISIBLE);

	return `<section>${head}
	<div class="${CARD} overflow-hidden">
		<ul class="divide-y divide-zinc-800">${shown.map(item).join('')}</ul>
		${
			rest.length
				? `<details class="group border-t border-zinc-800">
			<summary class="flex min-h-11 cursor-pointer list-none items-center justify-center text-sm ${MUTED} hover:text-zinc-100">
				<span class="group-open:hidden">Show ${rest.length} more</span>
				<span class="hidden group-open:inline">Show less</span>
			</summary>
			<ul class="divide-y divide-zinc-800 border-t border-zinc-800">${rest.map(item).join('')}</ul>
		</details>`
				: ''
		}
	</div>
</section>`;
}

/**
 * A bottom sheet on phones. The field area scrolls and the submit button is
 * pinned, so a ten-field form cannot push Save off the top of the screen.
 */
function sheet(id: string, title: string, action: string, hx: string, fields: string): string {
	return `<dialog id="${id}" class="border border-zinc-800 bg-zinc-900 p-0 text-zinc-50">
	<div class="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3">
		<h3 class="text-sm font-semibold">${title}</h3>
		<form method="dialog"><button class="flex h-9 w-9 items-center justify-center rounded-md ${MUTED} hover:bg-zinc-800 hover:text-zinc-100" aria-label="Close">${ICON.x}</button></form>
	</div>
	<form ${hx} hx-post="${action}">
		<div class="space-y-4 px-4 py-4">${fields}</div>
		<div class="sticky bottom-0 border-t border-zinc-800 bg-zinc-900 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
			<button type="submit" class="min-h-11 w-full rounded-lg bg-zinc-50 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white active:bg-zinc-200">Save</button>
		</div>
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
		.map(([key, v]) => (v === true ? key : `${key}="${esc(v)}"`))
		.join(' ');
	return `<label class="block">
		<span class="text-xs ${MUTED}">${label}</span>
		<input name="${name}" type="${type}" ${extra}
			class="mt-1 block min-h-11 w-full rounded-lg border-zinc-700 bg-zinc-950 text-base text-zinc-50 placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-0">
	</label>`;
}

const textarea = (name: string, label: string, value: string) => `<label class="block">
	<span class="text-xs ${MUTED}">${label}</span>
	<textarea name="${name}" rows="3"
		class="mt-1 block w-full rounded-lg border-zinc-700 bg-zinc-950 text-base text-zinc-50 focus:border-zinc-500 focus:ring-0">${esc(value)}</textarea>
</label>`;

const select = (name: string, label: string, options: string[], chosen: string) => `<label class="block">
	<span class="text-xs ${MUTED}">${label}</span>
	<select name="${name}"
		class="mt-1 block min-h-11 w-full rounded-lg border-zinc-700 bg-zinc-950 text-base capitalize text-zinc-50 focus:border-zinc-500 focus:ring-0">
		${options.map((o) => `<option value="${esc(o)}"${o === chosen ? ' selected' : ''}>${esc(o)}</option>`).join('')}
	</select>
</label>`;

/** <input type="date"> wants YYYY-MM-DD, and an empty string when unset. */
const isoDay = (unixSeconds: number | null) =>
	unixSeconds ? new Date(unixSeconds * 1000).toISOString().slice(0, 10) : '';

// Inline so there is no icon dependency and no extra request.
const ICON = {
	gauge: `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" d="M12 14v-4m0 4a2 2 0 100-4 2 2 0 000 4zm9 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
	wrench: `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M11.4 6.6a4 4 0 105.5 5.2l3.6 3.6a2 2 0 01-2.8 2.8l-3.6-3.6a4 4 0 01-5.2-5.5L6 7l-2-2 2-2 2 2 1.4 1.6z"/></svg>`,
	calendar: `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M8 3v3m8-3v3M4 9h16M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1z"/></svg>`,
	trash: `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M6 7h12M10 11v5m4-5v5M7 7l1 12a1 1 0 001 1h6a1 1 0 001-1l1-12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`,
	pencil: `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 4.5l3 3L8 19H5v-3L16.5 4.5z"/></svg>`,
	x: `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>`
};
