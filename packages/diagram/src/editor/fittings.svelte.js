import { copyFittings, pasteTargets } from "../fittingPaste.js";
import { nextFittingName, fittingLabel } from "../fittingLabel.js";
import { readoutSpec, meterOptions, meterReadouts, readoutScaleOf, readoutExtent, readoutRows } from "../readout.js";
import { elementBox, elementLabel, textWidth, labelCentre, nameAnchorAt } from "../label.js";
import { fittingBox, fittingTargets } from "../fittingAlign.js";
import { dragPointer, unionBox } from "@pathfinder/core/tools/move.js";
import { HYDRONIC_ELEMENTS } from "../elements.js";
import { contains, alignOffsets, distributeOffsets } from "@pathfinder/core/tools/align.js";
import { fittingPose, orientAngle } from "../geometry.js";
import { projectOnRoute, cornerLegs, routePoint } from "../route.js";
import { valveCorner, cornerFlip } from "../valvePorts.js";
import { placeSensors } from "../meter.js";

export function createFittings(ctx){
  function copyFittingSelection(event){
    if (!ctx.fittingGroup.length || ctx.selectionIds.length) return false;
    ctx.clipboardFittings = copyFittings(ctx.fittingGroup.map(({ pipe, fitting }) => ({ pipe, fitting: $state.snapshot(fitting) })), ctx.pipeRoutes);
    ctx.clipboardShapes = null;
    ctx.clipboardFurniture = null;
    ctx.clipboardToken = `${Date.now()}`;
    ctx.pasteCount = 0;
    event.clipboardData?.setData("text/plain", ctx.CLIPBOARD_PREFIX + ctx.clipboardToken);
    event.preventDefault();
    return true;
  }

  function pasteFittings(){
    ctx.pasteCount += 1;
    const byId = new Map(ctx.shapes.map((shape) => [shape.id, shape]));
    const targets = pasteTargets(ctx.clipboardFittings, {
      routes: ctx.pipeRoutes,
      isOpen: (id) => byId.get(id)?.kind === "pipe" && !byId.get(id).locked,
      pointer: ctx.pointer,
      radius: Math.max(24, 30 / ctx.viewport.zoom),
      count: ctx.pasteCount
    });
    const placed = [];
    const renamed = new Map(ctx.clipboardFittings.map((item) => [item.fitting.id, ctx.nextId++]));
    ctx.clipboardFittings.forEach((item, index) => {
      const target = targets[index];
      const host = target ? byId.get(target.pipeId) : null;
      if (!host) return;
      const id = renamed.get(item.fitting.id);
      const { meterOf, ...copy } = structuredClone(item.fitting);
      const name = item.fitting.name === "" ? "" : nextFittingName(item.fitting.type, ctx.shapes);
      host.fittings = [...(host.fittings ?? []), { ...copy, id, t: target.t, name, ...(renamed.has(meterOf) ? { meterOf: renamed.get(meterOf) } : {}) }];
      placed.push({ pipeId: host.id, fittingId: id });
    });
    if (!placed.length) return;
    if (ctx.tool !== "select") ctx.pickTool("select");
    ctx.selectedId = null;
    ctx.clearSubSelection();
    ctx.selectedFitting = placed[placed.length - 1];
    ctx.extraFittings = placed.slice(0, -1);
  }

  function setFittingReadout(value){
    if (!ctx.activeFitting) return;
    for (const { fitting } of ctx.fittingGroup) {
      if (!readoutSpec(fitting.type) || meterOptions(fitting.type).length) continue;
      fitting.readout = value;
      if (value === "none") delete fitting.readoutOffset;
    }
  }

  function keepReadoutGap(offset, before, after){
    const shift = (value, from, to) => Math.abs(value) >= from / 2 ? value + Math.sign(value) * (to - from) / 2 : value;
    return { x: Math.round(shift(offset.x, before.width, after.width)), y: Math.round(shift(offset.y, before.height, after.height)) };
  }

  function setMeterReadout(id){
    const meters = ctx.fittingGroup.filter(({ fitting }) => meterOptions(fitting.type).some((option) => option.id === id));
    if (!meters.length) return;
    const on = !meters.every(({ fitting }) => meterReadouts(fitting).includes(id));
    for (const { fitting } of meters) {
      const scale = readoutScaleOf(fitting);
      const before = readoutExtent(readoutRows(fitting), scale);
      const kept = meterReadouts(fitting).filter((entry) => entry !== id);
      fitting.readouts = meterOptions(fitting.type).map((option) => option.id).filter((entry) => kept.includes(entry) || (on && entry === id));
      fitting.readout = fitting.readouts.length ? "value" : "none";
      const after = readoutExtent(readoutRows(fitting), scale);
      if (fitting.readoutOffset && after.height && before.height) fitting.readoutOffset = keepReadoutGap(fitting.readoutOffset, before, after);
    }
  }

  function resetReadoutPosition(){
    for (const { fitting } of ctx.fittingGroup) delete fitting.readoutOffset;
  }

  function beginNameDrag(event, owner, fittingId){
    const target = fittingId === null ? owner : owner.fittings?.find((entry) => entry.id === fittingId);
    if (!target) return;
    const frame = () => fittingId === null ? elementBox(owner) : fittingBox(ctx.pipeRoutes.get(owner.id), target);
    const label = fittingId === null ? elementLabel(owner) : fittingLabel(ctx.pipeRoutes.get(owner.id), target, ctx.fittingNames.get(target.id));
    const width = event.target instanceof SVGGraphicsElement ? event.target.getBBox().width : textWidth(target.name, label.size);
    if (fittingId === null) {
      if (!ctx.selectionIds.includes(owner.id)) ctx.selectShape(owner.id);
    } else {
      ctx.selectedId = null;
      ctx.clearSubSelection();
      ctx.selectedFitting = { pipeId: owner.id, fittingId };
    }
    const start = ctx.toCanvas(event);
    if (!start) return;
    const origin = labelCentre(label, width);
    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const point = ctx.toCanvas(next);
        if (!point) return;
        delete target.nameOffset;
        target.nameAnchor = nameAnchorAt(frame(), { x: origin.x + point.x - start.x, y: origin.y + point.y - start.y }, width, label.height);
      },
      onend: () => ctx.history.endGesture()
    });
  }

  function setFittingName(value){
    const entry = ctx.activeFitting;
    if (!entry) return;
    entry.fitting.name = value.trim();
  }

  function setReadoutScale(value){
    ctx.editKey = "readoutScale";
    for (const { fitting } of ctx.fittingGroup) if (readoutSpec(fitting.type)) fitting.readoutScale = value;
  }

  function beginReadoutDrag(event, pipe, fittingId){
    ctx.selectedId = null;
    ctx.clearSubSelection();
    ctx.selectedFitting = { pipeId: pipe.id, fittingId };
    const fitting = pipe.fittings?.find((entry) => entry.id === fittingId);
    const box = ctx.readoutBoxes.get(fittingId);
    const start = ctx.toCanvas(event);
    if (!fitting || !box || !start) return;
    const origin = { x: box.x + box.width / 2 - box.pose.x, y: box.y + box.height / 2 - box.pose.y };

    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const point = ctx.toCanvas(next);
        if (!point) return;
        fitting.readoutOffset = { x: Math.round(origin.x + point.x - start.x), y: Math.round(origin.y + point.y - start.y) };
      },
      onend: () => ctx.history.endGesture()
    });
  }

  function setFittingScale(value){
    if (!ctx.activeFitting) return;
    ctx.editKey = "fittingScale";
    for (const { fitting } of ctx.fittingGroup) fitting.scale = value;
  }

  function setFittingNameSize(value){
    ctx.editKey = "fitting-name-size";
    for (const { fitting } of ctx.fittingGroup) fitting.nameSize = value;
  }

  function sameFitting(a, b){
    return a.pipeId === b.pipeId && a.fittingId === b.fittingId;
  }

  function fittingsIn(box){
    const keys = [];
    for (const pipe of ctx.shapes) {
      if (pipe.kind !== "pipe" || pipe.locked) continue;
      const route = ctx.pipeRoutes.get(pipe.id);
      if (!route) continue;
      for (const fitting of pipe.fittings ?? []) if (HYDRONIC_ELEMENTS[fitting.type] && contains(box, fittingBox(route, fitting))) keys.push({ pipeId: pipe.id, fittingId: fitting.id });
    }
    return keys;
  }

  function beginFittingDrag(event, pipe, fittingId){
    const key = { pipeId: pipe.id, fittingId };
    const current = ctx.fittingGroup.map((entry) => ({ pipeId: entry.pipe.id, fittingId: entry.fitting.id }));
    const inside = current.some((entry) => sameFitting(entry, key));
    if (event.ctrlKey || event.metaKey || event.shiftKey) {
      const next = inside ? current.filter((entry) => !sameFitting(entry, key)) : [...current, key];
      ctx.clearShapeSubSelection();
      ctx.selectedFitting = null;
      ctx.extraFittings = [];
      if (next.length) {
        ctx.selectedFitting = next[next.length - 1];
        ctx.extraFittings = next.slice(0, -1);
      }
      return;
    }
    if (inside && (current.length > 1 || ctx.selectionIds.length > 0)) {
      beginFittingGroupDrag(event, key, current.filter((entry) => !sameFitting(entry, key)));
      return;
    }
    beginFittingSingleDrag(event, pipe, fittingId);
  }

  function beginFittingGroupDrag(event, key, rest){
    ctx.clearShapeSubSelection();
    ctx.selectedFitting = key;
    ctx.extraFittings = rest;
    const members = [key, ...rest].map((entry) => {
      const host = ctx.shapeById(entry.pipeId);
      const fitting = host?.fittings?.find((item) => item.id === entry.fittingId);
      const route = ctx.pipeRoutes.get(entry.pipeId);
      if (!host || !fitting || !route) return null;
      return { host, fitting, start: fittingPose(route, fitting), size: (HYDRONIC_ELEMENTS[fitting.type]?.width ?? 0) * (fitting.scale ?? 1) };
    }).filter(Boolean);
    const origin = ctx.toCanvas(event);
    if (!origin || !members.length) return;

    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const point = ctx.toCanvas(next);
        if (!point) return;
        for (const member of members) {
          const route = ctx.pipeRoutes.get(member.host.id);
          if (!route) continue;
          const hit = projectOnRoute(route, { x: member.start.x + point.x - origin.x, y: member.start.y + point.y - origin.y }, member.size);
          if (hit) member.fitting.t = ctx.round4(hit.t);
        }
      },
      onend: () => ctx.history.endGesture()
    });
  }

  function alignFittings(mode){
    const members = ctx.fittingGroup.map(({ pipe, fitting }) => ({ route: ctx.pipeRoutes.get(pipe.id), fitting })).filter((member) => member.route);
    const boxes = members.map((member) => fittingBox(member.route, member.fitting));
    applyFittingTargets(members, fittingTargets(members, alignOffsets(boxes, mode, unionBox(boxes))));
  }

  function distributeFittings(axis){
    const members = ctx.fittingGroup.map(({ pipe, fitting }) => ({ route: ctx.pipeRoutes.get(pipe.id), fitting })).filter((member) => member.route);
    const boxes = members.map((member) => fittingBox(member.route, member.fitting));
    applyFittingTargets(members, fittingTargets(members, distributeOffsets(boxes, axis)));
  }

  function applyFittingTargets(members, targets){
    members.forEach((member, index) => {
      if (targets[index] !== null) member.fitting.t = targets[index];
    });
  }

  function beginFittingSingleDrag(event, pipe, fittingId){
    ctx.selectedId = null;
    ctx.clearSubSelection();
    ctx.selectedFitting = { pipeId: pipe.id, fittingId };
    let fitting = pipe.fittings?.find((entry) => entry.id === fittingId);
    if (!fitting) return;
    const size = (HYDRONIC_ELEMENTS[fitting.type]?.width ?? 0) * (fitting.scale ?? 1);
    const roaming = fitting.meterOf !== undefined;
    let host = pipe;

    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const point = ctx.toCanvas(next);
        if (!point) return;
        if (roaming) {
          const jump = ctx.nearestHydronicPipe(point, size);
          if (jump && jump.pipe !== host) {
            const moved = { ...$state.snapshot(fitting), t: ctx.round4(jump.hit.t) };
            host.fittings = host.fittings.filter((entry) => entry.id !== moved.id);
            jump.pipe.fittings = [...(jump.pipe.fittings ?? []), moved];
            host = jump.pipe;
            fitting = host.fittings.find((entry) => entry.id === moved.id);
            ctx.selectedFitting = { pipeId: host.id, fittingId };
            return;
          }
        }
        const route = ctx.pipeRoutes.get(host.id);
        if (!route) return;
        const corner = HYDRONIC_ELEMENTS[fitting.type]?.junction
          ? valveCorner(point, new Map([[host.id, route]]), Math.max(10, 14 / ctx.viewport.zoom), fitting.type, orientAngle, fitting.leg ?? "before")
          : null;
        if (corner) {
          Object.assign(fitting, { t: corner.t, flip: corner.flip, leg: corner.leg });
          return;
        }
        const hit = projectOnRoute(route, point, size);
        if (!hit) return;
        fitting.t = ctx.round4(hit.t);
        delete fitting.leg;
      },
      onend: () => ctx.history.endGesture()
    });
  }

  function turnFitting(){
    for (const { pipe, fitting } of ctx.turnable) {
      const route = ctx.pipeRoutes.get(pipe.id);
      const legs = cornerLegs(route, routePoint(route, fitting.t));
      const leg = fitting.leg === "after" ? "before" : "after";
      const flip = cornerFlip(fitting.type, legs, leg, orientAngle);
      if (flip === undefined) continue;
      Object.assign(fitting, { leg, flip });
    }
  }

  function flipFitting(){
    const corners = new Set(ctx.turnable.map(({ fitting }) => fitting.id));
    for (const { fitting } of ctx.fittingGroup) if (HYDRONIC_ELEMENTS[fitting.type]?.orient !== "upright" && !corners.has(fitting.id)) fitting.flip = !fitting.flip;
  }

  function removeFitting(){
    if (!ctx.activeFitting) return;
    const gone = new Set(ctx.fittingGroup.map(({ fitting }) => fitting.id));
    for (const shape of ctx.shapes) {
      if (shape.kind !== "pipe" || !(shape.fittings ?? []).some((entry) => gone.has(entry.id) || gone.has(entry.meterOf))) continue;
      shape.fittings = shape.fittings.filter((entry) => !gone.has(entry.id) && !gone.has(entry.meterOf));
    }
    ctx.selectedFitting = null;
    ctx.extraFittings = [];
  }

  function placeFitting(id, target){
    const spec = HYDRONIC_ELEMENTS[target.fitting.type];
    const fitting = { id, ...target.fitting, name: nextFittingName(target.fitting.type, ctx.shapes) };
    if (spec.measures) Object.assign(fitting, { readout: "value", readouts: [spec.measures[0]] });
    const entries = spec.sensors ? [...ctx.pipeRoutes].map(([pipeId, route]) => ({ pipe: ctx.shapeById(pipeId), route })).filter((entry) => entry.pipe) : [];
    const spots = spec.sensors ? placeSensors(entries, target.pipe.id, fitting) : [];
    const across = spots.find((spot) => spot.pipeId !== target.pipe.id);
    if (across) fitting.nameAnchor = ctx.meterNameAnchor(fitting, target.pipe.id, across);
    target.pipe.fittings = [...(target.pipe.fittings ?? []), fitting];
    if (spec.junction) joinValve(target.pipe, fitting);
    for (const spot of spots) {
      const host = ctx.shapeById(spot.pipeId);
      host.fittings = [...(host.fittings ?? []), { id: ctx.nextId++, type: "meterSensor", t: spot.t, name: "", meterOf: id }];
    }
  }

  function joinValve(host, fitting){
    const route = ctx.pipeRoutes.get(host.id);
    if (!route) return;
    const spot = fittingPose(route, fitting);
    for (const shape of ctx.shapes) {
      if (shape.kind !== "pipe" || shape.id === host.id) continue;
      for (const key of ["from", "to"]) {
        const end = shape[key];
        if (end?.pipe !== host.id || end.fitting !== undefined || Math.hypot(end.x - spot.x, end.y - spot.y) > 1) continue;
        shape[key] = { pipe: host.id, x: spot.x, y: spot.y, fitting: fitting.id };
      }
    }
  }

  function commitFittingRename(value){
    const entry = ctx.renamingFittingEntry;
    ctx.renamingFitting = null;
    if (!entry) return;
    entry.fitting.name = value.trim();
  }

  return { copyFittingSelection, pasteFittings, setFittingReadout, keepReadoutGap, setMeterReadout, resetReadoutPosition, beginNameDrag, setFittingName, setReadoutScale, beginReadoutDrag, setFittingScale, setFittingNameSize, sameFitting, fittingsIn, beginFittingDrag, beginFittingGroupDrag, alignFittings, distributeFittings, applyFittingTargets, beginFittingSingleDrag, turnFitting, flipFitting, removeFitting, placeFitting, joinValve, commitFittingRename };
}
