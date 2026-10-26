import { polygonBounds, samePoint } from "@pathfinder/core/tools/polygon.js";
import { findValvePort } from "../valvePorts.js";
import { findPort, findPipePoint, routePoint, legAt, computeRoutes, keepSpot, keepsCorners, freezeRoute, routeAnchors, endOf, sameEnd, scaledOffset, portStep, endpointPose, isFreeEnd, editablePath, storedPoints, dragVertex, dragEdge, projectOnRoute } from "../route.js";
import { prefersReducedMotion } from "svelte/motion";
import { junctionMedium } from "../inherit.js";
import { HYDRONIC_ELEMENTS, familyOf, mediumOf } from "../elements.js";
import { tidyPipe } from "../autoroute.js";
import { isLeg } from "../branch.js";
import { dragPointer } from "@pathfinder/core/tools/move.js";

export function createPipes(ctx){
  function routeBox(pipe){
    const route = ctx.pipeRoutes.get(pipe.id);
    return route?.length ? polygonBounds(route) : null;
  }

  function pipeTargetAt(point){
    const exclude = ctx.pipeDraft?.rewire?.pipeId ?? null;
    const valve = findValvePort(point, ctx.shapes, ctx.pipeRoutes, ctx.hoverRadius, exclude);
    if (valve) return valve;
    const port = findPort(point, ctx.shapes, ctx.hoverRadius);
    const pipe = findPipePoint(point, ctx.pipeRoutes, ctx.hoverRadius, exclude, ctx.pipeAim.aligned || !ctx.snapToGrid ? 0 : ctx.gridSize);
    if (!port || !pipe) return port ?? pipe;
    return pipe.gap < Math.hypot(port.point.x - point.x, port.point.y - point.y) ? pipe : port;
  }

  function flashPipe(id){
    if (prefersReducedMotion.current) return;
    ctx.freshPipes = [...ctx.freshPipes, id];
    setTimeout(() => ctx.freshPipes = ctx.freshPipes.filter((entry) => entry !== id), 1200);
  }

  function holdFittings(skip = new Set()){
    const held = ctx.shapes.filter((entry) => entry.kind === "pipe" && !skip.has(entry.id) && entry.fittings?.length && ctx.pipeRoutes.get(entry.id)).map((entry) => {
      const route = ctx.pipeRoutes.get(entry.id);
      return { pipe: entry, spots: new Map(entry.fittings.map((fitting) => {
        const spot = routePoint(route, fitting.t);
        return [fitting.id, { x: spot.x, y: spot.y, horizontal: spot.angle === 0 || Math.abs(spot.angle) === 180, leg: legAt(route, fitting.t), legs: route.length }];
      })) };
    });
    return () => {
      if (!held.length) return;
      const routes = computeRoutes(ctx.shapes);
      for (const entry of held) {
        const route = routes.get(entry.pipe.id);
        if (!route) continue;
        for (const fitting of entry.pipe.fittings ?? []) {
          const spot = entry.spots.get(fitting.id);
          const t = spot ? keepSpot(route, spot, spot.horizontal, route.length === spot.legs ? spot.leg : null) : null;
          if (t !== null) fitting.t = ctx.round4(Math.min(0.98, Math.max(0.02, t)));
        }
      }
    };
  }

  function settleCorners(ids){
    const routes = computeRoutes(ctx.shapes);
    for (const id of ids) {
      const pipe = ctx.shapeById(id);
      const route = keepsCorners(pipe) ? routes.get(id) : null;
      if (!route) continue;
      pipe.points = freezeRoute(route);
      pipe.anchors = routeAnchors(route);
      pipe.corners = true;
    }
  }

  function markCorners(pipe, path){
    if (!keepsCorners(pipe) || path.length < 2) return;
    pipe.anchors = routeAnchors(path);
    pipe.corners = true;
  }

  function finishRewire(snapshot, end){
    const pipe = ctx.shapeById(snapshot.rewire.pipeId);
    ctx.pipeDraft = null;
    if (!pipe) return;
    if (snapshot.rewire.end === "to") {
      pipe.to = end;
      pipe.points = snapshot.points;
    } else {
      pipe.from = end;
      pipe.points = [...snapshot.points].reverse();
    }
    pipe.corners = false;
    settleCorners([pipe.id]);
    flashPipe(pipe.id);
  }

  function pipeClick(event){
    const target = ctx.portTarget ?? (ctx.pipeCursor ? { free: true, x: ctx.pipeCursor.x, y: ctx.pipeCursor.y, point: ctx.pipeCursor } : null);
    if (!ctx.pipeDraft) {
      if (target) ctx.pipeDraft = { from: endOf(target), points: [] };
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      const last = ctx.pipeDraft.points[ctx.pipeDraft.points.length - 1];
      if (ctx.pipeCursor && !(last && samePoint(last, ctx.pipeCursor))) ctx.pipeDraft.points.push({ x: ctx.pipeCursor.x, y: ctx.pipeCursor.y });
      return;
    }
    if (!target && ctx.pipeDraft.rewire) {
      ctx.removeShape(ctx.pipeDraft.rewire.pipeId);
      ctx.pipeDraft = null;
      return;
    }
    if (!target || sameEnd(endOf(target), ctx.pipeDraft.from)) return;
    if (target.pipe !== undefined && ctx.pipeDraft.from.pipe === target.pipe) return;
    const snapshot = $state.snapshot(ctx.pipeDraft);
    if (snapshot.rewire) {
      finishRewire(snapshot, endOf(target));
      return;
    }
    const id = ctx.nextId++;
    ctx.shapes.push({
      id,
      kind: "pipe",
      from: snapshot.from,
      to: endOf(target),
      points: snapshot.points,
      medium: junctionMedium(snapshot.from, endOf(target), ctx.shapeIndex) ?? ctx.pipeMedium,
      width: ctx.pipeThickness,
      fittings: []
    });
    ctx.pipeDraft = null;
    settleCorners([id]);
    flashPipe(id);
  }

  function pipeKeydown(event){
    if (ctx.tool !== "pipe" || !ctx.pipeDraft) return false;
    if (event.key === "Escape") {
      ctx.pipeDraft = null;
      return true;
    }
    if (event.key === "Delete" && ctx.pipeDraft.rewire) {
      event.preventDefault();
      ctx.removeShape(ctx.pipeDraft.rewire.pipeId);
      ctx.pipeDraft = null;
      return true;
    }
    if (event.key === "Backspace" || (event.key.toLowerCase() === "z" && (event.ctrlKey || event.metaKey))) {
      event.preventDefault();
      if (ctx.pipeDraft.points.length) ctx.pipeDraft.points.pop();
      else ctx.pipeDraft = null;
      return true;
    }
    return false;
  }

  function setPipeWidth(value){
    ctx.pipeThickness = value;
    ctx.editKey = "pipeWidth";
    for (const shape of ctx.selectedShapes) if (shape.kind === "pipe") shape.width = value;
  }

  function setMedium(value){
    ctx.pipeMedium = value;
    for (const shape of ctx.selectedShapes) if (shape.kind === "pipe" || HYDRONIC_ELEMENTS[shape.type]?.bar) shape.medium = value;
  }

  function reversePipes(){
    for (const pipe of ctx.selectedShapes) {
      if (pipe.kind !== "pipe") continue;
      const from = $state.snapshot(pipe.from);
      pipe.from = $state.snapshot(pipe.to);
      pipe.to = from;
      pipe.points = $state.snapshot(pipe.points ?? []).reverse();
      if (pipe.anchors) pipe.anchors = { from: $state.snapshot(pipe.anchors.to), to: $state.snapshot(pipe.anchors.from) };
      pipe.fittings = (pipe.fittings ?? []).map((fitting) => ({ ...$state.snapshot(fitting), t: ctx.round4(1 - fitting.t) }));
    }
  }

  function tidyPipes(){
    const ids = ctx.selectedShapes.filter((shape) => keepsCorners(shape)).map((shape) => shape.id);
    if (!ids.length) return;
    const keepFittings = holdFittings();
    let done = 0;
    for (const id of ids) {
      const result = tidyPipe($state.snapshot(ctx.shapes), id);
      if (!result) continue;
      Object.assign(ctx.shapeById(id), result);
      done += 1;
    }
    keepFittings();
    ctx.showFileNotice(done === ids.length ? `Tidied ${done} pipe${done === 1 ? "" : "s"}` : `Tidied ${done} of ${ids.length} pipes · the others have no free path around the equipment`);
  }

  function pipeLayer(up){
    const ids = ctx.selectedShapes.filter((shape) => shape.kind === "pipe").map((shape) => shape.id);
    if (!ids.length) return;
    const moving = ctx.shapes.filter((shape) => ids.includes(shape.id));
    const rest = ctx.shapes.filter((shape) => !ids.includes(shape.id));
    ctx.shapes = up ? [...rest, ...moving] : [...moving, ...rest];
  }

  function attachedEnds(element){
    return ctx.shapes.filter((shape) => shape.kind === "pipe").map((pipe) => ({ pipe, from: $state.snapshot(pipe.from), to: $state.snapshot(pipe.to) }));
  }

  function remapEnds(element, entries, original){
    for (const entry of entries) {
      for (const key of ["from", "to"]) {
        const end = entry[key];
        if (!end || end.id !== element.id) continue;
        const horizontal = end.side === "top" || end.side === "bottom";
        entry.pipe[key] = { ...end, offset: scaledOffset(end.offset, horizontal ? original.width : original.height, horizontal ? element.width : element.height, portStep(element)) };
      }
    }
  }

  function keptCorners(pipe, end){
    const route = ctx.pipeRoutes.get(pipe.id);
    if (!route || route.length < 3) return { points: [], follow: null };
    const ordered = (end === "from" ? [...route].reverse() : route).map((point) => ({ x: point.x, y: point.y }));
    const tip = ordered[ordered.length - 1];
    let corners = ordered.slice(1, -1);
    let near = tip;
    const last = corners[corners.length - 1];
    if (Math.hypot(last.x - tip.x, last.y - tip.y) <= 20.5 && endpointPose(pipe[end], ctx.shapeIndex, (id) => ctx.pipeRoutes.get(id), last)?.normal) {
      near = last;
      corners = corners.slice(0, -1);
    }
    if (!corners.length) return { points: [], follow: null };
    const corner = corners[corners.length - 1];
    const follow = Math.abs(corner.y - near.y) < 0.5 ? "y" : Math.abs(corner.x - near.x) < 0.5 ? "x" : null;
    return { points: corners, follow };
  }

  function followEnd(){
    const draft = ctx.pipeDraft;
    if (!draft?.follow || !draft.points.length) return;
    const spot = ctx.portTarget?.point ?? ctx.pipeCursor;
    if (spot) draft.points[draft.points.length - 1][draft.follow] = ctx.round2(spot[draft.follow]);
  }

  function beginPipeEndDrag(event, pipe, end){
    if (isLeg(pipe)) {
      ctx.beginLegDrag(event, pipe, end);
      return;
    }
    const original = $state.snapshot(pipe[end]);
    const fixed = $state.snapshot(end === "from" ? pipe.to : pipe.from);
    const { points, follow } = keptCorners(pipe, end);
    const junction = original?.pipe !== undefined;
    const free = isFreeEnd(original);
    const start = ctx.toCanvas(event);
    if (!start || !fixed) return;
    let moved = false;
    ctx.selectedId = null;
    ctx.clearSubSelection();
    ctx.pipeDraft = { from: fixed, points, follow, rewire: { pipeId: pipe.id, end } };
    ctx.cursor = ctx.snapPoint(start);
    ctx.aim = start;

    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const raw = ctx.toCanvas(next);
        if (!raw) return;
        if (!moved && Math.hypot(raw.x - start.x, raw.y - start.y) * ctx.viewport.zoom < 4) return;
        moved = true;
        ctx.aim = raw;
        ctx.cursor = ctx.snapPoint(raw);
        followEnd();
      },
      onend: () => {
        const target = moved ? ctx.portTarget : null;
        const spot = ctx.pipeCursor ? { x: ctx.pipeCursor.x, y: ctx.pipeCursor.y } : null;
        const snapshot = $state.snapshot(ctx.pipeDraft);
        ctx.pipeDraft = null;
        ctx.cursor = null;
        if (!snapshot) return;
        if (!moved) {
          if (!junction && !free) ctx.removeShape(pipe.id);
          return;
        }
        const valid = target && !sameEnd(endOf(target), snapshot.from) && !(target.pipe !== undefined && target.pipe === snapshot.from.pipe);
        if (valid) finishRewire(snapshot, endOf(target));
        else if (!junction && spot && !sameEnd(spot, snapshot.from)) finishRewire(snapshot, spot);
        else if (!junction) ctx.removeShape(pipe.id);
      }
    });
  }

  function beginPipeVertexDrag(event, pipe, index){
    const route = ctx.pipeRoutes.get(pipe.id);
    if (!route) return;
    const path = editablePath(route);
    const keepFittings = holdFittings();
    if (event.altKey) {
      pipe.points = storedPoints(path.filter((_, entry) => entry !== index));
      markCorners(pipe, path);
      return;
    }
    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const raw = ctx.toCanvas(next);
        if (!raw) return;
        pipe.points = storedPoints(dragVertex(path, index, ctx.snapPoint(raw)));
        markCorners(pipe, path);
        keepFittings();
      },
      onend: () => ctx.history.endGesture()
    });
  }

  function beginPipeEdgeDrag(event, pipe, index){
    const route = ctx.pipeRoutes.get(pipe.id);
    const start = ctx.toCanvas(event);
    if (!route || !start) return;
    const path = editablePath(route);
    const keepFittings = holdFittings();
    const step = ctx.snapToGrid ? ctx.gridSize : 1;
    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const point = ctx.toCanvas(next);
        if (!point) return;
        const delta = { x: Math.round((point.x - start.x) / step) * step, y: Math.round((point.y - start.y) / step) * step };
        pipe.points = storedPoints(dragEdge(path, index, delta));
        markCorners(pipe, path);
        keepFittings();
      },
      onend: () => ctx.history.endGesture()
    });
  }

  function nearestHydronicPipe(point, size){
    const radius = Math.max(24, 30 / ctx.viewport.zoom);
    let best = null;
    for (const [pipeId, route] of ctx.pipeRoutes) {
      const candidate = ctx.shapeById(pipeId);
      if (!candidate || candidate.locked || familyOf(mediumOf(candidate.medium)) !== "hydronic") continue;
      const hit = projectOnRoute(route, point, size);
      if (hit && hit.gap <= radius && (!best || hit.gap < best.hit.gap)) best = { pipe: candidate, hit };
    }
    return best;
  }

  function beginWaypointDrag(event, pipe, index){
    if (event.altKey) {
      pipe.points = pipe.points.filter((_, entry) => entry !== index);
      return;
    }
    ctx.history.beginGesture();
    dragPointer(ctx.svgEl, event, {
      onmove: (next) => {
        const raw = ctx.toCanvas(next);
        if (raw) pipe.points[index] = ctx.snapPoint(raw);
      },
      onend: () => ctx.history.endGesture()
    });
  }

  return { routeBox, pipeTargetAt, flashPipe, holdFittings, settleCorners, markCorners, finishRewire, pipeClick, pipeKeydown, setPipeWidth, setMedium, reversePipes, tidyPipes, pipeLayer, attachedEnds, remapEnds, keptCorners, followEnd, beginPipeEndDrag, beginPipeVertexDrag, beginPipeEdgeDrag, nearestHydronicPipe, beginWaypointDrag };
}
