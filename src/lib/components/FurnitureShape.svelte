<svelte:options namespace="svg"/>

<script>
  import { FURNITURE_STYLE, furnitureParts, partFill } from "$lib/tools/furniture.js";

  let { item, stroke = FURNITURE_STYLE.stroke, width = FURNITURE_STYLE.width, scaling = true } = $props();
</script>

{#each furnitureParts(item) as part}
  {#if part.tag === "line"}
    <line {...part.attrs} fill="none" {stroke} stroke-width={width} stroke-linecap="round"
          vector-effect={scaling ? null : "non-scaling-stroke"} pointer-events="none"/>
  {:else if part.tag === "path"}
    <path {...part.attrs} fill={partFill(part)} {stroke} stroke-width={width} stroke-linecap="round" stroke-linejoin="round"
          vector-effect={scaling ? null : "non-scaling-stroke"} pointer-events="none"/>
  {:else if part.tag === "circle"}
    <circle {...part.attrs} fill={partFill(part)} {stroke} stroke-width={width}
            vector-effect={scaling ? null : "non-scaling-stroke"} pointer-events="none"/>
  {:else}
    <rect {...part.attrs} fill={partFill(part)} {stroke} stroke-width={width}
          vector-effect={scaling ? null : "non-scaling-stroke"} pointer-events="none"/>
  {/if}
{/each}
