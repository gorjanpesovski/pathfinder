import { HYDRONIC_ELEMENTS } from "./elements.js";
import { portPose } from "./route.js";

function arc(cx, cy, rx, ry, from, to, steps = 24){
  const list = [];
  for (let index = 0; index <= steps; index += 1) {
    const angle = from + (to - from) * index / steps;
    list.push([cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)]);
  }
  return list;
}

export const OUTLINES = {
  heatPump: [[0.577, 1.344], [329.424, 1.344], [329.424, 15.767], [323.654, 15.767], [323.654, 233.556], [6.346, 233.556], [6.346, 15.767], [0.577, 15.767]],
  boiler: [[0.402, 0.542], [204.598, 0.542], [204.598, 15.555], [200.094, 15.555], [200.094, 329.358], [4.906, 329.358], [4.906, 15.555], [0.402, 15.555]],
  bufferTank: [
    ...arc(81.496, 51.374, 71.31, 50.89, Math.PI, Math.PI * 2),
    ...arc(81.496, 247.048, 71.31, 53.434, 0, Math.PI)
  ]
};

function round(value){
  return Math.round(value * 100) / 100;
}

function crossings(polygon, axis, value){
  const hits = [];
  const other = axis === "x" ? 1 : 0;
  const along = axis === "x" ? 0 : 1;
  for (let index = 0; index < polygon.length; index += 1) {
    const a = polygon[index];
    const b = polygon[(index + 1) % polygon.length];
    if ((a[along] - value) * (b[along] - value) > 0) continue;
    if (a[along] === b[along]) {
      if (a[along] === value) hits.push(a[other], b[other]);
      continue;
    }
    hits.push(a[other] + (value - a[along]) / (b[along] - a[along]) * (b[other] - a[other]));
  }
  return hits;
}

export function contactPoint(element, port){
  const pose = portPose(element, port);
  const spec = HYDRONIC_ELEMENTS[element.type];
  const outline = OUTLINES[element.type];
  if (!spec || !outline) return pose.point;
  const sx = element.width / spec.width;
  const sy = element.height / spec.height;
  const polygon = outline.map(([x, y]) => [x * sx, y * sy]);
  const local = { x: pose.point.x - element.x, y: pose.point.y - element.y };
  const vertical = port.side === "top" || port.side === "bottom";
  const hits = crossings(polygon, vertical ? "x" : "y", vertical ? local.x : local.y);
  if (!hits.length) return pose.point;
  const depth = {
    top: Math.min(...hits),
    bottom: Math.max(...hits),
    left: Math.min(...hits),
    right: Math.max(...hits)
  }[port.side];
  return vertical
    ? { x: pose.point.x, y: round(element.y + depth) }
    : { x: round(element.x + depth), y: pose.point.y };
}

function endContact(end, byId){
  if (!end || end.pipe !== undefined) return null;
  const element = byId.get(end.id);
  return element?.kind === "equipment" ? contactPoint(element, end) : null;
}

export function touchRoute(route, ends, byId){
  if (!route || route.length < 2 || !ends) return route;
  const list = route.map((point) => ({ x: point.x, y: point.y }));
  const first = endContact(ends.from, byId);
  const last = endContact(ends.to, byId);
  if (first) list[0] = first;
  if (last) list[list.length - 1] = last;
  return list;
}
