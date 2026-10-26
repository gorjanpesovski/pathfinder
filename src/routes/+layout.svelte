<script>
	import favicon from '$lib/assets/favicon.svg';
	import { afterNavigate } from '$app/navigation';
	import { base } from '$app/paths';
	import { rememberRoute } from '$lib/main/session.js';

	let { children } = $props();

	afterNavigate(({ type, to }) => {
		if (to?.url) rememberRoute(to.url.pathname.slice(base.length).replace(/\/$/, '') || '/', type === 'enter');
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
