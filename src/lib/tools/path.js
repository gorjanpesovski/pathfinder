import { cornerAt, roundedPath } from "./polygon.js";

const CURVE_STEPS = 16;

function round2(value){
  return Math.round(value * 100) / 100;
}

function handleOf(shape, index){
  return shape.handles?.[index] ?? null;
}

export function hasCurves(shape){
  return !!shape.handles?.some((handle) => handle && (handle.in || handle.out));
}

export function segmentCurved(shape, index){
  const next = (index + 1) % shape.points.length;
  return !!(handleOf(shape, index)?.out || handleOf(shape, next)?.in);
}

export function segmentControls(shape, index){
  const next = (index + 1) % shape.points.length;
  const a = shape.points[index];
  const b = shape.points[next];
  const out = handleOf(shape, index)?.out;
  const into = handleOf(shape, next)?.in;
  return [
    a,
    out ? { x: a.x + out.x, y: a.y + out.y } : a,
    into ? { x: b.x + into.x, y: b.y + into.y } : b,
    b
  ];
}

export function cubicAt(p0, p1, p2, p3, t){
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
  };
}

export function outlinePoints(shape){
  if (!hasCurves(shape)) return shape.points;
  const points = [];
  for (let index = 0; index < shape.points.length; index += 1) {
    points.push(shape.points[index]);
    if (!segmentCurved(shape, index)) continue;
    const [p0, p1, p2, p3] = segmentControls(shape, index);
    for (let step = 1; step < CURVE_STEPS; step += 1) points.push(cubicAt(p0, p1, p2, p3, step / CURVE_STEPS));
  }
  return points;
}

export function cornerRadii(shape){
  const count = shape.points.length;
  return shape.points.map((_, index) => {
    if (segmentCurved(shape, (index - 1 + count) % count) || segmentCurved(shape, index)) return 0;
    return shape.radii?.[index] ?? 0;
  });
}

export function shapePath(shape){
  if (!hasCurves(shape)) return roundedPath(shape.points, shape.radii);

  const count = shape.points.length;
  const radii = cornerRadii(shape);
  const corners = shape.points.map((_, index) => cornerAt(shape.points, index, radii[index]));
  let path = `M ${round2(corners[0].end.x)} ${round2(corners[0].end.y)}`;

  for (let index = 0; index < count; index += 1) {
    if (segmentCurved(shape, index)) {
      const [, c1, c2, end] = segmentControls(shape, index);
      path += ` C ${round2(c1.x)} ${round2(c1.y)} ${round2(c2.x)} ${round2(c2.y)} ${round2(end.x)} ${round2(end.y)}`;
      continue;
    }
    const corner = corners[(index + 1) % count];
    path += ` L ${round2(corner.start.x)} ${round2(corner.start.y)}`;
    if (corner.r > 0) {
      path += ` A ${round2(corner.r)} ${round2(corner.r)} 0 0 ${corner.sweep} ${round2(corner.end.x)} ${round2(corner.end.y)}`;
    }
  }
  return `${path} Z`;
}

export function edgeMidpoint(shape, index){
  const [p0, p1, p2, p3] = segmentControls(shape, index);
  const curved = segmentCurved(shape, index);
  const mid = curved ? cubicAt(p0, p1, p2, p3, 0.5) : { x: (p0.x + p3.x) / 2, y: (p0.y + p3.y) / 2 };
  const ahead = curved ? cubicAt(p0, p1, p2, p3, 0.52) : p3;
  const behind = curved ? cubicAt(p0, p1, p2, p3, 0.48) : p0;
  return {
    x: mid.x,
    y: mid.y,
    angle: Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180 / Math.PI,
    length: Math.hypot(p3.x - p0.x, p3.y - p0.y)
  };
}

export function segmentPath(shape, index){
  const [p0, p1, p2, p3] = segmentControls(shape, index);
  if (!segmentCurved(shape, index)) return `M ${p0.x} ${p0.y} L ${p3.x} ${p3.y}`;
  return `M ${p0.x} ${p0.y} C ${round2(p1.x)} ${round2(p1.y)} ${round2(p2.x)} ${round2(p2.y)} ${p3.x} ${p3.y}`;
}

export function openPath(points, handles){
  if (points.length === 0) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    const a = points[index - 1];
    const b = points[index];
    const out = handles[index - 1]?.out;
    const into = handles[index]?.in;
    if (!out && !into) {
      path += ` L ${b.x} ${b.y}`;
      continue;
    }
    const c1 = out ? { x: a.x + out.x, y: a.y + out.y } : a;
    const c2 = into ? { x: b.x + into.x, y: b.y + into.y } : b;
    path += ` C ${round2(c1.x)} ${round2(c1.y)} ${round2(c2.x)} ${round2(c2.y)} ${b.x} ${b.y}`;
  }
  return path;
}

export function projectOnSegment(point, a, b){
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length));
  return { x: a.x + dx * t, y: a.y + dy * t };
}

export function nearestEdgePoint(point, outlines, radius){
  let best = null;
  let bestDistance = radius;
  for (const outline of outlines) {
    for (let index = 0; index < outline.length; index += 1) {
      const projected = projectOnSegment(point, outline[index], outline[(index + 1) % outline.length]);
      const gap = Math.hypot(projected.x - point.x, projected.y - point.y);
      if (gap <= bestDistance) {
        best = projected;
        bestDistance = gap;
      }
    }
  }
  return best ? { x: round2(best.x), y: round2(best.y) } : null;
}

export function nearestEdge(point, outlines, radius){
  let best = null;
  let bestDistance = radius;
  for (const outline of outlines) {
    for (let index = 0; index < outline.length; index += 1) {
      const a = outline[index];
      const b = outline[(index + 1) % outline.length];
      const projected = projectOnSegment(point, a, b);
      const gap = Math.hypot(projected.x - point.x, projected.y - point.y);
      if (gap <= bestDistance) {
        best = { a, b };
        bestDistance = gap;
      }
    }
  }
  return best;
}
