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
			<h2 class="plate-name">${esc(bike.name)}${retired ? ' <span class="tag">Retired</span>' : ''}</h2>
			<p class="plate-model">${esc(bike.brand)} ${esc(bike.model)}</p>
		</div>
	</div>
	${bike.description ? `<p class="plate-note">${esc(bike.description)}</p>` : ''}
	${specGrid(bike)}
	${footnotes(bike)}
</article>`;
}

/** The numbers, as a spec sheet — reading them as a sentence felt like data
 * wearing a costume. Fields that don't apply (too new for a per-year figure)
 * are left out rather than shown empty. Total spent carries its own toggle
 * for the breakdown panel, so the cell is built by hand rather than through
 * the generic label/value loop the other fields use. */
function specGrid(bike: Bike): string {
	const miles = milesRidden(bike);
	const parts = bike.components.reduce((sum, c) => sum + c.cost, 0);
	const other = bike.events.reduce((sum, e) => sum + e.cost, 0);
	const total = bike.initial_price + parts + other;
	const acquired = bike.acquire_date ? day(bike.acquire_date) : null;
	const perYear = milesPerYear(bike);
	const hasBreakdown = parts > 0 || other !== 0;
	const toggleId = `bd-${bike.id}`;

	const cell = (label: string, value: string) =>
		`<div class="spec"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;

	const totalCell = `<div class="spec">
		<dt>Total spent</dt>
		<dd>${wholeMoney(total)}${
			hasBreakdown
				? `<input type="checkbox" id="${toggleId}" class="bd-toggle"><label for="${toggleId}" class="bd-btn" aria-hidden="true"></label>`
				: ''
		}</dd>
	</div>`;

	// Split across two grids rather than one, so the breakdown panel can sit
	// right under the money row instead of below everything — and so money
	// (Acquired, Total spent) and mileage (Miles, Per mile, Per year) each
	// get their own line instead of mixing on whichever row has room.
	const primary: string[] = [];
	if (acquired) primary.push(cell('Acquired', acquired));
	primary.push(totalCell);

	const secondary: string[] = [];
	if (miles > 0) {
		secondary.push(cell('Miles', miles.toLocaleString()));
		secondary.push(cell('Per mile', perMileCost(bike)));
		if (perYear) secondary.push(cell('Per year', perYear.toLocaleString()));
	}

	const panel = hasBreakdown ? breakdownPanel(bike.initial_price, parts, other) : '';
	const secondaryGrid = secondary.length ? `<dl class="specs continued">${secondary.join('')}</dl>` : '';
	return `<dl class="specs">${primary.join('')}</dl>${panel}${secondaryGrid}`;
}

/**
 * What "Total spent" is made of — the purchase price plus whatever parts and
 * events (repairs, memberships, a sale) added or took back off. A checkbox
 * plus label rather than <details>/<summary>, because the trigger has to sit
 * inline with the dollar figure inside a grid cell, and a <summary> only
 * works as a direct child of <details>. Only called when there's more than
 * one line to show — a breakdown of one number isn't a breakdown.
 */
