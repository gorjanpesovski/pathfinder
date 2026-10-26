import { HYDRONIC_ELEMENTS, isElectricType, nextElementName } from "$lib/diagram/elements.js";
import { hasTankProbes } from "$lib/diagram/tank.js";
import { hasNameLabel, textWidth } from "$lib/diagram/label.js";
import { dragPointer } from "$lib/core/tools/move.js";
import { isTurned, footprint, rotationOf, turnPort } from "$lib/diagram/frame.js";
import { isBranch, branchDefaults, alignBranch, createBranch, snapBranch } from "$lib/diagram/branch.js";
import { projectOnRoute } from "$lib/diagram/route.js";
import { valveCorner } from "$lib/diagram/valvePorts.js";
import { orientAngle, fittingPose } from "$lib/diagram/geometry.js";
import { electricDefaults, electricSize, nextElectricName } from "$lib/diagram/electric/symbols.js";
import { fittingBox } from "$lib/diagram/fittingAlign.js";

export function createElements(ctx){
  function selectedElements(){
    return ctx.selectedShapes.filter((shape) => shape.kind === "equipment" && !shape.locked && HYDRONIC_ELEMENTS[shape.type]);
  }

  function setElementSize(dimension, value, keepRatio){
    if (!(value >= 4)) return;
    const elements = selectedElements();
    for (const element of elements) {
      const original = { x: element.x, y: element.y, width: element.width, height: element.height };
      const entries = ctx.attachedEnds(element);
      const cx = original.x + original.width / 2;
      const cy = original.y + original.height / 2;
      const other = dimension === "width" ? "height" : "width";
      element[dimension] = value;
      if (keepRatio && !HYDRONIC_ELEMENTS[element.type]?.fixedHeight) element[other] = Math.round(value * original[other] / original[dimension] * 100) / 100;
      element.x = centreFor(element, cx) - element.width / 2;
      element.y = centreFor(element, cy) - element.height / 2;
      ctx.remapEnds(element, entries, original);
    }
    ctx.editKey = `size-${elements.map((element) => element.id).join(",")}`;
  }

  function toggleTankProbe(id){
    const tanks = selectedElements().filter(hasTankProbes);
    if (!tanks.length) return;
    const on = !tanks.every((tank) => tank.probes?.[id]);
    for (const tank of tanks) tank.probes = { ...(tank.probes ?? {}), [id]: on };
  }

  function setNameSize(value){
    ctx.editKey = "name-size";
    for (const element of selectedElements()) {
      if (hasNameLabel(element)) element.nameSize = value;
      else if (HYDRONIC_ELEMENTS[element.type]?.generic) element.fontSize = value;
    }
  }

  function beginElementScale(event, element, corner){
    const original = { x: element.x, y: element.y, width: element.width, height: element.height };
    const aspect = original.width / original.height;
    const left = corner.includes("w");
    const top = corner.includes("n");
    const anchor = { x: left ? original.x + original.width : original.x, y: top ? original.y + original.height : original.y };
    const entries = ctx.attachedEnds(element);
    const keepFittings = ctx.holdFittings();
    const free = !!HYDRONIC_ELEMENTS[element.type]?.noPorts;
    const size = (value) => free ? Math.max(8, Math.round(value)) : Math.max(40, ctx.snapToGrid ? Math.round(value / ctx.gridSize) * ctx.gridSize : Math.round(value));

    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const point = ctx.toCanvas(next);
        if (!point) return;
        const fixed = HYDRONIC_ELEMENTS[element.type]?.fixedHeight;
        const width = fixed && isTurned(element) ? original.width : size(Math.abs(point.x - anchor.x));
        const height = fixed
          ? (isTurned(element) ? size(Math.abs(point.y - anchor.y)) : original.height)
          : next.shiftKey ? size(Math.abs(point.y - anchor.y)) : size(width / aspect);
        const x = left ? anchor.x - width : anchor.x;
        const y = top ? anchor.y - height : anchor.y;
        Object.assign(element, {
          x: centred(x + width / 2) - width / 2,
          y: centred(y + height / 2) - height / 2,
          width,
          height
        });
        ctx.remapEnds(element, entries, original);
        keepFittings();
      },
      onend: () => ctx.history.endGesture()
    });
  }

  function beginBarScale(event, element, handle){
    const original = { x: element.x, y: element.y, width: element.width, height: element.height };
    const vertical = original.height > original.width;
    const low = vertical ? handle.includes("n") : handle.includes("w");
    const high = vertical ? handle.includes("s") : handle.includes("e");
    if (!low && !high) return;
    const key = vertical ? "y" : "x";
    const size = vertical ? "height" : "width";
    const limit = vertical ? ctx.boardHeight : ctx.boardWidth;
    const anchor = low ? original[key] + original[size] : original[key];
    const grabbed = low ? original[key] : original[key] + original[size];
    const minimum = ctx.snapToGrid ? ctx.gridSize * 2 : 40;
    const entries = ctx.attachedEnds(element);
    const start = ctx.toCanvas(event);
    if (!start) return;

    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const point = ctx.toCanvas(next);
        if (!point) return;
        const edge = ctx.snapValue(grabbed + point[key] - start[key], limit);
        const length = Math.max(minimum, low ? anchor - edge : edge - anchor);
        element[key] = low ? anchor - length : anchor;
        element[size] = length;
        keepBarEnds(element, entries, original, vertical);
      },
      onend: () => ctx.history.endGesture()
    });
  }

  function keepBarEnds(element, entries, original, vertical){
    const shift = vertical ? original.y - element.y : original.x - element.x;
    const length = vertical ? element.height : element.width;
    for (const entry of entries) {
      for (const key of ["from", "to"]) {
        const end = entry[key];
        if (!end || end.id !== element.id) continue;
        const along = vertical ? end.side === "left" || end.side === "right" : end.side === "top" || end.side === "bottom";
        if (along) entry.pipe[key] = { ...end, offset: Math.min(length, Math.max(0, ctx.round2(end.offset + shift))) };
      }
    }
  }

  function centred(value){
    return ctx.snapToGrid ? Math.round(value / ctx.gridSize) * ctx.gridSize : Math.round(value);
  }

  function resetElementSize(){
    for (const element of selectedElements()) {
      const spec = HYDRONIC_ELEMENTS[element.type];
      const original = { width: element.width, height: element.height };
      const entries = ctx.attachedEnds(element);
      const size = footprint(spec.width, spec.height, rotationOf(element));
      const cx = element.x + element.width / 2;
      const cy = element.y + element.height / 2;
      element.width = size.width;
      element.height = size.height;
      element.x = centreFor(element, cx) - size.width / 2;
      element.y = centreFor(element, cy) - size.height / 2;
      ctx.remapEnds(element, entries, original);
    }
  }

  function centreFor(element, value){
    return ctx.snapToGrid && !isBranch(element) ? Math.round(value / ctx.gridSize) * ctx.gridSize : value;
  }

  function rotateElements(){
    const elements = ctx.selectedShapes.filter((shape) => shape.kind === "equipment" && !shape.locked && HYDRONIC_ELEMENTS[shape.type]);
    for (const element of elements) {
      const original = { x: element.x, y: element.y, width: element.width, height: element.height };
      const entries = ctx.attachedEnds(element);
      const cx = original.x + original.width / 2;
      const cy = original.y + original.height / 2;
      element.rotation = (rotationOf(element) + 90) % 360;
      element.width = original.height;
      element.height = original.width;
      element.x = centreFor(element, cx) - element.width / 2;
      element.y = centreFor(element, cy) - element.height / 2;
      for (const entry of entries) {
        for (const end of ["from", "to"]) {
          if (entry[end]?.id === element.id) entry.pipe[end] = turnPort(entry[end], original);
        }
      }
    }
  }

  function hydronicPlacement(type, point){
    const spec = HYDRONIC_ELEMENTS[type];
    if (spec.inline) {
      const radius = Math.max(24, 30 / ctx.viewport.zoom);
      let best = null;
      for (const [pipeId, route] of ctx.pipeRoutes) {
        const near = projectOnRoute(route, point, 0);
        if (!near || near.gap > radius || (best && near.gap >= best.near)) continue;
        const hit = projectOnRoute(route, point, spec.width);
        if (hit) best = { pipe: ctx.shapeById(pipeId), hit, near: near.gap };
      }
      const corner = spec.junction ? valveCorner(point, ctx.pipeRoutes, Math.max(10, 14 / ctx.viewport.zoom), type, orientAngle) : null;
      if (corner && !ctx.shapeById(corner.pipeId)?.locked) {
        return { kind: "fitting", type, pipe: ctx.shapeById(corner.pipeId), fitting: { type, t: corner.t, flip: corner.flip, leg: corner.leg }, pose: corner.pose, valid: true };
      }
      if (!best || best.pipe.locked) return { kind: "fitting", type, pipe: null, pose: { x: point.x, y: point.y, rotation: 0 }, valid: false };
      return {
        kind: "fitting",
        type,
        pipe: best.pipe,
        fitting: { type, t: ctx.round4(best.hit.t), flip: false },
        pose: { x: best.hit.x, y: best.hit.y, rotation: orientAngle(type, best.hit.angle) },
        valid: true
      };
    }
    const rotation = ctx.placing?.rotation ?? 0;
    const size = footprint(spec.width, spec.height, rotation);
    const element = {
      type,
      x: ctx.snapValue(point.x, ctx.boardWidth) - size.width / 2,
      y: ctx.snapValue(point.y, ctx.boardHeight) - size.height / 2,
      width: size.width,
      height: size.height
    };
    if (spec.electric) {
      element.x = ctx.snapValue(point.x - size.width / 2, ctx.boardWidth);
      element.y = ctx.snapValue(point.y - size.height / 2, ctx.boardHeight);
      element.params = electricDefaults(type);
      Object.assign(element, electricSize(type, element.params));
      return { kind: "equipment", element, valid: true };
    }
    if (rotation) element.rotation = rotation;
    if (spec.bar) element.medium = ctx.pipeMedium;
    if (spec.branch) {
      element.params = branchDefaults();
      let aligned = { ...alignBranch(element, (value) => ctx.snapValue(value, ctx.boardWidth)), id: -1 };
      let ghostId = -1;
      let pipes = createBranch(aligned, () => --ghostId);
      const shift = snapBranch(legEndsOf(pipes), ctx.shapes, ctx.snapRadius);
      if (shift) {
        aligned = { ...aligned, y: aligned.y + shift };
        ghostId = -1;
        pipes = createBranch(aligned, () => --ghostId);
      }
      const { id, ...placed } = aligned;
      return { kind: "equipment", element: placed, pipes, valid: true };
    }
    return { kind: "equipment", element, valid: true };
  }

  function meterNameAnchor(fitting, hostId, across){
    const self = fittingPose(ctx.pipeRoutes.get(hostId), fitting);
    const other = fittingPose(ctx.pipeRoutes.get(across.pipeId), { type: "meterSensor", t: across.t });
    const box = fittingBox(ctx.pipeRoutes.get(hostId), fitting);
    if (Math.abs(other.x - self.x) >= 1) return { side: other.x > self.x ? "right" : "left", gap: 6, shift: -Math.round(box.height / 2 + 12) };
    return { side: other.y > self.y ? "bottom" : "top", gap: 4, shift: -Math.round(box.width / 2 + textWidth(fitting.name, 13) / 2 + 8) };
  }

  function legEndsOf(pipes){
    const ends = {};
    for (const pipe of pipes) {
      if (pipe.role === "supply") ends.supply = pipe.from;
      if (pipe.role === "return") ends.return = pipe.to;
    }
    return ends;
  }

  function placeHydronic(target, keep){
    const id = ctx.nextId++;
    if (target.kind === "equipment") {
      const element = { id, kind: "equipment", ...target.element, name: isElectricType(target.element.type) ? nextElectricName(target.element.type, ctx.shapes) : HYDRONIC_ELEMENTS[target.element.type]?.nameless ? "" : nextElementName(target.element.type, ctx.shapes) };
      ctx.shapes.push(element);
      if (isBranch(element)) ctx.shapes.push(...createBranch(element, () => ctx.nextId++));
    }
    else ctx.placeFitting(id, target);
    if (keep) return;
    ctx.pickTool("select");
    ctx.selectedId = null;
    ctx.clearSubSelection();
    if (target.kind === "equipment") ctx.selectShape(id);
    else ctx.selectedFitting = { pipeId: target.pipe.id, fittingId: id };
  }

  function commitElementRename(value){
    const element = ctx.renamingElement;
    ctx.renamingElementId = null;
    if (!element) return;
    element.name = value.trim();
  }

  return { selectedElements, setElementSize, toggleTankProbe, setNameSize, beginElementScale, beginBarScale, keepBarEnds, centred, resetElementSize, centreFor, rotateElements, hydronicPlacement, meterNameAnchor, legEndsOf, placeHydronic, commitElementRename };
}
