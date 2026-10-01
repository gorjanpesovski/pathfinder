import { HYDRONIC_ELEMENTS } from "./elements.js";
import { computeRoutes, routePoint } from "./route.js";
import { fittingBox } from "./fittingAlign.js";
import { NAME_SIZE, legacyElementAnchor, nameAnchorAt, nameSizeOf, placeName, textWidth } from "./label.js";

function isHorizontal(route, fitting){
  const angle = routePoint(route, fitting.t).angle;
  return angle === 0 || Math.abs(angle) === 180;
}

function defaultPlace(route, fitting, size){
  const scale = size / NAME_SIZE;
  return isHorizontal(route, fitting) ? { side: "bottom", gap: 4 * scale } : { side: "right", gap: 6 * scale };
}

export function fittingLabel(route, fitting){
  const size = nameSizeOf(fitting);
  return placeName(fittingBox(route, fitting), fitting.nameAnchor ?? defaultPlace(route, fitting, size), size);
}

function legacyFittingAnchor(route, fitting){
  const size = nameSizeOf(fitting);
  const box = fittingBox(route, fitting);
  const base = placeName(box, defaultPlace(route, fitting, size), size);
  const width = textWidth(fitting.name, size);
  const centre = {
    x: (base.anchor === "start" ? base.x + width / 2 : base.x) + (fitting.nameOffset?.x ?? 0),
    y: base.middle + (fitting.nameOffset?.y ?? 0)
  };
  return nameAnchorAt(box, centre, width, base.height);
}

export function anchorNames(shapes){
  if (!shapes.some((shape) => shape.nameOffset || (shape.fittings ?? []).some((fitting) => fitting.nameOffset))) return shapes;
  const routes = computeRoutes(shapes);
  return shapes.map((shape) => {
    if (shape.kind === "equipment" && shape.nameOffset) {
      const { nameOffset, ...rest } = shape;
      return { ...rest, nameAnchor: legacyElementAnchor(shape) };
    }
    const route = routes.get(shape.id);
    if (shape.kind !== "pipe" || !route || !(shape.fittings ?? []).some((fitting) => fitting.nameOffset)) return shape;
    return {
      ...shape,
      fittings: shape.fittings.map((fitting) => {
        if (!fitting.nameOffset || !HYDRONIC_ELEMENTS[fitting.type]) return fitting;
        const { nameOffset, ...rest } = fitting;
        return { ...rest, nameAnchor: legacyFittingAnchor(route, fitting) };
      })
    };
  });
}

export function takenNames(shapes){
  const taken = new Set();
  for (const shape of shapes) {
    if (shape.kind === "equipment" && shape.name) taken.add(shape.name);
    if (shape.kind === "pipe") for (const fitting of shape.fittings ?? []) if (fitting.name) taken.add(fitting.name);
  }
  return taken;
}

export function nextFittingName(type, shapes, extra = []){
  const label = HYDRONIC_ELEMENTS[type]?.label ?? "Element";
  const taken = takenNames(shapes);
  for (const name of extra) taken.add(name);
  let index = 1;
  while (taken.has(`${label} ${index}`)) index += 1;
  return `${label} ${index}`;
}

function unnamed(fitting){
  return typeof fitting.name !== "string" && !!HYDRONIC_ELEMENTS[fitting.type];
}

export function nameFittings(shapes){
  const given = [];
  let changed = false;
  const next = shapes.map((shape) => {
    if (shape.kind !== "pipe" || !(shape.fittings ?? []).some(unnamed)) return shape;
    changed = true;
    return {
      ...shape,
      fittings: shape.fittings.map((fitting) => {
        if (!unnamed(fitting)) return fitting;
        const name = nextFittingName(fitting.type, shapes, given);
        given.push(name);
        return { ...fitting, name };
      })
    };
  });
  return changed ? next : shapes;
}
