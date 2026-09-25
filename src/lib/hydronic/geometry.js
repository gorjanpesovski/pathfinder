import { HYDRONIC_ELEMENTS, HYDRONIC_STYLE } from "./elements.js";
import { routePoint, pipeCrossings, arrowMarks } from "./route.js";

export function orientAngle(type, angle, flip = false){
  const orient = HYDRONIC_ELEMENTS[type]?.orient ?? "flow";
  if (orient === "upright") return 0;
  if (orient === "axis") {
    const vertical = Math.abs(Math.abs(angle) - 90) < 1;
    return ((vertical ? 270 : 0) + (flip ? 180 : 0)) % 360;
  }
  return (angle + (flip ? 180 : 0) + 720) % 360;
}

export function fittingPose(route, fitting){
  const point = routePoint(route, fitting.t);
  return { x: point.x, y: point.y, rotation: orientAngle(fitting.type, point.angle, fitting.flip) };
}

export function fittingSize(fitting){
  const spec = HYDRONIC_ELEMENTS[fitting.type];
  const scale = fitting.scale ?? 1;
  return { width: spec.width * scale, height: spec.height * scale };
}

export function pipeWidthOf(pipe, style = HYDRONIC_STYLE){
  return pipe?.width ?? style.pipeWidth;
}

export function pipeScale(pipe, style = HYDRONIC_STYLE){
  return pipeWidthOf(pipe, style) / style.pipeWidth;
}

export function pipeDecorations(pipes, style = HYDRONIC_STYLE){
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
      ...(pipe.fittings ?? []).filter((fitting) => HYDRONIC_ELEMENTS[fitting.type]).map((fitting) => fittingPose(route, fitting)),
      ...crossings.filter((crossing) => crossing.upper === pipe.id || crossing.lower === pipe.id),
      ...junctions.filter((junction) => junction.host === pipe.id || junction.pipeId === pipe.id)
    ];
    arrows.set(pipe.id, arrowMarks(route, avoid, size * 1.8, Math.max(40, 100 * pipeScale(pipe, style))).map((mark) => ({ ...mark, size })));
  }
  return { crossings, junctions, arrows };
}
