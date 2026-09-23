<script>
  import { base } from "$app/paths";
  import { prefersReducedMotion } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import { untrack } from "svelte";
  import Toolbar from "$lib/components/Toolbar.svelte";
  import ZoomControls from "$lib/components/ZoomControls.svelte";
  import { Viewport } from "$lib/canvas/viewport.svelte.js";
  import { MIN_GRID_PX } from "$lib/canvas/coords.js";
  import { panZoom } from "$lib/canvas/panZoom.js";
  import RoomLayer from "$lib/components/RoomLayer.svelte";
  import CurveLayer from "$lib/components/CurveLayer.svelte";
  import VertexHandles from "$lib/components/VertexHandles.svelte";
  import ToolOptions from "$lib/components/ToolOptions.svelte";
  import RoomNameEditor from "$lib/components/RoomNameEditor.svelte";
  import PenPreview from "$lib/components/PenPreview.svelte";
  import { samePoint, rectPoints, constrainOrtho, nearestVertex, wouldCross, closingCrosses, removeCollinear, polygonSelfIntersects, polygonBounds, maxCornerRadius, distance, pointInPolygon } from "$lib/tools/polygon.js";
  import { isRoomTool, isPolygonTool, isRoomShape, roomKindLabel, nextRoomName, describeRoom, snapVertices, snapToEdges, labelPoint, layered, roomsToSvg, VERTEX_SNAP_PX, ROOM_STYLE, thermostatRect, thermostatFit, thermostatGlobalScale } from "$lib/tools/rooms.js";
  import { hasCurves, outlinePoints, segmentCurved } from "$lib/tools/path.js";
  import { History } from "$lib/history.svelte.js";
  import { alignOffsets, distributeOffsets, contains, ALIGN_ACTIONS, DISTRIBUTE_ACTIONS } from "$lib/tools/align.js";
  import { ROOM_CATEGORIES, defaultCategoryColors } from "$lib/tools/categories.js";
  import { suggestDoor, projectDoor, doorGeometry, maxDoorWidth, MIN_DOOR_WIDTH } from "$lib/tools/doors.js";
  import DoorLayer from "$lib/components/DoorLayer.svelte";
  import ImageLayer from "$lib/components/ImageLayer.svelte";
  import ImageFrame from "$lib/components/ImageFrame.svelte";
  import { floorClosure } from "$lib/tools/floorClose.js";
  import { furnishOffice, furnishForCategory, FURNISHABLE, usableRect, wallSides } from "$lib/tools/populate.js";
  import { FURNITURE, furnitureFits, newFurniture } from "$lib/tools/furniture.js";
  import ElementBar from "$lib/components/ElementBar.svelte";
  import PlacementGhost from "$lib/components/PlacementGhost.svelte";
  import ThermostatLayer from "$lib/components/ThermostatLayer.svelte";
  import WallLayer from "$lib/components/WallLayer.svelte";
  import AppSwitcher from "$lib/components/AppSwitcher.svelte";
  import CanvasNotice from "$lib/components/CanvasNotice.svelte";
  import { WALL_STYLE, describeWall, openEnds } from "$lib/tools/walls.js";
  import { APPS, appById } from "$lib/apps.js";
  import { describeCurve, curveToSvg } from "$lib/tools/curve.js";
  import { loadFlag, saveFlag, loadText, saveText } from "$lib/settings.js";
  import { shapeBox, translateShape, clampDelta, dragPointer, unionBox } from "$lib/tools/move.js";
  import { atviseDocument } from "$lib/export/atvise.js";

  const GEAR_SIZE = 512;
  const GEAR_PATH = "M256 0c-14.1 0-27.9 1.1-41.4 3.3l-9.9 47.2c-5.1 1.6-10.1 3.4-15 5.4L153.4 26.2c-24.7 11-47.3 25.9-67 43.9l24.4 41.6c-3.6 3.8-7 7.8-10.3 11.9L57.6 111c-15.5 21.4-27.6 45.4-35.5 71.2l38.6 29.2c-1 5.2-1.8 10.5-2.4 15.8L11 241.8c-0.7 4.7-1 9.4-1 14.2s0.3 9.5 1 14.2l47.3 14.6c0.6 5.3 1.4 10.6 2.4 15.8l-38.6 29.2c7.9 25.8 20 49.8 35.5 71.2l42.9-12.6c3.3 4.1 6.7 8.1 10.3 11.9l-24.4 41.6c19.7 18 42.3 32.9 67 43.9l36.3-29.7c4.9 2 9.9 3.8 15 5.4l9.9 47.2c13.5 2.2 27.3 3.3 41.4 3.3s27.9-1.1 41.4-3.3l9.9-47.2c5.1-1.6 10.1-3.4 15-5.4l36.3 29.7c24.7-11 47.3-25.9 67-43.9l-24.4-41.6c3.6-3.8 7-7.8 10.3-11.9l42.9 12.6c15.5-21.4 27.6-45.4 35.5-71.2l-38.6-29.2c1-5.2 1.8-10.5 2.4-15.8l47.3-14.6c0.7-4.7 1-9.4 1-14.2s-0.3-9.5-1-14.2l-47.3-14.6c-0.6-5.3-1.4-10.6-2.4-15.8l38.6-29.2c-7.9-25.8-20-49.8-35.5-71.2l-42.9 12.6c-3.3-4.1-6.7-8.1-10.3-11.9l24.4-41.6c-19.7-18-42.3-32.9-67-43.9l-36.3 29.7c-4.9-2-9.9-3.8-15-5.4l-9.9-47.2C283.9 1.1 270.1 0 256 0zm0 160a96 96 0 1 1 0 192 96 96 0 0 1 0-192z";

  const FA_GEAR_PATH = "M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z";

  const TOOLS = [
    { id: "select", label: "Select", hint: "Pick a shape, then Delete to remove it" },
    { id: "line", label: "Line", hint: "Click two points for a Manhattan trace" },
    { id: "rect", label: "Rectangle", hint: "Click two opposite corners" }
  ];

  const ELBOWS = [
    { id: "h", label: "Horizontal first" },
    { id: "v", label: "Vertical first" },
    { id: "zh", label: "Split horizontally" },
    { id: "zv", label: "Split vertically" }
  ];

  const ELBOW_ORDER = ELBOWS.map((option) => option.id);

  let canvasWidth = $state(1920);
  let canvasHeight = $state(1125);

  let gridSize = $state(20);
  let majorEvery = $state(5);
  let showGrid = $state(true);
  let snapToGrid = $state(true);

  let gridMinorColor = $state("#E2E8F0");
  let gridMajorColor = $state("#CBD5E1");
  let canvasFill = $state("#FFFFFF");

  let lineColor = $state("#2563EB");
  let lineWidth = $state(2);
  let rectStroke = $state("#0F172A");
  let rectFill = $state("#BFDBFE");
  let rectFilled = $state(true);

  let roomFill = $state(ROOM_STYLE.roomFill);
  let roomStroke = $state(ROOM_STYLE.roomStroke);
  let roomLabelColor = $state(ROOM_STYLE.labelColor);
  let floorFill = $state(ROOM_STYLE.floorFill);
  let floorStroke = $state(ROOM_STYLE.floorStroke);
  let categoryColors = $state(defaultCategoryColors());
  let furnitureOpacity = $state(0.5);
  let floorWallWidth = $state(ROOM_STYLE.floorWidth);
  let roomWallWidth = $state(ROOM_STYLE.roomWidth);
  let wallStroke = $state(WALL_STYLE.stroke);
  let wallWidth = $state(WALL_STYLE.width);
  let roomStyle = $derived({
    ...ROOM_STYLE, roomFill, roomStroke, labelColor: roomLabelColor, floorFill, floorStroke,
    floorWidth: floorWallWidth || ROOM_STYLE.floorWidth,
    roomWidth: roomWallWidth || ROOM_STYLE.roomWidth,
    categories: categoryColors,
    furnitureOpacity,
    wallStroke,
    wallWidth: wallWidth || WALL_STYLE.width
  });
  let showToolHints = $state(loadFlag("pathfinder.showToolHints", true));
  $effect(() => saveFlag("pathfinder.showToolHints", showToolHints));
  let elementsOpen = $state(loadFlag("pathfinder.elementsOpen", false));
  $effect(() => saveFlag("pathfinder.elementsOpen", elementsOpen));
  let app = $state(loadText("pathfinder.app", "floorplan"));
  $effect(() => saveText("pathfinder.app", app));
  let currentApp = $derived(appById(app));

  let tool = $state("select");
  let elbow = $state("h");

  let shapes = $state([]);
  let draft = $state(null);
  let cursor = $state(null);
  let selectedId = $state(null);
  let nextId = 1;

  let svgEl;

  let majorSize = $derived(gridSize * Math.max(2, majorEvery));
  let showMinorGrid = $derived(showGrid && gridSize >= 6);
  let drawing = $derived(tool !== "select" && tool !== "pan");
  let activeHint = $derived(TOOLS.find((entry) => entry.id === tool)?.hint ?? "");

  function clamp(value, max){
    return Math.min(max, Math.max(0, value));
  }

  function snapValue(value, max){
    const stepped = snapToGrid ? Math.round(value / gridSize) * gridSize : Math.round(value);
    return clamp(stepped, max);
  }

  function snapPoint(point){
    return { x: snapValue(point.x, canvasWidth), y: snapValue(point.y, canvasHeight) };
  }

  function toCanvas(event){
    const matrix = svgEl?.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return viewport.toWorld({ x: point.x, y: point.y });
  }

  const viewport = new Viewport();
  let sidebarOpen = $state(false);
  let fitted = false;

  function fitContent(){
    viewport.fit({ x: 0, y: 0, width: canvasWidth, height: canvasHeight });
  }

  $effect(() => {
    if (fitted || viewport.width === 0 || viewport.height === 0) return;
    fitted = true;
    fitContent();
  });

  function manhattan(from, to, mode){
    if (from.x === to.x || from.y === to.y) return [from, to];

    if (mode === "v") return [from, { x: from.x, y: to.y }, to];

    if (mode === "zh") {
      const x = snapValue((from.x + to.x) / 2, canvasWidth);
      return [from, { x, y: from.y }, { x, y: to.y }, to];
    }

    if (mode === "zv") {
      const y = snapValue((from.y + to.y) / 2, canvasHeight);
      return [from, { x: from.x, y }, { x: to.x, y }, to];
    }

    return [from, { x: to.x, y: from.y }, to];
  }

  function rectBetween(from, to){
    return {
      x: Math.min(from.x, to.x),
      y: Math.min(from.y, to.y),
      width: Math.abs(to.x - from.x),
      height: Math.abs(to.y - from.y)
    };
  }

  let ghost = $derived.by(() => {
    if (!draft || !cursor) return null;
    if (isRoomTool(draft.kind) || draft.kind === "curve" || draft.kind === "pen") return null;
    if (draft.kind === "line") {
      return { kind: "line", points: manhattan(draft.start, cursor, elbow) };
    }
    return { kind: "rect", ...rectBetween(draft.start, cursor) };
  });

  function pathFor(points){
    return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  }

  function traceLength(points){
    let total = 0;
    for (let index = 1; index < points.length; index += 1) {
      total += Math.abs(points[index].x - points[index - 1].x);
      total += Math.abs(points[index].y - points[index - 1].y);
    }
    return total;
  }

  function describe(shape){
    if (shape.kind === "wall") return describeWall(shape);
    if (isRoomShape(shape)) return describeRoom(shape);
    if (shape.kind === "curve") return describeCurve(shape);
    if (shape.kind === "image") return `Reference image · ${Math.round(shape.opacity * 100)}% opacity`;
    if (shape.kind === "line") {
      const start = shape.points[0];
      const end = shape.points[shape.points.length - 1];
      return `${start.x},${start.y} → ${end.x},${end.y} · ${traceLength(shape.points)} long`;
    }
    return `${shape.x},${shape.y} · ${shape.width} × ${shape.height}`;
  }

  function handleMove(event){
    pointer = toCanvas(event);
    if (!drawing) return;
    const raw = toCanvas(event);
    if (raw) cursor = snapPoint(raw);
    if (raw && isRoomTool(tool)) cursor = roomPoint(raw, event);
    if (raw && tool === "curve") cursor = roomPoint(raw, event);
  }

  function handleLeave(){
    cursor = null;
    pointer = null;
  }

  function handleDown(event){
    if (event.button !== 0) return;

    if (!drawing) {
      if (tool === "select" && beginMove(event)) return;
      if (tool === "select" && beginMarquee(event)) return;
      selectedId = null;
      return;
    }

    const raw = toCanvas(event);
    if (!raw) return;
    const point = snapPoint(raw);
    cursor = point;

    if (tool === "place") {
      placeElement(event);
      return;
    }

    if (isRoomTool(tool)) {
      roomClick(roomPoint(raw, event));
      return;
    }

    if (tool === "curve") {
      penDown(event, roomPoint(raw, event));
      return;
    }

    if (!draft) {
      draft = { kind: tool, start: point };
      return;
    }

    commit(point);
  }

  function commit(point){
    if (draft.kind === "line") {
      if (point.x === draft.start.x && point.y === draft.start.y) {
        draft = null;
        return;
      }
      shapes.push({ id: nextId++, kind: "line", points: manhattan(draft.start, point, elbow) });
    } else {
      const box = rectBetween(draft.start, point);
      if (box.width === 0 || box.height === 0) {
        draft = null;
        return;
      }
      shapes.push({ id: nextId++, kind: "rect", ...box });
    }
    draft = null;
  }

  const history = new History();
  let editKey = null;

  $effect(() => {
    const current = JSON.stringify(shapes);
    untrack(() => {
      history.observe(current, editKey);
      editKey = null;
    });
  });

  function restore(state){
    if (state === null) return;
    shapes = JSON.parse(state);
    draft = null;
  }

  function redo(){
    restore(history.redo());
  }

  function round2(value){
    return Math.round(value * 100) / 100;
  }

  function constrainAngle(vector){
    const length = Math.hypot(vector.x, vector.y);
    const angle = Math.round(Math.atan2(vector.y, vector.x) / (Math.PI / 4)) * (Math.PI / 4);
    return { x: Math.cos(angle) * length, y: Math.sin(angle) * length };
  }

  let selectedIds = $state([]);
  let selectedPoints = $state([]);
  let selectedEdges = $state([]);

  function shapeById(id){
    return shapes.find((shape) => shape.id === id);
  }

  let selectionIds = $derived.by(() => {
    if (selectedId === null) return [];
    const ids = selectedIds.includes(selectedId) ? selectedIds : [selectedId];
    return ids.filter((id) => shapes.some((shape) => shape.id === id && !shape.locked));
  });
  let selectedShapes = $derived(selectionIds.map(shapeById));
  let selectedShape = $derived(shapeById(selectedId));
  let selectedRoom = $derived(shapes.find((shape) => shape.id === selectedId && shape.kind === "room"));
  let activePoints = $derived(selectedPoints.filter((key) => selectionIds.includes(key.id) && shapeById(key.id)?.points?.[key.index]));
  let activeEdges = $derived(selectedEdges.filter((key) => selectionIds.includes(key.id) && shapeById(key.id)?.points?.[key.index]));
  // let editableShapes = $derived(tool === "select"
  //   ? selectedShapes.filter((shape) => ["floor", "room", "curve"].includes(shape.kind) && (!shape.groupId || selectionIds.length === 1))
  //   : []);
  let editableShapes = $derived(tool === "select"
    ? selectedShapes.filter((shape) => ["floor", "room", "curve", "wall"].includes(shape.kind) && (!shape.groupId || selectionIds.length === 1))
    : []);
  let selectedImages = $derived(tool === "select" ? selectedShapes.filter((shape) => shape.kind === "image") : []);

  function sameKey(a, b){
    return a.id === b.id && a.index === b.index;
  }

  function toggleKey(list, key){
    return list.some((entry) => sameKey(entry, key)) ? list.filter((entry) => !sameKey(entry, key)) : [...list, key];
  }

  function clearSubSelection(){
    selectedPoints = [];
    selectedEdges = [];
    selectedDoor = null;
    selectedFurniture = null;
  }

  function withGroups(ids){
    const groups = new Set(ids.map((id) => shapeById(id)?.groupId).filter(Boolean));
    const members = shapes.filter((shape) => groups.has(shape.groupId) && !shape.locked).map((shape) => shape.id);
    return [...new Set([...ids, ...members])];
  }

  function selectShape(id, additive = false, deep = false){
    const members = deep ? [id] : withGroups([id]);
    if (!additive) {
      selectedIds = members;
      selectedId = id;
      clearSubSelection();
      return true;
    }
    if (selectionIds.includes(id)) {
      selectedIds = selectionIds.filter((entry) => !members.includes(entry));
      selectedId = selectedIds[selectedIds.length - 1] ?? null;
      return false;
    }
    selectedIds = [...selectionIds, ...members.filter((entry) => !selectionIds.includes(entry))];
    selectedId = id;
    return true;
  }

  function selectionUnits(){
    const units = new Map();
    for (const shape of selectedShapes) {
      const grouped = shape.groupId && selectedShapes.filter((entry) => entry.groupId === shape.groupId).length > 1;
      const key = grouped ? `g${shape.groupId}` : `s${shape.id}`;
      if (!units.has(key)) units.set(key, []);
      units.get(key).push(shape);
    }
    return [...units.values()];
  }

  function groupSelection(){
    if (selectionUnits().length < 2) return;
    const groupId = nextId++;
    for (const shape of selectedShapes) shape.groupId = groupId;
  }

  function ungroupSelection(){
    for (const shape of selectedShapes) delete shape.groupId;
    const counts = new Map();
    for (const shape of shapes) if (shape.groupId) counts.set(shape.groupId, (counts.get(shape.groupId) ?? 0) + 1);
    for (const shape of shapes) if (shape.groupId && counts.get(shape.groupId) < 2) delete shape.groupId;
  }

  function selectAll(){
    if (shapes.length === 0) return;
    selectedIds = shapes.filter((shape) => !shape.locked).map((shape) => shape.id);
    selectedId = selectedIds[selectedIds.length - 1] ?? null;
    clearSubSelection();
  }

  function cornerCurved(shape, index){
    const count = shape.points.length;
    return segmentCurved(shape, (index - 1 + count) % count) || segmentCurved(shape, index);
  }

  let selectedPointCount = $derived(pointGroup().length);
  let unitCount = $derived(selectionUnits().length);

  let selection = $derived.by(() => {
    if (selectionIds.length === 0) return null;
    const shape = selectedShape ?? selectedShapes[0];
    const kindLabel = shape.kind === "line" ? "Trace" : shape.kind === "rect" ? "Rectangle" : roomKindLabel(shape.kind);
    const corners = activePoints
      .map((key) => ({ shape: shapeById(key.id), index: key.index }))
      .filter((entry) => entry.shape.kind === "floor" || entry.shape.kind === "room" || (entry.shape.kind === "wall" && !entry.shape.open));
    const limits = corners.map((entry) => cornerCurved(entry.shape, entry.index) ? 0 : maxCornerRadius(entry.shape.points, entry.index));
    return {
      count: selectionIds.length,
      shape,
      kindLabel,
      legacy: shape.kind === "line" || shape.kind === "rect",
      points: activePoints.length,
      edges: activeEdges.length,
      radius: corners.length ? corners[0].shape.radii?.[corners[0].index] ?? 0 : 0,
      maxRadius: limits.length ? Math.min(...limits) : 0,
      canAlign: selectedPointCount >= 2 || selectionIds.length >= 1,
      canDistribute: selectedPointCount >= 3 || (selectedPointCount < 2 && unitCount >= 3),
      alignTarget: selectedPointCount >= 2 ? "each other" : unitCount === 1 ? "the display" : "the selection",
      grouped: selectionIds.length > 1 && unitCount === 1,
      canGroup: unitCount >= 2,
      canUngroup: selectedShapes.some((entry) => entry.groupId),
      thermostat: thermostatState(selectedShapes),
      furnish: selectionIds.length === 1 && shape.kind === "room"
        ? { supported: FURNISHABLE.includes(shape.category), count: shape.furniture?.length ?? 0 }
        : null,
      roomCount: selectedShapes.filter((entry) => entry.kind === "room").length,
      category: commonCategory(selectedShapes)
    };
  });

  function setCornerRadius(value){
    editKey = "radius";
    for (const key of activePoints) {
      const shape = shapeById(key.id);
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
    const keys = [...activePoints];
    for (const edge of activeEdges) {
      const shape = shapeById(edge.id);
      for (const index of [edge.index, (edge.index + 1) % shape.points.length]) {
        const key = { id: edge.id, index };
        if (!keys.some((entry) => sameKey(entry, key))) keys.push(key);
      }
    }
    return keys.map((key) => {
      const shape = shapeById(key.id);
      return { shape, index: key.index, original: { x: shape.points[key.index].x, y: shape.points[key.index].y } };
    });
  }

  function snapCandidates(group){
    const skip = new Set(group.map((entry) => `${entry.shape.id}:${entry.index}`));
    const candidates = [];
    for (const shape of shapes) {
      if (!isRoomShape(shape)) continue;
      shape.points.forEach((point, index) => {
        if (!skip.has(`${shape.id}:${index}`)) candidates.push(point);
      });
    }
    return candidates;
  }

  function applyPointDelta(group, dx, dy){
    const delta = clampDelta(polygonBounds(group.map((entry) => entry.original)), dx, dy, canvasWidth, canvasHeight);
    const byShape = new Map();
    for (const entry of group) {
      if (!byShape.has(entry.shape)) byShape.set(entry.shape, entry.shape.points.map((point) => ({ x: point.x, y: point.y })));
      byShape.get(entry.shape)[entry.index] = { x: round2(entry.original.x + delta.dx), y: round2(entry.original.y + delta.dy) };
    }
    for (const [shape, points] of byShape) {
      if (shape.kind !== "curve" && !shape.open && polygonSelfIntersects(outlinePoints({ ...shape, points }))) return false;
    }
    for (const [shape, points] of byShape) shape.points = points;
    return true;
  }

  let lastPress = { id: null, time: 0 };

  function beginMove(event){
    const target = event.target instanceof Element ? event.target.closest("[data-shape-id]") : null;
    const shape = target ? shapeById(Number(target.dataset.shapeId)) : null;
    if (!shape) return false;
    const additive = event.ctrlKey || event.metaKey;

    if (target.dataset.furnitureId !== undefined) {
      beginFurnitureDrag(event, shape, Number(target.dataset.furnitureId));
      return true;
    }
    if (target.dataset.imageHandle) {
      beginImageScale(event, shape, target.dataset.imageHandle);
      return true;
    }
    if (target.dataset.thermostat !== undefined) {
      beginThermostatDrag(event, shape);
      return true;
    }
    if (target.dataset.doorId !== undefined) {
      beginDoorDrag(event, shape, Number(target.dataset.doorId));
      return true;
    }
    if (target.dataset.handle) {
      beginHandleDrag(event, shape, Number(target.dataset.vertexIndex), target.dataset.handle);
      return true;
    }
    if (target.dataset.vertexIndex !== undefined) {
      beginPointDrag(event, shape, Number(target.dataset.vertexIndex), additive);
      return true;
    }
    if (target.dataset.edgeIndex !== undefined) {
      beginEdgeDrag(event, shape, Number(target.dataset.edgeIndex), additive);
      return true;
    }

    const now = performance.now();
    const repeated = !additive && lastPress.id === shape.id && now - lastPress.time < 400;
    lastPress = additive ? { id: null, time: 0 } : { id: shape.id, time: repeated ? 0 : now };
    if (repeated && shape.kind === "room") {
      selectShape(shape.id);
      renameRoom();
      return true;
    }

    const deep = event.altKey && !!shape.groupId;
    const wasSelected = selectionIds.includes(shape.id) && !deep;
    if (additive) {
      if (!selectShape(shape.id, true)) return true;
    } else if (deep) {
      selectShape(shape.id, false, true);
    } else if (!wasSelected) {
      selectShape(shape.id);
    } else {
      selectedIds = selectionIds;
      selectedId = shape.id;
      clearSubSelection();
    }

    const start = toCanvas(event);
    if (!start) return true;
    const group = selectionIds.map(shapeById).map((entry) => ({ shape: entry, original: $state.snapshot(entry) }));
    const box = unionBox(group.map((entry) => shapeBox(entry.original)));
    const step = snapToGrid ? gridSize : 1;
    let moved = false;

    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const point = toCanvas(next);
        if (!point) return;
        const delta = clampDelta(box,
          Math.round((point.x - start.x) / step) * step,
          Math.round((point.y - start.y) / step) * step,
          canvasWidth, canvasHeight);
        if (delta.dx !== 0 || delta.dy !== 0) moved = true;
        for (const entry of group) Object.assign(entry.shape, translateShape(entry.original, delta.dx, delta.dy));
      },
      onend: () => {
        history.endGesture();
        if (!moved && !additive && wasSelected && selectionIds.length > 1) selectShape(shape.id);
      }
    });
    return true;
  }

  function beginPointDrag(event, shape, index, additive){
    const key = { id: shape.id, index };
    if (event.altKey && shape.kind !== "curve") {
      beginAnchorConvert(event, shape, index);
      return;
    }

    const wasSelected = activePoints.some((entry) => sameKey(entry, key));
    if (shape.kind !== "curve") {
      if (additive) {
        selectedPoints = toggleKey(activePoints, key);
        selectedEdges = activeEdges;
        if (wasSelected) return;
      } else if (!wasSelected) {
        selectedPoints = [key];
        selectedEdges = [];
      }
    }

    const group = shape.kind === "curve"
      ? [{ shape, index, original: { x: shape.points[index].x, y: shape.points[index].y } }]
      : pointGroup();
    const anchor = group.find((entry) => entry.shape === shape && entry.index === index).original;
    const candidates = snapCandidates(group);
    let moved = false;

    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const raw = toCanvas(next);
        if (!raw) return;
        const radius = VERTEX_SNAP_PX / viewport.zoom;
        const target = nearestVertex(raw, candidates, radius) ?? snapToEdges(raw, shapes, radius, shape, snapPoint(raw)) ?? snapPoint(raw);
        if (!samePoint(target, anchor)) moved = true;
        applyPointDelta(group, target.x - anchor.x, target.y - anchor.y);
      },
      onend: () => {
        history.endGesture();
        if (!moved && !additive && wasSelected && activePoints.length > 1) selectedPoints = [key];
      }
    });
  }

  function beginEdgeDrag(event, shape, index, additive){
    const key = { id: shape.id, index };
    const wasSelected = activeEdges.some((entry) => sameKey(entry, key));
    if (additive) {
      selectedEdges = toggleKey(activeEdges, key);
      selectedPoints = activePoints;
      if (wasSelected) return;
    } else if (!wasSelected) {
      selectedEdges = [key];
      selectedPoints = [];
    }

    const group = pointGroup();
    const a = shape.points[index];
    const b = shape.points[(index + 1) % shape.points.length];
    const length = distance(a, b);
    const normal = length === 0 ? { x: 0, y: 0 } : { x: -(b.y - a.y) / length, y: (b.x - a.x) / length };
    const base = normal.x * a.x + normal.y * a.y;
    const others = snapCandidates(group).map((point) => normal.x * point.x + normal.y * point.y - base);
    const start = toCanvas(event);
    const step = snapToGrid ? gridSize : 1;
    let moved = false;

    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const point = toCanvas(next);
        if (!point || !start) return;
        let dx = point.x - start.x;
        let dy = point.y - start.y;
        if (!next.altKey && length > 0) {
          const raw = dx * normal.x + dy * normal.y;
          const radius = VERTEX_SNAP_PX / viewport.zoom;
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
        history.endGesture();
        if (!moved && !additive && wasSelected && activeEdges.length > 1) selectedEdges = [key];
      }
    });
  }

  function beginHandleDrag(event, shape, index, side){
    const other = side === "in" ? "out" : "in";
    const anchor = { x: shape.points[index].x, y: shape.points[index].y };

    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const raw = toCanvas(next);
        if (!raw) return;
        let vector = { x: raw.x - anchor.x, y: raw.y - anchor.y };
        if (next.shiftKey) vector = constrainAngle(vector);
        vector = { x: round2(vector.x), y: round2(vector.y) };
        const handle = { ...$state.snapshot(shape.handles[index]) };
        handle[side] = vector;
        if (next.altKey) handle.smooth = false;
        if (handle.smooth && handle[other]) {
          const keep = Math.hypot(handle[other].x, handle[other].y);
          const size = Math.hypot(vector.x, vector.y) || 1;
          handle[other] = { x: round2(-vector.x / size * keep), y: round2(-vector.y / size * keep) };
        }
        shape.handles[index] = handle;
      },
      onend: () => history.endGesture()
    });
  }

  function beginAnchorConvert(event, shape, index){
    const existing = shape.handles?.[index];
    const anchor = { x: shape.points[index].x, y: shape.points[index].y };
    selectedPoints = [{ id: shape.id, index }];
    selectedEdges = [];
    let pulled = false;

    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const raw = toCanvas(next);
        if (!raw) return;
        let vector = { x: raw.x - anchor.x, y: raw.y - anchor.y };
        if (Math.hypot(vector.x, vector.y) * viewport.zoom < 4) return;
        if (next.shiftKey) vector = constrainAngle(vector);
        vector = { x: round2(vector.x), y: round2(vector.y) };
        ensureHandles(shape);
        shape.handles[index] = { in: { x: -vector.x, y: -vector.y }, out: vector, smooth: true };
        pulled = true;
      },
      onend: () => {
        if (!pulled && existing) shape.handles[index] = null;
        history.endGesture();
      }
    });
  }

  function deletePoints(){
    const byShape = new Map();
    for (const key of activePoints) {
      if (!byShape.has(key.id)) byShape.set(key.id, []);
      byShape.get(key.id).push(key.index);
    }
    const removed = [];
    for (const [id, indices] of byShape) {
      const shape = shapeById(id);
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
    if (removed.length) shapes = shapes.filter((shape) => !removed.includes(shape.id));
    selectedPoints = [];
  }

  function deleteSelection(){
    const ids = selectionIds;
    shapes = shapes.filter((shape) => !ids.includes(shape.id));
    selectedId = null;
    clearSubSelection();
  }

  let targetChoice = $state(null);
  let shapeTarget = $derived(targetChoice ?? (shapes.length === 0 ? "floor" : "room"));

  let marquee = $state(null);

  function beginMarquee(event){
    const start = toCanvas(event);
    if (!start) return false;
    const additive = event.ctrlKey || event.metaKey || event.shiftKey;
    const base = additive ? [...selectionIds] : [];
    if (!additive) {
      selectedId = null;
      clearSubSelection();
    }

    dragPointer(svgEl, event, {
      onmove: (next) => {
        const point = toCanvas(next);
        if (!point) return;
        const box = {
          x: Math.min(start.x, point.x),
          y: Math.min(start.y, point.y),
          width: Math.abs(point.x - start.x),
          height: Math.abs(point.y - start.y)
        };
        if (box.width * viewport.zoom < 3 && box.height * viewport.zoom < 3) return;
        marquee = box;
        const hits = withGroups(shapes.filter((shape) => !shape.locked && contains(box, shapeBox(shape))).map((shape) => shape.id));
        const ids = [...base, ...hits.filter((id) => !base.includes(id))];
        selectedIds = ids;
        selectedId = ids[ids.length - 1] ?? null;
        clearSubSelection();
      },
      onend: () => {
        marquee = null;
      }
    });
    return true;
  }

  function movePointsTo(group, positions){
    const byShape = new Map();
    group.forEach((entry, index) => {
      if (!byShape.has(entry.shape)) byShape.set(entry.shape, entry.shape.points.map((point) => ({ x: point.x, y: point.y })));
      byShape.get(entry.shape)[entry.index] = { x: round2(positions[index].x), y: round2(positions[index].y) };
    });
    for (const [shape, points] of byShape) {
      if (shape.kind !== "curve" && !shape.open && polygonSelfIntersects(outlinePoints({ ...shape, points }))) return;
    }
    for (const [shape, points] of byShape) shape.points = points;
  }

  function moveShapesBy(group, offsets){
    group.forEach((shape, index) => {
      const { dx, dy } = offsets[index];
      if (dx === 0 && dy === 0) return;
      Object.assign(shape, translateShape($state.snapshot(shape), round2(dx), round2(dy)));
    });
  }

  function pointBoxes(group){
    return group.map((entry) => ({ x: entry.original.x, y: entry.original.y, width: 0, height: 0 }));
  }

  function shiftPoints(group, offsets){
    movePointsTo(group, group.map((entry, index) => ({ x: entry.original.x + offsets[index].dx, y: entry.original.y + offsets[index].dy })));
  }

  function alignSelection(mode){
    const points = pointGroup();
    if (points.length >= 2) {
      const boxes = pointBoxes(points);
      shiftPoints(points, alignOffsets(boxes, mode, unionBox(boxes)));
      return;
    }
    const units = selectionUnits();
    if (units.length === 0) return;
    const boxes = units.map((members) => unionBox(members.map(shapeBox)));
    const frame = units.length === 1 ? { x: 0, y: 0, width: canvasWidth, height: canvasHeight } : unionBox(boxes);
    moveUnitsBy(units, alignOffsets(boxes, mode, frame));
  }

  function moveUnitsBy(units, offsets){
    units.forEach((members, index) => moveShapesBy(members, members.map(() => offsets[index])));
  }

  function distributeSelection(axis){
    const points = pointGroup();
    if (points.length >= 3) {
      shiftPoints(points, distributeOffsets(pointBoxes(points), axis));
      return;
    }
    const units = selectionUnits();
    if (points.length >= 2 || units.length < 3) return;
    moveUnitsBy(units, distributeOffsets(units.map((members) => unionBox(members.map(shapeBox))), axis));
  }

  function thermostatState(list){
    const rooms = list.filter((entry) => entry.kind === "room");
    const on = rooms.filter((entry) => entry.regulated).length;
    return on === 0 ? "none" : on === rooms.length ? "all" : "mixed";
  }

  function setThermostat(on){
    for (const shape of selectedShapes) {
      if (shape.kind !== "room") continue;
      if (on) shape.regulated = true;
      else delete shape.regulated;
    }
  }

  function beginThermostatDrag(event, room){
    if (!selectionIds.includes(room.id)) selectShape(room.id, false, true);
    const start = toCanvas(event);
    if (!start) return;
    const original = { ...(room.thermostat ?? { dx: 0, dy: 0 }) };
    const step = snapToGrid ? gridSize / 2 : 1;
    const globalScale = thermostatGlobalScale(shapes, roomStyle);

    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const point = toCanvas(next);
        if (!point) return;
        const candidate = {
          dx: original.dx + Math.round((point.x - start.x) / step) * step,
          dy: original.dy + Math.round((point.y - start.y) / step) * step
        };
        if (thermostatFit({ ...room, thermostat: candidate }, roomStyle) >= globalScale - 0.001) room.thermostat = candidate;
      },
      onend: () => history.endGesture()
    });
  }

  let imageSources = $state.raw({});
  let imageInput;

  function openImagePicker(){
    imageInput?.click();
  }

  function readImage(file){
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => addImage(reader.result);
    reader.readAsDataURL(file);
  }

  const CLIPBOARD_PREFIX = "pathfinder-shapes:";
  let clipboardShapes = null;
  let clipboardToken = "";
  let pasteCount = 0;
  let clipboardFurniture = null;
  let pointer = null;
  let pasteKey = null;

  function typingInto(target){
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
  }

  function copyFurniture(event){
    if (!activeFurniture) return false;
    clipboardFurniture = { roomId: activeFurniture.room.id, item: $state.snapshot(activeFurniture.item) };
    clipboardShapes = null;
    clipboardToken = `${Date.now()}`;
    pasteCount = 0;
    pasteKey = null;
    event.clipboardData?.setData("text/plain", CLIPBOARD_PREFIX + clipboardToken);
    event.preventDefault();
    return true;
  }

  function pasteFurniture(){
    const source = clipboardFurniture.item;
    const hovered = pointer ? roomAt(pointer) : null;
    const atPointer = !!hovered && !hovered.locked && hovered.id !== clipboardFurniture.roomId;
    const room = atPointer ? hovered : shapeById(clipboardFurniture.roomId);
    if (!room || room.kind !== "room" || room.locked) return;
    const step = snapToGrid ? gridSize : 20;
    const origin = atPointer
      ? { cx: Math.round(pointer.x / step) * step, cy: Math.round(pointer.y / step) * step }
      : { cx: source.cx, cy: source.cy };
    const key = atPointer ? `${room.id}:${origin.cx}:${origin.cy}` : "source";
    if (key !== pasteKey) {
      pasteKey = key;
      pasteCount = 0;
    }
    pasteCount += 1;
    const first = atPointer ? pasteCount - 1 : pasteCount;

    for (let ring = first; ring < first + 40; ring += 1) {
      for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const candidate = { ...source, cx: round2(origin.cx + sx * ring * step), cy: round2(origin.cy + sy * ring * step) };
        if (!furnitureFits(room, candidate)) continue;
        const id = nextId++;
        room.furniture = [...(room.furniture ?? []), { ...candidate, id }];
        if (tool !== "select") pickTool("select");
        selectedId = null;
        clearSubSelection();
        selectedFurniture = { roomId: room.id, itemId: id };
        return;
      }
    }
  }

  function handleCopy(event){
    if (!typingInto(event.target) && copyFurniture(event)) return;
    if (typingInto(event.target) || selectionIds.length === 0) return;
    clipboardFurniture = null;
    clipboardShapes = $state.snapshot(selectedShapes);
    clipboardToken = `${Date.now()}`;
    pasteCount = 0;
    event.clipboardData?.setData("text/plain", CLIPBOARD_PREFIX + clipboardToken);
    event.preventDefault();
  }

  function handleCut(event){
    handleCopy(event);
    // if (event.defaultPrevented) deleteSelection();
    if (!event.defaultPrevented) return;
    if (clipboardFurniture && activeFurniture) removeFurniture();
    else deleteSelection();
  }

  function copyName(name, taken){
    if (/^Room \d+$/.test(name)) return nextRoomName(taken);
    let candidate = `${name} copy`;
    let index = 2;
    while (taken.some((shape) => shape.kind === "room" && shape.name === candidate)) candidate = `${name} copy ${index++}`;
    return candidate;
  }

  function pasteShapes(){
    const present = clipboardShapes.some((source) => shapes.some((shape) => shape.id === source.id));
    pasteCount += 1;
    const step = (snapToGrid ? gridSize : 20) * 2;
    const offset = step * (present ? pasteCount : pasteCount - 1);
    const groups = new Map();
    const created = [];

    for (const source of clipboardShapes) {
      const copy = { ...structuredClone(source), ...translateShape(source, offset, offset), id: nextId++ };
      delete copy.locked;
      if (copy.groupId) {
        if (!groups.has(copy.groupId)) groups.set(copy.groupId, nextId++);
        copy.groupId = groups.get(copy.groupId);
      }
      if (copy.doors) copy.doors = copy.doors.map((door) => ({ ...door, id: nextId++ }));
      if (copy.furniture) copy.furniture = copy.furniture.map((item) => ({ ...item, id: nextId++ }));
      if (copy.kind === "room") copy.name = copyName(copy.name, [...shapes, ...created]);
      created.push(copy);
    }

    if (tool !== "select") pickTool("select");
    shapes.push(...created);
    selectedIds = created.map((shape) => shape.id);
    selectedId = selectedIds[selectedIds.length - 1] ?? null;
    clearSubSelection();
  }

  function handlePaste(event){
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
    const text = event.clipboardData?.getData("text/plain");
    if (clipboardFurniture && text === CLIPBOARD_PREFIX + clipboardToken) {
      event.preventDefault();
      pasteFurniture();
      return;
    }
    if (clipboardShapes && text === CLIPBOARD_PREFIX + clipboardToken) {
      event.preventDefault();
      pasteShapes();
      return;
    }
    const item = [...(event.clipboardData?.items ?? [])].find((entry) => entry.type.startsWith("image/"));
    if (!item) return;
    event.preventDefault();
    readImage(item.getAsFile());
  }

  function imageFit(width, height){
    const scale = Math.min(canvasWidth / width, canvasHeight / height);
    const fitWidth = round2(width * scale);
    const fitHeight = round2(height * scale);
    return { x: round2((canvasWidth - fitWidth) / 2), y: round2((canvasHeight - fitHeight) / 2), width: fitWidth, height: fitHeight };
  }

  function addImage(source){
    const probe = new Image();
    probe.onload = () => {
      const imageId = `image_${nextId++}`;
      imageSources = { ...imageSources, [imageId]: source };
      const shape = { id: nextId++, kind: "image", imageId, ...imageFit(probe.naturalWidth, probe.naturalHeight), opacity: 0.5 };
      shapes.push(shape);
      if (tool !== "select") pickTool("select");
      selectShape(shape.id);
    };
    probe.src = source;
  }

  function fitImage(){
    const image = selectedShape?.kind === "image" ? selectedShape : null;
    if (image) Object.assign(image, imageFit(image.width, image.height));
  }

  function setImageOpacity(value){
    if (selectedShape?.kind !== "image") return;
    editKey = "opacity";
    selectedShape.opacity = value;
  }

  function beginImageScale(event, image, corner){
    const original = { x: image.x, y: image.y, width: image.width, height: image.height };
    const aspect = original.width / original.height;
    const left = corner.includes("w");
    const top = corner.includes("n");
    const anchor = { x: left ? original.x + original.width : original.x, y: top ? original.y + original.height : original.y };

    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const point = toCanvas(next);
        if (!point) return;
        const width = Math.max(20, Math.abs(point.x - anchor.x));
        const height = next.shiftKey ? Math.max(20, Math.abs(point.y - anchor.y)) : width / aspect;
        Object.assign(image, {
          x: round2(left ? anchor.x - width : anchor.x),
          y: round2(top ? anchor.y - height : anchor.y),
          width: round2(width),
          height: round2(height)
        });
      },
      onend: () => history.endGesture()
    });
  }

  function lockSelection(){
    for (const shape of selectedShapes) shape.locked = true;
    selectedId = null;
    clearSubSelection();
  }

  let selectedDoor = $state(null);

  let activeDoor = $derived.by(() => {
    if (!selectedDoor || tool !== "select") return null;
    const room = shapeById(selectedDoor.roomId);
    const door = room?.doors?.find((entry) => entry.id === selectedDoor.doorId);
    return room && door && !room.locked ? { room, door } : null;
  });

  let doorOptions = $derived(activeDoor ? {
    roomName: activeDoor.room.name,
    hinge: activeDoor.door.hinge,
    swing: activeDoor.door.swing,
    width: activeDoor.door.width,
    maxWidth: Math.max(MIN_DOOR_WIDTH, maxDoorWidth(activeDoor.room, activeDoor.door.edge))
  } : null);

  function commonCategory(list){
    const categories = new Set(list.filter((entry) => entry.kind === "room").map((entry) => entry.category ?? ""));
    return categories.size === 1 ? [...categories][0] : "mixed";
  }

  function setCategory(value){
    if (value === "mixed") return;
    for (const shape of selectedShapes) {
      if (shape.kind !== "room") continue;
      if (value) shape.category = value;
      else delete shape.category;
    }
  }

  let doorsPlaced = $state(null);
  let doorsTimer;

  function placeDoors(){
    let count = 0;
    for (const room of shapes) {
      if (room.kind !== "room" || room.doors?.length) continue;
      const door = suggestDoor(room, shapes);
      if (!door) continue;
      room.doors = [{ id: nextId++, ...door }];
      count += 1;
    }
    doorsPlaced = count;
    furnishedRooms = null;
    clearTimeout(doorsTimer);
    doorsTimer = setTimeout(() => doorsPlaced = null, 2000);
  }

  function doorCenter(room, door){
    const geometry = doorGeometry(room, door);
    return geometry ? { x: (geometry.p0.x + geometry.p1.x) / 2, y: (geometry.p0.y + geometry.p1.y) / 2 } : null;
  }

  function beginDoorDrag(event, room, doorId){
    selectedId = null;
    clearSubSelection();
    selectedDoor = { roomId: room.id, doorId };
    const door = room.doors.find((entry) => entry.id === doorId);
    const start = toCanvas(event);
    const center = door ? doorCenter(room, door) : null;
    if (!door || !start || !center) return;

    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const point = toCanvas(next);
        if (!point) return;
        const placed = projectDoor(room, { x: center.x + point.x - start.x, y: center.y + point.y - start.y }, door.width);
        if (!placed) return;
        door.edge = placed.edge;
        door.t = placed.t;
      },
      onend: () => history.endGesture()
    });
  }

  function updateDoor(patch){
    if (!activeDoor) return;
    const { room, door } = activeDoor;
    const center = doorCenter(room, door);
    Object.assign(door, patch);
    if (patch.width && center) {
      const placed = projectDoor(room, center, door.width);
      if (placed) {
        door.edge = placed.edge;
        door.t = placed.t;
      }
    }
  }

  function removeDoor(){
    if (!activeDoor) return;
    const { room, door } = activeDoor;
    room.doors = room.doors.filter((entry) => entry.id !== door.id);
    selectedDoor = null;
  }

  let selectedFurniture = $state(null);

  let activeFurniture = $derived.by(() => {
    if (!selectedFurniture || tool !== "select") return null;
    const room = shapeById(selectedFurniture.roomId);
    const item = room?.furniture?.find((entry) => entry.id === selectedFurniture.itemId);
    return room && item && !room.locked ? { room, item } : null;
  });

  let furnitureOptions = $derived(activeFurniture ? {
    label: FURNITURE[activeFurniture.item.type]?.label ?? activeFurniture.item.type,
    roomName: activeFurniture.room.name
  } : null);

  function furnishRoom(room){
    room.furniture = furnishForCategory(room, roomStyle).map((item) => ({ ...item, id: nextId++ }));
    return room.furniture.length;
  }

  function furnishSelected(){
    if (selectedShape?.kind === "room" && FURNISHABLE.includes(selectedShape.category)) furnishRoom(selectedShape);
  }

  function clearFurniture(){
    if (selectedShape?.kind === "room") delete selectedShape.furniture;
  }

  let furnishedRooms = $state(null);
  let furnishTimer;

  let notice = $derived(doorsPlaced !== null
    ? doorsPlaced === 0 ? "Every room already has a door" : `Placed ${doorsPlaced} door${doorsPlaced === 1 ? "" : "s"}`
    : furnishedRooms !== null
      ? furnishedRooms === 0 ? "Nothing to furnish · set room categories first" : `Furnished ${furnishedRooms} room${furnishedRooms === 1 ? "" : "s"}`
      : null);

  function furnishOffices(){
    let count = 0;
    for (const room of shapes) {
      if (room.kind !== "room" || !FURNISHABLE.includes(room.category) || room.furniture?.length) continue;
      if (furnishRoom(room) > 0) count += 1;
    }
    furnishedRooms = count;
    doorsPlaced = null;
    clearTimeout(furnishTimer);
    furnishTimer = setTimeout(() => furnishedRooms = null, 2000);
  }

  function beginFurnitureDrag(event, room, itemId){
    selectedId = null;
    clearSubSelection();
    selectedFurniture = { roomId: room.id, itemId };
    const item = room.furniture.find((entry) => entry.id === itemId);
    const start = toCanvas(event);
    if (!item || !start) return;
    const origin = { cx: item.cx, cy: item.cy };
    const step = snapToGrid ? gridSize / 2 : 1;

    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const point = toCanvas(next);
        if (!point) return;
        const candidate = {
          ...item,
          cx: round2(origin.cx + Math.round((point.x - start.x) / step) * step),
          cy: round2(origin.cy + Math.round((point.y - start.y) / step) * step)
        };
        if (!furnitureFits(room, candidate)) return;
        item.cx = candidate.cx;
        item.cy = candidate.cy;
      },
      onend: () => history.endGesture()
    });
  }

  function rotateFurniture(){
    if (!activeFurniture) return;
    const { item } = activeFurniture;
    item.rotation = (item.rotation + 90) % 360;
  }

  function removeFurniture(){
    if (!activeFurniture) return;
    const { room, item } = activeFurniture;
    room.furniture = room.furniture.filter((entry) => entry.id !== item.id);
    selectedFurniture = null;
  }

  let placing = $state(null);

  function startPlacing(type){
    pickTool("place");
    placing = { type, rotation: 0, auto: true };
  }

  function rotatePlacing(){
    if (!placing) return;
    placing.rotation = (placing.rotation + 90) % 360;
    placing.auto = false;
  }

  function roomAt(point){
    const rooms = shapes.filter((shape) => shape.kind === "room");
    for (let index = rooms.length - 1; index >= 0; index -= 1) {
      if (pointInPolygon(point, outlinePoints(rooms[index]))) return rooms[index];
    }
    return null;
  }

  function snapFurnitureToWall(room, item){
    const rect = usableRect(room, roomStyle.roomWidth / 2 + 2);
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
      cx: round2(side.origin.x + side.t.x * along + side.n.x * spec.depth / 2),
      cy: round2(side.origin.y + side.t.y * along + side.n.y * spec.depth / 2),
      rotation: side.rotation
    };
  }

  function doorPlacement(point){
    const radius = Math.max(60, 40 / viewport.zoom);
    const inside = roomAt(point);
    const rooms = shapes.filter((shape) => shape.kind === "room");
    let best = null;
    for (const room of rooms) {
      for (const width of [90, 70]) {
        const placed = projectDoor(room, point, width);
        if (!placed) continue;
        const door = { edge: placed.edge, t: placed.t, width, hinge: "left", swing: "in" };
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

  let placement = $derived.by(() => {
    if (tool !== "place" || !placing || !cursor) return null;
    if (placing.type === "door") return doorPlacement(cursor);
    const room = roomAt(cursor);
    let item = newFurniture(placing.type, cursor.x, cursor.y, placing.rotation);
    if (room && placing.auto && FURNITURE[placing.type].wall) item = snapFurnitureToWall(room, item);
    return { kind: "furniture", room, item, valid: !!room && furnitureFits(room, item) };
  });

  let placingOptions = $derived(tool === "place" && placing ? {
    label: placing.type === "door" ? "Door" : FURNITURE[placing.type].label,
    hint: placing.type === "door"
      ? "Click near a wall to place the door on it · Shift keeps placing · Esc stops"
      : "Click inside a room to place it · snaps flush to walls · Shift keeps placing · Esc stops"
  } : null);

  function placeElement(event){
    const target = placement;
    if (!target?.valid) return;
    const id = nextId++;
    if (target.kind === "door") target.room.doors = [...(target.room.doors ?? []), { id, ...target.door }];
    else target.room.furniture = [...(target.room.furniture ?? []), { id, ...target.item }];
    if (event.shiftKey) return;

    const roomId = target.room.id;
    pickTool("select");
    selectedId = null;
    clearSubSelection();
    if (target.kind === "door") selectedDoor = { roomId, doorId: id };
    else selectedFurniture = { roomId, itemId: id };
  }

  function appKeydown(event){
    const ctrl = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    if (!ctrl && event.shiftKey && event.code === "Digit1") {
      event.preventDefault();
      fitContent();
      return true;
    }
    if (!ctrl && event.shiftKey && event.code === "Digit0") {
      event.preventDefault();
      viewport.resetZoom();
      return true;
    }
    if (ctrl && (key === "y" || (event.shiftKey && key === "z"))) {
      event.preventDefault();
      redo();
      return true;
    }
    if (ctrl && key === "g") {
      event.preventDefault();
      if (event.shiftKey) ungroupSelection();
      else groupSelection();
      return true;
    }
    if (ctrl && event.shiftKey && key === "l") {
      event.preventDefault();
      lockSelection();
      return true;
    }
    if (ctrl && event.shiftKey) {
      const align = ALIGN_ACTIONS.find((action) => action.code === event.code);
      const spread = DISTRIBUTE_ACTIONS.find((action) => action.code === event.code);
      if (align || spread) {
        event.preventDefault();
        if (align) alignSelection(align.id);
        else distributeSelection(spread.axis);
        return true;
      }
    }
    if (ctrl && key === "a") {
      event.preventDefault();
      if (tool !== "select") pickTool("select");
      selectAll();
      return true;
    }
    if (tool === "place" && !ctrl && key === "r") {
      event.preventDefault();
      rotatePlacing();
      return true;
    }
    if (event.key === "Escape") {
      if (tool === "place") pickTool("select");
      clearSubSelection();
      renamingId = null;
      return false;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      if (activeFurniture) {
        event.preventDefault();
        removeFurniture();
        return true;
      }
      if (activeDoor) {
        event.preventDefault();
        removeDoor();
        return true;
      }
      if (activePoints.length > 0) {
        event.preventDefault();
        deletePoints();
        return true;
      }
      if (selectionIds.length > 1) {
        event.preventDefault();
        deleteSelection();
        return true;
      }
    }
    return false;
  }

  let renamingId = $state(null);
  let renamingRoom = $derived(shapes.find((shape) => shape.id === renamingId && shape.kind === "room"));
  let renamePosition = $derived(renamingRoom ? viewport.toScreen(labelPoint(renamingRoom)) : null);

  function setRoomName(room, value){
    const name = value.trim();
    room.name = name || nextRoomName(shapes.filter((shape) => shape !== room));
  }

  function commitRename(value){
    const room = renamingRoom;
    renamingId = null;
    if (room) setRoomName(room, value);
  }

  function renameRoom(){
    renamingId = selectedId;
  }

  function commitRoomName(event){
    if (!selectedRoom) return;
    const name = event.currentTarget.value.trim();
    selectedRoom.name = name || nextRoomName(shapes.filter((shape) => shape !== selectedRoom));
  }

  function roomPoint(raw, event){
    const point = snapPoint(raw);
    const last = draft?.points && (isPolygonTool(draft.kind) || draft.kind === "pen") ? draft.points[draft.points.length - 1] : null;
    const radius = VERTEX_SNAP_PX / viewport.zoom;
    const vertex = nearestVertex(raw, snapVertices(shapes, draft), radius);
    if (vertex && (!event.shiftKey || !last || vertex.x === last.x || vertex.y === last.y)) return vertex;
    if (event.shiftKey && last) return constrainOrtho(last, point);
    return snapToEdges(raw, shapes, Math.max(radius, roomStyle.floorWidth / 2 + 1), null, point) ?? point;
  }

  function roomClick(point){
    cursor = point;

    if (!draft) {
      draft = { kind: tool, start: point, points: [point], target: shapeTarget };
      return;
    }

    if (draft.kind === "room-rect") {
      const points = rectPoints(draft.start, point);
      // if (points) shapes.push(draft.target === "floor"
      //   ? { id: nextId++, kind: "floor", points }
      //   : { id: nextId++, kind: "room", name: nextRoomName(shapes), points });
      if (points) shapes.push(draft.target === "wall"
        ? { id: nextId++, kind: "wall", points }
        : draft.target === "floor"
          ? { id: nextId++, kind: "floor", points }
          : { id: nextId++, kind: "room", name: nextRoomName(shapes), points });
      draft = null;
      return;
    }

    const last = draft.points[draft.points.length - 1];
    if (samePoint(point, last) || samePoint(point, draft.start)) {
      // if (draft.points.length >= 3) finishPolygon();
      if (draft.target === "wall" && samePoint(point, last) && !samePoint(point, draft.start) && draft.points.length >= 2) finishPolygon(null, true);
      else if (draft.points.length >= 3) finishPolygon();
      return;
    }

    // if (draft.kind !== "floor" && draft.target !== "floor") {
    if (draft.kind !== "floor" && draft.target !== "floor" && draft.target !== "wall") {
      const closure = floorClosure($state.snapshot(draft.points), point, floorOutlines);
      if (closure) {
        finishPolygon(closure.points);
        return;
      }
    }

    if (wouldCross(draft.points, point)) return;
    draft.points.push(point);
  }

  let floorOutlines = $derived(shapes.filter((shape) => shape.kind === "floor").map(outlinePoints));

  let floorPreview = $derived.by(() => {
    if (!draft?.points || !cursor || draft.dragging) return null;
    if ((draft.kind !== "room-poly" && draft.kind !== "pen") || draft.target === "floor" || draft.target === "wall") return null;
    const last = draft.points[draft.points.length - 1];
    if (samePoint(cursor, last) || samePoint(cursor, draft.start)) return null;
    return floorClosure($state.snapshot(draft.points), cursor, floorOutlines);
  });

  function finishPolygon(closed = null, open = false){
    // if (!closed && (!draft?.points || draft.points.length < 3 || closingCrosses(draft.points))) return;
    // const points = removeCollinear(closed ?? $state.snapshot(draft.points));
    if (!closed && (!draft?.points || draft.points.length < (open ? 2 : 3) || (!open && closingCrosses(draft.points)))) return;
    const points = open ? $state.snapshot(draft.points) : removeCollinear(closed ?? $state.snapshot(draft.points));
    if (open) {
      shapes.push({ id: nextId++, kind: "wall", points, open: true });
    } else if (points.length >= 3 && draft.target === "wall") {
      shapes.push({ id: nextId++, kind: "wall", points });
    } else if (points.length >= 3) {
      shapes.push(draft.kind === "floor" || draft.target === "floor"
        ? { id: nextId++, kind: "floor", points }
        : { id: nextId++, kind: "room", name: nextRoomName(shapes), points });
    }
    draft = null;
  }


  function penDown(event, point){
    cursor = point;

    if (!draft) {
      draft = { kind: "pen", start: point, points: [point], handles: [null], dragging: false, target: shapeTarget };
      pullPenHandle(event, 0, false);
      return;
    }

    const last = draft.points[draft.points.length - 1];
    if (draft.points.length >= 2 && samePoint(point, draft.start)) {
      pullPenHandle(event, 0, true);
      return;
    }
    if (samePoint(point, last)) {
      // finishPen();
      finishPen(null, draft.target === "wall");
      return;
    }

    // if (draft.target !== "floor") {
    if (draft.target !== "floor" && draft.target !== "wall") {
      const closure = floorClosure($state.snapshot(draft.points), point, floorOutlines);
      if (closure) {
        finishPen(closure.points);
        return;
      }
    }

    draft.points.push(point);
    draft.handles.push(null);
    pullPenHandle(event, draft.points.length - 1, false);
  }

  function pullPenHandle(event, index, closing){
    const anchor = { x: draft.points[index].x, y: draft.points[index].y };
    draft.dragging = true;

    dragPointer(svgEl, event, {
      onmove: (next) => {
        if (!draft) return;
        const raw = toCanvas(next);
        if (!raw) return;
        let vector = { x: raw.x - anchor.x, y: raw.y - anchor.y };
        if (Math.hypot(vector.x, vector.y) * viewport.zoom < 4) return;
        if (next.shiftKey) vector = constrainAngle(vector);
        vector = { x: round2(vector.x), y: round2(vector.y) };
        draft.handles[index] = { in: { x: -vector.x, y: -vector.y }, out: vector, smooth: true };
      },
      onend: () => {
        if (!draft) return;
        draft.dragging = false;
        if (closing) finishPen();
      }
    });
  }

  function finishPen(closed = null, open = false){
    if (!draft || draft.kind !== "pen") return;
    const snapshot = $state.snapshot(draft);
    const points = closed ?? snapshot.points;
    // const handles = closed ? [...snapshot.handles, ...closed.slice(snapshot.handles.length).map(() => null)] : snapshot.handles;
    const handles = closed ? [...snapshot.handles, ...closed.slice(snapshot.handles.length).map(() => null)] : open ? openEnds(snapshot.handles) : snapshot.handles;
    const curved = handles.some(Boolean);
    // if (points.length < (curved ? 2 : 3)) return;
    if (points.length < (curved || open ? 2 : 3)) return;
    // const shape = { id: nextId++, kind: draft.target === "floor" ? "floor" : "room", points };
    const shape = { id: nextId++, kind: draft.target === "floor" ? "floor" : draft.target === "wall" ? "wall" : "room", points };
    if (open) shape.open = true;
    if (curved) shape.handles = handles;
    if (shape.kind === "room") shape.name = nextRoomName(shapes);
    shapes.push(shape);
    draft = null;
  }

  function roomKeydown(event){
    if (!draft?.points || !(isPolygonTool(draft.kind) || draft.kind === "pen")) return false;

    if (event.key === "Enter") {
      event.preventDefault();
      // if (draft.kind === "pen") finishPen();
      // else finishPolygon();
      if (draft.kind === "pen") finishPen(null, draft.target === "wall");
      else finishPolygon(null, draft.target === "wall");
      return true;
    }

    const undoKey = event.key.toLowerCase() === "z" && (event.ctrlKey || event.metaKey);
    if (event.key === "Backspace" || undoKey) {
      event.preventDefault();
      draft.points.pop();
      draft.handles?.pop();
      if (draft.points.length === 0) draft = null;
      return true;
    }

    return false;
  }

  function cycleElbow(step){
    const index = ELBOW_ORDER.indexOf(elbow);
    elbow = ELBOW_ORDER[(index + step + ELBOW_ORDER.length) % ELBOW_ORDER.length];
  }

  function pickTool(next){
    tool = next;
    draft = null;
    if (next !== "select") selectedId = null;
  }

  function removeShape(id){
    shapes = shapes.filter((shape) => shape.id !== id);
    if (selectedId === id) selectedId = null;
  }

  function undo(){
    // shapes.pop();
    // selectedId = null;
    restore(history.undo());
  }

  let documents = {};

  function switchApp(id){
    if (id === app) return;
    documents[app] = { shapes: $state.snapshot(shapes), history: history.save() };
    const next = documents[id];
    pickTool("select");
    selectedId = null;
    selectedIds = [];
    clearSubSelection();
    placing = null;
    renamingId = null;
    targetChoice = null;
    history.load(next?.history ?? null);
    shapes = next?.shapes ?? [];
    app = id;
  }

  function clearAll(){
    shapes = [];
    draft = null;
    selectedId = null;
  }

  function handleKeydown(event){
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) return;

    if (roomKeydown(event)) return;
    if (appKeydown(event)) return;

    if (event.key === "Escape") {
      draft = null;
      selectedId = null;
      showDisplaySettings = false;
      return;
    }

    if (event.key.toLowerCase() === "z" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      undo();
      return;
    }

    if (event.key.toLowerCase() === "r" && tool === "line") {
      cycleElbow(event.shiftKey ? -1 : 1);
      return;
    }

    if ((event.key === "Delete" || event.key === "Backspace") && selectedId !== null) {
      event.preventDefault();
      removeShape(selectedId);
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) return;

    // const shortcut = { s: "select", h: "pan", f: "floor", b: "room-rect", p: "room-poly", c: "curve", l: "line", d: "rect" }[event.key.toLowerCase()];
    const shortcut = { s: "select", h: "pan", r: "room-rect", p: "room-poly", c: "curve" }[event.key.toLowerCase()];
    // if (shortcut) pickTool(shortcut);
    if (shortcut && currentApp.tools.includes(shortcut)) pickTool(shortcut);
  }

  function appear(node, { duration = 240, dy = 6 } = {}) {
    if (prefersReducedMotion.current) return { duration: 0 };
    return {
      duration,
      easing: cubicOut,
      css: (t, u) => `opacity: ${t}; transform: translate(0, ${u * dy}px);`
    };
  }

  function addRow(node, { duration = 220 } = {}) {
    if (prefersReducedMotion.current) return { duration: 0 };
    const height = parseFloat(getComputedStyle(node).height);
    return {
      duration,
      easing: cubicOut,
      css: (t, u) => `
        opacity: ${t};
        height: ${t * height}px;
        margin-top: ${u * -8}px;
        align-items: flex-start;
        overflow: hidden;
      `
    };
  }

  let showDisplaySettings = $state(false);
  let displaySettingsEl;

  function closeOnOutsideClick(event){
    if (showDisplaySettings && !displaySettingsEl?.contains(event.target)) {
      showDisplaySettings = false;
    }
  }

  function readHex(event, current){
    const value = event.currentTarget.value.trim();
    const next = /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : current;
    event.currentTarget.value = next;
    return next;
  }

  function buildSvg(){
    const body = [roomsToSvg(shapes, roomStyle, canvasFill), ...layered(shapes).filter((shape) => !isRoomShape(shape) && shape.kind !== "image" && shape.kind !== "wall").map((shape) => {
      if (shape.kind === "curve") return curveToSvg(shape, lineColor);
      if (shape.kind === "line") {
        return `<path d="${pathFor(shape.points)}" fill="none" id="trace_${shape.id}" stroke="${lineColor}" stroke-linecap="square" stroke-linejoin="miter" stroke-width="${lineWidth}"/>`;
      }
      return `<rect fill="${rectFilled ? rectFill : "none"}" height="${shape.height}" id="rect_${shape.id}" stroke="${rectStroke}" stroke-width="${lineWidth}" width="${shape.width}" x="${shape.x}" y="${shape.y}"/>`;
    })].filter(Boolean).join("\n  ");

    return atviseDocument(canvasWidth, canvasHeight, body);

    /*
    return atviseDocument(canvasWidth, canvasHeight,
      `<rect atv:refpx="${canvasWidth / 2}" atv:refpy="${canvasHeight / 2}" fill="${canvasFill}" height="${canvasHeight}" id="background" width="${canvasWidth}" x="0" y="0"/>
  ${body}`);
    */

    /*
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}" width="${canvasWidth}" xmlns="http://www.w3.org/2000/svg" xmlns:atv="http://webmi.atvise.com/2007/svgext">
  <rect fill="${canvasFill}" height="${canvasHeight}" id="background" width="${canvasWidth}" x="0" y="0"/>
  ${body}
</svg>`;
    */
  }

  let copySuccess = $state(false);
  let copyTimer;

  async function handleExport(){
    try {
      await navigator.clipboard.writeText(buildSvg());
      copySuccess = true;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => copySuccess = false, 2000);
    } catch (err) {
      console.log("Failed to copy:", err);
    }
  }
</script>

<style>
  :global(body) {
    height: 100dvh;
    width: 100vw;
    font-family: 'Segoe UI', Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f1f5f9;
    color: #0f172a;
    box-sizing: border-box;
    overflow: hidden;
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
  }

  .header{
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 44px;
    padding: 0 12px;
    gap: 16px;
    margin: 0;
    box-sizing: border-box;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    animation: rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    position: relative;
    z-index: 2;
  }

  .logo-section {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: #1E293B;

    .subtitle{
        font-size: 12px;
        color: #475569;
        font-weight: 500;
    }
  }

  .logo{
    height: 28px;
    margin-right: 8px;
  }

  .display-settings {
    position: relative;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
    margin-right: 10px;
  }

  button.header-action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  button.header-action svg {
    width: 18px;
    height: 18px;
  }

  button.header-action:hover:not(:disabled) {
    background: #eff6ff;
    border-color: #93c5fd;
    color: #1d4ed8;
  }

  button.header-action:disabled {
    color: #cbd5e1;
    cursor: not-allowed;
  }

  button.header-export {
    min-width: 128px;
    padding: 6px 14px;
    background: #2563eb;
    border: none;
    border-radius: 6px;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    color: #ffffff;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  button.header-export:hover:not(:disabled) {
    background: #1d4ed8;
  }

  button.header-export:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
  }

  button.header-export.copied {
    background: #16a34a;
  }

  button.header-action:focus-visible,
  button.header-export:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  .category-row .category-name {
    flex: 1 1 0;
    min-width: 0;
    font-size: 13px;
    color: #334155;
  }

  .category-head .field-hint {
    flex: 0 0 44px;
    text-align: center;
  }

  button.reset-categories {
    align-self: flex-start;
    padding: 4px 0;
    border: none;
    background: none;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    color: #2563eb;
    cursor: pointer;
  }

  button.reset-categories:hover {
    text-decoration: underline;
  }

  button.display-settings-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 32px;
    height: 32px;
    padding: 0;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    color: #2563eb;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  button.display-settings-toggle:hover,
  button.display-settings-toggle.open {
    background: #eff6ff;
    border-color: #93c5fd;
    color: #1d4ed8;
  }

  button.display-settings-toggle:focus-visible {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  .display-settings-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .display-settings-panel {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 20;
    width: 320px;
    max-height: calc(100dvh - 160px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
    box-sizing: border-box;
  }

  /*
  h2 {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    color: #334155;
  }
  */

  .app-layout {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr) auto;
    grid-template-areas: "tools stage panel";
    gap: 0;
    align-items: stretch;
    height: calc(100dvh - 44px);
    margin: 0;
  }

  .app-layout > :global(.toolbar) {
    grid-area: tools;
  }

  .viewer-section {
    grid-area: stage;
    height: 100%;
    background: #ffffff;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    box-sizing: border-box;
    min-height: 0;
    min-width: 0;
    animation: rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.18s both;
  }

  .viewer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    width: 100%;
    height: 40px;
    padding: 0 12px;
    margin-bottom: 0;
    border-bottom: 1px solid #e2e8f0;
    box-sizing: border-box;
  }

  .readout {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    font-variant-numeric: tabular-nums;
  }

  .readout .chip {
    padding: 4px 9px;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    background: #f8fafc;
  }

  .svg-container {
    position: relative;
    width: 100%;
    max-width: 100%;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    background: #e9eef4;
  }

  svg.preview-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    touch-action: none;
    user-select: none;
  }

  svg.preview-svg.drawing {
    cursor: crosshair;
  }

  .shape-hit {
    fill: none;
    stroke: transparent;
    stroke-width: 14;
    vector-effect: non-scaling-stroke;
    cursor: move;
  }

  svg.preview-svg.drawing .shape-hit {
    pointer-events: none;
  }

  svg.preview-svg:global([data-pan="ready"]) {
    cursor: grab;
  }

  svg.preview-svg:global([data-pan="active"]) {
    cursor: grabbing;
  }

  svg.preview-svg:global([data-pan]) .shape-hit {
    pointer-events: none;
  }

  button.panel-toggle {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #ffffff;
    color: #475569;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  button.panel-toggle:hover,
  button.panel-toggle.open {
    border-color: #93c5fd;
    background: #eff6ff;
    color: #1d4ed8;
  }

  button.panel-toggle:focus-visible {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  button.panel-toggle svg {
    width: 16px;
    height: 16px;
  }

  .selection-section {
    grid-area: panel;
    width: 320px;
    display: flex;
    height: 100%;
    flex-direction: column;
    gap: 16px;
    background: #ffffff;
    padding: 20px;
    border-left: 1px solid #e2e8f0;
    max-height: 100%;
    overflow-y: auto;
    box-sizing: border-box;
    min-height: 0;
    animation: rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.09s both;
  }

  .selection-section.collapsed {
    display: none;
  }

  .selection-section fieldset {
    min-width: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .header,
    .selection-section,
    .viewer-section {
      animation: none;
    }
  }

  .field-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
  }

  .field-row > .input-group,
  .field-row > input[type="text"],
  .field-row > select {
    flex: 1 1 0;
    min-width: 0;
  }

  .field-row > input[type="color"] {
    flex: 0 0 44px;
    width: 44px;
    height: 38px;
    padding: 2px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background-color: #FFFFFF;
    box-sizing: border-box;
    cursor: pointer;
  }

  .field-row > .row-sep {
    flex: 0 0 10px;
    text-align: center;
    font-size: 13px;
    color: #94a3b8;
  }

  fieldset {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #f8fafc;
    margin: 0;
  }

  legend {
    font-weight: 600;
    font-size: 13px;
    color: #334155;
    padding: 0 6px;
  }

  label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #334155;
    cursor: pointer;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    text-align: left;
    gap: 6px;
    font-weight: 600;
    font-size: 13px;
    color: #475569;
  }

  .input-group:has(input[type="range"]) {
    gap: 0;
  }

  .field-hint {
    font-weight: 400;
    font-size: 12px;
    color: #94a3b8;
  }

  .toolset {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  button.tool {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 10px 4px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background-color: #ffffff;
    color: #475569;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  button.tool:hover {
    border-color: #93c5fd;
    background-color: #eff6ff;
    color: #1d4ed8;
  }

  button.tool.active {
    border-color: #2563eb;
    background-color: #eff6ff;
    color: #1d4ed8;
    box-shadow: inset 0 0 0 1px #2563eb;
  }

  button.tool:focus-visible {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  button.tool .glyph {
    width: 26px;
    height: 26px;
  }

  .tool-hint {
    font-size: 12px;
    color: #94a3b8;
  }

  .shape-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #ffffff;
    font-size: 12px;
    color: #475569;
  }

  .shape-row.selected {
    border-color: #2563eb;
    background: #eff6ff;
  }

  .shape-row .kind {
    flex: 0 0 auto;
    padding: 2px 7px;
    border-radius: 999px;
    background: #e2e8f0;
    font-size: 11px;
    font-weight: 700;
    color: #334155;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  button.coords {
    flex: 1 1 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    text-align: left;
    border: none;
    background: none;
    font: inherit;
    color: inherit;
    padding: 0;
    cursor: pointer;
  }

  button.drop-shape {
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #ffffff;
    color: #94a3b8;
    font-family: inherit;
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  .image-input {
    display: none;
  }

  .group-tag {
    flex: 0 0 auto;
    padding: 1px 5px;
    border-radius: 4px;
    background: #eff6ff;
    font-size: 10px;
    font-weight: 700;
    color: #1d4ed8;
  }

  button.lock-shape {
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 6px;
    background: none;
    color: #cbd5e1;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  button.lock-shape svg {
    width: 13px;
    height: 13px;
  }

  .shape-row:hover button.lock-shape {
    color: #94a3b8;
  }

  button.lock-shape:hover {
    border-color: #93c5fd;
    background: #eff6ff;
    color: #1d4ed8;
  }

  button.lock-shape.locked {
    color: #0f172a;
  }

  .shape-row.locked-row button.coords {
    color: #94a3b8;
    cursor: default;
  }

  button.drop-shape:hover {
    border-color: #dc2626;
    background: #fef2f2;
    color: #dc2626;
  }

  .empty-hint {
    font-size: 12px;
    color: #94a3b8;
    font-style: italic;
  }

  .button-secition{
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  button.add-setting,
  button.remove-setting {
    display: flex;
    flex: 1 1 0;
    min-width: 0;
    height: 38px;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 6px;
    white-space: nowrap;
    border: 1px dashed #cbd5e1;
    border-radius: 6px;
    background-color: #ffffff;
    color: #475569;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    box-sizing: border-box;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  button.add-setting:hover:not(:disabled) {
    border-color: #2563eb;
    background-color: #eff6ff;
    color: #2563eb;
  }

  button.add-setting:focus-visible {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  button.remove-setting:hover:not(:disabled) {
    border-color: #dc2626;
    background-color: #fef2f2;
    color: #dc2626;
  }

  button.remove-setting:focus-visible {
    outline: none;
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.25);
  }

  button.add-setting:disabled,
  button.remove-setting:disabled {
    border-color: #e2e8f0;
    background-color: #f8fafc;
    color: #cbd5e1;
    cursor: not-allowed;
  }

  button.add-setting .plus,
  button.remove-setting .minus {
    font-size: 16px;
    line-height: 1;
  }

  input[type="range"] {
    --track-height: 6px;
    --track-border: 1px;
    --thumb-size: 12px;
    --thumb-border: 2px;

    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 20px;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
  }

  input[type="range"]::-webkit-slider-runnable-track {
    height: var(--track-height);
    border-radius: 999px;
    border: var(--track-border) solid #cbd5e1;
    background:
      linear-gradient(#2563eb, #2563eb) 0 / var(--fill, 50%) 100% no-repeat,
      #e2e8f0;
  }

  input[type="range"]::-moz-range-track {
    height: 6px;
    border-radius: 999px;
    border: 1px solid #cbd5e1;
    background: #e2e8f0;
  }

  input[type="range"]::-moz-range-progress {
    height: 6px;
    border-radius: 999px;
    background-color: #2563eb;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: var(--thumb-size);
    height: var(--thumb-size);
    margin-top: calc(
      (var(--track-height) + 2 * var(--track-border)
        - var(--thumb-size) - 2 * var(--thumb-border)) / 2
    );
    border-radius: 50%;
    background-color: #ffffff;
    border: 2px solid #2563eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }

  input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #ffffff;
    border: 2px solid #2563eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }

  input[type="range"]:hover::-webkit-slider-thumb {
    background-color: #eff6ff;
    border-color: #1d4ed8;
  }

  input[type="range"]:hover::-moz-range-thumb {
    background-color: #eff6ff;
    border-color: #1d4ed8;
  }

  input[type="range"]:active::-webkit-slider-thumb {
    background-color: #2563eb;
    transform: scale(1.1);
  }

  input[type="range"]:active::-moz-range-thumb {
    background-color: #2563eb;
    transform: scale(1.1);
  }

  input[type="range"]:focus {
    outline: none;
  }

  input[type="range"]:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  input[type="range"]:focus-visible::-moz-range-thumb {
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  .selection-section input[type="text"],
  .selection-section select,
  .display-settings-panel input[type="text"],
  .display-settings-panel input[type="number"],
  .display-settings-panel select {
    width: 100%;
    height: 38px;
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 14px;
    background-color: #FFFFFF;
    color: #0f172a;
    box-sizing: border-box;
    text-align: left;
  }

  label.checkbox {
    font-weight: 600;
    font-size: 13px;
    color: #475569;
  }

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #2563eb;
    cursor: pointer;
  }

  .spacer {
    flex: 1 1 auto;
    min-height: 0;
  }

  button.configure {
    flex: 0 0 auto;
    padding: 12px 16px;
    background-color: #2563eb;
    color: #ffffff;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    margin-top: 8px;
    transition: background-color 0.15s ease;
  }

  button.configure:hover:not(:disabled) {
    background-color: #1d4ed8;
  }

  button.configure:disabled {
    background-color: #cbd5e1;
    cursor: not-allowed;
  }

  button.configure.copied {
    background-color: #16a34a;
  }
</style>

<title>Pathfinder</title>

<svelte:window onclick={closeOnOutsideClick} onkeydown={handleKeydown} onpaste={handlePaste}
               oncopy={handleCopy} oncut={handleCut}/>

<div class="header">
  <div class="logo-section">
    <img class="logo" src="{base}/logo.svg" alt="Pathfinder logo">
    <div class="title">
      <div class="title" title="Grid Trace Editor {__APP_VERSION__} · commit {__APP_COMMIT__}">Pathfinder</div>
      <!-- <div class="subtitle" title="commit {__APP_COMMIT__}">Grid Trace Editor {__APP_VERSION__}</div> -->
    </div>
  </div>

  <AppSwitcher apps={APPS} current={app} onswitch={switchApp}/>

  <div class="header-actions">
    <!--
    <button class="header-action" type="button" onclick={placeDoors}
            disabled={!shapes.some((shape) => shape.kind === "room")}
            title="Place a door on every room that has none yet">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 21 H21"/>
        <path d="M6 21 V5 H13"/>
        <path d="M6 5 L14 8 V21"/>
        <circle cx="11.5" cy="13.5" r="0.9" fill="currentColor" stroke="none"/>
      </svg>
      {doorsPlaced === null ? "Place doors" : doorsPlaced === 0 ? "No new doors" : `Placed ${doorsPlaced} door${doorsPlaced === 1 ? "" : "s"}`}
    </button>
    <button class="header-action" type="button" onclick={furnishOffices}
            disabled={!shapes.some((shape) => shape.kind === "room" && FURNISHABLE.includes(shape.category))}
            title="Furnish every Office, Kitchen, WC and Storage room that has no furniture yet">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="12" height="7" rx="1"/>
        <rect x="16" y="5" width="5" height="7" rx="1"/>
        <rect x="6.5" y="14.5" width="5" height="5" rx="1.5"/>
      </svg>
      {furnishedRooms === null ? "Furnish rooms" : furnishedRooms === 0 ? "Nothing to furnish" : `Furnished ${furnishedRooms} room${furnishedRooms === 1 ? "" : "s"}`}
    </button>
    -->
    <button class="header-export" class:copied={copySuccess} type="button"
            onclick={handleExport} disabled={shapes.length === 0}>
      {copySuccess ? "Copied to Clipboard" : "Copy SVG"}
    </button>
  </div>

  <div class="display-settings" bind:this={displaySettingsEl}>
    <button class="display-settings-toggle" class:open={showDisplaySettings} type="button"
            aria-expanded={showDisplaySettings} aria-controls="display-settings-panel"
            aria-label="Settings" title="Settings"
            onclick={() => showDisplaySettings = !showDisplaySettings}>
      <!--
      <svg class="display-settings-icon" viewBox="0 0 {GEAR_SIZE} {GEAR_SIZE}" fill="currentColor" aria-hidden="true">
        <path d={GEAR_PATH}/>
      </svg>
      Display Settings
      -->
      <svg class="display-settings-icon" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
        <path d={FA_GEAR_PATH}/>
      </svg>
    </button>

    {#if showDisplaySettings}
      <div class="display-settings-panel" id="display-settings-panel">
        <fieldset id="select-interface">
          <legend>Toolbar</legend>
          <label class="checkbox" for="show-tool-hints">
            <input id="show-tool-hints" type="checkbox" bind:checked={showToolHints}>
            Show usage hints in tool tooltips
          </label>
        </fieldset>

        <fieldset id="select-canvas-size" class="field-row">
          <legend>Canvas Size</legend>
          <label class="input-group" for="canvas-width">
            <span class="field-hint">Width</span>
            <input id="canvas-width" type="number" min="100" step="100" bind:value={canvasWidth}>
          </label>
          <span class="row-sep" aria-hidden="true">x</span>
          <label class="input-group" for="canvas-height">
            <span class="field-hint">Height</span>
            <input id="canvas-height" type="number" min="100" step="100" bind:value={canvasHeight}>
          </label>
        </fieldset>

        <fieldset id="select-grid-look">
          <legend>Grid Appearance</legend>
          <label class="input-group" for="major-every">
            <span class="field-hint">Heavier line every N cells</span>
            <input id="major-every" type="number" min="2" max="20" step="1" bind:value={majorEvery}>
          </label>
          <label class="input-group" for="grid-minor-color">
            <span class="field-hint">Minor lines</span>
            <div class="field-row">
              <input id="grid-minor-color" type="color" bind:value={gridMinorColor}>
              <input type="text" value={gridMinorColor}
                     onchange={(e) => gridMinorColor = readHex(e, gridMinorColor)}>
            </div>
          </label>
          <label class="input-group" for="grid-major-color">
            <span class="field-hint">Major lines</span>
            <div class="field-row">
              <input id="grid-major-color" type="color" bind:value={gridMajorColor}>
              <input type="text" value={gridMajorColor}
                     onchange={(e) => gridMajorColor = readHex(e, gridMajorColor)}>
            </div>
          </label>
          <label class="input-group" for="canvas-fill">
            <span class="field-hint">Canvas background</span>
            <div class="field-row">
              <input id="canvas-fill" type="color" bind:value={canvasFill}>
              <input type="text" value={canvasFill}
                     onchange={(e) => canvasFill = readHex(e, canvasFill)}>
            </div>
          </label>
        </fieldset>

        <fieldset id="select-shape-style">
          <legend>Shape Style</legend>
          <label class="input-group" for="stroke-width">
            <span class="field-hint">Stroke width</span>
            <input id="stroke-width" type="number" min="1" max="12" step="1" bind:value={lineWidth}>
          </label>
          <label class="input-group" for="line-color">
            <span class="field-hint">Trace</span>
            <div class="field-row">
              <input id="line-color" type="color" bind:value={lineColor}>
              <input type="text" value={lineColor} onchange={(e) => lineColor = readHex(e, lineColor)}>
            </div>
          </label>
          <label class="input-group" for="rect-stroke">
            <span class="field-hint">Rectangle border</span>
            <div class="field-row">
              <input id="rect-stroke" type="color" bind:value={rectStroke}>
              <input type="text" value={rectStroke} onchange={(e) => rectStroke = readHex(e, rectStroke)}>
            </div>
          </label>
          <label class="checkbox" for="rect-filled">
            <input id="rect-filled" type="checkbox" bind:checked={rectFilled}>
            Fill rectangles
          </label>
          {#if rectFilled}
            <label class="input-group" for="rect-fill">
              <span class="field-hint">Rectangle fill</span>
              <div class="field-row">
                <input id="rect-fill" type="color" bind:value={rectFill}>
                <input type="text" value={rectFill} onchange={(e) => rectFill = readHex(e, rectFill)}>
              </div>
            </label>
          {/if}
        </fieldset>

        <fieldset id="select-room-style">
          <legend>Rooms, Floor &amp; Walls</legend>
          <label class="input-group" for="room-fill">
            <span class="field-hint">Room fill</span>
            <div class="field-row">
              <input id="room-fill" type="color" bind:value={roomFill}>
              <input type="text" value={roomFill} onchange={(e) => roomFill = readHex(e, roomFill)}>
            </div>
          </label>
          <label class="input-group" for="room-stroke">
            <span class="field-hint">Room border</span>
            <div class="field-row">
              <input id="room-stroke" type="color" bind:value={roomStroke}>
              <input type="text" value={roomStroke} onchange={(e) => roomStroke = readHex(e, roomStroke)}>
            </div>
          </label>
          <label class="input-group" for="room-label-color">
            <span class="field-hint">Room name</span>
            <div class="field-row">
              <input id="room-label-color" type="color" bind:value={roomLabelColor}>
              <input type="text" value={roomLabelColor} onchange={(e) => roomLabelColor = readHex(e, roomLabelColor)}>
            </div>
          </label>
          <label class="input-group" for="floor-fill">
            <span class="field-hint">Floor fill</span>
            <div class="field-row">
              <input id="floor-fill" type="color" bind:value={floorFill}>
              <input type="text" value={floorFill} onchange={(e) => floorFill = readHex(e, floorFill)}>
            </div>
          </label>
          <label class="input-group" for="floor-stroke">
            <span class="field-hint">Floor border</span>
            <div class="field-row">
              <input id="floor-stroke" type="color" bind:value={floorStroke}>
              <input type="text" value={floorStroke} onchange={(e) => floorStroke = readHex(e, floorStroke)}>
            </div>
          </label>
          <div class="field-row">
            <label class="input-group" for="floor-wall-width">
              <span class="field-hint">Floor wall (cm)</span>
              <input id="floor-wall-width" type="number" min="1" max="60" step="1" bind:value={floorWallWidth}>
            </label>
            <label class="input-group" for="room-wall-width">
              <span class="field-hint">Room wall (cm)</span>
              <input id="room-wall-width" type="number" min="1" max="60" step="1" bind:value={roomWallWidth}>
            </label>
          </div>
          <label class="input-group" for="wall-stroke">
            <span class="field-hint">Wall</span>
            <div class="field-row">
              <input id="wall-stroke" type="color" bind:value={wallStroke}>
              <input type="text" value={wallStroke} onchange={(e) => wallStroke = readHex(e, wallStroke)}>
              <input id="wall-width" type="number" min="1" max="60" step="1" bind:value={wallWidth}
                     aria-label="Wall thickness (cm)" title="Wall thickness (cm)">
            </div>
          </label>
          <label class="input-group" for="furniture-opacity">
            <span class="field-hint">Furniture opacity · {Math.round(furnitureOpacity * 100)}%</span>
            <input id="furniture-opacity" type="range" min="0.1" max="1" step="0.05" bind:value={furnitureOpacity}
                   style="--fill: {((furnitureOpacity - 0.1) / 0.9) * 100}%">
          </label>
        </fieldset>

        <fieldset id="select-room-categories">
          <legend>Room Categories</legend>
          <div class="field-row category-row category-head" aria-hidden="true">
            <span class="category-name"></span>
            <span class="field-hint">Fill</span>
            <span class="field-hint">Border</span>
          </div>
          {#each ROOM_CATEGORIES as category}
            <div class="field-row category-row">
              <span class="category-name">{category.label}</span>
              <input type="color" aria-label="{category.label} fill" bind:value={categoryColors[category.id].fill}>
              <input type="color" aria-label="{category.label} border" bind:value={categoryColors[category.id].stroke}>
            </div>
          {/each}
          <button class="reset-categories" type="button" onclick={() => categoryColors = defaultCategoryColors()}>
            Reset category colors
          </button>
        </fieldset>
      </div>
    {/if}
  </div>
</div>


<div class="app-layout">
  <Toolbar {tool} onpick={pickTool} onimage={openImagePicker} showHints={showToolHints}
           {elementsOpen} ontoggleelements={() => elementsOpen = !elementsOpen}
           tools={currentApp.tools} automations={currentApp.automations}
           canplacedoors={shapes.some((shape) => shape.kind === "room")}
           canfurnish={shapes.some((shape) => shape.kind === "room" && FURNISHABLE.includes(shape.category))}
           onplacedoors={placeDoors} onfurnish={furnishOffices}/>
  <input class="image-input" type="file" accept="image/*" bind:this={imageInput}
         onchange={(e) => { readImage(e.currentTarget.files?.[0]); e.currentTarget.value = ""; }}>

  <div class="selection-section" class:collapsed={!sidebarOpen} id="settings-panel">
    <!--
    <fieldset id="select-tool">
      <legend>Toolset</legend>
      <div class="toolset">
        {#each TOOLS as entry}
          <button class="tool" class:active={tool === entry.id} type="button"
                  aria-pressed={tool === entry.id} title={entry.hint}
                  onclick={() => pickTool(entry.id)}>
            <svg class="glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              {#if entry.id === "select"}
                <path d="M6 3 L6 18 L10 14 L13 21 L15.5 20 L12.5 13 L18 13 Z" fill="currentColor" stroke="none"/>
              {:else if entry.id === "line"}
                <path d="M5 7 L14 7 L14 17 L19 17"/>
                <circle cx="5" cy="7" r="2" fill="currentColor" stroke="none"/>
                <circle cx="19" cy="17" r="2" fill="currentColor" stroke="none"/>
              {:else}
                <rect x="4" y="6" width="16" height="12" rx="1"/>
              {/if}
            </svg>
            {entry.label}
          </button>
        {/each}
      </div>
      <span class="tool-hint">{activeHint}</span>
    </fieldset>
    -->

    {#if selectedRoom}
      <fieldset id="room-properties">
        <legend>Selected Room</legend>
        <label class="input-group" for="room-name">
          <span class="field-hint">Name</span>
          <input id="room-name" type="text" bind:value={selectedRoom.name} onchange={commitRoomName}
                 onkeydown={(e) => e.key === "Enter" && e.currentTarget.blur()}>
        </label>
      </fieldset>
    {/if}

    {#if tool === "line"}
      <fieldset id="select-elbow" transition:addRow>
        <legend>Trace Routing</legend>
        <label class="input-group" for="elbow">
          <select id="elbow" bind:value={elbow}>
            {#each ELBOWS as option}
              <option value={option.id}>{option.label}</option>
            {/each}
          </select>
          <span class="field-hint">Press R while drawing to cycle · Esc cancels</span>
        </label>
      </fieldset>
    {/if}

    <fieldset id="select-grid">
      <legend>Grid</legend>
      <label class="input-group" for="grid-size">
        <input id="grid-size" type="range" min="4" max="100" step="2" bind:value={gridSize}
               style="--fill: {((gridSize - 4) / 96) * 100}%">
        <span class="field-hint">
          {gridSize} px cells · {Math.floor(canvasWidth / gridSize)} × {Math.floor(canvasHeight / gridSize)} cells
        </span>
      </label>
      <label class="checkbox" for="show-grid">
        <input id="show-grid" type="checkbox" bind:checked={showGrid}>
        Show grid
      </label>
      <label class="checkbox" for="snap-to-grid">
        <input id="snap-to-grid" type="checkbox" bind:checked={snapToGrid}>
        Snap to grid
      </label>
    </fieldset>

    <fieldset id="shape-list">
      <legend>Drawing ({shapes.length})</legend>
      <div class="button-secition">
        <button class="add-setting" type="button" onclick={undo} disabled={!history.canUndo} title="Undo (Ctrl+Z)">
          <span class="plus" aria-hidden="true">↶</span>
          Undo
        </button>
        <button class="add-setting" type="button" onclick={redo} disabled={!history.canRedo} title="Redo (Ctrl+Y)">
          <span class="plus" aria-hidden="true">↷</span>
          Redo
        </button>
        <button class="remove-setting" type="button" onclick={clearAll} disabled={shapes.length === 0}>
          <span class="minus" aria-hidden="true">−</span>
          Clear all
        </button>
      </div>
      {#if shapes.length === 0}
        <span class="empty-hint">Nothing drawn yet — pick a tool and click the preview.</span>
      {:else}
        {#each shapes as shape (shape.id)}
          <div class="shape-row" class:selected={selectionIds.includes(shape.id)} class:locked-row={shape.locked} transition:addRow>
            <span class="kind">{shape.kind === "line" ? "Trace" : shape.kind === "rect" ? "Rect" : roomKindLabel(shape.kind)}</span>
            {#if shape.groupId}
              <span class="group-tag" title="Part of a group">G</span>
            {/if}
            <button class="coords" type="button" onclick={(e) => selectShape(shape.id, e.ctrlKey || e.metaKey)}>
              {describe(shape)}
            </button>
            <button class="lock-shape" class:locked={shape.locked} type="button"
                    aria-label={shape.locked ? "Unlock shape" : "Lock shape"} aria-pressed={!!shape.locked}
                    title={shape.locked ? "Unlock" : "Lock"} onclick={() => shape.locked = !shape.locked}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="7" width="10" height="7" rx="1.2"/>
                {#if shape.locked}
                  <path d="M5.5 7 V5 a2.5 2.5 0 0 1 5 0 V7"/>
                {:else}
                  <path d="M5.5 7 V5 a2.5 2.5 0 0 1 4.9 -0.6"/>
                {/if}
              </svg>
            </button>
            <button class="drop-shape" type="button" aria-label="Delete shape"
                    onclick={() => removeShape(shape.id)}>×</button>
          </div>
        {/each}
      {/if}
    </fieldset>

    <div class="spacer"></div>

    <!--
    <button class="configure" class:copied={copySuccess} type="button"
            onclick={handleExport} disabled={shapes.length === 0}>
      {copySuccess ? "Copied to Clipboard" : "Copy SVG"}
    </button>
    -->
  </div>

  <div class="viewer-section">
    <div class="viewer-header">
      <!-- <h2>Live Preview</h2> -->
      <ToolOptions {tool} {elbow} elbows={ELBOWS} {selection} {lineWidth} {snapToGrid} target={shapeTarget}
                   onlinewidth={(value) => lineWidth = value} onelbow={(value) => elbow = value}
                   onsnap={(value) => snapToGrid = value} ontarget={(value) => targetChoice = value}
                   onalign={alignSelection} ondistribute={distributeSelection} onlock={lockSelection}
                   door={doorOptions} oncategory={setCategory} ondoor={updateDoor} ondoorremove={removeDoor}
                   onthermostat={setThermostat} ongroup={groupSelection} onungroup={ungroupSelection}
                   onopacity={setImageOpacity} onfitimage={fitImage}
                   furniture={furnitureOptions} onfurnish={furnishSelected} onclearfurniture={clearFurniture}
                   onfurniturerotate={rotateFurniture} onfurnitureremove={removeFurniture}
                   placing={placingOptions} onrotateplacing={rotatePlacing}
                   onradius={setCornerRadius}
                   onname={(value) => selectedShape && setRoomName(selectedShape, value)}/>
      <div class="readout">
        <ZoomControls {viewport} onfit={fitContent}/>
        {#if draft}
          <span class="chip">from {draft.start.x}, {draft.start.y}</span>
        {/if}
        <span class="chip">{cursor ? `${cursor.x}, ${cursor.y}` : "—"}</span>
        <button class="panel-toggle" class:open={sidebarOpen} type="button"
                title={sidebarOpen ? "Hide settings panel" : "Show settings panel"}
                aria-label="Settings panel" aria-expanded={sidebarOpen} aria-controls="settings-panel"
                onclick={() => sidebarOpen = !sidebarOpen}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <rect x="1.75" y="2.75" width="12.5" height="10.5" rx="1.5"/>
            <path d="M10 2.75 V13.25"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="svg-container" bind:clientWidth={viewport.width} bind:clientHeight={viewport.height}>
      <svg class="preview-svg" class:drawing bind:this={svgEl}
           width="100%" height="100%"
           role="application" aria-label="Drawing canvas"
           use:panZoom={{ viewport, panTool: tool === "pan" }}
           onpointerdown={handleDown} onpointermove={handleMove} onpointerleave={handleLeave}
           oncontextmenu={(e) => { e.preventDefault(); draft = null; }}>
        <defs>
          <pattern id="grid_minor" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
            <path d="M {gridSize} 0 L 0 0 L 0 {gridSize}" fill="none"
                  stroke={gridMinorColor} stroke-width={1 / viewport.zoom}/>
          </pattern>
          <pattern id="grid_major" width={majorSize} height={majorSize} patternUnits="userSpaceOnUse">
            {#if showMinorGrid && gridSize * viewport.zoom >= MIN_GRID_PX}
              <rect x="0" y="0" width={majorSize} height={majorSize} fill="url(#grid_minor)"/>
            {/if}
            <path d="M {majorSize} 0 L 0 0 L 0 {majorSize}" fill="none"
                  stroke={gridMajorColor} stroke-width={1.5 / viewport.zoom}/>
          </pattern>
        </defs>

        <g transform={viewport.transform}>
        <rect x="0" y="0" width={canvasWidth} height={canvasHeight} fill={canvasFill}/>
        <ImageLayer {shapes} sources={imageSources} interactive={tool === "select"}/>
        {#if showGrid && majorSize * viewport.zoom >= MIN_GRID_PX}
          <rect x="0" y="0" width={canvasWidth} height={canvasHeight} fill="url(#grid_major)" pointer-events="none"/>
        {/if}
        <rect x="0" y="0" width={canvasWidth} height={canvasHeight} fill="none"
              stroke="#94A3B8" stroke-width="1" vector-effect="non-scaling-stroke" pointer-events="none"/>

        <RoomLayer {shapes} {draft} {cursor} selectedIds={selectionIds} zoom={viewport.zoom} style={roomStyle}
                   closure={floorPreview}
                   selectedFurniture={activeFurniture ? { roomId: activeFurniture.room.id, itemId: activeFurniture.item.id } : null}
                   interactive={tool === "select"}/>

        <WallLayer {shapes} selectedIds={selectionIds} style={roomStyle} interactive={tool === "select"}/>

        <DoorLayer {shapes} style={roomStyle} background={canvasFill} interactive={tool === "select"}
                   selectedDoor={activeDoor ? { roomId: activeDoor.room.id, doorId: activeDoor.door.id } : null}/>

        <ThermostatLayer {shapes} style={roomStyle} interactive={tool === "select"}/>

        {#each shapes as shape (shape.id)}
          <g transition:appear>
            {#if shape.kind === "line"}
              {#if selectionIds.includes(shape.id)}
                <path d={pathFor(shape.points)} fill="none" stroke="#F59E0B" opacity="0.35"
                      stroke-width={lineWidth + 6} stroke-linecap="square" stroke-linejoin="miter"/>
              {/if}
              <path d={pathFor(shape.points)} fill="none" stroke={lineColor} stroke-width={lineWidth}
                    stroke-linecap="square" stroke-linejoin="miter"/>
              <path class="shape-hit" d={pathFor(shape.points)} role="presentation" data-shape-id={shape.id}
                    onclick={() => selectedId = shape.id}/>
            {:else if shape.kind === "rect"}
              {#if selectionIds.includes(shape.id)}
                <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height}
                      fill="none" stroke="#F59E0B" stroke-width={lineWidth + 6} opacity="0.35"/>
              {/if}
              <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height}
                    fill={rectFilled ? rectFill : "none"} stroke={rectStroke} stroke-width={lineWidth}/>
              <rect class="shape-hit" x={shape.x} y={shape.y} width={shape.width} height={shape.height} data-shape-id={shape.id}
                    role="presentation" onclick={() => selectedId = shape.id}/>
            {/if}
          </g>
        {/each}

        {#if ghost}
          <g pointer-events="none">
            {#if ghost.kind === "line"}
              <path d={pathFor(ghost.points)} fill="none" stroke={lineColor} stroke-width={lineWidth}
                    stroke-linecap="square" stroke-linejoin="miter" opacity="0.65"
                    stroke-dasharray="{Math.max(4, gridSize / 2)} {Math.max(3, gridSize / 4)}"/>
              {#each ghost.points as point}
                <circle cx={point.x} cy={point.y} r={Math.max(2.5, lineWidth)}
                        fill={lineColor} opacity="0.65"/>
              {/each}
            {:else}
              <rect x={ghost.x} y={ghost.y} width={ghost.width} height={ghost.height}
                    fill={rectFilled ? rectFill : "none"} fill-opacity="0.35" stroke={rectStroke}
                    stroke-width={lineWidth} opacity="0.8"
                    stroke-dasharray="{Math.max(4, gridSize / 2)} {Math.max(3, gridSize / 4)}"/>
            {/if}
          </g>
        {/if}

        {#if drawing && cursor}
          <g pointer-events="none">
            <line x1="0" x2={canvasWidth} y1={cursor.y} y2={cursor.y} stroke="#2563EB"
                  stroke-width="1" stroke-dasharray="4 4" opacity="0.4" vector-effect="non-scaling-stroke"/>
            <line x1={cursor.x} x2={cursor.x} y1="0" y2={canvasHeight} stroke="#2563EB"
                  stroke-width="1" stroke-dasharray="4 4" opacity="0.4" vector-effect="non-scaling-stroke"/>
            <circle cx={cursor.x} cy={cursor.y} r={Math.max(3, gridSize / 6) / viewport.zoom}
                    fill="#FFFFFF" stroke="#2563EB" stroke-width="2" vector-effect="non-scaling-stroke"/>
          </g>
        {/if}

        <CurveLayer {shapes} {draft} {cursor} {selectedId} zoom={viewport.zoom} color={lineColor}
                    width={2} interactive={tool === "select"}/>

        {#if draft?.kind === "pen"}
          <!-- <PenPreview {draft} {cursor} zoom={viewport.zoom} closure={floorPreview} color={draft.target === "floor" ? floorStroke : roomStroke}/> -->
          <PenPreview {draft} {cursor} zoom={viewport.zoom} closure={floorPreview} color={draft.target === "wall" ? wallStroke : draft.target === "floor" ? floorStroke : roomStroke}/>
        {/if}

        {#each editableShapes as shape (shape.id)}
          <VertexHandles {shape} zoom={viewport.zoom}
                         points={activePoints.filter((key) => key.id === shape.id).map((key) => key.index)}
                         edges={activeEdges.filter((key) => key.id === shape.id).map((key) => key.index)}/>
        {/each}

        {#each selectedImages as image (image.id)}
          <ImageFrame {image} zoom={viewport.zoom}/>
        {/each}

        {#if placement}
          <PlacementGhost {placement}/>
        {/if}

        {#if marquee}
          <rect x={marquee.x} y={marquee.y} width={marquee.width} height={marquee.height}
                fill="#2563EB" fill-opacity="0.08" stroke="#2563EB" stroke-width="1"
                vector-effect="non-scaling-stroke" pointer-events="none"/>
        {/if}
        </g>
      </svg>

      {#if renamingRoom && renamePosition}
        {#key renamingId}
          <RoomNameEditor x={renamePosition.x} y={renamePosition.y} value={renamingRoom.name}
                          oncommit={commitRename} oncancel={() => renamingId = null}/>
        {/key}
      {/if}

      <CanvasNotice message={notice}/>

    </div>

    {#if elementsOpen}
      <ElementBar active={tool === "place" ? placing?.type : null} onpick={startPlacing}
                  groups={currentApp.elements} empty="{currentApp.label} elements and drawing rules come next."
                  onclose={() => elementsOpen = false}/>
    {/if}
  </div>
</div>
