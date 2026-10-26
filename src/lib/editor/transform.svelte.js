import { branchPipeIds, isBranch } from "$lib/diagram/branch.js";
import { ridingPipes } from "$lib/diagram/route.js";
import { HYDRONIC_ELEMENTS } from "$lib/diagram/elements.js";
import { transformShape, transformPort, rotating, scaling, mirroring } from "$lib/diagram/transform.js";
import { dragPointer } from "$lib/core/tools/move.js";

export function createTransform(ctx){
  function transformGroup(){
    const carried = [...new Set([...ctx.selectionIds, ...branchPipeIds(ctx.shapes, ctx.selectionIds)])];
    const ids = [...new Set([...carried, ...ridingPipes(ctx.shapes, carried)])];
    const entries = ids.map(ctx.shapeById).filter(Boolean).map((shape) => ({ shape, original: $state.snapshot(shape) }));
    const elements = new Map(entries.filter((entry) => entry.shape.kind === "equipment").map((entry) => [entry.shape.id, entry.original]));
    const ends = [];
    for (const pipe of ctx.shapes) {
      if (pipe.kind !== "pipe") continue;
      for (const key of ["from", "to"]) {
        if (pipe[key]?.id !== undefined && elements.has(pipe[key].id)) ends.push({ pipe, key, end: $state.snapshot(pipe[key]), element: elements.get(pipe[key].id) });
      }
    }
    return { entries, ends };
  }

  function onGrid(shape){
    const spec = HYDRONIC_ELEMENTS[shape.type];
    if (!ctx.snapToGrid || shape.kind !== "equipment" || !spec || spec.branch || spec.electric || spec.bar || spec.noPorts) return {};
    const width = Math.max(ctx.gridSize, Math.round(shape.width / ctx.gridSize) * ctx.gridSize);
    const height = Math.max(ctx.gridSize, Math.round(shape.height / ctx.gridSize) * ctx.gridSize);
    const cx = Math.round((shape.x + shape.width / 2) / ctx.gridSize) * ctx.gridSize;
    const cy = Math.round((shape.y + shape.height / 2) / ctx.gridSize) * ctx.gridSize;
    return { width, height, x: cx - width / 2, y: cy - height / 2 };
  }

  function applyTransformation({ entries, ends }, t){
    for (const entry of entries) {
      Object.assign(entry.shape, transformShape(entry.original, t));
      if (t.kind === "scale") Object.assign(entry.shape, onGrid(entry.shape));
    }
    for (const item of ends) item.pipe[item.key] = transformPort(item.end, item.element, ctx.shapeById(item.end.id), t);
  }

  function scaleRatio(value, start, anchor){
    const base = start - anchor;
    if (Math.abs(base) < 1e-6) return 1;
    return Math.max(0.05, (value - anchor) / base);
  }

  function beginTransform(event, handle){
    const box = ctx.transformBox;
    if (!box) return;
    if (handle !== "rotate" && ctx.singleBar) {
      ctx.beginBarScale(event, ctx.singleBar, handle);
      return;
    }
    if (handle !== "rotate" && handle.length === 2 && ctx.selectedShapes.length === 1 && ctx.selectedShapes[0].kind === "equipment" && !isBranch(ctx.selectedShapes[0])) {
      ctx.beginElementScale(event, ctx.selectedShapes[0], handle);
      return;
    }
    const start = ctx.toCanvas(event);
    if (!start) return;
    const parts = !ctx.selectedShapes.length ? ctx.partEntries() : null;
    const group = parts ? null : transformGroup();
    const apply = (t) => parts ? ctx.transformParts(parts, t) : applyTransformation(group, t);
    const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const rigid = !!group?.entries.some((entry) => entry.shape.kind === "equipment" || entry.shape.kind === "pipe");
    const textOnly = !!group?.entries.length && group.entries.every((entry) => entry.shape.kind === "text");
    const groupIds = new Set((group?.entries ?? []).map((entry) => entry.shape.id));
    const keepFittings = ctx.holdFittings(groupIds);
    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const point = ctx.toCanvas(next);
        if (!point) return;
        if (handle === "rotate") {
          const raw = (Math.atan2(point.y - center.y, point.x - center.x) - Math.atan2(start.y - center.y, start.x - center.x)) * 180 / Math.PI;
          const step = rigid ? 90 : next.shiftKey ? 15 : 1;
          apply(rotating(center, Math.round(raw / step) * step));
          keepFittings();
          return;
        }
        const anchor = {
          x: handle.includes("w") ? box.x + box.width : handle.includes("e") ? box.x : center.x,
          y: handle.includes("n") ? box.y + box.height : handle.includes("s") ? box.y : center.y
        };
        const corner = handle.length === 2;
        let sx = (!ctx.branchSelected || corner) && (handle.includes("w") || handle.includes("e")) ? scaleRatio(point.x, start.x, anchor.x) : 1;
        let sy = handle.includes("n") || handle.includes("s") ? scaleRatio(point.y, start.y, anchor.y) : 1;
        if (corner && (ctx.branchSelected || (textOnly ? next.shiftKey : !next.shiftKey))) sx = sy = Math.max(sx, sy);
        const t = scaling(anchor, sx, sy);
        t.textScale = textOnly ? next.shiftKey : true;
        apply(t);
        if (ctx.branchSelected && group) ctx.scaleBranchFittings(group, corner ? sx : 1);
        keepFittings();
      },
      onend: () => {
        ctx.settleCorners([...groupIds].filter((id) => ctx.shapeById(id)?.kind === "pipe" && ctx.shapeById(id)?.corners));
        ctx.history.endGesture();
      }
    });
  }

  function rotateSelection(){
    const box = ctx.transformBox;
    if (!box || ctx.selectedShapes.some(isBranch)) return;
    const t = rotating({ x: box.x + box.width / 2, y: box.y + box.height / 2 }, 90);
    if (!ctx.selectedShapes.length) ctx.transformParts(ctx.partEntries(), t);
    else applyTransformation(transformGroup(), t);
  }

  function flipSelection(axis){
    const box = ctx.transformBox;
    if (!box) return;
    const t = mirroring({ x: box.x + box.width / 2, y: box.y + box.height / 2 }, axis);
    if (!ctx.selectedShapes.length) ctx.transformParts(ctx.partEntries(), t);
    else applyTransformation(transformGroup(), t);
  }

  return { transformGroup, onGrid, applyTransformation, scaleRatio, beginTransform, rotateSelection, flipSelection };
}
