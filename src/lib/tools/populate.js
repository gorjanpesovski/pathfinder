import { outlinePoints, hasCurves } from "./path.js";
import { pointInPolygon, polygonArea, polygonBounds } from "./polygon.js";
import { doorGeometry } from "./doors.js";
import { FURNITURE, furnitureCorners, newFurniture } from "./furniture.js";
import { thermostatRect } from "./rooms.js";

const GRID = 10;
const UNIT_GAP = 20;
const DRAWER_GAP = 5;
const CHAIR_GAP = 10;
const AISLE = 90;
const DOOR_CLEARANCE = 20;
const AREA_PER_DESK = 60000;
const WALL_CLEARANCE = 2;
const FRONT_CLEARANCE = 60;
const ROUND_TABLE_AREA = 200000;
const SOFA_AREA = 450000;
const PLANT_AREA = 250000;
const WALK = 60;

function round(value){
  return Math.round(value * 100) / 100;
}

function rectInside(outline, x0, y0, x1, y1){
  const corners = [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
  if (!corners.every((corner) => pointInPolygon(corner, outline))) return false;
  return !outline.some((vertex) => vertex.x > x0 && vertex.x < x1 && vertex.y > y0 && vertex.y < y1);
}

function isAxisRectangle(room){
  const points = room.points;
  if (points.length !== 4 || hasCurves(room) || room.radii?.some((radius) => radius > 0)) return false;
  return points.every((point, index) => {
    const next = points[(index + 1) % 4];
    return point.x === next.x || point.y === next.y;
  });
}

export function usableRect(room, inset){
  if (isAxisRectangle(room)) {
    const box = polygonBounds(room.points);
    return { x: box.x + inset, y: box.y + inset, width: box.width - inset * 2, height: box.height - inset * 2 };
  }

  const outline = outlinePoints(room);
  const box = polygonBounds(outline);
  const columns = Math.floor(box.width / GRID);
  const rows = Math.floor(box.height / GRID);
  const heights = new Array(columns).fill(0);
  let best = null;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x0 = box.x + column * GRID;
      const y0 = box.y + row * GRID;
      const inside = rectInside(outline, x0 - inset, y0 - inset, x0 + GRID + inset, y0 + GRID + inset);
      heights[column] = inside ? heights[column] + 1 : 0;
    }

    const stack = [];
    for (let column = 0; column <= columns; column += 1) {
      const height = column === columns ? 0 : heights[column];
      let start = column;
      while (stack.length && stack[stack.length - 1].height >= height) {
        const top = stack.pop();
        const area = top.height * (column - top.start);
        if (!best || area > best.area) {
          best = { area, column: top.start, width: column - top.start, height: top.height, bottom: row };
        }
        start = top.start;
      }
      stack.push({ start, height });
    }
  }

  if (!best || best.area === 0) return null;
  return {
    x: box.x + best.column * GRID,
    y: box.y + (best.bottom - best.height + 1) * GRID,
    width: best.width * GRID,
    height: best.height * GRID
  };
}

