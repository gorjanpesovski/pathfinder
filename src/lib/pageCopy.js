const REFERENCES = new Set(["id", "pipe", "fitting", "meterOf", "branchOf", "groupId", "host"]);

function collect(value, ids){
  if (Array.isArray(value)) value.forEach((entry) => collect(entry, ids));
  else if (value && typeof value === "object") {
    if (Number.isFinite(value.id)) ids.add(value.id);
    if (Number.isFinite(value.groupId)) ids.add(value.groupId);
    Object.values(value).forEach((entry) => collect(entry, ids));
  }
}

function remap(value, map){
  if (Array.isArray(value)) return value.map((entry) => remap(entry, map));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, REFERENCES.has(key) && map.has(entry) ? map.get(entry) : remap(entry, map)]));
}

export function copyPageShapes(shapes, nextId){
  const ids = new Set();
  collect(shapes, ids);
  const map = new Map([...ids].map((id) => [id, nextId()]));
  return remap(structuredClone(shapes), map);
}

export function pageCopyName(name, pages){
  const taken = new Set(pages.map((page) => page.name));
  let next = `${name} (copy)`;
  for (let count = 2; taken.has(next); count += 1) next = `${name} (copy ${count})`;
  return next;
}
