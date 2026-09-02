// Downscales a chosen photo in the browser before uploading it.
//
// A phone camera produces 3-5MB images; the card that displays them is at most
// a few hundred pixels wide. Without this, one upload would be larger than the
// entire rest of the database, and would trip the server's 2MB cap.
//
// If anything here fails the form still submits the original file, and the
// server accepts or rejects it on size alone.
(function () {
	const MAX_EDGE = 1600;
	const QUALITY = 0.82;

	async function downscale(file) {
		if (!file.type.startsWith('image/')) return file;
		const bitmap = await createImageBitmap(file);
		const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));

		// Already small enough, and re-encoding would only lose quality.
		if (scale === 1 && file.size <= 1_000_000) return file;

		const canvas = document.createElement('canvas');
		canvas.width = Math.round(bitmap.width * scale);
		canvas.height = Math.round(bitmap.height * scale);
		canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);

		const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', QUALITY));
		bitmap.close();

		// Keep whichever is smaller; re-encoding a small PNG can inflate it.
		if (!blob || blob.size >= file.size) return file;
		return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
	}

	document.addEventListener('submit', async function (event) {
		const form = event.target;
		if (!form.matches('[data-photo-form]')) return;

		const input = form.querySelector('input[type=file]');
		if (!input || !input.files.length) return;

		event.preventDefault();
		const button = form.querySelector('button[type=submit]');
		const label = button.textContent;
		button.disabled = true;
		button.textContent = 'Uploading...';

		try {
			const body = new FormData();
			body.append('photo', await downscale(input.files[0]).catch(() => input.files[0]));
			const res = await fetch(form.action, { method: 'POST', body });
			if (!res.ok) throw new Error(await res.text());
			location.reload();
		} catch (err) {
			button.disabled = false;
			button.textContent = label;
			form.querySelector('[data-photo-error]').textContent = String(err.message || err);
		}
	});
})();