function overlaps(a, b){
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

function boxOf(points, margin = 0){
  const box = polygonBounds(points);
  return { x: box.x - margin, y: box.y - margin, width: box.width + margin * 2, height: box.height + margin * 2 };
}

export function wallSides(rect){
  return [
    { id: "top", opposite: "bottom", length: rect.width, span: rect.height, rotation: 0, origin: { x: rect.x, y: rect.y }, t: { x: 1, y: 0 }, n: { x: 0, y: 1 } },
    { id: "bottom", opposite: "top", length: rect.width, span: rect.height, rotation: 180, origin: { x: rect.x + rect.width, y: rect.y + rect.height }, t: { x: -1, y: 0 }, n: { x: 0, y: -1 } },
    { id: "right", opposite: "left", length: rect.height, span: rect.width, rotation: 90, origin: { x: rect.x + rect.width, y: rect.y }, t: { x: 0, y: 1 }, n: { x: -1, y: 0 } },
    { id: "left", opposite: "right", length: rect.height, span: rect.width, rotation: 270, origin: { x: rect.x, y: rect.y + rect.height }, t: { x: 0, y: -1 }, n: { x: 1, y: 0 } }
  ];
}

function place(side, along, depth){
  return {
    x: side.origin.x + side.t.x * along + side.n.x * depth,
    y: side.origin.y + side.t.y * along + side.n.y * depth
  };
}

function shuffle(list, random){
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

function jitter(random, amount){
  return (random() * 2 - 1) * amount;
}

function orderedSides(rect, random){
  return wallSides(rect)
    .map((side) => ({ side, weight: side.length * (0.8 + random() * 0.4) }))
    .sort((a, b) => b.weight - a.weight)
    .map((entry) => entry.side);
}

function workstation(side, offset, drawerLeft, random){
  const { desk, chair, drawer } = FURNITURE;
  const deskAlong = drawerLeft ? drawer.width + DRAWER_GAP + desk.width / 2 : desk.width / 2;
  const drawerAlong = drawerLeft ? drawer.width / 2 : desk.width + DRAWER_GAP + drawer.width / 2;
  const item = (type, along, depth, rotation = side.rotation) => {
    const center = place(side, offset + along, depth);
    return { ...newFurniture(type, round(center.x), round(center.y), round(rotation)) };
  };
  return [
    item("desk", deskAlong, desk.depth / 2),
    item("drawer", drawerAlong, drawer.depth / 2),
    item("chair", deskAlong + jitter(random, 6), desk.depth + CHAIR_GAP + chair.depth / 2 + jitter(random, 4), side.rotation + jitter(random, 9))
  ];
}

function island(center, horizontal, drawerLeft, random){
  const { desk, drawer } = FURNITURE;
  const half = (desk.width + DRAWER_GAP + drawer.width) / 2;
  const sides = horizontal
    ? [
        { rotation: 0, origin: { x: center.x - half, y: center.y }, t: { x: 1, y: 0 }, n: { x: 0, y: 1 } },
        { rotation: 180, origin: { x: center.x + half, y: center.y }, t: { x: -1, y: 0 }, n: { x: 0, y: -1 } }
      ]
    : [
        { rotation: 90, origin: { x: center.x, y: center.y - half }, t: { x: 0, y: 1 }, n: { x: -1, y: 0 } },
        { rotation: 270, origin: { x: center.x, y: center.y + half }, t: { x: 0, y: -1 }, n: { x: 1, y: 0 } }
      ];
  return sides.flatMap((side) => workstation(side, 0, drawerLeft, random));
}

function islandSlots(rect, used, horizontal, unitWidth, unitDepth){
  const inset = (id) => used.has(id) ? unitDepth + AISLE : WALK;
  const region = {
    x: rect.x + inset("left"),
    y: rect.y + inset("top"),
    width: rect.width - inset("left") - inset("right"),
    height: rect.height - inset("top") - inset("bottom")
  };
  const width = horizontal ? unitWidth : unitDepth * 2;
  const height = horizontal ? unitDepth * 2 : unitWidth;
  const columns = Math.floor((region.width + AISLE) / (width + AISLE));
  const rows = Math.floor((region.height + AISLE) / (height + AISLE));
  if (columns < 1 || rows < 1) return { slots: [], width, height };

  const startX = region.x + (region.width - (columns * width + (columns - 1) * AISLE)) / 2 + width / 2;
  const startY = region.y + (region.height - (rows * height + (rows - 1) * AISLE)) / 2 + height / 2;
  const middle = { x: region.x + region.width / 2, y: region.y + region.height / 2 };
  const slots = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      slots.push({ x: round(startX + column * (width + AISLE)), y: round(startY + row * (height + AISLE)) });
    }
  }
  slots.sort((a, b) => Math.hypot(a.x - middle.x, a.y - middle.y) - Math.hypot(b.x - middle.x, b.y - middle.y));
  return { slots, width, height };
}

function itemBox(item, margin = 0){
  return boxOf(furnitureCorners(item), margin);
}

function fits(item, outline, blocked, margin = 0){
  if (!furnitureCorners(item).every((corner) => pointInPolygon(corner, outline))) return false;
  const box = itemBox(item, margin);
  return !blocked.some((other) => overlaps(other, box));
}

