import { HYDRONIC_ELEMENTS } from "../hydronic/elements.js";
import { portStep, scaledOffset } from "../hydronic/route.js";
import { rotationOf, turnPort } from "../hydronic/frame.js";

function round2(value){
  return Math.round(value * 100) / 100;
}

function normalize(degrees){
  return ((degrees % 360) + 360) % 360;
}

export function scaling(anchor, sx, sy){
  return {
    kind: "scale",
    sx,
    sy,
    point: (p) => ({ x: round2(anchor.x + (p.x - anchor.x) * sx), y: round2(anchor.y + (p.y - anchor.y) * sy) }),
    vector: (v) => ({ x: round2(v.x * sx), y: round2(v.y * sy) })
  };
}

export function mirroring(center, axis){
  return scaling(center, axis === "x" ? -1 : 1, axis === "y" ? -1 : 1);
}

export function rotating(center, degrees){
  const radians = degrees * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const turn = (v) => ({ x: round2(v.x * cos - v.y * sin), y: round2(v.x * sin + v.y * cos) });
  return {
    kind: "rotate",
    degrees,
    point: (p) => {
      const v = turn({ x: p.x - center.x, y: p.y - center.y });
      return { x: round2(center.x + v.x), y: round2(center.y + v.y) };
    },
    vector: turn
  };
}

function uniform(t){
  return t.kind === "scale" ? Math.sqrt(Math.abs(t.sx * t.sy)) : 1;
}

function mirrorAngle(rotation, t){
  let next = rotation;
  if (t.sx < 0) next = -next;
  if (t.sy < 0) next = 180 - next;
  return normalize(next);
}

export function furnitureItem(item, t){
  const center = t.point({ x: item.cx, y: item.cy });
  const next = { ...item, cx: center.x, cy: center.y };
  if (t.kind === "rotate") {
    next.rotation = round2(normalize((item.rotation ?? 0) + t.degrees));
    return next;
  }
  const turned = Math.abs(Math.sin((item.rotation ?? 0) * Math.PI / 180)) > 0.5;
  next.width = round2(item.width * Math.abs(turned ? t.sy : t.sx));
  next.height = round2(item.height * Math.abs(turned ? t.sx : t.sy));
  next.rotation = mirrorAngle(item.rotation ?? 0, t);
  const flips = (t.sx < 0 ? 1 : 0) + (t.sy < 0 ? 1 : 0);
  if (flips % 2) next.flip = !item.flip;
  return next;
}

function handles(list, t){
  return list?.map((handle) => handle ? {
    ...handle,
    in: handle.in ? t.vector(handle.in) : handle.in,
    out: handle.out ? t.vector(handle.out) : handle.out
  } : handle);
}

function mirrored(t){
  return t.kind === "scale" && t.sx * t.sy < 0;
}

function pointShape(original, t){
  const patch = { points: original.points.map(t.point) };
  if (original.handles) patch.handles = handles(original.handles, t);
  if (original.radii && t.kind === "scale") patch.radii = original.radii.map((radius) => round2(radius * Math.min(Math.abs(t.sx), Math.abs(t.sy))));
  if (original.furniture) patch.furniture = original.furniture.map((item) => furnitureItem(item, t));
  if (original.labelOffset) patch.labelOffset = (() => {
    const v = t.vector({ x: original.labelOffset.dx, y: original.labelOffset.dy });
    return { dx: v.x, dy: v.y };
  })();
  if (original.thermostat) patch.thermostat = (() => {
    const v = t.vector({ x: original.thermostat.dx, y: original.thermostat.dy });
    return { dx: v.x, dy: v.y };
  })();
  if (original.doors && t.kind === "scale") {
    const factor = uniform(t);
    patch.doors = original.doors.map((door) => ({
      ...door,
      width: Math.max(50, Math.round(door.width * factor)),
      hinge: mirrored(t) ? (door.hinge === "left" ? "right" : "left") : door.hinge
    }));
  }
  if (original.kind === "pipe") {
    for (const key of ["from", "to"]) {
      const end = original[key];
      if (!end || end.id !== undefined) continue;
      patch[key] = { ...end, ...t.point(end) };
    }
  }
  return patch;
}

