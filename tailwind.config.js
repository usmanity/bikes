import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.ts'],
	theme: { extend: {} },
	plugins: [forms]
};
