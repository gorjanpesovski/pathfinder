import { cleanDocumentName, defaultDocumentName, serializeDocument, highestId, fileNameFor, parseDocument } from "$lib/core/document.js";
import { ROOM_STYLE } from "$lib/apps/floorplan/rooms.js";
import { defaultCategoryColors } from "$lib/apps/floorplan/categories.js";
import { WALL_STYLE } from "$lib/apps/floorplan/walls.js";
import { HYDRONIC_STYLE } from "$lib/diagram/elements.js";
import { PGD_TAGS } from "$lib/apps/hydronic/pgd.js";
import { targetsOf } from "$lib/diagram/target.js";
import { PAPERS, DEFAULT_PAPER } from "$lib/diagram/electric/sheet.js";
import { APPS } from "$lib/apps/index.js";
import { normalizePower } from "$lib/apps/wiring/power.js";
import { normalizeControl } from "$lib/apps/wiring/control.js";
import { hashText, fileAccess, rememberFile } from "$lib/core/fileStore.js";
import { freezePipes } from "$lib/diagram/route.js";
import { anchorNames, nameFittings } from "$lib/diagram/fittingLabel.js";
import { migrateBranches } from "$lib/diagram/branch.js";
import { importablePages, shiftIds, imageIdsIn, shiftImageId } from "$lib/core/importPages.js";

