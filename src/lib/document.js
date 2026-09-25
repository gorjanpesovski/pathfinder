export const DOCUMENT_FORMAT = "pathfinder";
export const DOCUMENT_VERSION = 1;
export const AUTOSAVE_KEY = "pathfinder.autosave";

// export function serializeDocument({ app, apps, canvas }){
//   return JSON.stringify({
//     format: DOCUMENT_FORMAT,
//     version: DOCUMENT_VERSION,
//     savedAt: new Date().toISOString(),
//     app,
//     canvas,
//     apps
//   });
// }
export function serializeDocument({ app, apps, canvas, name = null }){
  return JSON.stringify({
    format: DOCUMENT_FORMAT,
    version: DOCUMENT_VERSION,
    savedAt: new Date().toISOString(),
    name,
    app,
    canvas,
    apps
  });
}

export function parseDocument(text){
  const data = JSON.parse(text);
  if (!data || data.format !== DOCUMENT_FORMAT || typeof data.apps !== "object") throw new Error("This is not a Pathfinder drawing.");
  if (data.version > DOCUMENT_VERSION) throw new Error("This drawing was saved by a newer version of Pathfinder.");
  const apps = Object.fromEntries(Object.entries(data.apps).map(([id, shapes]) => [id, Array.isArray(shapes) ? shapes : []]));
  // return { app: data.app, canvas: data.canvas ?? null, apps };
  return { app: data.app, canvas: data.canvas ?? null, apps, name: typeof data.name === "string" && data.name.trim() ? data.name.trim() : null };
}

export function highestId(apps){
  let highest = 0;
  const visit = (value) => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") {
      if (Number.isFinite(value.id)) highest = Math.max(highest, value.id);
      Object.values(value).forEach(visit);
    }
  };
  visit(apps);
  return highest;
}

export function loadAutosave(){
  try {
    const text = localStorage.getItem(AUTOSAVE_KEY);
    return text ? parseDocument(text) : null;
  } catch {
    return null;
  }
}

export function saveAutosave(text){
  try {
    localStorage.setItem(AUTOSAVE_KEY, text);
    return true;
  } catch {
    return false;
  }
}

export function documentFileName(date = new Date()){
  const pad = (value) => String(value).padStart(2, "0");
  return `pathfinder-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.pathfinder.json`;
}

export const FILE_SUFFIX = ".pathfinder.json";

export function defaultDocumentName(date = new Date()){
  return documentFileName(date).slice(0, -FILE_SUFFIX.length);
}

export function cleanDocumentName(name){
  const cleaned = String(name ?? "").replace(/\.pathfinder\.json$/i, "").replace(/\.json$/i, "").replace(/[\\/:*?"<>|]+/g, "-").trim();
  return cleaned || null;
}

export function fileNameFor(name){
  return `${cleanDocumentName(name) ?? defaultDocumentName()}${FILE_SUFFIX}`;
}
