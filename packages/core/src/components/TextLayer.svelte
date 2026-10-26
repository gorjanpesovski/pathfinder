<svelte:options namespace="svg"/>

<script>
  import { TEXT_FONT, layoutText } from "../tools/text.js";

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
    white-space: pre;
  }
</style>

<g class="text-layer">
  {#each texts as shape (shape.id)}
    {@const layout = layoutText(shape)}
    {#if selectedIds.includes(shape.id)}
      <rect x={shape.x - 3 * px} y={shape.y - 3 * px} width={shape.width + 6 * px} height={shape.height + 6 * px}
            fill="none" stroke="#F59E0B" stroke-width="2" rx={2 * px} vector-effect="non-scaling-stroke" pointer-events="none"/>
    {/if}
    <text font-family={TEXT_FONT} font-size={shape.fontSize} font-weight={shape.bold ? 700 : 400} font-style={shape.italic ? "italic" : "normal"}
          text-decoration={shape.underline ? "underline" : "none"} text-anchor={layout.anchor} fill={shape.color} pointer-events="none">{#each layout.lines as line, index (index)}<tspan x={shape.x + layout.offset} y={shape.y + line.baseline}>{#each line.segments as segment, part (part)}<tspan font-size={segment.style.size} font-weight={segment.style.bold ? 700 : 400} font-style={segment.style.italic ? "italic" : "normal"} text-decoration={segment.style.underline ? "underline" : "none"} fill={segment.style.color}>{segment.text}</tspan>{/each}</tspan>{/each}</text>
    <rect class:hit={interactive && !shape.locked} x={shape.x} y={shape.y} width={shape.width} height={shape.height}
          fill="transparent" pointer-events={interactive && !shape.locked ? "all" : "none"}
          data-shape-id={shape.id} role="presentation"/>
  {/each}
</g>
