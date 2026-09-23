import { polygonArea, polygonSelfIntersects, samePoint } from "./polygon.js";

const ON_OUTLINE = 0.6;
const EPSILON = 0.01;

function locate(point, outline){
  let walked = 0;
  for (let index = 0; index < outline.length; index += 1) {
    const a = outline[index];
    const b = outline[(index + 1) % outline.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (length > 0) {
      const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (length * length)));
      const gap = Math.hypot(a.x + dx * t - point.x, a.y + dy * t - point.y);
      if (gap <= ON_OUTLINE) return walked + t * length;
    }
    walked += length;
  }
  return null;
}

function perimeterStops(outline){
  const stops = [];
  let walked = 0;
  for (let index = 0; index < outline.length; index += 1) {
    stops.push(walked);
    const next = outline[(index + 1) % outline.length];
    walked += Math.hypot(next.x - outline[index].x, next.y - outline[index].y);
  }
  return { stops, perimeter: walked };
}

function walk(outline, stops, perimeter, from, to, forward){
  const span = forward ? (to - from + perimeter) % perimeter : (from - to + perimeter) % perimeter;
  return outline
    .map((vertex, index) => ({
      vertex,
      gap: forward ? (stops[index] - from + perimeter) % perimeter : (from - stops[index] + perimeter) % perimeter
    }))
    .filter((entry) => entry.gap > EPSILON && entry.gap < span - EPSILON)
    .sort((a, b) => a.gap - b.gap)
    .map((entry) => ({ x: entry.vertex.x, y: entry.vertex.y }));
}

export function isOnOutline(point, outlines){
  return outlines.some((outline) => locate(point, outline) !== null);
}

export function floorClosure(points, end, outlines){
  if (points.length < 1) return null;
  const start = points[0];
  if (samePoint(start, end)) return null;

  for (const outline of outlines) {
    const from = locate(end, outline);
    const to = locate(start, outline);
    if (from === null || to === null) continue;

    const { stops, perimeter } = perimeterStops(outline);
    const drawn = [...points.map((point) => ({ x: point.x, y: point.y })), { x: end.x, y: end.y }];
    const candidates = [true, false]
      .map((forward) => ({ forward, points: [...drawn, ...walk(outline, stops, perimeter, from, to, forward)] }))
      .filter((candidate) => candidate.points.length >= 3
        && polygonArea(candidate.points) > 1
        && !polygonSelfIntersects(candidate.points));
    if (candidates.length === 0) continue;

    candidates.sort((a, b) => polygonArea(a.points) - polygonArea(b.points));
    return { points: candidates[0].points, added: candidates[0].points.length - drawn.length };
  }
  return null;
}
