import { listBikes, exportAll, readPhoto } from './db/read.ts';
import {
	addMileage,
	addComponent,
	addEvent,
	remove,
	updateBike,
	setPhoto,
	removePhoto,
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

	if (url.pathname.startsWith('/photos/')) {
		return await servePhoto(url, env);
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

/** 2 MB is generous for a downscaled photo and small for a raw camera file. */
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

async function servePhoto(url: URL, env: Env): Promise<Response> {
	const id = Number(url.pathname.slice('/photos/'.length));
	if (!Number.isInteger(id)) return notFound();

	const row = await readPhoto(env.DB, id);
	if (!row) return notFound();

	// D1 hands blobs back as a number array in some runtimes and an
	// ArrayBuffer in others, so normalise before constructing the body.
	const body = Array.isArray(row.bytes) ? new Uint8Array(row.bytes) : row.bytes;

	return new Response(body, {
		headers: {
			'content-type': row.mime,
			// The URL carries ?v=<updated_at>, so a given URL is immutable and
			// a new upload produces a new one.
			'cache-control': url.searchParams.has('v')
				? 'public, max-age=31536000, immutable'
				: 'public, max-age=60'
		}
	});
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

	// Handled before the shared formData parse below, which would otherwise
	// buffer the upload a second time.
	if (url.pathname === '/update/photo') return await handlePhotoUpload(request, env, bikeId, k);

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
		case '/update/photo/remove': {
			await removePhoto(env.DB, bikeId);
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

async function handlePhotoUpload(
	request: Request,
	env: Env,
	bikeId: number,
	k: string
): Promise<Response> {
	const form = await request.formData().catch(() => new FormData());
	const file = form.get('photo');

	if (!(file instanceof File) || file.size === 0) {
		return new Response('No file received', { status: 400 });
	}
	if (!file.type.startsWith('image/')) {
		return new Response('Only image files are accepted', { status: 400 });
	}
	if (file.size > MAX_PHOTO_BYTES) {
		return new Response('Image is larger than 2MB', { status: 413 });
	}

	await setPhoto(env.DB, bikeId, file.type, await file.arrayBuffer());

	const bikes = await listBikes(env.DB);
	const current = bikes.find((b) => b.id === bikeId);
	if (!current) return new Response('Bike not found', { status: 404 });
	return html(adminPanel(bikes, current, k));
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

const DELETABLE_KINDS: Deletable[] = ['component', 'event', 'mileage'];
