import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		// Downloadable resources have to stay real files with real names — inlining
		// a small one as a data URI would hand the user a base64 blob instead.
		assetsInlineLimit: (filePath) =>
			filePath.split(/[/\\]/).includes('resources') ? false : undefined
	},

	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Static output for GitHub Pages. See https://svelte.dev/docs/kit/adapter-static
			adapter: adapter({ fallback: '404.html' }),

			// GitHub Pages serves a project repo from /<repo>, so the app has to know
			// it lives in a subdirectory. The deploy workflow sets BASE_PATH; local
			// dev/build leaves it empty and serves from the root.
			paths: {
				base: process.env.BASE_PATH || ''
			}
		})
	]
});
