import type { Bike } from '../db/read.ts';
import { perMileCost, milesRidden, day } from '../cost.ts';
import { esc, photoUrl } from './layout.ts';

/**
 * The homepage: a record-card treatment plus a mileage-share chart, reading
 * the same data as the original stats-grid UI now kept at /legacy. Self-
 * contained on purpose: its own stylesheet and font, nothing shared with
 * app.css, so it can't regress /legacy and can be lifted out by deleting
 * this file and its one route.
 */
export function showcasePage(bikes: Bike[]): string {
	// Whichever bike has the most recent mileage entry leads — a quiet "this
	// one's current" signal. Falls back to the bike record's own updated_at
	// for anything with no mileage logged yet.
	const lastRidden = (b: Bike) => b.mileage[0]?.created_at ?? b.updated_at;
	const sorted = [...bikes].sort((a, b) => lastRidden(b) - lastRidden(a));

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bikes, on record</title>
<link rel="icon" href="/favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600&display=swap" rel="stylesheet">
<style>${STYLE}</style>
</head>
<body>
<main>
	<header class="intro">
		<h1>Bikes</h1>
	</header>
	<div class="layout">
		<div class="bikes">${sorted.map(bikeCard).join('\n')}</div>
		${chartPanel(bikes)}
	</div>
	<p class="outro"><a href="/legacy">Back to the everyday view</a></p>
</main>
</body>
</html>`;
}

function bikeCard(bike: Bike): string {
	const url = photoUrl(bike);
	const retired = bike.status === 'retired';
	const photo = url
		? `<img class="plate-photo${retired ? ' retired' : ''}" src="${esc(url)}" alt="${esc(bike.brand)} ${esc(bike.model)}" loading="lazy">`
		: `<div class="plate-photo${retired ? ' retired' : ''}"></div>`;

	return `<article class="plate${retired ? ' retired' : ''}">
	<div class="plate-head">
		${photo}
		<div>
			<h2 class="plate-name">${esc(bike.name)}${retired ? ` <span class="tag">${esc(bike.retirement_type ?? 'retired')}</span>` : ''}</h2>
			<p class="plate-model">${esc(bike.brand)} ${esc(bike.model)}</p>
		</div>
	</div>
	${bike.description ? `<p class="plate-note">${esc(bike.description)}</p>` : ''}
	${specGrid(bike)}
	${footnotes(bike)}
</article>`;
}

/**
 * The numbers, as a spec sheet — reading them as a sentence felt like data
 * wearing a costume. Fields that don't apply (no parts logged, too new for a
 * per-year figure) are left out rather than shown empty.
 *
 * Three grids rather than one, each followed by whatever panels its own row
 * opens: money summary, then parts and events, then mileage. That keeps a
 * panel directly under the figure it belongs to, and keeps like with like
 * instead of filling rows three-at-a-time in whatever order they're built.
 */
function specGrid(bike: Bike): string {
	const miles = milesRidden(bike);
	const parts = bike.components.reduce((sum, c) => sum + c.cost, 0);
	const events = bike.events.reduce((sum, e) => sum + e.cost, 0);
	const total = bike.initial_price + parts + events;
	const acquired = bike.acquire_date ? day(bike.acquire_date) : null;
	const perYear = milesPerYear(bike);

	const money: string[] = [];
	if (acquired) money.push(cell('Acquired', acquired));
	money.push(
		cell(
			'Total spent',
			wholeMoney(total),
			bike.components.length || bike.events.length ? toggle('cost', bike.id) : ''
		)
	);

	const detail: string[] = [];
	if (bike.components.length) {
		detail.push(cell('Parts', wholeMoney(parts), toggle('parts', bike.id)));
	}
	if (bike.events.length) {
		detail.push(cell('Events', moneySigned(events), toggle('events', bike.id)));
	}

	const mileage: string[] = [];
	if (miles > 0) {
		mileage.push(cell('Miles', miles.toLocaleString()));
		mileage.push(cell('Per mile', perMileCost(bike)));
		if (perYear) mileage.push(cell('Per year', perYear.toLocaleString()));
	}

	return [
		grid(money),
		bike.components.length || bike.events.length
			? panel('cost', costRows(bike.initial_price, parts, events))
			: '',
		grid(detail, true),
		bike.components.length ? panel('parts', partRows(bike), wholeMoney(parts)) : '',
		bike.events.length ? panel('events', eventRows(bike), moneySigned(events)) : '',
		grid(mileage, true)
	].join('');
}

const grid = (cells: string[], continued = false) =>
	cells.length ? `<dl class="specs${continued ? ' continued' : ''}">${cells.join('')}</dl>` : '';

const cell = (label: string, value: string, extra = '') =>
	`<div class="spec"><dt>${esc(label)}</dt><dd>${esc(value)}${extra}</dd></div>`;

/**
 * A checkbox plus label rather than <details>/<summary>, because the trigger
 * has to sit inline with a figure inside a grid cell, and a <summary> only
 * works as a direct child of <details>. The kind class is what lets each
 * toggle open its own panel and no one else's.
 */
const toggle = (kind: string, bikeId: number) =>
	`<input type="checkbox" id="${kind}-${bikeId}" class="bd-toggle t-${kind}"><label for="${kind}-${bikeId}" class="bd-btn" aria-hidden="true"></label>`;

/**
 * Divs, not a table: a per-<td> background can't be styled as one seamless
 * row, and one flex row is one box. `total` is appended as a summary row when
 * given, so every panel ends the same way.
 */
function panel(kind: string, rows: string, total?: string): string {
	const summary = total ? `<div class="cost-row total"><span>Total</span><span>${total}</span></div>` : '';
	return `<div class="bd-panel p-${kind}"><div class="bd-panel-inner"><div class="cost-card">${rows}${summary}</div></div></div>`;
}

const row = (label: string, value: string, sub = '') =>
	`<div class="cost-row${sub ? ' item' : ''}"><span>${esc(label)}${sub ? `<em class="sub">${esc(sub)}</em>` : ''}</span><span>${value}</span></div>`;

/** Where "Total spent" came from: the purchase price plus what parts and
 * events added or, in the case of a sale, took back off. */
function costRows(price: number, parts: number, events: number): string {
	const rows = [row('Price', wholeMoney(price))];
	if (parts !== 0) rows.push(row('Parts', moneySigned(parts)));
	if (events !== 0) rows.push(row('Events', moneySigned(events)));
	rows.push(`<div class="cost-row total"><span>Total</span><span>${wholeMoney(price + parts + events)}</span></div>`);
	return rows.join('');
}

/** Every aftermarket part, oldest first, with what it cost and when. */
const partRows = (bike: Bike) =>
	[...bike.components]
		.sort((a, b) => a.installation_date - b.installation_date)
		.map((c) => row(c.name, moneySigned(c.cost), `${c.brand}${when(c.installation_date)}`))
		.join('');

/** Every logged event, oldest first. Plenty of them cost nothing — those are
 * still worth listing, since the point is what happened, not just the money. */
const eventRows = (bike: Bike) =>
	[...bike.events]
		.sort((a, b) => a.date - b.date)
		.map((e) => row(e.name, e.cost === 0 ? '—' : moneySigned(e.cost), when(e.date).slice(2)))
		.join('');

// A handful of rows were logged with a date of 0 rather than left null. That
// renders as 1970, which reads as a bug rather than as missing history.
const when = (seconds: number) =>
	seconds > 0
		? `, ${new Date(seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', timeZone: 'UTC' })}`
		: '';

/** A price, rounded to the dollar — the spec grid is a glance, not a receipt,
 * so cents just add noise. perMileCost stays exact; that one's a rate, not
 * a total, and rounding it would hide real differences between bikes. */
const wholeMoney = (n: number) => '$' + Math.round(n).toLocaleString();
const moneySigned = (n: number) => (n < 0 ? `−${wholeMoney(Math.abs(n))}` : wholeMoney(n));

/** The exceptional stuff a spec sheet can't hold a field for. Retirement gets
 * its own badge in the header instead of a line here. */
function footnotes(bike: Bike): string {
	const reset = resetEntry(bike);
	if (!reset) return '';
	const why = reset.note ?? 'The odometer reset once along the way';
	return `<p class="plate-footnote">${esc(why)}.</p>`;
}

/**
 * Rough lifetime average, not a recent trend — there's only ever one number
 * per bike here. Runs to retired_at rather than today for a retired bike, so
 * years of sitting unused don't dilute the rate; skipped entirely for a
 * retired bike with no retired_at, rather than guess with today's date and
 * quietly understate it. Also skipped for anything acquired too recently for
 * a year of ownership to mean much.
 */
function milesPerYear(bike: Bike): number | null {
	const miles = milesRidden(bike);
	if (miles <= 0 || !bike.acquire_date) return null;
	if (bike.status === 'retired' && !bike.retired_at) return null;
	const end = bike.retired_at ?? Date.now() / 1000;
	const years = (end - bike.acquire_date) / (365.25 * 86400);
	if (years < 0.5) return null;
	return Math.round(miles / years);
}

/** The first mileage entry, read chronologically, that reads lower than the
 * one before it — i.e. the entry an odometer reset actually happened on,
 * along with whatever note was attached to it. */
function resetEntry(bike: Bike): { note: string | null } | null {
	let prev = bike.miles_at_acquire;
	for (const m of [...bike.mileage].reverse()) {
		if (m.mileage < prev) return { note: m.note };
		prev = m.mileage;
	}
	return null;
}

// One hue at four steps, not four hues — reads as one material sliced up
// rather than a categorical rainbow. Cycles if a fifth bike ever shows up.
// Four steps of one hue, not four hues — one material sliced up rather than
// a categorical rainbow. Kept as classes rather than inline fills so the dark
// palette can restate them; cycles if a fifth bike ever shows up.
const SHARE_STEPS = 4;

/** The whole-career mileage split, as a donut plus a legend. Skipped bikes
 * with nothing logged yet — a zero-width slice has nothing to show anyway. */
function chartPanel(bikes: Bike[]): string {
	const data = bikes
		.map((b) => ({ name: b.name, miles: milesRidden(b) }))
		.filter((d) => d.miles > 0);
	const total = data.reduce((sum, d) => sum + d.miles, 0);
	if (total === 0) return '';

	const size = 220;
	const r = 84;
	const c = size / 2;
	const circumference = 2 * Math.PI * r;
	const gap = 3;
	let drawn = 0;
	const arcs = data
		.map((d, i) => {
			const len = (d.miles / total) * circumference;
			const dash = `${Math.max(len - gap, 0)} ${circumference}`;
			const arc = `<circle class="arc s${i % SHARE_STEPS}" cx="${c}" cy="${c}" r="${r}" fill="none" stroke-dasharray="${dash}" stroke-dashoffset="${(-drawn).toFixed(1)}" transform="rotate(-90 ${c} ${c})"/>`;
			drawn += len;
			return arc;
		})
		.join('');

	const legend = data
		.map(
			(d, i) => `<li>
			<span class="swatch s${i % SHARE_STEPS}"></span>
			<span class="legend-name">${esc(d.name)}</span>
			<span class="legend-miles">${d.miles.toLocaleString()} mi</span>
			<span class="legend-pct">${Math.round((d.miles / total) * 100)}%</span>
		</li>`
		)
		.join('');

	return `<div class="chart-panel">
		<p class="chart-title">Mileage, by bike</p>
		<svg viewBox="0 0 ${size} ${size}" class="donut" role="img" aria-label="Share of total mileage by bike">
			${arcs}
			<text x="${c}" y="${c - 6}" text-anchor="middle" class="donut-total">${total.toLocaleString()}</text>
			<text x="${c}" y="${c + 16}" text-anchor="middle" class="donut-caption">miles logged</text>
		</svg>
		<ul class="legend">${legend}</ul>
	</div>`;
}

const STYLE = `
:root {
	color-scheme: light dark;
	--paper: #ede9df;
	--paper-deep: #e1ddcd;
	--stripe: #ded8c2;
	--ink: #24241f;
	--muted: #6c6a5c;
	--line: #c9c4b2;
	--brass: #8a6a34;
	--sunk: rgba(36, 36, 31, 0.35);
	--photo: grayscale(65%) contrast(1.05);
	--photo-retired: grayscale(100%) contrast(1) brightness(0.94);
	--s0: #5c431c;
	--s1: #8a6a34;
	--s2: #b08f52;
	--s3: #d3bd8d;
}

/* Same document under lamplight rather than daylight: the paper darkens to a
   warm graphite, the brass warms up to hold its own against it, and the
   photos get dimmed — several are bright product shots on white, which glare
   badly against a dark ground. Everything else is token-driven and follows. */
@media (prefers-color-scheme: dark) {
	:root {
		--paper: #1a1815;
		--paper-deep: #232019;
		--stripe: #2c281f;
		--ink: #ece5d8;
		--muted: #99917f;
		--line: #3a352b;
		--brass: #b98f4e;
		--sunk: rgba(0, 0, 0, 0.5);
		--photo: grayscale(65%) contrast(1.02) brightness(0.72);
		--photo-retired: grayscale(100%) contrast(1) brightness(0.6);
		--s0: #6b4f24;
		--s1: #9a7539;
		--s2: #bd9857;
		--s3: #ddc79a;
	}
}
* { box-sizing: border-box; }
html, body { margin: 0; }
body {
	background: var(--paper);
	color: var(--ink);
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
	font-size: 16px;
	line-height: 1.6;
	-webkit-font-smoothing: antialiased;
}
main { max-width: 940px; margin: 0 auto; padding: 3rem 1.25rem 4rem; }

.intro h1 {
	font-family: "Barlow Condensed", sans-serif;
	font-weight: 600;
	font-size: clamp(3rem, 13vw, 4.5rem);
	letter-spacing: -0.01em;
	line-height: 0.9;
	margin: 0;
}

.layout { display: grid; grid-template-columns: 1fr; gap: 2.5rem; align-items: start; margin-top: 2.5rem; }
@media (min-width: 880px) {
	.layout { grid-template-columns: minmax(0, 1fr) 300px; }
}

.plate, .chart-panel { position: relative; border: 1px solid var(--line); }
.plate::before, .plate::after, .chart-panel::before, .chart-panel::after {
	content: ""; position: absolute; width: 16px; height: 16px; border: 1.5px solid var(--brass);
}
.plate::before, .chart-panel::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.plate::after, .chart-panel::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.plate { padding: 1.5rem 1.5rem 1.25rem; }
.plate + .plate { margin-top: 2rem; }
.plate.retired { opacity: 0.82; }

.plate-head { display: flex; gap: 1.25rem; align-items: flex-start; }
.plate-photo {
	width: 220px; height: 130px; flex: none; object-fit: cover;
	border: 1px solid var(--line); background: var(--paper-deep);
	filter: var(--photo);
}
.plate-photo.retired { filter: var(--photo-retired); }
.plate-name { font-family: "Barlow Condensed", sans-serif; font-weight: 600; font-size: 1.875rem; line-height: 1; margin: 0; }
.plate-model { margin: 0.4rem 0 0; color: var(--muted); font-size: 0.9rem; }
.tag {
	display: inline-block; vertical-align: middle; margin-left: 0.5rem; transform: translateY(-0.15em);
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
	font-size: 0.7rem; font-weight: 500; color: var(--muted);
	text-transform: uppercase; letter-spacing: 0.05em;
	border: 1px solid var(--line); padding: 0.15rem 0.5rem;
}

.plate-note { font-style: italic; margin: 0.9rem 0 0; }

.specs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.85rem 1.5rem; margin: 1rem 0 0; padding-top: 0.9rem; border-top: 1px solid var(--line); }
@media (min-width: 620px) { .specs { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
/* The second half of a split spec grid — picks up right after the panel, so
   it shouldn't repeat the divider that already ran above the first half. */
.specs.continued { border-top: none; padding-top: 0; margin-top: 0.85rem; }
.spec dt { margin: 0; font-size: 0.75rem; color: var(--muted); }
.spec dd { margin: 0.15rem 0 0; font-variant-numeric: tabular-nums; font-size: 0.8125rem; }

/* The "+" sits inline with the dollar figure, inside a grid cell — a
   <summary> can't go there (it only works as a direct child of <details>),
   so this is a hidden checkbox plus a label styled as the button, read by
   :has() wherever the panel needs to react to it. The panel's height still
   animates via the grid-rows trick (0fr -> 1fr), and the card inside it gets
   a deeper paper tone, an inset shadow along its top edge, and a rotateX
   tip-open — together reading as a compartment set back into the surface,
   swinging down rather than a flat reveal. */
.bd-toggle { position: absolute; opacity: 0; width: 1px; height: 1px; overflow: hidden; }
.bd-btn {
	cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
	width: 1.2em; height: 1.2em; margin-left: 0.5rem; vertical-align: middle;
	border: 1px solid var(--line); font-size: 0.7em; line-height: 1;
}
.bd-btn::before { content: "+"; }
/* Adjacent sibling, not :has() on the card: a card now holds three of these
   and each one has to answer for its own state. */
.bd-toggle:checked + .bd-btn::before { content: "\\2212"; }
.bd-toggle:focus-visible + .bd-btn { outline: 2px solid var(--brass); outline-offset: 2px; }

.bd-panel {
	display: grid; grid-template-rows: 0fr;
	/* Negative margins pull it out to the card's own edges — flush with the
	   border, rather than inset like everything else in the card. */
	transition: grid-template-rows 280ms ease; margin: 0 -1.5rem; perspective: 700px;
}
.bd-panel-inner { overflow: hidden; }

.cost-card {
	background: var(--paper-deep); padding: 0.3rem 0; margin-top: 0.85rem;
	box-shadow: inset 0 6px 10px -8px var(--sunk);
	transform-origin: top center; transform: rotateX(-24deg); opacity: 0;
	transition: transform 280ms ease, opacity 200ms ease;
}

/* Each toggle opens its own panel. The pairs have to be spelled out because
   the trigger sits up in a grid cell, nowhere near the panel it controls. */
.plate:has(.t-cost:checked) .p-cost,
.plate:has(.t-parts:checked) .p-parts,
.plate:has(.t-events:checked) .p-events { grid-template-rows: 1fr; }
.plate:has(.t-cost:checked) .p-cost .cost-card,
.plate:has(.t-parts:checked) .p-parts .cost-card,
.plate:has(.t-events:checked) .p-events .cost-card { transform: rotateX(0deg); opacity: 1; }

.cost-row {
	display: flex; justify-content: space-between; align-items: baseline; gap: 1rem;
	padding: 0.4rem 1.5rem; font-variant-numeric: tabular-nums; font-size: 0.8125rem;
}
.cost-row span:first-child { color: var(--muted); }
.cost-row.item span:first-child { color: var(--ink); }
.cost-row span:last-child { white-space: nowrap; }
.cost-row .sub { font-style: normal; opacity: 0.7; }
.cost-row .sub::before { content: " "; }
.cost-row:not(.total):nth-child(even) { background: var(--stripe); }
.cost-row.total {
	border-top: 1px solid var(--line); padding-top: 0.6rem; padding-bottom: 0.65rem;
	color: var(--ink); font-weight: 600;
}

.plate-footnote { margin: 0.85rem 0 0; font-size: 0.875rem; color: var(--muted); }

.chart-panel { padding: 1.75rem 1.5rem; }
.chart-title { margin: 0 0 1.5rem; font-family: "Barlow Condensed", sans-serif; font-weight: 600; font-size: 1.25rem; }
.donut { display: block; width: 100%; max-width: 220px; margin: 0 auto; }
.donut-total { font-family: "Barlow Condensed", sans-serif; font-weight: 600; font-size: 2.1rem; fill: var(--ink); }
.donut-caption { font-size: 0.7rem; fill: var(--muted); }

.legend { list-style: none; margin: 1.5rem 0 0; padding: 0; }
.legend li { display: flex; align-items: baseline; gap: 0.6rem; padding: 0.5rem 0; border-top: 1px solid var(--line); font-size: 0.875rem; }
.legend li:first-child { border-top: none; padding-top: 0; }
.arc { stroke-width: 22; fill: none; }
.swatch { width: 10px; height: 10px; flex: none; }
.s0 { stroke: var(--s0); background: var(--s0); }
.s1 { stroke: var(--s1); background: var(--s1); }
.s2 { stroke: var(--s2); background: var(--s2); }
.s3 { stroke: var(--s3); background: var(--s3); }
.legend-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.legend-miles, .legend-pct {
	font-variant-numeric: tabular-nums;
	color: var(--muted); white-space: nowrap;
}
.legend-pct { width: 2.6em; text-align: right; }

.outro { margin-top: 4rem; padding-top: 1.5rem; border-top: 1px solid var(--line); }
.outro a { color: var(--muted); text-decoration: underline; text-underline-offset: 3px; }
.outro a:hover { color: var(--ink); }

@media (max-width: 480px) {
	.plate { padding: 1.25rem 1.1rem; }
	.plate-head { flex-direction: column; }
	.plate-photo { width: 100%; height: 180px; }
	/* .bd-panel's flush-edge margin is sized to .plate's own padding, which
	   shrinks here — it has to match or the panel overshoots the card. */
	.bd-panel { margin: 0 -1.1rem; }
}
`;
