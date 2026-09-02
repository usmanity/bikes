/** Escape untrusted text for HTML interpolation. Every ${} in a view uses this. */
export function esc(value: unknown): string {
	if (value === null || value === undefined) return '';
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export function page(
	title: string,
	body: string,
	opts: { htmx?: boolean; scripts?: string[] } = {}
): string {
	return `<!doctype html>
<html lang="en" class="h-full">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/app.css">
${opts.htmx ? '<script src="/htmx.min.js" defer></script>' : ''}
${(opts.scripts ?? []).map((src) => `<script src="${src}" defer></script>`).join('\n')}
</head>
<body class="h-full">
${body}
</body>
</html>`;
}

/**
 * A photo stored in D1 wins over the static fallback in public/. The ?v=
 * carries the row's updated_at, so a new upload yields a new URL and the old
 * one can be cached forever.
 */
export function photoUrl(bike: {
	id: number;
	photo: string | null;
	photo_version: number | null;
}): string | null {
	if (bike.photo_version) return `/photos/${bike.id}?v=${bike.photo_version}`;
	return bike.photo ? `/${bike.photo}` : null;
}

export const html = (body: string, status = 200) =>
	new Response(body, { status, headers: { 'content-type': 'text/html;charset=UTF-8' } });