function placeAgainstWall(type, sides, outline, blocked, random){
  const spec = FURNITURE[type];
  for (const side of shuffle(sides, random)) {
    if (side.length < spec.width) continue;
    const steps = Math.floor((side.length - spec.width) / GRID);
    const startStep = Math.floor(random() * (steps + 1));
    for (let tried = 0; tried <= steps; tried += 1) {
      const along = ((startStep + tried) % (steps + 1)) * GRID + spec.width / 2;
      const center = place(side, along, spec.depth / 2);
      const item = newFurniture(type, round(center.x), round(center.y), side.rotation);
      const front = boxOf([place(side, along - spec.width / 2, 0), place(side, along + spec.width / 2, spec.depth + FRONT_CLEARANCE)]);
      if (!fits(item, outline, blocked)) continue;
      if (blocked.some((other) => overlaps(other, front))) continue;
      blocked.push(front);
      return item;
    }
  }
  return null;
}

function placeInCorner(type, rect, outline, blocked, random){
  const spec = FURNITURE[type];
  const inset = spec.width / 2 + 4;
  const corners = shuffle([
    { x: rect.x + inset, y: rect.y + inset },
    { x: rect.x + rect.width - inset, y: rect.y + inset },
    { x: rect.x + rect.width - inset, y: rect.y + rect.height - inset },
    { x: rect.x + inset, y: rect.y + rect.height - inset }
  ], random);
  for (const corner of corners) {
    const item = newFurniture(type, round(corner.x), round(corner.y), 0);
    if (!fits(item, outline, blocked, 10)) continue;
    blocked.push(itemBox(item, 10));
    return item;
  }
  return null;
}

function placeInOpenSpace(type, rect, outline, blocked, random){
  const spec = FURNITURE[type];
  const candidates = [{ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }];
  for (let index = 0; index < 24; index += 1) {
    candidates.push({
      x: rect.x + spec.width / 2 + random() * Math.max(0, rect.width - spec.width),
      y: rect.y + spec.depth / 2 + random() * Math.max(0, rect.height - spec.depth)
    });
  }
  for (const spot of candidates) {
    const item = newFurniture(type, Math.round(spot.x / GRID) * GRID, Math.round(spot.y / GRID) * GRID, random() < 0.5 ? 0 : 90);
    if (!fits(item, outline, blocked, 30)) continue;
    blocked.push(itemBox(item, 30));
    return item;
  }
  return null;
}

