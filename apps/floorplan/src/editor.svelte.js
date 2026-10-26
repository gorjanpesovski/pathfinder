import { segmentCurved, outlinePoints, hasCurves } from "@pathfinder/core/tools/path.js";
import { samePoint, maxCornerRadius, polygonBounds, polygonSelfIntersects, nearestVertex, distance, pointInPolygon, constrainOrtho, rectPoints, wouldCross, closingCrosses, removeCollinear } from "@pathfinder/core/tools/polygon.js";
import { nextRoomName, isRoomShape, VERTEX_SNAP_PX, snapToEdges, labelPoint, roomLabelPoint, thermostatGlobalScale, thermostatFit, isPolygonTool, snapVertices } from "./rooms.js";
import { clampDelta, dragPointer, unionBox } from "@pathfinder/core/tools/move.js";
import { projectDoor, doorGeometry, MIN_DOOR_WIDTH, maxDoorWidth, suggestDoor, DOOR_ELEMENTS } from "./doors.js";
import { furnitureFits, furnitureCorners, FURNITURE } from "./furniture.js";
import { alignOffsets, distributeOffsets } from "@pathfinder/core/tools/align.js";
import { furnitureItem } from "@pathfinder/diagram/transform.js";
import { furnishForCategory, FURNISHABLE, usableRect, wallSides } from "./populate.js";
import { openEnds } from "./walls.js";

