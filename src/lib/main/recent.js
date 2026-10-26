import { rememberValue, recallValue } from "@pathfinder/core/fileStore.js";

const KEY = "recent";
const LIMIT = 8;
let queued = null;

async function sameEntry(a, b){
  try {
    return await a.isSameEntry(b);
  } catch {
    return a === b;
  }
}

export async function recentFiles(){
  const list = await recallValue(KEY);
  return Array.isArray(list) ? list.filter((entry) => entry?.handle) : [];
}

export async function addRecent(handle, app){
  if (!handle) return;
  const kept = [];
  for (const entry of await recentFiles()) if (!(await sameEntry(entry.handle, handle))) kept.push(entry);
  await rememberValue(KEY, [{ handle, name: handle.name, app, time: Date.now() }, ...kept].slice(0, LIMIT));
}

export async function removeRecent(handle){
  const kept = [];
  for (const entry of await recentFiles()) if (!(await sameEntry(entry.handle, handle))) kept.push(entry);
  await rememberValue(KEY, kept);
}

export function queueOpen(file){
  queued = file;
}

export function takeQueuedOpen(){
  const file = queued;
  queued = null;
  return file;
}
