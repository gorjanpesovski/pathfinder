import { baseStyle } from "@pathfinder/core/tools/text.js";

export const EXPORT_TARGETS = {
  atvise: { width: 1920, height: 1080, minFont: 0 },
  pgd: { width: 800, height: 480, minFont: 8 }
};

export function targetsOf(saved){
  const pick = (id) => {
    const base = EXPORT_TARGETS[id];
    const entry = saved?.[id] ?? {};
    const number = (value, fallback) => Number.isFinite(value) && value > 0 ? value : fallback;
    return { width: number(entry.width, base.width), height: number(entry.height, base.height), minFont: Number.isFinite(entry.minFont) && entry.minFont >= 0 ? entry.minFont : base.minFont };
  };
  return { atvise: pick("atvise"), pgd: pick("pgd") };
}

function round(value){
  return Math.round(value * 100) / 100;
}

export function fitTarget(design, target){
  const k = Math.min(target.width / design.width, target.height / design.height);
  return { k, dx: round((target.width - design.width * k) / 2), dy: round((target.height - design.height * k) / 2), minFont: target.minFont ?? 0 };
}

export function isIdentity(fit){
  return !fit || (Math.abs(fit.k - 1) < 1e-9 && !fit.dx && !fit.dy);
}

function makeScaler(fit){
  const x = (value) => round(value * fit.k + fit.dx);
  const y = (value) => round(value * fit.k + fit.dy);
  const size = (value) => round(value * fit.k);
  const font = (value) => round(Math.max(fit.minFont, value * fit.k));
  const point = (entry) => entry && { ...entry, x: x(entry.x), y: y(entry.y) };
  const box = (entry) => entry && { ...entry, x: x(entry.x), y: y(entry.y), width: size(entry.width), height: size(entry.height) };
  return { x, y, size, font, point, box };
}

function scalePart(part, s){
  if (part.kind === "text") return { ...part, x: s.x(part.x), baseline: s.y(part.baseline), size: s.font(part.size) };
  if (part.kind === "drain") return { ...part, cx: s.x(part.cx), cy: s.y(part.cy), outer: s.size(part.outer), inner: s.size(part.inner), stroke: s.size(part.stroke) };
  return part;
}

function scaleItem(item, s){
  const centred = item.cx !== undefined ? { cx: s.x(item.cx), cy: s.y(item.cy) } : {};
  const sized = item.width !== undefined ? { width: s.size(item.width), height: s.size(item.height) } : {};
  const placed = item.x !== undefined ? { x: s.x(item.x), y: s.y(item.y) } : {};
  switch (item.kind) {
    case "pipe": return { ...item, points: item.points.map(s.point), route: item.route?.map(s.point), width: s.size(item.width) };
    case "arrow": return { ...item, mark: s.point(item.mark), size: s.size(item.size) };
    case "junction": return { ...item, ...placed, radius: s.size(item.radius), ...(item.stroke !== undefined ? { stroke: s.size(item.stroke) } : {}) };
    case "label": {
      const size = s.font(item.size);
      const grow = size / Math.max(0.01, s.size(item.size));
      const frame = s.box(item.box);
      if (!frame || grow <= 1) return { ...item, ...placed, size, box: frame };
      const width = round(frame.width * grow);
      const height = round(frame.height * grow);
      const left = item.anchor === "end" ? frame.x + frame.width - width : item.anchor === "middle" ? frame.x + (frame.width - width) / 2 : frame.x;
      return { ...item, ...placed, size, box: { ...frame, x: round(left), y: round(frame.y + (frame.height - height) / 2), width, height } };
    }
    case "branch": return { ...item, ...centred, ...sized, parts: item.parts.map((part) => scalePart(part, s)) };
    case "generic": return { ...item, ...centred, ...sized, ...placed, fontSize: s.font(item.fontSize) };
    default: return { ...item, ...centred, ...sized, ...placed };
  }
}

export function scaleItems(items, fit){
  if (isIdentity(fit)) return items;
  const s = makeScaler(fit);
  return items.map((item) => scaleItem(item, s));
}

export function scaleText(shape, fit){
  if (isIdentity(fit)) return shape;
  const s = makeScaler(fit);
  const rich = Array.isArray(shape.rich)
    ? shape.rich.map((paragraph) => ({ ...paragraph, runs: (paragraph.runs ?? []).map((run) => run.size ? { ...run, size: s.font(run.size) } : run) }))
    : shape.rich;
  return {
    ...shape,
    x: s.x(shape.x),
    y: s.y(shape.y),
    ...(shape.width !== undefined ? { width: s.size(shape.width), height: s.size(shape.height) } : {}),
    fontSize: s.font(baseStyle(shape).size),
    ...(rich !== undefined ? { rich } : {})
  };
}
