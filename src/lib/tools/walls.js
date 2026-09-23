import { shapePath, openPath, hasCurves } from "./path.js";
import { boundsCenter, formatMeters, distance } from "./polygon.js";
import { svgElement } from "../export/atvise.js";

export const WALL_STYLE = {
  stroke: "#475569",
  width: 20
};

function round(value){
  return Math.round(value * 100) / 100;
}

export function wallPath(shape){
  return shape.open ? openPath(shape.points, shape.handles ?? []) : shapePath(shape);
}

export function wallLength(shape){
  const count = shape.open ? shape.points.length - 1 : shape.points.length;
  let total = 0;
  for (let index = 0; index < count; index += 1) total += distance(shape.points[index], shape.points[(index + 1) % shape.points.length]);
  return total;
}

export function describeWall(shape){
  return `${shape.open ? "Wall" : "Closed wall"} · ${formatMeters(wallLength(shape))}`;
}

export function openEnds(handles){
  if (!handles) return handles;
  const next = [...handles];
  if (next[0]) next[0] = { ...next[0], in: null };
  const last = next.length - 1;
  if (next[last]) next[last] = { ...next[last], out: null };
  return next;
}

export function wallsToSvg(shapes, style){
  return shapes.filter((shape) => shape.kind === "wall").map((shape) => {
    const center = boundsCenter(shape.points);
    const paint = {
      "atv:refpx": round(center.x),
      "atv:refpy": round(center.y),
      fill: "none",
      id: `wall_${shape.id}`,
      stroke: style.wallStroke ?? WALL_STYLE.stroke,
      "stroke-linecap": shape.open ? "square" : "butt",
      "stroke-linejoin": "miter",
      "stroke-width": style.wallWidth ?? WALL_STYLE.width
    };
    if (hasCurves(shape) || shape.radii?.some((radius) => radius > 0)) return svgElement("path", { ...paint, d: wallPath(shape) });
    const points = shape.points.map((point) => `${point.x},${point.y}`).join(" ");
    return svgElement(shape.open ? "polyline" : "polygon", { ...paint, points });
  });
}
