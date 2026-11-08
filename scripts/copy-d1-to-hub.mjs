// One-off: copies every row from the bikes D1 database on Cloudflare into the hub on abbey,
// ids and timestamps intact. Run it after `npm run migrate:hub`, while the hub copy is empty.
//
//   HUB_URL=https://abbey.usmanity.com/data HUB_TOKEN=<bikes:write token> npm run copy:hub
//
// Reads D1 with `npx cf d1 query` (needs `cf auth login`). Refuses to run if the hub
// already has bikes, so it can't duplicate or overwrite anything.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const { HUB_URL, HUB_TOKEN } = process.env;
if (!HUB_URL || !HUB_TOKEN) {
	console.error('set HUB_URL and HUB_TOKEN (a bikes:write token)');
	process.exit(1);
}
const endpoint = `${HUB_URL.replace(/\/$/, '')}/api/apps/bikes/query`;
const d1Id = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8').match(
	/database_id\s*=\s*"([^"]+)"/
)[1];

async function hub(statements) {
	const res = await fetch(endpoint, {
		method: 'POST',
		headers: { authorization: `Bearer ${HUB_TOKEN}`, 'content-type': 'application/json' },
		body: JSON.stringify({ statements })
	});
	const body = await res.text();
	if (!res.ok) throw new Error(`hub answered ${res.status}: ${body || 'not found (bad token?)'}`);
	return JSON.parse(body).results;
}

function d1(sql) {
	const out = execFileSync('npx', ['cf', 'd1', 'query', d1Id, '--sql', sql], {
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024,
		stdio: ['ignore', 'pipe', 'inherit']
	});
	return JSON.parse(out)[0].results;
}

const [existing] = await hub([{ sql: 'SELECT COUNT(*) AS n FROM bikes' }]);
if (existing.results[0].n > 0) {
	console.error('the hub already has bikes; not copying');
	process.exit(1);
}

// Parents first, so the foreign keys hold at every step.
const tables = ['bikes', 'mileage_updates', 'components', 'events'];
const statements = [];
for (const table of tables) {
	const rows = d1(`SELECT * FROM ${table} ORDER BY id`);
	for (const row of rows) {
		const cols = Object.keys(row);
		statements.push({
			sql: `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
			params: Object.values(row)
		});
	}
	console.log(`${table}: ${rows.length} rows`);
}

// The hub caps a request at 100 statements. Rows go in batches of 50, each its own transaction;
// if one fails, rerun after clearing the hub tables (the empty-hub check guards against doubles).
for (let i = 0; i < statements.length; i += 50) {
	await hub(statements.slice(i, i + 50));
}
console.log(`copied ${statements.length} rows to the hub`);

// Blobs come out of `cf d1 query` as hex and travel to the hub as base64, one photo per request
// since each can be a couple of MB.
const photos = d1('SELECT bike_id, mime, hex(bytes) AS hex, byte_size, updated_at FROM bike_photos');
for (const p of photos) {
	await hub([
		{
			sql: 'INSERT INTO bike_photos (bike_id, mime, bytes, byte_size, updated_at) VALUES (?, ?, ?, ?, ?)',
			params: [p.bike_id, p.mime, { $blob: Buffer.from(p.hex, 'hex').toString('base64') }, p.byte_size, p.updated_at]
		}
	]);
}
console.log(`bike_photos: ${photos.length} rows`);
