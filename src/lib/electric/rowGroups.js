export const GROUP_COLORS = ["#E11D48", "#7C3AED", "#0D9488", "#D97706", "#65A30D", "#0284C7", "#DB2777", "#4F46E5"];

function uid(){
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
}

export function normalizeGroups(groups, rows){
  const list = Array.isArray(groups) ? groups.filter((group) => group && typeof group === "object" && group.id).map((group, index) => ({
    id: String(group.id),
    name: typeof group.name === "string" ? group.name : `Group ${index + 1}`,
    color: typeof group.color === "string" && group.color ? group.color : GROUP_COLORS[index % GROUP_COLORS.length]
  })) : [];
  const known = new Set(list.map((group) => group.id));
  for (const row of rows) if (!known.has(row.group)) row.group = "";
  return list;
}

export function compact(owner){
  const seen = new Set();
  const next = [];
  for (const row of owner.rows) {
    if (!row.group) next.push(row);
    else if (!seen.has(row.group)) {
      seen.add(row.group);
      next.push(...owner.rows.filter((other) => other.group === row.group));
    }
  }
  owner.rows = next;
  owner.groups = (owner.groups ?? []).filter((group) => seen.has(group.id));
}

export function expand(owner, ids){
  const picked = new Set(ids);
  const groups = new Set(owner.rows.filter((row) => picked.has(row.id) && row.group).map((row) => row.group));
  return owner.rows.filter((row) => picked.has(row.id) || (row.group && groups.has(row.group))).map((row) => row.id);
}

export function moveRows(owner, ids, targetId, after){
  const moving = new Set(expand(owner, ids));
  if (!moving.size || moving.has(targetId)) return false;
  const moved = owner.rows.filter((row) => moving.has(row.id));
  const rest = owner.rows.filter((row) => !moving.has(row.id));
  let index = rest.findIndex((row) => row.id === targetId);
  if (index < 0) return false;
  const group = rest[index].group;
  if (group) {
    const first = rest.findIndex((row) => row.group === group);
    let last = first;
    while (last + 1 < rest.length && rest[last + 1].group === group) last += 1;
    index = after ? last + 1 : first;
  } else if (after) index += 1;
  rest.splice(index, 0, ...moved);
  owner.rows = rest;
  return true;
}

function blockAround(rows, index){
  const group = rows[index]?.group;
  if (!group) return [index, index];
  let first = index;
  let last = index;
  while (first > 0 && rows[first - 1].group === group) first -= 1;
  while (last + 1 < rows.length && rows[last + 1].group === group) last += 1;
  return [first, last];
}

export function moveBy(owner, ids, step){
  const moving = new Set(expand(owner, ids));
  const positions = owner.rows.map((row, index) => moving.has(row.id) ? index : -1).filter((index) => index >= 0);
  if (!positions.length) return false;
  if (step < 0) {
    let index = positions[0] - 1;
    while (index >= 0 && moving.has(owner.rows[index].id)) index -= 1;
    if (index < 0) return false;
    const [first] = blockAround(owner.rows, index);
    return moveRows(owner, [...moving], owner.rows[first].id, false);
  }
  let index = positions[positions.length - 1] + 1;
  while (index < owner.rows.length && moving.has(owner.rows[index].id)) index += 1;
  if (index >= owner.rows.length) return false;
  const [, last] = blockAround(owner.rows, index);
  return moveRows(owner, [...moving], owner.rows[last].id, true);
}

export function newGroup(owner, name){
  const used = new Set((owner.groups ?? []).map((group) => group.color));
  const color = GROUP_COLORS.find((entry) => !used.has(entry)) ?? GROUP_COLORS[(owner.groups ?? []).length % GROUP_COLORS.length];
  const group = { id: uid(), name: name || `Group ${(owner.groups ?? []).length + 1}`, color };
  owner.groups = [...(owner.groups ?? []), group];
  return group;
}

export function addToGroup(owner, ids, groupId = null){
  if (!ids.length) return null;
  const group = groupId ? owner.groups.find((entry) => entry.id === groupId) : newGroup(owner);
  if (!group) return null;
  const picked = new Set(ids);
  const firstIndex = Math.min(
    ...owner.rows.map((row, index) => picked.has(row.id) || row.group === group.id ? index : Infinity)
  );
  for (const row of owner.rows) if (picked.has(row.id)) row.group = group.id;
  const members = owner.rows.filter((row) => row.group === group.id);
  const before = owner.rows.slice(0, firstIndex).filter((row) => row.group !== group.id);
  const after = owner.rows.slice(firstIndex).filter((row) => row.group !== group.id);
  owner.rows = [...before, ...members, ...after];
  compact(owner);
  return group;
}

export function ungroup(owner, ids){
  const picked = new Set(ids);
  const leaving = owner.rows.filter((row) => picked.has(row.id) && row.group);
  if (!leaving.length) return;
  const rest = owner.rows.filter((row) => !leaving.includes(row));
  const lastOf = new Map();
  rest.forEach((row, index) => { if (row.group) lastOf.set(row.group, index); });
  for (const row of leaving) {
    const group = row.group;
    row.group = "";
    const end = lastOf.get(group);
    const at = end === undefined ? rest.length : end + 1;
    rest.splice(at, 0, row);
    for (const [key, value] of lastOf) if (value >= at) lastOf.set(key, value + 1);
  }
  owner.rows = rest;
  compact(owner);
}

export function dissolve(owner, groupId){
  for (const row of owner.rows) if (row.group === groupId) row.group = "";
  compact(owner);
}

export function copyRows(owner, ids){
  const picked = new Set(ids);
  const rows = owner.rows.filter((row) => picked.has(row.id)).map((row) => clone(row));
  const whole = new Set();
  for (const group of owner.groups ?? []) {
    const members = owner.rows.filter((row) => row.group === group.id);
    if (members.length && members.every((row) => picked.has(row.id))) whole.add(group.id);
  }
  const groups = (owner.groups ?? []).filter((group) => whole.has(group.id)).map((group) => ({ ...group }));
  for (const row of rows) if (!whole.has(row.group)) row.group = "";
  return { rows, groups };
}

function clone(value){
  return JSON.parse(JSON.stringify(value));
}

export function pasteRows(owner, clip, afterId, makeRow, remap){
  if (!clip?.rows?.length) return [];
  const groupMap = new Map();
  for (const group of clip.groups ?? []) {
    const copy = newGroup(owner, `${group.name} copy`);
    groupMap.set(group.id, copy.id);
  }
  const idMap = new Map();
  const added = [];
  for (const source of clip.rows) {
    const row = makeRow([...owner.rows, ...added], source);
    row.group = groupMap.get(source.group) ?? "";
    idMap.set(source.id, row.id);
    added.push(row);
  }
  for (const row of added) remap(row, idMap);
  const rows = [...owner.rows];
  let index = rows.length;
  const anchor = afterId ? rows.findIndex((row) => row.id === afterId) : -1;
  if (anchor >= 0) index = blockAround(rows, anchor)[1] + 1;
  rows.splice(index, 0, ...added);
  owner.rows = rows;
  compact(owner);
  return added.map((row) => row.id);
}
