export const DOCUMENT_FORMAT = "auto-ahu";
export const DOCUMENT_VERSION = 1;
export const AUTOSAVE_KEY = "autoAhu.autosave";
export const FILE_SUFFIX = ".ahu.json";

export function serializeDocument({ name = null, pages, active, settings }){
  return JSON.stringify({
    format: DOCUMENT_FORMAT,
    version: DOCUMENT_VERSION,
    savedAt: new Date().toISOString(),
    name,
    active,
    settings,
    pages
  });
}

export function parseDocument(text){
  const data = JSON.parse(text);
  if (!data || data.format !== DOCUMENT_FORMAT || !Array.isArray(data.pages)) throw new Error("This is not an Auto AHU project.");
  if (data.version > DOCUMENT_VERSION) throw new Error("This project was saved by a newer version of Auto AHU.");
  const pages = data.pages
    .filter((page) => page && typeof page.id === "string")
    .map((page) => ({ id: page.id, name: typeof page.name === "string" && page.name.trim() ? page.name.trim() : "Page", data: page.data && typeof page.data === "object" ? page.data : null }));
  if (!pages.length) throw new Error("This project has no pages.");
  return {
    name: typeof data.name === "string" && data.name.trim() ? data.name.trim() : null,
    active: pages.some((page) => page.id === data.active) ? data.active : pages[0].id,
    settings: data.settings && typeof data.settings === "object" ? data.settings : {},
    pages
  };
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

export function defaultDocumentName(date = new Date()){
  const pad = (value) => String(value).padStart(2, "0");
  return `auto-ahu-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

export function cleanDocumentName(name){
  const cleaned = String(name ?? "").replace(/\.ahu\.json$/i, "").replace(/\.json$/i, "").replace(/[\\/:*?"<>|]+/g, "-").trim();
  return cleaned || null;
}

export function fileNameFor(name){
  return `${cleanDocumentName(name) ?? defaultDocumentName()}${FILE_SUFFIX}`;
}