export function furnishOffice(room, style, random = Math.random){
  const outline = outlinePoints(room);
  const area = polygonArea(outline);
  const capacity = Math.max(1, Math.round(area / AREA_PER_DESK));
  const rect = usableRect(room, style.roomWidth / 2 + WALL_CLEARANCE);
  const { desk, chair, drawer } = FURNITURE;
  const unitWidth = desk.width + DRAWER_GAP + drawer.width;
  const unitDepth = desk.depth + CHAIR_GAP + chair.depth;
  if (!rect || Math.min(rect.width, rect.height) < unitDepth || Math.max(rect.width, rect.height) < unitWidth) return [];

  const blocked = (room.doors ?? [])
    .map((door) => doorGeometry(room, door))
    .filter(Boolean)
    .map((geometry) => boxOf([geometry.p0, geometry.p1, geometry.hinge, geometry.leaf], DOOR_CLEARANCE));
  if (room.regulated) {
    const card = thermostatRect(room, style);
    blocked.push({ x: card.x - 20, y: card.y - 20, width: card.width + 40, height: card.height + 40 });
  }

  const used = new Set();
  const items = [];
  const drawerLeft = random() < 0.5;
  let seats = 0;

  for (const side of orderedSides(rect, random)) {
    if (seats >= capacity) break;
    const needed = used.has(side.opposite) ? unitDepth * 2 + AISLE : unitDepth + FRONT_CLEARANCE;
    if (side.span < needed) continue;

    const count = Math.floor((side.length + UNIT_GAP) / (unitWidth + UNIT_GAP));
    if (count < 1) continue;
    const spare = side.length - (count * unitWidth + (count - 1) * UNIT_GAP);
    const start = random() < 0.5 ? spare / 2 : random() * spare;

    for (let slot = 0; slot < count && seats < capacity; slot += 1) {
      const offset = start + slot * (unitWidth + UNIT_GAP);
      const footprint = boxOf([place(side, offset, 0), place(side, offset + unitWidth, unitDepth)]);
      if (blocked.some((box) => overlaps(box, footprint))) continue;
      const corners = [place(side, offset, 0), place(side, offset + unitWidth, 0), place(side, offset + unitWidth, unitDepth), place(side, offset, unitDepth)];
      if (!corners.every((corner) => pointInPolygon(corner, outline))) continue;
      blocked.push(footprint);
      used.add(side.id);
      items.push(...workstation(side, offset, drawerLeft, random));
      seats += 1;
    }
  }

  if (seats < capacity) {
    const horizontal = rect.width >= rect.height;
    const { slots, width, height } = islandSlots(rect, used, horizontal, unitWidth, unitDepth);
    for (const slot of slots) {
      if (seats >= capacity) break;
      const box = { x: slot.x - width / 2, y: slot.y - height / 2, width, height };
      const corners = [{ x: box.x, y: box.y }, { x: box.x + width, y: box.y }, { x: box.x + width, y: box.y + height }, { x: box.x, y: box.y + height }];
      if (!corners.every((corner) => pointInPolygon(corner, outline))) continue;
      if (blocked.some((other) => overlaps(other, box))) continue;
      blocked.push(box);
      items.push(...island(slot, horizontal, drawerLeft, random));
      seats += 2;
    }
  }

  const sides = wallSides(rect);
  const perimeter = (rect.width + rect.height) * 2;
  const shelves = Math.min(5, Math.round(perimeter / 900 * (0.5 + random() * 0.7)));
  for (let index = 0; index < shelves; index += 1) {
    const shelf = placeAgainstWall(random() < 0.75 ? "shelf" : "cabinet", sides, outline, blocked, random);
    if (shelf) items.push(shelf);
  }

  if (area >= SOFA_AREA && random() < 0.6) {
    const sofa = placeAgainstWall("sofa", sides, outline, blocked, random);
    if (sofa) items.push(sofa);
  }

  if (area >= ROUND_TABLE_AREA && random() < 0.8) {
    const table = placeInOpenSpace("roundTable", rect, outline, blocked, random);
    if (table) items.push(table);
  }

  const plants = Math.min(4, (random() < 0.6 ? 1 : 0) + Math.floor(area / PLANT_AREA * random()));
  for (let index = 0; index < plants; index += 1) {
    const plant = placeInCorner("plant", rect, outline, blocked, random);
    if (plant) items.push(plant);
  }

  return items;
}

const KITCHEN_FRONT = 100;
const MAX_KITCHEN_RUN = 480;
const DINING_AREA = 100000;
const TOILET_SLOT = 90;
const BASIN_SLOT = 70;
const AREA_PER_TOILET = 30000;
const STORAGE_AISLE = 100;

function prepare(room, style){
  const outline = outlinePoints(room);
  const rect = usableRect(room, style.roomWidth / 2 + WALL_CLEARANCE);
  const blocked = (room.doors ?? [])
    .map((door) => doorGeometry(room, door))
    .filter(Boolean)
    .map((geometry) => boxOf([geometry.p0, geometry.p1, geometry.hinge, geometry.leaf], DOOR_CLEARANCE));
  if (room.regulated) {
    const card = thermostatRect(room, style);
    blocked.push({ x: card.x - 20, y: card.y - 20, width: card.width + 40, height: card.height + 40 });
  }
  return { outline, area: polygonArea(outline), rect, blocked };
}

function sized(type, center, rotation, width = null){
  const item = newFurniture(type, round(center.x), round(center.y), rotation);
  if (width !== null) item.width = width;
  return item;
}

function fillSide(type, side, outline, blocked, { slot = null, gap = 0, front = FRONT_CLEARANCE, limit = Infinity, centered = true, random }){
  const spec = FURNITURE[type];
  const width = slot ?? spec.width;
  const pitch = width + gap;
  const count = Math.floor((side.length + gap) / pitch);
  if (count < 1) return [];
  const spare = side.length - (count * pitch - gap);
  const start = centered ? spare / 2 : random() * spare;
  const items = [];

  for (let index = 0; index < count && items.length < limit; index += 1) {
    const along = start + index * pitch + width / 2;
    const item = sized(type, place(side, along, spec.depth / 2), side.rotation);
    const zone = boxOf([place(side, along - width / 2, 0), place(side, along + width / 2, spec.depth + front)]);
    if (!furnitureCorners(item).every((corner) => pointInPolygon(corner, outline))) continue;
    if (blocked.some((other) => overlaps(other, zone))) continue;
    blocked.push(zone);
    items.push(item);
  }
  return items;
}