export function createFloorplan(ctx){
  function cornerCurved(shape, index){
    const count = shape.points.length;
    return segmentCurved(shape, (index - 1 + count) % count) || segmentCurved(shape, index);
  }

  function edgeHiddenState(){
    const keys = ctx.activeEdges.filter((key) => ["room", "floor"].includes(ctx.shapeById(key.id)?.kind));
    const hidden = keys.filter((key) => ctx.shapeById(key.id).hiddenEdges?.includes(key.index)).length;
    return hidden === 0 ? "none" : hidden === keys.length ? "all" : "mixed";
  }

  function edgeEnds(shape, index){
    return [shape.points[index], shape.points[(index + 1) % shape.points.length]];
  }

  function twinEdges(shape, index){
    const [a, b] = edgeEnds(shape, index);
    const twins = [];
    for (const other of ctx.shapes) {
      if (other === shape || other.kind !== "room" || shape.kind !== "room") continue;
      other.points.forEach((_, edge) => {
        const [c, d] = edgeEnds(other, edge);
        if ((samePoint(a, c) && samePoint(b, d)) || (samePoint(a, d) && samePoint(b, c))) twins.push({ shape: other, index: edge });
      });
    }
    return twins;
  }

  function setEdgeHidden(shape, index, hide){
    const hidden = new Set(shape.hiddenEdges ?? []);
    if (hide) hidden.add(index);
    else hidden.delete(index);
    if (hidden.size) shape.hiddenEdges = [...hidden].sort((a, b) => a - b);
    else delete shape.hiddenEdges;
  }

  function hideEdges(hide){
    for (const key of ctx.activeEdges) {
      const shape = ctx.shapeById(key.id);
      if (shape?.kind !== "room" && shape?.kind !== "floor") continue;
      setEdgeHidden(shape, key.index, hide);
      for (const twin of twinEdges(shape, key.index)) setEdgeHidden(twin.shape, twin.index, hide);
    }
  }

  function setShapeKind(kind){
    for (const shape of ctx.selectedShapes) {
      if (shape.kind === kind || (shape.kind !== "floor" && shape.kind !== "room")) continue;
      shape.kind = kind;
      if (kind === "room" && !shape.name) shape.name = nextRoomName(ctx.shapes);
    }
  }

  function showRoomNames(show){
    for (const shape of ctx.selectedShapes) {
      if (shape.kind !== "room") continue;
      if (show) delete shape.hideName;
      else shape.hideName = true;
    }
  }

  function setLabelSize(value){
    ctx.editKey = "label-size";
    for (const shape of ctx.selectedShapes) if (shape.kind === "room") shape.labelSize = value;
  }

  function setCornerRadius(value){
    ctx.editKey = "radius";
    for (const key of ctx.activePoints) {
      const shape = ctx.shapeById(key.id);
      if (shape.kind !== "floor" && shape.kind !== "room" && !(shape.kind === "wall" && !shape.open)) continue;
      if (cornerCurved(shape, key.index)) continue;
      if (!shape.radii) shape.radii = shape.points.map(() => 0);
      shape.radii[key.index] = Math.min(value, maxCornerRadius(shape.points, key.index));
    }
  }

  function ensureHandles(shape){
    if (!shape.handles) shape.handles = shape.points.map(() => null);
  }

  function pointGroup(){
    const keys = [...ctx.activePoints];
    for (const edge of ctx.activeEdges) {
      const shape = ctx.shapeById(edge.id);
      for (const index of [edge.index, (edge.index + 1) % shape.points.length]) {
        const key = { id: edge.id, index };
        if (!keys.some((entry) => ctx.sameKey(entry, key))) keys.push(key);
      }
    }
    return keys.map((key) => {
      const shape = ctx.shapeById(key.id);
      return { shape, index: key.index, original: { x: shape.points[key.index].x, y: shape.points[key.index].y } };
    });
  }

  function snapCandidates(group){
    const skip = new Set(group.map((entry) => `${entry.shape.id}:${entry.index}`));
    const candidates = [];
    for (const shape of ctx.shapes) {
      if (!isRoomShape(shape)) continue;
      shape.points.forEach((point, index) => {
        if (!skip.has(`${shape.id}:${index}`)) candidates.push(point);
      });
    }
    return candidates;
  }

  function applyPointDelta(group, dx, dy){
    const delta = clampDelta(polygonBounds(group.map((entry) => entry.original)), dx, dy, ctx.boardWidth, ctx.boardHeight);
    const byShape = new Map();
    for (const entry of group) {
      if (!byShape.has(entry.shape)) byShape.set(entry.shape, entry.shape.points.map((point) => ({ x: point.x, y: point.y })));
      byShape.get(entry.shape)[entry.index] = { x: ctx.round2(entry.original.x + delta.dx), y: ctx.round2(entry.original.y + delta.dy) };
    }
    for (const [shape, points] of byShape) {
      if (shape.kind !== "curve" && !shape.open && polygonSelfIntersects(outlinePoints({ ...shape, points }))) return false;
    }
    for (const [shape, points] of byShape) shape.points = points;
    return true;
  }

  function beginPointDrag(event, shape, index, additive){
    const key = { id: shape.id, index };
    if (event.altKey && shape.kind !== "curve") {
      beginAnchorConvert(event, shape, index);
      return;
    }

    const wasSelected = ctx.activePoints.some((entry) => ctx.sameKey(entry, key));
    if (shape.kind !== "curve") {
      if (additive) {
        ctx.selectedPoints = ctx.toggleKey(ctx.activePoints, key);
        ctx.selectedEdges = ctx.activeEdges;
        if (wasSelected) return;
      } else if (!wasSelected) {
        ctx.selectedPoints = [key];
        ctx.selectedEdges = [];
      }
    }

    const group = shape.kind === "curve"
      ? [{ shape, index, original: { x: shape.points[index].x, y: shape.points[index].y } }]
      : pointGroup();
    const anchor = group.find((entry) => entry.shape === shape && entry.index === index).original;
    const candidates = snapCandidates(group);
    let moved = false;

    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const raw = ctx.toCanvas(next);
        if (!raw) return;
        const radius = VERTEX_SNAP_PX / ctx.viewport.zoom;
        const target = nearestVertex(raw, candidates, radius) ?? snapToEdges(raw, ctx.shapes, radius, shape, ctx.snapPoint(raw)) ?? ctx.snapPoint(raw);
        if (!samePoint(target, anchor)) moved = true;
        applyPointDelta(group, target.x - anchor.x, target.y - anchor.y);
      },
      onend: () => {
        ctx.history.endGesture();
        if (!moved && !additive && wasSelected && ctx.activePoints.length > 1) ctx.selectedPoints = [key];
      }
    });
  }

  function beginEdgeDrag(event, shape, index, additive){
    const key = { id: shape.id, index };
    const wasSelected = ctx.activeEdges.some((entry) => ctx.sameKey(entry, key));
    if (additive) {
      ctx.selectedEdges = ctx.toggleKey(ctx.activeEdges, key);
      ctx.selectedPoints = ctx.activePoints;
      if (wasSelected) return;
    } else if (!wasSelected) {
      ctx.selectedEdges = [key];
      ctx.selectedPoints = [];
    }

    const group = pointGroup();
    const a = shape.points[index];
    const b = shape.points[(index + 1) % shape.points.length];
    const length = distance(a, b);
    const normal = length === 0 ? { x: 0, y: 0 } : { x: -(b.y - a.y) / length, y: (b.x - a.x) / length };
    const base = normal.x * a.x + normal.y * a.y;
    const others = snapCandidates(group).map((point) => normal.x * point.x + normal.y * point.y - base);
    const start = ctx.toCanvas(event);
    const step = ctx.snapToGrid ? ctx.gridSize : 1;
    let moved = false;

    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const point = ctx.toCanvas(next);
        if (!point || !start) return;
        let dx = point.x - start.x;
        let dy = point.y - start.y;
        if (!next.altKey && length > 0) {
          const raw = dx * normal.x + dy * normal.y;
          const radius = VERTEX_SNAP_PX / ctx.viewport.zoom;
          const near = others.reduce((best, offset) => Math.abs(offset - raw) <= radius && (best === null || Math.abs(offset - raw) < Math.abs(best - raw)) ? offset : best, null);
          const offset = near ?? Math.round(raw / step) * step;
          dx = normal.x * offset;
          dy = normal.y * offset;
        } else {
          dx = Math.round(dx / step) * step;
          dy = Math.round(dy / step) * step;
        }
        if (dx !== 0 || dy !== 0) moved = true;
        applyPointDelta(group, dx, dy);
      },
      onend: () => {
        ctx.history.endGesture();
        if (!moved && !additive && wasSelected && ctx.activeEdges.length > 1) ctx.selectedEdges = [key];
      }
    });
  }

  function beginHandleDrag(event, shape, index, side){
    const other = side === "in" ? "out" : "in";
    const anchor = { x: shape.points[index].x, y: shape.points[index].y };

    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const raw = ctx.toCanvas(next);
        if (!raw) return;
        let vector = { x: raw.x - anchor.x, y: raw.y - anchor.y };
        if (next.shiftKey) vector = ctx.constrainAngle(vector);
        vector = { x: ctx.round2(vector.x), y: ctx.round2(vector.y) };
        const handle = { ...$state.snapshot(shape.handles[index]) };
        handle[side] = vector;
        if (next.altKey) handle.smooth = false;
        if (handle.smooth && handle[other]) {
          const keep = Math.hypot(handle[other].x, handle[other].y);
          const size = Math.hypot(vector.x, vector.y) || 1;
          handle[other] = { x: ctx.round2(-vector.x / size * keep), y: ctx.round2(-vector.y / size * keep) };
        }
        shape.handles[index] = handle;
      },
      onend: () => ctx.history.endGesture()
    });
  }

  function beginAnchorConvert(event, shape, index){
    const existing = shape.handles?.[index];
    const anchor = { x: shape.points[index].x, y: shape.points[index].y };
    ctx.selectedPoints = [{ id: shape.id, index }];
    ctx.selectedEdges = [];
    let pulled = false;

    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const raw = ctx.toCanvas(next);
        if (!raw) return;
        let vector = { x: raw.x - anchor.x, y: raw.y - anchor.y };
        if (Math.hypot(vector.x, vector.y) * ctx.viewport.zoom < 4) return;
        if (next.shiftKey) vector = ctx.constrainAngle(vector);
        vector = { x: ctx.round2(vector.x), y: ctx.round2(vector.y) };
        ensureHandles(shape);
        shape.handles[index] = { in: { x: -vector.x, y: -vector.y }, out: vector, smooth: true };
        pulled = true;
      },
      onend: () => {
        if (!pulled && existing) shape.handles[index] = null;
        ctx.history.endGesture();
      }
    });
  }

  function deletePoints(){
    const byShape = new Map();
    for (const key of ctx.activePoints) {
      if (!byShape.has(key.id)) byShape.set(key.id, []);
      byShape.get(key.id).push(key.index);
    }
    const removed = [];
    for (const [id, indices] of byShape) {
      const shape = ctx.shapeById(id);
      if (shape.kind === "curve") continue;
      const keep = (_, index) => !indices.includes(index);
      const points = shape.points.filter(keep);
      if (points.length < (shape.open || hasCurves(shape) ? 2 : 3)) {
        removed.push(id);
        continue;
      }
      shape.points = points;
      if (shape.radii) shape.radii = shape.radii.filter(keep);
      if (shape.handles) shape.handles = shape.handles.filter(keep);
      if (shape.doors) shape.doors = shape.doors.filter((door) => door.edge < points.length);
    }
    if (removed.length) ctx.shapes = ctx.shapes.filter((shape) => !removed.includes(shape.id));
    ctx.selectedPoints = [];
  }

  function thermostatState(list){
    const rooms = list.filter((entry) => entry.kind === "room");
    const on = rooms.filter((entry) => entry.regulated).length;
    return on === 0 ? "none" : on === rooms.length ? "all" : "mixed";
  }

  function setThermostat(on){
    for (const shape of ctx.selectedShapes) {
      if (shape.kind !== "room") continue;
      if (on) shape.regulated = true;
      else delete shape.regulated;
    }
  }

  let lastLabelPress = 0;

  function beginRoomLabelDrag(event, room){
    const now = performance.now();
    if (now - lastLabelPress < 400) {
      lastLabelPress = 0;
      ctx.selectShape(room.id);
      renameRoom();
      return;
    }
    lastLabelPress = now;
    const start = ctx.toCanvas(event);
    if (!start) return;
    const base = labelPoint(room);
    const current = roomLabelPoint(room, ctx.roomStyle);
    const original = { dx: current.x - base.x, dy: current.y - base.y };
    const outline = outlinePoints(room);
    const step = ctx.snapToGrid ? ctx.gridSize / 2 : 1;

    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const point = ctx.toCanvas(next);
        if (!point) return;
        const candidate = {
          dx: ctx.round2(original.dx + Math.round((point.x - start.x) / step) * step),
          dy: ctx.round2(original.dy + Math.round((point.y - start.y) / step) * step)
        };
        if (pointInPolygon({ x: base.x + candidate.dx, y: base.y + candidate.dy }, outline)) room.labelOffset = candidate;
      },
      onend: () => ctx.history.endGesture()
    });
  }

  function beginThermostatDrag(event, room){
    if (!ctx.selectionIds.includes(room.id)) ctx.selectShape(room.id, false, true);
    const start = ctx.toCanvas(event);
    if (!start) return;
    const original = { ...(room.thermostat ?? { dx: 0, dy: 0 }) };
    const step = ctx.snapToGrid ? ctx.gridSize / 2 : 1;
    const globalScale = thermostatGlobalScale(ctx.shapes, ctx.roomStyle);

    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const point = ctx.toCanvas(next);
        if (!point) return;
        const candidate = {
          dx: original.dx + Math.round((point.x - start.x) / step) * step,
          dy: original.dy + Math.round((point.y - start.y) / step) * step
        };
        if (thermostatFit({ ...room, thermostat: candidate }, ctx.roomStyle) >= globalScale - 0.001) room.thermostat = candidate;
      },
      onend: () => ctx.history.endGesture()
    });
  }

  function copyFurniture(event){
    if (!ctx.partGroup.length) return false;
    ctx.clipboardFurniture = ctx.partGroup.map((part) => ({ kind: part.kind, roomId: part.roomId, item: $state.snapshot(part.item), center: part.kind === "door" ? doorCenter(part.room, part.item) : null }));
    ctx.clipboardShapes = null;
    ctx.clipboardFittings = null;
    ctx.clipboardToken = `${Date.now()}`;
    ctx.pasteCount = 0;
    ctx.pasteKey = null;
    event.clipboardData?.setData("text/plain", ctx.CLIPBOARD_PREFIX + ctx.clipboardToken);
    event.preventDefault();
    return true;
  }

  function partCenter(entry){
    return entry.kind === "door" ? entry.center : { x: entry.item.cx, y: entry.item.cy };
  }

  function doorClashes(room, door, extra = []){
    const [a, b] = edgeEnds(room, door.edge);
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    return [...(room.doors ?? []), ...extra].some((other) => other.edge === door.edge
      && Math.abs(other.t - door.t) * length < (other.width + door.width) / 2 + 10);
  }

  function pasteDoor(entry, room, target, taken){
    const step = ctx.snapToGrid ? ctx.gridSize : 20;
    const first = projectDoor(room, target, entry.item.width);
    if (!first) return null;
    const [a, b] = edgeEnds(room, first.edge);
    const u = { x: (b.x - a.x), y: (b.y - a.y) };
    const length = Math.hypot(u.x, u.y);
    const base = { x: a.x + u.x * first.t, y: a.y + u.y * first.t };
    for (let index = 0; index < 200; index += 1) {
      const shift = (index % 2 ? 1 : -1) * Math.ceil(index / 2) * step;
      const point = { x: base.x + u.x / length * shift, y: base.y + u.y / length * shift };
      const placed = projectDoor(room, point, entry.item.width);
      if (!placed) continue;
      const door = { ...entry.item, ...placed };
      if (!doorClashes(room, door, taken)) return door;
    }
    return null;
  }

  function pasteFurniture(){
    const entries = ctx.clipboardFurniture.filter((entry) => ctx.shapeById(entry.roomId) || ctx.pointer);
    if (!entries.length) return;
    const hovered = ctx.pointer ? roomAt(ctx.pointer) : null;
    const sources = new Set(entries.map((entry) => entry.roomId));
    const atPointer = !!hovered && !hovered.locked && !sources.has(hovered.id);
    const step = ctx.snapToGrid ? ctx.gridSize : 20;
    const centers = entries.map(partCenter).filter(Boolean);
    const middle = { x: centers.reduce((sum, p) => sum + p.x, 0) / centers.length, y: centers.reduce((sum, p) => sum + p.y, 0) / centers.length };
    const origin = atPointer ? { x: Math.round(ctx.pointer.x / step) * step, y: Math.round(ctx.pointer.y / step) * step } : middle;
    const key = atPointer ? `${hovered.id}:${origin.x}:${origin.y}` : "source";
    if (key !== ctx.pasteKey) {
      ctx.pasteKey = key;
      ctx.pasteCount = 0;
    }
    ctx.pasteCount += 1;
    const first = atPointer ? ctx.pasteCount - 1 : ctx.pasteCount;
    const roomFor = (entry) => {
      const room = atPointer ? hovered : ctx.shapeById(entry.roomId);
      return room?.kind === "room" && !room.locked ? room : null;
    };
    const furniture = entries.filter((entry) => entry.kind === "furniture");
    const doors = entries.filter((entry) => entry.kind === "door");
    const keys = [];

    if (furniture.length) {
      let placed = null;
      for (let ring = first; ring < first + 40 && !placed; ring += 1) {
        for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [0, 1], [-1, 0], [0, -1]]) {
          const dx = origin.x - middle.x + sx * ring * step;
          const dy = origin.y - middle.y + sy * ring * step;
          const attempt = furniture.map((entry) => {
            const room = roomFor(entry);
            const item = room ? { ...entry.item, cx: ctx.round2(entry.item.cx + dx), cy: ctx.round2(entry.item.cy + dy) } : null;
            return item && furnitureFits(room, item) ? { room, item } : null;
          });
          if (attempt.every(Boolean)) {
            placed = attempt;
            break;
          }
        }
      }
      for (const { room, item } of placed ?? []) {
        const id = ctx.nextId++;
        room.furniture = [...(room.furniture ?? []), { ...item, id }];
        keys.push({ kind: "furniture", roomId: room.id, id });
      }
    }

    const shift = { x: origin.x - middle.x, y: origin.y - middle.y };
    const taken = new Map();
    for (const entry of doors) {
      const room = roomFor(entry);
      if (!room || !entry.center) continue;
      const list = taken.get(room.id) ?? [];
      const door = pasteDoor(entry, room, { x: entry.center.x + shift.x, y: entry.center.y + shift.y }, list);
      if (!door) continue;
      list.push(door);
      taken.set(room.id, list);
      const id = ctx.nextId++;
      room.doors = [...(room.doors ?? []), { ...door, id }];
      keys.push({ kind: "door", roomId: room.id, id });
    }

    if (!keys.length) return;
    if (ctx.tool !== "select") ctx.pickTool("select");
    ctx.selectedId = null;
    ctx.clearSubSelection();
    ctx.selectedParts = keys;
  }

  function resolvePart(key){
    const room = ctx.shapeById(key.roomId);
    if (!room || room.locked) return null;
    const item = (key.kind === "door" ? room.doors : room.furniture)?.find((entry) => entry.id === key.id);
    return item ? { ...key, room, item } : null;
  }

  function samePart(a, b){
    return a.kind === b.kind && a.roomId === b.roomId && a.id === b.id;
  }

  function pickPart(key, additive){
    ctx.selectedId = null;
    ctx.selectedIds = [];
    ctx.selectedPoints = [];
    ctx.selectedEdges = [];
    ctx.selectedFitting = null;
    ctx.extraFittings = [];
    if (additive) {
      ctx.selectedParts = ctx.selectedParts.some((entry) => samePart(entry, key))
        ? ctx.selectedParts.filter((entry) => !samePart(entry, key))
        : [...ctx.selectedParts, key];
      return false;
    }
    if (!ctx.selectedParts.some((entry) => samePart(entry, key))) ctx.selectedParts = [key];
    return true;
  }

  function partBox(part){
    if (part.kind === "furniture") return polygonBounds(furnitureCorners(part.item));
    const geometry = doorGeometry(part.room, part.item);
    return geometry ? polygonBounds([geometry.p0, geometry.p1]) : null;
  }

  function shiftParts(parts, offsets){
    parts.forEach((part, index) => {
      const { dx, dy } = offsets[index];
      if (!dx && !dy) return;
      if (part.kind === "furniture") {
        part.item.cx = ctx.round2(part.item.cx + dx);
        part.item.cy = ctx.round2(part.item.cy + dy);
        return;
      }
      const center = doorCenter(part.room, part.item);
      if (!center) return;
      const placed = projectDoor(part.room, { x: center.x + dx, y: center.y + dy }, part.item.width);
      if (placed) Object.assign(part.item, placed);
    });
  }

  function roomInterior(room){
    const box = polygonBounds(outlinePoints(room));
    const inset = ctx.roomStyle.roomWidth / 2;
    return { x: box.x + inset, y: box.y + inset, width: box.width - inset * 2, height: box.height - inset * 2 };
  }

  function alignParts(mode){
    const parts = ctx.partGroup.filter(partBox);
    const boxes = parts.map(partBox);
    if (!boxes.length) return;
    const frame = boxes.length === 1 ? roomInterior(parts[0].room) : unionBox(boxes);
    shiftParts(parts, alignOffsets(boxes, mode, frame));
  }

  function distributeParts(axis){
    const parts = ctx.partGroup.filter(partBox);
    const boxes = parts.map(partBox);
    if (boxes.length < 3) return;
    shiftParts(parts, distributeOffsets(boxes, axis));
  }

  function removeParts(){
    for (const part of ctx.partGroup) {
      if (part.kind === "door") part.room.doors = part.room.doors.filter((entry) => entry.id !== part.id);
      else part.room.furniture = part.room.furniture.filter((entry) => entry.id !== part.id);
    }
    ctx.selectedParts = [];
  }

  function partEntries(){
    return ctx.partGroup.map((part) => ({ part, original: $state.snapshot(part.item), center: part.kind === "door" ? doorCenter(part.room, part.item) : null }));
  }

  function transformParts(entries, t){
    for (const entry of entries) {
      if (entry.part.kind === "furniture") {
        const next = furnitureItem(entry.original, t);
        if (entries.length > 1 || furnitureFits(entry.part.room, next)) Object.assign(entry.part.item, next);
        continue;
      }
      if (t.kind !== "scale" || !entry.center) continue;
      const room = entry.part.room;
      const factor = Math.sqrt(Math.abs(t.sx * t.sy));
      const width = Math.round(Math.min(Math.max(MIN_DOOR_WIDTH, entry.original.width * factor), Math.max(MIN_DOOR_WIDTH, maxDoorWidth(room, entry.original.edge))));
      const placed = projectDoor(room, t.point(entry.center), width);
      const flipped = t.sx * t.sy < 0;
      Object.assign(entry.part.item, {
        width,
        ...(placed ?? {}),
        hinge: flipped ? (entry.original.hinge === "left" ? "right" : "left") : entry.original.hinge
      });
    }
  }

  function commonCategory(list){
    const categories = new Set(list.filter((entry) => entry.kind === "room").map((entry) => entry.category ?? ""));
    return categories.size === 1 ? [...categories][0] : "mixed";
  }

  function setCategory(value){
    if (value === "mixed") return;
    for (const shape of ctx.selectedShapes) {
      if (shape.kind !== "room") continue;
      if (value) shape.category = value;
      else delete shape.category;
    }
  }

  let doorsTimer;

  function placeDoors(){
    let count = 0;
    for (const room of ctx.shapes) {
      if (room.kind !== "room" || room.doors?.length) continue;
      const door = suggestDoor(room, ctx.shapes);
      if (!door) continue;
      room.doors = [{ id: ctx.nextId++, ...door }];
      count += 1;
    }
    ctx.doorsPlaced = count;
    ctx.furnishedRooms = null;
    clearTimeout(doorsTimer);
    doorsTimer = setTimeout(() => ctx.doorsPlaced = null, 2000);
  }

  function doorCenter(room, door){
    const geometry = doorGeometry(room, door);
    return geometry ? { x: (geometry.p0.x + geometry.p1.x) / 2, y: (geometry.p0.y + geometry.p1.y) / 2 } : null;
  }

  function beginDoorDrag(event, room, doorId){
    if (!pickPart({ kind: "door", roomId: room.id, id: doorId }, event.ctrlKey || event.metaKey)) return;
    const door = room.doors.find((entry) => entry.id === doorId);
    const start = ctx.toCanvas(event);
    const center = door ? doorCenter(room, door) : null;
    if (!door || !start || !center) return;

    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const point = ctx.toCanvas(next);
        if (!point) return;
        const placed = projectDoor(room, { x: center.x + point.x - start.x, y: center.y + point.y - start.y }, door.width);
        if (!placed) return;
        door.edge = placed.edge;
        door.t = placed.t;
      },
      onend: () => ctx.history.endGesture()
    });
  }

  function updateDoor(changes){
    for (const { room, item: door } of ctx.doorGroup) {
      let patch = changes;
      const center = doorCenter(room, door);
      if (patch.type === "double" && door.width < DOOR_ELEMENTS.doubleDoor.width) {
        patch = { ...patch, width: Math.min(DOOR_ELEMENTS.doubleDoor.width, maxDoorWidth(room, door.edge)) };
      }
      if (patch.width) patch = { ...patch, width: Math.min(patch.width, Math.max(MIN_DOOR_WIDTH, maxDoorWidth(room, door.edge))) };
      Object.assign(door, patch);
      if (patch.width && center) {
        const placed = projectDoor(room, center, door.width);
        if (placed) Object.assign(door, placed);
      }
    }
  }

  function removeDoor(){
    removeParts();
  }

  function furnishRoom(room){
    room.furniture = furnishForCategory(room, ctx.roomStyle).map((item) => ({ ...item, id: ctx.nextId++ }));
    return room.furniture.length;
  }

  function furnishSelected(){
    if (ctx.selectedShape?.kind === "room" && FURNISHABLE.includes(ctx.selectedShape.category)) furnishRoom(ctx.selectedShape);
  }

  function clearFurniture(){
    if (ctx.selectedShape?.kind === "room") delete ctx.selectedShape.furniture;
  }

  let furnishTimer;

  function furnishOffices(){
    let count = 0;
    for (const room of ctx.shapes) {
      if (room.kind !== "room" || !FURNISHABLE.includes(room.category) || room.furniture?.length) continue;
      if (furnishRoom(room) > 0) count += 1;
    }
    ctx.furnishedRooms = count;
    ctx.doorsPlaced = null;
    clearTimeout(furnishTimer);
    furnishTimer = setTimeout(() => ctx.furnishedRooms = null, 2000);
  }

  function beginFurnitureDrag(event, room, itemId){
    if (!pickPart({ kind: "furniture", roomId: room.id, id: itemId }, event.ctrlKey || event.metaKey)) return;
    const start = ctx.toCanvas(event);
    const moving = ctx.furnitureGroup.map((part) => ({ part, origin: { cx: part.item.cx, cy: part.item.cy } }));
    if (!moving.length || !start) return;
    const step = ctx.snapToGrid ? ctx.gridSize / 2 : 1;

    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const point = ctx.toCanvas(next);
        if (!point) return;
        const dx = Math.round((point.x - start.x) / step) * step;
        const dy = Math.round((point.y - start.y) / step) * step;
        const candidates = moving.map(({ part, origin }) => ({ part, next: { ...part.item, cx: ctx.round2(origin.cx + dx), cy: ctx.round2(origin.cy + dy) } }));
        if (!candidates.every(({ part, next }) => furnitureFits(part.room, next))) return;
        for (const { part, next } of candidates) {
          part.item.cx = next.cx;
          part.item.cy = next.cy;
        }
      },
      onend: () => ctx.history.endGesture()
    });
  }

  function rotateFurniture(){
    for (const part of ctx.furnitureGroup) part.item.rotation = (part.item.rotation + 90) % 360;
  }

  function removeFurniture(){
    removeParts();
  }

  function roomAt(point){
    const rooms = ctx.shapes.filter((shape) => shape.kind === "room");
    for (let index = rooms.length - 1; index >= 0; index -= 1) {
      if (pointInPolygon(point, outlinePoints(rooms[index]))) return rooms[index];
    }
    return null;
  }

  function snapFurnitureToWall(room, item){
    const rect = usableRect(room, ctx.roomStyle.roomWidth / 2 + 2);
    const spec = FURNITURE[item.type];
    if (!rect) return item;
    let best = null;
    for (const side of wallSides(rect)) {
      const depth = (item.cx - side.origin.x) * side.n.x + (item.cy - side.origin.y) * side.n.y;
      const along = (item.cx - side.origin.x) * side.t.x + (item.cy - side.origin.y) * side.t.y;
      if (depth < -30 || depth > spec.depth / 2 + 40 || along < 0 || along > side.length) continue;
      if (!best || depth < best.depth) best = { side, depth, along };
    }
    if (!best) return item;
    const { side } = best;
    const along = Math.min(side.length - spec.width / 2, Math.max(spec.width / 2, best.along));
    return {
      ...item,
      cx: ctx.round2(side.origin.x + side.t.x * along + side.n.x * spec.depth / 2),
      cy: ctx.round2(side.origin.y + side.t.y * along + side.n.y * spec.depth / 2),
      rotation: side.rotation
    };
  }

  function doorPlacement(point, spec){
    const radius = Math.max(60, 40 / ctx.viewport.zoom);
    const inside = roomAt(point);
    const rooms = ctx.shapes.filter((shape) => shape.kind === "room");
    let best = null;
    for (const room of rooms) {
      for (const width of [spec.width, Math.round(spec.width * 0.75), 70]) {
        const placed = projectDoor(room, point, width);
        if (!placed) continue;
        const door = { edge: placed.edge, t: placed.t, width, hinge: "left", swing: "in", type: spec.type };
        const geometry = doorGeometry(room, door);
        if (!geometry) break;
        const gap = Math.hypot((geometry.p0.x + geometry.p1.x) / 2 - point.x, (geometry.p0.y + geometry.p1.y) / 2 - point.y);
        if (gap > radius) break;
        const score = gap - (room === inside ? radius : 0);
        if (!best || score < best.score) best = { room, door, score };
        break;
      }
    }
    return best
      ? { kind: "door", room: best.room, door: best.door, valid: true }
      : { kind: "door", room: null, door: null, valid: false };
  }

  function setRoomName(room, value){
    const name = value.trim();
    room.name = name || nextRoomName(ctx.shapes.filter((shape) => shape !== room));
  }

  function commitRename(value){
    const room = ctx.renamingRoom;
    ctx.renamingId = null;
    if (room) setRoomName(room, value);
  }

  function renameRoom(){
    ctx.renamingId = ctx.selectedId;
  }

  function commitRoomName(event){
    if (!ctx.selectedRoom) return;
    const name = event.currentTarget.value.trim();
    ctx.selectedRoom.name = name || nextRoomName(ctx.shapes.filter((shape) => shape !== ctx.selectedRoom));
  }

  function roomPoint(raw, event){
    const point = ctx.snapPoint(raw);
    const last = ctx.draft?.points && (isPolygonTool(ctx.draft.kind) || ctx.draft.kind === "pen") ? ctx.draft.points[ctx.draft.points.length - 1] : null;
    const radius = VERTEX_SNAP_PX / ctx.viewport.zoom;
    const vertex = nearestVertex(raw, snapVertices(ctx.shapes, ctx.draft), radius);
    if (vertex && (!event.shiftKey || !last || vertex.x === last.x || vertex.y === last.y)) return vertex;
    if (event.shiftKey && last) return constrainOrtho(last, point);
    return snapToEdges(raw, ctx.shapes, Math.max(radius, ctx.roomStyle.floorWidth / 2 + 1), null, point) ?? point;
  }

  function roomClick(point){
    ctx.cursor = point;

    if (!ctx.draft) {
      ctx.draft = { kind: ctx.tool, start: point, points: [point], target: ctx.shapeTarget };
      return;
    }

    if (ctx.draft.kind === "room-rect") {
      const points = rectPoints(ctx.draft.start, point);
      if (points) ctx.shapes.push(ctx.draft.target === "wall"
        ? { id: ctx.nextId++, kind: "wall", points }
        : ctx.draft.target === "floor"
          ? { id: ctx.nextId++, kind: "floor", points }
          : { id: ctx.nextId++, kind: "room", name: nextRoomName(ctx.shapes), points });
      ctx.draft = null;
      return;
    }

    const last = ctx.draft.points[ctx.draft.points.length - 1];
    if (samePoint(point, last) || samePoint(point, ctx.draft.start)) {
      if (ctx.draft.target === "wall" && samePoint(point, last) && !samePoint(point, ctx.draft.start) && ctx.draft.points.length >= 2) finishPolygon(null, true);
      else if (ctx.draft.points.length >= 3) finishPolygon();
      return;
    }

    if (wouldCross(ctx.draft.points, point)) return;
    ctx.draft.points.push(point);
  }

  function finishPolygon(closed = null, open = false){
    if (!closed && (!ctx.draft?.points || ctx.draft.points.length < (open ? 2 : 3) || (!open && closingCrosses(ctx.draft.points)))) return;
    const points = open ? $state.snapshot(ctx.draft.points) : removeCollinear(closed ?? $state.snapshot(ctx.draft.points));
    if (open) {
      ctx.shapes.push({ id: ctx.nextId++, kind: "wall", points, open: true });
    } else if (points.length >= 3 && ctx.draft.target === "wall") {
      ctx.shapes.push({ id: ctx.nextId++, kind: "wall", points });
    } else if (points.length >= 3) {
      ctx.shapes.push(ctx.draft.kind === "floor" || ctx.draft.target === "floor"
        ? { id: ctx.nextId++, kind: "floor", points }
        : { id: ctx.nextId++, kind: "room", name: nextRoomName(ctx.shapes), points });
    }
    ctx.draft = null;
  }

  function penDown(event, point){
    ctx.cursor = point;

    if (!ctx.draft) {
      ctx.draft = { kind: "pen", start: point, points: [point], handles: [null], dragging: false, target: ctx.shapeTarget };
      pullPenHandle(event, 0, false);
      return;
    }

    const last = ctx.draft.points[ctx.draft.points.length - 1];
    if (ctx.draft.points.length >= 2 && samePoint(point, ctx.draft.start)) {
      pullPenHandle(event, 0, true);
      return;
    }
    if (samePoint(point, last)) {
      finishPen(null, ctx.draft.target === "wall");
      return;
    }

    ctx.draft.points.push(point);
    ctx.draft.handles.push(null);
    pullPenHandle(event, ctx.draft.points.length - 1, false);
  }

  function pullPenHandle(event, index, closing){
    const anchor = { x: ctx.draft.points[index].x, y: ctx.draft.points[index].y };
    ctx.draft.dragging = true;

    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        if (!ctx.draft) return;
        const raw = ctx.toCanvas(next);
        if (!raw) return;
        let vector = { x: raw.x - anchor.x, y: raw.y - anchor.y };
        if (Math.hypot(vector.x, vector.y) * ctx.viewport.zoom < 4) return;
        if (next.shiftKey) vector = ctx.constrainAngle(vector);
        vector = { x: ctx.round2(vector.x), y: ctx.round2(vector.y) };
        ctx.draft.handles[index] = { in: { x: -vector.x, y: -vector.y }, out: vector, smooth: true };
      },
      onend: () => {
        if (!ctx.draft) return;
        ctx.draft.dragging = false;
        if (closing) finishPen();
      }
    });
  }

  function finishPen(closed = null, open = false){
    if (!ctx.draft || ctx.draft.kind !== "pen") return;
    const snapshot = $state.snapshot(ctx.draft);
    const points = closed ?? snapshot.points;
    const handles = closed ? [...snapshot.handles, ...closed.slice(snapshot.handles.length).map(() => null)] : open ? openEnds(snapshot.handles) : snapshot.handles;
    const curved = handles.some(Boolean);
    if (points.length < (curved || open ? 2 : 3)) return;
    const shape = { id: ctx.nextId++, kind: ctx.draft.target === "floor" ? "floor" : ctx.draft.target === "wall" ? "wall" : "room", points };
    if (open) shape.open = true;
    if (curved) shape.handles = handles;
    if (shape.kind === "room") shape.name = nextRoomName(ctx.shapes);
    ctx.shapes.push(shape);
    ctx.draft = null;
  }

  function roomKeydown(event){
    if (!ctx.draft?.points || !(isPolygonTool(ctx.draft.kind) || ctx.draft.kind === "pen")) return false;

    if (event.key === "Enter") {
      event.preventDefault();
      if (ctx.draft.kind === "pen") finishPen(null, ctx.draft.target === "wall");
      else finishPolygon(null, ctx.draft.target === "wall");
      return true;
    }

    const undoKey = event.key.toLowerCase() === "z" && (event.ctrlKey || event.metaKey);
    if (event.key === "Backspace" || undoKey) {
      event.preventDefault();
      ctx.draft.points.pop();
      ctx.draft.handles?.pop();
      if (ctx.draft.points.length === 0) ctx.draft = null;
      return true;
    }

    return false;
  }

  return { cornerCurved, edgeHiddenState, edgeEnds, twinEdges, setEdgeHidden, hideEdges, setShapeKind, showRoomNames, setLabelSize, setCornerRadius, ensureHandles, pointGroup, snapCandidates, applyPointDelta, beginPointDrag, beginEdgeDrag, beginHandleDrag, beginAnchorConvert, deletePoints, thermostatState, setThermostat, beginRoomLabelDrag, beginThermostatDrag, copyFurniture, partCenter, doorClashes, pasteDoor, pasteFurniture, resolvePart, samePart, pickPart, partBox, shiftParts, roomInterior, alignParts, distributeParts, removeParts, partEntries, transformParts, commonCategory, setCategory, placeDoors, doorCenter, beginDoorDrag, updateDoor, removeDoor, furnishRoom, furnishSelected, clearFurniture, furnishOffices, beginFurnitureDrag, rotateFurniture, removeFurniture, roomAt, snapFurnitureToWall, doorPlacement, setRoomName, commitRename, renameRoom, commitRoomName, roomPoint, roomClick, finishPolygon, penDown, pullPenHandle, finishPen, roomKeydown };
}
