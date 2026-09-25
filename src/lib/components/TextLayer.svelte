<svelte:options namespace="svg"/>

<script>
  import { TEXT_FONT, TEXT_LINE, textLines } from "$lib/tools/text.js";

  let { shapes, selectedIds = [], interactive = false, zoom = 1, hidden = null } = $props();

  let texts = $derived(shapes.filter((shape) => shape.kind === "text" && shape.id !== hidden));
  let px = $derived(1 / zoom);
</script>

<style>
  .hit {
    cursor: move;
  }

  text {
    user-select: none;
  }
</style>

<g class="text-layer">
  {#each texts as shape (shape.id)}
    {#if selectedIds.includes(shape.id)}
      <rect x={shape.x - 3 * px} y={shape.y - 3 * px} width={shape.width + 6 * px} height={shape.height + 6 * px}
            fill="none" stroke="#F59E0B" stroke-width="2" rx={2 * px} vector-effect="non-scaling-stroke" pointer-events="none"/>
    {/if}
    <text font-family={TEXT_FONT} font-size={shape.fontSize} font-weight={shape.bold ? 700 : 400}
          fill={shape.color} pointer-events="none">
      {#each textLines(shape) as line, index}
        <tspan x={shape.x} y={shape.y + shape.fontSize * 0.8 + index * shape.fontSize * TEXT_LINE}>{line || " "}</tspan>
      {/each}
    </text>
    <rect class:hit={interactive && !shape.locked} x={shape.x} y={shape.y} width={shape.width} height={shape.height}
          fill="transparent" pointer-events={interactive && !shape.locked ? "all" : "none"}
          data-shape-id={shape.id} role="presentation"/>
  {/each}
</g>