function kitchenRun(side, start, length, fridgeFirst, random){
  const { fridge, sink } = FURNITURE;
  const counterLength = length - fridge.width - sink.width;
  const pieces = [];
  if (counterLength >= 40) {
    const first = Math.round(counterLength * (0.3 + random() * 0.4) / 10) * 10;
    pieces.push({ type: "counter", width: first }, { type: "sink", width: sink.width }, { type: "counter", width: counterLength - first });
  } else {
    pieces.push({ type: "sink", width: sink.width });
  }
  if (fridgeFirst) pieces.unshift({ type: "fridge", width: fridge.width });
  else pieces.push({ type: "fridge", width: fridge.width });

  const items = [];
  let along = start;
  for (const piece of pieces) {
    if (piece.width <= 0) continue;
    const depth = FURNITURE[piece.type].depth;
    items.push(sized(piece.type, place(side, along + piece.width / 2, depth / 2), side.rotation, piece.type === "counter" ? piece.width : null));
    along += piece.width;
  }
  return items;
}

export function furnishKitchen(room, style, random = Math.random){
  const { outline, area, rect, blocked } = prepare(room, style);
  const { fridge, sink, counter } = FURNITURE;
  const minimum = fridge.width + sink.width;
  if (!rect || Math.min(rect.width, rect.height) < counter.depth + KITCHEN_FRONT) return [];

  const items = [];
  let runSide = null;
  for (const side of orderedSides(rect, random)) {
    if (side.length < minimum || side.span < counter.depth + KITCHEN_FRONT) continue;
    const length = Math.min(side.length, MAX_KITCHEN_RUN);
    const starts = random() < 0.5 ? [0, side.length - length] : [side.length - length, 0];
    for (const start of starts) {
      const zone = boxOf([place(side, start, 0), place(side, start + length, counter.depth + KITCHEN_FRONT)]);
      if (blocked.some((other) => overlaps(other, zone))) continue;
      const run = kitchenRun(side, start, length, random() < 0.5, random);
      if (!run.every((item) => furnitureCorners(item).every((corner) => pointInPolygon(corner, outline)))) continue;
      blocked.push(zone);
      items.push(...run);
      runSide = side;
      break;
    }
    if (runSide) break;
  }

  const sides = wallSides(rect).filter((side) => side.id !== runSide?.id);
  if (area >= DINING_AREA * 1.2 && random() < 0.5) {
    items.push(...fillSide("counter", shuffle(sides, random)[0], outline, blocked, { front: KITCHEN_FRONT, limit: 1, centered: false, random }));
  }

  if (area >= DINING_AREA) {
    const table = placeInOpenSpace("roundTable", rect, outline, blocked, random);
    if (table) items.push(table);
  }

  if (random() < 0.4) {
    const plant = placeInCorner("plant", rect, outline, blocked, random);
    if (plant) items.push(plant);
  }

  return items;
}

export function furnishWC(room, style, random = Math.random){
  const { outline, area, rect, blocked } = prepare(room, style);
  const { toilet } = FURNITURE;
  if (!rect || Math.min(rect.width, rect.height) < toilet.depth + 50) return [];

  const capacity = Math.min(6, Math.max(1, Math.round(area / AREA_PER_TOILET)));
  const items = [];
  const toiletSides = new Set();

  for (const side of orderedSides(rect, random)) {
    const toilets = items.filter((item) => item.type === "toilet").length;
    if (toilets >= capacity) break;
    const placed = fillSide("toilet", side, outline, blocked, { slot: TOILET_SLOT, front: 60, limit: capacity - toilets, random });
    if (placed.length) toiletSides.add(side.id);
    items.push(...placed);
  }

  const toilets = items.filter((item) => item.type === "toilet").length;
  const basins = Math.min(4, Math.max(1, Math.ceil(toilets / 2)));
  const sides = orderedSides(rect, random).sort((a, b) => toiletSides.has(a.id) - toiletSides.has(b.id));
  let placedBasins = 0;
  for (const side of sides) {
    if (placedBasins >= basins) break;
    const placed = fillSide("washbasin", side, outline, blocked, { slot: BASIN_SLOT, front: 60, limit: basins - placedBasins, random });
    placedBasins += placed.length;
    items.push(...placed);
  }

  return items;
}

