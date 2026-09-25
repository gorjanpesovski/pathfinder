import { PORT_STEP, HYDRONIC_ELEMENTS } from "./elements.js";

const NORMALS = {
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const STUB = 20;
const TURN = 1.5;

function round(value){
  return Math.round(value * 100) / 100;
}

function offsets(size, spacing = PORT_STEP){
  const middle = size / 2;
  const list = [middle];
  for (let step = spacing; middle - step >= spacing - 0.001; step += spacing) list.push(middle - step, middle + step);
  return list.map((value) => Math.round(value * 1000) / 1000).sort((a, b) => a - b);
}

export function portStep(element){
  const spec = HYDRONIC_ELEMENTS[element?.type];
  if (!spec) return PORT_STEP;
  const scale = Math.sqrt((element.width * element.height) / (spec.width * spec.height));
  return scale >= 0.7 ? PORT_STEP : scale >= 0.35 ? PORT_STEP / 2 : PORT_STEP / 4;
}

export function portPose(element, port){
  const horizontal = port.side === "top" || port.side === "bottom";
  const offset = Math.min(port.offset, horizontal ? element.width : element.height);
  const point = {
    top: { x: element.x + offset, y: element.y },
    bottom: { x: element.x + offset, y: element.y + element.height },
    left: { x: element.x, y: element.y + offset },
    right: { x: element.x + element.width, y: element.y + offset }
  }[port.side];
  return { point, normal: NORMALS[port.side] };
}

export function elementPorts(element){
  if (HYDRONIC_ELEMENTS[element.type]?.noPorts) return [];
  const ports = [];
  const spacing = portStep(element);
  for (const offset of offsets(element.width, spacing)) ports.push({ side: "top", offset }, { side: "bottom", offset });
  for (const offset of offsets(element.height, spacing)) ports.push({ side: "left", offset }, { side: "right", offset });
  return ports.map((port) => ({ ...port, ...portPose(element, port) }));
}

export function isFreeEnd(end){
  return !!end && end.pipe === undefined && end.id === undefined && Number.isFinite(end.x) && Number.isFinite(end.y);
}

export function endpointPose(end, byId, hostRoute = null, toward = null){
  if (!end) return null;
  if (isFreeEnd(end)) return { point: { x: end.x, y: end.y }, normal: null };
  if (end.pipe !== undefined) {
    const route = hostRoute?.(end.pipe);
    if (!route) return null;
    const host = end.fitting !== undefined ? byId.get(end.pipe) : null;
    const valve = host?.fittings?.find((entry) => entry.id === end.fitting);
    const hit = projectOnRoute(route, valve ? routePoint(route, valve.t) : end, 0);
    if (!hit) return null;
    const point = { x: hit.x, y: hit.y };
    const horizontal = hit.angle === 0 || Math.abs(hit.angle) === 180;
    const aim = toward ?? point;
    const normal = horizontal
      ? { x: 0, y: Math.sign(aim.y - point.y) || 1 }
      : { x: Math.sign(aim.x - point.x) || 1, y: 0 };
    return { point, normal };
  }
  const element = byId.get(end.id);
  if (!element || element.kind !== "equipment") return null;
  return portPose(element, end);
}

export function rawPoint(end, byId){
  if (!end) return null;
  if (isFreeEnd(end)) return { x: end.x, y: end.y };
  if (end.pipe !== undefined) return { x: end.x, y: end.y };
  const element = byId.get(end.id);
  return element?.kind === "equipment" ? portPose(element, end).point : null;
}

export function findPort(point, shapes, radius){
  let best = null;
  for (const element of shapes) {
    if (element.kind !== "equipment") continue;
    const inside = point.x > element.x && point.x < element.x + element.width && point.y > element.y && point.y < element.y + element.height;
    for (const port of elementPorts(element)) {
      const gap = Math.hypot(port.point.x - point.x, port.point.y - point.y);
      if (!inside && gap > radius) continue;
      const score = (inside ? 0 : 1e6) + gap;
      if (!best || score < best.score) best = { id: element.id, side: port.side, offset: port.offset, point: port.point, normal: port.normal, score };
    }
  }
  return best;
}

function axisOf(vector){
  return vector.x !== 0 ? "h" : "v";
}

function flip(axis){
  return axis === "h" ? "v" : "h";
}

function simplify(points){
  const unique = points.filter((point, index) => index === 0 || point.x !== points[index - 1].x || point.y !== points[index - 1].y);
  const result = [];
  for (const point of unique) {
    while (result.length >= 2) {
      const a = result[result.length - 2];
      const b = result[result.length - 1];
      if ((a.x === b.x && b.x === point.x) || (a.y === b.y && b.y === point.y)) result.pop();
      else break;
    }
    result.push(point);
  }
  return result;
}

function offsetPoint(point, normal, distance){
  return { x: round(point.x + normal.x * distance), y: round(point.y + normal.y * distance) };
}

function snapMid(a, b){
  return round(Math.round((a + b) / 2 / PORT_STEP) * PORT_STEP);
}

function candidates(from, to){
  if (from.x === to.x || from.y === to.y) return [[to]];
  const x = snapMid(from.x, to.x);
  const y = snapMid(from.y, to.y);
  return [
    [{ x: to.x, y: from.y }, to],
    [{ x: from.x, y: to.y }, to],
    [{ x, y: from.y }, { x, y: to.y }, to],
    [{ x: from.x, y }, { x: to.x, y }, to]
  ];
}

function moves(from, segment){
  const list = [];
  let previous = from;
  for (const point of segment) {
    const dx = Math.sign(point.x - previous.x);
    const dy = Math.sign(point.y - previous.y);
    if (dx !== 0 || dy !== 0) list.push({ x: dx, y: dy });
    previous = point;
  }
  return list;
}

function cost(from, segment, heading, arrive){
  const list = moves(from, segment);
  if (list.length === 0) return 0;
  let total = list.length;
  const first = list[0];
  if (heading && first.x === -heading.x && first.y === -heading.y) total += 20;
  else if (heading && (first.x !== heading.x || first.y !== heading.y)) total += TURN;
  if (arrive) {
    const last = list[list.length - 1];
    const dot = last.x * arrive.x + last.y * arrive.y;
    if (dot < 0) total += 20;
    else if (dot === 0) total += TURN;
  }
  return total;
}

export function manhattanRoute(start, waypoints = [], end = null){
  const points = [start.point];
  let cursor = start.point;
  let heading = null;
  if (start.normal) {
    cursor = offsetPoint(start.point, start.normal, STUB);
    points.push(cursor);
    heading = start.normal;
  }

  const endStub = end?.normal ? offsetPoint(end.point, end.normal, STUB) : null;
  const targets = [...waypoints];
  if (endStub) targets.push(endStub);
  else if (end) targets.push(end.point);

  targets.forEach((target, index) => {
    const arrive = index === targets.length - 1 && end?.normal ? { x: -end.normal.x, y: -end.normal.y } : null;
    let best = null;
    for (const segment of candidates(cursor, target)) {
      const score = cost(cursor, segment, heading, arrive);
      if (!best || score < best.score) best = { segment, score };
    }
    points.push(...best.segment);
    const list = moves(cursor, best.segment);
    if (list.length) heading = list[list.length - 1];
    cursor = target;
  });

  if (endStub) points.push(end.point);
  return simplify(points.map((point) => ({ x: round(point.x), y: round(point.y) })));
}

export function pipeRoute(pipe, byId, hostRoute = null){
  const points = pipe.points ?? [];
  const start = endpointPose(pipe.from, byId, hostRoute, points[0] ?? rawPoint(pipe.to, byId));
  const end = endpointPose(pipe.to, byId, hostRoute, points[points.length - 1] ?? rawPoint(pipe.from, byId));
  if (!start || !end) return null;
  return manhattanRoute(start, points, end);
}

export function computeRoutes(shapes){
  const byId = new Map(shapes.map((shape) => [shape.id, shape]));
  const routes = new Map();
  const visiting = new Set();
  const resolve = (pipe) => {
    if (routes.has(pipe.id)) return routes.get(pipe.id);
    if (visiting.has(pipe.id)) return null;
    visiting.add(pipe.id);
    const route = pipeRoute(pipe, byId, (hostId) => {
      const host = byId.get(hostId);
      return host?.kind === "pipe" ? resolve(host) : null;
    });
    visiting.delete(pipe.id);
    routes.set(pipe.id, route);
    return route;
  };
  for (const shape of shapes) if (shape.kind === "pipe") resolve(shape);
  return new Map([...routes].filter(([, route]) => route && route.length >= 2));
}

export function findPipePoint(point, routes, radius, exclude = null, step = PORT_STEP){
  let best = null;
  for (const [id, route] of routes) {
    if (id === exclude) continue;
    const hit = projectOnRoute(route, point, 0);
    if (!hit || hit.gap > radius) continue;
    const horizontal = hit.angle === 0 || Math.abs(hit.angle) === 180;
    const snapped = !(step > 0)
      ? { x: hit.x, y: hit.y }
      : horizontal
        ? { x: Math.round(hit.x / step) * step, y: hit.y }
        : { x: hit.x, y: Math.round(hit.y / step) * step };
    const again = projectOnRoute(route, snapped, 0);
    const spot = { x: again.x, y: again.y };
    const ends = [route[0], route[route.length - 1]];
    const clearance = Math.min(step > 0 ? step : 1, PORT_STEP);
    if (ends.some((end) => Math.hypot(end.x - spot.x, end.y - spot.y) < clearance)) continue;
    if (!best || hit.gap < best.gap) best = { pipe: id, x: spot.x, y: spot.y, point: spot, normal: null, gap: hit.gap };
  }
  return best;
}

export function sameEnd(a, b){
  if (!a || !b) return false;
  if (isFreeEnd(a) || isFreeEnd(b)) return isFreeEnd(a) && isFreeEnd(b) && a.x === b.x && a.y === b.y;
  if (a.pipe !== undefined || b.pipe !== undefined) return a.pipe === b.pipe && a.x === b.x && a.y === b.y;
  return a.id === b.id && a.side === b.side && a.offset === b.offset;
}

export function endOf(target){
  if (target.free) return { x: target.x, y: target.y };
  if (target.pipe !== undefined && target.fitting !== undefined) return { pipe: target.pipe, x: target.x, y: target.y, fitting: target.fitting };
  return target.pipe !== undefined
    ? { pipe: target.pipe, x: target.x, y: target.y }
    : { id: target.id, side: target.side, offset: target.offset };
}

function crossPoint(a, b){
  const aFlat = a.a.y === a.b.y;
  const bFlat = b.a.y === b.b.y;
  if (aFlat === bFlat) return null;
  const flat = aFlat ? a : b;
  const upright = aFlat ? b : a;
  if (upright.a.x !== upright.b.x) return null;
  const x = upright.a.x;
  const y = flat.a.y;
  const inside = (value, p, q) => value > Math.min(p, q) + 0.5 && value < Math.max(p, q) - 0.5;
  return inside(x, flat.a.x, flat.b.x) && inside(y, upright.a.y, upright.b.y) ? { x, y } : null;
}

export function pipeCrossings(ordered){
  const list = [];
  for (let upper = 1; upper < ordered.length; upper += 1) {
    for (let lower = 0; lower < upper; lower += 1) {
      for (const a of segments(ordered[lower].route)) {
        for (const b of segments(ordered[upper].route)) {
          const hit = crossPoint(a, b);
          if (hit) list.push({ lower: ordered[lower].id, upper: ordered[upper].id, ...hit });
        }
      }
    }
  }
  return list;
}

export function arrowMarks(route, avoid = [], clearance = 40, minLength = 100){
  const marks = [];
  for (const segment of segments(route)) {
    if (segment.length < minLength) continue;
    for (const fraction of [0.5, 0.35, 0.65, 0.25, 0.75]) {
      const x = segment.a.x + (segment.b.x - segment.a.x) * fraction;
      const y = segment.a.y + (segment.b.y - segment.a.y) * fraction;
      if (avoid.some((spot) => Math.hypot(spot.x - x, spot.y - y) < clearance)) continue;
      marks.push({ x: round(x), y: round(y), angle: Math.round(segment.angle) });
      break;
    }
  }
  return marks;
}

export function arrowPoints(mark, size){
  const half = size / 2;
  const radians = mark.angle * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return [[-half, -half], [half, 0], [-half, half]]
    .map(([lx, ly]) => `${round(mark.x + lx * cos - ly * sin)},${round(mark.y + lx * sin + ly * cos)}`)
    .join(" ");
}

export function editablePath(route){
  const path = route.map((point) => ({ x: point.x, y: point.y }));
  if (path.length < 2) return path;
  const stub = (from, to) => {
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    if (length <= STUB) return null;
    return { x: round(from.x + Math.sign(to.x - from.x) * STUB), y: round(from.y + Math.sign(to.y - from.y) * STUB) };
  };
  const head = stub(path[0], path[1]);
  if (head) path.splice(1, 0, head);
  const tail = stub(path[path.length - 1], path[path.length - 2]);
  if (tail) path.splice(path.length - 1, 0, tail);
  return path;
}

export function storedPoints(path){
  return simplify(path.map((point) => ({ x: round(point.x), y: round(point.y) }))).slice(1, -1);
}

export function dragVertex(path, index, point){
  const next = path.map((entry) => ({ ...entry }));
  const old = path[index];
  next[index] = { x: point.x, y: point.y };
  for (const neighbour of [index - 1, index + 1]) {
    if (neighbour <= 0 || neighbour >= path.length - 1) continue;
    if (path[neighbour].y === old.y) next[neighbour].y = point.y;
    else if (path[neighbour].x === old.x) next[neighbour].x = point.x;
  }
  return next;
}

export function dragEdge(path, index, delta){
  const next = path.map((entry) => ({ ...entry }));
  const flat = path[index].y === path[index + 1].y;
  for (const at of [index, index + 1]) {
    if (flat) next[at].y = round(path[at].y + delta.y);
    else next[at].x = round(path[at].x + delta.x);
  }
  return next;
}

export function scaledOffset(offset, oldSize, newSize, spacing = PORT_STEP){
  const list = offsets(newSize, spacing);
  const target = offset * newSize / oldSize;
  return list.reduce((best, entry) => Math.abs(entry - target) < Math.abs(best - target) ? entry : best, list[0]);
}

export function routePath(points){
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

export function routeLength(points){
  let total = 0;
  for (let index = 1; index < points.length; index += 1) total += Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
  return total;
}

function segments(points){
  const list = [];
  let start = 0;
  for (let index = 1; index < points.length; index += 1) {
    const a = points[index - 1];
    const b = points[index];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    list.push({ a, b, length, start, angle: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI });
    start += length;
  }
  return list;
}

export function routePoint(points, t){
  const list = segments(points);
  const total = routeLength(points);
  const target = Math.min(1, Math.max(0, t)) * total;
  const segment = list.find((entry) => target <= entry.start + entry.length) ?? list[list.length - 1];
  if (!segment) return { x: points[0].x, y: points[0].y, angle: 0 };
  const local = segment.length === 0 ? 0 : (target - segment.start) / segment.length;
  return {
    x: round(segment.a.x + (segment.b.x - segment.a.x) * local),
    y: round(segment.a.y + (segment.b.y - segment.a.y) * local),
    angle: Math.round(segment.angle)
  };
}

export function projectOnRoute(points, point, size = 0){
  const total = routeLength(points);
  let best = null;
  for (const segment of segments(points)) {
    if (segment.length === 0) continue;
    const dx = segment.b.x - segment.a.x;
    const dy = segment.b.y - segment.a.y;
    let along = ((point.x - segment.a.x) * dx + (point.y - segment.a.y) * dy) / segment.length;
    const margin = size / 2;
    along = segment.length >= size ? Math.min(segment.length - margin, Math.max(margin, along)) : segment.length / 2;
    const x = segment.a.x + dx / segment.length * along;
    const y = segment.a.y + dy / segment.length * along;
    const gap = Math.hypot(point.x - x, point.y - y);
    if (!best || gap < best.gap) best = { gap, t: total === 0 ? 0 : (segment.start + along) / total, x: round(x), y: round(y), angle: Math.round(segment.angle) };
  }
  return best;
}

export function pruneDangling(shapes){
  let current = shapes;
  for (;;) {
    const kinds = new Map(current.map((shape) => [shape.id, shape.kind]));
    const valid = (end) => isFreeEnd(end) || (!!end && (end.pipe !== undefined ? kinds.get(end.pipe) === "pipe" : kinds.get(end.id) === "equipment"));
    const next = current.filter((shape) => shape.kind !== "pipe" || (valid(shape.from) && valid(shape.to)));
    if (next.length === current.length) return current;
    current = next;
  }
}

export function ridingPipes(shapes, ids){
  return shapes
    .filter((shape) => shape.kind === "pipe" && !ids.includes(shape.id) && ids.includes(shape.from?.id) && ids.includes(shape.to?.id))
    .map((shape) => shape.id);
}

export function linkPastedPipes(created, idMap, offset = 0){
  const relink = (end) => {
    if (!end) return null;
    if (isFreeEnd(end)) return { x: end.x + offset, y: end.y + offset };
    if (end.pipe !== undefined) return idMap.has(end.pipe) ? { pipe: idMap.get(end.pipe), x: end.x + offset, y: end.y + offset } : null;
    return idMap.has(end.id) ? { ...end, id: idMap.get(end.id) } : null;
  };
  const kept = created.filter((shape) => {
    if (shape.kind !== "pipe") return true;
    const from = relink(shape.from);
    const to = relink(shape.to);
    if (!from || !to) return false;
    shape.from = from;
    shape.to = to;
    return true;
  });
  return pruneDangling(kept);
}
