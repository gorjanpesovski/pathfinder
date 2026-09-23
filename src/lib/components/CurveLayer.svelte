<svelte:options namespace="svg"/>

<script>
  import { curvePath, curveControl } from "$lib/tools/curve.js";
  import { formatMeters, distance } from "$lib/tools/polygon.js";

  let { shapes, draft, cursor, zoom, color, width, selectedId, interactive } = $props();

  const HIGHLIGHT = "#F59E0B";

  let curves = $derived(shapes.filter((shape) => shape.kind === "curve"));
  let px = $derived(1 / zoom);

  let preview = $derived.by(() => {
    if (!draft || draft.kind !== "curve" || !cursor) return null;
    const [start, end] = draft.points;
    if (!end) return { kind: "chord", start, label: formatMeters(distance(start, cursor)) };
    const control = curveControl(start, cursor, end);
    const bend = distance(cursor, { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 });
    return { kind: "curve", start, end, control, label: `Bend ${formatMeters(bend)}` };
  });
</script>

<style>
  .hit {
    cursor: move;
  }

  text {
    paint-order: stroke;
    stroke: #ffffff;
    stroke-linejoin: round;
    pointer-events: none;
    user-select: none;
  }
</style>

<g class="curve-layer">
  {#each curves as shape (shape.id)}
    {#if selectedId === shape.id}
      <path d={curvePath(shape.points)} fill="none" stroke={HIGHLIGHT} opacity="0.5"
            stroke-width={shape.strokeWidth + 6} stroke-linecap="round" pointer-events="none"/>
    {/if}
    <path d={curvePath(shape.points)} fill="none" stroke={color} stroke-width={shape.strokeWidth}
          stroke-linecap="round" pointer-events="none"/>
    <path d={curvePath(shape.points)} fill="none" stroke="transparent" stroke-width="14"
          vector-effect="non-scaling-stroke" data-shape-id={shape.id}
          class:hit={interactive} pointer-events={interactive ? "stroke" : "none"} role="presentation"/>
  {/each}

  {#if preview}
    <g pointer-events="none">
      {#if preview.kind === "chord"}
        <line x1={preview.start.x} y1={preview.start.y} x2={cursor.x} y2={cursor.y} stroke={color}
              stroke-width="2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>
      {:else}
        <path d="M {preview.start.x} {preview.start.y} Q {preview.control.x} {preview.control.y} {preview.end.x} {preview.end.y}"
              fill="none" stroke={color} stroke-width={width} stroke-linecap="round" opacity="0.7"/>
        <line x1={preview.start.x} y1={preview.start.y} x2={preview.end.x} y2={preview.end.y} stroke={color}
              stroke-width="1" stroke-dasharray="2 4" opacity="0.5" vector-effect="non-scaling-stroke"/>
        <circle cx={preview.end.x} cy={preview.end.y} r={3.5 * px} fill="#FFFFFF" stroke={color}
                stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      {/if}
      <circle cx={preview.start.x} cy={preview.start.y} r={3.5 * px} fill="#FFFFFF" stroke={color}
              stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      <text x={cursor.x + 14 * px} y={cursor.y - 12 * px} font-family="inherit" font-size={12 * px} font-weight="600"
            fill="#0F172A" stroke-width={3 * px}>{preview.label}</text>
    </g>
  {/if}
</g>
