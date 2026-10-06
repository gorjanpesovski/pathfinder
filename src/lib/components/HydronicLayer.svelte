<svelte:options namespace="svg"/>

<script>
  import { HYDRONIC_ELEMENTS, HYDRONIC_STYLE, mediumOf } from "$lib/hydronic/elements.js";
  import { elementPorts, routePath, routeLength, editablePath, arrowPoints } from "$lib/hydronic/route.js";
  import { fittingPose, fittingSize, pipeWidthOf } from "$lib/hydronic/geometry.js";
  import { contactPoint, touchRoute } from "$lib/hydronic/outline.js";
  import BranchGraphic from "./BranchGraphic.svelte";
  import DeviceGraphic from "./DeviceGraphic.svelte";
  import GenericGraphic from "./GenericGraphic.svelte";
  import { buildScene } from "$lib/hydronic/scene.js";

  let {
    shapes,
    routes,
    zoom,
    tool,
    interactive,
    selectedIds = [],
    selectedFitting = null,
    selectedFittings = [],
    fresh = [],
    preview = null,
    target = null,
    placement = null,
    hidden = null,
    showPorts = false,
    readouts = new Map(),
    renaming = null,
    renamingFitting = null,
    guide = null,
    branchEditing = false,
    linking = null,
    style = HYDRONIC_STYLE
  } = $props();

  const GRIP_PX = 36;

  const HIGHLIGHT = "#F59E0B";
  const PORT = "#2563EB";
  const FONT = "Roboto, 'IBM Plex Sans', sans-serif";

  let px = $derived(1 / zoom);
  let equipment = $derived(shapes.filter((shape) => shape.kind === "equipment" && HYDRONIC_ELEMENTS[shape.type]));
  let pipes = $derived(shapes.filter((shape) => shape.kind === "pipe" && shape.id !== hidden && routes.get(shape.id)));
  let editing = $derived(interactive && selectedIds.length === 1 ? pipes.find((pipe) => pipe.id === selectedIds[0]) : null);
  let scene = $derived(buildScene(shapes, style, { routes, readouts, hidden }));
  let lengths = $derived(new Map(scene.filter((item) => item.kind === "pipe").map((item) => [item.pipeId, routeLength(item.points)])));
  let editPath = $derived(editing ? editablePath(routes.get(editing.id)) : []);
  let byId = $derived(new Map(shapes.map((shape) => [shape.id, shape])));
  let bars = $derived(equipment.filter((element) => HYDRONIC_ELEMENTS[element.type].bar));
  let others = $derived(equipment.filter((element) => !HYDRONIC_ELEMENTS[element.type].bar));

  function hitArea(element){
    return { x: element.x, y: element.y, width: element.width, height: element.height };
  }

  let drawn = $derived(new Map(pipes.map((pipe) => [pipe.id, touchRoute(routes.get(pipe.id), pipe, byId)])));

  function portSpot(spot){
    const element = spot?.id !== undefined ? byId.get(spot.id) : null;
    return element ? contactPoint(element, spot) : spot.point;
  }

  function endEditable(pipe, end){
    if (pipe[end]?.fitting !== undefined) return false;
    if (pipe.branchOf === undefined) return true;
    return branchEditing && pipe[end]?.pipe === undefined && pipe[end]?.id === undefined;
  }

  function edgeCursor(a, b){
    return a.y === b.y ? "ns-resize" : "ew-resize";
  }

  function iconTransform(item){
    const parts = [];
    if (item.rotation) parts.push(`rotate(${item.rotation} ${item.cx} ${item.cy})`);
    if (item.mirror) parts.push(`translate(${item.cx} ${item.cy}) scale(${item.mirror.x ? -1 : 1} ${item.mirror.y ? -1 : 1}) translate(${-item.cx} ${-item.cy})`);
    return parts.length ? parts.join(" ") : undefined;
  }

  const LINKED = "#16A34A";

  let linkFields = $derived(linking ? scene.filter((item) => item.kind === "field" && item.link) : []);
  let linkElements = $derived(linking ? equipment.filter((element) => !HYDRONIC_ELEMENTS[element.type].device && !HYDRONIC_ELEMENTS[element.type].electric) : []);

  function hovered(shapeId, fittingId, key){
    const hover = linking?.hover;
    return !!hover && hover.shapeId === shapeId && (hover.fittingId ?? null) === (fittingId ?? null) && hover.key === key;
  }

  function duration(length){
    return Math.min(0.9, 0.35 + length / 2500);
  }
</script>

