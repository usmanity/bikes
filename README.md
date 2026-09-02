# bikes

Tracks what my bikes cost to own: purchase price, components, repairs, and
mileage, reduced to a cost per mile.

A single Cloudflare Worker over a D1 database. No framework — HTML is rendered
from template strings, and the admin page uses [htmx](https://htmx.org) for
its forms and deletes.

## Layout

| Path | Purpose |
|---|---|
| `src/index.ts` | Router. All request handling lives here. |
| `src/db/read.ts` | Every read the public view needs. |
| `src/db/write.ts` | Every mutation. The only file that touches the write path. |
| `src/views/` | HTML templates. |
| `src/cost.ts` | Cost and mileage arithmetic. |
| `migrations/` | D1 schema, applied with `wrangler d1 migrations apply`. |
| `public/` | Static assets, served by the Worker for unmatched paths. |

`read.ts` and `write.ts` are deliberately separate. Writes go to D1 today and
may later go elsewhere; when that happens `write.ts` is the only file that
should need to change.

## Routes

- `/` — the public list. Server-rendered, ships no JavaScript.
- `/update?k=<token>` — the admin page. Any request without the right token
  gets a 404, so it is indistinguishable from a bad path.

## Running it

```bash
npm install
npm run migrate:local          # create the local D1 schema
npm run dev                    # builds CSS, then wrangler dev
```

`.dev.vars` holds `ADMIN_TOKEN` for local runs and is not committed. Production
reads the same name from `wrangler secret put ADMIN_TOKEN`.

## Checks

```bash
npm test          # cost arithmetic
npm run typecheck
./smoke.sh        # boots wrangler dev against local D1, exercises every route
```

## Deploying

```bash
npm run deploy    # minifies CSS, then wrangler deploy
npm run migrate   # apply pending migrations to remote D1
```

## History

This was a SvelteKit app backed by Prisma and SQLite until September 2026. The
public page read a JSON snapshot that had to be exported and committed by hand,
so it went stale; the admin page used a local database and was never deployed
at all. Both now read the same D1 database. The legacy data was migrated by
`scripts/export-legacy-sql.sh`, and archives of the old stores are kept outside
this repo.
