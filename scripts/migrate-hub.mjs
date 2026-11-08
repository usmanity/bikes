// Applies migrations/*.sql to the bikes database in the data hub on abbey, through the same
// query endpoint the Worker uses. Applied files are recorded in d1_migrations, the table
// wrangler uses, so the history reads the same as on D1.
//
//   HUB_URL=https://abbey.usmanity.com/data HUB_TOKEN=<bikes:write token> npm run migrate:hub
//
// Each file runs as one batch, so a failing migration leaves nothing half applied.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const { HUB_URL, HUB_TOKEN } = process.env;
if (!HUB_URL || !HUB_TOKEN) {
	console.error('set HUB_URL and HUB_TOKEN (a bikes:write token)');
	process.exit(1);
}
const endpoint = `${HUB_URL.replace(/\/$/, '')}/api/apps/bikes/query`;

async function query(statements) {
	const res = await fetch(endpoint, {
		method: 'POST',
		headers: { authorization: `Bearer ${HUB_TOKEN}`, 'content-type': 'application/json' },
		body: JSON.stringify({ statements })
	});
	const body = await res.text();
	if (!res.ok) throw new Error(`hub answered ${res.status}: ${body || 'not found (bad token?)'}`);
	return JSON.parse(body).results;
}

// Comments go first: they may contain semicolons ("one photo per bike; re-uploading...").
const statementsOf = (sql) =>
	sql
		.replace(/--[^\n]*/g, '')
		.split(';')
		.map((s) => s.trim())
		.filter(Boolean)
		.map((s) => ({ sql: s }));

await query([
	{
		sql: `CREATE TABLE IF NOT EXISTS d1_migrations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT UNIQUE,
			applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
		)`
	}
]);
const [applied] = await query([{ sql: 'SELECT name FROM d1_migrations' }]);
const done = new Set(applied.results.map((r) => r.name));

const dir = new URL('../migrations/', import.meta.url).pathname;
const pending = readdirSync(dir)
	.filter((f) => f.endsWith('.sql') && !done.has(f))
	.sort();

for (const file of pending) {
	await query([
		...statementsOf(readFileSync(join(dir, file), 'utf8')),
		{ sql: 'INSERT INTO d1_migrations (name) VALUES (?)', params: [file] }
	]);
	console.log(`applied ${file}`);
}
console.log(pending.length ? `${pending.length} migration(s) applied` : 'nothing to apply');
