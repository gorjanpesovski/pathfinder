const DATABASE = "pathfinder";
const STORE = "handles";
const KEY = "project";

function openDatabase(){
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run(mode, action){
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, mode);
    const request = action(transaction.objectStore(STORE));
    transaction.oncomplete = () => {
      database.close();
      resolve(request.result);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  }));
}

export async function rememberFile(handle){
  try {
    await run("readwrite", (store) => handle ? store.put(handle, KEY) : store.delete(KEY));
  } catch {}
}

export async function recallFile(){
  try {
    return await run("readonly", (store) => store.get(KEY)) ?? null;
  } catch {
    return null;
  }
}

export async function fileAccess(handle, ask = false){
  try {
    const mode = { mode: "readwrite" };
    let state = await handle.queryPermission(mode);
    if (state !== "granted" && ask) state = await handle.requestPermission(mode);
    return state === "granted" ? "granted" : "prompt";
  } catch {
    return "prompt";
  }
}

export function hashText(text){
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}
