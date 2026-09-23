<svelte:options namespace="svg"/>

<script>
  import { openPath } from "$lib/tools/path.js";
  import { formatMeters, distance, samePoint } from "$lib/tools/polygon.js";

  let { draft, cursor, zoom, color, closure = null } = $props();

  let px = $derived(1 / zoom);
  let last = $derived(draft.points[draft.points.length - 1]);
  let lastOut = $derived(draft.handles[draft.points.length - 1]?.out);
  let closing = $derived(!!cursor && draft.points.length >= 2 && samePoint(cursor, draft.start));

  let rubber = $derived.by(() => {
    if (!cursor || draft.dragging) return null;
    if (!lastOut) return `M ${last.x} ${last.y} L ${cursor.x} ${cursor.y}`;
    const c1 = { x: last.x + lastOut.x, y: last.y + lastOut.y };
    return `M ${last.x} ${last.y} C ${c1.x} ${c1.y} ${cursor.x} ${cursor.y} ${cursor.x} ${cursor.y}`;
  });
</script>

<style>
  text {
    paint-order: stroke;
    stroke: #ffffff;
    stroke-linejoin: round;
    user-select: none;
  }
</style>

<g class="pen-preview" pointer-events="none">
  <path d={openPath(draft.points, draft.handles)} fill="none" stroke={color} stroke-width="2"
        vector-effect="non-scaling-stroke"/>
  {#if rubber}
    <path d={rubber} fill="none" stroke={color} stroke-width="2" stroke-dasharray="6 4"
          vector-effect="non-scaling-stroke"/>
  {/if}

  {#each draft.points as point, index}
    {@const handle = draft.handles[index]}
    {#if handle}
      {#each ["in", "out"] as side}
        {#if handle[side]}
          <line x1={point.x} y1={point.y} x2={point.x + handle[side].x} y2={point.y + handle[side].y}
                stroke={color} stroke-width="1" vector-effect="non-scaling-stroke"/>
          <circle cx={point.x + handle[side].x} cy={point.y + handle[side].y} r={3 * px} fill={color}/>
        {/if}
      {/each}
    {/if}
    <circle cx={point.x} cy={point.y} r={(index === 0 && closing ? 7 : 3.5) * px}
            fill={index === 0 && closing ? color : "#FFFFFF"} stroke={color}
            stroke-width="1.5" vector-effect="non-scaling-stroke"/>
  {/each}

  {#if cursor && !draft.dragging}
    <text x={cursor.x + 14 * px} y={cursor.y - 12 * px} font-family="inherit" font-size={12 * px} font-weight="600"
          fill="#0F172A" stroke-width={3 * px}>{closing ? "Close shape" : closure ? "Close along floor" : formatMeters(distance(last, cursor))}</text>
  {/if}
</g>
