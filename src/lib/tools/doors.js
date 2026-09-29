import { outlinePoints, segmentCurved, nearestEdgePoint } from "./path.js";
import { polygonCentroid } from "./polygon.js";
import { svgElement } from "../export/atvise.js";

export const DOOR_WIDTH = 90;
export const DOOR_ELEMENTS = {
  door: { label: "Door", type: "single", width: 90 },
  doubleDoor: { label: "Double door", type: "double", width: 160 },
  slidingDoor: { label: "Sliding door", type: "sliding", width: 120 },
  opening: { label: "Opening", type: "opening", width: 100 },
  window: { label: "Window", type: "window", width: 120 }
};

export function isDoorElement(type){
  return !!DOOR_ELEMENTS[type];
}

function withExtent(geometry){
  const extent = [geometry.p0, geometry.p1];
  for (const part of geometry.parts) if (part.from) extent.push(part.from, part.to);
  return { ...geometry, extent };
}

export const DOOR_TYPES = [
  { id: "single", label: "Single" },
  { id: "double", label: "Double" },
  { id: "sliding", label: "Sliding" },
  { id: "opening", label: "Opening" },
  { id: "window", label: "Window" }
];
export const MIN_DOOR_WIDTH = 50;
const WALL_MARGIN = 10;
const ON_WALL = 3;

function round2(value){
  return Math.round(value * 100) / 100;
}

