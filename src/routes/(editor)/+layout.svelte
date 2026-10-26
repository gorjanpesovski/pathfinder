<script>
  import { page } from "$app/state";
  import Editor from "$lib/editor/Editor.svelte";
  import { appByRoute } from "$lib/editor/apps.js";

  let { children } = $props();

  let app = $derived(appByRoute(page.route.id?.split("/").pop())?.id ?? "floorplan");
</script>

<Editor route={app}/>
{@render children()}
