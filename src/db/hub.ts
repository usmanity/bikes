// A D1Database stand-in whose tables live in the data hub on abbey, not in Cloudflare D1.
//
// The hub keeps one database per app and runs SQL against it at
// POST <HUB_URL>/api/apps/<app>/query (see usmanity/data, packages/hub/src/worker/apps.ts).
// This file wraps that endpoint in the subset of the D1 API this app uses — prepare, bind,
// first, all, run and batch — so read.ts and write.ts work unchanged against either store.
//
// It is self-contained on purpose: other apps copy it as-is and pass their own app name.
//
// Reads (batches made only of SELECTs) are kept in the Workers cache. A read always asks the
// hub first; the cached copy is only served when the hub can't be reached, so the public page
// stays up, slightly stale, while abbey is down. Writes are never cached and fail loudly.

export interface HubOptions {
	/** Base URL of the hub, e.g. https://abbey.usmanity.com/data */
	url: string;
	/** The app's database name on the hub, e.g. "bikes". */
	app: string;
	/** API token with `<app>:write` (or `<app>:read` for a read-only consumer). */
	token: string;
	/** Origin the read cache files its entries under; pass the incoming request's origin. */
	cacheOrigin?: string;
	/** Give up on the hub after this long. Default 5s. */
	timeoutMs?: number;
}

type Value = null | number | string | boolean;
type Wire = Value | { $blob: string };
type Row = Record<string, unknown>;
interface WireResult {
	results: Record<string, Wire>[];
	meta: { changes: number; last_row_id: number; duration: number };
}

export function hubDatabase(opts: HubOptions): D1Database {
	const endpoint = `${opts.url.replace(/\/$/, '')}/api/apps/${opts.app}/query`;

	async function send(statements: HubStatement[]): Promise<D1Result[]> {
		const body = JSON.stringify({
			statements: statements.map((s) => ({ sql: s.sql, params: s.params.map(encode) }))
		});
		const readOnly = statements.every((s) => /^\s*select\b/i.test(s.sql));
		const cacheKey = readOnly && opts.cacheOrigin ? await cacheKeyFor(opts.cacheOrigin, opts.app, body) : null;

		let res: Response;
		try {
			res = await fetch(endpoint, {
				method: 'POST',
				headers: { authorization: `Bearer ${opts.token}`, 'content-type': 'application/json' },
				body,
				signal: AbortSignal.timeout(opts.timeoutMs ?? 5000)
			});
			// 5xx means the hub (or the tunnel in front of it) is down; 4xx is our mistake.
			if (res.status >= 500) throw new Error(`hub answered ${res.status}`);
		} catch (err) {
			const stale = cacheKey && (await cache()?.match(cacheKey));
			if (stale) return decodeResults(await stale.json());
			throw new Error(`hub unreachable: ${(err as Error).message}`);
		}

		const text = await res.text();
		if (!res.ok) {
			// The hub hides auth failures and unknown apps behind a bare 404.
			let message = text;
			try {
				message = JSON.parse(text).message ?? JSON.parse(text).error ?? text;
			} catch {}
			throw new Error(`hub query failed (${res.status}): ${message || 'not found'}`);
		}
		const payload = JSON.parse(text) as { results: WireResult[] };
		if (cacheKey) {
			await cache()?.put(
				cacheKey,
				new Response(text, { headers: { 'cache-control': 'max-age=2592000' } })
			);
		}
		return decodeResults(payload);
	}

	class HubStatement {
		constructor(
			readonly sql: string,
			readonly params: unknown[] = []
		) {}

		bind(...params: unknown[]) {
			return new HubStatement(this.sql, params);
		}

		async all<T = Row>(): Promise<D1Result<T>> {
			const [r] = await send([this]);
			return r as D1Result<T>;
		}

		async run<T = Row>(): Promise<D1Result<T>> {
			return this.all<T>();
		}

		async first<T = Row>(column?: string): Promise<T | null> {
			const row = (await this.all<Row>()).results[0];
			if (!row) return null;
			return (column ? row[column] : row) as T;
		}

		async raw<T = unknown[]>(): Promise<T[]> {
			return (await this.all<Row>()).results.map((r) => Object.values(r)) as T[];
		}
	}

	const db = {
		prepare: (sql: string) => new HubStatement(sql),
		batch: (statements: HubStatement[]) => send(statements),
		exec: () => Promise.reject(new Error('exec is not supported by the hub client')),
		dump: () => Promise.reject(new Error('dump is not supported by the hub client'))
	};
	return db as unknown as D1Database;
}

function decodeResults(payload: { results: WireResult[] }): D1Result[] {
	return payload.results.map((r) => ({
		success: true,
		results: r.results.map(decodeRow),
		meta: { ...r.meta, changed_db: r.meta.changes > 0 } as D1Result['meta']
	}));
}

function encode(v: unknown): Wire {
	if (v === undefined) return null;
	if (v instanceof ArrayBuffer || ArrayBuffer.isView(v)) {
		const bytes =
			v instanceof ArrayBuffer ? new Uint8Array(v) : new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
		let bin = '';
		for (let i = 0; i < bytes.length; i += 0x8000) {
			bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
		}
		return { $blob: btoa(bin) };
	}
	return v as Value;
}

/** Blobs come back as ArrayBuffer, matching what D1 hands out in workerd. */
function decodeRow(row: Record<string, Wire>): Row {
	const out: Row = {};
	for (const [k, v] of Object.entries(row)) {
		if (v && typeof v === 'object' && typeof v.$blob === 'string') {
			const bin = atob(v.$blob);
			const bytes = new Uint8Array(bin.length);
			for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
			out[k] = bytes.buffer;
		} else {
			out[k] = v;
		}
	}
	return out;
}

const cache = () => (typeof caches === 'undefined' ? undefined : caches.default);

/**
 * Cache API keys must be GET URLs on the Worker's own host, so the query body is folded into
 * one by hashing it. The path is never routed; it only names the entry.
 */
async function cacheKeyFor(origin: string, app: string, body: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
	const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
	return `${origin}/__hub-cache/${app}/${hex}`;
}
