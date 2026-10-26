import { HYDRONIC_ELEMENTS } from "./elements.js";
import { computeRoutes, routePoint } from "./route.js";
import { fittingBox } from "./fittingAlign.js";
import { NAME_SIZE, labelBox, legacyElementAnchor, nameAnchorAt, nameSizeOf, placeName, textWidth } from "./label.js";
import { meterWires } from "./branch.js";
import { calorimeterWires } from "./meter.js";

function isHorizontal(route, fitting){
  const angle = routePoint(route, fitting.t).angle;
  return angle === 0 || Math.abs(angle) === 180;
}

function defaultPlace(route, fitting, size){
  const scale = size / NAME_SIZE;
  return isHorizontal(route, fitting) ? { side: "bottom", gap: 4 * scale } : { side: "right", gap: 6 * scale };
}

export function fittingLabel(route, fitting, place = null){
  const size = nameSizeOf(fitting);
  return placeName(fittingBox(route, fitting), fitting.nameAnchor ?? place ?? defaultPlace(route, fitting, size), size);
}

export function showsName(fitting){
  const spec = HYDRONIC_ELEMENTS[fitting.type];
  return !!fitting.name && !!spec && !spec.primitive && !spec.unnamed;
}

function overlap(a, b){
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return width > 0 && height > 0 ? width * height : 0;
}

function lineBoxes(points, thickness){
  const boxes = [];
  for (let index = 1; index < points.length; index += 1) {
    const a = points[index - 1];
    const b = points[index];
    boxes.push({ x: Math.min(a.x, b.x) - thickness / 2, y: Math.min(a.y, b.y) - thickness / 2, width: Math.abs(b.x - a.x) + thickness, height: Math.abs(b.y - a.y) + thickness });
  }
  return boxes;
}

export function namePlaces(shapes, routes, readouts = new Map()){
  const places = new Map();
  const obstacles = [];
  const named = [];
  for (const shape of shapes) {
    if (shape.kind === "equipment" && HYDRONIC_ELEMENTS[shape.type]) obstacles.push({ x: shape.x, y: shape.y, width: shape.width, height: shape.height, weight: 2 });
    const route = shape.kind === "pipe" ? routes.get(shape.id) : null;
    if (!route) continue;
    obstacles.push(...lineBoxes(route, (shape.width ?? 8) + 6).map((box) => ({ ...box, weight: 40 })));
    for (const fitting of shape.fittings ?? []) {
      if (!HYDRONIC_ELEMENTS[fitting.type]) continue;
      const box = fittingBox(route, fitting);
      obstacles.push({ x: box.x - 2, y: box.y - 2, width: box.width + 4, height: box.height + 4, weight: 20 });
      if (showsName(fitting) && !fitting.nameAnchor) named.push({ route, fitting });
    }
  }
  for (const box of readouts.values()) obstacles.push({ x: box.x - 4, y: box.y - 4, width: box.width + 8, height: box.height + 8, weight: 20 });
  for (const wire of [...meterWires(shapes, routes), ...calorimeterWires(shapes, routes)]) obstacles.push(...lineBoxes(wire, 4).map((box) => ({ ...box, weight: 10 })));
  for (const { route, fitting } of named) {
    const size = nameSizeOf(fitting);
    const scale = size / NAME_SIZE;
    const width = textWidth(fitting.name, size) + 6;
    const first = defaultPlace(route, fitting, size);
    const sides = isHorizontal(route, fitting) ? ["bottom", "top", "right", "left"] : ["right", "left", "bottom", "top"];
    const frame = fittingBox(route, fitting);
    let best = null;
    sides.forEach((side, index) => {
      const across = side === "left" || side === "right";
      const reach = across ? frame.height / 2 + 12 * scale : width / 2 + frame.width / 2;
      for (const step of [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2, -2]) {
        const place = { ...(side === first.side ? first : { side, gap: (across ? 6 : 4) * scale }), ...(step ? { shift: Math.round(step * reach) } : {}) };
        const box = labelBox(placeName(frame, place, size), width);
        const score = obstacles.reduce((total, obstacle) => total + overlap(box, obstacle) * (obstacle.weight ?? 1), 0) + index * 4 + Math.abs(step) * 6;
        if (!best || score < best.score) best = { place, box, score };
      }
    });
    places.set(fitting.id, best.place);
    obstacles.push({ ...best.box, weight: 20 });
  }
  return places;
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

function nameAt(spec, index){
  return spec?.tag ? `${spec.tag}${index}` : `${spec?.label ?? "Element"} ${index}`;
}

export function nextFittingName(type, shapes, extra = []){
  const spec = HYDRONIC_ELEMENTS[type];
  if (spec?.unnamed || spec?.primitive) return "";
  const taken = takenNames(shapes);
  for (const name of extra) taken.add(name);
  let index = 1;
  while (taken.has(nameAt(spec, index))) index += 1;
  return nameAt(spec, index);
}

function longDefault(fitting){
  const spec = HYDRONIC_ELEMENTS[fitting.type];
  if (!spec?.tag || typeof fitting.name !== "string" || !fitting.name.startsWith(`${spec.label} `)) return false;
  return /^\d+$/.test(fitting.name.slice(spec.label.length + 1));
}

function unnamed(fitting){
  return (typeof fitting.name !== "string" || longDefault(fitting)) && !!HYDRONIC_ELEMENTS[fitting.type];
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
        const name = nextFittingName(fitting.type, shapes.map((entry) => entry.kind === "pipe" ? { ...entry, fittings: (entry.fittings ?? []).filter((other) => !longDefault(other)) } : entry), given);
        given.push(name);
        return { ...fitting, name };
      })
    };
  });
  return changed ? next : shapes;
}