function rackRows(rect, outline, blocked, random){
  const { rack } = FURNITURE;
  const inset = rack.depth + STORAGE_AISLE;
  const inner = { x: rect.x + inset, y: rect.y + inset, width: rect.width - inset * 2, height: rect.height - inset * 2 };
  if (inner.width <= 0 || inner.height <= 0) return [];

  const horizontal = inner.width >= inner.height;
  const along = horizontal ? inner.width : inner.height;
  const across = horizontal ? inner.height : inner.width;
  const rowDepth = rack.depth * 2;
  const rows = Math.floor((across + STORAGE_AISLE) / (rowDepth + STORAGE_AISLE));
  const count = Math.floor(along / rack.width);
  if (rows < 1 || count < 1) return [];

  const acrossStart = (across - (rows * rowDepth + (rows - 1) * STORAGE_AISLE)) / 2 + rack.depth;
  const alongStart = (along - count * rack.width) / 2 + rack.width / 2;
  const items = [];

  for (let row = 0; row < rows; row += 1) {
    const spine = acrossStart + row * (rowDepth + STORAGE_AISLE);
    for (let index = 0; index < count; index += 1) {
      const position = alongStart + index * rack.width;
      const pair = horizontal
        ? [
            sized(random() < 0.85 ? "rack" : "cabinet", { x: inner.x + position, y: inner.y + spine - rack.depth / 2 }, 180),
            sized(random() < 0.85 ? "rack" : "cabinet", { x: inner.x + position, y: inner.y + spine + rack.depth / 2 }, 0)
          ]
        : [
            sized(random() < 0.85 ? "rack" : "cabinet", { x: inner.x + spine - rack.depth / 2, y: inner.y + position }, 90),
            sized(random() < 0.85 ? "rack" : "cabinet", { x: inner.x + spine + rack.depth / 2, y: inner.y + position }, 270)
          ];
      for (const item of pair) {
        if (item.type === "cabinet") item.width = rack.width;
        if (!furnitureCorners(item).every((corner) => pointInPolygon(corner, outline))) continue;
        const box = boxOf(furnitureCorners(item));
        if (blocked.some((other) => overlaps(other, box))) continue;
        blocked.push(box);
        items.push(item);
      }
    }
  }
  return items;
}

export function furnishStorage(room, style, random = Math.random){
  const { outline, rect, blocked } = prepare(room, style);
  const { rack } = FURNITURE;
  if (!rect || Math.min(rect.width, rect.height) < rack.depth + 80) return [];

  const items = [];
  for (const side of orderedSides(rect, random)) {
    const type = random() < 0.8 ? "rack" : "cabinet";
    items.push(...fillSide(type, side, outline, blocked, { slot: FURNITURE[type].width, gap: 5, front: STORAGE_AISLE - 10, random }));
  }
  items.push(...rackRows(rect, outline, blocked, random));
  return items;
}

// export const FURNISHABLE = ["office", "kitchen", "wc", "storage"];
export const FURNISHABLE = ["office", "meeting", "kitchen", "wc", "storage", "corridor", "technical", "server", "stairs"];

export function furnishForCategory(room, style, random = Math.random){
  switch (room.category) {
    case "office": return furnishOffice(room, style, random);
    case "kitchen": return furnishKitchen(room, style, random);
    case "wc": return furnishWC(room, style, random);
    case "storage": return furnishStorage(room, style, random);
    case "meeting": return furnishMeeting(room, style, random);
    case "corridor": return furnishCorridor(room, style, random);
    case "technical": return furnishTechnical(room, style, random);
    case "server": return furnishServer(room, style, random);
    case "stairs": return furnishStairs(room, style, random);
    default: return [];
  }
}

