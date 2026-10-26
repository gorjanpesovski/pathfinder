import { HYDRONIC_ELEMENTS } from "./elements.js";
import { computeRoutes, endpointPose, freezeRoute, routeAnchors } from "./route.js";

const STUB = 20;
const PAD = 16;
const BEND = 60;
const MARGIN = 120;

function round(value){
  return Math.round(value * 100) / 100;
}

function obstaclesOf(shapes){
  return shapes
    .filter((shape) => shape.kind === "equipment" && HYDRONIC_ELEMENTS[shape.type] && !HYDRONIC_ELEMENTS[shape.type].bar && !HYDRONIC_ELEMENTS[shape.type].noPorts)
    .map((shape) => ({ x1: shape.x - PAD, y1: shape.y - PAD, x2: shape.x + shape.width + PAD, y2: shape.y + shape.height + PAD }));
}

function blocked(obstacles, a, b){
  const x1 = Math.min(a.x, b.x);
  const x2 = Math.max(a.x, b.x);
  const y1 = Math.min(a.y, b.y);
  const y2 = Math.max(a.y, b.y);
  return obstacles.some((box) => x1 < box.x2 - 0.01 && x2 > box.x1 + 0.01 && y1 < box.y2 - 0.01 && y2 > box.y1 + 0.01);
}

function inside(obstacles, point){
  return obstacles.some((box) => point.x > box.x1 + 0.01 && point.x < box.x2 - 0.01 && point.y > box.y1 + 0.01 && point.y < box.y2 - 0.01);
}

function lead(pose){
  if (!pose.normal) return pose.point;
  return { x: round(pose.point.x + pose.normal.x * STUB), y: round(pose.point.y + pose.normal.y * STUB) };
}

function uniqueSorted(values){
  return [...new Set(values.map(round))].sort((a, b) => a - b);
}

class Heap {
  constructor(){ this.items = []; }
  push(item){
    const items = this.items;
    items.push(item);
    let index = items.length - 1;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (items[parent].f <= items[index].f) break;
      [items[parent], items[index]] = [items[index], items[parent]];
      index = parent;
    }
  }
  pop(){
    const items = this.items;
    const top = items[0];
    const last = items.pop();
    if (items.length) {
      items[0] = last;
      let index = 0;
      for (;;) {
        const left = index * 2 + 1;
        const right = left + 1;
        let smallest = index;
        if (left < items.length && items[left].f < items[smallest].f) smallest = left;
        if (right < items.length && items[right].f < items[smallest].f) smallest = right;
        if (smallest === index) break;
        [items[smallest], items[index]] = [items[index], items[smallest]];
        index = smallest;
      }
    }
    return top;
  }
  get size(){ return this.items.length; }
}

export function orthogonalPath(from, to, obstacles, startHeading = null, endHeading = null){
  const xs = uniqueSorted([from.x, to.x, ...obstacles.flatMap((box) => [box.x1, box.x2])]);
  const ys = uniqueSorted([from.y, to.y, ...obstacles.flatMap((box) => [box.y1, box.y2])]);
  const minX = xs[0] - MARGIN;
  const maxX = xs[xs.length - 1] + MARGIN;
  const minY = ys[0] - MARGIN;
  const maxY = ys[ys.length - 1] + MARGIN;
  const gx = uniqueSorted([minX, ...xs, maxX]);
  const gy = uniqueSorted([minY, ...ys, maxY]);
  const ix = new Map(gx.map((value, index) => [value, index]));
  const iy = new Map(gy.map((value, index) => [value, index]));
  const start = { i: ix.get(round(from.x)), j: iy.get(round(from.y)) };
  const goal = { i: ix.get(round(to.x)), j: iy.get(round(to.y)) };
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const key = (i, j, d) => (i * gy.length + j) * 5 + d;
  const point = (i, j) => ({ x: gx[i], y: gy[j] });
  const heuristic = (i, j) => Math.abs(gx[i] - to.x) + Math.abs(gy[j] - to.y);
  const headingIndex = (vector) => vector ? DIRS.findIndex(([dx, dy]) => dx === Math.sign(vector.x) && dy === Math.sign(vector.y)) : 4;
  const best = new Map();
  const came = new Map();
  const heap = new Heap();
  const first = headingIndex(startHeading);
  best.set(key(start.i, start.j, first), 0);
  heap.push({ i: start.i, j: start.j, d: first, g: 0, f: heuristic(start.i, start.j) });
  const arrive = endHeading ? headingIndex(endHeading) : -1;
  let found = null;
  while (heap.size) {
    const node = heap.pop();
    if (node.g > (best.get(key(node.i, node.j, node.d)) ?? Infinity)) continue;
    if (node.i === goal.i && node.j === goal.j) {
      found = node;
      break;
    }
    DIRS.forEach(([dx, dy], d) => {
      if (node.d !== 4 && dx === -DIRS[node.d][0] && dy === -DIRS[node.d][1]) return;
      const i = node.i + dx;
      const j = node.j + dy;
      if (i < 0 || j < 0 || i >= gx.length || j >= gy.length) return;
      const a = point(node.i, node.j);
      const b = point(i, j);
      if (blocked(obstacles, a, b)) return;
      let g = node.g + Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
      if (node.d !== 4 && node.d !== d) g += BEND;
      if (i === goal.i && j === goal.j && arrive >= 0 && d !== arrive) g += BEND;
      const id = key(i, j, d);
      if (g >= (best.get(id) ?? Infinity)) return;
      best.set(id, g);
      came.set(id, key(node.i, node.j, node.d));
      heap.push({ i, j, d, g, f: g + heuristic(i, j) });
    });
  }
  if (!found) return null;
  const path = [];
  let id = key(found.i, found.j, found.d);
  const startKey = key(start.i, start.j, first);
  while (id !== undefined) {
    const cell = Math.floor(id / 5);
    path.unshift(point(Math.floor(cell / gy.length), cell % gy.length));
    if (id === startKey) break;
    id = came.get(id);
  }
  return path;
}

export function tidyPipe(shapes, pipeId){
  const pipe = shapes.find((shape) => shape.id === pipeId);
  if (!pipe || pipe.kind !== "pipe") return null;
  const byId = new Map(shapes.map((shape) => [shape.id, shape]));
  const routes = computeRoutes(shapes);
  const host = (id) => routes.get(id) ?? null;
  const current = routes.get(pipe.id);
  if (!current) return null;
  const start = endpointPose(pipe.from, byId, host, current[1]);
  const end = endpointPose(pipe.to, byId, host, current[current.length - 2]);
  if (!start || !end) return null;
  const obstacles = obstaclesOf(shapes);
  const a = lead(start);
  const b = lead(end);
  if (inside(obstacles, a) || inside(obstacles, b)) return null;
  const middle = orthogonalPath(a, b, obstacles, start.normal, end.normal ? { x: -end.normal.x, y: -end.normal.y } : null);
  if (!middle) return null;
  const route = [start.point, ...middle, end.point];
  return { points: freezeRoute(route), anchors: routeAnchors(route), corners: true };
}