export function createProject(ctx){
  let pickedFileName = null;

  function openSaveDialog(mode = "as"){
    ctx.saveDialog = { mode };
  }

  function confirmSave(name){
    const mode = ctx.saveDialog?.mode ?? "as";
    ctx.saveDialog = null;
    downloadProject(cleanDocumentName(name) ?? defaultDocumentName(), mode !== "copy");
  }

  function projectSettings(){
    return {
      grid: { size: ctx.gridSize, majorEvery: ctx.majorEvery, show: ctx.showGrid, snap: ctx.snapToGrid, minorColor: ctx.gridMinorColor, majorColor: ctx.gridMajorColor },
      drawing: { lineColor: ctx.lineColor, lineWidth: ctx.lineWidth, rectStroke: ctx.rectStroke, rectFill: ctx.rectFill, rectFilled: ctx.rectFilled },
      rooms: {
        roomFill: ctx.roomFill, roomStroke: ctx.roomStroke, labelColor: ctx.roomLabelColor, floorFill: ctx.floorFill, floorStroke: ctx.floorStroke, categoryColors: $state.snapshot(ctx.categoryColors),
        furnitureOpacity: ctx.furnitureOpacity, floorWallWidth: ctx.floorWallWidth, roomWallWidth: ctx.roomWallWidth, wallStroke: ctx.wallStroke, wallWidth: ctx.wallWidth
      },
      hydronic: { library: ctx.hydronicLibrary, nodePrefix: ctx.nodePrefix, pgdPrefix: ctx.pgdPrefix, pgdFloat: ctx.pgdFloat, targets: $state.snapshot(ctx.exportTargets) },
      wiring: { paper: ctx.wiringPaper }
    };
  }

  function applySettings(settings){
    const number = (value, fallback) => Number.isFinite(value) ? value : fallback;
    const text = (value, fallback) => typeof value === "string" && value ? value : fallback;
    const flag = (value, fallback) => typeof value === "boolean" ? value : fallback;
    const grid = settings?.grid ?? {};
    const drawing = settings?.drawing ?? {};
    const rooms = settings?.rooms ?? {};
    ctx.gridSize = number(grid.size, 20);
    ctx.majorEvery = number(grid.majorEvery, 5);
    ctx.showGrid = flag(grid.show, true);
    ctx.snapToGrid = flag(grid.snap, true);
    ctx.gridMinorColor = text(grid.minorColor, "#E2E8F0");
    ctx.gridMajorColor = text(grid.majorColor, "#CBD5E1");
    ctx.lineColor = text(drawing.lineColor, "#2563EB");
    ctx.lineWidth = number(drawing.lineWidth, 2);
    ctx.rectStroke = text(drawing.rectStroke, "#0F172A");
    ctx.rectFill = text(drawing.rectFill, "#BFDBFE");
    ctx.rectFilled = flag(drawing.rectFilled, true);
    ctx.roomFill = text(rooms.roomFill, ROOM_STYLE.roomFill);
    ctx.roomStroke = text(rooms.roomStroke, ROOM_STYLE.roomStroke);
    ctx.roomLabelColor = text(rooms.labelColor, ROOM_STYLE.labelColor);
    ctx.floorFill = text(rooms.floorFill, ROOM_STYLE.floorFill);
    ctx.floorStroke = text(rooms.floorStroke, ROOM_STYLE.floorStroke);
    ctx.categoryColors = rooms.categoryColors && typeof rooms.categoryColors === "object" ? { ...defaultCategoryColors(), ...rooms.categoryColors } : defaultCategoryColors();
    ctx.furnitureOpacity = number(rooms.furnitureOpacity, 0.5);
    ctx.floorWallWidth = number(rooms.floorWallWidth, ROOM_STYLE.floorWidth);
    ctx.roomWallWidth = number(rooms.roomWallWidth, ROOM_STYLE.roomWidth);
    ctx.wallStroke = text(rooms.wallStroke, WALL_STYLE.stroke);
    ctx.wallWidth = number(rooms.wallWidth, WALL_STYLE.width);
    ctx.hydronicLibrary = text(settings?.hydronic?.library, HYDRONIC_STYLE.library);
    ctx.nodePrefix = typeof settings?.hydronic?.nodePrefix === "string" ? settings.hydronic.nodePrefix : "";
    ctx.pgdPrefix = typeof settings?.hydronic?.pgdPrefix === "string" ? settings.hydronic.pgdPrefix : PGD_TAGS.prefix;
    ctx.exportTargets = targetsOf(settings?.hydronic?.targets);
    ctx.pgdFloat = text(settings?.hydronic?.pgdFloat, PGD_TAGS.float);
    ctx.wiringPaper = PAPERS[settings?.wiring?.paper] ? settings.wiring.paper : DEFAULT_PAPER;
  }

  function usedImages(apps, pages){
    const ids = new Set();
    const visit = (list) => { for (const shape of list ?? []) if (shape.kind === "image" && shape.imageId) ids.add(shape.imageId); };
    Object.values(apps).forEach(visit);
    Object.values(pages).forEach((set) => set.list.forEach((page) => visit(page.shapes)));
    return Object.fromEntries([...ids].filter((id) => ctx.imageSources[id]).map((id) => [id, ctx.imageSources[id]]));
  }

  function currentDocument(withImages = true, name = ctx.documentName){
    const { apps, pages } = ctx.currentApps();
    return serializeDocument({
      app: ctx.app, apps, pages,
      canvas: { width: ctx.canvasWidth, height: ctx.canvasHeight, fill: ctx.canvasFill },
      name,
      io: { points: $state.snapshot(ctx.ioPoints), others: $state.snapshot(ctx.ioOthers) },
      wiring: { power: $state.snapshot(ctx.powerList), control: $state.snapshot(ctx.controlList) },
      settings: projectSettings(),
      images: withImages ? usedImages(apps, pages) : null,
      variables: $state.snapshot(ctx.variableNames)
    });
  }

  function hasWiring(doc){
    const list = doc.pages?.electrical?.list;
    return Array.isArray(list) ? list.some((page) => page.shapes?.length) : Boolean(doc.apps?.electrical?.length);
  }

  function applyDocument(doc){
    ctx.resetInteraction();
    ctx.documents = {};
    ctx.pageSets = {};
    const next = APPS.some((entry) => entry.id === doc.app) ? doc.app : ctx.app;
    ctx.nextId = highestId({ apps: doc.apps, pages: doc.pages }) + 1;
    const ready = prepareShapes;
    for (const entry of APPS) {
      const appId = entry.id;
      if (!ctx.PAGED_APPS.includes(appId)) {
        if (doc.apps[appId]) ctx.documents[appId] = { shapes: ready(doc.apps[appId]), history: null };
        continue;
      }
      const saved = doc.pages?.[appId];
      const list = Array.isArray(saved?.list) && saved.list.length
        ? saved.list.map((page, index) => ({ id: typeof page.id === "string" && page.id ? page.id : ctx.newPageId(), name: typeof page.name === "string" && page.name.trim() ? page.name.trim() : `Page ${index + 1}`, shapes: page.shapes }))
        : [{ id: ctx.newPageId(), name: "Page 1", shapes: doc.apps[appId] ?? [] }];
      const active = list.some((page) => page.id === saved?.active) ? saved.active : list[0].id;
      ctx.pageSets[appId] = { active, list: list.map((page) => ({ id: page.id, name: page.name })) };
      for (const page of list) ctx.documents[`${appId}:${page.id}`] = { shapes: ready(page.shapes), history: null };
    }
    ctx.app = next;
    ctx.loadStashed(ctx.stashKey(next));
    if (doc.canvas) {
      if (doc.canvas.width > 0) ctx.canvasWidth = doc.canvas.width;
      if (doc.canvas.height > 0) ctx.canvasHeight = doc.canvas.height;
      if (typeof doc.canvas.fill === "string") ctx.canvasFill = doc.canvas.fill;
    }
    ctx.documentName = doc.name ?? null;
    applySettings(doc.settings);
    if (!doc.settings?.wiring && hasWiring(doc)) ctx.wiringPaper = "A3";
    ctx.variableNames = doc.variables ?? [];
    ctx.imageSources = doc.images ?? {};
    ctx.ioPoints = doc.io?.points ?? [];
    ctx.ioOthers = doc.io?.others ?? [];
    ctx.powerList = normalizePower(doc.wiring?.power);
    ctx.controlList = normalizeControl(doc.wiring?.control);
  }

  function projectHash(text){
    return hashText(text.replace(/"savedAt":"[^"]*",?/, "").replace(/"app":"[^"]*",?/, "").replace(/"active":"page-[^"]*",?/g, ""));
  }

  async function autosaveToFile(){
    if (ctx.fileWriting || !ctx.fileHandle) return;
    try {
      await writeProject(ctx.fileHandle, ctx.documentName);
    } catch (error) {
      ctx.fileAccessState = await fileAccess(ctx.fileHandle);
      if (ctx.fileAccessState === "granted") ctx.showFileNotice(`Autosave failed: ${error.message}`);
    }
  }

  function linkFile(handle, access){
    ctx.fileHandle = handle;
    ctx.fileAccessState = handle ? access : "none";
    rememberFile(handle);
  }

  async function ensureAccess(){
    if (!ctx.fileHandle) return false;
    if (ctx.fileAccessState !== "granted") ctx.fileAccessState = await fileAccess(ctx.fileHandle, true);
    return ctx.fileAccessState === "granted";
  }

  async function resumeAutosave(){
    if (await ensureAccess()) autosaveToFile();
  }

  async function setAutosaveFile(on){
    if (!on) {
      ctx.autosaveFile = false;
      return;
    }
    if (!ctx.fileHandle) await saveProjectAs();
    if (!ctx.fileHandle || !(await ensureAccess())) return;
    ctx.autosaveFile = true;
  }

  const FILE_TYPES = [{ description: "Pathfinder drawing", accept: { "application/json": [".json"] } }];

  const PICKER_ID = "pathfinder-project";

  function saveFailed(error){
    if (error?.name !== "AbortError") ctx.showFileNotice(`Could not save: ${error.message}`);
  }

  async function writeProject(handle, name, adopt = true){
    const text = currentDocument(true, name);
    const hash = projectHash(text);
    ctx.fileWriting = true;
    try {
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      if (adopt) ctx.savedHash = hash;
    } finally {
      ctx.fileWriting = false;
    }
  }

  async function saveProject(){
    if (!ctx.fileHandle) return saveProjectAs();
    if (!(await ensureAccess())) return saveProjectAs();
    try {
      await writeProject(ctx.fileHandle, ctx.documentName);
      ctx.showFileNotice(`Saved to ${ctx.fileHandle.name}`);
    } catch (error) {
      saveFailed(error);
    }
  }

  async function saveProjectAs(copy = false){
    if (!ctx.canPickFiles) {
      openSaveDialog(copy ? "copy" : "as");
      return;
    }
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileNameFor(ctx.documentName ?? defaultDocumentName()),
        types: FILE_TYPES,
        id: PICKER_ID,
        ...(ctx.fileHandle ? { startIn: ctx.fileHandle } : {})
      });
      const name = cleanDocumentName(handle.name);
      if (!copy) ctx.documentName = name;
      await writeProject(handle, name, !copy);
      if (!copy) linkFile(handle, "granted");
      ctx.showFileNotice(copy ? `Saved a copy to ${handle.name}` : `Saved to ${handle.name}`);
    } catch (error) {
      saveFailed(error);
    }
  }

  function downloadProject(name = ctx.documentName ?? defaultDocumentName(), adopt = false){
    const fileName = fileNameFor(name);
    const clean = cleanDocumentName(fileName);
    if (adopt) {
      ctx.documentName = clean;
      linkFile(null);
    }
    const text = currentDocument(true, clean);
    if (adopt) ctx.savedHash = projectHash(text);
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    ctx.showFileNotice(`Downloaded ${fileName}`);
  }

  function prepareShapes(list){
    return freezePipes(anchorNames(nameFittings(migrateBranches(Array.isArray(list) ? list : [], () => ctx.nextId++))));
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
    const set = ctx.pageSets[ctx.app];
    if (!set) return;
    try {
      const file = await readProjectFile();
      const doc = parseDocument(file.text);
      const pages = importablePages(doc, ctx.app);
      if (!pages.length) {
        ctx.showFileNotice(`${file.name} has no ${ctx.currentApp.label} pages to import`);
        return;
      }
      const offset = ctx.nextId;
      const shifted = pages.map((page) => ({ ...page, shapes: shiftIds(page.shapes, offset) }));
      ctx.nextId = highestId(shifted) + 1;
      const images = { ...ctx.imageSources };
      for (const page of pages) {
        for (const imageId of imageIdsIn(page.shapes)) if (doc.images?.[imageId]) images[shiftImageId(imageId, offset)] = doc.images[imageId];
      }
      ctx.imageSources = images;
      ctx.stashCurrent();
      const taken = new Set(set.list.map((page) => page.name));
      let first = null;
      for (const page of shifted) {
        let name = page.name;
        for (let index = 2; taken.has(name); index += 1) name = `${page.name} (${index})`;
        taken.add(name);
        const id = ctx.newPageId();
        first ??= id;
        set.list.push({ id, name });
        ctx.documents[`${ctx.app}:${id}`] = { shapes: prepareShapes(page.shapes), history: null };
      }
      set.active = first;
      ctx.loadStashed(ctx.stashKey(ctx.app));
      ctx.showFileNotice(`Imported ${shifted.length} page${shifted.length === 1 ? "" : "s"} from ${file.name}`);
    } catch (error) {
      if (error?.name !== "AbortError") ctx.showFileNotice(`Could not import: ${error.message}`);
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
    const { apps, pages } = ctx.currentApps();
    const filled = Object.values(apps).some((list) => list.length) || Object.values(pages).some((set) => set.list.some((page) => page.shapes.length)) || ctx.ioPoints.length > 0;
    const pending = ctx.unsaved && filled && !(ctx.autosaveFile && ctx.fileHandle && ctx.fileAccessState === "granted");
    if (pending && !window.confirm(`Start a new project? Unsaved changes in "${ctx.projectTitle}" will be lost.`)) return;
    applyDocument({ app: ctx.app, apps: {}, pages: null, settings: null, images: {}, io: { points: [], others: [] }, name: null, canvas: { width: 1920, height: 1080, fill: "#FFFFFF" } });
    linkFile(null);
    ctx.savedHash = "";
    ctx.showFileNotice("New project");
  }

  async function openDrawing(){
    try {
      let text;
      if (typeof window.showOpenFilePicker === "function") {
        const [handle] = await window.showOpenFilePicker({ types: FILE_TYPES, id: PICKER_ID });
        text = await (await handle.getFile()).text();
        applyDocument(parseDocument(text));
        ctx.documentName = cleanDocumentName(handle.name) ?? ctx.documentName;
        linkFile(handle, await fileAccess(handle));
        ctx.savedHash = ctx.documentHash;
        ctx.showFileNotice(`Opened ${handle.name}`);
      } else {
        text = await pickFileText();
        applyDocument(parseDocument(text));
        linkFile(null);
        ctx.documentName = cleanDocumentName(pickedFileName) ?? ctx.documentName;
        ctx.savedHash = ctx.documentHash;
        ctx.showFileNotice("Drawing opened");
      }
    } catch (error) {
      if (error?.name !== "AbortError") ctx.showFileNotice(`Could not open: ${error.message}`);
    }
  }

  function renameProject(value){
    const clean = cleanDocumentName(value);
    if (clean) ctx.documentName = clean;
  }

  function clearAll(){
    ctx.shapes = [];
    ctx.draft = null;
    ctx.selectedId = null;
  }

  return { openSaveDialog, confirmSave, projectSettings, applySettings, usedImages, currentDocument, hasWiring, applyDocument, projectHash, autosaveToFile, linkFile, ensureAccess, resumeAutosave, setAutosaveFile, FILE_TYPES, PICKER_ID, saveFailed, writeProject, saveProject, saveProjectAs, downloadProject, prepareShapes, readProjectFile, importPages, pickFileText, newProject, openDrawing, renameProject, clearAll };
}
