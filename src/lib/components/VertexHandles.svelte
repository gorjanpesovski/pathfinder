<svelte:options namespace="svg"/>

<script>
  import { segmentPath, edgeMidpoint } from "$lib/tools/path.js";

  let { shape, zoom, points = [], edges = [] } = $props();

  const COLOR = "#2563EB";
  const MIN_GRIP_PX = 36;

  let px = $derived(1 / zoom);
  let size = $derived(10 * px);
  // let closed = $derived(shape.kind === "floor" || shape.kind === "room");
  let closed = $derived(shape.kind === "floor" || shape.kind === "room" || shape.kind === "wall");
  let edgeIndexes = $derived(shape.points.map((_, index) => index).slice(0, shape.open ? -1 : undefined));

  function edgeCursor(angle){
    const turn = ((angle % 180) + 180) % 180;
    if (turn < 20 || turn > 160) return "ns-resize";
    if (turn > 70 && turn < 110) return "ew-resize";
    return "move";
  }
</script>

<style>
  .handle,
  .grip {
    cursor: move;
    transition: fill 0.1s ease;
  }

  .handle:hover,
  .grip:hover {
    fill: #93c5fd;
    stroke: #1d4ed8;
  }

  .handle.active:hover,
  .grip.active:hover {
    fill: #1d4ed8;
  }

  .edge:hover {
    stroke: rgba(37, 99, 235, 0.35);
  }

  .knob {
    cursor: crosshair;
  }

  .knob:hover {
    fill: #1d4ed8;
  }
</style>

<g class="vertex-handles">
  {#if closed}
    {#each edgeIndexes as index}
      {@const mid = edgeMidpoint(shape, index)}
      {#if edges.includes(index)}
        <path d={segmentPath(shape, index)} fill="none" stroke={COLOR} stroke-width="4" opacity="0.8"
              stroke-linecap="round" vector-effect="non-scaling-stroke" pointer-events="none"/>
      {/if}
      <path class="edge" d={segmentPath(shape, index)} fill="none" stroke="transparent" stroke-width="12"
            vector-effect="non-scaling-stroke" pointer-events="stroke" style="cursor: {edgeCursor(mid.angle)}"
            data-shape-id={shape.id} data-edge-index={index} role="presentation"/>
    {/each}

    {#each edgeIndexes as index}
      {@const mid = edgeMidpoint(shape, index)}
      {#if mid.length * zoom >= MIN_GRIP_PX}
        <rect class="grip" class:active={edges.includes(index)}
              x={mid.x - 8 * px} y={mid.y - 3 * px} width={16 * px} height={6 * px} rx={3 * px}
              transform="rotate({mid.angle} {mid.x} {mid.y})"
              fill={edges.includes(index) ? COLOR : "#FFFFFF"} stroke={COLOR} stroke-width="1.5"
              vector-effect="non-scaling-stroke" style="cursor: {edgeCursor(mid.angle)}"
              data-shape-id={shape.id} data-edge-index={index} role="presentation"/>
      {/if}
    {/each}

    {#each shape.points as point, index}
      {@const handle = shape.handles?.[index]}
      {#if handle}
        {#each ["in", "out"] as side}
          {#if handle[side]}
            <line x1={point.x} y1={point.y} x2={point.x + handle[side].x} y2={point.y + handle[side].y}
                  stroke={COLOR} stroke-width="1" vector-effect="non-scaling-stroke" pointer-events="none"/>
            <circle class="knob" cx={point.x + handle[side].x} cy={point.y + handle[side].y} r={size * 0.45}
                    fill={COLOR} stroke="#FFFFFF" stroke-width="1" vector-effect="non-scaling-stroke"
                    data-shape-id={shape.id} data-vertex-index={index} data-handle={side} role="presentation"/>
          {/if}
        {/each}
      {/if}
    {/each}
  {/if}

  {#each shape.points as point, index}
    {#if shape.kind === "curve" && index === 1}
      <circle class="handle" cx={point.x} cy={point.y} r={size * 0.6}
              fill="#FFFFFF" stroke={COLOR} stroke-width="1.5" vector-effect="non-scaling-stroke"
              data-shape-id={shape.id} data-vertex-index={index} role="presentation"/>
    {:else}
      {#if points.includes(index)}
        <rect x={point.x - size} y={point.y - size} width={size * 2} height={size * 2} rx={3 * px}
              fill={COLOR} fill-opacity="0.18" stroke="none" pointer-events="none"/>
      {/if}
      {#if shape.handles?.[index]?.smooth}
        <circle class="handle" class:active={points.includes(index)} cx={point.x} cy={point.y} r={size * 0.55}
                fill={points.includes(index) ? COLOR : "#FFFFFF"} stroke={COLOR} stroke-width="1.5"
                vector-effect="non-scaling-stroke" data-shape-id={shape.id} data-vertex-index={index} role="presentation"/>
      {:else}
        <rect class="handle" class:active={points.includes(index)}
              x={point.x - size / 2} y={point.y - size / 2} width={size} height={size} rx={1.5 * px}
              fill={points.includes(index) ? COLOR : "#FFFFFF"} stroke={COLOR} stroke-width="1.5"
              vector-effect="non-scaling-stroke" data-shape-id={shape.id} data-vertex-index={index} role="presentation"/>
      {/if}
    {/if}
  {/each}
</g>
