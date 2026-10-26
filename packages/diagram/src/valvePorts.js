import { HYDRONIC_ELEMENTS } from "./elements.js";
import { routePoint, cornerLegs, fittingRotation, valvePorts } from "./route.js";

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

export function cornerFlip(type, legs, leg, orient){
  const axis = leg === "after" ? legs.outgoing : legs.incoming;
  const want = leg === "after" ? { x: -legs.incoming.x, y: -legs.incoming.y } : legs.outgoing;
  const angle = Math.round(Math.atan2(axis.y, axis.x) * 180 / Math.PI);
  return [false, true].find((flip) => {
    const third = valvePorts(orient(type, angle, flip))[2];
    return third.x === want.x && third.y === want.y;
  });
}

export function valveCorner(point, routes, radius, type, orient, leg = "before"){
  let best = null;
  for (const [pipeId, route] of routes) {
    let travelled = 0;
    const total = route.reduce((sum, spot, index) => index ? sum + Math.hypot(spot.x - route[index - 1].x, spot.y - route[index - 1].y) : 0, 0);
    for (let index = 1; index < route.length - 1; index += 1) {
      const corner = route[index];
      travelled += Math.hypot(corner.x - route[index - 1].x, corner.y - route[index - 1].y);
      const gap = Math.hypot(point.x - corner.x, point.y - corner.y);
      if (gap > radius || (best && gap >= best.gap) || !total) continue;
      const legs = cornerLegs(route, corner);
      if (!legs) continue;
      const flip = cornerFlip(type, legs, leg, orient);
      if (flip === undefined) continue;
      const t = Math.round(travelled / total * 10000) / 10000;
      const fitting = { type, t, flip, leg };
      best = { pipeId, t, flip, leg, gap, pose: { x: corner.x, y: corner.y, rotation: fittingRotation(route, fitting) } };
    }
  }
  return best;
}