function pointInPolygon(point, polygon){
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

function edgeOf(room, edge){
  const count = room.points.length;
  if (edge >= count || segmentCurved(room, edge)) return null;
  const a = room.points[edge];
  const b = room.points[(edge + 1) % count];
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (length === 0) return null;
  return { a, b, length, u: { x: (b.x - a.x) / length, y: (b.y - a.y) / length } };
}

export function maxDoorWidth(room, edge){
  const wall = edgeOf(room, edge);
  return wall ? Math.max(0, Math.floor(wall.length - WALL_MARGIN * 2)) : 0;
}

export function doorGeometry(room, door){
  const geometry = doorShape(room, door);
  return geometry ? withExtent(geometry) : null;
}

function doorShape(room, door){
  const wall = edgeOf(room, door.edge);
  if (!wall) return null;
  const width = Math.min(door.width, wall.length);
  const center = { x: wall.a.x + wall.u.x * door.t * wall.length, y: wall.a.y + wall.u.y * door.t * wall.length };
  const p0 = { x: center.x - wall.u.x * width / 2, y: center.y - wall.u.y * width / 2 };
  const p1 = { x: center.x + wall.u.x * width / 2, y: center.y + wall.u.y * width / 2 };

  const normal = { x: -wall.u.y, y: wall.u.x };
  const probe = { x: center.x + normal.x * 2, y: center.y + normal.y * 2 };
  const inward = pointInPolygon(probe, outlinePoints(room)) ? normal : { x: -normal.x, y: -normal.y };
  const side = door.swing === "out" ? { x: -inward.x, y: -inward.y } : inward;

  const left = { x: -inward.y, y: inward.x };
  const p0IsLeft = (p0.x - center.x) * left.x + (p0.y - center.y) * left.y > 0;
  const hinge = (door.hinge === "right") === p0IsLeft ? p1 : p0;
  const closed = hinge === p0 ? p1 : p0;
  const type = door.type ?? "single";
  const offset = (point, distance) => ({ x: round2(point.x + side.x * distance), y: round2(point.y + side.y * distance) });
  const quad = (depth) => {
    const a = offset(p1, depth);
    const b = offset(p0, depth);
    return `M ${round2(p0.x)} ${round2(p0.y)} L ${round2(p1.x)} ${round2(p1.y)} L ${a.x} ${a.y} L ${b.x} ${b.y} Z`;
  };
  const swingLeaf = (from, to, radius) => {
    const tip = offset(from, radius);
    const cross = (tip.x - from.x) * (to.y - from.y) - (tip.y - from.y) * (to.x - from.x);
    const r = round2(radius);
    const arc = `A ${r} ${r} 0 0 ${cross > 0 ? 1 : 0} ${round2(to.x)} ${round2(to.y)}`;
    return {
      leaf: { kind: "leaf", from: { x: round2(from.x), y: round2(from.y) }, to: tip },
      arc: { kind: "arc", d: `M ${tip.x} ${tip.y} ${arc}` },
      wedge: `M ${round2(from.x)} ${round2(from.y)} L ${tip.x} ${tip.y} ${arc} Z`
    };
  };

  if (type === "double") {
    const first = swingLeaf(p0, center, width / 2);
    const second = swingLeaf(p1, center, width / 2);
    return { p0, p1, type, parts: [first.arc, second.arc, first.leaf, second.leaf], wedge: `${first.wedge} ${second.wedge}` };
  }
  if (type === "sliding") {
    const towards = hinge === p0 ? 1 : -1;
    const along = { x: wall.u.x * width * 0.55 * towards, y: wall.u.y * width * 0.55 * towards };
    const a = offset(hinge, 5);
    const c = offset(closed, 11);
    return {
      p0, p1, type,
      parts: [
        { kind: "panel", from: a, to: { x: round2(a.x + along.x), y: round2(a.y + along.y) } },
        { kind: "panel", from: c, to: { x: round2(c.x - along.x), y: round2(c.y - along.y) } }
      ],
      wedge: quad(16)
    };
  }
  if (type === "opening") return { p0, p1, type, parts: [], wedge: quad(16) };
  if (type === "window") {
    const across = { x: inward.x, y: inward.y };
    const shift = (point, distance) => ({ x: round2(point.x + across.x * distance), y: round2(point.y + across.y * distance) });
    const pane = 3;
    return {
      p0, p1, type,
      parts: [
        { kind: "glass", from: shift(p0, -pane), to: shift(p1, -pane) },
        { kind: "glass", from: shift(p0, pane), to: shift(p1, pane) },
        { kind: "frame", from: shift(p0, -6), to: shift(p0, 6) },
        { kind: "frame", from: shift(p1, -6), to: shift(p1, 6) }
      ],
      wedge: `M ${shift(p0, -10).x} ${shift(p0, -10).y} L ${shift(p1, -10).x} ${shift(p1, -10).y} L ${shift(p1, 10).x} ${shift(p1, 10).y} L ${shift(p0, 10).x} ${shift(p0, 10).y} Z`
    };
  }
  const single = swingLeaf(hinge, closed, width);
  return { p0, p1, type, parts: [single.arc, single.leaf], wedge: single.wedge };
}

export function projectDoor(room, point, width, step = 5){
  let best = null;
  for (let edge = 0; edge < room.points.length; edge += 1) {
    const wall = edgeOf(room, edge);
    if (!wall || wall.length < width + WALL_MARGIN * 2) continue;
    const along = (point.x - wall.a.x) * wall.u.x + (point.y - wall.a.y) * wall.u.y;
    const min = width / 2 + WALL_MARGIN;
    const max = wall.length - width / 2 - WALL_MARGIN;
    const offset = Math.min(max, Math.max(min, Math.round(along / step) * step));
    const x = wall.a.x + wall.u.x * offset;
    const y = wall.a.y + wall.u.y * offset;
    const gap = Math.hypot(point.x - x, point.y - y);
    if (!best || gap < best.gap) best = { gap, edge, t: offset / wall.length };
  }
  return best ? { edge: best.edge, t: best.t } : null;
}

function distanceToOutline(point, outline){
  const nearest = nearestEdgePoint(point, [outline], Infinity);
  return nearest ? Math.hypot(nearest.x - point.x, nearest.y - point.y) : Infinity;
}

export function suggestDoor(room, shapes){
  const floors = shapes.filter((shape) => shape.kind === "floor").map(outlinePoints);
  const corridors = shapes.filter((shape) => shape.kind === "room" && shape !== room && shape.category === "corridor").map(outlinePoints);
  const focus = floors.length ? polygonCentroid(floors[0]) : polygonCentroid(outlinePoints(room));

  const candidates = [];
  for (let edge = 0; edge < room.points.length; edge += 1) {
    const wall = edgeOf(room, edge);
    if (!wall || wall.length < MIN_DOOR_WIDTH + WALL_MARGIN * 2) continue;
    const mid = { x: (wall.a.x + wall.b.x) / 2, y: (wall.a.y + wall.b.y) / 2 };
    const exterior = floors.some((outline) => distanceToOutline(mid, outline) <= ON_WALL);
    const score = corridors.length
      ? Math.min(...corridors.map((outline) => distanceToOutline(mid, outline)))
      : Math.hypot(mid.x - focus.x, mid.y - focus.y);
    candidates.push({ edge, wall, exterior, score });
  }
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => (a.exterior - b.exterior) || (a.score - b.score));
  const pick = candidates[0];
  return {
    edge: pick.edge,
    t: 0.5,
    width: Math.min(DOOR_WIDTH, Math.floor(pick.wall.length - WALL_MARGIN * 2)),
    hinge: "left",
    swing: "in"
  };
}

export function partWidth(part){
  if (part.kind === "leaf") return 4;
  if (part.kind === "glass") return 1.5;
  if (part.kind === "frame") return 2;
  return 3;
}

export function doorsToSvg(room, style, background){
  return (room.doors ?? []).map((door) => {
    const geometry = doorGeometry(room, door);
    if (!geometry) return "";
    const id = `door_${room.id}_${door.id}`;
    const gap = Math.max(style.floorWidth, style.roomWidth) + 2;
    const { p0, p1 } = geometry;
    return [
      svgElement("line", { fill: "none", id: `${id}_gap`, stroke: background, "stroke-width": gap, x1: round2(p0.x), x2: round2(p1.x), y1: round2(p0.y), y2: round2(p1.y) }),
      ...geometry.parts.map((part, index) => part.kind === "arc"
        ? svgElement("path", { d: part.d, fill: "none", id: `${id}_arc_${index}`, stroke: style.doorColor, "stroke-width": 1.5 })
        : svgElement("line", { fill: "none", id: `${id}_${part.kind}_${index}`, stroke: style.doorColor, "stroke-linecap": part.kind === "glass" || part.kind === "frame" ? "butt" : "round", "stroke-width": partWidth(part), x1: part.from.x, x2: part.to.x, y1: part.from.y, y2: part.to.y }))
    ].join("\n");
  }).filter(Boolean);
}
