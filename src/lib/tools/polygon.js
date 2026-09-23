export function samePoint(a, b){
  return a.x === b.x && a.y === b.y;
}

export function distance(a, b){
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function signedArea(points){
  let total = 0;
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    total += a.x * b.y - b.x * a.y;
  }
  return total / 2;
}

export function polygonArea(points){
  return Math.abs(signedArea(points));
}

export function polygonCentroid(points){
  const area = signedArea(points);
  if (area === 0) return boundsCenter(points);
  let x = 0;
  let y = 0;
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    const cross = a.x * b.y - b.x * a.y;
    x += (a.x + b.x) * cross;
    y += (a.y + b.y) * cross;
  }
  return { x: x / (6 * area), y: y / (6 * area) };
}

export function polygonBounds(points){
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

export function boundsCenter(points){
  const box = polygonBounds(points);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

export function rectPoints(from, to){
  if (from.x === to.x || from.y === to.y) return null;
  const x1 = Math.min(from.x, to.x);
  const y1 = Math.min(from.y, to.y);
  const x2 = Math.max(from.x, to.x);
  const y2 = Math.max(from.y, to.y);
  return [{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 }];
}

export function constrainOrtho(from, to){
  return Math.abs(to.x - from.x) >= Math.abs(to.y - from.y)
    ? { x: to.x, y: from.y }
    : { x: from.x, y: to.y };
}

export function nearestVertex(point, vertices, radius){
  let best = null;
  let bestDistance = radius;
  for (const vertex of vertices) {
    const gap = distance(point, vertex);
    if (gap <= bestDistance) {
      best = vertex;
      bestDistance = gap;
    }
  }
  return best ? { x: best.x, y: best.y } : null;
}

function orientation(a, b, c){
  return Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
}

export function segmentsCross(a, b, c, d){
  return orientation(a, b, c) * orientation(a, b, d) < 0
    && orientation(c, d, a) * orientation(c, d, b) < 0;
}

export function wouldCross(points, next){
  const last = points[points.length - 1];
  for (let index = 0; index < points.length - 2; index += 1) {
    if (segmentsCross(points[index], points[index + 1], last, next)) return true;
  }
  return false;
}

export function closingCrosses(points){
  const first = points[0];
  const last = points[points.length - 1];
  for (let index = 1; index < points.length - 2; index += 1) {
    if (segmentsCross(points[index], points[index + 1], last, first)) return true;
  }
  return false;
}

export function removeCollinear(points){
  const kept = points.filter((point, index) => {
    const before = points[(index - 1 + points.length) % points.length];
    const after = points[(index + 1) % points.length];
    return !samePoint(point, before) && orientation(before, point, after) !== 0;
  });
  return kept.length === points.length ? kept : removeCollinear(kept);
}

export function polygonPath(points, closed = true){
  if (points.length === 0) return "";
  const body = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  return closed ? `${body} Z` : body;
}

export function formatMeters(cm){
  return `${(cm / 100).toFixed(2)} m`;
}

export function formatArea(points){
  return `${(polygonArea(points) / 10000).toFixed(2)} m²`;
}

export function polygonSelfIntersects(points){
  const count = points.length;
  for (let i = 0; i < count; i += 1) {
    for (let j = i + 2; j < count; j += 1) {
      if (i === 0 && j === count - 1) continue;
      if (segmentsCross(points[i], points[(i + 1) % count], points[j], points[(j + 1) % count])) return true;
    }
  }
  return false;
}

function round2(value){
  return Math.round(value * 100) / 100;
}

export function cornerAt(points, index, radius){
  const count = points.length;
  const point = points[index];
  const plain = { start: point, end: point, r: 0, sweep: 0 };
  const before = points[(index - 1 + count) % count];
  const after = points[(index + 1) % count];
  const toBefore = distance(point, before);
  const toAfter = distance(point, after);
  if (!radius || toBefore === 0 || toAfter === 0) return plain;

  const u = { x: (before.x - point.x) / toBefore, y: (before.y - point.y) / toBefore };
  const v = { x: (after.x - point.x) / toAfter, y: (after.y - point.y) / toAfter };
  const theta = Math.acos(Math.max(-1, Math.min(1, u.x * v.x + u.y * v.y)));
  if (theta < 1e-3 || Math.PI - theta < 1e-3) return plain;

  const half = Math.tan(theta / 2);
  const cut = Math.min(radius / half, toBefore / 2, toAfter / 2);
  const turn = (point.x - before.x) * (after.y - point.y) - (point.y - before.y) * (after.x - point.x);
  return {
    start: { x: point.x + u.x * cut, y: point.y + u.y * cut },
    end: { x: point.x + v.x * cut, y: point.y + v.y * cut },
    r: cut * half,
    sweep: turn > 0 ? 1 : 0
  };
}

export function maxCornerRadius(points, index){
  return Math.floor(cornerAt(points, index, Number.MAX_SAFE_INTEGER).r);
}

export function roundedPath(points, radii){
  if (!radii?.some((radius) => radius > 0)) return polygonPath(points);
  const corners = points.map((_, index) => cornerAt(points, index, radii[index] ?? 0));
  let path = `M ${round2(corners[0].end.x)} ${round2(corners[0].end.y)}`;
  for (let step = 1; step <= corners.length; step += 1) {
    const corner = corners[step % corners.length];
    path += ` L ${round2(corner.start.x)} ${round2(corner.start.y)}`;
    if (corner.r > 0) {
      path += ` A ${round2(corner.r)} ${round2(corner.r)} 0 0 ${corner.sweep} ${round2(corner.end.x)} ${round2(corner.end.y)}`;
    }
  }
  return `${path} Z`;
}

export function pointInPolygon(point, polygon){
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function distanceToOutline(point, outline){
  let best = Infinity;
  for (let index = 0; index < outline.length; index += 1) {
    const a = outline[index];
    const b = outline[(index + 1) % outline.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = dx * dx + dy * dy;
    const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length));
    best = Math.min(best, Math.hypot(a.x + dx * t - point.x, a.y + dy * t - point.y));
  }
  return best;
}

export function innerPoint(outline){
  const centroid = polygonCentroid(outline);
  const box = polygonBounds(outline);
  let best = null;
  let bestDistance = -1;

  function sample(x, y, width, height, steps){
    for (let i = 0; i <= steps; i += 1) {
      for (let j = 0; j <= steps; j += 1) {
        const point = { x: x + width * i / steps, y: y + height * j / steps };
        if (!pointInPolygon(point, outline)) continue;
        const gap = distanceToOutline(point, outline);
        if (gap > bestDistance) {
          best = point;
          bestDistance = gap;
        }
      }
    }
  }

  sample(box.x, box.y, box.width, box.height, 16);
  if (best) sample(best.x - box.width / 16, best.y - box.height / 16, box.width / 8, box.height / 8, 8);

  if (pointInPolygon(centroid, outline) && distanceToOutline(centroid, outline) >= bestDistance * 0.85) return centroid;
  return best ?? centroid;
}
