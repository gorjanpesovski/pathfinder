<svelte:options namespace="svg"/>

<script>
  import { polygonPath, formatMeters, rectPoints, samePoint, wouldCross, distance } from "$lib/tools/polygon.js";
  import { shapePath } from "$lib/tools/path.js";
  import { ROOM_STYLE, FLOOR_OPACITY, ROOM_OPACITY, isPolygonTool, labelPoint, roomColors } from "$lib/tools/rooms.js";
  import { furnitureTransform } from "$lib/tools/furniture.js";
  import FurnitureShape from "./FurnitureShape.svelte";
  import { categoryLabel } from "$lib/tools/categories.js";

  let { shapes, draft, cursor, zoom, selectedIds = [], interactive, style = ROOM_STYLE, closure = null, selectedFurniture = null } = $props();

  const INVALID = "#DC2626";
  const HIGHLIGHT = "#F59E0B";

  let floors = $derived(shapes.filter((shape) => shape.kind === "floor"));
  let rooms = $derived(shapes.filter((shape) => shape.kind === "room"));
  let labelled = $derived(rooms.filter((shape) => !shape.regulated));
  let furnished = $derived(rooms.filter((shape) => shape.furniture?.length));
  let selected = $derived(shapes.filter((shape) => selectedIds.includes(shape.id) && (shape.kind === "floor" || shape.kind === "room")));
  let px = $derived(1 / zoom);

  let preview = $derived.by(() => {
    if (!draft || !cursor) return null;
    // const color = draft.kind === "floor" || draft.target === "floor" ? style.floorStroke : style.roomStroke;
    const color = draft.target === "wall" ? style.wallStroke : draft.kind === "floor" || draft.target === "floor" ? style.floorStroke : style.roomStroke;

    if (draft.kind === "room-rect") {
      return {
        kind: "rect",
        color,
        points: rectPoints(draft.start, cursor),
        label: `${formatMeters(Math.abs(cursor.x - draft.start.x))} × ${formatMeters(Math.abs(cursor.y - draft.start.y))}`
      };
    }

    if (!isPolygonTool(draft.kind)) return null;
    const last = draft.points[draft.points.length - 1];
    const closing = draft.points.length >= 3 && samePoint(cursor, draft.start);
    const invalid = !closing && !samePoint(cursor, last) && wouldCross(draft.points, cursor);
    return {
      kind: "poly",
      color,
      last,
      closing,
      invalid,
      points: draft.points,
      label: closing ? "Close shape" : draft.target === "wall" && samePoint(cursor, last) && draft.points.length >= 2 ? "Finish open wall" : formatMeters(distance(last, cursor))
    };
  });
</script>

<style>
  .hit {
    cursor: move;
  }

  .furniture-hit {
    cursor: move;
    fill: transparent;
    transition: fill 0.1s ease;
  }

  .furniture-hit:hover {
    fill: rgba(147, 197, 253, 0.35);
  }

  text {
    paint-order: stroke;
    stroke: #ffffff;
    stroke-linejoin: round;
    pointer-events: none;
    user-select: none;
  }
</style>

