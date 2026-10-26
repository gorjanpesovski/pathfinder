<script>
  import { base } from "$app/paths";
  import { untrack } from "svelte";
  import Toolbar from "$lib/core/components/Toolbar.svelte";
  import ZoomControls from "$lib/core/components/ZoomControls.svelte";
  import { Viewport } from "$lib/core/canvas/viewport.svelte.js";
  import { MIN_GRID_PX } from "$lib/core/canvas/coords.js";
  import { panZoom } from "$lib/core/canvas/panZoom.js";
  import RoomLayer from "$lib/apps/floorplan/components/RoomLayer.svelte";
  import CurveLayer from "$lib/apps/floorplan/components/CurveLayer.svelte";
  import VertexHandles from "$lib/core/components/VertexHandles.svelte";
  import ToolOptions from "$lib/editor/components/ToolOptions.svelte";
  import RoomNameEditor from "$lib/apps/floorplan/components/RoomNameEditor.svelte";
  import TextLayer from "$lib/core/components/TextLayer.svelte";
  import TextEditor from "$lib/core/components/TextEditor.svelte";
  import RichTextEditor from "$lib/core/components/RichTextEditor.svelte";
  import PenPreview from "$lib/apps/floorplan/components/PenPreview.svelte";
  import { maxCornerRadius } from "$lib/core/tools/polygon.js";
  import { isRoomTool, roomKindLabel, roomLabelPoint, ROOM_STYLE } from "$lib/apps/floorplan/rooms.js";
  import { History } from "$lib/core/history.svelte.js";
  import { ROOM_CATEGORIES, defaultCategoryColors } from "$lib/apps/floorplan/categories.js";
  import { maxDoorWidth, MIN_DOOR_WIDTH, DOOR_ELEMENTS, isDoorElement } from "$lib/apps/floorplan/doors.js";
  import DoorLayer from "$lib/apps/floorplan/components/DoorLayer.svelte";
  import ImageLayer from "$lib/core/components/ImageLayer.svelte";
  import TransformFrame from "$lib/core/components/TransformFrame.svelte";
  import { scaling } from "$lib/diagram/transform.js";
  import { FURNISHABLE } from "$lib/apps/floorplan/populate.js";
  import { FURNITURE, furnitureFits, newFurniture } from "$lib/apps/floorplan/furniture.js";
  import ElementBar from "$lib/editor/components/ElementBar.svelte";
  import PlacementGhost from "$lib/apps/floorplan/components/PlacementGhost.svelte";
  import ThermostatLayer from "$lib/apps/floorplan/components/ThermostatLayer.svelte";
  import WallLayer from "$lib/apps/floorplan/components/WallLayer.svelte";
  import ActivityBar from "$lib/core/components/ActivityBar.svelte";
  import CanvasNotice from "$lib/core/components/CanvasNotice.svelte";
  import { WALL_STYLE } from "$lib/apps/floorplan/walls.js";
  import { APPS, appById, GENERAL_TOOLS } from "$lib/apps/index.js";
  import HydronicLayer from "$lib/diagram/components/HydronicLayer.svelte";
  import PageTabs from "$lib/core/components/PageTabs.svelte";
  import { HYDRONIC_ELEMENTS, HYDRONIC_STYLE, DEFAULT_MEDIUM, DEFAULT_PROTOCOL, DEFAULT_WIRE, familyOf, mediumOf, isHydronicType, isInlineType, isDeviceType, hydronicLabel } from "$lib/diagram/elements.js";
  import { isBranch, branchParams, ownedPipes, branchPipeIds } from "$lib/diagram/branch.js";
  import DeviceBatch from "$lib/apps/network/components/DeviceBatch.svelte";
  import RegisterEditor from "$lib/apps/network/components/RegisterEditor.svelte";
  import { readoutLayout, readoutSpec } from "$lib/diagram/readout.js";
  import { endpointPose, manhattanRoute, computeRoutes, cornerLegs, routePoint, sameEnd, endOf } from "$lib/diagram/route.js";
  import { HYDRONIC_SPRITE, ICON_SIZES } from "$lib/diagram/iconSprite.js";
  import { PGD_TAGS } from "$lib/apps/hydronic/pgd.js";
  import { targetsOf } from "$lib/diagram/target.js";
  import HeaderMenu from "$lib/core/components/HeaderMenu.svelte";
  import Modal from "$lib/core/components/Modal.svelte";
  import VariableList from "$lib/apps/hydronic/components/VariableList.svelte";
  import VariablePanel from "$lib/apps/hydronic/components/VariablePanel.svelte";
  import ArrangeMenu from "$lib/core/components/ArrangeMenu.svelte";
  import VariableLinks from "$lib/apps/hydronic/components/VariableLinks.svelte";
  import { elementSlots, fittingSlots, variableUsage } from "$lib/diagram/variables.js";
  import ProjectCrumb from "$lib/core/components/ProjectCrumb.svelte";
  import IoView from "$lib/apps/hydronic/components/IoView.svelte";
  import ConnectExport from "$lib/apps/network/components/ConnectExport.svelte";
  import WiringActions from "$lib/apps/wiring/components/WiringActions.svelte";
  import WiringList from "$lib/apps/wiring/components/WiringList.svelte";
  import { emptyControl } from "$lib/apps/wiring/control.js";
  import { emptyPower, powerPageCount, LOADS as POWER_LOADS, SIZING_DEFAULTS } from "$lib/apps/wiring/power.js";
  import { PAPERS, DEFAULT_PAPER, paperOf, pageLeft, boardSize, sheetsSvg, sheetDate } from "$lib/diagram/electric/sheet.js";
  import { editOf } from "$lib/apps/wiring/edits.js";
  import { summarizeSelection } from "$lib/editor/selectionSummary.js";
  import { junctionMedium } from "$lib/diagram/inherit.js";
  import { alignToAnchor } from "$lib/diagram/alignEnd.js";
  import { fittingLabel, namePlaces } from "$lib/diagram/fittingLabel.js";
  import { elementLabel } from "$lib/diagram/label.js";
  import { loadFlag, saveFlag, loadText, saveText } from "$lib/core/settings.js";
  import { shapeBox, unionBox } from "$lib/core/tools/move.js";
  import { appear, addRow } from "$lib/core/transitions.js";
  import { createCanvas } from "$lib/editor/canvas.js";
  import { createHistory } from "$lib/editor/history.js";
  import { createSelection } from "$lib/editor/selection.svelte.js";
  import { createTransform } from "$lib/editor/transform.svelte.js";
  import { createPointer } from "$lib/editor/pointer.svelte.js";
  import { createClipboard } from "$lib/editor/clipboard.svelte.js";
  import { createImages } from "$lib/editor/images.js";
  import { createText } from "$lib/editor/text.svelte.js";
  import { createPlacement } from "$lib/editor/placement.js";
  import { createPages } from "$lib/editor/pages.svelte.js";
  import { createProject } from "$lib/editor/project.svelte.js";
  import { createKeyboard } from "$lib/editor/keyboard.js";
  import { createExports } from "$lib/editor/exports.js";
  import { createFloorplan } from "$lib/apps/floorplan/editor.svelte.js";
  import { createPipes } from "$lib/diagram/editor/pipes.svelte.js";
  import { createFittings } from "$lib/diagram/editor/fittings.svelte.js";
  import { createElements } from "$lib/diagram/editor/elements.js";
  import { createBranches } from "$lib/apps/hydronic/branches.svelte.js";
  import { createVariableLinks } from "$lib/apps/hydronic/variableLinks.js";
  import { createPgdExport } from "$lib/apps/hydronic/exports.js";
  import { createNetwork } from "$lib/apps/network/editor.svelte.js";
  import { createWiring } from "$lib/apps/wiring/editor.svelte.js";

  const ctx = {
    get ELBOW_ORDER(){ return ELBOW_ORDER; },
    get canvasWidth(){ return canvasWidth; },
    set canvasWidth(value){ canvasWidth = value; },
    get canvasHeight(){ return canvasHeight; },
    set canvasHeight(value){ canvasHeight = value; },
    get gridSize(){ return gridSize; },
    set gridSize(value){ gridSize = value; },
    get majorEvery(){ return majorEvery; },
    set majorEvery(value){ majorEvery = value; },
    get showGrid(){ return showGrid; },
    set showGrid(value){ showGrid = value; },
    get snapToGrid(){ return snapToGrid; },
    set snapToGrid(value){ snapToGrid = value; },
    get gridMinorColor(){ return gridMinorColor; },
    set gridMinorColor(value){ gridMinorColor = value; },
    get gridMajorColor(){ return gridMajorColor; },
    set gridMajorColor(value){ gridMajorColor = value; },
    get canvasFill(){ return canvasFill; },
    set canvasFill(value){ canvasFill = value; },
    get lineColor(){ return lineColor; },
    set lineColor(value){ lineColor = value; },
    get lineWidth(){ return lineWidth; },
    set lineWidth(value){ lineWidth = value; },
    get rectStroke(){ return rectStroke; },
    set rectStroke(value){ rectStroke = value; },
    get rectFill(){ return rectFill; },
    set rectFill(value){ rectFill = value; },
    get rectFilled(){ return rectFilled; },
    set rectFilled(value){ rectFilled = value; },
    get roomFill(){ return roomFill; },
    set roomFill(value){ roomFill = value; },
    get roomStroke(){ return roomStroke; },
    set roomStroke(value){ roomStroke = value; },
    get roomLabelColor(){ return roomLabelColor; },
    set roomLabelColor(value){ roomLabelColor = value; },
    get floorFill(){ return floorFill; },
    set floorFill(value){ floorFill = value; },
    get floorStroke(){ return floorStroke; },
    set floorStroke(value){ floorStroke = value; },
    get categoryColors(){ return categoryColors; },
    set categoryColors(value){ categoryColors = value; },
    get furnitureOpacity(){ return furnitureOpacity; },
    set furnitureOpacity(value){ furnitureOpacity = value; },
    get floorWallWidth(){ return floorWallWidth; },
    set floorWallWidth(value){ floorWallWidth = value; },
    get roomWallWidth(){ return roomWallWidth; },
    set roomWallWidth(value){ roomWallWidth = value; },
    get wallStroke(){ return wallStroke; },
    set wallStroke(value){ wallStroke = value; },
    get wallWidth(){ return wallWidth; },
    set wallWidth(value){ wallWidth = value; },
    get roomStyle(){ return roomStyle; },
    get app(){ return app; },
    set app(value){ app = value; },
    get currentApp(){ return currentApp; },
    get tool(){ return tool; },
    set tool(value){ tool = value; },
    get elbow(){ return elbow; },
    set elbow(value){ elbow = value; },
    get shapes(){ return shapes; },
    set shapes(value){ shapes = value; },
    get draft(){ return draft; },
    set draft(value){ draft = value; },
    get cursor(){ return cursor; },
    set cursor(value){ cursor = value; },
    get aim(){ return aim; },
    set aim(value){ aim = value; },
    get selectedId(){ return selectedId; },
    set selectedId(value){ selectedId = value; },
    get nextId(){ return nextId; },
    set nextId(value){ nextId = value; },
    get wiringPaper(){ return wiringPaper; },
    set wiringPaper(value){ wiringPaper = value; },
    get paper(){ return paper; },
    get electricBoard(){ return electricBoard; },
    get boardWidth(){ return boardWidth; },
    get boardHeight(){ return boardHeight; },
    get svgEl(){ return svgEl; },
    set svgEl(value){ svgEl = value; },
    get drawing(){ return drawing; },
    get viewport(){ return viewport; },
    get sheet(){ return sheet; },
    set sheet(value){ sheet = value; },
    get sheetLast(){ return sheetLast; },
    get sheetShown(){ return sheetShown; },
    get sheetRect(){ return sheetRect; },
    get history(){ return history; },
    get editKey(){ return editKey; },
    set editKey(value){ editKey = value; },
    get selectedIds(){ return selectedIds; },
    set selectedIds(value){ selectedIds = value; },
    get selectedPoints(){ return selectedPoints; },
    set selectedPoints(value){ selectedPoints = value; },
    get selectedEdges(){ return selectedEdges; },
    set selectedEdges(value){ selectedEdges = value; },
    get selectionIds(){ return selectionIds; },
    get selectedShapes(){ return selectedShapes; },
    get selectedShape(){ return selectedShape; },
    get selectedRoom(){ return selectedRoom; },
    get activePoints(){ return activePoints; },
    get activeEdges(){ return activeEdges; },
    get branchEditing(){ return branchEditing; },
    set branchEditing(value){ branchEditing = value; },
    get branchSelected(){ return branchSelected; },
    get singleBar(){ return singleBar; },
    get transformBox(){ return transformBox; },
    get arrangeMenu(){ return arrangeMenu; },
    set arrangeMenu(value){ arrangeMenu = value; },
    get targetChoice(){ return targetChoice; },
    set targetChoice(value){ targetChoice = value; },
    get shapeTarget(){ return shapeTarget; },
    get marquee(){ return marquee; },
    set marquee(value){ marquee = value; },
    get imageSources(){ return imageSources; },
    set imageSources(value){ imageSources = value; },
    get imageInput(){ return imageInput; },
    set imageInput(value){ imageInput = value; },
    get CLIPBOARD_PREFIX(){ return CLIPBOARD_PREFIX; },
    get clipboardShapes(){ return clipboardShapes; },
    set clipboardShapes(value){ clipboardShapes = value; },
    get clipboardToken(){ return clipboardToken; },
    set clipboardToken(value){ clipboardToken = value; },
    get pasteCount(){ return pasteCount; },
    set pasteCount(value){ pasteCount = value; },
    get clipboardFurniture(){ return clipboardFurniture; },
    set clipboardFurniture(value){ clipboardFurniture = value; },
    get pointer(){ return pointer; },
    set pointer(value){ pointer = value; },
    get pasteKey(){ return pasteKey; },
    set pasteKey(value){ pasteKey = value; },
    get clipboardFittings(){ return clipboardFittings; },
    set clipboardFittings(value){ clipboardFittings = value; },
    get selectedParts(){ return selectedParts; },
    set selectedParts(value){ selectedParts = value; },
    get partGroup(){ return partGroup; },
    get furnitureGroup(){ return furnitureGroup; },
    get doorGroup(){ return doorGroup; },
    get doorsPlaced(){ return doorsPlaced; },
    set doorsPlaced(value){ doorsPlaced = value; },
    get furnishedRooms(){ return furnishedRooms; },
    set furnishedRooms(value){ furnishedRooms = value; },
    get fileNotice(){ return fileNotice; },
    set fileNotice(value){ fileNotice = value; },
    get placing(){ return placing; },
    set placing(value){ placing = value; },
    get placement(){ return placement; },
    get pipeDraft(){ return pipeDraft; },
    set pipeDraft(value){ pipeDraft = value; },
    get pipeMedium(){ return pipeMedium; },
    set pipeMedium(value){ pipeMedium = value; },
    get hydronicLibrary(){ return hydronicLibrary; },
    set hydronicLibrary(value){ hydronicLibrary = value; },
    get nodePrefix(){ return nodePrefix; },
    set nodePrefix(value){ nodePrefix = value; },
    get pgdPrefix(){ return pgdPrefix; },
    set pgdPrefix(value){ pgdPrefix = value; },
    get exportTargets(){ return exportTargets; },
    set exportTargets(value){ exportTargets = value; },
    get pgdFloat(){ return pgdFloat; },
    set pgdFloat(value){ pgdFloat = value; },
    get freshPipes(){ return freshPipes; },
    set freshPipes(value){ freshPipes = value; },
    get selectedFitting(){ return selectedFitting; },
    set selectedFitting(value){ selectedFitting = value; },
    get extraFittings(){ return extraFittings; },
    set extraFittings(value){ extraFittings = value; },
    get hydronicStyle(){ return hydronicStyle; },
    get shapeIndex(){ return shapeIndex; },
    get pipeRoutes(){ return pipeRoutes; },
    get snapRadius(){ return snapRadius; },
    get hoverRadius(){ return hoverRadius; },
    get pipeAim(){ return pipeAim; },
    get pipeCursor(){ return pipeCursor; },
    get portTarget(){ return portTarget; },
    get pipeThickness(){ return pipeThickness; },
    set pipeThickness(value){ pipeThickness = value; },
    get textStyle(){ return textStyle; },
    set textStyle(value){ textStyle = value; },
    get editingTextId(){ return editingTextId; },
    set editingTextId(value){ editingTextId = value; },
    get editingText(){ return editingText; },
    get describingId(){ return describingId; },
    set describingId(value){ describingId = value; },
    get describing(){ return describing; },
    get activeFitting(){ return activeFitting; },
    get fittingGroup(){ return fittingGroup; },
    get readoutBoxes(){ return readoutBoxes; },
    get fittingNames(){ return fittingNames; },
    get networkSelection(){ return networkSelection; },
    get registerDevices(){ return registerDevices; },
    get sheetMeta(){ return sheetMeta; },
    get turnable(){ return turnable; },
    get renamingId(){ return renamingId; },
    set renamingId(value){ renamingId = value; },
    get renamingRoom(){ return renamingRoom; },
    get renamingElementId(){ return renamingElementId; },
    set renamingElementId(value){ renamingElementId = value; },
    get renamingElement(){ return renamingElement; },
    get renamingFitting(){ return renamingFitting; },
    set renamingFitting(value){ renamingFitting = value; },
    get renamingFittingEntry(){ return renamingFittingEntry; },
    get documents(){ return documents; },
    set documents(value){ documents = value; },
    get variableNames(){ return variableNames; },
    set variableNames(value){ variableNames = value; },
    get PAGED_APPS(){ return PAGED_APPS; },
    get pageSets(){ return pageSets; },
    set pageSets(value){ pageSets = value; },
    get wiringIo(){ return wiringIo; },
    set wiringIo(value){ wiringIo = value; },
    get ioPoints(){ return ioPoints; },
    set ioPoints(value){ ioPoints = value; },
    get ioOthers(){ return ioOthers; },
    set ioOthers(value){ ioOthers = value; },
    get ioOpen(){ return ioOpen; },
    set ioOpen(value){ ioOpen = value; },
    get ioVisible(){ return ioVisible; },
    get wiringListVisible(){ return wiringListVisible; },
    get powerList(){ return powerList; },
    set powerList(value){ powerList = value; },
    get controlList(){ return controlList; },
    set controlList(value){ controlList = value; },
    get documentName(){ return documentName; },
    set documentName(value){ documentName = value; },
    get saveDialog(){ return saveDialog; },
    set saveDialog(value){ saveDialog = value; },
    get documentHash(){ return documentHash; },
    get savedHash(){ return savedHash; },
    set savedHash(value){ savedHash = value; },
    get unsaved(){ return unsaved; },
    get autosaveFile(){ return autosaveFile; },
    set autosaveFile(value){ autosaveFile = value; },
    get fileWriting(){ return fileWriting; },
    set fileWriting(value){ fileWriting = value; },
    get projectTitle(){ return projectTitle; },
    get fileHandle(){ return fileHandle; },
    set fileHandle(value){ fileHandle = value; },
    get fileAccessState(){ return fileAccessState; },
    set fileAccessState(value){ fileAccessState = value; },
    get canPickFiles(){ return canPickFiles; },
    get showDisplaySettings(){ return showDisplaySettings; },
    set showDisplaySettings(value){ showDisplaySettings = value; },
    get draggingVariable(){ return draggingVariable; },
    set draggingVariable(value){ draggingVariable = value; },
    get linkHover(){ return linkHover; },
    set linkHover(value){ linkHover = value; },
    get linkTarget(){ return linkTarget; },
    get atviseDialog(){ return atviseDialog; },
    set atviseDialog(value){ atviseDialog = value; }
  };
  const { fitContent, zoomToSelection, manhattan, rectBetween, pathFor, describe, commitFields, showFileNotice, focusName, readHex } = Object.assign(ctx, createCanvas(ctx));
  const { redo, undo } = Object.assign(ctx, createHistory(ctx));
  const { shapeById, selectShape, selectionUnits, unitBox, groupSelection, ungroupSelection, commonValue, reorderSelection, openArrange, alignSelection, distributeSelection, lockSelection, pickTool, deleteSelected, removeShape } = Object.assign(ctx, createSelection(ctx));
  const { rotateSelection, flipSelection } = Object.assign(ctx, createTransform(ctx));
  const { handleMove, handleLeave, handleDown, commit } = Object.assign(ctx, createPointer(ctx));
  const { handleCopy, handleCut, handlePaste } = Object.assign(ctx, createClipboard(ctx));
  const { openImagePicker, readImage, fitImage, setImageOpacity } = Object.assign(ctx, createImages(ctx));
  const { commitText, cancelText, editSelectedText, setTextStyle } = Object.assign(ctx, createText(ctx));
  const { startPlacing, rotatePlacing } = Object.assign(ctx, createPlacement(ctx));
  const { pageShapes, selectPage, addPage, movePage, duplicatePage, renamePage, deletePage, switchApp } = Object.assign(ctx, createPages(ctx));
  const { confirmSave, currentDocument, projectHash, autosaveToFile, resumeAutosave, setAutosaveFile, saveProject, saveProjectAs, downloadProject, importPages, newProject, openDrawing, renameProject, clearAll, startProject, queueAutosave, untitledName } = Object.assign(ctx, createProject(ctx));
  const { handleKeydown } = Object.assign(ctx, createKeyboard(ctx));
  const { startExport, confirmAtvise } = Object.assign(ctx, createExports(ctx));
  const { cornerCurved, edgeHiddenState, hideEdges, setShapeKind, showRoomNames, setLabelSize, setCornerRadius, pointGroup, thermostatState, setThermostat, resolvePart, partBox, removeParts, commonCategory, setCategory, placeDoors, updateDoor, removeDoor, furnishSelected, clearFurniture, furnishOffices, rotateFurniture, removeFurniture, roomAt, snapFurnitureToWall, doorPlacement, setRoomName, commitRename, commitRoomName } = Object.assign(ctx, createFloorplan(ctx));
  const { routeBox, pipeTargetAt, setPipeWidth, setMedium, reversePipes, tidyPipes, pipeLayer } = Object.assign(ctx, createPipes(ctx));
  const { setFittingReadout, setMeterReadout, resetReadoutPosition, setFittingName, setReadoutScale, setFittingScale, setFittingNameSize, turnFitting, flipFitting, commitFittingRename } = Object.assign(ctx, createFittings(ctx));
  const { selectedElements, setElementSize, toggleTankProbe, setNameSize, centred, resetElementSize, rotateElements, hydronicPlacement, commitElementRename } = Object.assign(ctx, createElements(ctx));
  const { setBranchName, setBranchParam } = Object.assign(ctx, createBranches(ctx));
  const { addVariables, linkVariable, variableOver, variableLeave, variableDrop } = Object.assign(ctx, createVariableLinks(ctx));
  const { copyPgd, downloadPgdImages } = Object.assign(ctx, createPgdExport(ctx));
  const { commitDescription, connectSelected, saveRegisters, addDevices, setDeviceParam } = Object.assign(ctx, createNetwork(ctx));
  const { showSheet, drawPowerPages, listFields, editFromDrawing, resetFromDrawing, generateWiring, printWiring, exportDxf, pickIoSource } = Object.assign(ctx, createWiring(ctx));

  const ELBOWS = [
    { id: "h", label: "Horizontal first" },
    { id: "v", label: "Vertical first" },
    { id: "zh", label: "Split horizontally" },
    { id: "zv", label: "Split vertically" }
  ];

  const ELBOW_ORDER = ELBOWS.map((option) => option.id);

  let canvasWidth = $state(1920);
  let canvasHeight = $state(1080);

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
  let wiringPaper = $state(DEFAULT_PAPER);
  let paper = $derived(paperOf(wiringPaper));
  let electricBoard = $derived(app === "electrical" ? boardSize(shapes, paper) : null);
  let boardWidth = $derived(electricBoard?.width ?? canvasWidth);
  let boardHeight = $derived(electricBoard?.height ?? canvasHeight);

  let svgEl;

  let majorSize = $derived(gridSize * Math.max(2, majorEvery));
  let showMinorGrid = $derived(showGrid && gridSize >= 6);
  let drawing = $derived(tool !== "select" && tool !== "pan");

  const viewport = new Viewport();
  let sidebarOpen = $state(false);
  let fitted = false;

  let sheet = $state(0);
  let sheetLast = $derived(electricBoard ? electricBoard.pages - 1 : 0);
  let sheetShown = $derived(Math.min(sheet, sheetLast));
  let sheetRect = $derived(electricBoard ? { x: pageLeft(sheetShown, paper), y: 0, width: paper.width, height: paper.height } : null);
  let sheetTotal = $derived(electricBoard ? Math.max(electricBoard.used, sheetShown + 1, 1) : 1);

  $effect(() => {
    if (fitted || viewport.width === 0 || viewport.height === 0) return;
    fitted = true;
    fitContent();
  });

  let ghost = $derived.by(() => {
    if (!draft || !cursor) return null;
    if (isRoomTool(draft.kind) || draft.kind === "curve" || draft.kind === "pen") return null;
    if (draft.kind === "line") {
      return { kind: "line", points: manhattan(draft.start, cursor, elbow) };
    }
    return { kind: "rect", ...rectBetween(draft.start, cursor) };
  });

  const history = new History();
  let editKey = null;

  $effect(() => {
    const current = JSON.stringify(shapes);
    untrack(() => {
      history.observe(current, editKey);
      editKey = null;
    });
  });

  let selectedIds = $state([]);
  let selectedPoints = $state([]);
  let selectedEdges = $state([]);

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

  let arrangeMenu = $state(null);

  let arrangeContext = $derived.by(() => {
    if (!arrangeMenu) return null;
    if (arrangeMenu.mode === "shapes" && selection) {
      return { mode: "shapes", canAlign: selection.canAlign, canDistribute: selection.canDistribute, canGroup: selection.canGroup, canUngroup: selection.canUngroup, alignTarget: selection.alignTarget };
    }
    if (arrangeMenu.mode === "parts" && partGroup.length) return { mode: "parts", canAlign: true, canDistribute: partGroup.length >= 3, alignTarget: partGroup.length > 1 ? "the selection" : "" };
    if (arrangeMenu.mode === "fittings" && fittingGroup.length > 1) return { mode: "fittings", canAlign: true, canDistribute: fittingGroup.length >= 3, alignTarget: "the selection" };
    return null;
  });

  let targetChoice = $state(null);
  let shapeTarget = $derived(targetChoice ?? (shapes.length === 0 ? "floor" : "room"));

  let marquee = $state(null);

  let imageSources = $state.raw({});
  let imageInput;

  const CLIPBOARD_PREFIX = "pathfinder-shapes:";
  let clipboardShapes = null;

  let clipboardToken = "";
  let pasteCount = 0;
  let clipboardFurniture = null;
  let pointer = null;
  let pasteKey = null;

  let clipboardFittings = null;

  let selectedParts = $state([]);

  let partGroup = $derived(tool === "select" ? selectedParts.map(resolvePart).filter(Boolean) : []);
  let furnitureGroup = $derived(partGroup.filter((part) => part.kind === "furniture"));
  let doorGroup = $derived(partGroup.filter((part) => part.kind === "door"));

  let activeDoor = $derived(partGroup.length === 1 && partGroup[0].kind === "door" ? { room: partGroup[0].room, door: partGroup[0].item } : null);

  let partOptions = $derived(partGroup.length ? { count: partGroup.length, furniture: furnitureGroup.length, doors: doorGroup.length } : null);

  let doorOptions = $derived(doorGroup.length && !furnitureGroup.length ? {
    count: doorGroup.length,
    roomName: doorGroup.length === 1 ? doorGroup[0].room.name : null,
    type: commonValue(doorGroup.map((part) => part.item.type ?? "single")),
    hinge: commonValue(doorGroup.map((part) => part.item.hinge)),
    swing: commonValue(doorGroup.map((part) => part.item.swing)),
    width: commonValue(doorGroup.map((part) => part.item.width)),
    maxWidth: Math.max(MIN_DOOR_WIDTH, Math.min(...doorGroup.map((part) => maxDoorWidth(part.room, part.item.edge))))
  } : null);

  let doorsPlaced = $state(null);

  let activeFurniture = $derived(partGroup.length === 1 && partGroup[0].kind === "furniture" ? { room: partGroup[0].room, item: partGroup[0].item } : null);

  let furnitureOptions = $derived(activeFurniture ? {
    label: FURNITURE[activeFurniture.item.type]?.label ?? activeFurniture.item.type,
    roomName: activeFurniture.room.name
  } : null);

  let furnishedRooms = $state(null);

  let fileNotice = $state(null);

  let notice = $derived(fileNotice ?? (doorsPlaced !== null
    ? doorsPlaced === 0 ? "Every room already has a door" : `Placed ${doorsPlaced} door${doorsPlaced === 1 ? "" : "s"}`
    : furnishedRooms !== null
      ? furnishedRooms === 0 ? "Nothing to furnish · set room categories first" : `Furnished ${furnishedRooms} room${furnishedRooms === 1 ? "" : "s"}`
      : null));

  let placing = $state(null);

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
  let pgdPrefix = $state(PGD_TAGS.prefix);
  let exportTargets = $state(targetsOf(null));
  let pgdFloat = $state(PGD_TAGS.float);
  let freshPipes = $state([]);
  let selectedFitting = $state(null);
  let extraFittings = $state([]);
  let hydronicStyle = $derived({ ...HYDRONIC_STYLE, library: hydronicLibrary, nodePrefix, background: canvasFill, native: ICON_SIZES, bounds: { width: boardWidth, height: boardHeight }, paper });
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

  let pipeThickness = $state(HYDRONIC_STYLE.pipeWidth);

  let textStyle = $state({ fontSize: 16, color: "#1E293B", bold: false, italic: false, underline: false, align: "left" });
  let editingTextId = $state(null);

  let editingText = $derived(shapes.find((shape) => shape.id === editingTextId && shape.kind === "text") ?? null);
  let textEditPosition = $derived(editingText ? viewport.toScreen({ x: editingText.x, y: editingText.y }) : null);
  let describingId = $state(null);
  let describing = $derived(shapes.find((shape) => shape.id === describingId && shape.type === "fieldDevice") ?? null);
  let describePosition = $derived(describing ? viewport.toScreen({ x: describing.x, y: describing.y + describing.height + 4 }) : null);

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
  let fittingNames = $derived(app === "hydronic" ? namePlaces(shapes, pipeRoutes, readoutBoxes) : new Map());

  let networkSelection = $derived.by(() => {
    if (app !== "network") return null;
    const devices = selectedIds.map((id) => shapeById(id)).filter((shape) => shape?.kind === "equipment" && isDeviceType(shape.type));
    if (!devices.length) return null;
    const centre = devices.find((shape) => ["hub", "gateway"].includes(HYDRONIC_ELEMENTS[shape.type].device)) ?? null;
    return { centre, devices: devices.filter((shape) => shape !== centre) };
  });

  let deviceBatchOpen = $state(false);
  let registersOpen = $state(false);
  let registerDevices = $derived(app === "network" ? selectedElements().filter((element) => ["ip", "rtu"].includes(HYDRONIC_ELEMENTS[element.type]?.device)) : []);
  let registerInfo = $derived.by(() => {
    if (!registerDevices.length) return null;
    const keys = registerDevices.map((device) => JSON.stringify(device.params?.symbols ?? []));
    return { count: keys.every((key) => key === keys[0]) ? (registerDevices[0].params?.symbols ?? []).length : null };
  });

  let powerPages = $derived(app === "electrical" ? powerPageCount(shapes, paper) : 0);
  let supplyNote = $derived(`Sistem: ${powerList.supply.system} · ${powerList.supply.phases === 1 ? "230 V" : "400/230 V"}, 50 Hz`);
  let sheetTitles = $derived.by(() => {
    const titles = Array.from({ length: powerPages }, () => "");
    for (const shape of shapes) {
      if (shape.kind !== "equipment" || !shape.source?.sheet) continue;
      const index = Math.floor(shape.x / (paper.width + paper.gap));
      if (index >= 0 && index < titles.length && !titles[index]) titles[index] = shape.source.sheet;
    }
    return titles;
  });
  let sheetMeta = $derived({ project: documentName ?? "", date: sheetDate(), pages: sheetTitles, notes: sheetTitles.map((title) => title === "NAPAJANJE" ? supplyNote : "") });

  let listEdit = $derived.by(() => {
    if (app !== "electrical" || selectedShapes.length !== 1) return null;
    const shape = selectedShapes[0];
    if (!shape?.source?.power) return null;
    const fields = listFields(shape);
    const edited = Boolean(shape.source.original && editOf($state.snapshot(shape)));
    if (!fields.length && !edited) return null;
    return { fields, edited, generated: Boolean(shape.source.original) };
  });

  let turnable = $derived(fittingGroup.filter(({ pipe, fitting }) => {
    const route = pipeRoutes.get(pipe.id);
    return HYDRONIC_ELEMENTS[fitting.type]?.junction && route && cornerLegs(route, routePoint(route, fitting.t));
  }));

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
    const label = fittingLabel(renamingFittingEntry.route, renamingFittingEntry.fitting, fittingNames.get(renamingFittingEntry.fitting.id));
    return viewport.toScreen({ x: label.center, y: label.middle });
  });

  let documents = {};
  let variableNames = $state([]);
  const PAGED_APPS = ["floorplan", "hydronic", "network"];
  let pageSets = $state({});
  let pageSet = $derived(PAGED_APPS.includes(app) ? pageSets[app] ?? null : null);
  let ioPoints = $state([]);
  let ioOthers = $state([]);
  let ioOpen = $state(false);
  let ioVisible = $derived(ioOpen && app === "hydronic");
  let wiringListVisible = $derived(ioOpen && app === "electrical");
  let powerList = $state(emptyPower());
  let controlList = $state(emptyControl());
  let ioBranches = $derived(ioVisible ? pageShapes("hydronic").filter(isBranch).map((shape, index) => ({ id: shape.id, label: shape.name?.trim() || `Branch ${index + 1}`, type: branchParams(shape).branch_type })) : []);
  let documentName = $state(null);
  let saveDialog = $state(null);

  let documentText = $derived(currentDocument());
  let documentHash = $derived(projectHash(documentText));
  let savedHash = $state("");
  $effect(() => saveText(`pathfinder.savedHash.${app}`, savedHash));
  let unsaved = $derived(documentHash !== savedHash);
  let autosaveFile = $state(false);
  $effect(() => saveFlag(`pathfinder.autosaveFile.${app}`, autosaveFile));
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

  $effect(() => queueAutosave(documentText));

  let fileHandle = $state.raw(null);
  let fileAccessState = $state("none");

  const canPickFiles = typeof window !== "undefined" && typeof window.showSaveFilePicker === "function";

  startProject();

  let viewTitle = $derived(ioVisible ? `${currentApp.label} · IO list` : currentApp.label);

  let showDisplaySettings = $state(false);
  let settingsSection = $state("general");

  const SETTINGS_SECTIONS = [
    { label: "Options", items: [{ id: "general", label: "General" }, { id: "canvas", label: "Canvas" }, { id: "shapes", label: "Shapes" }] },
    { label: "Views", items: [{ id: "floorplan", label: "Floor plan" }, { id: "hydronic", label: "Hydronic station" }, { id: "wiring", label: "Wiring diagram" }] }
  ];

  let connectOpen = $state(false);
  let variablesOpen = $state(false);
  let linksOpen = $state(false);
  let showVariablePanel = $derived(variablePanel && app === "hydronic");
  let draggingVariable = $state(null);
  let variableFocus = $state({ query: "", hover: null });
  let canvasFocus = $derived.by(() => {
    if (!showVariablePanel || draggingVariable) return null;
    const { query, hover } = variableFocus;
    if (!query && !hover) return null;
    return { names: query ? variableNames.filter((name) => name.toLowerCase().includes(query)) : null, hover };
  });
  let variablePages = $derived.by(() => {
    const result = new Map();
    const set = pageSets.hydronic;
    if (!showVariablePanel || !set) return result;
    for (const page of set.list) {
      const current = page.id === set.active;
      const list = current && app === "hydronic" ? shapes : documents[`hydronic:${page.id}`]?.shapes ?? [];
      for (const name of variableUsage(list).keys()) {
        if (!result.has(name)) result.set(name, []);
        result.get(name).push({ id: page.id, name: page.name, current });
      }
    }
    return result;
  });
  let markedPages = $derived.by(() => {
    if (!canvasFocus?.names) return new Set();
    return new Set(canvasFocus.names.flatMap((name) => (variablePages.get(name) ?? []).filter((page) => !page.current).map((page) => page.id)));
  });

  let selectedVariables = $derived.by(() => {
    if (!showVariablePanel) return [];
    const found = new Set();
    const add = (name) => name && found.add(name);
    for (const shape of selectedShapes) {
      if (shape?.kind !== "equipment") continue;
      add(shape.variable);
      Object.values(shape.probeVariables ?? {}).forEach(add);
    }
    for (const { fitting } of fittingGroup) {
      add(fitting.variable);
      Object.values(fitting.readoutVariables ?? {}).forEach(add);
    }
    return [...found];
  });
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

  let wiringOpen = $state(false);
  let wiringIo = $state.raw(null);

  let fileItems = $derived([
    { label: "New file", hint: `Start an empty ${currentApp.label} file`, onclick: newProject },
    { label: "Open…", shortcut: "Ctrl+O", onclick: openDrawing },
    { separator: true },
    { label: "Save", shortcut: "Ctrl+S", hint: fileHandle ? "Update the current file" : `Choose where to save the ${currentApp.label} file`, onclick: saveProject },
    { label: "Save as…", shortcut: "Ctrl+Shift+S", hint: "New name or folder, keep working in the new file", onclick: () => saveProjectAs() },
    { label: "Save a copy…", hint: "Keep working in this file", onclick: () => saveProjectAs(true) },
    { label: "Download", hint: "Put a copy in the Downloads folder", onclick: () => downloadProject() },
    canPickFiles
      ? { toggle: true, label: "Autosave to file", checked: autosaveFile, onchange: setAutosaveFile, hint: autosaveFile ? "Every change is written to the file" : "Write every change to the file" }
      : { note: "This browser can't pick a folder, so projects go to Downloads. Use Chrome or Edge to choose where to save." },
    { separator: true },
    { label: "Settings…", hint: "Canvas, grid, colours and export paths", onclick: () => showDisplaySettings = true }
  ]);

  let importItems = $derived([
    app === "hydronic" ? { label: "Variable names…", hint: `${variableNames.length ? `${variableNames.length} in this file · ` : ""}names to link in the Hydronic station`, onclick: () => variablesOpen = true } : null,
    app !== "electrical" ? { label: "Image…", hint: "A picture or plan on this page (pasting one works too)", onclick: openImagePicker } : null,
    pageSet ? { label: "Pages from another file…", hint: `Copy the ${currentApp.label} pages of another file into this one`, onclick: importPages } : null,
    app === "electrical" ? { note: "Wiring is drawn from the IO list with From IO list… on the right." } : null
  ]);

  let exportItems = $derived([
    app !== "electrical" ? { label: app === "floorplan" ? "Copy SVG" : "Copy SVG…", hint: "atvise SVG of this page, to the clipboard", disabled: shapes.length === 0, onclick: startExport } : null,
    currentApp.exports.includes("pgd") ? { label: "Copy pGD page", hint: "pGD page code (wgtPage), to the clipboard", disabled: shapes.length === 0, onclick: copyPgd } : null,
    currentApp.exports.includes("pgd") ? { label: "Download pGD images", hint: "Images this page uses, for the project's images folder", disabled: shapes.length === 0, onclick: downloadPgdImages } : null,
    app === "network" ? { label: "atvise connect configuration…", hint: "Modbus connections for all topology pages", disabled: pageShapes("network").length === 0, onclick: () => connectOpen = true } : null,
    app === "electrical" ? { label: "Print / Save as PDF", hint: "Choose Save as PDF in the print dialog", disabled: !shapes.some((shape) => shape.kind === "equipment"), onclick: printWiring } : null,
    app === "electrical" ? { label: "Download DXF", hint: "All pages in one drawing, in millimetres, for AutoCAD and other CAD tools", disabled: !shapes.some((shape) => shape.kind === "equipment"), onclick: exportDxf } : null
  ]);

  let atviseDialog = $state(false);

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
    margin: 0 10px 0 12px;
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

  .settings-select {
    height: 32px;
    padding: 0 8px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font-family: inherit;
    font-size: 13px;
    color: #334155;
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

  .save-hint {
    font-size: 12px;
    color: #64748b;
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

  .sheet-nav {
    position: absolute;
    left: 50%;
    bottom: 12px;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
    transform: translateX(-50%);
    font-size: 13px;
    font-weight: 600;
    color: #334155;
  }

  .sheet-nav span {
    min-width: 56px;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  .sheet-nav button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: #334155;
    cursor: pointer;
  }

  .sheet-nav button:hover:not(:disabled) {
    background: #eff6ff;
    color: #1d4ed8;
  }

  .sheet-nav button:disabled {
    color: #cbd5e1;
    cursor: default;
  }

  .sheet-nav svg {
    width: 16px;
    height: 16px;
  }

  .app-layout.no-tools {
    grid-template-columns: var(--activity-width, 48px) 0 auto minmax(0, 1fr) auto;
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
    align-items: stretch;
    justify-content: space-between;
    gap: 16px;
    width: 100%;
    height: 40px;
    padding: 0;
    background: #ffffff;
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
      <button class="header-action" type="button" onclick={() => ioOpen = !ioOpen} aria-pressed={ioOpen}
              title={ioOpen ? "Back to the drawing" : "The list of power devices and loads the diagram is drawn from"}>{ioOpen ? "Drawing" : "Wiring list"}</button>
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

<div class="app-layout" class:no-tools={wiringListVisible} style:--activity-width={viewsOnHover ? "6px" : "40px"}>
  <ActivityBar apps={APPS} current={app} onswitch={switchApp} view={ioOpen ? "io" : "drawing"} onview={(id) => ioOpen = id === "io"} autohide={viewsOnHover}/>
  {#if !wiringListVisible}
  <Toolbar {tool} onpick={pickTool} onimage={openImagePicker} showHints={showToolHints}
           {elementsOpen} ontoggleelements={() => elementsOpen = !elementsOpen}
           tools={currentApp.tools} general={GENERAL_TOOLS} special={currentApp.special} pipeLabel={currentApp.pipeLabel ?? null} automations={currentApp.automations}
           canplacedoors={shapes.some((shape) => shape.kind === "room")}
           canfurnish={shapes.some((shape) => shape.kind === "room" && FURNISHABLE.includes(shape.category))}
           onplacedoors={placeDoors} onfurnish={furnishOffices}
           variablesOpen={showVariablePanel} ontogglevariables={app === "hydronic" ? () => variablePanel = !variablePanel : null}
           onadddevices={app === "network" ? () => deviceBatchOpen = true : null}/>
  {/if}
  {#if showVariablePanel}
    <VariablePanel names={variableNames} usage={variableUse} dragging={draggingVariable} selected={selectedVariables}
                   onfocus={(value) => variableFocus = value} pages={variablePages} onpage={selectPage}
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
                   onfittingflip={flipFitting} onfittingturn={turnFitting} onvariables={linkTarget ? () => linksOpen = true : null} ondelete={deleteSelected} registers={registerInfo} onregisters={() => registersOpen = true}
                   onfittingscale={setFittingScale} onreverse={reversePipes} ontidy={tidyPipes} onpipelayer={pipeLayer}
                   onresetsize={resetElementSize}
                   onfittingreadout={setFittingReadout} onmeterreadout={setMeterReadout} onreadoutreset={resetReadoutPosition} onbranchparam={setBranchParam} onbranchname={setBranchName} ondeviceparam={setDeviceParam} listedit={listEdit ? { ...listEdit, onchange: editFromDrawing, onreset: resetFromDrawing } : null}
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
           onpointerdowncapture={commitFields} onpointerdown={handleDown} onpointermove={handleMove} onpointerleave={handleLeave}
           ondragover={variableOver} ondragleave={variableLeave} ondrop={variableDrop}
           oncontextmenu={openArrange}>
        <defs>
          <pattern id="grid_minor" x={sheetRect?.x ?? 0} width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
            <path d="M {gridSize} 0 L 0 0 L 0 {gridSize}" fill="none"
                  stroke={gridMinorColor} stroke-width={1 / viewport.zoom}/>
          </pattern>
          <pattern id="grid_major" x={sheetRect?.x ?? 0} width={majorSize} height={majorSize} patternUnits="userSpaceOnUse">
            {#if showMinorGrid && gridSize * viewport.zoom >= MIN_GRID_PX}
              <rect x="0" y="0" width={majorSize} height={majorSize} fill="url(#grid_minor)"/>
            {/if}
            <path d="M {majorSize} 0 L 0 0 L 0 {majorSize}" fill="none"
                  stroke={gridMajorColor} stroke-width={1.5 / viewport.zoom}/>
          </pattern>
        </defs>

        {#if sheetRect}
          <defs>
            <clipPath id="sheet-clip">
              <rect x={sheetRect.x} y={sheetRect.y} width={sheetRect.width} height={sheetRect.height}/>
            </clipPath>
          </defs>
        {/if}
        <g transform={viewport.transform} clip-path={sheetRect ? "url(#sheet-clip)" : undefined}>
        <rect x="0" y="0" width={boardWidth} height={boardHeight} fill={canvasFill}/>
        <ImageLayer {shapes} sources={imageSources} interactive={tool === "select"}/>
        {#if showGrid && majorSize * viewport.zoom >= MIN_GRID_PX}
          <rect x="0" y="0" width={boardWidth} height={boardHeight} fill="url(#grid_major)" pointer-events="none"/>
        {/if}
        <rect x="0" y="0" width={boardWidth} height={boardHeight} fill="none"
              stroke="#94A3B8" stroke-width="1" vector-effect="non-scaling-stroke" pointer-events="none"/>
        {#if electricBoard}
          <g pointer-events="none">{@html sheetsSvg(electricBoard.pages, electricBoard.used, sheetMeta, paper)}</g>
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
                       showPorts={!!pipeDraft?.rewire} readouts={readoutBoxes} names={fittingNames} renaming={renamingElementId} renamingFitting={renamingFitting} guide={pipeAim.guide} {branchEditing}
                       linking={draggingVariable ? { hover: linkHover } : null} focus={canvasFocus}/>

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

      {#if describing && describePosition}
        {#key describingId}
          <TextEditor x={describePosition.x} y={describePosition.y} zoom={viewport.zoom}
                      shape={{ text: describing.params?.description ?? "", fontSize: 9, color: "#1E293B", bold: false, width: Math.max(describing.width, 180) }}
                      oncommit={commitDescription} oncancel={() => describingId = null}/>
        {/key}
      {/if}

      {#if editingText && textEditPosition}
        {#key editingTextId}
          <RichTextEditor x={textEditPosition.x} y={textEditPosition.y} zoom={viewport.zoom} shape={editingText}
                          oncommit={commitText} oncancel={cancelText}/>
        {/key}
      {/if}

      <CanvasNotice message={notice}/>

      {#if !wiringListVisible}
        <ZoomControls {viewport} onfit={fitContent} onselection={transformBox ? zoomToSelection : null}/>
      {/if}
      {#if electricBoard && !wiringListVisible}
        <div class="sheet-nav" role="group" aria-label="Sheets">
          <button type="button" aria-label="Previous sheet" title="Previous sheet (Page Up)" disabled={sheetShown === 0} onclick={() => showSheet(sheetShown - 1)}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 L5 8 L10 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <span>{sheetShown + 1} / {sheetTotal}</span>
          <button type="button" aria-label="Next sheet" title="Next sheet (Page Down)" disabled={sheetShown >= sheetLast} onclick={() => showSheet(sheetShown + 1)}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3 L11 8 L6 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      {/if}
    </div>

    {#if ioVisible}
      <IoView bind:points={ioPoints} bind:others={ioOthers} branches={ioBranches} onnotice={showFileNotice}/>
      <CanvasNotice message={notice}/>
    {/if}

    {#if wiringListVisible}
      <WiringList bind:power={powerList} bind:control={controlList} ondraw={drawPowerPages} onnotice={showFileNotice}/>
      <CanvasNotice message={notice}/>
    {/if}

    {#if elementsOpen}
      <ElementBar active={tool === "place" ? placing?.type : null} onpick={startPlacing}
                  groups={currentApp.elements} empty="{currentApp.label} elements and drawing rules come next."
                  onclose={() => elementsOpen = false}/>
    {/if}

    {#if pageSet && !ioVisible}
      <PageTabs pages={pageSet.list} active={pageSet.active} onselect={selectPage} onadd={addPage} onrename={renamePage} ondelete={deletePage}
                onmove={movePage} onduplicate={duplicatePage} version={__APP_VERSION__} build={__APP_COMMIT__}
                marked={markedPages} position={cursor ? `${draft ? `${draft.start.x}, ${draft.start.y} → ` : ""}${cursor.x}, ${cursor.y}` : ""}/>
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
            {@render numberRow("atvise screen width", "The drawing is scaled to fit this screen in the atvise export, and centred if the shape differs.", exportTargets.atvise.width, (value) => exportTargets.atvise.width = value, 100, 7680, 10, "px")}
            {@render numberRow("atvise screen height", "", exportTargets.atvise.height, (value) => exportTargets.atvise.height = value, 100, 4320, 10, "px")}
            {@render numberRow("pGD screen width", "The drawing is scaled to fit this screen in the pGD export, e.g. 800 × 480 for the pGDx or 272 × 480.", exportTargets.pgd.width, (value) => exportTargets.pgd.width = value, 100, 1920, 1, "px")}
            {@render numberRow("pGD screen height", "", exportTargets.pgd.height, (value) => exportTargets.pgd.height = value, 100, 1920, 1, "px")}
            {@render numberRow("pGD smallest text", "Text is never exported smaller than this, so names stay readable on the small screen.", exportTargets.pgd.minFont, (value) => exportTargets.pgd.minFont = value, 0, 24, 1, "px")}
            {@render textRow("pGD tag prefix", "Written in front of each variable name in the pGD export, as the tags are named in the c.pGD tag manager.", pgdPrefix, (value) => pgdPrefix = value.trim(), PGD_TAGS.prefix)}
            {@render textRow("pGD analog tag type", "Data type of the value fields in the pGD export, with the word order of the controller.", pgdFloat, (value) => pgdFloat = value.trim() || PGD_TAGS.float, PGD_TAGS.float)}
          </div>
        {:else if settingsSection === "wiring"}
          <h3>Wiring diagram</h3>
          <p class="settings-note">Saved with the project.</p>
          <div class="settings-card">
            {#snippet paperControl()}
              <select class="settings-select" aria-label="Sheet size" value={wiringPaper} onchange={(e) => wiringPaper = e.currentTarget.value}>
                {#each Object.values(PAPERS) as entry (entry.id)}
                  <option value={entry.id}>{entry.id} landscape · {entry.mm[0]} × {entry.mm[1]} mm</option>
                {/each}
              </select>
            {/snippet}
            {@render settingRow("Sheet size", "Size of every wiring page, on screen and when printing. Pages already drawn keep their positions, so change it before generating.", paperControl)}
          </div>
          <h4>Protection sizing</h4>
          <p class="settings-note">Used for every Rating left empty in the wiring list.</p>
          <div class="settings-card">
            {@render numberRow("Phase voltage", "Single-phase loads: I = P / (U × cos φ).", powerList.sizing.voltage, (value) => powerList.sizing.voltage = value, 100, 500, 1, "V")}
            {@render numberRow("Line voltage", "Three-phase loads: I = P / (√3 × U × cos φ).", powerList.sizing.lineVoltage, (value) => powerList.sizing.lineVoltage = value, 100, 1000, 1, "V")}
            {@render numberRow("Breaker loading", "The load current may use at most this share of the rating. At 80 % a 9,7 A load needs at least 12,1 A, so it gets 13 A.", powerList.sizing.loading, (value) => powerList.sizing.loading = value, 10, 100, 5, "%")}
            {@render numberRow("Simultaneity", "Share of the loads expected to run at the same time, for RCD groups and the main switch.", powerList.sizing.simultaneity, (value) => powerList.sizing.simultaneity = value, 10, 100, 5, "%")}
            {#snippet curveControl()}
              <select class="settings-select" aria-label="Breaker characteristic" bind:value={powerList.sizing.characteristic}>
                <option value="B">B · 3–5 × In, resistive loads</option>
                <option value="C">C · 5–10 × In, general and motors</option>
                <option value="D">D · 10–20 × In, high inrush</option>
              </select>
            {/snippet}
            {@render settingRow("Breaker characteristic", "Letter in front of MCB and RCBO ratings.", curveControl)}
            {#snippet sensitivityControl()}
              <select class="settings-select" aria-label="RCD sensitivity" bind:value={powerList.sizing.sensitivity}>
                {#each ["10mA", "30mA", "100mA", "300mA"] as value (value)}
                  <option {value}>{value}</option>
                {/each}
              </select>
            {/snippet}
            {@render settingRow("RCD sensitivity", "Rated residual current of RCDs and RCBOs. 30 mA protects people, 300 mA is fire protection.", sensitivityControl)}
          </div>
          <h4>Minimum ratings</h4>
          <div class="settings-card">
            {@render numberRow("Feeders", "Smallest breaker for an ordinary load.", powerList.sizing.minimum.feeder, (value) => powerList.sizing.minimum.feeder = value, 0, 125, 1, "A")}
            {@render numberRow("PSU and transformer", "Smallest breaker in front of a 24 V supply.", powerList.sizing.minimum.cabinet, (value) => powerList.sizing.minimum.cabinet = value, 0, 125, 1, "A")}
            {@render numberRow("Socket on DIN rail", "Smallest breaker for a socket.", powerList.sizing.minimum.socket, (value) => powerList.sizing.minimum.socket = value, 0, 125, 1, "A")}
            {@render numberRow("Heat pump / compressor", "Covers the compressor starting current. Data sheets often ask for 16 A.", powerList.sizing.minimum.heatPump, (value) => powerList.sizing.minimum.heatPump = value, 0, 125, 1, "A")}
            {@render numberRow("RCD groups and main switch", "Smallest rating before rounding up to the RCD or switch sizes.", powerList.sizing.minimum.group, (value) => powerList.sizing.minimum.group = value, 0, 250, 1, "A")}
          </div>
          <h4>Power factor (cos φ)</h4>
          <div class="settings-card">
            {#each POWER_LOADS.filter((entry) => entry.id !== "none") as entry (entry.id)}
              {@render numberRow(entry.label, "", powerList.sizing.cosphi[entry.id] ?? entry.cosphi ?? 1, (value) => powerList.sizing.cosphi[entry.id] = value, 0.1, 1, 0.01)}
            {/each}
          </div>
          <h4>Standard sizes</h4>
          <div class="settings-card">
            {@render textRow("MCB, RCBO and fuse", "Ratings to choose from, in A, separated by commas.", powerList.sizing.mcbSizes, (value) => powerList.sizing.mcbSizes = value || SIZING_DEFAULTS.mcbSizes)}
            {@render textRow("RCD", "Rated currents of RCDs, in A.", powerList.sizing.rcdSizes, (value) => powerList.sizing.rcdSizes = value || SIZING_DEFAULTS.rcdSizes)}
            {@render textRow("Switch", "Rated currents of main switches and isolators, in A.", powerList.sizing.switchSizes, (value) => powerList.sizing.switchSizes = value || SIZING_DEFAULTS.switchSizes)}
            {#snippet sizingReset()}
              <button type="button" class="settings-button" onclick={() => powerList.sizing = structuredClone(SIZING_DEFAULTS)}>Reset</button>
            {/snippet}
            {@render settingRow("Reset protection sizing", "Go back to the default values above.", sizingReset)}
          </div>
        {/if}
      </div>
    </div>
  </Modal>
{/if}

{#if registersOpen && registerDevices.length}
  <RegisterEditor devices={$state.snapshot(registerDevices)} onsave={saveRegisters} onclose={() => registersOpen = false}/>
{/if}

{#if deviceBatchOpen}
  <Modal title="Add devices" width={340} onclose={() => deviceBatchOpen = false}>
    <DeviceBatch onsubmit={(values) => { deviceBatchOpen = false; addDevices(values, true); }}/>
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
  <WiringActions source={wiringIo} {shapes} onpick={pickIoSource} ongenerate={generateWiring} onclose={() => wiringOpen = false}/>
{/if}

{#if atviseDialog}
  <Modal title="Copy to atvise" subtitle="Where this page's readouts and indicators read from" width={460} onclose={() => atviseDialog = false}>
    <form class="save-name" id="atvise-prefix-form" onsubmit={(e) => { e.preventDefault(); confirmAtvise(new FormData(e.currentTarget).get("prefix")); }}>
      <label for="atvise-prefix-input">Node path prefix</label>
      <div class="save-name-row">
        <input id="atvise-prefix-input" name="prefix" type="text" value={nodePrefix} placeholder="AGENT.OBJECTS.Toplotne_Postaje.Celica_1" spellcheck="false" autocomplete="off" use:focusName>
      </div>
      <small class="save-hint">Written in front of every variable name, for example AGENT.OBJECTS.Toplotne_Postaje.Celica_1</small>
    </form>
    {#snippet footer()}
      <button type="button" class="modal-button" onclick={() => atviseDialog = false}>Cancel</button>
      <button type="submit" class="modal-button primary" form="atvise-prefix-form">Copy to atvise</button>
    {/snippet}
  </Modal>
{/if}

{#if saveDialog}
  <Modal title={saveDialog.mode === "copy" ? "Save a copy" : "Save project"} subtitle="This browser saves to the Downloads folder" width={440} onclose={() => saveDialog = null}>
    <form class="save-name" id="save-name-form" onsubmit={(e) => { e.preventDefault(); confirmSave(new FormData(e.currentTarget).get("name")); }}>
      <label for="save-name-input">File name</label>
      <div class="save-name-row">
        <input id="save-name-input" name="name" type="text" value={documentName ?? untitledName()} spellcheck="false" autocomplete="off" use:focusName>
        <span>.pathfinder.json</span>
      </div>
    </form>
    {#snippet footer()}
      <button type="button" class="modal-button" onclick={() => saveDialog = null}>Cancel</button>
      <button type="submit" class="modal-button primary" form="save-name-form">Save</button>
    {/snippet}
  </Modal>
{/if}