<style>
  .hit,
  .fitting-hit {
    cursor: move;
  }

  .readout-hit {
    cursor: move;
  }

  .readout-hit:hover {
    fill: rgba(147, 197, 253, 0.18);
  }

  .link-target {
    cursor: copy;
  }

  .fitting-hit {
    fill: transparent;
    transition: fill 0.1s ease;
  }

  .fitting-hit:hover {
    fill: rgba(147, 197, 253, 0.3);
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

{#snippet visual(item)}
  {#if item.kind === "gap"}
    <rect x={item.x} y={item.y} width={item.width} height={item.height} fill={style.background}/>
  {:else if item.kind === "pipe"}
    {@const d = routePath(item.points)}
    {@const length = routeLength(item.points)}
    {@const isFresh = !item.overlay && fresh.includes(item.pipeId)}
    <path class="pipe" class:fresh={isFresh} {d} fill="none" stroke={item.color} stroke-width={item.width}
          stroke-linecap={item.dash ? "butt" : "round"} stroke-linejoin="round"
          stroke-dasharray={isFresh ? undefined : item.dashArray ?? (item.dash ? `${item.width * 2} ${item.width * 1.5}` : undefined)}
          style="--len: {length}px; --dur: {duration(length)}s"/>
    {#if isFresh}
      <path class="pulse" {d} fill="none" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width={item.width * 0.55}
            stroke-linecap="round" stroke-linejoin="round" style="--len: {length}px; --dur: {duration(length)}s"/>
    {/if}
  {:else if item.kind === "arrow"}
    <polygon class="arrow" class:fresh={fresh.includes(item.pipeId)} points={arrowPoints(item.mark, item.size)} fill={item.color}
             style="--dur: {duration(lengths.get(item.pipeId) ?? 0)}s"/>
  {:else if item.kind === "junction" && item.dot}
    <circle cx={item.x} cy={item.y} r={item.radius} fill="#1E293B"/>
  {:else if item.kind === "junction"}
    <circle cx={item.x} cy={item.y} r={item.radius} fill="#FFFFFF" stroke={style.junctionStroke} stroke-width={item.stroke}/>
  {:else if item.kind === "bar"}
    <rect x={item.x} y={item.y} width={item.width} height={item.height} fill={item.color}/>
  {:else if item.kind === "branch"}
    <BranchGraphic parts={item.parts}/>
  {:else if item.kind === "device"}
    <DeviceGraphic {item}/>
  {:else if item.kind === "generic"}
    <GenericGraphic {item}/>
  {:else if item.kind === "electric"}
    <g>{@html item.svg}</g>
  {:else if item.kind === "icon"}
    <use href="#hyd-{item.type}" x={item.cx - item.width / 2} y={item.cy - item.height / 2} width={item.width} height={item.height}
         transform={iconTransform(item)}/>
  {:else if item.kind === "field"}
    <rect x={item.x} y={item.y} width={item.width} height={item.height} rx={2 * item.height / 40} fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.5"/>
    <text x={item.x + item.width / 2} y={item.y + item.height / 2 + 7 * item.height / 40} text-anchor="middle"
          font-family={FONT} font-size={20 * item.height / 40} fill="#414142">{item.decimals ? "--.-" : "--"} {item.unit}</text>
  {:else if item.kind === "label" && !item.ref}
    <text x={item.x} y={item.y} text-anchor={item.anchor} font-family={FONT} font-size={item.size} font-weight={item.bold ? "bold" : undefined}
          fill={item.color}>{item.text}</text>
  {/if}
{/snippet}

{#snippet elementHit(element)}
  {#if selectedIds.includes(element.id)}
    <rect x={element.x - 3 * px} y={element.y - 3 * px} width={element.width + 6 * px} height={element.height + 6 * px}
          fill="none" stroke={HIGHLIGHT} stroke-width="2" rx={3 * px} vector-effect="non-scaling-stroke" pointer-events="none"/>
  {/if}
  {@const area = hitArea(element)}
  <rect class:hit={interactive && !element.locked} x={area.x} y={area.y} width={area.width} height={area.height}
        fill="transparent" pointer-events={interactive && !element.locked ? "all" : "none"}
        data-shape-id={element.id} role="presentation"/>
{/snippet}

{#snippet caption(item)}
  {@const owner = byId.get(item.ref.elementId ?? item.ref.pipeId)}
  {@const renamed = item.ref.fittingId === undefined
    ? renaming === item.ref.elementId
    : renamingFitting?.pipeId === item.ref.pipeId && renamingFitting?.fittingId === item.ref.fittingId}
  {@const active = interactive && !owner?.locked && !renamed}
  <text class="label" class:hit={active} x={item.x} y={item.y} text-anchor={item.anchor} font-family={FONT} font-size={item.size}
        fill={item.color} visibility={renamed ? "hidden" : "visible"} pointer-events={active ? "all" : "none"}
        data-shape-id={owner?.id} data-fitting-id={item.ref.fittingId} data-element-label={item.ref.fittingId === undefined ? "" : undefined}
        data-fitting-label={item.ref.fittingId === undefined ? undefined : ""} role="presentation">{item.text}</text>
{/snippet}

<g class="hydronic-layer">
  <g pointer-events="none">
    {#each scene as item (item.id)}
      {@render visual(item)}
    {/each}
  </g>

  {#each pipes as pipe (pipe.id)}
    {@const d = routePath(drawn.get(pipe.id))}
    {#if selectedIds.includes(pipe.id)}
      <path {d} fill="none" stroke={HIGHLIGHT} stroke-width="3" opacity="0.9" stroke-linejoin="round"
            vector-effect="non-scaling-stroke" pointer-events="none"/>
    {/if}
    <path class:hit={interactive && !pipe.locked} {d} fill="none" stroke="transparent"
          stroke-width={Math.max(pipeWidthOf(pipe, style) + 4, 14 * px)} stroke-linejoin="round"
          pointer-events={interactive && !pipe.locked ? "stroke" : "none"}
          data-shape-id={pipe.id} role="presentation"/>
  {/each}

  {#each [...bars, ...others].filter((element) => !(element.z > 0)) as element (element.id)}
    {@render elementHit(element)}
  {/each}

  {#each pipes as pipe (pipe.id)}
    {#each pipe.fittings ?? [] as fitting (fitting.id)}
      {#if HYDRONIC_ELEMENTS[fitting.type]}
        {@const size = fittingSize(fitting)}
        {@const pose = fittingPose(routes.get(pipe.id), fitting)}
        {@const active = (selectedFitting?.pipeId === pipe.id && selectedFitting?.fittingId === fitting.id) || selectedFittings.some((entry) => entry.pipeId === pipe.id && entry.fittingId === fitting.id)}
        <rect class="fitting-hit" x={-size.width / 2} y={-size.height / 2} width={size.width} height={size.height} rx="3"
              transform="translate({pose.x} {pose.y}) rotate({pose.rotation})"
              stroke={active ? HIGHLIGHT : "none"} stroke-width="2" vector-effect="non-scaling-stroke"
              pointer-events={interactive && !pipe.locked ? "all" : "none"}
              data-shape-id={pipe.id} data-fitting-id={fitting.id} role="presentation"/>
      {/if}
    {/each}
  {/each}

  {#each scene.filter((item) => item.kind === "label" && item.ref) as item (item.id)}
    {@render caption(item)}
  {/each}

  {#each [...readouts] as [fittingId, box] (fittingId)}
    {@const pipe = byId.get(box.pipeId)}
    {@const active = (selectedFitting?.pipeId === box.pipeId && selectedFitting?.fittingId === fittingId) || selectedFittings.some((entry) => entry.pipeId === box.pipeId && entry.fittingId === fittingId)}
    <rect class="readout-hit" x={box.x - 3} y={box.y - 3} width={box.width + 6} height={box.height + 6} rx="3"
          fill="transparent" stroke={active ? HIGHLIGHT : "none"} stroke-width="1.5" stroke-dasharray="4 3"
          vector-effect="non-scaling-stroke" pointer-events={interactive && !pipe?.locked ? "all" : "none"}
          data-shape-id={box.pipeId} data-readout-id={fittingId} role="presentation"/>
  {/each}

  {#each [...bars, ...others].filter((element) => element.z > 0).sort((a, b) => a.z - b.z) as element (element.id)}
    {@render elementHit(element)}
  {/each}

  {#if interactive}
    {#each pipes as pipe (pipe.id)}
      {@const route = drawn.get(pipe.id)}
      {#each [["from", route[0]], ["to", route[route.length - 1]]].filter(([end]) => endEditable(pipe, end)) as [end, point]}
        {@const junction = pipe[end]?.pipe !== undefined}
        {@const loose = pipe[end]?.pipe === undefined && pipe[end]?.id === undefined}
        <g class="pipe-end">
          <g class="end-mark" pointer-events="none">
            {#if junction}
              <circle cx={point.x} cy={point.y} r={style.junctionRadius + 3 * px} fill="none" stroke={PORT}
                      stroke-width="2" vector-effect="non-scaling-stroke"/>
            {:else if loose}
              <rect x={point.x - 5 * px} y={point.y - 5 * px} width={10 * px} height={10 * px} rx={1.5 * px} fill="#FFFFFF" stroke={PORT}
                    stroke-width="2" vector-effect="non-scaling-stroke"/>
            {:else}
              <circle cx={point.x} cy={point.y} r={9 * px} fill="#FFFFFF" stroke="#DC2626" stroke-width="2" vector-effect="non-scaling-stroke"/>
              <path d="M {point.x - 3.5 * px} {point.y - 3.5 * px} L {point.x + 3.5 * px} {point.y + 3.5 * px} M {point.x + 3.5 * px} {point.y - 3.5 * px} L {point.x - 3.5 * px} {point.y + 3.5 * px}"
                    stroke="#DC2626" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
            {/if}
          </g>
          <circle class="end-hit" cx={point.x} cy={point.y} r={Math.max(9 * px, junction ? style.junctionRadius : 0)} fill="transparent"
                  pointer-events={pipe.locked ? "none" : "all"} data-shape-id={pipe.id} data-pipe-end={end} role="presentation">
            <title>{junction ? "Drag to move the junction along the pipe" : loose ? "Drag to move the end · drop it on an element or a pipe to connect" : "Drag to reconnect or pull loose · click to detach the pipe"}</title>
          </circle>
        </g>
      {/each}
    {/each}
  {/if}

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

  {#if tool === "pipe" || showPorts}
    <g pointer-events="none">
      {#each equipment as element (element.id)}
        {#each elementPorts(element) as port}
          {@const spot = contactPoint(element, port)}
          <circle cx={spot.x} cy={spot.y} r={2.5 * px} fill="#FFFFFF" stroke={PORT} stroke-width="1.2"
                  vector-effect="non-scaling-stroke" opacity="0.8"/>
        {/each}
      {/each}
      {#if target}
        {@const spot = portSpot(target)}
        <circle cx={spot.x} cy={spot.y} r={7 * px} fill={PORT} fill-opacity="0.18" stroke={PORT}
                stroke-width="2" vector-effect="non-scaling-stroke"/>
        <circle cx={spot.x} cy={spot.y} r={3 * px} fill={PORT}/>
      {/if}
    </g>
  {/if}

  {#if guide}
    <line x1={guide.x1} y1={guide.y1} x2={guide.x2} y2={guide.y2} stroke={PORT} stroke-width="1.5" stroke-dasharray="5 4"
          vector-effect="non-scaling-stroke" pointer-events="none"/>
  {/if}

  {#if preview}
    {@const previewRoute = touchRoute(preview.route, preview, byId)}
    <g pointer-events="none">
      <path d={routePath(previewRoute)} fill="none" stroke={mediumOf(preview.medium).color} stroke-width={preview.width ?? style.pipeWidth}
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
      {#each buildScene([{ id: -1, kind: "equipment", ...placement.element }, ...(placement.pipes ?? [])], style) as item (item.id)}
        {@render visual(item)}
      {/each}
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

  {#if linking}
    <g class="link-targets">
      {#each linkElements as element (element.id)}
        {@const on = hovered(element.id, null, "self")}
        <rect class="link-target" x={element.x - 3 * px} y={element.y - 3 * px} width={element.width + 6 * px} height={element.height + 6 * px} rx={3 * px}
              fill={on ? "rgba(37, 99, 235, 0.16)" : "transparent"} stroke={element.variable ? LINKED : PORT} stroke-width={on ? 2.5 : 1.5}
              stroke-dasharray={element.variable ? undefined : "5 4"} vector-effect="non-scaling-stroke" pointer-events="all"
              data-link-shape={element.id} data-link-key="self" role="presentation"/>
      {/each}
      {#each pipes as pipe (pipe.id)}
        {#each (pipe.fittings ?? []).filter((fitting) => HYDRONIC_ELEMENTS[fitting.type]) as fitting (fitting.id)}
          {@const size = fittingSize(fitting)}
          {@const pose = fittingPose(routes.get(pipe.id), fitting)}
          {@const on = hovered(pipe.id, fitting.id, "self")}
          <rect class="link-target" x={-size.width / 2 - 2} y={-size.height / 2 - 2} width={size.width + 4} height={size.height + 4} rx="3"
                transform="translate({pose.x} {pose.y}) rotate({pose.rotation})"
                fill={on ? "rgba(37, 99, 235, 0.16)" : "transparent"} stroke={fitting.variable ? LINKED : PORT} stroke-width={on ? 2.5 : 1.5}
                stroke-dasharray={fitting.variable ? undefined : "4 3"} vector-effect="non-scaling-stroke" pointer-events="all"
                data-link-shape={pipe.id} data-link-fitting={fitting.id} data-link-key="self" role="presentation"/>
        {/each}
      {/each}
      {#each linkFields as item (item.id)}
        {@const on = hovered(item.link.shapeId, item.link.fittingId, item.link.key)}
        <rect class="link-target" x={item.x - 1.5} y={item.y - 1.5} width={item.width + 3} height={item.height + 3} rx="2"
              fill={on ? "rgba(37, 99, 235, 0.22)" : "rgba(255, 255, 255, 0.01)"} stroke={item.variable ? LINKED : PORT} stroke-width={on ? 2.5 : 1.5}
              stroke-dasharray={item.variable ? undefined : "3 3"} vector-effect="non-scaling-stroke" pointer-events="all"
              data-link-shape={item.link.shapeId} data-link-fitting={item.link.fittingId} data-link-key={item.link.key} role="presentation"/>
      {/each}
    </g>
  {/if}
</g>
