import { normalizeTemplates } from "./control.js";

const KEY = "pathfinder.deviceLibrary";

function uid(){
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function loadLibrary(){
  try {
    return normalizeTemplates(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
  } catch {
    return [];
  }
}

function store(list){
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

function plain(template){
  return JSON.parse(JSON.stringify(template));
}

export function saveToLibrary(template){
  const list = loadLibrary();
  const copy = plain(template);
  const index = template.libraryId ? list.findIndex((entry) => entry.id === template.libraryId) : -1;
  if (index >= 0) {
    list[index] = { ...copy, id: template.libraryId, libraryId: "" };
  } else {
    const id = uid();
    list.push({ ...copy, id, libraryId: "" });
    template.libraryId = id;
  }
  store(list);
  return { list, updated: index >= 0 };
}

export function removeFromLibrary(id){
  const list = loadLibrary().filter((entry) => entry.id !== id);
  store(list);
  return list;
}

export function templateFromLibrary(entry){
  return { ...plain(entry), id: uid(), libraryId: entry.id };
}

export function exportLibrary(){
  return JSON.stringify({ kind: "pathfinder-device-library", version: 1, devices: loadLibrary() }, null, 2);
}

export function importLibrary(text){
  const data = JSON.parse(text);
  const incoming = normalizeTemplates(Array.isArray(data) ? data : data?.devices);
  const list = loadLibrary();
  let added = 0;
  let updated = 0;
  for (const entry of incoming) {
    const index = list.findIndex((existing) => existing.id === entry.id);
    if (index >= 0) {
      list[index] = entry;
      updated += 1;
    } else {
      list.push(entry);
      added += 1;
    }
  }
  store(list);
  return { list, added, updated };
}
