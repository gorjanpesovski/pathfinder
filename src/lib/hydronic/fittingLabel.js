import { HYDRONIC_ELEMENTS } from "./elements.js";
import { routePoint } from "./route.js";
import { fittingBox } from "./fittingAlign.js";
import { NAME_SIZE, nameSizeOf } from "./label.js";

export function fittingLabel(route, fitting){
  const size = nameSizeOf(fitting);
  const scale = size / NAME_SIZE;
  const box = fittingBox(route, fitting);
  const angle = routePoint(route, fitting.t).angle;
  const horizontal = angle === 0 || Math.abs(angle) === 180;
  if (horizontal) {
    const y = box.y + box.height + 18 * scale;
    return { x: box.pose.x, y, size, anchor: "middle", top: box.y + box.height + 4 * scale, height: 18 * scale, middle: y - size * 0.35, center: box.pose.x };
  }
  const x = box.x + box.width + 6 * scale;
  const y = box.pose.y + size * 0.35;
  return { x, y, size, anchor: "start", top: box.pose.y - 9 * scale, height: 18 * scale, middle: box.pose.y, center: x + size * 3 };
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

export function nameFittings(shapes){
  const given = [];
  let changed = false;
  const next = shapes.map((shape) => {
    if (shape.kind !== "pipe" || !(shape.fittings ?? []).some((fitting) => !fitting.name && HYDRONIC_ELEMENTS[fitting.type])) return shape;
    changed = true;
    return {
      ...shape,
      fittings: shape.fittings.map((fitting) => {
        if (fitting.name || !HYDRONIC_ELEMENTS[fitting.type]) return fitting;
        const name = nextFittingName(fitting.type, shapes, given);
        given.push(name);
        return { ...fitting, name };
      })
    };
  });
  return changed ? next : shapes;
}
