import { HYDRONIC_ELEMENTS, HYDRONIC_STYLE } from "./elements.js";
import { routePoint, pipeCrossings, arrowMarks, orientAngle, fittingRotation, fittingSpot, isFreeEnd } from "./route.js";

export { orientAngle };

export function fittingPose(route, fitting){
  const point = fittingSpot(route, fitting);
  return { x: point.x, y: point.y, rotation: fittingRotation(route, fitting, point) };
}

export function fittingSize(fitting){
  const spec = HYDRONIC_ELEMENTS[fitting.type];
  const scale = fitting.scale ?? 1;
  return { width: spec.width * scale, height: spec.height * scale };
}

export function pipeWidthOf(pipe, style = HYDRONIC_STYLE){
  return pipe?.width ?? style.pipeWidth;
}

function pipeScale(pipe, style = HYDRONIC_STYLE){
  return pipeWidthOf(pipe, style) / style.pipeWidth;
}

function round2(value){
  return Math.round(value * 100) / 100;
}

function endArrows(pipe, route, size, bars){
  if (route.length < 2) return [];
  const onBar = (point) => bars.some((bar) => point.x >= bar.x - 1 && point.x <= bar.x + bar.width + 1 && point.y >= bar.y - 1 && point.y <= bar.y + bar.height + 1);
  const mark = (end, toward) => {
    const dx = toward.x - end.x;
    const dy = toward.y - end.y;
    const length = Math.hypot(dx, dy);
    if (length < size * 1.5) return null;
    return { ux: dx / length, uy: dy / length, x: round2(end.x + dx / length * size / 2), y: round2(end.y + dy / length * size / 2) };
  };
  const marks = [];
  const first = route[0];
  const last = route[route.length - 1];
  if (isFreeEnd(pipe.from) && !onBar(first)) {
    const spot = mark(first, route[1]);
    if (spot) marks.push({ x: spot.x, y: spot.y, angle: Math.round(Math.atan2(spot.uy, spot.ux) * 180 / Math.PI), end: "from" });
  }
  if (isFreeEnd(pipe.to) && !onBar(last)) {
    const spot = mark(last, route[route.length - 2]);
    if (spot) marks.push({ x: spot.x, y: spot.y, angle: Math.round(Math.atan2(-spot.uy, -spot.ux) * 180 / Math.PI), end: "to" });
  }
  return marks;
}

export function pipeDecorations(pipes, style = HYDRONIC_STYLE, bars = []){
  const crossings = pipeCrossings(pipes.map(({ pipe, route }) => ({ id: pipe.id, route })));
  const byId = new Map(pipes.map(({ pipe }) => [pipe.id, pipe]));
  const margin = style.gapSize - style.pipeWidth;
  for (const crossing of crossings) {
    crossing.size = Math.max(pipeWidthOf(byId.get(crossing.upper), style), pipeWidthOf(byId.get(crossing.lower), style)) + margin;
  }
  const junctions = [];
  for (const { pipe, route } of pipes) {
    const k = pipeScale(pipe, style);
    const extra = { radius: style.junctionRadius * k, stroke: style.junctionWidth * k };
    if (pipe.from?.pipe !== undefined && pipe.from.fitting === undefined) junctions.push({ pipeId: pipe.id, host: pipe.from.pipe, x: route[0].x, y: route[0].y, ...extra });
    if (pipe.to?.pipe !== undefined && pipe.to.fitting === undefined) junctions.push({ pipeId: pipe.id, host: pipe.to.pipe, x: route[route.length - 1].x, y: route[route.length - 1].y, ...extra });
  }
  const arrows = new Map();
  for (const { pipe, route } of pipes) {
    const size = style.arrowSize * pipeScale(pipe, style);
    const avoid = [
      ...(pipe.fittings ?? []).filter((fitting) => HYDRONIC_ELEMENTS[fitting.type]).map((fitting) => {
        const reach = fittingSize(fitting);
        return { ...fittingPose(route, fitting), radius: Math.max(reach.width, reach.height) / 2 + size * 2.5 };
      }),
      ...crossings.filter((crossing) => crossing.upper === pipe.id || crossing.lower === pipe.id),
      ...junctions.filter((junction) => junction.host === pipe.id || junction.pipeId === pipe.id)
    ];
    const ends = endArrows(pipe, route, size, bars);
    const middle = arrowMarks(route, [...avoid, ...ends.map((end) => ({ x: end.x, y: end.y, radius: size * 4 }))], size * 1.8, Math.max(40, 100 * pipeScale(pipe, style)));
    arrows.set(pipe.id, [...ends, ...middle].map((mark) => ({ ...mark, size })));
  }
  return { crossings, junctions, arrows };
}