const MEETING_END = 90;
const MEETING_SIDE = 40;
const MIN_MEETING_DEPTH = 180;
const MAX_MEETING_LENGTH = 600;
const CORRIDOR_WALK = 120;
const PLANT_SPACING = 800;
const BENCH_SPACING = 1200;
const RACK_BACK = 80;
const RACK_FRONT = 100;
const COLD_AISLE = 120;
const HOT_AISLE = 100;
const RACK_END = 120;
const MAX_RACKS = 12;
const MAX_RACK_ROWS = 4;
const STAIR_INSET = 10;
const MAX_STAIR_WIDTH = 300;
const MIN_STAIR_RUN = 150;

function lengthwise(rect){
  const horizontal = rect.width >= rect.height;
  const sides = wallSides(rect);
  const along = (side) => (side.id === "top" || side.id === "bottom") === horizontal;
  return {
    horizontal,
    long: horizontal ? rect.width : rect.height,
    short: horizontal ? rect.height : rect.width,
    center: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
    longSides: sides.filter(along),
    endSides: sides.filter((side) => !along(side))
  };
}

function collect(items, item){
  if (item) items.push(item);
}

export function furnishMeeting(room, style, random = Math.random){
  const { outline, area, rect, blocked } = prepare(room, style);
  if (!rect) return [];
  const frame = lengthwise(rect);
  const items = [];
  const depth = Math.floor(Math.min(FURNITURE.meetingTable.depth, frame.short - MEETING_SIDE * 2) / GRID) * GRID;

  if (depth >= MIN_MEETING_DEPTH) {
    const span = frame.long - MEETING_END * 2;
    const sideways = Math.max(0, (frame.short - depth) / 2 - MEETING_SIDE / 2);
    search: for (let length = Math.min(MAX_MEETING_LENGTH, span); length >= 120; length -= 40) {
      const slack = (span - length) / 2;
      const offsets = [[0, 0], [slack, 0], [-slack, 0], [0, sideways], [0, -sideways], [slack, sideways], [-slack, sideways], [slack, -sideways], [-slack, -sideways]];
      for (const [shift, across] of offsets) {
        const center = frame.horizontal
          ? { x: frame.center.x + shift, y: frame.center.y + across }
          : { x: frame.center.x + across, y: frame.center.y + shift };
        const table = sized("meetingTable", center, frame.horizontal ? 0 : 90, Math.floor(length / GRID) * GRID + 20);
        table.height = depth;
        if (!fits(table, outline, blocked)) continue;
        blocked.push(itemBox(table));
        items.push(table);
        break search;
      }
    }
  }
  if (!items.length && area >= ROUND_TABLE_AREA / 2) collect(items, placeInOpenSpace("roundTable", rect, outline, blocked, random));

  collect(items, placeAgainstWall("whiteboard", frame.endSides, outline, blocked, random));
  if (random() < 0.7) collect(items, placeAgainstWall("cabinet", frame.longSides, outline, blocked, random));

  const plants = (random() < 0.6 ? 1 : 0) + (area >= PLANT_AREA ? 1 : 0);
  for (let index = 0; index < plants; index += 1) collect(items, placeInCorner("plant", rect, outline, blocked, random));
  return items;
}

export function furnishCorridor(room, style, random = Math.random){
  const { outline, rect, blocked } = prepare(room, style);
  if (!rect) return [];
  const frame = lengthwise(rect);
  const items = [];

  if (frame.short >= FURNITURE.bench.depth + CORRIDOR_WALK) {
    const benches = Math.floor(frame.long / BENCH_SPACING * (0.5 + random()));
    for (let index = 0; index < benches; index += 1) collect(items, placeAgainstWall("bench", frame.longSides, outline, blocked, random));
  }

  if (frame.short >= FURNITURE.plant.depth + CORRIDOR_WALK) {
    const plants = Math.max(random() < 0.7 ? 1 : 0, Math.round(frame.long / PLANT_SPACING * (0.6 + random() * 0.6)));
    for (let index = 0; index < plants; index += 1) collect(items, placeAgainstWall("plant", frame.longSides, outline, blocked, random));
  }
  return items;
}

