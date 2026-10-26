import { branchPipeIds, isBranch } from "$lib/diagram/branch.js";
import { shapeBox, unionBox, translateShape } from "$lib/core/tools/move.js";
import { layerOf } from "$lib/diagram/scene.js";
import { pruneDangling } from "$lib/diagram/route.js";
import { polygonSelfIntersects } from "$lib/core/tools/polygon.js";
import { outlinePoints } from "$lib/core/tools/path.js";
import { alignOffsets, distributeOffsets } from "$lib/core/tools/align.js";
import { fittingBox, fittingTargets } from "$lib/diagram/fittingAlign.js";

export function createSelection(ctx){
  function shapeById(id){
    return ctx.shapes.find((shape) => shape.id === id);
  }

  function sameKey(a, b){
    return a.id === b.id && a.index === b.index;
  }

  function toggleKey(list, key){
    return list.some((entry) => sameKey(entry, key)) ? list.filter((entry) => !sameKey(entry, key)) : [...list, key];
  }

  function clearSubSelection(){
    ctx.selectedPoints = [];
    ctx.selectedEdges = [];
    ctx.selectedParts = [];
    ctx.selectedFitting = null;
    ctx.extraFittings = [];
  }

  function clearShapeSubSelection(){
    ctx.selectedPoints = [];
    ctx.selectedEdges = [];
    ctx.selectedParts = [];
  }

  function withGroups(ids){
    const groups = new Set(ids.map((id) => shapeById(id)?.groupId).filter(Boolean));
    const members = ctx.shapes.filter((shape) => groups.has(shape.groupId) && !shape.locked).map((shape) => shape.id);
    return [...new Set([...ids, ...members])];
  }

  function selectShape(id, additive = false, deep = false){
    const members = deep ? [id] : withGroups([id]);
    ctx.selectedParts = [];
    if (!additive) {
      ctx.selectedIds = members;
      ctx.selectedId = id;
      clearSubSelection();
      return true;
    }
    if (ctx.selectionIds.includes(id)) {
      ctx.selectedIds = ctx.selectionIds.filter((entry) => !members.includes(entry));
      ctx.selectedId = ctx.selectedIds[ctx.selectedIds.length - 1] ?? null;
      return false;
    }
    ctx.selectedIds = [...ctx.selectionIds, ...members.filter((entry) => !ctx.selectionIds.includes(entry))];
    ctx.selectedId = id;
    return true;
  }

  function selectionUnits(){
    const units = new Map();
    for (const shape of ctx.selectedShapes) {
      const grouped = shape.groupId && ctx.selectedShapes.filter((entry) => entry.groupId === shape.groupId).length > 1;
      const key = grouped ? `g${shape.groupId}` : `s${shape.id}`;
      if (!units.has(key)) units.set(key, []);
      units.get(key).push(shape);
    }
    const chosen = new Set(ctx.selectionIds);
    return [...units.values()].map((members) => {
      const owned = branchPipeIds(ctx.shapes, members.filter(isBranch).map((shape) => shape.id)).filter((id) => !chosen.has(id)).map(shapeById);
      return owned.length ? [...members, ...owned] : members;
    });
  }

  function memberBox(shape){
    return shape.kind === "pipe" ? ctx.routeBox(shape) : shapeBox(shape);
  }

  function unitBox(members){
    const boxes = members.map(memberBox).filter(Boolean);
    return boxes.length ? unionBox(boxes) : shapeBox(members[0]);
  }

  function groupSelection(){
    if (selectionUnits().length < 2) return;
    const groupId = ctx.nextId++;
    for (const shape of ctx.selectedShapes) shape.groupId = groupId;
  }

  function ungroupSelection(){
    for (const shape of ctx.selectedShapes) delete shape.groupId;
    const counts = new Map();
    for (const shape of ctx.shapes) if (shape.groupId) counts.set(shape.groupId, (counts.get(shape.groupId) ?? 0) + 1);
    for (const shape of ctx.shapes) if (shape.groupId && counts.get(shape.groupId) < 2) delete shape.groupId;
  }

  function selectAll(){
    if (ctx.shapes.length === 0) return;
    ctx.selectedIds = ctx.shapes.filter((shape) => !shape.locked).map((shape) => shape.id);
    ctx.selectedId = ctx.selectedIds[ctx.selectedIds.length - 1] ?? null;
    clearSubSelection();
    const fittings = ctx.shapes.filter((shape) => shape.kind === "pipe" && !shape.locked)
      .flatMap((pipe) => (pipe.fittings ?? []).map((fitting) => ({ pipeId: pipe.id, fittingId: fitting.id })));
    if (fittings.length) {
      ctx.selectedFitting = fittings[fittings.length - 1];
      ctx.extraFittings = fittings.slice(0, -1);
    }
  }

  function commonValue(list){
    return list.length && list.every((value) => value === list[0]) ? list[0] : null;
  }

  function moveInList(list, picked, mode){
    if (mode === "front") return [...list.filter((entry) => !picked(entry)), ...list.filter(picked)];
    if (mode === "back") return [...list.filter(picked), ...list.filter((entry) => !picked(entry))];
    const next = [...list];
    if (mode === "forward") {
      for (let index = next.length - 2; index >= 0; index -= 1) {
        if (picked(next[index]) && !picked(next[index + 1])) [next[index], next[index + 1]] = [next[index + 1], next[index]];
      }
    } else {
      for (let index = 1; index < next.length; index += 1) {
        if (picked(next[index]) && !picked(next[index - 1])) [next[index], next[index - 1]] = [next[index - 1], next[index]];
      }
    }
    return next;
  }

  function reorderSelection(mode){
    if (ctx.partGroup.length) {
      const keys = new Set(ctx.partGroup.map((part) => `${part.kind}:${part.roomId}:${part.id}`));
      for (const room of new Set(ctx.partGroup.map((part) => part.room))) {
        if (room.furniture) room.furniture = moveInList(room.furniture, (item) => keys.has(`furniture:${room.id}:${item.id}`), mode);
        if (room.doors) room.doors = moveInList(room.doors, (door) => keys.has(`door:${room.id}:${door.id}`), mode);
      }
      return;
    }
    stackSelection(mode);
    const ids = new Set(ctx.selectionIds);
    ctx.shapes = moveInList(ctx.shapes, (shape) => ids.has(shape.id), mode);
  }

  function stackSelection(mode){
    const byId = new Map(ctx.shapes.map((shape) => [shape.id, shape]));
    const layered = (shape) => shape?.kind === "equipment" || shape?.kind === "pipe";
    const owner = (shape) => shape.kind === "pipe" && shape.branchOf !== undefined ? byId.get(shape.branchOf) ?? shape : shape;
    const targets = [...new Set(ctx.selectedShapes.filter(layered).map(owner))];
    if (!targets.length) return;
    const others = ctx.shapes.filter((shape) => layered(shape) && shape.branchOf === undefined && !targets.includes(shape)).map((shape) => layerOf(shape, byId));
    const top = Math.max(0, ...others);
    const bottom = Math.min(0, ...others);
    for (const shape of targets) {
      const z = layerOf(shape, byId);
      const next = mode === "front" ? top + 1 : mode === "back" ? bottom - 1 : mode === "forward" ? z + 1 : z - 1;
      if (next) shape.z = next;
      else delete shape.z;
    }
  }

  function openArrange(event){
    event.preventDefault();
    ctx.draft = null;
    ctx.pipeDraft = null;
    if (ctx.tool !== "select") return;
    const node = event.target.closest?.("[data-shape-id]");
    const fittingId = node?.dataset.fittingId ?? node?.dataset.readoutId;
    if (fittingId !== undefined) {
      if (ctx.fittingGroup.length < 2 || !ctx.fittingGroup.some((entry) => entry.fitting.id === Number(fittingId))) return;
      ctx.arrangeMenu = { x: event.clientX, y: event.clientY, mode: "fittings" };
      return;
    }
    const id = node && !ctx.partGroup.length ? Number(node.dataset.shapeId) : null;
    if (id !== null && !ctx.selectionIds.includes(id)) selectShape(id);
    if (!ctx.selectionIds.length && !ctx.partGroup.length) return;
    ctx.arrangeMenu = { x: event.clientX, y: event.clientY, mode: ctx.selectionIds.length ? "shapes" : "parts" };
  }

  function deleteSelection(){
    const ids = ctx.selectionIds;
    ctx.shapes = ctx.shapes.filter((shape) => !ids.includes(shape.id));
    ctx.shapes = pruneDangling(ctx.shapes);
    ctx.selectedId = null;
    clearSubSelection();
  }

  function movePointsTo(group, positions){
    const byShape = new Map();
    group.forEach((entry, index) => {
      if (!byShape.has(entry.shape)) byShape.set(entry.shape, entry.shape.points.map((point) => ({ x: point.x, y: point.y })));
      byShape.get(entry.shape)[entry.index] = { x: ctx.round2(positions[index].x), y: ctx.round2(positions[index].y) };
    });
    for (const [shape, points] of byShape) {
      if (shape.kind !== "curve" && !shape.open && polygonSelfIntersects(outlinePoints({ ...shape, points }))) return;
    }
    for (const [shape, points] of byShape) shape.points = points;
  }

  function moveShapesBy(group, offsets){
    const moving = new Set(group.map((shape) => shape.id));
    group.forEach((shape, index) => {
      const { dx, dy } = offsets[index];
      if (dx === 0 && dy === 0) return;
      Object.assign(shape, translateShape($state.snapshot(shape), ctx.round2(dx), ctx.round2(dy), moving));
    });
  }

  function pointBoxes(group){
    return group.map((entry) => ({ x: entry.original.x, y: entry.original.y, width: 0, height: 0 }));
  }

  function shiftPoints(group, offsets){
    movePointsTo(group, group.map((entry, index) => ({ x: entry.original.x + offsets[index].dx, y: entry.original.y + offsets[index].dy })));
  }

  function alignSelection(mode){
    if (ctx.partGroup.length >= 1) {
      ctx.alignParts(mode);
      return;
    }
    if (ctx.fittingGroup.length && ctx.selectionIds.length) {
      alignMixed(mode);
      return;
    }
    if (ctx.fittingGroup.length >= 2) {
      ctx.alignFittings(mode);
      return;
    }
    const points = ctx.pointGroup();
    if (points.length >= 2) {
      const boxes = pointBoxes(points);
      shiftPoints(points, alignOffsets(boxes, mode, unionBox(boxes)));
      return;
    }
    const units = selectionUnits();
    if (units.length === 0) return;
    const boxes = units.map((members) => unitBox(members));
    const frame = units.length === 1 ? { x: 0, y: 0, width: ctx.boardWidth, height: ctx.boardHeight } : unionBox(boxes);
    moveUnitsBy(units, alignOffsets(boxes, mode, frame));
  }

  function moveUnitsBy(units, offsets){
    units.forEach((members, index) => moveShapesBy(members, members.map(() => offsets[index])));
  }

  function mixedMembers(){
    const members = ctx.fittingGroup.map(({ pipe, fitting }) => ({ route: ctx.pipeRoutes.get(pipe.id), fitting })).filter((member) => member.route);
    const units = selectionUnits();
    const boxes = [...units.map((list) => unitBox(list)), ...members.map((member) => fittingBox(member.route, member.fitting))];
    return { members, units, boxes };
  }

  function applyMixed({ members, units }, offsets){
    const targets = fittingTargets(members, offsets.slice(units.length));
    moveUnitsBy(units, offsets.slice(0, units.length));
    ctx.applyFittingTargets(members, targets);
  }

  function alignMixed(mode){
    const group = mixedMembers();
    if (group.boxes.length < 2) return;
    applyMixed(group, alignOffsets(group.boxes, mode, unionBox(group.boxes)));
  }

  function distributeMixed(axis){
    const group = mixedMembers();
    if (group.boxes.length < 3) return;
    applyMixed(group, distributeOffsets(group.boxes, axis));
  }

  function distributeSelection(axis){
    if (ctx.partGroup.length >= 3) {
      ctx.distributeParts(axis);
      return;
    }
    if (ctx.fittingGroup.length && ctx.selectionIds.length) {
      distributeMixed(axis);
      return;
    }
    if (ctx.fittingGroup.length >= 3) {
      ctx.distributeFittings(axis);
      return;
    }
    const points = ctx.pointGroup();
    if (points.length >= 3) {
      shiftPoints(points, distributeOffsets(pointBoxes(points), axis));
      return;
    }
    const units = selectionUnits();
    if (points.length >= 2 || units.length < 3) return;
    moveUnitsBy(units, distributeOffsets(units.map((members) => unitBox(members)), axis));
  }

  function lockSelection(){
    for (const shape of ctx.selectedShapes) shape.locked = true;
    ctx.selectedId = null;
    clearSubSelection();
  }

  function pickTool(next){
    ctx.tool = next;
    ctx.draft = null;
    ctx.pipeDraft = null;
    if (next !== "select") ctx.selectedId = null;
  }

  function deleteSelected(){
    if (ctx.activeFitting) {
      const mixed = ctx.selectionIds.length > 0;
      ctx.removeFitting();
      if (mixed) deleteSelection();
      return;
    }
    if (ctx.selectionIds.length > 1) deleteSelection();
    else if (ctx.selectedId !== null) removeShape(ctx.selectedId);
  }

  function removeShape(id){
    ctx.shapes = ctx.shapes.filter((shape) => shape.id !== id);
    ctx.shapes = pruneDangling(ctx.shapes);
    if (ctx.selectedId === id) ctx.selectedId = null;
  }

  return { shapeById, sameKey, toggleKey, clearSubSelection, clearShapeSubSelection, withGroups, selectShape, selectionUnits, memberBox, unitBox, groupSelection, ungroupSelection, selectAll, commonValue, moveInList, reorderSelection, stackSelection, openArrange, deleteSelection, movePointsTo, moveShapesBy, pointBoxes, shiftPoints, alignSelection, moveUnitsBy, mixedMembers, applyMixed, alignMixed, distributeMixed, distributeSelection, lockSelection, pickTool, deleteSelected, removeShape };
}
