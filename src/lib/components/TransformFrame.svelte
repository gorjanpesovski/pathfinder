<svelte:options namespace="svg"/>

<script>
  let { box, zoom, rotate = true } = $props();

  const COLOR = "#2563EB";
  const HANDLES = [
    { id: "nw", fx: 0, fy: 0, cursor: "nwse-resize" },
    { id: "n", fx: 0.5, fy: 0, cursor: "ns-resize" },
    { id: "ne", fx: 1, fy: 0, cursor: "nesw-resize" },
    { id: "e", fx: 1, fy: 0.5, cursor: "ew-resize" },
    { id: "se", fx: 1, fy: 1, cursor: "nwse-resize" },
    { id: "s", fx: 0.5, fy: 1, cursor: "ns-resize" },
    { id: "sw", fx: 0, fy: 1, cursor: "nesw-resize" },
    { id: "w", fx: 0, fy: 0.5, cursor: "ew-resize" }
  ];

  let px = $derived(1 / zoom);
  let pad = $derived(14 * px);
  let frame = $derived({ x: box.x - pad, y: box.y - pad, width: box.width + pad * 2, height: box.height + pad * 2 });
  let small = $derived(Math.min(box.width, box.height) * zoom < 36);
  let knob = $derived({ x: frame.x + frame.width / 2, y: frame.y - 26 * px });
</script>

<style>
  .handle,
  .knob {
    transition: fill 0.1s ease;
  }

  .handle:hover,
  .knob:hover {
    fill: #93c5fd;
    stroke: #1d4ed8;
  }

  .knob {
    cursor: grab;
  }
</style>

<g class="transform-frame">
  <rect x={frame.x} y={frame.y} width={frame.width} height={frame.height} fill="none" stroke={COLOR} stroke-width="1"
        stroke-dasharray="5 4" vector-effect="non-scaling-stroke" pointer-events="none"/>
  {#each HANDLES.filter((handle) => !small || handle.id.length === 2) as handle (handle.id)}
    {@const x = frame.x + frame.width * handle.fx}
    {@const y = frame.y + frame.height * handle.fy}
    <rect class="handle" x={x - 4.5 * px} y={y - 4.5 * px} width={9 * px} height={9 * px} rx={1.5 * px}
          fill="#FFFFFF" stroke={COLOR} stroke-width="1.5" vector-effect="non-scaling-stroke"
          style="cursor: {handle.cursor}" data-transform={handle.id} role="presentation">
      <title>Drag to scale · Shift keeps free proportions</title>
    </rect>
  {/each}
  {#if rotate}
    <line x1={knob.x} y1={knob.y} x2={knob.x} y2={frame.y} stroke={COLOR} stroke-width="1" vector-effect="non-scaling-stroke" pointer-events="none"/>
    <circle class="knob" cx={knob.x} cy={knob.y} r={6 * px} fill="#FFFFFF" stroke={COLOR} stroke-width="1.5"
            vector-effect="non-scaling-stroke" data-transform="rotate" role="presentation">
      <title>Drag to rotate · Shift snaps to 15°</title>
    </circle>
  {/if}
</g>
