// Every mutation the update page performs. Nothing else writes to the store.
//
// This file is the seam. Writes go to D1 today; if they later go somewhere
// else, or sync to another database, this is the only file that changes —
// read.ts and the routes stay as they are.

/** Latest recorded mileage for a bike, or 0 if it has never been logged. */
async function latestMileage(db: D1Database, bikeId: number): Promise<number> {
	const row = await db
		.prepare('SELECT mileage FROM mileage_updates WHERE bike_id = ? ORDER BY created_at DESC LIMIT 1')
		.bind(bikeId)
		.first<{ mileage: number }>();
	return row?.mileage ?? 0;
}

export function addMileage(db: D1Database, bikeId: number, mileage: number) {
	return db
		.prepare('INSERT INTO mileage_updates (bike_id, mileage) VALUES (?, ?)')
		.bind(bikeId, mileage)
		.run();
}

export async function addComponent(
	db: D1Database,
	bikeId: number,
	name: string,
	brand: string,
	cost: number
) {
	// Recorded against the odometer at install so wear can be derived later.
	const miles = await latestMileage(db, bikeId);
	return db
		.prepare(
			`INSERT INTO components (bike_id, name, brand, cost, miles_at_install, installation_date)
			 VALUES (?, ?, ?, ?, ?, unixepoch())`
		)
		.bind(bikeId, name, brand, cost, miles)
		.run();
}

export function addEvent(
	db: D1Database,
	bikeId: number,
	name: string,
	cost: number,
	date: number
) {
	return db
		.prepare('INSERT INTO events (bike_id, name, cost, date) VALUES (?, ?, ?, ?)')
		.bind(bikeId, name, cost, date)
		.run();
}

const DELETABLE = {
	component: 'components',
	event: 'events',
	mileage: 'mileage_updates'
} as const;

export type Deletable = keyof typeof DELETABLE;

/** Table name comes from DELETABLE, never from the request, so it cannot be injected. */
export function remove(db: D1Database, kind: Deletable, id: number) {
	return db.prepare(`DELETE FROM ${DELETABLE[kind]} WHERE id = ?`).bind(id).run();
}

/** Fields of a bike the update page may change. */
export interface BikeEdit {
	name: string;
	brand: string;
	model: string;
	description: string | null;
	status: string;
	bike_type: string;
	initial_price: number;
	miles_at_acquire: number;
	photo: string | null;
	acquire_date: number | null;
}

export function updateBike(db: D1Database, id: number, b: BikeEdit) {
	return db
		.prepare(
			`UPDATE bikes SET name=?, brand=?, model=?, description=?, status=?, bike_type=?,
			 initial_price=?, miles_at_acquire=?, photo=?, acquire_date=?, updated_at=unixepoch()
			 WHERE id=?`
		)
		.bind(
			b.name,
			b.brand,
			b.model,
			b.description,
			b.status,
			b.bike_type,
			b.initial_price,
			b.miles_at_acquire,
			b.photo,
			b.acquire_date,
			id
		)
		.run();
}

export function setPhoto(db: D1Database, bikeId: number, mime: string, bytes: ArrayBuffer) {
	return db
		.prepare(
			`INSERT INTO bike_photos (bike_id, mime, bytes, byte_size, updated_at)
			 VALUES (?, ?, ?, ?, unixepoch())
			 ON CONFLICT(bike_id) DO UPDATE SET
			   mime = excluded.mime,
			   bytes = excluded.bytes,
			   byte_size = excluded.byte_size,
			   updated_at = excluded.updated_at`
		)
		.bind(bikeId, mime, bytes, bytes.byteLength)
		.run();
}

export function removePhoto(db: D1Database, bikeId: number) {
	return db.prepare('DELETE FROM bike_photos WHERE bike_id = ?').bind(bikeId).run();
}