function boxShape(original, t){
  const a = t.point({ x: original.x, y: original.y });
  const b = t.point({ x: original.x + original.width, y: original.y + original.height });
  const patch = { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: round2(Math.abs(b.x - a.x)), height: round2(Math.abs(b.y - a.y)) };
  if (t.kind === "rotate") {
    const center = t.point({ x: original.x + original.width / 2, y: original.y + original.height / 2 });
    return { x: round2(center.x - original.width / 2), y: round2(center.y - original.height / 2) };
  }
  if (original.kind === "text") patch.fontSize = Math.max(6, round2(original.fontSize * uniform(t)));
  return patch;
}

function mirrorsGraphic(spec){
  return !spec.branch && !spec.device && !spec.electric && !spec.bar && !spec.tankProbes;
}

function elementShape(original, t){
  const spec = HYDRONIC_ELEMENTS[original.type] ?? {};
  const center = t.point({ x: original.x + original.width / 2, y: original.y + original.height / 2 });
  let { width, height } = original;
  const patch = {};
  if (t.kind === "rotate") {
    const turns = spec.electric ? 0 : ((Math.round(t.degrees / 90) % 4) + 4) % 4;
    if (turns % 2) [width, height] = [height, width];
    if (turns) patch.rotation = normalize(rotationOf(original) + turns * 90);
  } else if (!spec.electric) {
    const turned = rotationOf(original) % 180 !== 0;
    const fixedWidth = spec.fixedHeight && turned;
    const fixedHeight = spec.fixedHeight && !turned;
    width = fixedWidth ? width : Math.max(4, round2(width * Math.abs(t.sx)));
    height = fixedHeight ? height : Math.max(4, round2(height * Math.abs(t.sy)));
    if ((t.sx < 0 || t.sy < 0) && mirrorsGraphic(spec)) {
      const mirror = { x: !!original.mirror?.x, y: !!original.mirror?.y };
      if (t.sx < 0) mirror.x = !mirror.x;
      if (t.sy < 0) mirror.y = !mirror.y;
      patch.rotation = mirrorAngle(rotationOf(original), t);
      patch.mirror = mirror;
    }
  }
  return { ...patch, width, height, x: round2(center.x - width / 2), y: round2(center.y - height / 2) };
}

export function transformShape(original, t){
  if (original.kind === "equipment") return elementShape(original, t);
  if (original.points) return pointShape(original, t);
  if (Number.isFinite(original.x) && Number.isFinite(original.width)) return boxShape(original, t);
  return {};
}

function mirrorPort(end, element, axis){
  const horizontal = end.side === "top" || end.side === "bottom";
  if (axis === "x") {
    if (horizontal) return { ...end, offset: round2(element.width - end.offset) };
    return { ...end, side: end.side === "left" ? "right" : "left" };
  }
  if (!horizontal) return { ...end, offset: round2(element.height - end.offset) };
  return { ...end, side: end.side === "top" ? "bottom" : "top" };
}

export function transformPort(end, original, next, t){
  const spec = HYDRONIC_ELEMENTS[original.type] ?? {};
  if (spec.electric) return end;
  let port = { ...end };
  if (t.kind === "rotate") {
    const turns = ((Math.round(t.degrees / 90) % 4) + 4) % 4;
    let box = { width: original.width, height: original.height };
    for (let index = 0; index < turns; index += 1) {
      port = turnPort(port, box);
      box = { width: box.height, height: box.width };
    }
    return port;
  }
  if (t.sx < 0) port = mirrorPort(port, original, "x");
  if (t.sy < 0) port = mirrorPort(port, original, "y");
  const horizontal = port.side === "top" || port.side === "bottom";
  const before = horizontal ? original.width : original.height;
  const after = horizontal ? next.width : next.height;
  if (before === after) return port;
  port.offset = spec.ports || spec.centerPorts
    ? round2(port.offset * after / before)
    : scaledOffset(port.offset, before, after, portStep(next));
  return port;
}