<g class="room-layer">
  {#each floors as shape (shape.id)}
    <path d={shapePath(shape)} fill={style.floorFill} fill-opacity={FLOOR_OPACITY} stroke="none"
          data-shape-id={shape.id} class:hit={interactive && !shape.locked}
          pointer-events={interactive && !shape.locked ? "visiblePainted" : "none"}
          role="presentation"/>
  {/each}

  {#each rooms as shape (shape.id)}
    {@const colors = roomColors(shape, style)}
    <path d={shapePath(shape)} fill={colors.fill} fill-opacity={ROOM_OPACITY} stroke={colors.stroke}
          stroke-width={style.roomWidth} stroke-linejoin="miter" data-shape-id={shape.id}
          class:hit={interactive && !shape.locked}
          pointer-events={interactive && !shape.locked ? "visiblePainted" : "none"}
          role="presentation"/>
  {/each}

  {#each furnished as room (room.id)}
    {#each room.furniture as item (item.id)}
      {@const selected = selectedFurniture?.roomId === room.id && selectedFurniture?.itemId === item.id}
      <g transform={furnitureTransform(item)} opacity={style.furnitureOpacity ?? 0.5}>
        <FurnitureShape {item}/>
        <rect class="furniture-hit" x={-item.width / 2} y={-item.height / 2} width={item.width} height={item.height}
              stroke={selected ? HIGHLIGHT : "none"} stroke-width="2" vector-effect="non-scaling-stroke"
              pointer-events={interactive && !room.locked ? "all" : "none"}
              data-shape-id={room.id} data-furniture-id={item.id} role="presentation"/>
      </g>
    {/each}
  {/each}

  {#each floors as shape (shape.id)}
    <path d={shapePath(shape)} fill="none" stroke={style.floorStroke} stroke-width={style.floorWidth}
          stroke-linejoin="miter" data-shape-id={shape.id}
          class:hit={interactive && !shape.locked}
          pointer-events={interactive && !shape.locked ? "stroke" : "none"} role="presentation"/>
  {/each}

  {#each selected as shape (shape.id)}
    <path d={shapePath(shape)} fill="none" stroke={HIGHLIGHT} stroke-width="3" opacity="0.9"
          stroke-linejoin="round" vector-effect="non-scaling-stroke" pointer-events="none"/>
  {/each}

  {#each labelled as shape (shape.id)}
    {@const center = labelPoint(shape)}
    <text x={center.x} y={center.y + (shape.category ? -2 : 4.5) * px} text-anchor="middle" font-family={style.labelFont}
          font-size={13 * px} font-weight="600" fill={style.labelColor} stroke-width={3 * px}>{shape.name}</text>
    {#if shape.category}
      <text x={center.x} y={center.y + 12 * px} text-anchor="middle" font-family={style.labelFont}
            font-size={10.5 * px} fill={roomColors(shape, style).stroke} stroke-width={3 * px}>{categoryLabel(shape.category)}</text>
    {/if}
  {/each}


  {#if closure}
    <path d={polygonPath(closure.points)} fill={style.roomStroke} fill-opacity="0.12" stroke={style.roomStroke}
          stroke-width="2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke" pointer-events="none"/>
  {/if}

  {#if preview}
    <g pointer-events="none">
      {#if preview.kind === "rect" && preview.points}
        <path d={polygonPath(preview.points)} fill={draft.target === "wall" ? "none" : draft.target === "floor" ? style.floorFill : style.roomFill} fill-opacity="0.45" stroke={preview.color}
              stroke-width="1.5" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>
      {:else if preview.kind === "poly"}
        {#if preview.points.length >= 2}
          <path d={polygonPath([...preview.points, cursor])} fill={preview.color} fill-opacity="0.08" stroke="none"/>
        {/if}
        <path d={polygonPath(preview.points, false)} fill="none" stroke={preview.color} stroke-width="2"
              stroke-linejoin="miter" vector-effect="non-scaling-stroke"/>
        <line x1={preview.last.x} y1={preview.last.y} x2={cursor.x} y2={cursor.y}
              stroke={preview.invalid ? INVALID : preview.color} stroke-width="2" stroke-dasharray="6 4"
              vector-effect="non-scaling-stroke"/>
        {#if preview.points.length >= 2 && !preview.closing}
          <line x1={cursor.x} y1={cursor.y} x2={draft.start.x} y2={draft.start.y}
                stroke={preview.color} stroke-width="1" stroke-dasharray="2 4" opacity="0.5"
                vector-effect="non-scaling-stroke"/>
        {/if}
        {#each preview.points as point, index}
          <circle cx={point.x} cy={point.y} r={(index === 0 && preview.closing ? 7 : 3.5) * px}
                  fill={index === 0 && preview.closing ? preview.color : "#FFFFFF"} stroke={preview.color}
                  stroke-width="1.5" vector-effect="non-scaling-stroke"/>
        {/each}
      {/if}
      <text x={cursor.x + 14 * px} y={cursor.y - 12 * px} font-family="inherit" font-size={12 * px} font-weight="600"
            fill={preview.kind === "poly" && preview.invalid ? INVALID : "#0F172A"} stroke-width={3 * px}>
        {closure ? "Close along floor" : preview.kind === "poly" && preview.invalid ? "Edges would cross" : preview.label}
      </text>
    </g>
  {/if}
</g>
