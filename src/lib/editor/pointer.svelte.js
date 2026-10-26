import { isRoomTool } from "@pathfinder/floorplan/rooms.js";
import { isBranch, branchPipeIds, branchLegEnds, snapBranch } from "@pathfinder/diagram/branch.js";
import { isDeviceType, HYDRONIC_ELEMENTS, mediumOf, isElectricType } from "@pathfinder/diagram/elements.js";
import { hasNameLabel } from "@pathfinder/diagram/label.js";
import { ridingPipes, isFreeEnd, dockPort } from "@pathfinder/diagram/route.js";
import { shapeBox, unionBox, dragPointer, clampDelta, translateShape } from "@pathfinder/core/tools/move.js";
import { contains } from "@pathfinder/core/tools/align.js";

export function createPointer(ctx){
  function handleMove(event){
    ctx.pointer = ctx.toCanvas(event);
    if (!ctx.drawing) return;
    const raw = ctx.toCanvas(event);
    ctx.aim = raw;
    if (raw) ctx.cursor = ctx.snapPoint(raw);
    if (raw && isRoomTool(ctx.tool)) ctx.cursor = ctx.roomPoint(raw, event);
    if (raw && ctx.tool === "curve") ctx.cursor = ctx.roomPoint(raw, event);
  }

  function handleLeave(){
    ctx.cursor = null;
    ctx.pointer = null;
  }

  function handleDown(event){
    if (event.button !== 0) return;

    if (!ctx.drawing) {
      if (ctx.tool === "select" && beginMove(event)) return;
      if (ctx.tool === "select" && beginMarquee(event)) return;
      ctx.branchEditing = false;
      ctx.selectedId = null;
      return;
    }

    const raw = ctx.toCanvas(event);
    if (!raw) return;
    const point = ctx.snapPoint(raw);
    ctx.cursor = point;

    if (ctx.tool === "text") {
      ctx.placeText(point);
      return;
    }

    if (ctx.tool === "place") {
      ctx.placeElement(event);
      return;
    }

    if (ctx.tool === "pipe") {
      ctx.pipeClick(event);
      return;
    }

    if (isRoomTool(ctx.tool)) {
      ctx.roomClick(ctx.roomPoint(raw, event));
      return;
    }

    if (ctx.tool === "curve") {
      ctx.penDown(event, ctx.roomPoint(raw, event));
      return;
    }

    if (!ctx.draft) {
      ctx.draft = { kind: ctx.tool, start: point };
      return;
    }

    commit(point);
  }

  function commit(point){
    if (ctx.draft.kind === "line") {
      if (point.x === ctx.draft.start.x && point.y === ctx.draft.start.y) {
        ctx.draft = null;
        return;
      }
      ctx.shapes.push({ id: ctx.nextId++, kind: "line", points: ctx.manhattan(ctx.draft.start, point, ctx.elbow) });
    } else {
      const box = ctx.rectBetween(ctx.draft.start, point);
      if (box.width === 0 || box.height === 0) {
        ctx.draft = null;
        return;
      }
      ctx.shapes.push({ id: ctx.nextId++, kind: "rect", ...box });
    }
    ctx.draft = null;
  }

  let lastPress = { id: null, time: 0 };

  let lastFittingPress = { key: null, time: 0 };

  function beginMove(event){
    const handle = event.target instanceof Element ? event.target.closest("[data-transform]") : null;
    if (handle) {
      ctx.beginTransform(event, handle.dataset.transform);
      return true;
    }
    let target = event.target instanceof Element ? event.target.closest("[data-shape-id]") : null;
    let shape = target ? ctx.shapeById(Number(target.dataset.shapeId)) : null;
    if (!shape) return false;
    const additive = event.ctrlKey || event.metaKey;
    const owner = shape.kind === "pipe" && shape.branchOf !== undefined ? ctx.shapeById(shape.branchOf) : null;
    if (owner && !ctx.branchEditing) {
      shape = owner;
      target = { dataset: { shapeId: String(owner.id) } };
    }
    if (ctx.branchEditing && !isBranch(shape) && shape.branchOf === undefined) ctx.branchEditing = false;

    if (target.dataset.furnitureId !== undefined) {
      ctx.beginFurnitureDrag(event, shape, Number(target.dataset.furnitureId));
      return true;
    }
    if (target.dataset.readoutId !== undefined) {
      ctx.beginReadoutDrag(event, shape, Number(target.dataset.readoutId));
      return true;
    }
    if (target.dataset.fittingId !== undefined && !additive) {
      const key = `${shape.id}:${target.dataset.fittingId}`;
      const now = performance.now();
      if (lastFittingPress.key === key && now - lastFittingPress.time < 400) {
        lastFittingPress = { key: null, time: 0 };
        ctx.selectedId = null;
        ctx.clearSubSelection();
        ctx.selectedFitting = { pipeId: shape.id, fittingId: Number(target.dataset.fittingId) };
        ctx.renamingFitting = { pipeId: shape.id, fittingId: Number(target.dataset.fittingId) };
        return true;
      }
      lastFittingPress = { key, time: now };
    }
    if (target.dataset.fittingId !== undefined && target.dataset.fittingLabel !== undefined && !additive) {
      ctx.beginNameDrag(event, shape, Number(target.dataset.fittingId));
      return true;
    }
    if (target.dataset.fittingId !== undefined) {
      ctx.beginFittingDrag(event, shape, Number(target.dataset.fittingId));
      return true;
    }
    if (target.dataset.elementLabel !== undefined && !additive) {
      const now = performance.now();
      if (lastPress.id === shape.id && now - lastPress.time < 400) {
        lastPress = { id: null, time: 0 };
        ctx.selectShape(shape.id);
        ctx.renamingElementId = shape.id;
        return true;
      }
      lastPress = { id: shape.id, time: now };
      ctx.beginNameDrag(event, shape, null);
      return true;
    }
    if (target.dataset.waypointIndex !== undefined) {
      ctx.beginWaypointDrag(event, shape, Number(target.dataset.waypointIndex));
      return true;
    }
    if (target.dataset.pipeEnd) {
      ctx.beginPipeEndDrag(event, shape, target.dataset.pipeEnd);
      return true;
    }
    if (target.dataset.pipeVertex !== undefined) {
      ctx.beginPipeVertexDrag(event, shape, Number(target.dataset.pipeVertex));
      return true;
    }
    if (target.dataset.pipeEdge !== undefined) {
      ctx.beginPipeEdgeDrag(event, shape, Number(target.dataset.pipeEdge));
      return true;
    }
    if (target.dataset.roomLabel !== undefined) {
      ctx.beginRoomLabelDrag(event, shape);
      return true;
    }
    if (target.dataset.thermostat !== undefined) {
      ctx.beginThermostatDrag(event, shape);
      return true;
    }
    if (target.dataset.doorId !== undefined) {
      ctx.beginDoorDrag(event, shape, Number(target.dataset.doorId));
      return true;
    }
    if (target.dataset.handle) {
      ctx.beginHandleDrag(event, shape, Number(target.dataset.vertexIndex), target.dataset.handle);
      return true;
    }
    if (target.dataset.vertexIndex !== undefined) {
      ctx.beginPointDrag(event, shape, Number(target.dataset.vertexIndex), additive);
      return true;
    }
    if (target.dataset.edgeIndex !== undefined) {
      ctx.beginEdgeDrag(event, shape, Number(target.dataset.edgeIndex), additive);
      return true;
    }

    const now = performance.now();
    const repeated = !additive && lastPress.id === shape.id && now - lastPress.time < 400;
    lastPress = additive ? { id: null, time: 0 } : { id: shape.id, time: repeated ? 0 : now };
    if (repeated && shape.kind === "text") {
      ctx.selectShape(shape.id);
      ctx.editingTextId = shape.id;
      return true;
    }
    if (repeated && shape.kind === "room") {
      ctx.selectShape(shape.id);
      ctx.renameRoom();
      return true;
    }
    if (repeated && isBranch(shape)) {
      ctx.branchEditing = true;
      ctx.selectedId = null;
      ctx.selectedIds = [];
      ctx.clearSubSelection();
      return true;
    }
    if (repeated && (isDeviceType(shape.type) || HYDRONIC_ELEMENTS[shape.type]?.generic)) {
      ctx.selectShape(shape.id);
      setTimeout(() => document.querySelector("input.branch-name")?.select(), 0);
      return true;
    }
    if (repeated && shape.kind === "equipment" && shape.type === "fieldDevice") {
      ctx.selectShape(shape.id);
      ctx.describingId = shape.id;
      return true;
    }
    if (repeated && shape.kind === "equipment" && hasNameLabel(shape)) {
      ctx.selectShape(shape.id);
      ctx.renamingElementId = shape.id;
      return true;
    }

    const deep = event.altKey && !!shape.groupId;
    const wasSelected = ctx.selectionIds.includes(shape.id) && !deep;
    if (additive) {
      if (!ctx.selectShape(shape.id, true)) return true;
    } else if (deep) {
      ctx.selectShape(shape.id, false, true);
    } else if (!wasSelected) {
      ctx.selectShape(shape.id);
    } else {
      ctx.selectedIds = ctx.selectionIds;
      ctx.selectedId = shape.id;
      ctx.clearShapeSubSelection();
    }

    const start = ctx.toCanvas(event);
    if (!start) return true;
    const carried = [...new Set([...ctx.selectionIds, ...branchPipeIds(ctx.shapes, ctx.selectionIds)])];
    const group = [...new Set([...carried, ...ridingPipes(ctx.shapes, carried)])].map(ctx.shapeById).map((entry) => ({ shape: entry, original: $state.snapshot(entry) }));
    const movingIds = new Set(group.map((entry) => entry.shape.id));
    const solids = group.filter((entry) => entry.shape.kind !== "pipe");
    const lonelyBranch = solids.length === 1 && isBranch(solids[0].shape) ? solids[0] : null;
    const lonelyEnds = lonelyBranch ? branchLegEnds(ctx.shapes, lonelyBranch.shape) : {};
    const resting = lonelyBranch ? ctx.shapes.filter((entry) => !group.some((member) => member.shape === entry)) : [];
    const docker = ctx.app === "hydronic" && solids.length === 1 && solids[0].shape.kind === "equipment" && !isBranch(solids[0].shape)
      && HYDRONIC_ELEMENTS[solids[0].shape.type] && !HYDRONIC_ELEMENTS[solids[0].shape.type].electric ? solids[0] : null;
    const looseEnds = docker ? ctx.shapes.filter((entry) => entry.kind === "pipe" && !movingIds.has(entry.id) && !mediumOf(entry.medium).electric).flatMap((entry) => {
      const route = ctx.pipeRoutes.get(entry.id);
      return ["from", "to"].filter((end) => isFreeEnd(entry[end])).map((end) => ({
        pipe: entry, end, x: entry[end].x, y: entry[end].y, original: { x: entry[end].x, y: entry[end].y },
        near: route?.length > 1 ? (end === "from" ? route[1] : route[route.length - 2]) : null
      }));
    }) : [];
    let docked = null;
    const stretched = ctx.shapes.filter((entry) => entry.kind === "pipe" && !movingIds.has(entry.id) && !mediumOf(entry.medium).electric && entry.branchOf === undefined
      && ctx.pipeRoutes.get(entry.id) && movingIds.has(entry.from?.id) !== movingIds.has(entry.to?.id)).map((entry) => {
      const route = ctx.pipeRoutes.get(entry.id);
      const atStart = movingIds.has(entry.from?.id);
      const end = atStart ? route[0] : route[route.length - 1];
      const next = atStart ? route[1] : route[route.length - 2];
      const flat = Math.abs(end.y - next.y) < 0.01;
      const onFirst = (point) => flat
        ? Math.abs(point.y - end.y) < 0.5 && point.x >= Math.min(end.x, next.x) - 0.5 && point.x <= Math.max(end.x, next.x) + 0.5
        : Math.abs(point.x - end.x) < 0.5 && point.y >= Math.min(end.y, next.y) - 0.5 && point.y <= Math.max(end.y, next.y) + 0.5;
      const joints = route.length >= 3 ? ctx.shapes.filter((other) => other.kind === "pipe" && other !== entry && !movingIds.has(other.id)).flatMap((other) =>
        ["from", "to"].filter((key) => other[key]?.pipe === entry.id && other[key].fitting === undefined && onFirst(other[key]))
          .map((key) => ({ pipe: other, key, x: other[key].x, y: other[key].y, route: ctx.pipeRoutes.get(other.id), points: structuredClone($state.snapshot(other.points ?? [])) }))) : [];
      return { pipe: entry, route, atStart, end, flat, joints, points: structuredClone($state.snapshot(entry.points ?? [])) };
    });
    const keepFittings = ctx.holdFittings(movingIds);
    const framed = group.filter((entry) => entry.shape.kind !== "pipe").map((entry) => shapeBox(entry.original));
    const box = framed.length ? unionBox(framed) : null;
    const step = ctx.snapToGrid ? ctx.gridSize : 1;
    let moved = false;
    const pressed = group.find((entry) => entry.shape === shape)?.original;
    const centre = ctx.snapToGrid && shape.kind === "equipment" && !isBranch(shape) && !isElectricType(shape.type) && pressed
      ? { x: pressed.x + pressed.width / 2, y: pressed.y + pressed.height / 2 }
      : null;
    const rails = new Map(ctx.shapes.filter((entry) => entry.kind === "pipe" && !movingIds.has(entry.id) && mediumOf(entry.medium).electric
      && Number.isFinite(entry.from?.y) && entry.from.y === entry.to?.y).map((entry) => [entry.id, entry]));
    const sliders = ctx.shapes.filter((entry) => entry.kind === "pipe" && !movingIds.has(entry.id)).flatMap((entry) => {
      const ends = [["from", "to"], ["to", "from"]];
      return ends.filter(([own, other]) => movingIds.has(entry[own]?.id) && rails.has(entry[other]?.pipe))
        .map(([, other]) => {
          const rail = rails.get(entry[other].pipe);
          return { pipe: entry, end: other, x: entry[other].x, min: Math.min(rail.from.x, rail.to.x), max: Math.max(rail.from.x, rail.to.x) };
        });
    });

    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const point = ctx.toCanvas(next);
        if (!point) return;
        const still = Math.hypot(point.x - start.x, point.y - start.y) * ctx.viewport.zoom < 3;
        const dx = still ? 0 : centre ? ctx.round2(Math.round((centre.x + point.x - start.x) / step) * step - centre.x) : Math.round((point.x - start.x) / step) * step;
        const dy = still ? 0 : centre ? ctx.round2(Math.round((centre.y + point.y - start.y) / step) * step - centre.y) : Math.round((point.y - start.y) / step) * step;
        let delta = box ? clampDelta(box, dx, dy, ctx.boardWidth, ctx.boardHeight) : { dx, dy };
        if (lonelyBranch) {
          const ends = {};
          for (const [role, end] of Object.entries(lonelyEnds)) ends[role] = { x: end.x + delta.dx, y: end.y + delta.dy };
          delta = { dx: delta.dx, dy: delta.dy + snapBranch(ends, resting, ctx.snapRadius) };
        }
        if (looseEnds.length) {
          const found = dockPort({ ...docker.original, ...translateShape(docker.original, delta.dx, delta.dy) }, looseEnds, ctx.snapRadius);
          if (docked && docked.end !== found?.end) docked.end.pipe[docked.end.end] = { ...docked.end.original };
          docked = found;
          if (docked) {
            delta = { dx: ctx.round2(delta.dx + docked.shift.x), dy: ctx.round2(delta.dy + docked.shift.y) };
            docked.end.pipe[docked.end.end] = docked.port;
          }
        }
        if (delta.dx !== 0 || delta.dy !== 0) moved = true;
        for (const entry of group) Object.assign(entry.shape, translateShape(entry.original, delta.dx, delta.dy, movingIds));
        for (const slider of sliders) slider.pipe[slider.end] = { ...slider.pipe[slider.end], x: Math.min(slider.max, Math.max(slider.min, slider.x + delta.dx)) };
        for (const entry of stretched) {
          for (const joint of entry.joints) {
            const point = { x: entry.flat ? joint.x : ctx.round2(joint.x + delta.dx), y: entry.flat ? ctx.round2(joint.y + delta.dy) : joint.y };
            joint.pipe[joint.key] = { ...joint.pipe[joint.key], ...point };
          }
        }
        keepFittings();
      },
      onend: () => {
        ctx.history.endGesture();
        if (!moved && !additive && wasSelected && (ctx.selectionIds.length > 1 || ctx.fittingGroup.length > 0)) ctx.selectShape(shape.id);
      }
    });
    return true;
  }

  function beginMarquee(event){
    const start = ctx.toCanvas(event);
    if (!start) return false;
    const additive = event.ctrlKey || event.metaKey || event.shiftKey;
    const base = additive ? [...ctx.selectionIds] : [];
    const baseFittings = additive ? ctx.fittingGroup.map((entry) => ({ pipeId: entry.pipe.id, fittingId: entry.fitting.id })) : [];
    if (!additive) {
      ctx.selectedId = null;
      ctx.clearSubSelection();
    }

    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const point = ctx.toCanvas(next);
        if (!point) return;
        const box = {
          x: Math.min(start.x, point.x),
          y: Math.min(start.y, point.y),
          width: Math.abs(point.x - start.x),
          height: Math.abs(point.y - start.y)
        };
        if (box.width * ctx.viewport.zoom < 3 && box.height * ctx.viewport.zoom < 3) return;
        ctx.marquee = box;
        const hits = ctx.branchEditing ? [] : ctx.withGroups(ctx.shapes.filter((shape) => !shape.locked && contains(box, shapeBox(shape))).map((shape) => shape.id));
        const ids = [...base, ...hits.filter((id) => !base.includes(id))];
        ctx.selectedIds = ids;
        ctx.selectedId = ids[ids.length - 1] ?? null;
        ctx.clearSubSelection();
        const fits = [...baseFittings, ...ctx.fittingsIn(box).filter((key) => !baseFittings.some((entry) => ctx.sameFitting(entry, key)))];
        if (fits.length) {
          ctx.selectedFitting = fits[fits.length - 1];
          ctx.extraFittings = fits.slice(0, -1);
        }
      },
      onend: () => {
        if (!ctx.marquee && !additive) ctx.branchEditing = false;
        ctx.marquee = null;
      }
    });
    return true;
  }

  return { handleMove, handleLeave, handleDown, commit, beginMove, beginMarquee };
}
