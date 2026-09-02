// Everything the public view needs. Reads only — no statement here mutates.
// Kept apart from write.ts on purpose: the write target may move to another
// store later, and this file should not have to move with it.

export interface BikeRow {
	id: number;
	name: string;
	brand: string;
	model: string;
	initial_price: number;
	photo: string | null;
	acquire_date: number | null;
	bike_type: string;
	miles_at_acquire: number;
	description: string | null;
	status: string;
	created_at: number;
	updated_at: number;
}

export interface MileageRow {
	id: number;
	bike_id: number;
	mileage: number;
	created_at: number;
}

export interface ComponentRow {
	id: number;
	bike_id: number;
	name: string;
	brand: string;
	cost: number;
	miles_at_install: number;
	installation_date: number;
}

export interface EventRow {
	id: number;
	bike_id: number;
	name: string;
	date: number;
	cost: number;
}

export interface Bike extends BikeRow {
	mileage: MileageRow[];
	components: ComponentRow[];
	events: EventRow[];
}

/**
 * Every bike with its history attached.
 *
 * Four flat queries rather than one join: the join would fan out to
 * bikes x mileage x components x events rows and need de-duplicating in JS.
 * At this size all four are trivial, and D1 batches them in one round trip.
 */
export async function listBikes(db: D1Database): Promise<Bike[]> {
	const [bikes, mileage, components, events] = await db.batch([
		db.prepare('SELECT * FROM bikes ORDER BY id'),
		db.prepare('SELECT * FROM mileage_updates ORDER BY bike_id, created_at DESC'),
		db.prepare('SELECT * FROM components ORDER BY bike_id, created_at DESC'),
		db.prepare('SELECT * FROM events ORDER BY bike_id, created_at DESC')
	]);

	const by = <T extends { bike_id: number }>(rows: unknown[]) => {
		const map = new Map<number, T[]>();
		for (const row of rows as T[]) {
			const list = map.get(row.bike_id);
			if (list) list.push(row);
			else map.set(row.bike_id, [row]);
		}
		return map;
	};

	const m = by<MileageRow>(mileage.results);
	const c = by<ComponentRow>(components.results);
	const e = by<EventRow>(events.results);

	return (bikes.results as BikeRow[]).map((bike) => ({
		...bike,
		mileage: m.get(bike.id) ?? [],
		components: c.get(bike.id) ?? [],
		events: e.get(bike.id) ?? []
	}));
}
