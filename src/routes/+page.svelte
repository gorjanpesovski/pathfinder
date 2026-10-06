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
  import TextLayer from "$lib/components/TextLayer.svelte";
  import TextEditor from "$lib/components/TextEditor.svelte";
  import { newText, refitText, describeText, textToSvg } from "$lib/tools/text.js";
  import PenPreview from "$lib/components/PenPreview.svelte";
  import { samePoint, rectPoints, constrainOrtho, nearestVertex, wouldCross, closingCrosses, removeCollinear, polygonSelfIntersects, polygonBounds, maxCornerRadius, distance, pointInPolygon } from "$lib/tools/polygon.js";
  import { isRoomTool, isPolygonTool, isRoomShape, roomKindLabel, nextRoomName, describeRoom, snapVertices, snapToEdges, labelPoint, roomLabelPoint, layered, roomsToSvg, VERTEX_SNAP_PX, ROOM_STYLE, thermostatFit, thermostatGlobalScale } from "$lib/tools/rooms.js";
  import { hasCurves, outlinePoints, segmentCurved } from "$lib/tools/path.js";
  import { History } from "$lib/history.svelte.js";
  import { alignOffsets, distributeOffsets, contains, ALIGN_ACTIONS, DISTRIBUTE_ACTIONS } from "$lib/tools/align.js";
  import { ROOM_CATEGORIES, defaultCategoryColors } from "$lib/tools/categories.js";
  import { suggestDoor, projectDoor, doorGeometry, maxDoorWidth, MIN_DOOR_WIDTH, DOOR_ELEMENTS, isDoorElement } from "$lib/tools/doors.js";
  import { furnitureItem } from "$lib/tools/transform.js";
  import DoorLayer from "$lib/components/DoorLayer.svelte";
  import ImageLayer from "$lib/components/ImageLayer.svelte";
  import TransformFrame from "$lib/components/TransformFrame.svelte";
  import { scaling, rotating, mirroring, transformShape, transformPort } from "$lib/tools/transform.js";
  import { furnishForCategory, FURNISHABLE, usableRect, wallSides } from "$lib/tools/populate.js";
  import { FURNITURE, furnitureFits, newFurniture, furnitureCorners } from "$lib/tools/furniture.js";
  import ElementBar from "$lib/components/ElementBar.svelte";
  import PlacementGhost from "$lib/components/PlacementGhost.svelte";
  import ThermostatLayer from "$lib/components/ThermostatLayer.svelte";
  import WallLayer from "$lib/components/WallLayer.svelte";
  import ActivityBar from "$lib/components/ActivityBar.svelte";
  import CanvasNotice from "$lib/components/CanvasNotice.svelte";
  import { WALL_STYLE, describeWall, openEnds } from "$lib/tools/walls.js";
  import { APPS, appById, GENERAL_TOOLS } from "$lib/apps.js";
  import HydronicLayer from "$lib/components/HydronicLayer.svelte";
  import PageTabs from "$lib/components/PageTabs.svelte";
  import { HYDRONIC_ELEMENTS, HYDRONIC_STYLE, DEFAULT_MEDIUM, DEFAULT_PROTOCOL, DEFAULT_WIRE, familyOf, isElectricType, mediumOf, isHydronicType, isInlineType, isDeviceType, hydronicLabel, describeHydronic, nextElementName } from "$lib/hydronic/elements.js";
  import { branchDefaults, alignBranch, snapBranch, branchRiders, isBranch, branchParams, createBranch, rebuildBranch, ownedPipes, branchPipeIds, branchLegEnds, migrateBranches, isLeg, keepLegDistances, legSpan } from "$lib/hydronic/branch.js";
  import { connectNetwork, placeDevices } from "$lib/hydronic/network.js";
  import { readoutLayout, readoutSpec, readoutRows, readoutExtent, readoutScaleOf, meterOptions, meterReadouts } from "$lib/hydronic/readout.js";
  import { placeSensors } from "$lib/hydronic/meter.js";
  import { findPort, endpointPose, manhattanRoute, projectOnRoute, pruneDangling, ridingPipes, linkPastedPipes, computeRoutes, findPipePoint, cornerLegs, routePoint, sameEnd, endOf, editablePath, storedPoints, dragVertex, dragEdge, scaledOffset } from "$lib/hydronic/route.js";
  import { hydronicToSvg } from "$lib/hydronic/export.js";
  import { orientAngle, fittingPose } from "$lib/hydronic/geometry.js";
  import { isFreeEnd, portStep } from "$lib/hydronic/route.js";
  import { findValvePort, valveCorner, cornerFlip } from "$lib/hydronic/valvePorts.js";
  import { serializeDocument, parseDocument, highestId, loadAutosave, saveAutosave } from "$lib/document.js";
  import { rotationOf, isTurned, footprint, turnPort } from "$lib/hydronic/frame.js";
  import { fittingBox, fittingTargets } from "$lib/hydronic/fittingAlign.js";
  import { HYDRONIC_SPRITE, ICON_SIZES, ICON_SOURCES } from "$lib/hydronic/iconSprite.js";
  import { hydronicToPgd } from "$lib/hydronic/pgd.js";
  import HeaderMenu from "$lib/components/HeaderMenu.svelte";
  import Modal from "$lib/components/Modal.svelte";
  import VariableList from "$lib/components/VariableList.svelte";
  import VariablePanel from "$lib/components/VariablePanel.svelte";
  import ArrangeMenu from "$lib/components/ArrangeMenu.svelte";
  import { layerOf } from "$lib/hydronic/scene.js";
  import VariableLinks from "$lib/components/VariableLinks.svelte";
  import { elementSlots, fittingSlots, setSlot, variableUsage } from "$lib/hydronic/variables.js";
  import ProjectCrumb from "$lib/components/ProjectCrumb.svelte";
  import { rememberFile, recallFile, fileAccess, hashText } from "$lib/fileStore.js";
  import { shiftIds, shiftImageId, importablePages, imageIdsIn } from "$lib/importPages.js";
  import IoView from "$lib/components/IoView.svelte";
  import ConnectExport from "$lib/components/ConnectExport.svelte";
  import WiringActions from "$lib/components/WiringActions.svelte";
  import { boardSize, sheetsSvg, sheetDate } from "$lib/electric/sheet.js";
  import { wiringFromIo } from "$lib/electric/generate.js";
  import { printSheets } from "$lib/electric/print.js";
  import { electricSize, electricDefaults, nextElectricName } from "$lib/electric/symbols.js";
  import { summarizeSelection } from "$lib/tools/selectionSummary.js";
  import { junctionMedium } from "$lib/hydronic/inherit.js";
  import { alignToAnchor } from "$lib/hydronic/alignEnd.js";
  import { fittingLabel, nextFittingName, nameFittings, anchorNames } from "$lib/hydronic/fittingLabel.js";
  import { copyFittings, pasteTargets } from "$lib/hydronic/fittingPaste.js";
  import { elementLabel, elementBox, hasNameLabel, labelCentre, nameAnchorAt, textWidth } from "$lib/hydronic/label.js";
  import { hasTankProbes } from "$lib/hydronic/tank.js";
  import { defaultDocumentName, cleanDocumentName, fileNameFor } from "$lib/document.js";
  import { zipFiles } from "$lib/export/zip.js";
  import { describeCurve, curveToSvg } from "$lib/tools/curve.js";
  import { loadFlag, saveFlag, loadText, saveText } from "$lib/settings.js";
  import { shapeBox, translateShape, clampDelta, dragPointer, unionBox } from "$lib/tools/move.js";
  import { atviseDocument } from "$lib/export/atvise.js";

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
  let viewsOnHover = $state(loadFlag("pathfinder.viewBarOnHover", true));
  $effect(() => saveFlag("pathfinder.viewBarOnHover", viewsOnHover));
  let elementsOpen = $state(loadFlag("pathfinder.elementsOpen", false));
  $effect(() => saveFlag("pathfinder.elementsOpen", elementsOpen));
  let variablePanel = $state(loadFlag("pathfinder.variablePanel", false));
  $effect(() => saveFlag("pathfinder.variablePanel", variablePanel));
  let app = $state(loadText("pathfinder.app", "floorplan"));
  $effect(() => saveText("pathfinder.app", app));
  let currentApp = $derived(appById(app));

  let tool = $state("select");
  let elbow = $state("h");

  let shapes = $state([]);
  let draft = $state(null);
  let cursor = $state(null);
  let aim = $state(null);
  let selectedId = $state(null);
  let nextId = 1;
  let electricBoard = $derived(app === "electrical" ? boardSize(shapes) : null);
  let boardWidth = $derived(electricBoard?.width ?? canvasWidth);
  let boardHeight = $derived(electricBoard?.height ?? canvasHeight);

  let svgEl;

  let majorSize = $derived(gridSize * Math.max(2, majorEvery));
  let showMinorGrid = $derived(showGrid && gridSize >= 6);
  let drawing = $derived(tool !== "select" && tool !== "pan");

  function clamp(value, max){
    return Math.min(max, Math.max(0, value));
  }

  function snapValue(value, max){
    const stepped = snapToGrid ? Math.round(value / gridSize) * gridSize : Math.round(value);
    return clamp(stepped, max);
  }

  function snapPoint(point){
    return { x: snapValue(point.x, boardWidth), y: snapValue(point.y, boardHeight) };
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
    viewport.fit({ x: 0, y: 0, width: boardWidth, height: boardHeight });
  }

  function zoomToSelection(){
    const box = transformBox;
    if (!box) return;
    viewport.fit({ x: box.x, y: box.y, width: Math.max(box.width, 1), height: Math.max(box.height, 1) }, Math.min(80, Math.min(viewport.width, viewport.height) * 0.12));
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
      const x = snapValue((from.x + to.x) / 2, boardWidth);
      return [from, { x, y: from.y }, { x, y: to.y }, to];
    }

    if (mode === "zv") {
      const y = snapValue((from.y + to.y) / 2, boardHeight);
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
    if (shape.kind === "equipment" || shape.kind === "pipe") return describeHydronic(shape);
    if (isRoomShape(shape)) return describeRoom(shape);
    if (shape.kind === "curve") return describeCurve(shape);
    if (shape.kind === "image") return `Reference image · ${Math.round(shape.opacity * 100)}% opacity`;
    if (shape.kind === "text") return describeText(shape);
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
    aim = raw;
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
      branchEditing = false;
      selectedId = null;
      return;
    }

    const raw = toCanvas(event);
    if (!raw) return;
    const point = snapPoint(raw);
    cursor = point;

    if (tool === "text") {
      placeText(point);
      return;
    }

    if (tool === "place") {
      placeElement(event);
      return;
    }

    if (tool === "pipe") {
      pipeClick(event);
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
  let editableShapes = $derived(tool === "select"
    ? selectedShapes.filter((shape) => ["floor", "room", "curve", "wall"].includes(shape.kind) && (!shape.groupId || selectionIds.length === 1))
    : []);

  function sameKey(a, b){
    return a.id === b.id && a.index === b.index;
  }

  function toggleKey(list, key){
    return list.some((entry) => sameKey(entry, key)) ? list.filter((entry) => !sameKey(entry, key)) : [...list, key];
  }

  function clearSubSelection(){
    selectedPoints = [];
    selectedEdges = [];
    selectedParts = [];
    selectedFitting = null;
    extraFittings = [];
  }

  function clearShapeSubSelection(){
    selectedPoints = [];
    selectedEdges = [];
    selectedParts = [];
  }

  function withGroups(ids){
    const groups = new Set(ids.map((id) => shapeById(id)?.groupId).filter(Boolean));
    const members = shapes.filter((shape) => groups.has(shape.groupId) && !shape.locked).map((shape) => shape.id);
    return [...new Set([...ids, ...members])];
  }

  function selectShape(id, additive = false, deep = false){
    const members = deep ? [id] : withGroups([id]);
    selectedParts = [];
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
    const chosen = new Set(selectionIds);
    return [...units.values()].map((members) => {
      const owned = branchPipeIds(shapes, members.filter(isBranch).map((shape) => shape.id)).filter((id) => !chosen.has(id)).map(shapeById);
      return owned.length ? [...members, ...owned] : members;
    });
  }

  function memberBox(shape){
    return shape.kind === "pipe" ? routeBox(shape) : shapeBox(shape);
  }

  function unitBox(members){
    const boxes = members.map(memberBox).filter(Boolean);
    return boxes.length ? unionBox(boxes) : shapeBox(members[0]);
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
    const fittings = shapes.filter((shape) => shape.kind === "pipe" && !shape.locked)
      .flatMap((pipe) => (pipe.fittings ?? []).map((fitting) => ({ pipeId: pipe.id, fittingId: fitting.id })));
    if (fittings.length) {
      selectedFitting = fittings[fittings.length - 1];
      extraFittings = fittings.slice(0, -1);
    }
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
    const kindLabel = shape.kind === "text" ? "Text" : hydronicLabel(shape) ?? (shape.kind === "line" ? "Trace" : shape.kind === "rect" ? "Rectangle" : roomKindLabel(shape.kind));
    const pipes = selectedShapes.filter((entry) => entry.kind === "pipe");
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
      canDistribute: selectedPointCount >= 3 || (selectedPointCount < 2 && unitCount + fittingGroup.length >= 3),
      alignTarget: selectedPointCount >= 2 ? "each other" : unitCount === 1 && fittingGroup.length === 0 ? "the display" : "the selection",
      grouped: selectionIds.length > 1 && unitCount === 1,
      canGroup: unitCount >= 2,
      canUngroup: selectedShapes.some((entry) => entry.groupId),
      thermostat: thermostatState(selectedShapes),
      nameShown: (() => {
        const rooms = selectedShapes.filter((entry) => entry.kind === "room");
        const shown = rooms.filter((entry) => !entry.hideName).length;
        return shown === 0 ? "none" : shown === rooms.length ? "all" : "mixed";
      })(),
      furnish: selectionIds.length === 1 && shape.kind === "room"
        ? { supported: FURNISHABLE.includes(shape.category), count: shape.furniture?.length ?? 0 }
        : null,
      roomCount: selectedShapes.filter((entry) => entry.kind === "room").length,
      kinds: selectedShapes.every((entry) => entry.kind === "floor" || entry.kind === "room")
        ? (selectedShapes.every((entry) => entry.kind === "floor") ? "floor" : selectedShapes.every((entry) => entry.kind === "room") ? "room" : "mixed")
        : null,
      labelSize: commonValue(selectedShapes.filter((entry) => entry.kind === "room").map((entry) => entry.labelSize ?? roomStyle.labelSize)),
      wallEdges: activeEdges.filter((key) => ["room", "floor"].includes(shapeById(key.id)?.kind)).length,
      edgesHidden: edgeHiddenState(),
      pipeCount: pipes.length,
      pipeMedium: pipes[0]?.medium ?? pipeMedium,
      pipeWidth: pipes[0]?.width ?? HYDRONIC_STYLE.pipeWidth,
      category: commonCategory(selectedShapes)
    };
  });

  function commonValue(list){
    return list.length && list.every((value) => value === list[0]) ? list[0] : null;
  }

  function edgeHiddenState(){
    const keys = activeEdges.filter((key) => ["room", "floor"].includes(shapeById(key.id)?.kind));
    const hidden = keys.filter((key) => shapeById(key.id).hiddenEdges?.includes(key.index)).length;
    return hidden === 0 ? "none" : hidden === keys.length ? "all" : "mixed";
  }

  function edgeEnds(shape, index){
    return [shape.points[index], shape.points[(index + 1) % shape.points.length]];
  }

  function twinEdges(shape, index){
    const [a, b] = edgeEnds(shape, index);
    const twins = [];
    for (const other of shapes) {
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
    for (const key of activeEdges) {
      const shape = shapeById(key.id);
      if (shape?.kind !== "room" && shape?.kind !== "floor") continue;
      setEdgeHidden(shape, key.index, hide);
      for (const twin of twinEdges(shape, key.index)) setEdgeHidden(twin.shape, twin.index, hide);
    }
  }

  function setShapeKind(kind){
    for (const shape of selectedShapes) {
      if (shape.kind === kind || (shape.kind !== "floor" && shape.kind !== "room")) continue;
      shape.kind = kind;
      if (kind === "room" && !shape.name) shape.name = nextRoomName(shapes);
    }
  }

  function showRoomNames(show){
    for (const shape of selectedShapes) {
      if (shape.kind !== "room") continue;
      if (show) delete shape.hideName;
      else shape.hideName = true;
    }
  }

  function setLabelSize(value){
    editKey = "label-size";
    for (const shape of selectedShapes) if (shape.kind === "room") shape.labelSize = value;
  }

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
    const delta = clampDelta(polygonBounds(group.map((entry) => entry.original)), dx, dy, boardWidth, boardHeight);
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
  let lastFittingPress = { key: null, time: 0 };

  function routeBox(pipe){
    const route = pipeRoutes.get(pipe.id);
    return route?.length ? polygonBounds(route) : null;
  }

  let branchEditing = $state(false);
  let branchSelected = $derived(selectedShapes.some(isBranch));
  let singleBar = $derived(selectedShapes.length === 1 && selectedShapes[0].kind === "equipment" && HYDRONIC_ELEMENTS[selectedShapes[0].type]?.bar ? selectedShapes[0] : null);
  let editedBranches = $derived(branchEditing ? shapes.filter(isBranch).map((branch) => unitBox([branch, ...ownedPipes(shapes, branch.id)])) : []);

  let transformBox = $derived.by(() => {
    if (tool === "select" && !selectedShapes.length && partGroup.length) {
      const boxes = partGroup.map(partBox).filter(Boolean);
      return boxes.length ? unionBox(boxes) : null;
    }
    if (tool !== "select" || activePoints.length || activeEdges.length || !selectedShapes.length) return null;
    const owned = branchPipeIds(shapes, selectionIds).filter((id) => !selectionIds.includes(id)).map(shapeById);
    const boxes = [...selectedShapes, ...owned].map((shape) => shape.kind === "pipe" ? routeBox(shape) : shapeBox(shape)).filter(Boolean);
    return boxes.length ? unionBox(boxes) : null;
  });

  function transformGroup(){
    const riders = [...selectionIds, ...branchRiders(shapes, selectionIds)];
    const carried = [...new Set([...riders, ...branchPipeIds(shapes, riders)])];
    const ids = [...new Set([...carried, ...ridingPipes(shapes, carried)])];
    const entries = ids.map(shapeById).filter(Boolean).map((shape) => ({ shape, original: $state.snapshot(shape) }));
    const elements = new Map(entries.filter((entry) => entry.shape.kind === "equipment").map((entry) => [entry.shape.id, entry.original]));
    const ends = [];
    for (const pipe of shapes) {
      if (pipe.kind !== "pipe") continue;
      for (const key of ["from", "to"]) {
        if (pipe[key]?.id !== undefined && elements.has(pipe[key].id)) ends.push({ pipe, key, end: $state.snapshot(pipe[key]), element: elements.get(pipe[key].id) });
      }
    }
    return { entries, ends };
  }

  function onGrid(shape){
    const spec = HYDRONIC_ELEMENTS[shape.type];
    if (!snapToGrid || shape.kind !== "equipment" || !spec || spec.branch || spec.electric || spec.bar || spec.noPorts) return {};
    const width = Math.max(gridSize, Math.round(shape.width / gridSize) * gridSize);
    const height = Math.max(gridSize, Math.round(shape.height / gridSize) * gridSize);
    const cx = Math.round((shape.x + shape.width / 2) / gridSize) * gridSize;
    const cy = Math.round((shape.y + shape.height / 2) / gridSize) * gridSize;
    return { width, height, x: cx - width / 2, y: cy - height / 2 };
  }

  function applyTransformation({ entries, ends }, t){
    for (const entry of entries) {
      Object.assign(entry.shape, transformShape(entry.original, t));
      if (t.kind === "scale") Object.assign(entry.shape, onGrid(entry.shape));
    }
    for (const item of ends) item.pipe[item.key] = transformPort(item.end, item.element, shapeById(item.end.id), t);
  }

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

  function scaleRatio(value, start, anchor){
    const base = start - anchor;
    if (Math.abs(base) < 1e-6) return 1;
    return Math.max(0.05, (value - anchor) / base);
  }

  function beginTransform(event, handle){
    const box = transformBox;
    if (!box) return;
    if (handle !== "rotate" && singleBar) {
      beginBarScale(event, singleBar, handle);
      return;
    }
    if (handle !== "rotate" && handle.length === 2 && selectedShapes.length === 1 && selectedShapes[0].kind === "equipment" && !isBranch(selectedShapes[0])) {
      beginElementScale(event, selectedShapes[0], handle);
      return;
    }
    const start = toCanvas(event);
    if (!start) return;
    const parts = !selectedShapes.length ? partEntries() : null;
    const group = parts ? null : transformGroup();
    const apply = (t) => parts ? transformParts(parts, t) : applyTransformation(group, t);
    const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const rigid = !!group?.entries.some((entry) => entry.shape.kind === "equipment" || entry.shape.kind === "pipe");
    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const point = toCanvas(next);
        if (!point) return;
        if (handle === "rotate") {
          const raw = (Math.atan2(point.y - center.y, point.x - center.x) - Math.atan2(start.y - center.y, start.x - center.x)) * 180 / Math.PI;
          const step = rigid ? 90 : next.shiftKey ? 15 : 1;
          apply(rotating(center, Math.round(raw / step) * step));
          return;
        }
        const anchor = {
          x: handle.includes("w") ? box.x + box.width : handle.includes("e") ? box.x : center.x,
          y: handle.includes("n") ? box.y + box.height : handle.includes("s") ? box.y : center.y
        };
        const corner = handle.length === 2;
        let sx = (!branchSelected || corner) && (handle.includes("w") || handle.includes("e")) ? scaleRatio(point.x, start.x, anchor.x) : 1;
        let sy = handle.includes("n") || handle.includes("s") ? scaleRatio(point.y, start.y, anchor.y) : 1;
        if (corner && (branchSelected || !next.shiftKey)) sx = sy = Math.max(sx, sy);
        apply(scaling(anchor, sx, sy));
        if (branchSelected && group) scaleBranchFittings(group, corner ? sx : 1);
      },
      onend: () => history.endGesture()
    });
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
    if (partGroup.length) {
      const keys = new Set(partGroup.map((part) => `${part.kind}:${part.roomId}:${part.id}`));
      for (const room of new Set(partGroup.map((part) => part.room))) {
        if (room.furniture) room.furniture = moveInList(room.furniture, (item) => keys.has(`furniture:${room.id}:${item.id}`), mode);
        if (room.doors) room.doors = moveInList(room.doors, (door) => keys.has(`door:${room.id}:${door.id}`), mode);
      }
      return;
    }
    stackSelection(mode);
    const ids = new Set(selectionIds);
    shapes = moveInList(shapes, (shape) => ids.has(shape.id), mode);
  }

  function stackSelection(mode){
    const byId = new Map(shapes.map((shape) => [shape.id, shape]));
    const layered = (shape) => shape?.kind === "equipment" || shape?.kind === "pipe";
    const owner = (shape) => shape.kind === "pipe" && shape.branchOf !== undefined ? byId.get(shape.branchOf) ?? shape : shape;
    const targets = [...new Set(selectedShapes.filter(layered).map(owner))];
    if (!targets.length) return;
    const others = shapes.filter((shape) => layered(shape) && shape.branchOf === undefined && !targets.includes(shape)).map((shape) => layerOf(shape, byId));
    const top = Math.max(0, ...others);
    const bottom = Math.min(0, ...others);
    for (const shape of targets) {
      const z = layerOf(shape, byId);
      const next = mode === "front" ? top + 1 : mode === "back" ? bottom - 1 : mode === "forward" ? z + 1 : z - 1;
      if (next) shape.z = next;
      else delete shape.z;
    }
  }

  let arrangeMenu = $state(null);

  function openArrange(event){
    event.preventDefault();
    draft = null;
    pipeDraft = null;
    if (tool !== "select") return;
    const node = event.target.closest?.("[data-shape-id]");
    const fittingId = node?.dataset.fittingId ?? node?.dataset.readoutId;
    if (fittingId !== undefined) {
      if (fittingGroup.length < 2 || !fittingGroup.some((entry) => entry.fitting.id === Number(fittingId))) return;
      arrangeMenu = { x: event.clientX, y: event.clientY, mode: "fittings" };
      return;
    }
    const id = node && !partGroup.length ? Number(node.dataset.shapeId) : null;
    if (id !== null && !selectionIds.includes(id)) selectShape(id);
    if (!selectionIds.length && !partGroup.length) return;
    arrangeMenu = { x: event.clientX, y: event.clientY, mode: selectionIds.length ? "shapes" : "parts" };
  }

  let arrangeContext = $derived.by(() => {
    if (!arrangeMenu) return null;
    if (arrangeMenu.mode === "shapes" && selection) {
      return { mode: "shapes", canAlign: selection.canAlign, canDistribute: selection.canDistribute, canGroup: selection.canGroup, canUngroup: selection.canUngroup, alignTarget: selection.alignTarget };
    }
    if (arrangeMenu.mode === "parts" && partGroup.length) return { mode: "parts", canAlign: true, canDistribute: partGroup.length >= 3, alignTarget: partGroup.length > 1 ? "the selection" : "" };
    if (arrangeMenu.mode === "fittings" && fittingGroup.length > 1) return { mode: "fittings", canAlign: true, canDistribute: fittingGroup.length >= 3, alignTarget: "the selection" };
    return null;
  });

  function rotateSelection(){
    const box = transformBox;
    if (!box || selectedShapes.some(isBranch)) return;
    const t = rotating({ x: box.x + box.width / 2, y: box.y + box.height / 2 }, 90);
    if (!selectedShapes.length) transformParts(partEntries(), t);
    else applyTransformation(transformGroup(), t);
  }

  function flipSelection(axis){
    const box = transformBox;
    if (!box) return;
    const t = mirroring({ x: box.x + box.width / 2, y: box.y + box.height / 2 }, axis);
    if (!selectedShapes.length) transformParts(partEntries(), t);
    else applyTransformation(transformGroup(), t);
  }

  function beginMove(event){
    const handle = event.target instanceof Element ? event.target.closest("[data-transform]") : null;
    if (handle) {
      beginTransform(event, handle.dataset.transform);
      return true;
    }
    let target = event.target instanceof Element ? event.target.closest("[data-shape-id]") : null;
    let shape = target ? shapeById(Number(target.dataset.shapeId)) : null;
    if (!shape) return false;
    const additive = event.ctrlKey || event.metaKey;
    const owner = shape.kind === "pipe" && shape.branchOf !== undefined ? shapeById(shape.branchOf) : null;
    if (owner && !branchEditing) {
      shape = owner;
      target = { dataset: { shapeId: String(owner.id) } };
    }
    if (branchEditing && !isBranch(shape) && shape.branchOf === undefined) branchEditing = false;

    if (target.dataset.furnitureId !== undefined) {
      beginFurnitureDrag(event, shape, Number(target.dataset.furnitureId));
      return true;
    }
    if (target.dataset.readoutId !== undefined) {
      beginReadoutDrag(event, shape, Number(target.dataset.readoutId));
      return true;
    }
    if (target.dataset.fittingId !== undefined && !additive) {
      const key = `${shape.id}:${target.dataset.fittingId}`;
      const now = performance.now();
      if (lastFittingPress.key === key && now - lastFittingPress.time < 400) {
        lastFittingPress = { key: null, time: 0 };
        selectedId = null;
        clearSubSelection();
        selectedFitting = { pipeId: shape.id, fittingId: Number(target.dataset.fittingId) };
        renamingFitting = { pipeId: shape.id, fittingId: Number(target.dataset.fittingId) };
        return true;
      }
      lastFittingPress = { key, time: now };
    }
    if (target.dataset.fittingId !== undefined && target.dataset.fittingLabel !== undefined && !additive) {
      beginNameDrag(event, shape, Number(target.dataset.fittingId));
      return true;
    }
    if (target.dataset.fittingId !== undefined) {
      beginFittingDrag(event, shape, Number(target.dataset.fittingId));
      return true;
    }
    if (target.dataset.elementLabel !== undefined && !additive) {
      const now = performance.now();
      if (lastPress.id === shape.id && now - lastPress.time < 400) {
        lastPress = { id: null, time: 0 };
        selectShape(shape.id);
        renamingElementId = shape.id;
        return true;
      }
      lastPress = { id: shape.id, time: now };
      beginNameDrag(event, shape, null);
      return true;
    }
    if (target.dataset.waypointIndex !== undefined) {
      beginWaypointDrag(event, shape, Number(target.dataset.waypointIndex));
      return true;
    }
    if (target.dataset.pipeEnd) {
      beginPipeEndDrag(event, shape, target.dataset.pipeEnd);
      return true;
    }
    if (target.dataset.pipeVertex !== undefined) {
      beginPipeVertexDrag(event, shape, Number(target.dataset.pipeVertex));
      return true;
    }
    if (target.dataset.pipeEdge !== undefined) {
      beginPipeEdgeDrag(event, shape, Number(target.dataset.pipeEdge));
      return true;
    }
    if (target.dataset.roomLabel !== undefined) {
      beginRoomLabelDrag(event, shape);
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
    if (repeated && shape.kind === "text") {
      selectShape(shape.id);
      editingTextId = shape.id;
      return true;
    }
    if (repeated && shape.kind === "room") {
      selectShape(shape.id);
      renameRoom();
      return true;
    }
    if (repeated && isBranch(shape)) {
      branchEditing = true;
      selectedId = null;
      selectedIds = [];
      clearSubSelection();
      return true;
    }
    if (repeated && (isDeviceType(shape.type) || HYDRONIC_ELEMENTS[shape.type]?.generic)) {
      selectShape(shape.id);
      setTimeout(() => document.querySelector("input.branch-name")?.select(), 0);
      return true;
    }
    if (repeated && shape.kind === "equipment" && hasNameLabel(shape)) {
      selectShape(shape.id);
      renamingElementId = shape.id;
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
      clearShapeSubSelection();
    }

    const start = toCanvas(event);
    if (!start) return true;
    const riders = [...selectionIds, ...branchRiders(shapes, selectionIds)];
    const carried = [...new Set([...riders, ...branchPipeIds(shapes, riders)])];
    const group = [...new Set([...carried, ...ridingPipes(shapes, carried)])].map(shapeById).map((entry) => ({ shape: entry, original: $state.snapshot(entry) }));
    const movingIds = new Set(group.map((entry) => entry.shape.id));
    const solids = group.filter((entry) => entry.shape.kind !== "pipe");
    const lonelyBranch = solids.length === 1 && isBranch(solids[0].shape) ? solids[0] : null;
    const lonelyEnds = lonelyBranch ? branchLegEnds(shapes, lonelyBranch.shape) : {};
    const resting = lonelyBranch ? shapes.filter((entry) => !group.some((member) => member.shape === entry)) : [];
    const framed = group.filter((entry) => entry.shape.kind !== "pipe").map((entry) => shapeBox(entry.original));
    const box = framed.length ? unionBox(framed) : null;
    const step = snapToGrid ? gridSize : 1;
    let moved = false;
    const pressed = group.find((entry) => entry.shape === shape)?.original;
    const centre = snapToGrid && shape.kind === "equipment" && !isBranch(shape) && pressed
      ? { x: pressed.x + pressed.width / 2, y: pressed.y + pressed.height / 2 }
      : null;

    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const point = toCanvas(next);
        if (!point) return;
        const still = Math.hypot(point.x - start.x, point.y - start.y) * viewport.zoom < 3;
        const dx = still ? 0 : centre ? round2(Math.round((centre.x + point.x - start.x) / step) * step - centre.x) : Math.round((point.x - start.x) / step) * step;
        const dy = still ? 0 : centre ? round2(Math.round((centre.y + point.y - start.y) / step) * step - centre.y) : Math.round((point.y - start.y) / step) * step;
        let delta = box ? clampDelta(box, dx, dy, boardWidth, boardHeight) : { dx, dy };
        if (lonelyBranch) {
          const ends = {};
          for (const [role, end] of Object.entries(lonelyEnds)) ends[role] = { x: end.x + delta.dx, y: end.y + delta.dy };
          delta = { dx: delta.dx, dy: delta.dy + snapBranch(ends, resting, snapRadius) };
        }
        if (delta.dx !== 0 || delta.dy !== 0) moved = true;
        for (const entry of group) Object.assign(entry.shape, translateShape(entry.original, delta.dx, delta.dy, movingIds));
      },
      onend: () => {
        history.endGesture();
        if (!moved && !additive && wasSelected && (selectionIds.length > 1 || fittingGroup.length > 0)) selectShape(shape.id);
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
    shapes = pruneDangling(shapes);
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
    const baseFittings = additive ? fittingGroup.map((entry) => ({ pipeId: entry.pipe.id, fittingId: entry.fitting.id })) : [];
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
        const hits = branchEditing ? [] : withGroups(shapes.filter((shape) => !shape.locked && contains(box, shapeBox(shape))).map((shape) => shape.id));
        const ids = [...base, ...hits.filter((id) => !base.includes(id))];
        selectedIds = ids;
        selectedId = ids[ids.length - 1] ?? null;
        clearSubSelection();
        const fits = [...baseFittings, ...fittingsIn(box).filter((key) => !baseFittings.some((entry) => sameFitting(entry, key)))];
        if (fits.length) {
          selectedFitting = fits[fits.length - 1];
          extraFittings = fits.slice(0, -1);
        }
      },
      onend: () => {
        if (!marquee && !additive) branchEditing = false;
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
    const moving = new Set(group.map((shape) => shape.id));
    group.forEach((shape, index) => {
      const { dx, dy } = offsets[index];
      if (dx === 0 && dy === 0) return;
      Object.assign(shape, translateShape($state.snapshot(shape), round2(dx), round2(dy), moving));
    });
  }

  function pointBoxes(group){
    return group.map((entry) => ({ x: entry.original.x, y: entry.original.y, width: 0, height: 0 }));
  }

  function shiftPoints(group, offsets){
    movePointsTo(group, group.map((entry, index) => ({ x: entry.original.x + offsets[index].dx, y: entry.original.y + offsets[index].dy })));
  }

  function alignSelection(mode){
    if (partGroup.length >= 1) {
      alignParts(mode);
      return;
    }
    if (fittingGroup.length && selectionIds.length) {
      alignMixed(mode);
      return;
    }
    if (fittingGroup.length >= 2) {
      alignFittings(mode);
      return;
    }
    const points = pointGroup();
    if (points.length >= 2) {
      const boxes = pointBoxes(points);
      shiftPoints(points, alignOffsets(boxes, mode, unionBox(boxes)));
      return;
    }
    const units = selectionUnits();
    if (units.length === 0) return;
    const boxes = units.map((members) => unitBox(members));
    const frame = units.length === 1 ? { x: 0, y: 0, width: boardWidth, height: boardHeight } : unionBox(boxes);
    moveUnitsBy(units, alignOffsets(boxes, mode, frame));
  }

  function moveUnitsBy(units, offsets){
    units.forEach((members, index) => moveShapesBy(members, members.map(() => offsets[index])));
  }

  function mixedMembers(){
    const members = fittingGroup.map(({ pipe, fitting }) => ({ route: pipeRoutes.get(pipe.id), fitting })).filter((member) => member.route);
    const units = selectionUnits();
    const boxes = [...units.map((list) => unitBox(list)), ...members.map((member) => fittingBox(member.route, member.fitting))];
    return { members, units, boxes };
  }

  function applyMixed({ members, units }, offsets){
    const targets = fittingTargets(members, offsets.slice(units.length));
    moveUnitsBy(units, offsets.slice(0, units.length));
    applyFittingTargets(members, targets);
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
    if (partGroup.length >= 3) {
      distributeParts(axis);
      return;
    }
    if (fittingGroup.length && selectionIds.length) {
      distributeMixed(axis);
      return;
    }
    if (fittingGroup.length >= 3) {
      distributeFittings(axis);
      return;
    }
    const points = pointGroup();
    if (points.length >= 3) {
      shiftPoints(points, distributeOffsets(pointBoxes(points), axis));
      return;
    }
    const units = selectionUnits();
    if (points.length >= 2 || units.length < 3) return;
    moveUnitsBy(units, distributeOffsets(units.map((members) => unitBox(members)), axis));
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

  let lastLabelPress = 0;

  function beginRoomLabelDrag(event, room){
    const now = performance.now();
    if (now - lastLabelPress < 400) {
      lastLabelPress = 0;
      selectShape(room.id);
      renameRoom();
      return;
    }
    lastLabelPress = now;
    const start = toCanvas(event);
    if (!start) return;
    const base = labelPoint(room);
    const current = roomLabelPoint(room, roomStyle);
    const original = { dx: current.x - base.x, dy: current.y - base.y };
    const outline = outlinePoints(room);
    const step = snapToGrid ? gridSize / 2 : 1;

    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const point = toCanvas(next);
        if (!point) return;
        const candidate = {
          dx: round2(original.dx + Math.round((point.x - start.x) / step) * step),
          dy: round2(original.dy + Math.round((point.y - start.y) / step) * step)
        };
        if (pointInPolygon({ x: base.x + candidate.dx, y: base.y + candidate.dy }, outline)) room.labelOffset = candidate;
      },
      onend: () => history.endGesture()
    });
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

  let clipboardFittings = null;

  function copyFittingSelection(event){
    if (!fittingGroup.length || selectionIds.length) return false;
    clipboardFittings = copyFittings(fittingGroup.map(({ pipe, fitting }) => ({ pipe, fitting: $state.snapshot(fitting) })), pipeRoutes);
    clipboardShapes = null;
    clipboardFurniture = null;
    clipboardToken = `${Date.now()}`;
    pasteCount = 0;
    event.clipboardData?.setData("text/plain", CLIPBOARD_PREFIX + clipboardToken);
    event.preventDefault();
    return true;
  }

  function pasteFittings(){
    pasteCount += 1;
    const byId = new Map(shapes.map((shape) => [shape.id, shape]));
    const targets = pasteTargets(clipboardFittings, {
      routes: pipeRoutes,
      isOpen: (id) => byId.get(id)?.kind === "pipe" && !byId.get(id).locked,
      pointer,
      radius: Math.max(24, 30 / viewport.zoom),
      count: pasteCount
    });
    const placed = [];
    const renamed = new Map(clipboardFittings.map((item) => [item.fitting.id, nextId++]));
    clipboardFittings.forEach((item, index) => {
      const target = targets[index];
      const host = target ? byId.get(target.pipeId) : null;
      if (!host) return;
      const id = renamed.get(item.fitting.id);
      const { meterOf, ...copy } = structuredClone(item.fitting);
      const name = item.fitting.name === "" ? "" : nextFittingName(item.fitting.type, shapes);
      host.fittings = [...(host.fittings ?? []), { ...copy, id, t: target.t, name, ...(renamed.has(meterOf) ? { meterOf: renamed.get(meterOf) } : {}) }];
      placed.push({ pipeId: host.id, fittingId: id });
    });
    if (!placed.length) return;
    if (tool !== "select") pickTool("select");
    selectedId = null;
    clearSubSelection();
    selectedFitting = placed[placed.length - 1];
    extraFittings = placed.slice(0, -1);
  }

  function copyFurniture(event){
    if (!partGroup.length) return false;
    clipboardFurniture = partGroup.map((part) => ({ kind: part.kind, roomId: part.roomId, item: $state.snapshot(part.item), center: part.kind === "door" ? doorCenter(part.room, part.item) : null }));
    clipboardShapes = null;
    clipboardFittings = null;
    clipboardToken = `${Date.now()}`;
    pasteCount = 0;
    pasteKey = null;
    event.clipboardData?.setData("text/plain", CLIPBOARD_PREFIX + clipboardToken);
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
    const step = snapToGrid ? gridSize : 20;
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
    const entries = clipboardFurniture.filter((entry) => shapeById(entry.roomId) || pointer);
    if (!entries.length) return;
    const hovered = pointer ? roomAt(pointer) : null;
    const sources = new Set(entries.map((entry) => entry.roomId));
    const atPointer = !!hovered && !hovered.locked && !sources.has(hovered.id);
    const step = snapToGrid ? gridSize : 20;
    const centers = entries.map(partCenter).filter(Boolean);
    const middle = { x: centers.reduce((sum, p) => sum + p.x, 0) / centers.length, y: centers.reduce((sum, p) => sum + p.y, 0) / centers.length };
    const origin = atPointer ? { x: Math.round(pointer.x / step) * step, y: Math.round(pointer.y / step) * step } : middle;
    const key = atPointer ? `${hovered.id}:${origin.x}:${origin.y}` : "source";
    if (key !== pasteKey) {
      pasteKey = key;
      pasteCount = 0;
    }
    pasteCount += 1;
    const first = atPointer ? pasteCount - 1 : pasteCount;
    const roomFor = (entry) => {
      const room = atPointer ? hovered : shapeById(entry.roomId);
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
            const item = room ? { ...entry.item, cx: round2(entry.item.cx + dx), cy: round2(entry.item.cy + dy) } : null;
            return item && furnitureFits(room, item) ? { room, item } : null;
          });
          if (attempt.every(Boolean)) {
            placed = attempt;
            break;
          }
        }
      }
      for (const { room, item } of placed ?? []) {
        const id = nextId++;
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
      const id = nextId++;
      room.doors = [...(room.doors ?? []), { ...door, id }];
      keys.push({ kind: "door", roomId: room.id, id });
    }

    if (!keys.length) return;
    if (tool !== "select") pickTool("select");
    selectedId = null;
    clearSubSelection();
    selectedParts = keys;
  }

  function handleCopy(event){
    if (ioVisible) return;
    if (!typingInto(event.target) && copyFurniture(event)) return;
    if (!typingInto(event.target) && copyFittingSelection(event)) return;
    if (typingInto(event.target) || selectionIds.length === 0) return;
    clipboardFurniture = null;
    clipboardFittings = null;
    const owned = branchPipeIds(shapes, selectionIds).filter((id) => !selectionIds.includes(id)).map(shapeById);
    clipboardShapes = $state.snapshot([...selectedShapes, ...owned]);
    clipboardToken = `${Date.now()}`;
    pasteCount = 0;
    event.clipboardData?.setData("text/plain", CLIPBOARD_PREFIX + clipboardToken);
    event.preventDefault();
  }

  function handleCut(event){
    if (ioVisible) return;
    handleCopy(event);
    if (!event.defaultPrevented) return;
    if (clipboardFurniture && partGroup.length) removeParts();
    else if (clipboardFittings && activeFitting) removeFitting();
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
    const idMap = new Map();

    for (const source of clipboardShapes) {
      const copy = { ...structuredClone(source), ...translateShape(source, offset, offset), id: nextId++ };
      idMap.set(source.id, copy.id);
      if (copy.fittings) copy.fittings = copy.fittings.map((item) => ({ ...item, id: nextId++ }));
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

    const linked = linkPastedPipes(created, idMap, offset).map((shape) => shape.branchOf !== undefined && idMap.has(shape.branchOf) ? { ...shape, branchOf: idMap.get(shape.branchOf) } : shape).filter((shape) => shape.branchOf === undefined || created.some((entry) => entry.id === shape.branchOf));
    if (tool !== "select") pickTool("select");
    shapes.push(...linked);
    selectedIds = linked.map((shape) => shape.id);
    selectedId = selectedIds[selectedIds.length - 1] ?? null;
    clearSubSelection();
  }

  function handlePaste(event){
    if (ioVisible) return;
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
    if (clipboardFittings && text === CLIPBOARD_PREFIX + clipboardToken) {
      event.preventDefault();
      pasteFittings();
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

  function lockSelection(){
    for (const shape of selectedShapes) shape.locked = true;
    selectedId = null;
    clearSubSelection();
  }

  let selectedParts = $state([]);

  function resolvePart(key){
    const room = shapeById(key.roomId);
    if (!room || room.locked) return null;
    const item = (key.kind === "door" ? room.doors : room.furniture)?.find((entry) => entry.id === key.id);
    return item ? { ...key, room, item } : null;
  }

  let partGroup = $derived(tool === "select" ? selectedParts.map(resolvePart).filter(Boolean) : []);
  let furnitureGroup = $derived(partGroup.filter((part) => part.kind === "furniture"));
  let doorGroup = $derived(partGroup.filter((part) => part.kind === "door"));

  let activeDoor = $derived(partGroup.length === 1 && partGroup[0].kind === "door" ? { room: partGroup[0].room, door: partGroup[0].item } : null);

  let partOptions = $derived(partGroup.length ? { count: partGroup.length, furniture: furnitureGroup.length, doors: doorGroup.length } : null);

  function samePart(a, b){
    return a.kind === b.kind && a.roomId === b.roomId && a.id === b.id;
  }

  function pickPart(key, additive){
    selectedId = null;
    selectedIds = [];
    selectedPoints = [];
    selectedEdges = [];
    selectedFitting = null;
    extraFittings = [];
    if (additive) {
      selectedParts = selectedParts.some((entry) => samePart(entry, key))
        ? selectedParts.filter((entry) => !samePart(entry, key))
        : [...selectedParts, key];
      return false;
    }
    if (!selectedParts.some((entry) => samePart(entry, key))) selectedParts = [key];
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
        part.item.cx = round2(part.item.cx + dx);
        part.item.cy = round2(part.item.cy + dy);
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
    const inset = roomStyle.roomWidth / 2;
    return { x: box.x + inset, y: box.y + inset, width: box.width - inset * 2, height: box.height - inset * 2 };
  }

  function alignParts(mode){
    const parts = partGroup.filter(partBox);
    const boxes = parts.map(partBox);
    if (!boxes.length) return;
    const frame = boxes.length === 1 ? roomInterior(parts[0].room) : unionBox(boxes);
    shiftParts(parts, alignOffsets(boxes, mode, frame));
  }

  function distributeParts(axis){
    const parts = partGroup.filter(partBox);
    const boxes = parts.map(partBox);
    if (boxes.length < 3) return;
    shiftParts(parts, distributeOffsets(boxes, axis));
  }

  function removeParts(){
    for (const part of partGroup) {
      if (part.kind === "door") part.room.doors = part.room.doors.filter((entry) => entry.id !== part.id);
      else part.room.furniture = part.room.furniture.filter((entry) => entry.id !== part.id);
    }
    selectedParts = [];
  }

  function partEntries(){
    return partGroup.map((part) => ({ part, original: $state.snapshot(part.item), center: part.kind === "door" ? doorCenter(part.room, part.item) : null }));
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

  let doorOptions = $derived(doorGroup.length && !furnitureGroup.length ? {
    count: doorGroup.length,
    roomName: doorGroup.length === 1 ? doorGroup[0].room.name : null,
    type: commonValue(doorGroup.map((part) => part.item.type ?? "single")),
    hinge: commonValue(doorGroup.map((part) => part.item.hinge)),
    swing: commonValue(doorGroup.map((part) => part.item.swing)),
    width: commonValue(doorGroup.map((part) => part.item.width)),
    maxWidth: Math.max(MIN_DOOR_WIDTH, Math.min(...doorGroup.map((part) => maxDoorWidth(part.room, part.item.edge))))
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
    if (!pickPart({ kind: "door", roomId: room.id, id: doorId }, event.ctrlKey || event.metaKey)) return;
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

  function updateDoor(changes){
    for (const { room, item: door } of doorGroup) {
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

  let activeFurniture = $derived(partGroup.length === 1 && partGroup[0].kind === "furniture" ? { room: partGroup[0].room, item: partGroup[0].item } : null);

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

  let fileNotice = $state(null);
  let fileNoticeTimer;

  function showFileNotice(text){
    fileNotice = text;
    clearTimeout(fileNoticeTimer);
    fileNoticeTimer = setTimeout(() => fileNotice = null, 2400);
  }

  let notice = $derived(fileNotice ?? (doorsPlaced !== null
    ? doorsPlaced === 0 ? "Every room already has a door" : `Placed ${doorsPlaced} door${doorsPlaced === 1 ? "" : "s"}`
    : furnishedRooms !== null
      ? furnishedRooms === 0 ? "Nothing to furnish · set room categories first" : `Furnished ${furnishedRooms} room${furnishedRooms === 1 ? "" : "s"}`
      : null));

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
    if (!pickPart({ kind: "furniture", roomId: room.id, id: itemId }, event.ctrlKey || event.metaKey)) return;
    const start = toCanvas(event);
    const moving = furnitureGroup.map((part) => ({ part, origin: { cx: part.item.cx, cy: part.item.cy } }));
    if (!moving.length || !start) return;
    const step = snapToGrid ? gridSize / 2 : 1;

    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const point = toCanvas(next);
        if (!point) return;
        const dx = Math.round((point.x - start.x) / step) * step;
        const dy = Math.round((point.y - start.y) / step) * step;
        const candidates = moving.map(({ part, origin }) => ({ part, next: { ...part.item, cx: round2(origin.cx + dx), cy: round2(origin.cy + dy) } }));
        if (!candidates.every(({ part, next }) => furnitureFits(part.room, next))) return;
        for (const { part, next } of candidates) {
          part.item.cx = next.cx;
          part.item.cy = next.cy;
        }
      },
      onend: () => history.endGesture()
    });
  }

  function rotateFurniture(){
    for (const part of furnitureGroup) part.item.rotation = (part.item.rotation + 90) % 360;
  }

  function removeFurniture(){
    removeParts();
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

  function doorPlacement(point, spec){
    const radius = Math.max(60, 40 / viewport.zoom);
    const inside = roomAt(point);
    const rooms = shapes.filter((shape) => shape.kind === "room");
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

  let placement = $derived.by(() => {
    if (tool !== "place" || !placing || !cursor) return null;
    if (isHydronicType(placing.type)) return hydronicPlacement(placing.type, isInlineType(placing.type) ? aim ?? cursor : cursor);
    if (isDoorElement(placing.type)) return doorPlacement(cursor, DOOR_ELEMENTS[placing.type]);
    const room = roomAt(cursor);
    let item = newFurniture(placing.type, cursor.x, cursor.y, placing.rotation);
    if (room && placing.auto && FURNITURE[placing.type].wall) item = snapFurnitureToWall(room, item);
    return { kind: "furniture", room, item, valid: !!room && furnitureFits(room, item) };
  });

  let placingOptions = $derived(tool === "place" && placing ? {
    label: (DOOR_ELEMENTS[placing.type] ?? FURNITURE[placing.type] ?? HYDRONIC_ELEMENTS[placing.type]).label,
    door: isDoorElement(placing.type),
    rotatable: !isHydronicType(placing.type) || !isInlineType(placing.type),
    hint: isDoorElement(placing.type)
      ? "Click near a wall to place the door on it · Shift keeps placing · Esc stops"
      : isInlineType(placing.type)
        ? "Click on a pipe to place it · it stays on the pipe · Shift keeps placing · Esc stops"
        : isHydronicType(placing.type)
          ? "Click to place it · Shift keeps placing · Esc stops"
          : "Click inside a room to place it · snaps flush to walls · Shift keeps placing · Esc stops"
  } : null);

  function placeElement(event){
    const target = placement;
    if (!target?.valid) return;
    if (target.kind === "equipment" || target.kind === "fitting") {
      placeHydronic(target, event.shiftKey);
      return;
    }
    const id = nextId++;
    if (target.kind === "door") target.room.doors = [...(target.room.doors ?? []), { id, ...target.door }];
    else target.room.furniture = [...(target.room.furniture ?? []), { id, ...target.item }];
    if (event.shiftKey) return;

    const roomId = target.room.id;
    pickTool("select");
    selectedId = null;
    clearSubSelection();
    selectedParts = [{ kind: target.kind === "door" ? "door" : "furniture", roomId, id }];
  }

  let pipeDraft = $state(null);
  let pipeMedium = $state(DEFAULT_MEDIUM);

  const FAMILY_DEFAULTS = { network: DEFAULT_PROTOCOL, electric: DEFAULT_WIRE, hydronic: DEFAULT_MEDIUM };
  const WIRE_WIDTH = 1.5;

  $effect(() => {
    const family = app === "network" ? "network" : app === "electrical" ? "electric" : "hydronic";
    if (familyOf(mediumOf(pipeMedium)) !== family) pipeMedium = FAMILY_DEFAULTS[family];
    if (family === "electric" && pipeThickness !== WIRE_WIDTH) pipeThickness = WIRE_WIDTH;
    if (family !== "electric" && pipeThickness === WIRE_WIDTH) pipeThickness = HYDRONIC_STYLE.pipeWidth;
  });
  let hydronicLibrary = $state(HYDRONIC_STYLE.library);
  let nodePrefix = $state("");
  let freshPipes = $state([]);
  let selectedFitting = $state(null);
  let extraFittings = $state([]);
  let hydronicStyle = $derived({ ...HYDRONIC_STYLE, library: hydronicLibrary, nodePrefix, background: canvasFill, native: ICON_SIZES, bounds: { width: boardWidth, height: boardHeight } });
  let shapeIndex = $derived(new Map(shapes.map((shape) => [shape.id, shape])));
  let pipeRoutes = $derived(computeRoutes(shapes));
  let snapRadius = $derived(Math.max(20, 16 / viewport.zoom));
  let hoverRadius = $derived(Math.max(6, 7 / viewport.zoom));
  let pipeTargeting = $derived(tool === "pipe" || !!pipeDraft?.rewire);
  let pipeAnchor = $derived.by(() => {
    if (!pipeTargeting || !pipeDraft) return null;
    const last = pipeDraft.points[pipeDraft.points.length - (pipeDraft.follow ? 2 : 1)];
    if (last) return last;
    return endpointPose(pipeDraft.from, shapeIndex, (id) => pipeRoutes.get(id), cursor)?.point ?? null;
  });
  let pipeAim = $derived(alignToAnchor(cursor, pipeAnchor, 8 / viewport.zoom));
  let pipeCursor = $derived(pipeAim.point);
  let portTarget = $derived(pipeTargeting && pipeCursor ? pipeTargetAt(pipeAim.aligned ? pipeCursor : aim ?? pipeCursor) : null);

  function pipeTargetAt(point){
    const exclude = pipeDraft?.rewire?.pipeId ?? null;
    const valve = findValvePort(point, shapes, pipeRoutes, hoverRadius, exclude);
    if (valve) return valve;
    const port = findPort(point, shapes, hoverRadius);
    const pipe = findPipePoint(point, pipeRoutes, hoverRadius, exclude, pipeAim.aligned || !snapToGrid ? 0 : gridSize);
    if (!port || !pipe) return port ?? pipe;
    return pipe.gap < Math.hypot(port.point.x - point.x, port.point.y - point.y) ? pipe : port;
  }

  let pipePreview = $derived.by(() => {
    if (!pipeTargeting || !pipeDraft || !cursor) return null;
    const start = endpointPose(pipeDraft.from, shapeIndex, (id) => pipeRoutes.get(id), pipeDraft.points[0] ?? cursor);
    if (!start) return null;
    const endPose = portTarget && !sameEnd(endOf(portTarget), pipeDraft.from)
      ? endpointPose(endOf(portTarget), shapeIndex, (id) => pipeRoutes.get(id), pipeDraft.points[pipeDraft.points.length - 1] ?? start.point)
      : null;
    const end = endPose ?? { point: pipeCursor, normal: null };
    const rewired = pipeDraft.rewire ? shapeById(pipeDraft.rewire.pipeId) : null;
    const medium = rewired?.medium ?? junctionMedium(pipeDraft.from, endPose ? endOf(portTarget) : null, shapeIndex) ?? pipeMedium;
    return { route: manhattanRoute(start, pipeDraft.points, end), points: pipeDraft.points, medium, width: rewired?.width ?? pipeThickness, from: pipeDraft.from, to: endPose ? endOf(portTarget) : null };
  });

  function round4(value){
    return Math.round(value * 10000) / 10000;
  }

  function flashPipe(id){
    if (prefersReducedMotion.current) return;
    freshPipes = [...freshPipes, id];
    setTimeout(() => freshPipes = freshPipes.filter((entry) => entry !== id), 1200);
  }

  function finishRewire(snapshot, end){
    const pipe = shapeById(snapshot.rewire.pipeId);
    pipeDraft = null;
    if (!pipe) return;
    if (snapshot.rewire.end === "to") {
      pipe.to = end;
      pipe.points = snapshot.points;
    } else {
      pipe.from = end;
      pipe.points = [...snapshot.points].reverse();
    }
    flashPipe(pipe.id);
  }

  function pipeClick(event){
    const target = portTarget ?? (pipeCursor ? { free: true, x: pipeCursor.x, y: pipeCursor.y, point: pipeCursor } : null);
    if (!pipeDraft) {
      if (target) pipeDraft = { from: endOf(target), points: [] };
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      const last = pipeDraft.points[pipeDraft.points.length - 1];
      if (pipeCursor && !(last && samePoint(last, pipeCursor))) pipeDraft.points.push({ x: pipeCursor.x, y: pipeCursor.y });
      return;
    }
    if (!target && pipeDraft.rewire) {
      removeShape(pipeDraft.rewire.pipeId);
      pipeDraft = null;
      return;
    }
    if (!target || sameEnd(endOf(target), pipeDraft.from)) return;
    if (target.pipe !== undefined && pipeDraft.from.pipe === target.pipe) return;
    const snapshot = $state.snapshot(pipeDraft);
    if (snapshot.rewire) {
      finishRewire(snapshot, endOf(target));
      return;
    }
    const id = nextId++;
    shapes.push({
      id,
      kind: "pipe",
      from: snapshot.from,
      to: endOf(target),
      points: snapshot.points,
      medium: junctionMedium(snapshot.from, endOf(target), shapeIndex) ?? pipeMedium,
      width: pipeThickness,
      fittings: []
    });
    pipeDraft = null;
    flashPipe(id);
  }

  function pipeKeydown(event){
    if (tool !== "pipe" || !pipeDraft) return false;
    if (event.key === "Escape") {
      pipeDraft = null;
      return true;
    }
    if (event.key === "Delete" && pipeDraft.rewire) {
      event.preventDefault();
      removeShape(pipeDraft.rewire.pipeId);
      pipeDraft = null;
      return true;
    }
    if (event.key === "Backspace" || (event.key.toLowerCase() === "z" && (event.ctrlKey || event.metaKey))) {
      event.preventDefault();
      if (pipeDraft.points.length) pipeDraft.points.pop();
      else pipeDraft = null;
      return true;
    }
    return false;
  }

  let pipeThickness = $state(HYDRONIC_STYLE.pipeWidth);

  function setPipeWidth(value){
    pipeThickness = value;
    editKey = "pipeWidth";
    for (const shape of selectedShapes) if (shape.kind === "pipe") shape.width = value;
  }

  let textStyle = $state({ fontSize: 16, color: "#1E293B", bold: false });
  let editingTextId = $state(null);
  let freshTextId = null;
  let editingText = $derived(shapes.find((shape) => shape.id === editingTextId && shape.kind === "text") ?? null);
  let textEditPosition = $derived(editingText ? viewport.toScreen({ x: editingText.x, y: editingText.y }) : null);

  function placeText(point){
    const id = nextId++;
    shapes.push({ id, ...newText(point.x, point.y, $state.snapshot(textStyle)) });
    pickTool("select");
    selectShape(id);
    freshTextId = id;
    editingTextId = id;
  }

  function commitText(value){
    const shape = editingText;
    editingTextId = null;
    freshTextId = null;
    if (!shape) return;
    if (!value.trim()) {
      removeShape(shape.id);
      return;
    }
    shape.text = value;
    refitText(shape);
  }

  function cancelText(){
    const id = editingTextId;
    editingTextId = null;
    if (id !== null && id === freshTextId) removeShape(id);
    freshTextId = null;
  }

  function editSelectedText(){
    if (selectedShape?.kind === "text") editingTextId = selectedShape.id;
  }

  function setTextStyle(key, value){
    textStyle[key] = value;
    editKey = `text-${key}`;
    for (const shape of selectedShapes) {
      if (shape.kind !== "text") continue;
      shape[key] = value;
      refitText(shape);
    }
  }

  function selectedElements(){
    return selectedShapes.filter((shape) => shape.kind === "equipment" && !shape.locked && HYDRONIC_ELEMENTS[shape.type]);
  }

  function setElementSize(dimension, value, keepRatio){
    if (!(value >= 4)) return;
    const elements = selectedElements();
    for (const element of elements) {
      const original = { x: element.x, y: element.y, width: element.width, height: element.height };
      const entries = attachedEnds(element);
      const cx = original.x + original.width / 2;
      const cy = original.y + original.height / 2;
      const other = dimension === "width" ? "height" : "width";
      element[dimension] = value;
      if (keepRatio && !HYDRONIC_ELEMENTS[element.type]?.fixedHeight) element[other] = Math.round(value * original[other] / original[dimension] * 100) / 100;
      element.x = centreFor(element, cx) - element.width / 2;
      element.y = centreFor(element, cy) - element.height / 2;
      remapEnds(element, entries, original);
    }
    editKey = `size-${elements.map((element) => element.id).join(",")}`;
  }

  function toggleTankProbe(id){
    const tanks = selectedElements().filter(hasTankProbes);
    if (!tanks.length) return;
    const on = !tanks.every((tank) => tank.probes?.[id]);
    for (const tank of tanks) tank.probes = { ...(tank.probes ?? {}), [id]: on };
  }

  function setNameSize(value){
    editKey = "name-size";
    for (const element of selectedElements()) {
      if (hasNameLabel(element)) element.nameSize = value;
      else if (HYDRONIC_ELEMENTS[element.type]?.generic) element.fontSize = value;
    }
  }

  function setMedium(value){
    pipeMedium = value;
    for (const shape of selectedShapes) if (shape.kind === "pipe" || HYDRONIC_ELEMENTS[shape.type]?.bar) shape.medium = value;
  }

  let activeFitting = $derived.by(() => {
    if (!selectedFitting || tool !== "select") return null;
    const pipe = shapeById(selectedFitting.pipeId);
    const fitting = pipe?.fittings?.find((entry) => entry.id === selectedFitting.fittingId);
    return pipe && fitting && !pipe.locked ? { pipe, fitting } : null;
  });

  let fittingGroup = $derived.by(() => {
    if (!activeFitting) return [];
    const seen = new Set();
    return [selectedFitting, ...extraFittings]
      .map((entry) => {
        const pipe = shapeById(entry.pipeId);
        const fitting = pipe?.fittings?.find((item) => item.id === entry.fittingId);
        return pipe && fitting && !pipe.locked ? { pipe, fitting } : null;
      })
      .filter((entry) => entry && !seen.has(entry.fitting.id) && seen.add(entry.fitting.id));
  });

  let selectionGroups = $derived(tool === "select" && activePoints.length === 0 && activeEdges.length === 0
    ? summarizeSelection(selectedShapes, fittingGroup, { pipeWidth: HYDRONIC_STYLE.pipeWidth, turnable: turnable.length })
    : null);

  let fittingOptions = $derived(activeFitting ? {
    count: fittingGroup.length,
    label: HYDRONIC_ELEMENTS[activeFitting.fitting.type]?.label ?? activeFitting.fitting.type,
    scale: activeFitting.fitting.scale ?? 1,
    measure: readoutSpec(activeFitting.fitting.type)?.measure ?? null,
    readout: activeFitting.fitting.readout ?? "none",
    moved: !!activeFitting.fitting.readoutOffset
  } : null);

  let readoutBoxes = $derived(app === "hydronic" ? readoutLayout(shapes, pipeRoutes, { width: canvasWidth, height: canvasHeight }) : new Map());

  function setFittingReadout(value){
    if (!activeFitting) return;
    for (const { fitting } of fittingGroup) {
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
    const meters = fittingGroup.filter(({ fitting }) => meterOptions(fitting.type).some((option) => option.id === id));
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
    for (const { fitting } of fittingGroup) delete fitting.readoutOffset;
  }

  let networkSelection = $derived.by(() => {
    if (app !== "network") return null;
    const devices = selectedIds.map((id) => shapeById(id)).filter((shape) => shape?.kind === "equipment" && isDeviceType(shape.type));
    if (!devices.length) return null;
    const centre = devices.find((shape) => ["hub", "gateway"].includes(HYDRONIC_ELEMENTS[shape.type].device)) ?? null;
    return { centre, devices: devices.filter((shape) => shape !== centre) };
  });

  function connectSelected({ topology, medium }){
    const selection = networkSelection;
    if (!selection?.centre || !selection.devices.length) return;
    const pipes = connectNetwork($state.snapshot(selection.centre), $state.snapshot(selection.devices), topology, medium, pipeThickness, () => nextId++);
    shapes.push(...pipes);
    showFileNotice(`Connected ${selection.devices.length} device${selection.devices.length === 1 ? "" : "s"} as a ${topology === "daisy" ? "daisy chain" : topology}`);
  }

  function addDevices({ type, count, name, slave, medium, topology }){
    const centre = networkSelection?.centre;
    if (!centre) return;
    const added = placeDevices($state.snapshot(centre), type, count, name, slave).map((device) => ({ id: nextId++, ...device }));
    shapes.push(...added);
    shapes.push(...connectNetwork($state.snapshot(centre), added, topology, medium, pipeThickness, () => nextId++));
    selectedIds = added.map((device) => device.id);
    selectedId = added[0]?.id ?? null;
    showFileNotice(`Added ${added.length} device${added.length === 1 ? "" : "s"} under ${centre.name || "the gateway"}`);
  }

  function setDeviceParam(name, value){
    for (const element of selectedElements()) {
      if (!isDeviceType(element.type) && !isElectricType(element.type)) continue;
      element.params = { ...$state.snapshot(element.params ?? {}), [name]: value };
      if (isElectricType(element.type)) Object.assign(element, electricSize(element.type, element.params));
    }
  }

  let sheetMeta = $derived({ project: documentName ?? "", date: sheetDate() });

  function generateWiring(options){
    const result = wiringFromIo($state.snapshot(ioPoints), $state.snapshot(shapes), () => nextId++, options);
    if (!result.shapes.length) return;
    shapes.push(...result.shapes);
    selectedId = null;
    selectedIds = [];
    showFileNotice(`Added ${result.points} IO point${result.points === 1 ? "" : "s"} on ${result.pages} page${result.pages === 1 ? "" : "s"}`);
  }

  function printWiring(){
    printSheets($state.snapshot(shapes), sheetMeta);
  }

  function setBranchName(value){
    for (const element of selectedElements()) {
      const others = shapes.filter((shape) => shape !== element);
      element.name = value.trim() || (isElectricType(element.type) ? nextElectricName(element.type, others) : "");
    }
  }

  function setBranchParam(name, value){
    for (const element of selectedElements()) {
      if (!isBranch(element)) continue;
      element.params = { ...branchDefaults(), ...$state.snapshot(element.params ?? {}), [name]: value };
      refreshBranch(element);
    }
  }

  function refreshBranch(element){
    const owned = ownedPipes(shapes, element.id);
    if (!owned.length) return;
    const rebuilt = rebuildBranch($state.snapshot(element), $state.snapshot(owned), () => nextId++);
    const keep = new Set(rebuilt.map((pipe) => pipe.id));
    const updates = new Map(rebuilt.map((pipe) => [pipe.id, pipe]));
    const next = [];
    for (const shape of shapes) {
      if (shape.kind === "pipe" && shape.branchOf === element.id) {
        if (keep.has(shape.id)) next.push(updates.get(shape.id));
        continue;
      }
      next.push(shape);
    }
    for (const pipe of rebuilt) if (!shapes.some((shape) => shape.id === pipe.id)) next.push(pipe);
    shapes = pruneDangling(next);
  }

  function beginNameDrag(event, owner, fittingId){
    const target = fittingId === null ? owner : owner.fittings?.find((entry) => entry.id === fittingId);
    if (!target) return;
    const frame = () => fittingId === null ? elementBox(owner) : fittingBox(pipeRoutes.get(owner.id), target);
    const label = fittingId === null ? elementLabel(owner) : fittingLabel(pipeRoutes.get(owner.id), target);
    const width = event.target instanceof SVGGraphicsElement ? event.target.getBBox().width : textWidth(target.name, label.size);
    if (fittingId === null) {
      if (!selectionIds.includes(owner.id)) selectShape(owner.id);
    } else {
      selectedId = null;
      clearSubSelection();
      selectedFitting = { pipeId: owner.id, fittingId };
    }
    const start = toCanvas(event);
    if (!start) return;
    const origin = labelCentre(label, width);
    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const point = toCanvas(next);
        if (!point) return;
        delete target.nameOffset;
        target.nameAnchor = nameAnchorAt(frame(), { x: origin.x + point.x - start.x, y: origin.y + point.y - start.y }, width, label.height);
      },
      onend: () => history.endGesture()
    });
  }

  function setFittingName(value){
    const entry = activeFitting;
    if (!entry) return;
    entry.fitting.name = value.trim();
  }

  function setReadoutScale(value){
    editKey = "readoutScale";
    for (const { fitting } of fittingGroup) if (readoutSpec(fitting.type)) fitting.readoutScale = value;
  }

  function beginReadoutDrag(event, pipe, fittingId){
    selectedId = null;
    clearSubSelection();
    selectedFitting = { pipeId: pipe.id, fittingId };
    const fitting = pipe.fittings?.find((entry) => entry.id === fittingId);
    const box = readoutBoxes.get(fittingId);
    const start = toCanvas(event);
    if (!fitting || !box || !start) return;
    const origin = { x: box.x + box.width / 2 - box.pose.x, y: box.y + box.height / 2 - box.pose.y };

    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const point = toCanvas(next);
        if (!point) return;
        fitting.readoutOffset = { x: Math.round(origin.x + point.x - start.x), y: Math.round(origin.y + point.y - start.y) };
      },
      onend: () => history.endGesture()
    });
  }

  function setFittingScale(value){
    if (!activeFitting) return;
    editKey = "fittingScale";
    for (const { fitting } of fittingGroup) fitting.scale = value;
  }

  function reversePipes(){
    for (const pipe of selectedShapes) {
      if (pipe.kind !== "pipe") continue;
      const from = $state.snapshot(pipe.from);
      pipe.from = $state.snapshot(pipe.to);
      pipe.to = from;
      pipe.points = $state.snapshot(pipe.points ?? []).reverse();
      pipe.fittings = (pipe.fittings ?? []).map((fitting) => ({ ...$state.snapshot(fitting), t: round4(1 - fitting.t) }));
    }
  }

  function setFittingNameSize(value){
    editKey = "fitting-name-size";
    for (const { fitting } of fittingGroup) fitting.nameSize = value;
  }

  function pipeLayer(up){
    const ids = selectedShapes.filter((shape) => shape.kind === "pipe").map((shape) => shape.id);
    if (!ids.length) return;
    const moving = shapes.filter((shape) => ids.includes(shape.id));
    const rest = shapes.filter((shape) => !ids.includes(shape.id));
    shapes = up ? [...rest, ...moving] : [...moving, ...rest];
  }

  function attachedEnds(element){
    return shapes.filter((shape) => shape.kind === "pipe").map((pipe) => ({ pipe, from: $state.snapshot(pipe.from), to: $state.snapshot(pipe.to) }));
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

  function beginElementScale(event, element, corner){
    const original = { x: element.x, y: element.y, width: element.width, height: element.height };
    const aspect = original.width / original.height;
    const left = corner.includes("w");
    const top = corner.includes("n");
    const anchor = { x: left ? original.x + original.width : original.x, y: top ? original.y + original.height : original.y };
    const entries = attachedEnds(element);
    const free = !!HYDRONIC_ELEMENTS[element.type]?.noPorts;
    const size = (value) => free ? Math.max(8, Math.round(value)) : Math.max(40, snapToGrid ? Math.round(value / gridSize) * gridSize : Math.round(value));

    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const point = toCanvas(next);
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
        remapEnds(element, entries, original);
      },
      onend: () => history.endGesture()
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
    const limit = vertical ? boardHeight : boardWidth;
    const anchor = low ? original[key] + original[size] : original[key];
    const grabbed = low ? original[key] : original[key] + original[size];
    const minimum = snapToGrid ? gridSize * 2 : 40;
    const entries = attachedEnds(element);
    const start = toCanvas(event);
    if (!start) return;

    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const point = toCanvas(next);
        if (!point) return;
        const edge = snapValue(grabbed + point[key] - start[key], limit);
        const length = Math.max(minimum, low ? anchor - edge : edge - anchor);
        element[key] = low ? anchor - length : anchor;
        element[size] = length;
        keepBarEnds(element, entries, original, vertical);
      },
      onend: () => history.endGesture()
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
        if (along) entry.pipe[key] = { ...end, offset: Math.min(length, Math.max(0, round2(end.offset + shift))) };
      }
    }
  }

  function centred(value){
    return snapToGrid ? Math.round(value / gridSize) * gridSize : Math.round(value);
  }

  function beginLegDrag(event, pipe, end){
    const original = $state.snapshot(pipe[end]);
    if (!isFreeEnd(original)) return;
    const start = toCanvas(event);
    if (!start) return;
    const branch = shapeById(pipe.branchOf);
    const top = branch ? endpointPose(pipe.role === "supply" ? pipe.to : pipe.from, shapeIndex)?.point : null;
    const bars = shapes.filter((shape) => shape.kind === "equipment" && HYDRONIC_ELEMENTS[shape.type]?.bar);
    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const point = toCanvas(next);
        if (!point) return;
        let y = snapValue(original.y + point.y - start.y, boardHeight);
        const x = top?.x ?? original.x;
        const bar = bars.find((entry) => x > entry.x && x < entry.x + entry.width && Math.abs(entry.y - y) <= snapRadius);
        if (bar) y = bar.y;
        if (top) y = Math.max(y, top.y + 40);
        const before = branch ? legSpan(branch, pipe) : null;
        pipe[end] = { x, y: round2(y) };
        if (branch) pipe.fittings = keepLegDistances(branch, $state.snapshot(pipe), before);
      },
      onend: () => history.endGesture()
    });
  }

  function keptCorners(pipe, end){
    const route = pipeRoutes.get(pipe.id);
    if (!route || route.length < 3) return { points: [], follow: null };
    const ordered = (end === "from" ? [...route].reverse() : route).map((point) => ({ x: point.x, y: point.y }));
    const tip = ordered[ordered.length - 1];
    let corners = ordered.slice(1, -1);
    let near = tip;
    const last = corners[corners.length - 1];
    if (Math.hypot(last.x - tip.x, last.y - tip.y) <= 20.5 && endpointPose(pipe[end], shapeIndex, (id) => pipeRoutes.get(id), last)?.normal) {
      near = last;
      corners = corners.slice(0, -1);
    }
    if (!corners.length) return { points: [], follow: null };
    const corner = corners[corners.length - 1];
    const follow = Math.abs(corner.y - near.y) < 0.5 ? "y" : Math.abs(corner.x - near.x) < 0.5 ? "x" : null;
    return { points: corners, follow };
  }

  function followEnd(){
    const draft = pipeDraft;
    if (!draft?.follow || !draft.points.length) return;
    const spot = portTarget?.point ?? pipeCursor;
    if (spot) draft.points[draft.points.length - 1][draft.follow] = round2(spot[draft.follow]);
  }

  function beginPipeEndDrag(event, pipe, end){
    if (isLeg(pipe)) {
      beginLegDrag(event, pipe, end);
      return;
    }
    const original = $state.snapshot(pipe[end]);
    const fixed = $state.snapshot(end === "from" ? pipe.to : pipe.from);
    const { points, follow } = keptCorners(pipe, end);
    const junction = original?.pipe !== undefined;
    const free = isFreeEnd(original);
    const start = toCanvas(event);
    if (!start || !fixed) return;
    let moved = false;
    selectedId = null;
    clearSubSelection();
    pipeDraft = { from: fixed, points, follow, rewire: { pipeId: pipe.id, end } };
    cursor = snapPoint(start);
    aim = start;

    dragPointer(svgEl, event, {
      onmove: (next) => {
        const raw = toCanvas(next);
        if (!raw) return;
        if (!moved && Math.hypot(raw.x - start.x, raw.y - start.y) * viewport.zoom < 4) return;
        moved = true;
        aim = raw;
        cursor = snapPoint(raw);
        followEnd();
      },
      onend: () => {
        const target = moved ? portTarget : null;
        const spot = pipeCursor ? { x: pipeCursor.x, y: pipeCursor.y } : null;
        const snapshot = $state.snapshot(pipeDraft);
        pipeDraft = null;
        cursor = null;
        if (!snapshot) return;
        if (!moved) {
          if (!junction && !free) removeShape(pipe.id);
          return;
        }
        const valid = target && !sameEnd(endOf(target), snapshot.from) && !(target.pipe !== undefined && target.pipe === snapshot.from.pipe);
        if (valid) finishRewire(snapshot, endOf(target));
        else if (!junction && spot && !sameEnd(spot, snapshot.from)) finishRewire(snapshot, spot);
        else if (!junction) removeShape(pipe.id);
      }
    });
  }

  function resetElementSize(){
    for (const element of selectedElements()) {
      const spec = HYDRONIC_ELEMENTS[element.type];
      const original = { width: element.width, height: element.height };
      const entries = attachedEnds(element);
      const size = footprint(spec.width, spec.height, rotationOf(element));
      const cx = element.x + element.width / 2;
      const cy = element.y + element.height / 2;
      element.width = size.width;
      element.height = size.height;
      element.x = centreFor(element, cx) - size.width / 2;
      element.y = centreFor(element, cy) - size.height / 2;
      remapEnds(element, entries, original);
    }
  }

  function centreFor(element, value){
    return snapToGrid && !isBranch(element) ? Math.round(value / gridSize) * gridSize : value;
  }

  function beginPipeVertexDrag(event, pipe, index){
    const route = pipeRoutes.get(pipe.id);
    if (!route) return;
    const path = editablePath(route);
    if (event.altKey) {
      pipe.points = storedPoints(path.filter((_, entry) => entry !== index));
      return;
    }
    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const raw = toCanvas(next);
        if (raw) pipe.points = storedPoints(dragVertex(path, index, snapPoint(raw)));
      },
      onend: () => history.endGesture()
    });
  }

  function beginPipeEdgeDrag(event, pipe, index){
    const route = pipeRoutes.get(pipe.id);
    const start = toCanvas(event);
    if (!route || !start) return;
    const path = editablePath(route);
    const step = snapToGrid ? gridSize : 1;
    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const point = toCanvas(next);
        if (!point) return;
        const delta = { x: Math.round((point.x - start.x) / step) * step, y: Math.round((point.y - start.y) / step) * step };
        pipe.points = storedPoints(dragEdge(path, index, delta));
      },
      onend: () => history.endGesture()
    });
  }

  function sameFitting(a, b){
    return a.pipeId === b.pipeId && a.fittingId === b.fittingId;
  }

  function fittingsIn(box){
    const keys = [];
    for (const pipe of shapes) {
      if (pipe.kind !== "pipe" || pipe.locked) continue;
      const route = pipeRoutes.get(pipe.id);
      if (!route) continue;
      for (const fitting of pipe.fittings ?? []) if (HYDRONIC_ELEMENTS[fitting.type] && contains(box, fittingBox(route, fitting))) keys.push({ pipeId: pipe.id, fittingId: fitting.id });
    }
    return keys;
  }

  function beginFittingDrag(event, pipe, fittingId){
    const key = { pipeId: pipe.id, fittingId };
    const current = fittingGroup.map((entry) => ({ pipeId: entry.pipe.id, fittingId: entry.fitting.id }));
    const inside = current.some((entry) => sameFitting(entry, key));
    if (event.ctrlKey || event.metaKey || event.shiftKey) {
      const next = inside ? current.filter((entry) => !sameFitting(entry, key)) : [...current, key];
      clearShapeSubSelection();
      selectedFitting = null;
      extraFittings = [];
      if (next.length) {
        selectedFitting = next[next.length - 1];
        extraFittings = next.slice(0, -1);
      }
      return;
    }
    if (inside && (current.length > 1 || selectionIds.length > 0)) {
      beginFittingGroupDrag(event, key, current.filter((entry) => !sameFitting(entry, key)));
      return;
    }
    beginFittingSingleDrag(event, pipe, fittingId);
  }

  function beginFittingGroupDrag(event, key, rest){
    clearShapeSubSelection();
    selectedFitting = key;
    extraFittings = rest;
    const members = [key, ...rest].map((entry) => {
      const host = shapeById(entry.pipeId);
      const fitting = host?.fittings?.find((item) => item.id === entry.fittingId);
      const route = pipeRoutes.get(entry.pipeId);
      if (!host || !fitting || !route) return null;
      return { host, fitting, start: fittingPose(route, fitting), size: (HYDRONIC_ELEMENTS[fitting.type]?.width ?? 0) * (fitting.scale ?? 1) };
    }).filter(Boolean);
    const origin = toCanvas(event);
    if (!origin || !members.length) return;

    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const point = toCanvas(next);
        if (!point) return;
        for (const member of members) {
          const route = pipeRoutes.get(member.host.id);
          if (!route) continue;
          const hit = projectOnRoute(route, { x: member.start.x + point.x - origin.x, y: member.start.y + point.y - origin.y }, member.size);
          if (hit) member.fitting.t = round4(hit.t);
        }
      },
      onend: () => history.endGesture()
    });
  }

  function alignFittings(mode){
    const members = fittingGroup.map(({ pipe, fitting }) => ({ route: pipeRoutes.get(pipe.id), fitting })).filter((member) => member.route);
    const boxes = members.map((member) => fittingBox(member.route, member.fitting));
    applyFittingTargets(members, fittingTargets(members, alignOffsets(boxes, mode, unionBox(boxes))));
  }

  function distributeFittings(axis){
    const members = fittingGroup.map(({ pipe, fitting }) => ({ route: pipeRoutes.get(pipe.id), fitting })).filter((member) => member.route);
    const boxes = members.map((member) => fittingBox(member.route, member.fitting));
    applyFittingTargets(members, fittingTargets(members, distributeOffsets(boxes, axis)));
  }

  function applyFittingTargets(members, targets){
    members.forEach((member, index) => {
      if (targets[index] !== null) member.fitting.t = targets[index];
    });
  }

  function rotateElements(){
    const elements = selectedShapes.filter((shape) => shape.kind === "equipment" && !shape.locked && HYDRONIC_ELEMENTS[shape.type]);
    for (const element of elements) {
      const original = { x: element.x, y: element.y, width: element.width, height: element.height };
      const entries = attachedEnds(element);
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

  function beginFittingSingleDrag(event, pipe, fittingId){
    selectedId = null;
    clearSubSelection();
    selectedFitting = { pipeId: pipe.id, fittingId };
    let fitting = pipe.fittings?.find((entry) => entry.id === fittingId);
    if (!fitting) return;
    const size = (HYDRONIC_ELEMENTS[fitting.type]?.width ?? 0) * (fitting.scale ?? 1);
    const roaming = fitting.meterOf !== undefined;
    let host = pipe;

    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const point = toCanvas(next);
        if (!point) return;
        if (roaming) {
          const jump = nearestHydronicPipe(point, size);
          if (jump && jump.pipe !== host) {
            const moved = { ...$state.snapshot(fitting), t: round4(jump.hit.t) };
            host.fittings = host.fittings.filter((entry) => entry.id !== moved.id);
            jump.pipe.fittings = [...(jump.pipe.fittings ?? []), moved];
            host = jump.pipe;
            fitting = host.fittings.find((entry) => entry.id === moved.id);
            selectedFitting = { pipeId: host.id, fittingId };
            return;
          }
        }
        const route = pipeRoutes.get(host.id);
        if (!route) return;
        const corner = HYDRONIC_ELEMENTS[fitting.type]?.junction
          ? valveCorner(point, new Map([[host.id, route]]), Math.max(10, 14 / viewport.zoom), fitting.type, orientAngle, fitting.leg ?? "before")
          : null;
        if (corner) {
          Object.assign(fitting, { t: corner.t, flip: corner.flip, leg: corner.leg });
          return;
        }
        const hit = projectOnRoute(route, point, size);
        if (!hit) return;
        fitting.t = round4(hit.t);
        delete fitting.leg;
      },
      onend: () => history.endGesture()
    });
  }

  function nearestHydronicPipe(point, size){
    const radius = Math.max(24, 30 / viewport.zoom);
    let best = null;
    for (const [pipeId, route] of pipeRoutes) {
      const candidate = shapeById(pipeId);
      if (!candidate || candidate.locked || familyOf(mediumOf(candidate.medium)) !== "hydronic") continue;
      const hit = projectOnRoute(route, point, size);
      if (hit && hit.gap <= radius && (!best || hit.gap < best.hit.gap)) best = { pipe: candidate, hit };
    }
    return best;
  }

  let turnable = $derived(fittingGroup.filter(({ pipe, fitting }) => {
    const route = pipeRoutes.get(pipe.id);
    return HYDRONIC_ELEMENTS[fitting.type]?.junction && route && cornerLegs(route, routePoint(route, fitting.t));
  }));

  function turnFitting(){
    for (const { pipe, fitting } of turnable) {
      const route = pipeRoutes.get(pipe.id);
      const legs = cornerLegs(route, routePoint(route, fitting.t));
      const leg = fitting.leg === "after" ? "before" : "after";
      const flip = cornerFlip(fitting.type, legs, leg, orientAngle);
      if (flip === undefined) continue;
      Object.assign(fitting, { leg, flip });
    }
  }

  function flipFitting(){
    const corners = new Set(turnable.map(({ fitting }) => fitting.id));
    for (const { fitting } of fittingGroup) if (HYDRONIC_ELEMENTS[fitting.type]?.orient !== "upright" && !corners.has(fitting.id)) fitting.flip = !fitting.flip;
  }

  function removeFitting(){
    if (!activeFitting) return;
    const gone = new Set(fittingGroup.map(({ fitting }) => fitting.id));
    for (const shape of shapes) {
      if (shape.kind !== "pipe" || !(shape.fittings ?? []).some((entry) => gone.has(entry.id) || gone.has(entry.meterOf))) continue;
      shape.fittings = shape.fittings.filter((entry) => !gone.has(entry.id) && !gone.has(entry.meterOf));
    }
    selectedFitting = null;
    extraFittings = [];
  }

  function beginWaypointDrag(event, pipe, index){
    if (event.altKey) {
      pipe.points = pipe.points.filter((_, entry) => entry !== index);
      return;
    }
    history.beginGesture();
    dragPointer(svgEl, event, {
      onmove: (next) => {
        const raw = toCanvas(next);
        if (raw) pipe.points[index] = snapPoint(raw);
      },
      onend: () => history.endGesture()
    });
  }

  function hydronicPlacement(type, point){
    const spec = HYDRONIC_ELEMENTS[type];
    if (spec.inline) {
      const radius = Math.max(24, 30 / viewport.zoom);
      let best = null;
      for (const [pipeId, route] of pipeRoutes) {
        const near = projectOnRoute(route, point, 0);
        if (!near || near.gap > radius || (best && near.gap >= best.near)) continue;
        const hit = projectOnRoute(route, point, spec.width);
        if (hit) best = { pipe: shapeById(pipeId), hit, near: near.gap };
      }
      const corner = spec.junction ? valveCorner(point, pipeRoutes, Math.max(10, 14 / viewport.zoom), type, orientAngle) : null;
      if (corner && !shapeById(corner.pipeId)?.locked) {
        return { kind: "fitting", type, pipe: shapeById(corner.pipeId), fitting: { type, t: corner.t, flip: corner.flip, leg: corner.leg }, pose: corner.pose, valid: true };
      }
      if (!best || best.pipe.locked) return { kind: "fitting", type, pipe: null, pose: { x: point.x, y: point.y, rotation: 0 }, valid: false };
      return {
        kind: "fitting",
        type,
        pipe: best.pipe,
        fitting: { type, t: round4(best.hit.t), flip: false },
        pose: { x: best.hit.x, y: best.hit.y, rotation: orientAngle(type, best.hit.angle) },
        valid: true
      };
    }
    const rotation = placing?.rotation ?? 0;
    const size = footprint(spec.width, spec.height, rotation);
    const element = {
      type,
      x: snapValue(point.x, boardWidth) - size.width / 2,
      y: snapValue(point.y, boardHeight) - size.height / 2,
      width: size.width,
      height: size.height
    };
    if (spec.electric) {
      element.x = snapValue(point.x - size.width / 2, boardWidth);
      element.y = snapValue(point.y - size.height / 2, boardHeight);
      element.params = electricDefaults(type);
      Object.assign(element, electricSize(type, element.params));
      return { kind: "equipment", element, valid: true };
    }
    if (rotation) element.rotation = rotation;
    if (spec.bar) element.medium = pipeMedium;
    if (spec.branch) {
      element.params = branchDefaults();
      let aligned = { ...alignBranch(element, (value) => snapValue(value, boardWidth)), id: -1 };
      let ghostId = -1;
      let pipes = createBranch(aligned, () => --ghostId);
      const shift = snapBranch(legEndsOf(pipes), shapes, snapRadius);
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

  function placeFitting(id, target){
    const spec = HYDRONIC_ELEMENTS[target.fitting.type];
    const fitting = { id, ...target.fitting, name: nextFittingName(target.fitting.type, shapes) };
    if (spec.measures) Object.assign(fitting, { readout: "value", readouts: [spec.measures[0]] });
    const entries = spec.sensors ? [...pipeRoutes].map(([pipeId, route]) => ({ pipe: shapeById(pipeId), route })).filter((entry) => entry.pipe) : [];
    const spots = spec.sensors ? placeSensors(entries, target.pipe.id, fitting) : [];
    const across = spots.find((spot) => spot.pipeId !== target.pipe.id);
    if (across) fitting.nameAnchor = meterNameAnchor(fitting, target.pipe.id, across);
    target.pipe.fittings = [...(target.pipe.fittings ?? []), fitting];
    if (spec.junction) joinValve(target.pipe, fitting);
    for (const spot of spots) {
      const host = shapeById(spot.pipeId);
      host.fittings = [...(host.fittings ?? []), { id: nextId++, type: "meterSensor", t: spot.t, name: "", meterOf: id }];
    }
  }

  function joinValve(host, fitting){
    const route = pipeRoutes.get(host.id);
    if (!route) return;
    const spot = fittingPose(route, fitting);
    for (const shape of shapes) {
      if (shape.kind !== "pipe" || shape.id === host.id) continue;
      for (const key of ["from", "to"]) {
        const end = shape[key];
        if (end?.pipe !== host.id || end.fitting !== undefined || Math.hypot(end.x - spot.x, end.y - spot.y) > 1) continue;
        shape[key] = { pipe: host.id, x: spot.x, y: spot.y, fitting: fitting.id };
      }
    }
  }

  function meterNameAnchor(fitting, hostId, across){
    const self = fittingPose(pipeRoutes.get(hostId), fitting);
    const other = fittingPose(pipeRoutes.get(across.pipeId), { type: "meterSensor", t: across.t });
    const box = fittingBox(pipeRoutes.get(hostId), fitting);
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
    const id = nextId++;
    if (target.kind === "equipment") {
      const element = { id, kind: "equipment", ...target.element, name: isElectricType(target.element.type) ? nextElectricName(target.element.type, shapes) : HYDRONIC_ELEMENTS[target.element.type]?.nameless ? "" : nextElementName(target.element.type, shapes) };
      shapes.push(element);
      if (isBranch(element)) shapes.push(...createBranch(element, () => nextId++));
    }
    else placeFitting(id, target);
    if (keep) return;
    pickTool("select");
    selectedId = null;
    clearSubSelection();
    if (target.kind === "equipment") selectShape(id);
    else selectedFitting = { pipeId: target.pipe.id, fittingId: id };
  }

  function appKeydown(event){
    const ctrl = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    if (!ctrl && event.shiftKey && event.code === "Digit1") {
      event.preventDefault();
      fitContent();
      return true;
    }
    if (!ctrl && event.shiftKey && event.code === "Digit2") {
      event.preventDefault();
      zoomToSelection();
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
    if (ctrl && !event.altKey && key === "m" && tool === "select" && transformBox) {
      event.preventDefault();
      flipSelection(event.shiftKey ? "x" : "y");
      return true;
    }
    if (ctrl && !event.altKey && (key === "f" || key === "b") && tool === "select" && (partGroup.length || selectionIds.length)) {
      event.preventDefault();
      reorderSelection(key === "f" ? (event.shiftKey ? "front" : "forward") : (event.shiftKey ? "back" : "backward"));
      return true;
    }
    if (!ctrl && !event.altKey && event.shiftKey && (key === "h" || key === "v") && tool === "select" && transformBox) {
      event.preventDefault();
      flipSelection(key === "h" ? "x" : "y");
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
    if (ctrl && key === "s") {
      event.preventDefault();
      if (event.shiftKey) saveProjectAs();
      else saveProject();
      return true;
    }
    if (ctrl && key === "o") {
      event.preventDefault();
      openDrawing();
      return true;
    }
    if (ctrl && key === "a") {
      event.preventDefault();
      if (tool !== "select") pickTool("select");
      selectAll();
      return true;
    }
    if (tool === "select" && app === "hydronic" && !ctrl && key === "r" && selectedShapes.some((shape) => shape.kind === "equipment" && !shape.locked)) {
      event.preventDefault();
      if (!selectedShapes.some(isBranch)) rotateElements();
      return true;
    }
    if (tool === "select" && app === "hydronic" && !ctrl && !event.altKey && key === "f" && selectedShapes.some((shape) => shape.kind === "pipe")) {
      event.preventDefault();
      reversePipes();
      return true;
    }
    if (tool === "place" && !ctrl && key === "r") {
      event.preventDefault();
      rotatePlacing();
      return true;
    }
    if (event.key === "Escape") {
      if (tool !== "select") pickTool("select");
      branchEditing = false;
      clearSubSelection();
      renamingId = null;
      return false;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      if (activeFitting) {
        event.preventDefault();
        const mixed = selectionIds.length > 0;
        removeFitting();
        if (mixed) deleteSelection();
        return true;
      }
      if (partGroup.length) {
        event.preventDefault();
        removeParts();
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
  let renamePosition = $derived(renamingRoom ? viewport.toScreen(roomLabelPoint(renamingRoom, roomStyle)) : null);
  let renamingElementId = $state(null);
  let renamingElement = $derived(shapes.find((shape) => shape.id === renamingElementId && shape.kind === "equipment") ?? null);
  let elementRenamePosition = $derived.by(() => {
    if (!renamingElement) return null;
    const label = elementLabel(renamingElement);
    return viewport.toScreen({ x: label.x, y: label.middle });
  });

  let renamingFitting = $state(null);
  let renamingFittingEntry = $derived.by(() => {
    if (!renamingFitting) return null;
    const pipe = shapeById(renamingFitting.pipeId);
    const fitting = pipe?.fittings?.find((entry) => entry.id === renamingFitting.fittingId);
    const route = pipe ? pipeRoutes.get(pipe.id) : null;
    return pipe && fitting && route ? { pipe, fitting, route } : null;
  });
  let fittingRenamePosition = $derived.by(() => {
    if (!renamingFittingEntry) return null;
    const label = fittingLabel(renamingFittingEntry.route, renamingFittingEntry.fitting);
    return viewport.toScreen({ x: label.center, y: label.middle });
  });

  function commitFittingRename(value){
    const entry = renamingFittingEntry;
    renamingFitting = null;
    if (!entry) return;
    entry.fitting.name = value.trim();
  }

  function commitElementRename(value){
    const element = renamingElement;
    renamingElementId = null;
    if (!element) return;
    element.name = value.trim();
  }

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
      if (draft.target === "wall" && samePoint(point, last) && !samePoint(point, draft.start) && draft.points.length >= 2) finishPolygon(null, true);
      else if (draft.points.length >= 3) finishPolygon();
      return;
    }

    if (wouldCross(draft.points, point)) return;
    draft.points.push(point);
  }

  function finishPolygon(closed = null, open = false){
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
      finishPen(null, draft.target === "wall");
      return;
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
    const handles = closed ? [...snapshot.handles, ...closed.slice(snapshot.handles.length).map(() => null)] : open ? openEnds(snapshot.handles) : snapshot.handles;
    const curved = handles.some(Boolean);
    if (points.length < (curved || open ? 2 : 3)) return;
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
    pipeDraft = null;
    if (next !== "select") selectedId = null;
  }

  function removeShape(id){
    shapes = shapes.filter((shape) => shape.id !== id);
    shapes = pruneDangling(shapes);
    if (selectedId === id) selectedId = null;
  }

  function undo(){
    restore(history.undo());
  }

  let documents = {};
  let variableNames = $state([]);
  const PAGED_APPS = ["floorplan", "hydronic", "network"];
  let pageSets = $state({});
  let pageSet = $derived(PAGED_APPS.includes(app) ? pageSets[app] ?? null : null);
  let ioPoints = $state([]);
  let ioOthers = $state([]);
  let ioOpen = $state(false);
  let ioVisible = $derived(ioOpen && app === "hydronic");
  let ioBranches = $derived(ioVisible ? pageShapes("hydronic").filter(isBranch).map((shape, index) => ({ id: shape.id, label: shape.name?.trim() || `Branch ${index + 1}`, type: branchParams(shape).branch_type })) : []);
  let documentName = $state(null);
  let saveDialog = $state(null);
  let pickedFileName = null;

  function openSaveDialog(mode = "as"){
    saveDialog = { mode };
  }

  function confirmSave(name){
    const mode = saveDialog?.mode ?? "as";
    saveDialog = null;
    downloadProject(cleanDocumentName(name) ?? defaultDocumentName(), mode !== "copy");
  }

  function newPageId(){
    return `page-${crypto.randomUUID().slice(0, 8)}`;
  }

  function ensurePages(appId){
    if (!PAGED_APPS.includes(appId) || pageSets[appId]) return;
    const id = newPageId();
    pageSets[appId] = { active: id, list: [{ id, name: "Page 1" }] };
  }

  function stashKey(appId){
    const set = pageSets[appId];
    return PAGED_APPS.includes(appId) && set ? `${appId}:${set.active}` : appId;
  }

  function storedShapes(appId, pageId){
    const set = pageSets[appId];
    if (appId === app && (!set || set.active === pageId)) return $state.snapshot(shapes);
    return documents[set ? `${appId}:${pageId}` : appId]?.shapes ?? [];
  }

  function pageShapes(appId){
    const set = pageSets[appId];
    if (!set) return appId === app ? shapes : documents[appId]?.shapes ?? [];
    return set.list.flatMap((page) => appId === app && page.id === set.active ? shapes : documents[`${appId}:${page.id}`]?.shapes ?? []);
  }

  function currentApps(){
    const apps = {};
    const pages = {};
    const ids = new Set([...APPS.map((entry) => entry.id), ...Object.keys(documents).map((key) => key.split(":")[0])]);
    for (const appId of ids) {
      const set = pageSets[appId];
      if (set) {
        pages[appId] = { active: set.active, list: set.list.map((page) => ({ id: page.id, name: page.name, shapes: storedShapes(appId, page.id) })) };
        apps[appId] = storedShapes(appId, set.active);
      } else {
        apps[appId] = appId === app ? $state.snapshot(shapes) : documents[appId]?.shapes ?? [];
      }
    }
    return { apps, pages };
  }

  function resetInteraction(){
    pickTool("select");
    selectedId = null;
    selectedIds = [];
    clearSubSelection();
    placing = null;
    renamingId = null;
    renamingElementId = null;
    renamingFitting = null;
    editingTextId = null;
    targetChoice = null;
    branchEditing = false;
  }

  function stashCurrent(){
    documents[stashKey(app)] = { shapes: $state.snapshot(shapes), history: history.save() };
  }

  function loadStashed(key){
    const next = documents[key];
    delete documents[key];
    resetInteraction();
    history.load(next?.history ?? null);
    shapes = next?.shapes ?? [];
  }

  function selectPage(pageId){
    const set = pageSets[app];
    if (!set || set.active === pageId) return;
    stashCurrent();
    set.active = pageId;
    loadStashed(stashKey(app));
  }

  function addPage(){
    const set = pageSets[app];
    if (!set) return;
    const taken = new Set(set.list.map((page) => page.name));
    let index = set.list.length + 1;
    while (taken.has(`Page ${index}`)) index += 1;
    const id = newPageId();
    stashCurrent();
    set.list.push({ id, name: `Page ${index}` });
    set.active = id;
    loadStashed(stashKey(app));
  }

  function renamePage(pageId, name){
    const page = pageSets[app]?.list.find((entry) => entry.id === pageId);
    if (page) page.name = name;
  }

  function deletePage(pageId){
    const set = pageSets[app];
    if (!set || set.list.length < 2) return;
    const index = set.list.findIndex((page) => page.id === pageId);
    const page = set.list[index];
    if (!page) return;
    const filled = storedShapes(app, pageId).length > 0;
    if (filled && !window.confirm(`Delete "${page.name}" and everything on it?`)) return;
    const wasActive = set.active === pageId;
    set.list.splice(index, 1);
    delete documents[`${app}:${pageId}`];
    if (!wasActive) return;
    set.active = set.list[Math.min(index, set.list.length - 1)].id;
    loadStashed(stashKey(app));
  }

  function projectSettings(){
    return {
      grid: { size: gridSize, majorEvery, show: showGrid, snap: snapToGrid, minorColor: gridMinorColor, majorColor: gridMajorColor },
      drawing: { lineColor, lineWidth, rectStroke, rectFill, rectFilled },
      rooms: {
        roomFill, roomStroke, labelColor: roomLabelColor, floorFill, floorStroke, categoryColors: $state.snapshot(categoryColors),
        furnitureOpacity, floorWallWidth, roomWallWidth, wallStroke, wallWidth
      },
      hydronic: { library: hydronicLibrary, nodePrefix }
    };
  }

  function applySettings(settings){
    const number = (value, fallback) => Number.isFinite(value) ? value : fallback;
    const text = (value, fallback) => typeof value === "string" && value ? value : fallback;
    const flag = (value, fallback) => typeof value === "boolean" ? value : fallback;
    const grid = settings?.grid ?? {};
    const drawing = settings?.drawing ?? {};
    const rooms = settings?.rooms ?? {};
    gridSize = number(grid.size, 20);
    majorEvery = number(grid.majorEvery, 5);
    showGrid = flag(grid.show, true);
    snapToGrid = flag(grid.snap, true);
    gridMinorColor = text(grid.minorColor, "#E2E8F0");
    gridMajorColor = text(grid.majorColor, "#CBD5E1");
    lineColor = text(drawing.lineColor, "#2563EB");
    lineWidth = number(drawing.lineWidth, 2);
    rectStroke = text(drawing.rectStroke, "#0F172A");
    rectFill = text(drawing.rectFill, "#BFDBFE");
    rectFilled = flag(drawing.rectFilled, true);
    roomFill = text(rooms.roomFill, ROOM_STYLE.roomFill);
    roomStroke = text(rooms.roomStroke, ROOM_STYLE.roomStroke);
    roomLabelColor = text(rooms.labelColor, ROOM_STYLE.labelColor);
    floorFill = text(rooms.floorFill, ROOM_STYLE.floorFill);
    floorStroke = text(rooms.floorStroke, ROOM_STYLE.floorStroke);
    categoryColors = rooms.categoryColors && typeof rooms.categoryColors === "object" ? { ...defaultCategoryColors(), ...rooms.categoryColors } : defaultCategoryColors();
    furnitureOpacity = number(rooms.furnitureOpacity, 0.5);
    floorWallWidth = number(rooms.floorWallWidth, ROOM_STYLE.floorWidth);
    roomWallWidth = number(rooms.roomWallWidth, ROOM_STYLE.roomWidth);
    wallStroke = text(rooms.wallStroke, WALL_STYLE.stroke);
    wallWidth = number(rooms.wallWidth, WALL_STYLE.width);
    hydronicLibrary = text(settings?.hydronic?.library, HYDRONIC_STYLE.library);
    nodePrefix = typeof settings?.hydronic?.nodePrefix === "string" ? settings.hydronic.nodePrefix : "";
  }

  function usedImages(apps, pages){
    const ids = new Set();
    const visit = (list) => { for (const shape of list ?? []) if (shape.kind === "image" && shape.imageId) ids.add(shape.imageId); };
    Object.values(apps).forEach(visit);
    Object.values(pages).forEach((set) => set.list.forEach((page) => visit(page.shapes)));
    return Object.fromEntries([...ids].filter((id) => imageSources[id]).map((id) => [id, imageSources[id]]));
  }

  function currentDocument(withImages = true, name = documentName){
    const { apps, pages } = currentApps();
    return serializeDocument({
      app, apps, pages,
      canvas: { width: canvasWidth, height: canvasHeight, fill: canvasFill },
      name,
      io: { points: $state.snapshot(ioPoints), others: $state.snapshot(ioOthers) },
      settings: projectSettings(),
      images: withImages ? usedImages(apps, pages) : null,
      variables: $state.snapshot(variableNames)
    });
  }

  function applyDocument(doc){
    resetInteraction();
    documents = {};
    pageSets = {};
    const next = APPS.some((entry) => entry.id === doc.app) ? doc.app : app;
    nextId = highestId({ apps: doc.apps, pages: doc.pages }) + 1;
    const ready = prepareShapes;
    for (const entry of APPS) {
      const appId = entry.id;
      if (!PAGED_APPS.includes(appId)) {
        if (doc.apps[appId]) documents[appId] = { shapes: ready(doc.apps[appId]), history: null };
        continue;
      }
      const saved = doc.pages?.[appId];
      const list = Array.isArray(saved?.list) && saved.list.length
        ? saved.list.map((page, index) => ({ id: typeof page.id === "string" && page.id ? page.id : newPageId(), name: typeof page.name === "string" && page.name.trim() ? page.name.trim() : `Page ${index + 1}`, shapes: page.shapes }))
        : [{ id: newPageId(), name: "Page 1", shapes: doc.apps[appId] ?? [] }];
      const active = list.some((page) => page.id === saved?.active) ? saved.active : list[0].id;
      pageSets[appId] = { active, list: list.map((page) => ({ id: page.id, name: page.name })) };
      for (const page of list) documents[`${appId}:${page.id}`] = { shapes: ready(page.shapes), history: null };
    }
    app = next;
    loadStashed(stashKey(next));
    if (doc.canvas) {
      if (doc.canvas.width > 0) canvasWidth = doc.canvas.width;
      if (doc.canvas.height > 0) canvasHeight = doc.canvas.height;
      if (typeof doc.canvas.fill === "string") canvasFill = doc.canvas.fill;
    }
    documentName = doc.name ?? null;
    applySettings(doc.settings);
    variableNames = doc.variables ?? [];
    imageSources = doc.images ?? {};
    ioPoints = doc.io?.points ?? [];
    ioOthers = doc.io?.others ?? [];
  }

  const autosaved = loadAutosave();
  if (autosaved) applyDocument(autosaved);
  for (const appId of PAGED_APPS) ensurePages(appId);

  function projectHash(text){
    return hashText(text.replace(/"savedAt":"[^"]*",?/, "").replace(/"app":"[^"]*",?/, "").replace(/"active":"page-[^"]*",?/g, ""));
  }

  let documentText = $derived(currentDocument());
  let documentHash = $derived(projectHash(documentText));
  let savedHash = $state(loadText("pathfinder.savedHash", ""));
  $effect(() => saveText("pathfinder.savedHash", savedHash));
  let unsaved = $derived(documentHash !== savedHash);
  let autosaveFile = $state(loadFlag("pathfinder.autosaveFile", false));
  $effect(() => saveFlag("pathfinder.autosaveFile", autosaveFile));
  let fileWriting = $state(false);
  let projectTitle = $derived(documentName ?? "Untitled project");
  let projectStatus = $derived(
    fileWriting ? "saving"
    : autosaveFile && fileHandle && fileAccessState !== "granted" ? "paused"
    : unsaved ? (autosaveFile && fileHandle ? "pending" : fileHandle || savedHash ? "unsaved" : "unlinked")
    : autosaveFile && fileHandle ? "autosaved" : "saved"
  );

  let fileTimer;
  $effect(() => {
    const hash = documentHash;
    clearTimeout(fileTimer);
    if (!autosaveFile || !fileHandle || fileAccessState !== "granted" || hash === savedHash) return;
    fileTimer = setTimeout(autosaveToFile, 1500);
  });

  async function autosaveToFile(){
    if (fileWriting || !fileHandle) return;
    try {
      await writeProject(fileHandle, documentName);
    } catch (error) {
      fileAccessState = await fileAccess(fileHandle);
      if (fileAccessState === "granted") showFileNotice(`Autosave failed: ${error.message}`);
    }
  }

  let autosaveTimer;
  let autosaveWarned = false;
  $effect(() => {
    const text = documentText;
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      if (saveAutosave(text)) return;
      saveAutosave(currentDocument(false));
      if (autosaveWarned) return;
      autosaveWarned = true;
      showFileNotice("Images are too large for the browser's autosave. Save the project to keep them.");
    }, 400);
  });

  let fileHandle = $state.raw(null);
  let fileAccessState = $state("none");

  function linkFile(handle, access){
    fileHandle = handle;
    fileAccessState = handle ? access : "none";
    rememberFile(handle);
  }

  async function ensureAccess(){
    if (!fileHandle) return false;
    if (fileAccessState !== "granted") fileAccessState = await fileAccess(fileHandle, true);
    return fileAccessState === "granted";
  }

  async function resumeAutosave(){
    if (await ensureAccess()) autosaveToFile();
  }

  async function setAutosaveFile(on){
    if (!on) {
      autosaveFile = false;
      return;
    }
    if (!fileHandle) await saveProjectAs();
    if (!fileHandle || !(await ensureAccess())) return;
    autosaveFile = true;
  }

  recallFile().then(async (handle) => {
    if (!handle || fileHandle || !canPickFiles || cleanDocumentName(handle.name) !== documentName) return;
    fileHandle = handle;
    fileAccessState = await fileAccess(handle);
  });
  const FILE_TYPES = [{ description: "Pathfinder drawing", accept: { "application/json": [".json"] } }];
  const PICKER_ID = "pathfinder-project";
  const canPickFiles = typeof window !== "undefined" && typeof window.showSaveFilePicker === "function";

  function saveFailed(error){
    if (error?.name !== "AbortError") showFileNotice(`Could not save: ${error.message}`);
  }

  async function writeProject(handle, name, adopt = true){
    const text = currentDocument(true, name);
    const hash = projectHash(text);
    fileWriting = true;
    try {
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      if (adopt) savedHash = hash;
    } finally {
      fileWriting = false;
    }
  }

  async function saveProject(){
    if (!fileHandle) return saveProjectAs();
    if (!(await ensureAccess())) return saveProjectAs();
    try {
      await writeProject(fileHandle, documentName);
      showFileNotice(`Saved to ${fileHandle.name}`);
    } catch (error) {
      saveFailed(error);
    }
  }

  async function saveProjectAs(copy = false){
    if (!canPickFiles) {
      openSaveDialog(copy ? "copy" : "as");
      return;
    }
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileNameFor(documentName ?? defaultDocumentName()),
        types: FILE_TYPES,
        id: PICKER_ID,
        ...(fileHandle ? { startIn: fileHandle } : {})
      });
      const name = cleanDocumentName(handle.name);
      if (!copy) documentName = name;
      await writeProject(handle, name, !copy);
      if (!copy) linkFile(handle, "granted");
      showFileNotice(copy ? `Saved a copy to ${handle.name}` : `Saved to ${handle.name}`);
    } catch (error) {
      saveFailed(error);
    }
  }

  function downloadProject(name = documentName ?? defaultDocumentName(), adopt = false){
    const fileName = fileNameFor(name);
    const clean = cleanDocumentName(fileName);
    if (adopt) {
      documentName = clean;
      linkFile(null);
    }
    const text = currentDocument(true, clean);
    if (adopt) savedHash = projectHash(text);
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showFileNotice(`Downloaded ${fileName}`);
  }

  function prepareShapes(list){
    return anchorNames(nameFittings(migrateBranches(Array.isArray(list) ? list : [], () => nextId++)));
  }

  async function readProjectFile(){
    if (typeof window.showOpenFilePicker === "function") {
      const [handle] = await window.showOpenFilePicker({ types: FILE_TYPES, id: PICKER_ID });
      return { text: await (await handle.getFile()).text(), name: handle.name };
    }
    const text = await pickFileText();
    return { text, name: pickedFileName };
  }

  async function importPages(){
    const set = pageSets[app];
    if (!set) return;
    try {
      const file = await readProjectFile();
      const doc = parseDocument(file.text);
      const pages = importablePages(doc, app);
      if (!pages.length) {
        showFileNotice(`${file.name} has no ${currentApp.label} pages to import`);
        return;
      }
      const offset = nextId;
      const shifted = pages.map((page) => ({ ...page, shapes: shiftIds(page.shapes, offset) }));
      nextId = highestId(shifted) + 1;
      const images = { ...imageSources };
      for (const page of pages) {
        for (const imageId of imageIdsIn(page.shapes)) if (doc.images?.[imageId]) images[shiftImageId(imageId, offset)] = doc.images[imageId];
      }
      imageSources = images;
      stashCurrent();
      const taken = new Set(set.list.map((page) => page.name));
      let first = null;
      for (const page of shifted) {
        let name = page.name;
        for (let index = 2; taken.has(name); index += 1) name = `${page.name} (${index})`;
        taken.add(name);
        const id = newPageId();
        first ??= id;
        set.list.push({ id, name });
        documents[`${app}:${id}`] = { shapes: prepareShapes(page.shapes), history: null };
      }
      set.active = first;
      loadStashed(stashKey(app));
      showFileNotice(`Imported ${shifted.length} page${shifted.length === 1 ? "" : "s"} from ${file.name}`);
    } catch (error) {
      if (error?.name !== "AbortError") showFileNotice(`Could not import: ${error.message}`);
    }
  }

  function pickFileText(){
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,application/json";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return reject(Object.assign(new Error("No file"), { name: "AbortError" }));
        pickedFileName = file.name;
        resolve(await file.text());
      };
      input.click();
    });
  }

  function newProject(){
    const { apps, pages } = currentApps();
    const filled = Object.values(apps).some((list) => list.length) || Object.values(pages).some((set) => set.list.some((page) => page.shapes.length)) || ioPoints.length > 0;
    const pending = unsaved && filled && !(autosaveFile && fileHandle && fileAccessState === "granted");
    if (pending && !window.confirm(`Start a new project? Unsaved changes in "${projectTitle}" will be lost.`)) return;
    applyDocument({ app, apps: {}, pages: null, settings: null, images: {}, io: { points: [], others: [] }, name: null, canvas: { width: 1920, height: 1125, fill: "#FFFFFF" } });
    linkFile(null);
    savedHash = "";
    showFileNotice("New project");
  }

  async function openDrawing(){
    try {
      let text;
      if (typeof window.showOpenFilePicker === "function") {
        const [handle] = await window.showOpenFilePicker({ types: FILE_TYPES, id: PICKER_ID });
        text = await (await handle.getFile()).text();
        applyDocument(parseDocument(text));
        documentName = cleanDocumentName(handle.name) ?? documentName;
        linkFile(handle, await fileAccess(handle));
        savedHash = documentHash;
        showFileNotice(`Opened ${handle.name}`);
      } else {
        text = await pickFileText();
        applyDocument(parseDocument(text));
        linkFile(null);
        documentName = cleanDocumentName(pickedFileName) ?? documentName;
        savedHash = documentHash;
        showFileNotice("Drawing opened");
      }
    } catch (error) {
      if (error?.name !== "AbortError") showFileNotice(`Could not open: ${error.message}`);
    }
  }

  function viewKeydown(event){
    if (!(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey) return false;
    const index = /^Digit([1-9])$/.exec(event.code)?.[1];
    const target = index ? APPS[Number(index) - 1] : null;
    if (!target) return false;
    event.preventDefault();
    switchApp(target.id);
    return true;
  }

  let viewTitle = $derived(ioVisible ? `${currentApp.label} · IO list` : currentApp.label);

  function renameProject(value){
    const clean = cleanDocumentName(value);
    if (clean) documentName = clean;
  }

  function switchApp(id){
    if (id === app) return;
    stashCurrent();
    ensurePages(id);
    loadStashed(stashKey(id));
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
    if (viewKeydown(event)) return;
    if (ioVisible) {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && (key === "s" || key === "o")) appKeydown(event);
      return;
    }

    if (roomKeydown(event)) return;
    if (pipeKeydown(event)) return;
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

    const shortcut = (currentApp.shortcuts ?? { s: "select", h: "pan" })[event.key.toLowerCase()];
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
  let settingsSection = $state("general");

  const SETTINGS_SECTIONS = [
    { label: "Options", items: [{ id: "general", label: "General" }, { id: "canvas", label: "Canvas" }, { id: "shapes", label: "Shapes" }] },
    { label: "Views", items: [{ id: "floorplan", label: "Floor plan" }, { id: "hydronic", label: "Hydronic station" }] }
  ];

  let connectOpen = $state(false);
  let variablesOpen = $state(false);
  let linksOpen = $state(false);
  let showVariablePanel = $derived(variablePanel && app === "hydronic");
  let draggingVariable = $state(null);
  let linkHover = $state(null);
  let variableUse = $derived(variablesOpen || linksOpen || showVariablePanel ? variableUsage(pageShapes("hydronic")) : new Map());
  let linkTarget = $derived.by(() => {
    if (fittingGroup.length === 1 && !selectedShapes.length) {
      const { fitting } = fittingGroup[0];
      return { target: fitting, title: fitting.name || HYDRONIC_ELEMENTS[fitting.type]?.label || "Element", slots: fittingSlots(fitting) };
    }
    const elements = selectedElements();
    if (elements.length !== 1 || fittingGroup.length) return null;
    const element = elements[0];
    const spec = HYDRONIC_ELEMENTS[element.type];
    if (!spec || spec.device || spec.electric) return null;
    return { target: element, title: element.name || spec.label, slots: elementSlots(element) };
  });

  function addVariables(list){
    variableNames = [...variableNames, ...list.filter((name) => !variableNames.includes(name))];
    showFileNotice(`Added ${list.length} variable name${list.length === 1 ? "" : "s"}`);
  }

  function linkVariable(key, value){
    if (linkTarget) setSlot(linkTarget.target, key, value);
  }

  function dropSpot(event){
    const node = event.target?.closest?.("[data-link-key]");
    if (!node) return null;
    const fittingId = node.dataset.linkFitting;
    return { shapeId: Number(node.dataset.linkShape), fittingId: fittingId === undefined ? null : Number(fittingId), key: node.dataset.linkKey };
  }

  function dropOwner(spot){
    const shape = shapes.find((entry) => entry.id === spot.shapeId);
    if (!shape) return null;
    if (spot.fittingId === null) {
      const spec = HYDRONIC_ELEMENTS[shape.type];
      return { target: shape, title: shape.name || spec?.label || "Element", slots: elementSlots(shape) };
    }
    const fitting = shape.fittings?.find((entry) => entry.id === spot.fittingId);
    return fitting ? { target: fitting, title: fitting.name || HYDRONIC_ELEMENTS[fitting.type]?.label || "Element", slots: fittingSlots(fitting) } : null;
  }

  function variableOver(event){
    if (!draggingVariable) return;
    const spot = dropSpot(event);
    const same = spot && linkHover && spot.shapeId === linkHover.shapeId && spot.fittingId === linkHover.fittingId && spot.key === linkHover.key;
    if (!same) linkHover = spot;
    if (!spot) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "link";
  }

  function variableLeave(event){
    if (!svgEl?.contains(event.relatedTarget)) linkHover = null;
  }

  function variableDrop(event){
    const name = event.dataTransfer.getData("application/x-pathfinder-variable") || draggingVariable;
    const spot = dropSpot(event);
    linkHover = null;
    draggingVariable = null;
    if (!name || !spot) return;
    event.preventDefault();
    const owner = dropOwner(spot);
    const slot = owner?.slots.find((entry) => entry.key === spot.key);
    if (!slot) return;
    setSlot(owner.target, spot.key, name);
    const where = spot.key === "self" ? owner.title : `${owner.title} · ${slot.label}`;
    showFileNotice(slot.value && slot.value !== name ? `${where}: ${slot.value} → ${name}` : `Linked ${name} to ${where}`);
  }

  let wiringOpen = $state(false);

  function focusName(node){
    node.focus();
    node.select();
  }

  let fileItems = $derived([
    { label: "New project", hint: "Start an empty project", onclick: newProject },
    { label: "Open…", shortcut: "Ctrl+O", onclick: openDrawing },
    { separator: true },
    { label: "Save", shortcut: "Ctrl+S", hint: fileHandle ? "Update the current file" : "Choose where to save the project", onclick: saveProject },
    { label: "Save as…", shortcut: "Ctrl+Shift+S", hint: "New name or folder, keep working in the new file", onclick: () => saveProjectAs() },
    { label: "Save a copy…", hint: "Keep working in this file", onclick: () => saveProjectAs(true) },
    { label: "Download", hint: "Put a copy in the Downloads folder", onclick: () => downloadProject() },
    canPickFiles
      ? { toggle: true, label: "Autosave to file", checked: autosaveFile, onchange: setAutosaveFile, hint: autosaveFile ? "Every change is written to the project file" : "Write every change to the project file" }
      : { note: "This browser can't pick a folder, so projects go to Downloads. Use Chrome or Edge to choose where to save." },
    { separator: true },
    { label: "Settings…", hint: "Canvas, grid, colours and export paths", onclick: () => showDisplaySettings = true }
  ]);

  let importItems = $derived([
    { label: "Variable names…", hint: `${variableNames.length ? `${variableNames.length} in the project · ` : ""}names to link in the Hydronic station`, onclick: () => variablesOpen = true },
    app !== "electrical" ? { label: "Image…", hint: "A picture or plan on this page (pasting one works too)", onclick: openImagePicker } : null,
    pageSet ? { label: "Pages from another project…", hint: `Copy the ${currentApp.label} pages of another project file into this one`, onclick: importPages } : null,
    app === "electrical" ? { note: "Wiring is drawn from the IO list with From IO list… on the right." } : null
  ]);

  let exportItems = $derived([
    app !== "electrical" ? { label: "Copy SVG", hint: "atvise SVG of this page, to the clipboard", disabled: shapes.length === 0, onclick: handleExport } : null,
    currentApp.exports.includes("pgd") ? { label: "Copy pGD page", hint: "pGD page code (wgtPage), to the clipboard", disabled: shapes.length === 0, onclick: copyPgd } : null,
    currentApp.exports.includes("pgd") ? { label: "Download pGD images", hint: "Images this page uses, for the project's images folder", disabled: shapes.length === 0, onclick: downloadPgdImages } : null,
    app === "network" ? { label: "atvise connect configuration…", hint: "Modbus connections for all topology pages", disabled: pageShapes("network").length === 0, onclick: () => connectOpen = true } : null,
    app === "electrical" ? { label: "Print / Save as PDF", hint: "Choose Save as PDF in the print dialog", disabled: !shapes.some((shape) => shape.kind === "equipment"), onclick: printWiring } : null
  ]);

  function readHex(event, current){
    const value = event.currentTarget.value.trim();
    const next = /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : current;
    event.currentTarget.value = next;
    return next;
  }

  function buildPgd(){
    return hydronicToPgd(shapes, { ...hydronicStyle, iconSources: ICON_SOURCES }, { width: canvasWidth, height: canvasHeight, name: "Page1" });
  }

  async function copyPgd(){
    try {
      await navigator.clipboard.writeText(buildPgd().page);
      showFileNotice("pGD page copied to the clipboard");
    } catch (err) {
      showFileNotice(`Could not copy: ${err.message}`);
    }
  }

  function downloadPgdImages(){
    const result = buildPgd();
    const blob = zipFiles(result.images.map((image) => ({ name: image.name.replace(/^images\//, ""), data: image.data })));
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pathfinder-pgd-images.zip";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showFileNotice(`Downloaded ${result.images.length} pGD image${result.images.length === 1 ? "" : "s"}`);
  }

  function buildSvg(){
    const texts = shapes.filter((shape) => shape.kind === "text").map(textToSvg);
    if (app === "hydronic" || app === "network") return atviseDocument(canvasWidth, canvasHeight, [hydronicToSvg(shapes, hydronicStyle), ...texts].filter(Boolean).join("\n"));
    const body = [roomsToSvg(shapes, roomStyle, canvasFill), ...layered(shapes).filter((shape) => !isRoomShape(shape) && shape.kind !== "image" && shape.kind !== "wall").map((shape) => {
      if (shape.kind === "curve") return curveToSvg(shape, lineColor);
      if (shape.kind === "text") return textToSvg(shape);
      if (shape.kind === "line") {
        return `<path d="${pathFor(shape.points)}" fill="none" id="trace_${shape.id}" stroke="${lineColor}" stroke-linecap="square" stroke-linejoin="miter" stroke-width="${lineWidth}"/>`;
      }
      return `<rect fill="${rectFilled ? rectFill : "none"}" height="${shape.height}" id="rect_${shape.id}" stroke="${rectStroke}" stroke-width="${lineWidth}" width="${shape.width}" x="${shape.x}" y="${shape.y}"/>`;
    })].filter(Boolean).join("\n  ");

    return atviseDocument(canvasWidth, canvasHeight, body);

  }

  async function handleExport(){
    try {
      await navigator.clipboard.writeText(buildSvg());
      showFileNotice("SVG copied to the clipboard");
    } catch (err) {
      showFileNotice(`Could not copy: ${err.message}`);
    }
  }
</script>

<style>
  :global(body) {
    height: 100dvh;
    width: 100vw;
    font-family: 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
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
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
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

  .header-left {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    min-width: 0;
  }


  .logo-section {
    display: flex;
    flex: none;
    align-items: center;
    margin-right: 2px;
    color: #1E293B;
  }

  .logo{
    height: 26px;
  }

  .header-divider {
    flex: none;
    width: 1px;
    height: 20px;
    margin: 0 6px;
    background: #e2e8f0;
  }

  .menus {
    display: flex;
    flex: none;
    align-items: center;
    gap: 2px;
  }

  button.header-action {
    height: 30px;
    padding: 0 14px;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    background: #ffffff;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    color: #1d4ed8;
    white-space: nowrap;
    cursor: pointer;
  }

  button.header-action:hover {
    background: #eff6ff;
  }

  .settings {
    display: grid;
    grid-template-columns: 210px minmax(0, 1fr);
    width: 100%;
    height: min(640px, calc(100dvh - 140px));
  }

  .settings-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 14px 10px;
    overflow-y: auto;
    border-right: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 0 0 0 12px;
  }

  .settings-group {
    padding: 12px 10px 6px;
    font-size: 11.5px;
    font-weight: 600;
    color: #94a3b8;
  }

  .settings-group:first-child {
    padding-top: 2px;
  }

  .settings-nav button {
    height: 32px;
    padding: 0 10px;
    border: none;
    border-radius: 6px;
    background: none;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    text-align: left;
    color: #334155;
    cursor: pointer;
  }

  .settings-nav button:hover {
    background: #eef2f7;
  }

  .settings-nav button.active {
    background: #e2eaf6;
    color: #1d4ed8;
    font-weight: 600;
  }

  .settings-content {
    overflow-y: auto;
    padding: 22px 32px 32px;
  }

  .settings-content h3 {
    margin: 0;
    font-family: 'Sora', 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    font-size: 17px;
    font-weight: 600;
    color: #0f172a;
  }

  .settings-content h4 {
    margin: 26px 0 10px;
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
  }

  .settings-note {
    margin: 4px 0 16px;
    font-size: 12px;
    color: #94a3b8;
  }

  .settings-card {
    padding: 0 20px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #ffffff;
  }

  .setting {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 16px 0;
  }

  .setting + .setting {
    border-top: 1px solid #eef2f7;
  }

  .setting-text {
    flex: 1;
    min-width: 0;
  }

  .setting-title {
    font-size: 13.5px;
    font-weight: 500;
    color: #0f172a;
  }

  .setting-desc {
    margin-top: 3px;
    font-size: 12.5px;
    line-height: 1.45;
    color: #64748b;
  }

  .setting-control {
    display: flex;
    align-items: center;
    flex: none;
  }

  .setting-control input[type="text"],
  .setting-control input[type="number"] {
    height: 32px;
    padding: 0 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font-family: inherit;
    font-size: 13px;
    color: #0f172a;
    box-sizing: border-box;
  }

  .setting-control input[type="text"]:focus,
  .setting-control input[type="number"]:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .setting-control input[type="color"] {
    width: 32px;
    height: 32px;
    padding: 2px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    cursor: pointer;
  }

  .color-input {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .color-input input[type="text"] {
    width: 92px;
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: 12px;
    text-transform: uppercase;
  }

  .number-input,
  .size-input,
  .range-input {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    color: #64748b;
  }

  .number-input input,
  .size-input input {
    width: 88px;
  }

  .range-input input {
    width: 160px;
  }

  .range-input span {
    min-width: 36px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  input.text-input {
    width: 300px;
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: 12px;
  }

  .category-colors {
    display: flex;
    gap: 14px;
  }

  .category-colors label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #64748b;
  }

  .settings-button {
    height: 32px;
    padding: 0 14px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    color: #334155;
    cursor: pointer;
  }

  .settings-button:hover {
    background: #f1f5f9;
  }

  .switch {
    position: relative;
    display: inline-flex;
    width: 40px;
    height: 22px;
    cursor: pointer;
  }

  .switch input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }

  .switch span {
    width: 100%;
    height: 100%;
    border-radius: 999px;
    background: #cbd5e1;
    transition: background-color 0.15s ease;
  }

  .switch span::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.25);
    transition: transform 0.15s ease;
  }

  .switch input:checked + span {
    background: #2563eb;
  }

  .switch input:checked + span::after {
    transform: translateX(18px);
  }

  .switch input:focus-visible + span {
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  .save-name {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
  }

  .save-name label {
    font-weight: 600;
    color: #0f172a;
  }

  .save-name-row {
    display: flex;
    align-items: center;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
  }

  .save-name-row:focus-within {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .save-name-row input {
    flex: 1;
    min-width: 0;
    height: 34px;
    padding: 2px 10px;
    border: none;
    outline: none;
    background: transparent;
    font: inherit;
    color: #0f172a;
  }

  .save-name-row span {
    padding-right: 10px;
    color: #94a3b8;
  }

  button.modal-button {
    height: 32px;
    padding: 0 16px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
  }

  button.modal-button:hover {
    background: #f1f5f9;
  }

  button.modal-button.primary {
    border-color: #2563eb;
    background: #2563eb;
    color: #ffffff;
  }

  button.modal-button.primary:hover {
    background: #1d4ed8;
  }

  .app-layout {
    display: grid;
    grid-template-columns: var(--activity-width, 48px) 52px auto minmax(0, 1fr) auto;
    grid-template-areas: "activity tools vars stage panel";
    gap: 0;
    align-items: stretch;
    height: calc(100dvh - 44px);
    margin: 0;
  }

  .app-layout > :global(.toolbar) {
    grid-area: tools;
  }

  .viewer-section {
    position: relative;
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
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    width: 100%;
    height: 40px;
    padding: 0 12px;
    margin-bottom: 0;
    border-bottom: 1px solid #e2e8f0;
    box-sizing: border-box;
    position: relative;
    z-index: 3;
  }

  .branch-banner {
    position: absolute;
    top: 12px;
    left: 50%;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: calc(100% - 32px);
    padding: 7px 8px 7px 14px;
    border: 1px solid #c4b5fd;
    border-radius: 999px;
    background: #f5f3ff;
    box-shadow: 0 6px 20px rgba(76, 29, 149, 0.16);
    transform: translateX(-50%);
    font-size: 12px;
    color: #4c1d95;
    white-space: nowrap;
  }

  .branch-banner span:not(.branch-dot) {
    overflow: hidden;
    text-overflow: ellipsis;
    color: #6d28d9;
  }

  .branch-dot {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
  }

  .branch-banner button {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 26px;
    padding: 0 10px;
    border: none;
    border-radius: 999px;
    background: #7c3aed;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: #ffffff;
    cursor: pointer;
  }

  .branch-banner button:hover {
    background: #6d28d9;
  }

  .branch-banner kbd {
    padding: 0 4px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.2);
    font-family: inherit;
    font-size: 10px;
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
    font-family: 'Sora', 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
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
  .selection-section select {
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

</style>

<title>{unsaved && !(autosaveFile && fileHandle) ? "• " : ""}{projectTitle} — Pathfinder</title>

<svelte:window onkeydown={handleKeydown} onpaste={handlePaste}
               oncopy={handleCopy} oncut={handleCut}/>

{@html HYDRONIC_SPRITE}

<div class="header">
  <div class="header-left">
    <div class="logo-section">
      <img class="logo" src="{base}/logo.svg" alt="Pathfinder" title="Pathfinder {__APP_VERSION__} · commit {__APP_COMMIT__}">
    </div>
    <nav class="menus" aria-label="Main menu">
      <HeaderMenu label="File" items={fileItems} width={290}
                  status={{ label: "Saving to", value: fileHandle?.name ?? null, empty: "Not saved to a file yet" }}/>
      <HeaderMenu label="Import" items={importItems} width={290}/>
      <HeaderMenu label="Export" items={exportItems} width={290}/>
    </nav>
    <span class="header-divider" aria-hidden="true"></span>
    <ProjectCrumb name={projectTitle} view={viewTitle} fileName={fileHandle?.name ?? null} status={projectStatus}
                  onrename={renameProject} onresume={resumeAutosave}/>
  </div>

  <div class="header-right">
    {#if app === "electrical"}
      <button class="header-action" type="button" onclick={() => wiringOpen = true}
              title="Draw the controller terminals of IO points that are not in the drawing yet">From IO list…</button>
    {/if}
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

<div class="app-layout" style:--activity-width={viewsOnHover ? "6px" : "40px"}>
  <ActivityBar apps={APPS} current={app} onswitch={switchApp} view={ioOpen ? "io" : "drawing"} onview={(id) => ioOpen = id === "io"} autohide={viewsOnHover}/>
  <Toolbar {tool} onpick={pickTool} onimage={openImagePicker} showHints={showToolHints}
           {elementsOpen} ontoggleelements={() => elementsOpen = !elementsOpen}
           tools={currentApp.tools} general={GENERAL_TOOLS} special={currentApp.special} pipeLabel={currentApp.pipeLabel ?? null} automations={currentApp.automations}
           canplacedoors={shapes.some((shape) => shape.kind === "room")}
           canfurnish={shapes.some((shape) => shape.kind === "room" && FURNISHABLE.includes(shape.category))}
           onplacedoors={placeDoors} onfurnish={furnishOffices}
           variablesOpen={showVariablePanel} ontogglevariables={app === "hydronic" ? () => variablePanel = !variablePanel : null}/>
  {#if showVariablePanel}
    <VariablePanel names={variableNames} usage={variableUse} dragging={draggingVariable}
                   onmanage={() => variablesOpen = true} onclose={() => variablePanel = false}
                   ondrag={(name) => { draggingVariable = name; if (!name) linkHover = null; }}/>
  {/if}
  <input class="image-input" type="file" accept="image/*" bind:this={imageInput}
         onchange={(e) => { readImage(e.currentTarget.files?.[0]); e.currentTarget.value = ""; }}>

  <div class="selection-section" class:collapsed={!sidebarOpen} id="settings-panel">

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
            <span class="kind">{shape.kind === "text" ? "Text" : shape.kind === "line" ? "Trace" : shape.kind === "rect" ? "Rect" : roomKindLabel(shape.kind)}</span>
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

  </div>

  <div class="viewer-section">
    <div class="viewer-header">
      <ToolOptions {tool} {elbow} elbows={ELBOWS} {selection} {lineWidth} {snapToGrid} target={shapeTarget}
                   onlinewidth={(value) => lineWidth = value} onelbow={(value) => elbow = value}
                   onsnap={(value) => snapToGrid = value} ontarget={(value) => targetChoice = value}
                  
                   door={doorOptions} oncategory={setCategory} ondoor={updateDoor} ondoorremove={removeDoor}
                   onthermostat={setThermostat}
                   onopacity={setImageOpacity} onfitimage={fitImage}
                   furniture={furnitureOptions} onfurnish={furnishSelected} onclearfurniture={clearFurniture}
                   onfurniturerotate={rotateFurniture} onfurnitureremove={removeFurniture}
                   placing={placingOptions} onrotateplacing={rotatePlacing}
                   fitting={fittingOptions} medium={pipeMedium} onmedium={setMedium}
                   pipewidth={pipeThickness} onpipewidth={setPipeWidth} onedittext={editSelectedText} ontextstyle={setTextStyle}
                   onfittingflip={flipFitting} onfittingturn={turnFitting} onvariables={linkTarget ? () => linksOpen = true : null} onfittingremove={removeFitting}
                   onfittingscale={setFittingScale} onreverse={reversePipes} onpipelayer={pipeLayer}
                   onresetsize={resetElementSize}
                   onfittingreadout={setFittingReadout} onmeterreadout={setMeterReadout} onreadoutreset={resetReadoutPosition} onbranchparam={setBranchParam} onbranchname={setBranchName} ondeviceparam={setDeviceParam}
                   network={networkSelection} onconnect={connectSelected} onadddevices={addDevices}
                   onelementrotate={rotateElements} onelementsize={setElementSize} ontankprobe={toggleTankProbe}
                   groups={selectionGroups} onnamesize={setNameSize} onfittingnamesize={setFittingNameSize} onreadoutscale={setReadoutScale} onfittingname={setFittingName}
                   onradius={setCornerRadius}
                   parts={partOptions} onpartsremove={removeParts} onkind={setShapeKind} onlabelsize={setLabelSize} onhideedges={hideEdges} onshowname={showRoomNames}
                   onname={(value) => selectedShape && setRoomName(selectedShape, value)}/>
    </div>

    <div class="svg-container" bind:clientWidth={viewport.width} bind:clientHeight={viewport.height}>
      <svg class="preview-svg" class:drawing bind:this={svgEl}
           width="100%" height="100%"
           role="application" aria-label="Drawing canvas"
           use:panZoom={{ viewport, panTool: tool === "pan" }}
           onpointerdown={handleDown} onpointermove={handleMove} onpointerleave={handleLeave}
           ondragover={variableOver} ondragleave={variableLeave} ondrop={variableDrop}
           oncontextmenu={openArrange}>
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
        <rect x="0" y="0" width={boardWidth} height={boardHeight} fill={canvasFill}/>
        <ImageLayer {shapes} sources={imageSources} interactive={tool === "select"}/>
        {#if showGrid && majorSize * viewport.zoom >= MIN_GRID_PX}
          <rect x="0" y="0" width={boardWidth} height={boardHeight} fill="url(#grid_major)" pointer-events="none"/>
        {/if}
        <rect x="0" y="0" width={boardWidth} height={boardHeight} fill="none"
              stroke="#94A3B8" stroke-width="1" vector-effect="non-scaling-stroke" pointer-events="none"/>
        {#if electricBoard}
          <g pointer-events="none">{@html sheetsSvg(electricBoard.pages, electricBoard.used, sheetMeta)}</g>
        {/if}

        <RoomLayer {shapes} {draft} {cursor} selectedIds={selectionIds} zoom={viewport.zoom} style={roomStyle} labelsMovable={tool === "select"}
                   selectedFurniture={furnitureGroup.map((part) => ({ roomId: part.roomId, itemId: part.id }))}
                   interactive={tool === "select"}/>

        <WallLayer {shapes} selectedIds={selectionIds} style={roomStyle} interactive={tool === "select"}/>

        <DoorLayer {shapes} style={roomStyle} background={roomStyle.floorFill} interactive={tool === "select"}
                   selectedDoors={doorGroup.map((part) => ({ roomId: part.roomId, id: part.id }))}/>

        <ThermostatLayer {shapes} style={roomStyle} interactive={tool === "select"}/>

        <HydronicLayer {shapes} routes={pipeRoutes} zoom={viewport.zoom} {tool} interactive={tool === "select"}
                       selectedIds={selectionIds} fresh={freshPipes} preview={pipePreview} target={portTarget}
                       selectedFitting={activeFitting ? { pipeId: activeFitting.pipe.id, fittingId: activeFitting.fitting.id } : null}
                       selectedFittings={fittingGroup.map((entry) => ({ pipeId: entry.pipe.id, fittingId: entry.fitting.id }))}
                       {placement} style={hydronicStyle} hidden={pipeDraft?.rewire?.pipeId ?? null}
                       showPorts={!!pipeDraft?.rewire} readouts={readoutBoxes} renaming={renamingElementId} renamingFitting={renamingFitting} guide={pipeAim.guide} {branchEditing}
                       linking={draggingVariable ? { hover: linkHover } : null}/>

        <TextLayer {shapes} selectedIds={selectionIds} interactive={tool === "select"} zoom={viewport.zoom} hidden={editingTextId}/>

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
            <line x1="0" x2={boardWidth} y1={cursor.y} y2={cursor.y} stroke="#2563EB"
                  stroke-width="1" stroke-dasharray="4 4" opacity="0.4" vector-effect="non-scaling-stroke"/>
            <line x1={cursor.x} x2={cursor.x} y1="0" y2={boardHeight} stroke="#2563EB"
                  stroke-width="1" stroke-dasharray="4 4" opacity="0.4" vector-effect="non-scaling-stroke"/>
            <circle cx={cursor.x} cy={cursor.y} r={Math.max(3, gridSize / 6) / viewport.zoom}
                    fill="#FFFFFF" stroke="#2563EB" stroke-width="2" vector-effect="non-scaling-stroke"/>
          </g>
        {/if}

        <CurveLayer {shapes} {draft} {cursor} {selectedId} zoom={viewport.zoom} color={lineColor}
                    width={2} interactive={tool === "select"}/>

        {#if draft?.kind === "pen"}
          <PenPreview {draft} {cursor} zoom={viewport.zoom} color={draft.target === "wall" ? wallStroke : draft.target === "floor" ? floorStroke : roomStroke}/>
        {/if}

        {#each editableShapes as shape (shape.id)}
          <VertexHandles {shape} zoom={viewport.zoom}
                         points={activePoints.filter((key) => key.id === shape.id).map((key) => key.index)}
                         edges={activeEdges.filter((key) => key.id === shape.id).map((key) => key.index)}/>
        {/each}

        {#each editedBranches as open, index (index)}
          <g pointer-events="none">
            <rect x={open.x - 16} y={open.y - 16} width={open.width + 32} height={open.height + 32} rx="8" fill="#7C3AED" fill-opacity="0.05"
                  stroke="#7C3AED" stroke-width="2" vector-effect="non-scaling-stroke"/>
            <rect x={open.x - 16} y={open.y - 16 - 22 / viewport.zoom} width={58 / viewport.zoom} height={20 / viewport.zoom} rx={4 / viewport.zoom} fill="#7C3AED"/>
            <text x={open.x - 16 + 29 / viewport.zoom} y={open.y - 16 - 8 / viewport.zoom} text-anchor="middle" font-family="'IBM Plex Sans', sans-serif"
                  font-size={11 / viewport.zoom} font-weight="700" fill="#FFFFFF">Editing</text>
          </g>
        {/each}
        {#if transformBox}
          <TransformFrame box={transformBox} zoom={viewport.zoom} rotate={(selectedShapes.length > 0 && !branchSelected) || furnitureGroup.length > 0}
                          corners={branchSelected} axis={branchSelected ? "y" : singleBar ? (singleBar.height > singleBar.width ? "y" : "x") : null}/>
        {/if}

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

      {#if branchEditing}
        <div class="branch-banner" role="status">
          <span class="branch-dot" aria-hidden="true"></span>
          <strong>Editing branches</strong>
          <span>Drag parts along their pipes · Ctrl+click or drag a box to select across branches</span>
          <button type="button" onclick={() => branchEditing = false}>Done <kbd>Esc</kbd></button>
        </div>
      {/if}

      {#if renamingRoom && renamePosition}
        {#key renamingId}
          <RoomNameEditor x={renamePosition.x} y={renamePosition.y} value={renamingRoom.name}
                          oncommit={commitRename} oncancel={() => renamingId = null}/>
        {/key}
      {/if}

      {#if renamingElement && elementRenamePosition}
        {#key renamingElementId}
          <RoomNameEditor x={elementRenamePosition.x} y={elementRenamePosition.y} value={renamingElement.name ?? ""} label="Element name"
                          oncommit={commitElementRename} oncancel={() => renamingElementId = null}/>
        {/key}
      {/if}

      {#if renamingFittingEntry && fittingRenamePosition}
        {#key `${renamingFitting.pipeId}:${renamingFitting.fittingId}`}
          <RoomNameEditor x={fittingRenamePosition.x} y={fittingRenamePosition.y} value={renamingFittingEntry.fitting.name ?? ""} label="Element name"
                          oncommit={commitFittingRename} oncancel={() => renamingFitting = null}/>
        {/key}
      {/if}

      {#if editingText && textEditPosition}
        {#key editingTextId}
          <TextEditor x={textEditPosition.x} y={textEditPosition.y} zoom={viewport.zoom} shape={editingText}
                      oncommit={commitText} oncancel={cancelText}/>
        {/key}
      {/if}

      <CanvasNotice message={notice}/>

      <ZoomControls {viewport} onfit={fitContent} onselection={transformBox ? zoomToSelection : null}/>
    </div>

    {#if ioVisible}
      <IoView bind:points={ioPoints} bind:others={ioOthers} branches={ioBranches} onnotice={showFileNotice}/>
      <CanvasNotice message={notice}/>
    {/if}

    {#if elementsOpen}
      <ElementBar active={tool === "place" ? placing?.type : null} onpick={startPlacing}
                  groups={currentApp.elements} empty="{currentApp.label} elements and drawing rules come next."
                  onclose={() => elementsOpen = false}/>
    {/if}

    {#if pageSet && !ioVisible}
      <PageTabs pages={pageSet.list} active={pageSet.active} onselect={selectPage} onadd={addPage} onrename={renamePage} ondelete={deletePage}
                version={__APP_VERSION__} build={__APP_COMMIT__}
                position={cursor ? `${draft ? `${draft.start.x}, ${draft.start.y} → ` : ""}${cursor.x}, ${cursor.y}` : ""}/>
    {/if}
  </div>
</div>

{#snippet settingRow(title, description, control)}
  <div class="setting">
    <div class="setting-text">
      <div class="setting-title">{title}</div>
      {#if description}<div class="setting-desc">{description}</div>{/if}
    </div>
    <div class="setting-control">{@render control()}</div>
  </div>
{/snippet}

{#snippet colorInput(value, set, label)}
  <div class="color-input">
    <input type="color" aria-label="{label} colour" {value} oninput={(e) => set(e.currentTarget.value.toUpperCase())}>
    <input type="text" aria-label="{label} hex" {value} spellcheck="false" onchange={(e) => set(readHex(e, value))}>
  </div>
{/snippet}

{#snippet colorRow(title, description, value, set)}
  {#snippet control()}{@render colorInput(value, set, title)}{/snippet}
  {@render settingRow(title, description, control)}
{/snippet}

{#snippet numberRow(title, description, value, set, min, max, step = 1, unit = "")}
  {#snippet control()}
    <div class="number-input">
      <input type="number" aria-label={title} {min} {max} {step} {value}
             oninput={(e) => { const next = e.currentTarget.valueAsNumber; if (Number.isFinite(next)) set(next); }}>
      {#if unit}<span>{unit}</span>{/if}
    </div>
  {/snippet}
  {@render settingRow(title, description, control)}
{/snippet}

{#snippet toggleRow(title, description, checked, set)}
  {#snippet control()}
    <label class="switch">
      <input type="checkbox" role="switch" aria-label={title} {checked} onchange={(e) => set(e.currentTarget.checked)}>
      <span aria-hidden="true"></span>
    </label>
  {/snippet}
  {@render settingRow(title, description, control)}
{/snippet}

{#snippet textRow(title, description, value, set, placeholder = "")}
  {#snippet control()}
    <input class="text-input" type="text" aria-label={title} {value} {placeholder} spellcheck="false"
           onchange={(e) => set(e.currentTarget.value.trim())}>
  {/snippet}
  {@render settingRow(title, description, control)}
{/snippet}

{#if showDisplaySettings}
  <Modal title="Settings" width={980} flush onclose={() => showDisplaySettings = false}>
    <div class="settings">
      <nav class="settings-nav" aria-label="Settings sections">
        {#each SETTINGS_SECTIONS as group (group.label)}
          <span class="settings-group">{group.label}</span>
          {#each group.items as section (section.id)}
            <button type="button" class:active={settingsSection === section.id} aria-current={settingsSection === section.id ? "page" : undefined}
                    onclick={() => settingsSection = section.id}>{section.label}</button>
          {/each}
        {/each}
      </nav>

      <div class="settings-content">
        {#if settingsSection === "general"}
          <h3>General</h3>
          <p class="settings-note">Saved in this browser, for every project.</p>
          <div class="settings-card">
            {@render toggleRow("Tool hints", "Explain each tool and its shortcuts in the toolbar tooltips.", showToolHints, (value) => showToolHints = value)}
            {@render toggleRow("View bar on hover", "Keep the view bar hidden at the left edge until you hover it. Turn off to always show the icon rail.", viewsOnHover, (value) => viewsOnHover = value)}
          </div>
        {:else if settingsSection === "canvas"}
          <h3>Canvas</h3>
          <p class="settings-note">Saved with the project.</p>
          <div class="settings-card">
            {#snippet sizeControl()}
              <div class="size-input">
                <input type="number" aria-label="Canvas width" min="100" step="100" value={canvasWidth}
                       oninput={(e) => { const next = e.currentTarget.valueAsNumber; if (Number.isFinite(next)) canvasWidth = next; }}>
                <span>×</span>
                <input type="number" aria-label="Canvas height" min="100" step="100" value={canvasHeight}
                       oninput={(e) => { const next = e.currentTarget.valueAsNumber; if (Number.isFinite(next)) canvasHeight = next; }}>
              </div>
            {/snippet}
            {@render settingRow("Canvas size", "Width and height of the drawing area in pixels. Exports use this size.", sizeControl)}
            {@render colorRow("Background", "Fill behind the drawing, also used in exports.", canvasFill, (value) => canvasFill = value)}
          </div>
          <h4>Grid</h4>
          <div class="settings-card">
            {@render numberRow("Heavier line every", "Number of cells between the darker grid lines.", majorEvery, (value) => majorEvery = value, 2, 20, 1, "cells")}
            {@render colorRow("Minor lines", "Colour of the regular grid lines.", gridMinorColor, (value) => gridMinorColor = value)}
            {@render colorRow("Major lines", "Colour of the darker grid lines.", gridMajorColor, (value) => gridMajorColor = value)}
          </div>
        {:else if settingsSection === "shapes"}
          <h3>Shapes</h3>
          <p class="settings-note">Saved with the project.</p>
          <div class="settings-card">
            {@render numberRow("Stroke width", "Line thickness of traces and rectangles.", lineWidth, (value) => lineWidth = value, 1, 12, 1, "px")}
            {@render colorRow("Trace", "Colour of traces drawn with the line tool.", lineColor, (value) => lineColor = value)}
            {@render colorRow("Rectangle border", "Outline colour of rectangles.", rectStroke, (value) => rectStroke = value)}
            {@render toggleRow("Fill rectangles", "Give rectangles a solid fill.", rectFilled, (value) => rectFilled = value)}
            {#if rectFilled}
              {@render colorRow("Rectangle fill", "Fill colour of rectangles.", rectFill, (value) => rectFill = value)}
            {/if}
          </div>
        {:else if settingsSection === "floorplan"}
          <h3>Floor plan</h3>
          <p class="settings-note">Saved with the project.</p>
          <div class="settings-card">
            {@render colorRow("Room fill", "Fill of rooms without a category.", roomFill, (value) => roomFill = value)}
            {@render colorRow("Room border", "Outline of rooms without a category.", roomStroke, (value) => roomStroke = value)}
            {@render colorRow("Room name", "Colour of room names.", roomLabelColor, (value) => roomLabelColor = value)}
            {@render colorRow("Floor fill", "Fill of the floor outline.", floorFill, (value) => floorFill = value)}
            {@render colorRow("Floor border", "Outline of the floor.", floorStroke, (value) => floorStroke = value)}
          </div>
          <h4>Walls</h4>
          <div class="settings-card">
            {@render numberRow("Floor wall", "Thickness of the outer floor walls.", floorWallWidth, (value) => floorWallWidth = value, 1, 60, 1, "cm")}
            {@render numberRow("Room wall", "Thickness of walls between rooms.", roomWallWidth, (value) => roomWallWidth = value, 1, 60, 1, "cm")}
            {@render numberRow("Wall", "Thickness of walls drawn on their own.", wallWidth, (value) => wallWidth = value, 1, 60, 1, "cm")}
            {@render colorRow("Wall colour", "Colour of walls drawn on their own.", wallStroke, (value) => wallStroke = value)}
          </div>
          <h4>Furniture</h4>
          <div class="settings-card">
            {#snippet opacityControl()}
              <div class="range-input">
                <input type="range" aria-label="Furniture opacity" min="0.1" max="1" step="0.05" value={furnitureOpacity}
                       oninput={(e) => furnitureOpacity = e.currentTarget.valueAsNumber} style="--fill: {((furnitureOpacity - 0.1) / 0.9) * 100}%">
                <span>{Math.round(furnitureOpacity * 100)}%</span>
              </div>
            {/snippet}
            {@render settingRow("Furniture opacity", "How strongly furniture shows over the rooms.", opacityControl)}
          </div>
          <h4>Room categories</h4>
          <div class="settings-card">
            {#each ROOM_CATEGORIES as category (category.id)}
              {#snippet categoryControl()}
                <div class="category-colors">
                  <label><span>Fill</span><input type="color" aria-label="{category.label} fill" value={categoryColors[category.id].fill}
                         oninput={(e) => categoryColors[category.id].fill = e.currentTarget.value}></label>
                  <label><span>Border</span><input type="color" aria-label="{category.label} border" value={categoryColors[category.id].stroke}
                         oninput={(e) => categoryColors[category.id].stroke = e.currentTarget.value}></label>
                </div>
              {/snippet}
              {@render settingRow(category.label, "", categoryControl)}
            {/each}
            {#snippet resetControl()}
              <button type="button" class="settings-button" onclick={() => categoryColors = defaultCategoryColors()}>Reset</button>
            {/snippet}
            {@render settingRow("Reset category colours", "Go back to the default fill and border of every category.", resetControl)}
          </div>
        {:else if settingsSection === "hydronic"}
          <h3>Hydronic station</h3>
          <p class="settings-note">Saved with the project.</p>
          <div class="settings-card">
            {@render textRow("atvise object folder", "Library path of the object displays that elements reference in the atvise export.", hydronicLibrary, (value) => hydronicLibrary = value || HYDRONIC_STYLE.library)}
            {@render textRow("Variable node path", "Written in front of each linked variable name, into the base parameter of the exported element.", nodePrefix, (value) => nodePrefix = value, "AGENT.OBJECTS.Toplotne_Postaje.Celica_1")}
          </div>
        {/if}
      </div>
    </div>
  </Modal>
{/if}

{#if arrangeContext}
  <ArrangeMenu x={arrangeMenu.x} y={arrangeMenu.y} context={arrangeContext} onclose={() => arrangeMenu = null}
               onorder={reorderSelection} onalign={alignSelection} ondistribute={distributeSelection} onrotate={rotateSelection}
               onflip={flipSelection} ongroup={groupSelection} onungroup={ungroupSelection} onlock={lockSelection}/>
{/if}

{#if variablesOpen}
  <VariableList names={variableNames} usage={variableUse} onadd={addVariables} prefix={nodePrefix} onprefix={(value) => nodePrefix = value.trim()}
                onremove={(name) => variableNames = variableNames.filter((entry) => entry !== name)}
                onclear={() => variableNames = []} onclose={() => variablesOpen = false}/>
{/if}

{#if linksOpen && linkTarget}
  <VariableLinks title="Variables · {linkTarget.title}" slots={linkTarget.slots} names={variableNames} usage={variableUse}
                 onchange={linkVariable} onmanage={() => { linksOpen = false; variablesOpen = true; }} onclose={() => linksOpen = false}/>
{/if}

{#if connectOpen}
  <ConnectExport shapes={pageShapes("network")} name={documentName} onnotice={showFileNotice} onclose={() => connectOpen = false}/>
{/if}

{#if wiringOpen}
  <WiringActions points={ioPoints} {shapes} ongenerate={generateWiring} onclose={() => wiringOpen = false}/>
{/if}

{#if saveDialog}
  <Modal title={saveDialog.mode === "copy" ? "Save a copy" : "Save project"} subtitle="This browser saves to the Downloads folder" width={440} onclose={() => saveDialog = null}>
    <form class="save-name" id="save-name-form" onsubmit={(e) => { e.preventDefault(); confirmSave(new FormData(e.currentTarget).get("name")); }}>
      <label for="save-name-input">File name</label>
      <div class="save-name-row">
        <input id="save-name-input" name="name" type="text" value={documentName ?? defaultDocumentName()} spellcheck="false" autocomplete="off" use:focusName>
        <span>.pathfinder.json</span>
      </div>
    </form>
    {#snippet footer()}
      <button type="button" class="modal-button" onclick={() => saveDialog = null}>Cancel</button>
      <button type="submit" class="modal-button primary" form="save-name-form">Save</button>
    {/snippet}
  </Modal>
{/if}
