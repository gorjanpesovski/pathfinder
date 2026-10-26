const ID_KEYS = new Set(["id", "pipe", "fitting", "branchOf", "meterOf", "groupId"]);

export function shiftIds(value, offset){
  if (Array.isArray(value)) return value.map((entry) => shiftIds(entry, offset));
  if (!value || typeof value !== "object") return value;
  const next = {};
  for (const [key, entry] of Object.entries(value)) {
    if (ID_KEYS.has(key) && Number.isInteger(entry)) next[key] = entry + offset;
    else if (key === "imageId" && typeof entry === "string") next[key] = shiftImageId(entry, offset);
    else next[key] = shiftIds(entry, offset);
  }
  return next;
}

export function shiftImageId(imageId, offset){
  const match = /^image_(\d+)$/.exec(imageId);
  return match ? `image_${Number(match[1]) + offset}` : `${imageId}_${offset}`;
}

export function importablePages(part){
  if (Array.isArray(part.pages?.list) && part.pages.list.length) {
    return part.pages.list
      .map((page, index) => ({ name: typeof page.name === "string" && page.name.trim() ? page.name.trim() : `Page ${index + 1}`, shapes: Array.isArray(page.shapes) ? page.shapes : [] }))
      .filter((page) => page.shapes.length);
  }
  return part.shapes.length ? [{ name: "Page 1", shapes: part.shapes }] : [];
}

export function imageIdsIn(shapes){
  return [...new Set(shapes.filter((shape) => shape.kind === "image" && shape.imageId).map((shape) => shape.imageId))];
}
