<svelte:options namespace="svg"/>

<script>
  import { HYDRONIC_ELEMENTS, HYDRONIC_STYLE, mediumOf } from "$lib/hydronic/elements.js";
  import { elementPorts, routePath, routeLength, editablePath, arrowPoints } from "$lib/hydronic/route.js";
  import { fittingPose, fittingSize, pipeDecorations } from "$lib/hydronic/export.js";
  import { contactPoint, touchRoute } from "$lib/hydronic/outline.js";
  import { BRANCH_GEOMETRY, branchGaps } from "$lib/hydronic/branch.js";
  import { readoutRowBoxes } from "$lib/hydronic/readout.js";
  import BranchGraphic from "./BranchGraphic.svelte";

  let {
    shapes,
    routes,
    zoom,
    tool,
    interactive,
    selectedIds = [],
    selectedFitting = null,
    fresh = [],
    preview = null,
    target = null,
    placement = null,
    hidden = null,
    attachment = null,
    showPorts = false,
    readouts = new Map(),
    style = HYDRONIC_STYLE
  } = $props();

  const GRIP_PX = 36;

  const HIGHLIGHT = "#F59E0B";
  const PORT = "#2563EB";

  let px = $derived(1 / zoom);
  let equipment = $derived(shapes.filter((shape) => shape.kind === "equipment" && HYDRONIC_ELEMENTS[shape.type]));
  // let pipes = $derived(shapes.filter((shape) => shape.kind === "pipe" && routes.get(shape.id)));
  let pipes = $derived(shapes.filter((shape) => shape.kind === "pipe" && shape.id !== hidden && routes.get(shape.id)));
  let editing = $derived(interactive && selectedIds.length === 1 ? pipes.find((pipe) => pipe.id === selectedIds[0]) : null);
  let scaling = $derived(interactive && selectedIds.length === 1 ? equipment.find((element) => element.id === selectedIds[0] && !element.locked) : null);
  let decorations = $derived(pipeDecorations(pipes.map((pipe) => ({ pipe, route: routes.get(pipe.id) })), style));
  let editPath = $derived(editing ? editablePath(routes.get(editing.id)) : []);
  let byId = $derived(new Map(shapes.map((shape) => [shape.id, shape])));
  let bars = $derived(equipment.filter((element) => HYDRONIC_ELEMENTS[element.type].bar));
  let others = $derived(equipment.filter((element) => !HYDRONIC_ELEMENTS[element.type].bar));
  let crossingGaps = $derived(branchGaps(shapes, style.gapSize));

  function hitHeight(element){
    const spec = HYDRONIC_ELEMENTS[element.type];
    return spec.branch ? BRANCH_GEOMETRY.hitHeight * element.height / spec.height : element.height;
  }
  let drawn = $derived(new Map(pipes.map((pipe) => [pipe.id, touchRoute(routes.get(pipe.id), pipe, byId)])));

  function portSpot(spot){
    const element = spot?.id !== undefined ? byId.get(spot.id) : null;
    return element ? contactPoint(element, spot) : spot.point;
  }

  function gapsFor(pipeId){
    return decorations.crossings.filter((crossing) => crossing.upper === pipeId);
  }

  function edgeCursor(a, b){
    return a.y === b.y ? "ns-resize" : "ew-resize";
  }

  function duration(length){
    return Math.min(0.9, 0.35 + length / 2500);
  }
</script>

