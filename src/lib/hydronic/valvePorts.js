import { HYDRONIC_ELEMENTS } from "./elements.js";
import { routePoint } from "./route.js";

export function isJunctionFitting(type){
  return !!HYDRONIC_ELEMENTS[type]?.junction;
}

export function findValvePort(point, shapes, routes, radius, exclude = null){
  let best = null;
  for (const pipe of shapes) {
    if (pipe.kind !== "pipe" || pipe.id === exclude) continue;
    const route = routes.get(pipe.id);
    if (!route) continue;
    for (const fitting of pipe.fittings ?? []) {
      if (!isJunctionFitting(fitting.type)) continue;
      const spot = routePoint(route, fitting.t);
      const reach = Math.max(radius, HYDRONIC_ELEMENTS[fitting.type].width * (fitting.scale ?? 1) / 2);
      const gap = Math.hypot(spot.x - point.x, spot.y - point.y);
      if (gap > reach || (best && gap >= best.gap)) continue;
      best = { pipe: pipe.id, fitting: fitting.id, x: spot.x, y: spot.y, point: { x: spot.x, y: spot.y }, normal: null, gap };
    }
  }
  return best;
}
