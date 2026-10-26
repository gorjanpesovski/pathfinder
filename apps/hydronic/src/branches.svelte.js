import { isBranch, branchDefaults, ownedPipes, rebuildBranch, legSpan, keepLegDistances } from "@pathfinder/diagram/branch.js";
import { readoutSpec, readoutScaleOf } from "@pathfinder/diagram/readout.js";
import { isElectricType, HYDRONIC_ELEMENTS } from "@pathfinder/diagram/elements.js";
import { nextElectricName } from "@pathfinder/diagram/electric/symbols.js";
import { pruneDangling, isFreeEnd, endpointPose } from "@pathfinder/diagram/route.js";
import { dragPointer } from "@pathfinder/core/tools/move.js";

export function createBranches(ctx){
  function scaleBranchFittings({ entries }, factor){
    const branches = new Set(entries.filter((entry) => isBranch(entry.original)).map((entry) => entry.original.id));
    const round = (value) => Math.round(value * 1000) / 1000;
    for (const { shape, original } of entries) {
      if (shape.kind !== "pipe" || !branches.has(original.branchOf)) continue;
      if (original.width) shape.width = round(original.width * factor);
      if (!original.fittings) continue;
      shape.fittings = original.fittings.map((fitting) => ({
        ...fitting,
        scale: round((fitting.scale ?? 1) * factor),
        ...(fitting.readoutOffset ? { readoutOffset: { x: round(fitting.readoutOffset.x * factor), y: round(fitting.readoutOffset.y * factor) } } : {}),
        ...(readoutSpec(fitting.type) ? { readoutScale: round(readoutScaleOf(fitting) * factor) } : {})
      }));
    }
  }

  function setBranchName(value){
    for (const element of ctx.selectedElements()) {
      const others = ctx.shapes.filter((shape) => shape !== element);
      element.name = value.trim() || (isElectricType(element.type) ? nextElectricName(element.type, others) : "");
    }
  }

  function setBranchParam(name, value){
    for (const element of ctx.selectedElements()) {
      if (!isBranch(element)) continue;
      element.params = { ...branchDefaults(), ...$state.snapshot(element.params ?? {}), [name]: value };
      refreshBranch(element);
    }
  }

  function refreshBranch(element){
    const owned = ownedPipes(ctx.shapes, element.id);
    if (!owned.length) return;
    const rebuilt = rebuildBranch($state.snapshot(element), $state.snapshot(owned), () => ctx.nextId++);
    const keep = new Set(rebuilt.map((pipe) => pipe.id));
    const updates = new Map(rebuilt.map((pipe) => [pipe.id, pipe]));
    const next = [];
    for (const shape of ctx.shapes) {
      if (shape.kind === "pipe" && shape.branchOf === element.id) {
        if (keep.has(shape.id)) next.push(updates.get(shape.id));
        continue;
      }
      next.push(shape);
    }
    for (const pipe of rebuilt) if (!ctx.shapes.some((shape) => shape.id === pipe.id)) next.push(pipe);
    ctx.shapes = pruneDangling(next);
  }

  function beginLegDrag(event, pipe, end){
    const original = $state.snapshot(pipe[end]);
    if (!isFreeEnd(original)) return;
    const start = ctx.toCanvas(event);
    if (!start) return;
    const branch = ctx.shapeById(pipe.branchOf);
    const top = branch ? endpointPose(pipe.role === "supply" ? pipe.to : pipe.from, ctx.shapeIndex)?.point : null;
    const bars = ctx.shapes.filter((shape) => shape.kind === "equipment" && HYDRONIC_ELEMENTS[shape.type]?.bar);
    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const point = ctx.toCanvas(next);
        if (!point) return;
        let y = ctx.snapValue(original.y + point.y - start.y, ctx.boardHeight);
        const x = top?.x ?? original.x;
        const bar = bars.find((entry) => x > entry.x && x < entry.x + entry.width && Math.abs(entry.y - y) <= ctx.snapRadius);
        if (bar) y = bar.y;
        if (top) y = Math.max(y, top.y + 40);
        const before = branch ? legSpan(branch, pipe) : null;
        pipe[end] = { x, y: ctx.round2(y) };
        if (branch) pipe.fittings = keepLegDistances(branch, $state.snapshot(pipe), before);
      },
      onend: () => ctx.history.endGesture()
    });
  }

  return { scaleBranchFittings, setBranchName, setBranchParam, refreshBranch, beginLegDrag };
}
