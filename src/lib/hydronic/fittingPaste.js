import { HYDRONIC_ELEMENTS } from "./elements.js";
import { projectOnRoute, routeLength, routePoint } from "./route.js";
import { fittingPose } from "./geometry.js";

function sizeOf(fitting){
  return (HYDRONIC_ELEMENTS[fitting.type]?.width ?? 0) * (fitting.scale ?? 1);
}

function round4(value){
  return Math.round(value * 10000) / 10000;
}

export function copyFittings(members, routes){
  return members
    .map(({ pipe, fitting }) => {
      const route = routes.get(pipe.id);
      return route ? { pipeId: pipe.id, fitting: JSON.parse(JSON.stringify(fitting)), pose: fittingPose(route, fitting) } : null;
    })
    .filter(Boolean);
}

export function nearestPipeHit(point, routes, isOpen, radius, size = 0){
  let best = null;
  for (const [pipeId, route] of routes) {
    if (!isOpen(pipeId)) continue;
    const hit = projectOnRoute(route, point, size);
    if (hit && hit.gap <= radius && (!best || hit.gap < best.hit.gap)) best = { pipeId, hit };
  }
  return best;
}

export function pasteTargets(items, { routes, isOpen, pointer = null, radius, count = 1 }){
  if (!items.length) return [];
  const anchor = items[0].pose;
  const hovered = pointer ? nearestPipeHit(pointer, routes, isOpen, radius) : null;
  return items.map((item) => {
    const size = sizeOf(item.fitting);
    if (hovered) {
      const want = { x: pointer.x + item.pose.x - anchor.x, y: pointer.y + item.pose.y - anchor.y };
      const near = nearestPipeHit(want, routes, isOpen, radius, size);
      if (near) return { pipeId: near.pipeId, t: round4(near.hit.t) };
      const hit = projectOnRoute(routes.get(hovered.pipeId), want, size);
      return hit ? { pipeId: hovered.pipeId, t: round4(hit.t) } : null;
    }
    const route = routes.get(item.pipeId);
    if (!route || !isOpen(item.pipeId)) return null;
    const length = routeLength(route);
    if (!(length > 0)) return null;
    const step = Math.max(size * 1.5, 30) / length * count;
    const t = item.fitting.t + step <= 1 ? item.fitting.t + step : item.fitting.t - step;
    const hit = projectOnRoute(route, routePoint(route, t), size);
    return hit ? { pipeId: item.pipeId, t: round4(hit.t) } : null;
  });
}