function breakdownPanel(price: number, parts: number, other: number): string {
	const rows: [string, number][] = [['Price', price]];
	if (parts > 0) rows.push(['Parts', parts]);
	if (other !== 0) rows.push(['Other', other]);

	const total = price + parts + other;
	// Divs, not a table: a per-<td> box-shadow can never look seamless across
	// a row, because it's two independent boxes each shadowing their own
	// edges. One flex row is one box, so the "Total" row's shadow has nowhere
	// to leave a seam.
	const rowHtml = rows
		.map(([label, value]) => `<div class="cost-row"><span>${label}</span><span>${moneySigned(value)}</span></div>`)
		.join('');

	return `<div class="bd-panel"><div class="bd-panel-inner"><div class="cost-card">
		${rowHtml}
		<div class="cost-row total"><span>Total</span><span>${wholeMoney(total)}</span></div>
	</div></div></div>`;
}

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
const SHARE_COLORS = ['#5c431c', '#8a6a34', '#b08f52', '#d3bd8d'];

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
			const arc = `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${SHARE_COLORS[i % SHARE_COLORS.length]}" stroke-width="22" stroke-dasharray="${dash}" stroke-dashoffset="${(-drawn).toFixed(1)}" transform="rotate(-90 ${c} ${c})"/>`;
			drawn += len;
			return arc;
		})
		.join('');

	const legend = data
		.map(
			(d, i) => `<li>
			<span class="swatch" style="background:${SHARE_COLORS[i % SHARE_COLORS.length]}"></span>
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
	--paper: #ede9df;
	--paper-deep: #e1ddcd;
	--stripe: #ded8c2;
	--ink: #24241f;
	--muted: #6c6a5c;
	--line: #c9c4b2;
	--brass: #8a6a34;
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
main { max-width: 940px; margin: 0 auto; padding: 4rem 1.25rem 5rem; }

.intro h1 {
	font-family: "Barlow Condensed", sans-serif;
	font-weight: 600;
	font-size: clamp(3rem, 13vw, 4.5rem);
	letter-spacing: -0.01em;
	line-height: 0.9;
	margin: 0;
}

.layout { display: grid; grid-template-columns: 1fr; gap: 3rem; align-items: start; margin-top: 3rem; }
@media (min-width: 880px) {
	.layout { grid-template-columns: minmax(0, 1fr) 300px; }
}

.plate, .chart-panel { position: relative; border: 1px solid var(--line); }
.plate::before, .plate::after, .chart-panel::before, .chart-panel::after {
	content: ""; position: absolute; width: 16px; height: 16px; border: 1.5px solid var(--brass);
}
.plate::before, .chart-panel::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.plate::after, .chart-panel::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }

.plate { padding: 1.75rem 1.5rem 1.5rem; }
.plate + .plate { margin-top: 2.5rem; }
.plate.retired { opacity: 0.82; }

.plate-head { display: flex; gap: 1.25rem; align-items: flex-start; }
.plate-photo {
	width: 220px; height: 130px; flex: none; object-fit: cover;
	border: 1px solid var(--line); background: var(--paper-deep);
	filter: grayscale(65%) contrast(1.05);
}
.plate-photo.retired { filter: grayscale(100%) contrast(1) brightness(0.94); }
.plate-name { font-family: "Barlow Condensed", sans-serif; font-weight: 600; font-size: 1.875rem; line-height: 1; margin: 0; }
.plate-model { margin: 0.4rem 0 0; color: var(--muted); font-size: 0.9rem; }
.tag {
	display: inline-block; vertical-align: middle; margin-left: 0.5rem; transform: translateY(-0.15em);
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
	font-size: 0.7rem; font-weight: 500; color: var(--muted);
	text-transform: uppercase; letter-spacing: 0.05em;
	border: 1px solid var(--line); padding: 0.15rem 0.5rem;
}

.plate-note { font-style: italic; margin: 1.1rem 0 0; }

.specs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.1rem 1.5rem; margin: 1.25rem 0 0; padding-top: 1.1rem; border-top: 1px solid var(--line); }
@media (min-width: 620px) { .specs { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
/* The second half of a split spec grid — picks up right after the panel, so
   it shouldn't repeat the divider that already ran above the first half. */
.specs.continued { border-top: none; padding-top: 0; }
.spec dt { margin: 0; font-size: 0.75rem; color: var(--muted); }
.spec dd { margin: 0.2rem 0 0; font-variant-numeric: tabular-nums; font-size: 0.8125rem; }

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
.plate:has(.bd-toggle:checked) .bd-btn::before { content: "\\2212"; }
.bd-toggle:focus-visible + .bd-btn { outline: 2px solid var(--brass); outline-offset: 2px; }

.bd-panel {
	display: grid; grid-template-rows: 0fr;
	/* Negative margins pull it out to the card's own edges — flush with the
	   border, rather than inset like everything else in the card. */
	transition: grid-template-rows 280ms ease; margin: 1.1rem -1.5rem 0; perspective: 700px;
}
.plate:has(.bd-toggle:checked) .bd-panel { grid-template-rows: 1fr; }
.bd-panel-inner { overflow: hidden; }

.cost-card {
	background: var(--paper-deep); padding: 0.4rem 0;
	box-shadow: inset 0 6px 10px -8px rgba(36, 36, 31, 0.35);
	transform-origin: top center; transform: rotateX(-24deg); opacity: 0;
	transition: transform 280ms ease, opacity 200ms ease;
}
.plate:has(.bd-toggle:checked) .cost-card { transform: rotateX(0deg); opacity: 1; }
.cost-row {
	display: flex; justify-content: space-between; align-items: baseline;
	padding: 0.55rem 1.5rem; font-variant-numeric: tabular-nums; font-size: 0.8125rem;
}
.cost-row span:first-child { color: var(--muted); }
.cost-row:not(.total):nth-child(even) { background: var(--stripe); }
.cost-row.total {
	border-top: 1px solid var(--line); padding-top: 0.75rem; padding-bottom: 0.85rem;
	color: var(--ink); font-weight: 600;
}

.plate-footnote { margin: 1rem 0 0; font-size: 0.875rem; color: var(--muted); }

.chart-panel { padding: 1.75rem 1.5rem; }
.chart-title { margin: 0 0 1.5rem; font-family: "Barlow Condensed", sans-serif; font-weight: 600; font-size: 1.25rem; }
.donut { display: block; width: 100%; max-width: 220px; margin: 0 auto; }
.donut-total { font-family: "Barlow Condensed", sans-serif; font-weight: 600; font-size: 2.1rem; fill: var(--ink); }
.donut-caption { font-size: 0.7rem; fill: var(--muted); }

.legend { list-style: none; margin: 1.5rem 0 0; padding: 0; }
.legend li { display: flex; align-items: baseline; gap: 0.6rem; padding: 0.5rem 0; border-top: 1px solid var(--line); font-size: 0.875rem; }
.legend li:first-child { border-top: none; padding-top: 0; }
.swatch { width: 10px; height: 10px; flex: none; }
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
	.bd-panel { margin: 1.1rem -1.1rem 0; }
}
`;