export function furnishTechnical(room, style, random = Math.random){
  const { outline, area, rect, blocked } = prepare(room, style);
  if (!rect || Math.min(rect.width, rect.height) < FURNITURE.boiler.depth + FRONT_CLEARANCE) return [];
  const frame = lengthwise(rect);
  const sides = wallSides(rect);
  const items = [];

  if (area >= 150000) collect(items, placeAgainstWall("ahu", frame.longSides, outline, blocked, random));
  const boilers = area >= 250000 ? 2 : 1;
  for (let index = 0; index < boilers; index += 1) collect(items, placeAgainstWall("boiler", sides, outline, blocked, random));
  if (area >= 60000) collect(items, placeInCorner("tank", rect, outline, blocked, random));
  const panels = area >= 200000 ? 2 : 1;
  for (let index = 0; index < panels; index += 1) collect(items, placeAgainstWall("panel", sides, outline, blocked, random));
  return items;
}

function serverRows(rect, outline, blocked){
  const { serverRack } = FURNITURE;
  const frame = lengthwise(rect);
  const end = frame.long >= RACK_END * 2 + serverRack.width * 3 ? RACK_END : RACK_END / 2;
  const count = Math.min(MAX_RACKS, Math.floor((frame.long - end * 2) / serverRack.width));
  if (count < 1) return [];

  const rows = [];
  let offset = frame.short >= RACK_BACK + serverRack.depth + RACK_FRONT ? RACK_BACK : 0;
  let facing = 1;
  while (rows.length < MAX_RACK_ROWS && offset + serverRack.depth + (facing === 1 ? RACK_FRONT : 0) <= frame.short) {
    rows.push({ offset, facing });
    offset += serverRack.depth + (facing === 1 ? COLD_AISLE : HOT_AISLE);
    facing = -facing;
  }

  const start = (frame.long - count * serverRack.width) / 2;
  const items = [];
  for (const row of rows) {
    const across = row.offset + serverRack.depth / 2;
    const rotation = frame.horizontal ? (row.facing === 1 ? 0 : 180) : (row.facing === 1 ? 270 : 90);
    for (let index = 0; index < count; index += 1) {
      const along = start + (index + 0.5) * serverRack.width;
      const center = frame.horizontal
        ? { x: rect.x + along, y: rect.y + across }
        : { x: rect.x + across, y: rect.y + along };
      const rack = sized("serverRack", center, rotation);
      if (!fits(rack, outline, blocked)) continue;
      blocked.push(itemBox(rack));
      items.push(rack);
    }
  }
  return items;
}

export function furnishServer(room, style, random = Math.random){
  const { outline, rect, blocked } = prepare(room, style);
  if (!rect || Math.min(rect.width, rect.height) < FURNITURE.serverRack.depth + RACK_FRONT) return [];
  const frame = lengthwise(rect);
  const items = [];

  items.push(...serverRows(rect, outline, blocked));
  const sides = [...frame.endSides, ...frame.longSides];
  collect(items, placeAgainstWall("cooling", sides, outline, blocked, random));
  if (random() < 0.7) collect(items, placeAgainstWall("ups", sides, outline, blocked, random));
  collect(items, placeAgainstWall("panel", sides, outline, blocked, random));
  return items;
}

export function furnishStairs(room, style, random = Math.random){
  const { outline, rect, blocked } = prepare(room, style);
  if (!rect) return [];
  const frame = lengthwise(rect);
  const across = Math.floor((Math.min(frame.short, MAX_STAIR_WIDTH) - STAIR_INSET * 2) / GRID) * GRID;
  const run = frame.long - STAIR_INSET * 2;
  if (across < 80 || run < MIN_STAIR_RUN) return [];

  for (let length = Math.floor(run / GRID) * GRID; length >= MIN_STAIR_RUN; length -= 20) {
    const ends = random() < 0.5 ? [-1, 1] : [1, -1];
    for (const end of ends) {
      const shift = (run - length) / 2 * end;
      const center = frame.horizontal
        ? { x: frame.center.x + shift, y: frame.center.y }
        : { x: frame.center.x, y: frame.center.y + shift };
      const stairs = sized("stairs", center, frame.horizontal ? 90 : 0, across);
      stairs.height = length;
      if (fits(stairs, outline, blocked)) return [stairs];
    }
  }
  return [];
}
