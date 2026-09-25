import { boundsCenter, polygonBounds, formatArea, formatMeters, innerPoint, pointInPolygon } from "./polygon.js";
import { outlinePoints, shapePath, hasCurves, nearestEdge, projectOnSegment } from "./path.js";
import { categoryLabel, defaultCategoryColors } from "./categories.js";
import { doorsToSvg } from "./doors.js";
import { svgElement, escapeXml } from "../export/atvise.js";
import { furnitureToSvg, FURNITURE_STYLE } from "./furniture.js";
import { wallsToSvg } from "./walls.js";

export const ROOM_TOOLS = ["floor", "room-rect", "room-poly"];
export const POLYGON_TOOLS = ["floor", "room-poly"];
export const ROOM_KINDS = ["floor", "room"];
export const VERTEX_SNAP_PX = 10;
export const FLOOR_OPACITY = 0.55;
export const ROOM_OPACITY = 0.65;

export const ROOM_STYLE = {
  floorFill: "#F1F5F9",
  floorStroke: "#334155",
  floorWidth: 12,
  roomFill: "#DBEAFE",
  roomStroke: "#2563EB",
  roomWidth: 8,
  labelColor: "#1E3A8A",
  labelFont: "Roboto",
  labelSize: 20,
  doorColor: "#0F172A",
  categories: defaultCategoryColors()
};

export const THERMOSTAT = {
  width: 160,
  height: 130,
  radius: 8,
  fill: "#E8ECEF",
  border: "#D5DBE1",
  shadow: "#0F172A",
  nameColor: "#7B8794",
  valueColor: "#8A96A3",
  statusColor: "#9AA5B1",
  placeholder: "--.-",
  minScale: 0.35
};

export function roomColors(shape, style = ROOM_STYLE){
  const category = shape.category ? style.categories?.[shape.category] : null;
  return category ?? { fill: style.roomFill, stroke: style.roomStroke };
}

export function isRoomTool(tool){
  return ROOM_TOOLS.includes(tool);
}

export function isPolygonTool(tool){
  return POLYGON_TOOLS.includes(tool);
}

export function isRoomShape(shape){
  return ROOM_KINDS.includes(shape.kind);
}

export function roomKindLabel(kind){
  if (kind === "floor") return "Floor";
  if (kind === "curve") return "Curve";
  if (kind === "image") return "Image";
  if (kind === "wall") return "Wall";
  if (kind === "equipment") return "Element";
  if (kind === "pipe") return "Pipe";
  return "Room";
}

export function nextRoomName(shapes){
  const taken = new Set(shapes.filter((shape) => shape.kind === "room").map((shape) => shape.name));
  let index = 1;
  while (taken.has(`Room ${index}`)) index += 1;
  return `Room ${index}`;
}

export function describeRoom(shape){
  const outline = outlinePoints(shape);
  const box = polygonBounds(outline);
  const size = `${formatMeters(box.width)} × ${formatMeters(box.height)}`;
  const area = formatArea(outline);
  if (shape.kind === "floor") return `${size} · ${area}`;
  return shape.category ? `${shape.name} · ${categoryLabel(shape.category)}` : shape.name;
}

export function snapVertices(shapes, draft){
  const vertices = [];
  for (const shape of shapes) {
    if (isRoomShape(shape) || shape.kind === "wall") vertices.push(...shape.points);
    if (shape.kind === "curve") vertices.push(shape.points[0], shape.points[2]);
  }
  if (draft?.points) vertices.push(...draft.points);
  return vertices;
}

export function snapToEdges(point, shapes, radius, exclude = null, preferred = null){
  const outlines = shapes.filter((shape) => isRoomShape(shape) && shape !== exclude).map(outlinePoints);
  const edge = nearestEdge(point, outlines, radius);
  if (!edge) return null;
  const projected = projectOnSegment(preferred ?? point, edge.a, edge.b);
  return { x: round(projected.x), y: round(projected.y) };
}

export function labelPoint(shape){
  return innerPoint(outlinePoints(shape));
}

function cardFits(outline, center, width, height){
  const x0 = center.x - width / 2;
  const x1 = center.x + width / 2;
  const y0 = center.y - height / 2;
  const y1 = center.y + height / 2;
  const corners = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
  if (!corners.every((corner) => pointInPolygon(corner, outline))) return false;
  return !outline.some((vertex) => vertex.x > x0 && vertex.x < x1 && vertex.y > y0 && vertex.y < y1);
}

export function thermostatScale(outline, center, style = ROOM_STYLE){
  const margin = style.roomWidth / 2 + 6;
  for (let scale = 1; scale >= THERMOSTAT.minScale; scale = round(scale - 0.05)) {
    if (cardFits(outline, center, THERMOSTAT.width * scale + margin * 2, THERMOSTAT.height * scale + margin * 2)) return scale;
  }
  return THERMOSTAT.minScale;
}

function thermostatCenter(room){
  const base = labelPoint(room);
  const offset = room.thermostat ?? { dx: 0, dy: 0 };
  return { x: base.x + offset.dx, y: base.y + offset.dy };
}

export function thermostatFit(room, style = ROOM_STYLE){
  return thermostatScale(outlinePoints(room), thermostatCenter(room), style);
}

