import { listBikes, exportAll } from './db/read.ts';
import {
	addMileage,
	addComponent,
	addEvent,
	remove,
	updateBike,
	type Deletable
} from './db/write.ts';
import { homePage } from './views/home.ts';
import { adminPage, adminPanel } from './views/admin.ts';
import { html } from './views/layout.ts';

export interface Env {
	DB: D1Database;
	ADMIN_TOKEN: string;
	ASSETS: Fetcher;
}

export default {
	async fetch(request, env) {
		return await handle(request, env).catch(
			(err) => new Response((err as Error).stack, { status: 500 })
		);
	}
} satisfies ExportedHandler<Env>;

const notFound = () => new Response('Not found', { status: 404 });

/**
 * Callers get a 404 rather than a 401, so a gated path cannot be told apart
 * from a bad one. The !ADMIN_TOKEN clause comes first so that an unset secret
 * in production rejects everything instead of failing open.
 */
const authorised = (url: URL, env: Env) =>
	Boolean(env.ADMIN_TOKEN) && url.searchParams.get('k') === env.ADMIN_TOKEN;

async function handle(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);

	if (url.pathname === '/') {
		return html(homePage(await listBikes(env.DB)));
	}

	// Same token as the admin surface. The consumer is a scheduled job that
	// pulls the whole dataset, so it holds the token like any other client.
	if (url.pathname === '/api/export') {
		if (!authorised(url, env)) return notFound();
		return Response.json(await exportAll(env.DB));
	}

	if (url.pathname === '/update' || url.pathname.startsWith('/update/')) {
		if (!authorised(url, env)) return notFound();
		return await handleAdmin(request, url, env);
	}

	return env.ASSETS.fetch(request);
}

async function handleAdmin(request: Request, url: URL, env: Env): Promise<Response> {
	const k = env.ADMIN_TOKEN;
	const bikeId = Number(url.searchParams.get('bike'));

	if (url.pathname === '/update' || url.pathname === '/update/panel') {
		const bikes = await listBikes(env.DB);
		if (bikes.length === 0) return html('<p>No bikes yet.</p>');
		const current = bikes.find((b) => b.id === bikeId) ?? bikes[0];
		// /update/panel is the tab bar swapping bikes without a full reload.
		return html(
			url.pathname === '/update/panel'
				? adminPanel(bikes, current, k)
				: adminPage(bikes, current, k)
		);
	}

	if (request.method !== 'POST') return notFound();
	if (!Number.isInteger(bikeId)) return new Response('Bad bike id', { status: 400 });

	// Deletes carry no body at all, and a bodyless formData() throws rather
	// than returning empty, so every mutation would 500 before validating.
	const form = await request.formData().catch(() => new FormData());
	const str = (name: string) => String(form.get(name) ?? '').trim();
	const num = (name: string) => Number(form.get(name));

	switch (url.pathname) {
		case '/update/mileage': {
			const miles = num('miles');
			if (!Number.isFinite(miles) || miles < 0) return new Response('Bad mileage', { status: 400 });
			await addMileage(env.DB, bikeId, miles);
			break;
		}
		case '/update/component': {
			const name = str('name');
			const brand = str('brand');
			const cost = num('cost');
			if (!name || !brand || !Number.isFinite(cost)) return new Response('Bad component', { status: 400 });
			await addComponent(env.DB, bikeId, name, brand, cost);
			break;
		}
		case '/update/event': {
			const name = str('name');
			if (!name) return new Response('Bad event', { status: 400 });
			const cost = Number.isFinite(num('cost')) ? num('cost') : 0;
			const date = str('date');
			const seconds = date ? Math.floor(Date.parse(date + 'T00:00:00Z') / 1000) : nowSeconds();
			if (!Number.isFinite(seconds)) return new Response('Bad date', { status: 400 });
			await addEvent(env.DB, bikeId, name, cost, seconds);
			break;
		}
		case '/update/bike': {
			const name = str('name');
			const brand = str('brand');
			const model = str('model');
			const price = num('initial_price');
			const acquired = str('acquire_date');
			if (!name || !brand || !model || !Number.isFinite(price)) {
				return new Response('Bad bike', { status: 400 });
			}
			await updateBike(env.DB, bikeId, {
				name,
				brand,
				model,
				description: str('description') || null,
				status: str('status') === 'retired' ? 'retired' : 'active',
				bike_type: str('bike_type') || 'road',
				initial_price: price,
				miles_at_acquire: Number.isFinite(num('miles_at_acquire')) ? num('miles_at_acquire') : 0,
				photo: str('photo') || null,
				acquire_date: acquired ? Math.floor(Date.parse(acquired + 'T00:00:00Z') / 1000) : null
			});
			break;
		}
		case '/update/delete': {
			const kind = url.searchParams.get('kind') as Deletable | null;
			const id = Number(url.searchParams.get('id'));
			if (!kind || !DELETABLE_KINDS.includes(kind) || !Number.isInteger(id)) {
				return new Response('Bad delete', { status: 400 });
			}
			await remove(env.DB, kind, id);
			break;
		}
		default:
			return notFound();
	}

	// Re-render the panel the request came from; htmx swaps it into place.
	const bikes = await listBikes(env.DB);
	const current = bikes.find((b) => b.id === bikeId);
	if (!current) return new Response('Bike not found', { status: 404 });
	return html(adminPanel(bikes, current, k));
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

const DELETABLE_KINDS: Deletable[] = ['component', 'event', 'mileage'];