<style>
  .hit,
  .fitting-hit,
  .waypoint {
    cursor: move;
  }

  .readout-hit {
    cursor: move;
  }

  .readout-hit:hover {
    fill: rgba(147, 197, 253, 0.18);
  }

  .fitting-hit {
    fill: transparent;
    transition: fill 0.1s ease;
  }

  .fitting-hit:hover {
    fill: rgba(147, 197, 253, 0.3);
  }

  .waypoint:hover {
    fill: #93c5fd;
  }

  .handle,
  .grip {
    transition: fill 0.1s ease;
  }

  .handle {
    cursor: move;
  }

  .handle:hover,
  .grip:hover {
    fill: #93c5fd;
    stroke: #1d4ed8;
  }

  .edge:hover {
    stroke: rgba(37, 99, 235, 0.35);
  }

  .pipe-end .end-mark {
    opacity: 0;
    transition: opacity 0.1s ease;
  }

  .pipe-end:hover .end-mark {
    opacity: 1;
  }

  .end-hit {
    cursor: grab;
  }

  .label {
    paint-order: stroke;
    stroke: #ffffff;
    stroke-width: 3px;
    stroke-linejoin: round;
    user-select: none;
  }

  .arrow.fresh {
    opacity: 0;
    animation: appear 0.2s ease var(--dur) forwards;
  }

  @keyframes appear {
    to {
      opacity: 1;
    }
  }

  .pipe.fresh {
    stroke-dasharray: var(--len) var(--len);
    stroke-dashoffset: var(--len);
    animation: draw var(--dur) cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .pulse {
    stroke-dasharray: 36px var(--len);
    stroke-dashoffset: 36px;
    animation: pulse var(--dur) cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  @keyframes draw {
    to {
      stroke-dashoffset: 0;
    }
  }

  @keyframes pulse {
    to {
      stroke-dashoffset: calc(-1 * var(--len));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .arrow.fresh {
      opacity: 1;
      animation: none;
    }

    .pipe.fresh {
      stroke-dasharray: none;
      animation: none;
    }

    .pulse {
      display: none;
    }
  }
</style>

{#snippet body(element)}
  {#if HYDRONIC_ELEMENTS[element.type]?.bar}
    <rect x={element.x} y={element.y} width={element.width} height={element.height} fill={mediumOf(element.medium).color}/>
  {:else if HYDRONIC_ELEMENTS[element.type]?.branch}
    <BranchGraphic {element}/>
  {:else}
    <use href="#hyd-{element.type}" x={element.x} y={element.y} width={element.width} height={element.height}/>
  {/if}
{/snippet}

{#snippet item(element)}
  <g pointer-events="none">{@render body(element)}</g>
  {#if selectedIds.includes(element.id)}
    <rect x={element.x - 3 * px} y={element.y - 3 * px} width={element.width + 6 * px} height={element.height + 6 * px}
          fill="none" stroke={HIGHLIGHT} stroke-width="2" rx={3 * px} vector-effect="non-scaling-stroke" pointer-events="none"/>
  {/if}
  <rect class:hit={interactive && !element.locked} x={element.x} y={element.y} width={element.width} height={hitHeight(element)}
        fill="transparent" pointer-events={interactive && !element.locked ? "all" : "none"}
        data-shape-id={element.id} role="presentation"/>
{/snippet}

<g class="hydronic-layer">
  {#each pipes as pipe (pipe.id)}
    <!-- {@const route = routes.get(pipe.id)} -->
    {@const route = drawn.get(pipe.id)}
    {@const d = routePath(route)}
    {@const length = routeLength(route)}
    {@const color = mediumOf(pipe.medium).color}
    {@const isFresh = fresh.includes(pipe.id)}
    {#each gapsFor(pipe.id) as crossing}
      <rect x={crossing.x - style.gapSize / 2} y={crossing.y - style.gapSize / 2} width={style.gapSize} height={style.gapSize}
            fill={style.background} pointer-events="none"/>
    {/each}
    <path class="pipe" class:fresh={isFresh} {d} fill="none" stroke={color} stroke-width={style.pipeWidth}
          stroke-linecap="round" stroke-linejoin="round" pointer-events="none"
          style="--len: {length}px; --dur: {duration(length)}s"/>
    {#if isFresh}
      <path class="pulse" {d} fill="none" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width={style.pipeWidth * 0.55}
            stroke-linecap="round" stroke-linejoin="round" pointer-events="none"
            style="--len: {length}px; --dur: {duration(length)}s"/>
    {/if}
    {#if selectedIds.includes(pipe.id)}
      <path {d} fill="none" stroke={HIGHLIGHT} stroke-width="3" opacity="0.9" stroke-linejoin="round"
            vector-effect="non-scaling-stroke" pointer-events="none"/>
    {/if}
    <path class:hit={interactive && !pipe.locked} {d} fill="none" stroke="transparent"
          stroke-width={Math.max(style.pipeWidth + 4, 14 * px)} stroke-linejoin="round"
          pointer-events={interactive && !pipe.locked ? "stroke" : "none"}
          data-shape-id={pipe.id} role="presentation"/>
  {/each}

  {#each pipes as pipe (pipe.id)}
    {@const color = mediumOf(pipe.medium).color}
    {@const length = routeLength(routes.get(pipe.id))}
    {#each decorations.arrows.get(pipe.id) ?? [] as mark}
      <polygon class="arrow" class:fresh={fresh.includes(pipe.id)} points={arrowPoints(mark, style.arrowSize)} fill={color}
               pointer-events="none" style="--dur: {Math.min(0.9, 0.35 + length / 2500)}s"/>
    {/each}
  {/each}

  {#each decorations.junctions as junction}
    <circle cx={junction.x} cy={junction.y} r={style.junctionRadius} fill="#FFFFFF" stroke={style.junctionStroke}
            stroke-width={style.junctionWidth} pointer-events="none"/>
  {/each}

  <!--
  {#each equipment as element (element.id)}
    <use href="#hyd-{element.type}" x={element.x} y={element.y} width={element.width} height={element.height} pointer-events="none"/>
    <g pointer-events="none">{@render body(element)}</g>
    {#if selectedIds.includes(element.id)}
      <rect x={element.x - 3 * px} y={element.y - 3 * px} width={element.width + 6 * px} height={element.height + 6 * px}
            fill="none" stroke={HIGHLIGHT} stroke-width="2" rx={3 * px} vector-effect="non-scaling-stroke" pointer-events="none"/>
    {/if}
    <rect class:hit={interactive && !element.locked} x={element.x} y={element.y} width={element.width} height={element.height}
          fill="transparent" pointer-events={interactive && !element.locked ? "all" : "none"}
          data-shape-id={element.id} role="presentation"/>
  {/each}
  -->
  {#each bars as element (element.id)}
    {@render item(element)}
  {/each}
  {#each crossingGaps as gap}
    <rect x={gap.x} y={gap.y} width={gap.width} height={gap.height} fill={style.background} pointer-events="none"/>
  {/each}
  {#each others as element (element.id)}
    {@render item(element)}
  {/each}

  {#each equipment as element (element.id)}
    {#if element.name}
      {@const inside = HYDRONIC_ELEMENTS[element.type]?.caption === "inside"}
      {#if !HYDRONIC_ELEMENTS[element.type]?.bar && !HYDRONIC_ELEMENTS[element.type]?.ownLabel}
      <text class="label" x={element.x + element.width / 2} y={inside ? element.y + 24 : element.y + element.height + 18}
            text-anchor="middle" font-family="Roboto, 'IBM Plex Sans', sans-serif" font-size="13" fill="#1E293B"
            pointer-events="none">{element.name}</text>
      {/if}
    {/if}
  {/each}

  {#each pipes as pipe (pipe.id)}
    {#each pipe.fittings ?? [] as fitting (fitting.id)}
      {@const spec = HYDRONIC_ELEMENTS[fitting.type] && fittingSize(fitting)}
      {@const pose = fittingPose(routes.get(pipe.id), fitting)}
      {@const active = selectedFitting?.pipeId === pipe.id && selectedFitting?.fittingId === fitting.id}
      {#if spec}
        <g transform="translate({pose.x} {pose.y}) rotate({pose.rotation})">
          <use href="#hyd-{fitting.type}" x={-spec.width / 2} y={-spec.height / 2} width={spec.width} height={spec.height} pointer-events="none"/>
          <rect class="fitting-hit" x={-spec.width / 2} y={-spec.height / 2} width={spec.width} height={spec.height} rx="3"
                stroke={active ? HIGHLIGHT : "none"} stroke-width="2" vector-effect="non-scaling-stroke"
                pointer-events={interactive && !pipe.locked ? "all" : "none"}
                data-shape-id={pipe.id} data-fitting-id={fitting.id} role="presentation"/>
        </g>
      {/if}
    {/each}
  {/each}

  {#each [...readouts] as [fittingId, box] (fittingId)}
    {@const pipe = byId.get(box.pipeId)}
    {@const active = selectedFitting?.pipeId === box.pipeId && selectedFitting?.fittingId === fittingId}
    <g class="readout">
      {#each readoutRowBoxes(box) as row}
        <text x={row.labelX} y={row.textY} font-family="Roboto, 'IBM Plex Sans', sans-serif" font-size="18" fill="#414142"
              pointer-events="none">{row.label}</text>
        <rect x={row.box.x} y={row.box.y} width={row.box.width} height={row.box.height} rx="2" fill="#FFFFFF" stroke="#94A3B8"
              stroke-width="1.5" pointer-events="none"/>
        <text x={row.box.x + row.box.width / 2} y={row.textY - 1} text-anchor="middle" font-family="Roboto, 'IBM Plex Sans', sans-serif"
              font-size="16" fill="#414142" pointer-events="none">--.- {row.unit}</text>
      {/each}
      <rect class="readout-hit" x={box.x - 3} y={box.y - 3} width={box.width + 6} height={box.height + 6} rx="3"
            fill="transparent" stroke={active ? HIGHLIGHT : "none"} stroke-width="1.5" stroke-dasharray="4 3"
            vector-effect="non-scaling-stroke" pointer-events={interactive && !pipe?.locked ? "all" : "none"}
            data-shape-id={box.pipeId} data-readout-id={fittingId} role="presentation">
        <title>Drag to move the readout</title>
      </rect>
    </g>
  {/each}

  {#if interactive}
    {#each pipes as pipe (pipe.id)}
      <!-- {@const route = routes.get(pipe.id)} -->
      {@const route = drawn.get(pipe.id)}
      {#each [["from", route[0]], ["to", route[route.length - 1]]] as [end, point]}
        {@const junction = pipe[end]?.pipe !== undefined}
        <g class="pipe-end">
          <g class="end-mark" pointer-events="none">
            {#if junction}
              <circle cx={point.x} cy={point.y} r={style.junctionRadius + 3 * px} fill="none" stroke={PORT}
                      stroke-width="2" vector-effect="non-scaling-stroke"/>
            {:else}
              <circle cx={point.x} cy={point.y} r={9 * px} fill="#FFFFFF" stroke="#DC2626" stroke-width="2" vector-effect="non-scaling-stroke"/>
              <path d="M {point.x - 3.5 * px} {point.y - 3.5 * px} L {point.x + 3.5 * px} {point.y + 3.5 * px} M {point.x + 3.5 * px} {point.y - 3.5 * px} L {point.x - 3.5 * px} {point.y + 3.5 * px}"
                    stroke="#DC2626" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
            {/if}
          </g>
          <circle class="end-hit" cx={point.x} cy={point.y} r={Math.max(9 * px, junction ? style.junctionRadius : 0)} fill="transparent"
                  pointer-events={pipe.locked ? "none" : "all"} data-shape-id={pipe.id} data-pipe-end={end} role="presentation">
            <title>{junction ? "Drag to move the junction along the pipe" : "Drag to reconnect · click to detach the pipe"}</title>
          </circle>
        </g>
      {/each}
    {/each}
  {/if}

  <!--
  {#if editing}
    {#each editing.points ?? [] as point, index}
      <rect class="waypoint" x={point.x - 5 * px} y={point.y - 5 * px} width={10 * px} height={10 * px} rx={1.5 * px}
            fill="#FFFFFF" stroke={PORT} stroke-width="1.5" vector-effect="non-scaling-stroke"
            data-shape-id={editing.id} data-waypoint-index={index} role="presentation"/>
    {/each}
  {/if}
  -->

  {#if editing && editPath.length >= 2}
    {#each editPath.slice(1, -2) as a, offset}
      {@const index = offset + 1}
      {@const b = editPath[index + 1]}
      <path class="edge" d="M {a.x} {a.y} L {b.x} {b.y}" fill="none" stroke="transparent" stroke-width="12"
            vector-effect="non-scaling-stroke" pointer-events="stroke" style="cursor: {edgeCursor(a, b)}"
            data-shape-id={editing.id} data-pipe-edge={index} role="presentation"/>
    {/each}
    {#each editPath.slice(1, -2) as a, offset}
      {@const index = offset + 1}
      {@const b = editPath[index + 1]}
      {@const length = Math.hypot(b.x - a.x, b.y - a.y)}
      {#if length * zoom >= GRIP_PX}
        <rect class="grip" x={(a.x + b.x) / 2 - 8 * px} y={(a.y + b.y) / 2 - 3 * px} width={16 * px} height={6 * px} rx={3 * px}
              transform="rotate({a.y === b.y ? 0 : 90} {(a.x + b.x) / 2} {(a.y + b.y) / 2})"
              fill="#FFFFFF" stroke={PORT} stroke-width="1.5" vector-effect="non-scaling-stroke" style="cursor: {edgeCursor(a, b)}"
              data-shape-id={editing.id} data-pipe-edge={index} role="presentation"/>
      {/if}
    {/each}
    {#each editPath.slice(2, -2) as point, offset}
      <rect class="handle" x={point.x - 5 * px} y={point.y - 5 * px} width={10 * px} height={10 * px} rx={1.5 * px}
            fill="#FFFFFF" stroke={PORT} stroke-width="1.5" vector-effect="non-scaling-stroke"
            data-shape-id={editing.id} data-pipe-vertex={offset + 2} role="presentation"/>
    {/each}
  {/if}

  {#if scaling}
    {#each [["nw", scaling.x, scaling.y], ["ne", scaling.x + scaling.width, scaling.y], ["se", scaling.x + scaling.width, scaling.y + scaling.height], ["sw", scaling.x, scaling.y + scaling.height]] as [corner, cx, cy]}
      <rect class="handle" x={cx - 5 * px} y={cy - 5 * px} width={10 * px} height={10 * px} rx={1.5 * px}
            fill="#FFFFFF" stroke={PORT} stroke-width="1.5" vector-effect="non-scaling-stroke"
            style="cursor: {corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize'}"
            data-shape-id={scaling.id} data-element-handle={corner} role="presentation"/>
    {/each}
  {/if}

  {#if tool === "pipe" || showPorts}
    <g pointer-events="none">
      {#each equipment as element (element.id)}
        {#each elementPorts(element) as port}
          {@const spot = contactPoint(element, port)}
          <!-- <circle cx={port.point.x} cy={port.point.y} r={2.5 * px} fill="#FFFFFF" stroke={PORT} stroke-width="1.2"
                  vector-effect="non-scaling-stroke" opacity="0.8"/> -->
          <circle cx={spot.x} cy={spot.y} r={2.5 * px} fill="#FFFFFF" stroke={PORT} stroke-width="1.2"
                  vector-effect="non-scaling-stroke" opacity="0.8"/>
        {/each}
      {/each}
      {#if attachment}
        <circle cx={attachment.point.x} cy={attachment.point.y} r={9 * px} fill="#DC2626" fill-opacity="0.15" stroke="#DC2626"
                stroke-width="2" vector-effect="non-scaling-stroke"/>
        <path d="M {attachment.point.x - 3.5 * px} {attachment.point.y - 3.5 * px} L {attachment.point.x + 3.5 * px} {attachment.point.y + 3.5 * px} M {attachment.point.x + 3.5 * px} {attachment.point.y - 3.5 * px} L {attachment.point.x - 3.5 * px} {attachment.point.y + 3.5 * px}"
              stroke="#DC2626" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      {:else if target}
        {@const spot = portSpot(target)}
        <!-- <circle cx={target.point.x} cy={target.point.y} r={7 * px} fill={PORT} fill-opacity="0.18" stroke={PORT}
                stroke-width="2" vector-effect="non-scaling-stroke"/>
        <circle cx={target.point.x} cy={target.point.y} r={3 * px} fill={PORT}/> -->
        <circle cx={spot.x} cy={spot.y} r={7 * px} fill={PORT} fill-opacity="0.18" stroke={PORT}
                stroke-width="2" vector-effect="non-scaling-stroke"/>
        <circle cx={spot.x} cy={spot.y} r={3 * px} fill={PORT}/>
      {/if}
    </g>
  {/if}

  {#if preview}
    {@const previewRoute = touchRoute(preview.route, preview, byId)}
    <g pointer-events="none">
      <!-- <path d={routePath(preview.route)} fill="none" stroke={mediumOf(preview.medium).color} stroke-width={style.pipeWidth}
            stroke-linecap="round" stroke-linejoin="round" opacity="0.45"/>
      <path d={routePath(preview.route)} fill="none" stroke={mediumOf(preview.medium).color} stroke-width="1.5"
            stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/> -->
      <path d={routePath(previewRoute)} fill="none" stroke={mediumOf(preview.medium).color} stroke-width={style.pipeWidth}
            stroke-linecap="round" stroke-linejoin="round" opacity="0.45"/>
      <path d={routePath(previewRoute)} fill="none" stroke={mediumOf(preview.medium).color} stroke-width="1.5"
            stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>
      {#each preview.points as point}
        <rect x={point.x - 4 * px} y={point.y - 4 * px} width={8 * px} height={8 * px} fill="#FFFFFF"
              stroke={mediumOf(preview.medium).color} stroke-width="1.5" vector-effect="non-scaling-stroke"/>
      {/each}
    </g>
  {/if}

  {#if placement?.kind === "equipment"}
    <g pointer-events="none" opacity={placement.valid ? 0.7 : 0.35}>
      <!-- <use href="#hyd-{placement.element.type}" x={placement.element.x} y={placement.element.y}
           width={placement.element.width} height={placement.element.height}/> -->
      {@render body(placement.element)}
      <rect x={placement.element.x} y={placement.element.y} width={placement.element.width} height={placement.element.height}
            fill="none" stroke={placement.valid ? PORT : "#DC2626"} stroke-width="1.5" stroke-dasharray="5 4"
            vector-effect="non-scaling-stroke"/>
    </g>
  {:else if placement?.kind === "fitting"}
    {@const spec = HYDRONIC_ELEMENTS[placement.type]}
    <g pointer-events="none" opacity={placement.valid ? 0.85 : 0.4}
       transform="translate({placement.pose.x} {placement.pose.y}) rotate({placement.pose.rotation})">
      <use href="#hyd-{placement.type}" x={-spec.width / 2} y={-spec.height / 2} width={spec.width} height={spec.height}/>
      <rect x={-spec.width / 2 - 2} y={-spec.height / 2 - 2} width={spec.width + 4} height={spec.height + 4} rx="3"
            fill="none" stroke={placement.valid ? PORT : "#DC2626"} stroke-width="1.5" stroke-dasharray="4 3"
            vector-effect="non-scaling-stroke"/>
    </g>
  {/if}
</g>