export function thermostatGlobalScale(shapes, style = ROOM_STYLE){
  const scales = shapes.filter((shape) => shape.kind === "room" && shape.regulated).map((room) => thermostatFit(room, style));
  return scales.length ? Math.min(...scales) : 1;
}

export function thermostatRect(room, style = ROOM_STYLE, globalScale = null){
  const center = thermostatCenter(room);
  const scale = globalScale ?? thermostatFit(room, style);
  const width = round(THERMOSTAT.width * scale);
  const height = round(THERMOSTAT.height * scale);
  return { x: round(center.x - width / 2), y: round(center.y - height / 2), width, height, scale };
}

export function thermostatText(card){
  const center = card.x + card.width / 2;
  const scale = card.width / THERMOSTAT.width;
  return {
    name: { x: center, y: round(card.y + 34 * scale), size: round(19 * scale) },
    value: { x: center, y: round(card.y + 82 * scale), size: round(36 * scale) },
    status: { x: center, y: round(card.y + 112 * scale), size: round(15 * scale) }
  };
}

export function layered(shapes){
  const rank = (shape) => shape.kind === "floor" ? 0 : shape.kind === "room" ? 1 : 2;
  return [...shapes].sort((a, b) => rank(a) - rank(b));
}

function round(value){
  return Math.round(value * 100) / 100;
}

function reference(shape){
  const center = boundsCenter(outlinePoints(shape));
  return { "atv:refpx": round(center.x), "atv:refpy": round(center.y) };
}

function outline(shape, paint, id){
  if (hasCurves(shape) || shape.radii?.some((radius) => radius > 0)) {
    return svgElement("path", { ...reference(shape), ...paint, d: shapePath(shape), id });
  }
  const points = shape.points.map((point) => `${point.x},${point.y}`).join(" ");
  return svgElement("polygon", { ...reference(shape), ...paint, id, points });
}

function roomLabel(shape, style){
  const label = labelPoint(shape);
  return svgElement("text", {
    "atv:refpx": round(label.x),
    "atv:refpy": round(label.y),
    fill: style.labelColor,
    "font-family": style.labelFont,
    "font-size": style.labelSize,
    id: `room_${shape.id}_label`,
    "text-anchor": "middle",
    x: round(label.x),
    y: round(label.y + style.labelSize * 0.35)
  }, escapeXml(shape.name));
}

function thermostatSvg(room, style, scale){
  const card = thermostatRect(room, style, scale);
  const text = thermostatText(card);
  const id = `room_${room.id}_thermostat`;
  const label = (key, value, color, weight) => svgElement("text", {
    fill: color,
    "font-family": style.labelFont,
    "font-size": text[key].size,
    "font-weight": weight,
    id: `${id}_${key}`,
    "text-anchor": "middle",
    x: round(text[key].x),
    y: round(text[key].y)
  }, escapeXml(value));

  return [
    `<g atv:refpx="${round(card.x + card.width / 2)}" atv:refpy="${round(card.y + card.height / 2)}" id="${id}">`,
    svgElement("rect", { fill: THERMOSTAT.shadow, "fill-opacity": 0.08, height: card.height, id: `${id}_shadow`, rx: round(THERMOSTAT.radius * card.scale), ry: round(THERMOSTAT.radius * card.scale), width: card.width, x: card.x, y: round(card.y + 3 * card.scale) }),
    svgElement("rect", { fill: THERMOSTAT.fill, height: card.height, id: `${id}_box`, rx: round(THERMOSTAT.radius * card.scale), ry: round(THERMOSTAT.radius * card.scale), stroke: THERMOSTAT.border, "stroke-width": 1, width: card.width, x: card.x, y: card.y }),
    label("name", room.name, THERMOSTAT.nameColor, "bold"),
    label("value", THERMOSTAT.placeholder, THERMOSTAT.valueColor, "bold"),
    label("status", THERMOSTAT.placeholder, THERMOSTAT.statusColor, "normal"),
    `</g>`
  ].join("\n");
}

export function roomsToSvg(shapes, style = ROOM_STYLE, background = "#FFFFFF"){
  const floors = shapes.filter((shape) => shape.kind === "floor");
  const rooms = shapes.filter((shape) => shape.kind === "room");
  const scale = thermostatGlobalScale(shapes, style);
  return [
    ...floors.map((shape) => outline(shape, { fill: style.floorFill, stroke: "none" }, `floor_${shape.id}`)),
    ...rooms.map((shape) => {
      const colors = roomColors(shape, style);
      return outline(shape, { fill: colors.fill, stroke: colors.stroke, "stroke-linejoin": "miter", "stroke-width": style.roomWidth }, `room_${shape.id}`);
    }),
    ...rooms.flatMap((shape) => furnitureToSvg(shape, { ...FURNITURE_STYLE, opacity: style.furnitureOpacity ?? FURNITURE_STYLE.opacity })),
    ...floors.map((shape) => outline(shape, { fill: "none", stroke: style.floorStroke, "stroke-linejoin": "miter", "stroke-width": style.floorWidth }, `floor_${shape.id}_wall`)),
    ...wallsToSvg(shapes, style),
    ...rooms.flatMap((shape) => doorsToSvg(shape, style, background)),
    ...rooms.filter((shape) => !shape.regulated).map((shape) => roomLabel(shape, style)),
    ...rooms.filter((shape) => shape.regulated).map((shape) => thermostatSvg(shape, style, scale))
  ].join("\n");
}
