import { outlinePoints, segmentCurved, nearestEdgePoint } from "./path.js";
import { polygonCentroid } from "./polygon.js";
import { svgElement } from "../export/atvise.js";

export const DOOR_WIDTH = 90;
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
  const leaf = { x: hinge.x + side.x * width, y: hinge.y + side.y * width };
  const cross = (leaf.x - hinge.x) * (closed.y - hinge.y) - (leaf.y - hinge.y) * (closed.x - hinge.x);
  const sweep = cross > 0 ? 1 : 0;
  const r = round2(width);

  return {
    p0,
    p1,
    hinge,
    leaf,
    swing: `M ${round2(leaf.x)} ${round2(leaf.y)} A ${r} ${r} 0 0 ${sweep} ${round2(closed.x)} ${round2(closed.y)}`,
    wedge: `M ${round2(hinge.x)} ${round2(hinge.y)} L ${round2(leaf.x)} ${round2(leaf.y)} A ${r} ${r} 0 0 ${sweep} ${round2(closed.x)} ${round2(closed.y)} Z`
  };
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

export function doorsToSvg(room, style, background){
  return (room.doors ?? []).map((door) => {
    const geometry = doorGeometry(room, door);
    if (!geometry) return "";
    const id = `door_${room.id}_${door.id}`;
    const gap = Math.max(style.floorWidth, style.roomWidth) + 2;
    const { p0, p1, hinge, leaf } = geometry;
    return [
      svgElement("line", { fill: "none", id: `${id}_gap`, stroke: background, "stroke-width": gap, x1: round2(p0.x), x2: round2(p1.x), y1: round2(p0.y), y2: round2(p1.y) }),
      svgElement("path", { d: geometry.swing, fill: "none", id: `${id}_swing`, stroke: style.doorColor, "stroke-width": 1.5 }),
      svgElement("line", { fill: "none", id: `${id}_leaf`, stroke: style.doorColor, "stroke-linecap": "round", "stroke-width": 4, x1: round2(hinge.x), x2: round2(leaf.x), y1: round2(hinge.y), y2: round2(leaf.y) })
    ].join("\n");
  }).filter(Boolean);
}
