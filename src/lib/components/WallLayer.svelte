<svelte:options namespace="svg"/>

<script>
  import { wallPath, WALL_STYLE } from "$lib/tools/walls.js";

  let { shapes, selectedIds = [], interactive, style } = $props();

  const HIGHLIGHT = "#F59E0B";

  let walls = $derived(shapes.filter((shape) => shape.kind === "wall"));
  let selected = $derived(walls.filter((shape) => selectedIds.includes(shape.id)));
</script>

<style>
  .hit {
    cursor: move;
  }
</style>

<g class="wall-layer">
  {#each walls as shape (shape.id)}
    <path d={wallPath(shape)} fill="none" stroke={style.wallStroke ?? WALL_STYLE.stroke}
          stroke-width={style.wallWidth ?? WALL_STYLE.width} stroke-linecap={shape.open ? "square" : "butt"}
          stroke-linejoin="miter" data-shape-id={shape.id} class:hit={interactive && !shape.locked}
          pointer-events={interactive && !shape.locked ? "stroke" : "none"} role="presentation"/>
  {/each}

  {#each selected as shape (shape.id)}
    <path d={wallPath(shape)} fill="none" stroke={HIGHLIGHT} stroke-width="3" opacity="0.9"
          stroke-linejoin="round" vector-effect="non-scaling-stroke" pointer-events="none"/>
  {/each}
</g>
