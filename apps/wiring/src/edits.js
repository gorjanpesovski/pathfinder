import { electricSize } from "@pathfinder/diagram/electric/symbols.js";
import { refitText } from "@pathfinder/core/tools/text.js";

const SIZE = new Set(["x", "y", "width", "height"]);

function snapshot(shape){
  const { id, source, ...rest } = shape;
  return JSON.parse(JSON.stringify(rest));
}

function same(a, b){
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function keys(a, b){
  return new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
}

export function ownerOf(shape){
  const source = shape.source ?? {};
  if (source.row === "supply") return { part: "supply", id: "supply" };
  if (source.row) return { part: "power", id: source.row };
  if (source.controlRow) return { part: "control", id: source.controlRow };
  if (source.controlLink) return { part: "link", id: source.controlLink };
  return null;
}

export function stamp(shapes){
  const counts = new Map();
  for (const shape of shapes) {
    if (shape.kind !== "equipment" && shape.kind !== "text") continue;
    const source = shape.source ?? {};
    const owner = source.row ?? source.controlRow ?? source.controlLink ?? source.sheet ?? "page";
    const base = `${source.control ? "c" : "p"}:${owner}:${shape.type ?? shape.kind}`;
    const count = (counts.get(base) ?? 0) + 1;
    counts.set(base, count);
    shape.source = { ...source, key: `${base}:${count}`, original: snapshot(shape) };
  }
  return shapes;
}

export function editOf(shape){
  const original = shape.source?.original;
  if (!original) return null;
  const current = snapshot(shape);
  const edit = {};
  if (current.x !== original.x || current.y !== original.y) edit.move = { dx: current.x - original.x, dy: current.y - original.y };
  const props = {};
  const base = {};
  for (const key of keys(current, original)) {
    if (SIZE.has(key)) continue;
    if (key === "params") {
      for (const name of keys(current.params, original.params)) {
        if (same(current.params?.[name], original.params?.[name])) continue;
        (props.params ??= {})[name] = current.params?.[name];
        (base.params ??= {})[name] = original.params?.[name];
      }
      continue;
    }
    if (same(current[key], original[key])) continue;
    props[key] = current[key];
    base[key] = original[key];
  }
  if (Object.keys(props).length) Object.assign(edit, { props, base, text: original.text ?? null });
  return edit.move || edit.props ? edit : null;
}

export function collectEdits(shapes){
  const edits = {};
  for (const shape of shapes) {
    const key = shape.source?.key;
    const edit = key ? editOf(shape) : null;
    if (edit) edits[key] = edit;
  }
  return edits;
}

function resize(shape){
  if (shape.kind === "text") refitText(shape);
  else Object.assign(shape, electricSize(shape.type, shape.params));
}

function fits(edit, original){
  if (edit.text !== null && edit.text !== undefined && !same(edit.text, original.text)) return false;
  for (const key of Object.keys(edit.base ?? {})) {
    if (key === "params") {
      for (const name of Object.keys(edit.base.params)) if (!same(edit.base.params[name], original.params?.[name])) return false;
    } else if (!same(edit.base[key], original[key])) return false;
  }
  return true;
}

export function applyEdits(shapes, edits){
  let applied = 0;
  for (const shape of shapes) {
    const edit = edits[shape.source?.key];
    if (!edit) continue;
    const original = shape.source.original;
    if (edit.props && fits(edit, original)) {
      const { params, ...rest } = JSON.parse(JSON.stringify(edit.props));
      Object.assign(shape, rest);
      if (params) shape.params = { ...shape.params, ...params };
      resize(shape);
      applied += 1;
    }
    if (edit.move) {
      shape.x += edit.move.dx;
      shape.y += edit.move.dy;
      applied += edit.props ? 0 : 1;
    }
  }
  return applied;
}

export function resetShape(shape){
  const original = shape.source?.original;
  if (!original) return;
  const clone = JSON.parse(JSON.stringify(original));
  for (const key of Object.keys(shape)) if (key !== "id" && key !== "source" && !(key in clone)) delete shape[key];
  Object.assign(shape, clone);
}
