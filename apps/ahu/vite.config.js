import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Reads git at build time. Falls back rather than throwing, so the build still
// works where git is unavailable (a source tarball, a container without git).
function git(args, fallback) {
	try {
		return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
	} catch {
		return fallback;
	}
}

// The patch number is the commit count, so every commit bumps the version.
// Major and minor stay hand-managed in package.json.
// Note: CI must check out with fetch-depth 0, or the count is always 1.
const [major, minor] = JSON.parse(readFileSync('./package.json', 'utf8')).version.split('.');
const APP_VERSION = `v${major}.${minor}.${git('rev-list --count HEAD', '0')}`;
const APP_COMMIT = git('rev-parse --short HEAD', 'dev');

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(APP_VERSION),
		__APP_COMMIT__: JSON.stringify(APP_COMMIT)
	},

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
