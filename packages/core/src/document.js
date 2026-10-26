export const DOCUMENT_FORMAT = "pathfinder";
export const DOCUMENT_VERSION = 2;
const LEGACY_AUTOSAVE_KEY = "pathfinder.autosave";
const LEGACY_BACKUP_KEY = "pathfinder.autosave.v1";

export function formatOf(app){
  return `${DOCUMENT_FORMAT}-${app}`;
}

export function serializeDocument(app, body){
  return JSON.stringify({
    format: formatOf(app),
    version: DOCUMENT_VERSION,
    savedAt: new Date().toISOString(),
    ...body
  });
}

export function parseDocument(text){
  const data = JSON.parse(text);
  if (data?.format === DOCUMENT_FORMAT && data && typeof data.apps === "object") return { legacy: true, data };
  if (typeof data?.format !== "string" || !data.format.startsWith(`${DOCUMENT_FORMAT}-`)) throw new Error("This is not a Pathfinder drawing.");
  if (data.version > DOCUMENT_VERSION) throw new Error("This drawing was saved by a newer version of Pathfinder.");
  return { legacy: false, app: data.format.slice(DOCUMENT_FORMAT.length + 1), data };
}

export function cleanImages(images){
  return images && typeof images === "object"
    ? Object.fromEntries(Object.entries(images).filter(([, source]) => typeof source === "string" && source.startsWith("data:image/")))
    : {};
}

export function cleanVariables(variables){
  return Array.isArray(variables) ? [...new Set(variables.filter((name) => typeof name === "string" && name.trim()).map((name) => name.trim()))] : [];
}

export function cleanIo(io){
  return {
    points: Array.isArray(io?.points) ? io.points : [],
    others: Array.isArray(io?.others) ? io.others : []
  };
}

export function cleanName(name){
  return typeof name === "string" && name.trim() ? name.trim() : null;
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

function autosaveKey(app){
  return `${LEGACY_AUTOSAVE_KEY}.${app}`;
}

export function loadAutosave(app){
  try {
    return localStorage.getItem(autosaveKey(app));
  } catch {
    return null;
  }
}

export function saveAutosave(app, text){
  try {
    localStorage.setItem(autosaveKey(app), text);
    return true;
  } catch {
    return false;
  }
}

export function takeLegacyAutosave(){
  try {
    const text = localStorage.getItem(LEGACY_AUTOSAVE_KEY);
    if (text === null) return null;
    localStorage.setItem(LEGACY_BACKUP_KEY, text);
    localStorage.removeItem(LEGACY_AUTOSAVE_KEY);
    return text;
  } catch {
    return null;
  }
}

export function documentFileName(label = DOCUMENT_FORMAT, date = new Date()){
  const pad = (value) => String(value).padStart(2, "0");
  return `${label}-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.pathfinder.json`;
}

export const FILE_SUFFIX = ".pathfinder.json";

export function defaultDocumentName(label, date = new Date()){
  return documentFileName(label, date).slice(0, -FILE_SUFFIX.length);
}

export function cleanDocumentName(name){
  const cleaned = String(name ?? "").replace(/\.pathfinder\.json$/i, "").replace(/\.json$/i, "").replace(/[\\/:*?"<>|]+/g, "-").trim();
  return cleaned || null;
}

export function fileNameFor(name, label){
  return `${cleanDocumentName(name) ?? defaultDocumentName(label)}${FILE_SUFFIX}`;
}
