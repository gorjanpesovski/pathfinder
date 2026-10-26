import { cleanDocumentName, defaultDocumentName, serializeDocument, highestId, fileNameFor, loadAutosave, saveAutosave, takeLegacyAutosave } from "@pathfinder/core/document.js";
import { ROOM_STYLE } from "@pathfinder/floorplan/rooms.js";
import { defaultCategoryColors } from "@pathfinder/floorplan/categories.js";
import { WALL_STYLE } from "@pathfinder/floorplan/walls.js";
import { HYDRONIC_STYLE } from "@pathfinder/diagram/elements.js";
import { PGD_TAGS } from "@pathfinder/hydronic/pgd.js";
import { targetsOf } from "@pathfinder/diagram/target.js";
import { PAPERS, DEFAULT_PAPER } from "@pathfinder/diagram/electric/sheet.js";
import { normalizePower } from "@pathfinder/wiring/power.js";
import { normalizeControl } from "@pathfinder/wiring/control.js";
import { hashText, fileAccess, rememberFile, recallFile } from "@pathfinder/core/fileStore.js";
import { loadText, loadFlag, saveText } from "@pathfinder/core/settings.js";
import { freezePipes } from "@pathfinder/diagram/route.js";
import { anchorNames, nameFittings } from "@pathfinder/diagram/fittingLabel.js";
import { migrateBranches } from "@pathfinder/diagram/branch.js";
import { importablePages, shiftIds, imageIdsIn, shiftImageId } from "@pathfinder/core/importPages.js";
import { APP_DATA, readDocument, blankPart, partText, appLabel } from "./documents.js";

const CANVAS = { width: 1920, height: 1080, fill: "#FFFFFF" };
const SESSION_KEYS = ["documentName", "canvasWidth", "canvasHeight", "canvasFill", "fileHandle", "fileAccessState", "autosaveFile", "savedHash"];

export function createProject(ctx){
  let pickedFileName = null;
  let autosaveTimer;
  let autosaveWarned = false;
  const sessions = {};

  function owns(key, app = ctx.app){
    return (APP_DATA[app] ?? []).includes(key);
  }

  function nameLabel(app = ctx.app){
    return appLabel(app).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  function untitledName(){
    return defaultDocumentName(nameLabel());
  }

  function openSaveDialog(mode = "as"){
    ctx.saveDialog = { mode };
  }

  function confirmSave(name){
    const mode = ctx.saveDialog?.mode ?? "as";
    ctx.saveDialog = null;
    downloadProject(cleanDocumentName(name) ?? untitledName(), mode !== "copy");
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

  function appContent(appId){
    const set = ctx.pageSets[appId];
    if (set) return { pages: { active: set.active, list: set.list.map((page) => ({ id: page.id, name: page.name, shapes: ctx.storedShapes(appId, page.id) })) } };
    return { shapes: appId === ctx.app ? $state.snapshot(ctx.shapes) : ctx.documents[appId]?.shapes ?? [] };
  }

  function usedImages(content){
    const ids = new Set();
    const visit = (list) => { for (const shape of list ?? []) if (shape.kind === "image" && shape.imageId) ids.add(shape.imageId); };
    visit(content.shapes);
    content.pages?.list.forEach((page) => visit(page.shapes));
    return Object.fromEntries([...ids].filter((id) => ctx.imageSources[id]).map((id) => [id, ctx.imageSources[id]]));
  }

  function currentDocument(withImages = true, name = ctx.documentName){
    const content = appContent(ctx.app);
    const body = {
      name,
      canvas: { width: ctx.canvasWidth, height: ctx.canvasHeight, fill: ctx.canvasFill },
      ...content,
      settings: projectSettings(),
      images: withImages ? usedImages(content) : null
    };
    if (owns("io")) body.io = { points: $state.snapshot(ctx.ioPoints), others: $state.snapshot(ctx.ioOthers) };
    if (owns("variables")) body.variables = $state.snapshot(ctx.variableNames);
    if (owns("wiring")) body.wiring = { power: $state.snapshot(ctx.powerList), control: $state.snapshot(ctx.controlList) };
    return serializeDocument(ctx.app, body);
  }

  function clearApp(appId){
    for (const key of Object.keys(ctx.documents)) if (key === appId || key.startsWith(`${appId}:`)) delete ctx.documents[key];
    delete ctx.pageSets[appId];
  }

  function adoptImages(part){
    const images = { ...ctx.imageSources };
    const renames = new Map();
    for (const [id, source] of Object.entries(part.images)) {
      if (images[id] && images[id] !== source) {
        let next;
        do next = `image_${ctx.nextId++}`; while (images[next] || part.images[next]);
        renames.set(id, next);
        images[next] = source;
      } else images[id] = source;
    }
    ctx.imageSources = images;
    if (!renames.size) return part;
    const swap = (value) => Array.isArray(value) ? value.map(swap)
      : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, key === "imageId" && renames.has(entry) ? renames.get(entry) : swap(entry)]))
      : value;
    return { ...part, shapes: swap(part.shapes), pages: swap(part.pages) };
  }

  function applyDocument(source){
    const appId = ctx.app;
    ctx.resetInteraction();
    clearApp(appId);
    ctx.nextId = Math.max(ctx.nextId, highestId({ pages: source.pages, shapes: source.shapes }) + 1);
    const part = adoptImages(source);
    if (ctx.PAGED_APPS.includes(appId)) {
      const saved = part.pages;
      const list = Array.isArray(saved?.list) && saved.list.length
        ? saved.list.map((page, index) => ({ id: typeof page.id === "string" && page.id ? page.id : ctx.newPageId(), name: typeof page.name === "string" && page.name.trim() ? page.name.trim() : `Page ${index + 1}`, shapes: page.shapes }))
        : [{ id: ctx.newPageId(), name: "Page 1", shapes: part.shapes }];
      const active = list.some((page) => page.id === saved?.active) ? saved.active : list[0].id;
      ctx.pageSets[appId] = { active, list: list.map((page) => ({ id: page.id, name: page.name })) };
      for (const page of list) ctx.documents[`${appId}:${page.id}`] = { shapes: prepareShapes(page.shapes), history: null };
    } else {
      ctx.documents[appId] = { shapes: prepareShapes(part.shapes), history: null };
    }
    ctx.loadStashed(ctx.stashKey(appId));
    const canvas = part.canvas ?? {};
    ctx.canvasWidth = canvas.width > 0 ? canvas.width : CANVAS.width;
    ctx.canvasHeight = canvas.height > 0 ? canvas.height : CANVAS.height;
    ctx.canvasFill = typeof canvas.fill === "string" ? canvas.fill : CANVAS.fill;
    ctx.documentName = part.name ?? null;
    applySettings(part.settings);
    if (owns("wiring") && !part.settings?.wiring && part.shapes.length) ctx.wiringPaper = "A3";
    if (owns("io")) {
      ctx.ioPoints = part.io?.points ?? [];
      ctx.ioOthers = part.io?.others ?? [];
    }
    if (owns("variables")) ctx.variableNames = part.variables ?? [];
    if (owns("wiring")) {
      ctx.powerList = normalizePower(part.wiring?.power);
      ctx.controlList = normalizeControl(part.wiring?.control);
    }
  }

  function savedHashKey(appId){
    return `pathfinder.savedHash.${appId}`;
  }

  function sessionOf(){
    const session = Object.fromEntries(SESSION_KEYS.map((key) => [key, ctx[key]]));
    session.settings = projectSettings();
    return session;
  }

  function holderOf(appId){
    return appId === ctx.app ? ctx : sessions[appId] ?? null;
  }

  function leaveApp(){
    if (ctx.autosaveFile && ctx.fileHandle && ctx.fileAccessState === "granted" && ctx.documentHash !== ctx.savedHash) autosaveToFile();
    flushAutosave();
    ctx.stashCurrent();
    sessions[ctx.app] = sessionOf();
  }

  function enterApp(appId){
    const session = sessions[appId];
    if (!session) {
      openStored(appId);
      return;
    }
    delete sessions[appId];
    for (const key of SESSION_KEYS) ctx[key] = session[key];
    applySettings(session.settings);
    ctx.ensurePages(appId);
    ctx.loadStashed(ctx.stashKey(appId));
  }

  function openStored(appId){
    const text = loadAutosave(appId);
    let part = null;
    try {
      part = text ? readDocument(text).parts[appId] ?? null : null;
    } catch {
      part = null;
    }
    applyDocument(part ?? blankPart(appId));
    ctx.savedHash = loadText(savedHashKey(appId), "");
    ctx.autosaveFile = loadFlag(`pathfinder.autosaveFile.${appId}`, false);
    ctx.fileHandle = null;
    ctx.fileAccessState = "none";
    recallFile(appId).then(async (handle) => {
      if (!handle || !ctx.canPickFiles) return;
      const holder = holderOf(appId);
      if (!holder || holder.fileHandle || cleanDocumentName(handle.name) !== holder.documentName) return;
      const access = await fileAccess(handle);
      const current = holderOf(appId);
      if (!current || current.fileHandle) return;
      current.fileHandle = handle;
      current.fileAccessState = access;
    });
  }

  function startProject(){
    const legacy = takeLegacyAutosave();
    if (legacy) {
      try {
        for (const [appId, part] of Object.entries(readDocument(legacy).parts)) if (loadAutosave(appId) === null) saveAutosave(appId, partText(part));
      } catch {}
    }
    openStored(ctx.app);
  }

  function writeAutosave(appId, text){
    if (saveAutosave(appId, text)) return;
    if (appId === ctx.app) saveAutosave(appId, currentDocument(false));
    if (autosaveWarned) return;
    autosaveWarned = true;
    ctx.showFileNotice("Images are too large for the browser's autosave. Save the file to keep them.");
  }

  function queueAutosave(text){
    const appId = ctx.app;
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => writeAutosave(appId, text), 400);
  }

  function flushAutosave(){
    clearTimeout(autosaveTimer);
    writeAutosave(ctx.app, currentDocument());
  }

  function projectHash(text){
    return hashText(text.replace(/"savedAt":"[^"]*",?/, "").replace(/"active":"page-[^"]*",?/g, ""));
  }

  async function autosaveToFile(){
    if (ctx.fileWriting || !ctx.fileHandle) return;
    const handle = ctx.fileHandle;
    try {
      await writeProject(handle, ctx.documentName);
    } catch (error) {
      const access = await fileAccess(handle);
      const holder = [ctx, ...Object.values(sessions)].find((entry) => entry.fileHandle === handle);
      if (holder) holder.fileAccessState = access;
      if (access === "granted") ctx.showFileNotice(`Autosave failed: ${error.message}`);
    }
  }

  function linkFile(handle, access){
    ctx.fileHandle = handle;
    ctx.fileAccessState = handle ? access : "none";
    rememberFile(handle, ctx.app);
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
    const appId = ctx.app;
    const text = currentDocument(true, name);
    const hash = projectHash(text);
    ctx.fileWriting = true;
    try {
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      if (!adopt) return;
      const holder = holderOf(appId);
      if (holder) holder.savedHash = hash;
      if (appId !== ctx.app) saveText(savedHashKey(appId), hash);
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
        suggestedName: fileNameFor(ctx.documentName, nameLabel()),
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

  function downloadProject(name = ctx.documentName ?? untitledName(), adopt = false){
    const fileName = fileNameFor(name, nameLabel());
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
      return { text: await (await handle.getFile()).text(), name: handle.name, handle };
    }
    const text = await pickFileText();
    return { text, name: pickedFileName, handle: null };
  }

  function readParts(file){
    return readDocument(file.text, cleanDocumentName(file.name)).parts;
  }

  async function importPages(){
    const set = ctx.pageSets[ctx.app];
    if (!set) return;
    try {
      const file = await readProjectFile();
      const part = readDocument(file.text, cleanDocumentName(file.name)).parts[ctx.app];
      const pages = part ? importablePages(part) : [];
      if (!pages.length) {
        ctx.showFileNotice(`${file.name} has no ${ctx.currentApp.label} pages to import`);
        return;
      }
      const offset = ctx.nextId;
      const shifted = pages.map((page) => ({ ...page, shapes: shiftIds(page.shapes, offset) }));
      ctx.nextId = highestId(shifted) + 1;
      const images = { ...ctx.imageSources };
      for (const page of pages) {
        for (const imageId of imageIdsIn(page.shapes)) if (part.images[imageId]) images[shiftImageId(imageId, offset)] = part.images[imageId];
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
    const content = appContent(ctx.app);
    const filled = (content.shapes?.length ?? 0) > 0 || Boolean(content.pages?.list.some((page) => page.shapes.length)) || (owns("io") && ctx.ioPoints.length > 0);
    const pending = ctx.unsaved && filled && !(ctx.autosaveFile && ctx.fileHandle && ctx.fileAccessState === "granted");
    if (pending && !window.confirm(`Start a new ${ctx.currentApp.label} file? Unsaved changes in "${ctx.projectTitle}" will be lost.`)) return;
    applyDocument(blankPart(ctx.app));
    linkFile(null);
    ctx.savedHash = "";
    ctx.showFileNotice(`New ${ctx.currentApp.label} file`);
  }

  async function openDrawing(){
    try {
      const file = await readProjectFile();
      const doc = readDocument(file.text, cleanDocumentName(file.name));
      if (!doc.legacy) {
        ctx.switchApp(doc.app);
        applyDocument({ ...doc.parts[doc.app], name: cleanDocumentName(file.name) ?? doc.parts[doc.app].name });
        linkFile(file.handle, file.handle ? await fileAccess(file.handle) : "none");
        ctx.savedHash = ctx.documentHash;
        ctx.showFileNotice(`Opened ${file.name}`);
        return;
      }
      const apps = Object.keys(doc.parts);
      if (!apps.length) {
        ctx.showFileNotice(`${file.name} has no drawings to open`);
        return;
      }
      for (const appId of apps) {
        ctx.switchApp(appId);
        applyDocument(doc.parts[appId]);
        linkFile(null);
        ctx.savedHash = "";
      }
      ctx.switchApp(apps.includes(doc.app) ? doc.app : apps[0]);
      ctx.showFileNotice(apps.length === 1
        ? `Opened ${file.name} as a new ${appLabel(apps[0])} file. Save it to keep it.`
        : `Opened ${file.name} as ${apps.length} separate files, one per app. Save each one to keep it.`);
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

  return { openSaveDialog, confirmSave, untitledName, projectSettings, applySettings, currentDocument, applyDocument, leaveApp, enterApp, startProject, queueAutosave, flushAutosave, projectHash, autosaveToFile, linkFile, ensureAccess, resumeAutosave, setAutosaveFile, FILE_TYPES, PICKER_ID, saveFailed, writeProject, saveProject, saveProjectAs, downloadProject, prepareShapes, readProjectFile, readParts, importPages, pickFileText, newProject, openDrawing, renameProject, clearAll };
}
