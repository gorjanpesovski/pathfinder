import { HYDRONIC_ELEMENTS } from "./elements.js";
import { elementPorts } from "./route.js";

export const TOPOLOGIES = [
  { id: "bus", label: "Bus" },
  { id: "star", label: "Star" },
  { id: "daisy", label: "Daisy chain" }
];

const GRID = 10;
const ROW_GAP = 120;
const COLUMN_GAP = 40;
const FIRST_ROW = 160;
const ONE_ROW_LIMIT = 6;
const STAR_LANE = 20;

function snap(value){
  return Math.round(value / GRID) * GRID;
}

const FRAMES = {
  down: { local: (p) => ({ x: p.x, y: p.y }), world: (p) => ({ x: p.x, y: p.y }), side: { top: "top", bottom: "bottom", left: "left", right: "right" } },
  up: { local: (p) => ({ x: p.x, y: -p.y }), world: (p) => ({ x: p.x, y: -p.y }), side: { top: "bottom", bottom: "top", left: "left", right: "right" } },
  right: { local: (p) => ({ x: p.y, y: p.x }), world: (p) => ({ x: p.y, y: p.x }), side: { top: "left", bottom: "right", left: "top", right: "bottom" } },
  left: { local: (p) => ({ x: p.y, y: -p.x }), world: (p) => ({ x: -p.y, y: p.x }), side: { top: "right", bottom: "left", left: "top", right: "bottom" } }
};

function centre(element){
  return { x: element.x + element.width / 2, y: element.y + element.height / 2 };
}

function direction(hub, devices){
  const origin = centre(hub);
  let dx = 0;
  let dy = 0;
  for (const device of devices) {
    const point = centre(device);
    dx += point.x - origin.x;
    dy += point.y - origin.y;
  }
  if (Math.abs(dy) >= Math.abs(dx)) return dy >= 0 ? "down" : "up";
  return dx >= 0 ? "right" : "left";
}

function localBox(frame, element){
  const corners = [
    { x: element.x, y: element.y },
    { x: element.x + element.width, y: element.y + element.height }
  ].map(frame.local);
  const x = Math.min(corners[0].x, corners[1].x);
  const y = Math.min(corners[0].y, corners[1].y);
  return { x, y, width: Math.abs(corners[1].x - corners[0].x), height: Math.abs(corners[1].y - corners[0].y), cx: (corners[0].x + corners[1].x) / 2 };
}

function portsOn(frame, element, localSide){
  const worldSide = frame.side[localSide];
  return elementPorts(element)
    .filter((port) => port.side === worldSide)
    .map((port) => ({ end: { id: element.id, side: port.side, offset: port.offset }, at: frame.local(port.point) }));
}

function nearestPort(frame, element, localSide, x){
  const ports = portsOn(frame, element, localSide);
  return ports.reduce((best, port) => !best || Math.abs(port.at.x - x) < Math.abs(best.at.x - x) ? port : best, null);
}

function hubPorts(frame, hub, count){
  const ports = portsOn(frame, hub, "bottom").sort((a, b) => a.at.x - b.at.x);
  if (count > ports.length) return null;
  const start = Math.floor((ports.length - count) / 2);
  return ports.slice(start, start + count);
}

function worldPoints(frame, list){
  return list.map((point) => {
    const world = frame.world(point);
    return { x: snap(world.x), y: snap(world.y) };
  });
}

function rows(frame, devices){
  const sorted = devices
    .map((element) => ({ element, box: localBox(frame, element) }))
    .sort((a, b) => a.box.y - b.box.y || a.box.cx - b.box.cx);
  const groups = [];
  for (const entry of sorted) {
    const last = groups[groups.length - 1];
    if (last && Math.abs(last[0].box.y - entry.box.y) < entry.box.height / 2) last.push(entry);
    else groups.push([entry]);
  }
  groups.forEach((group) => group.sort((a, b) => a.box.cx - b.box.cx));
  return groups;
}

export function connectNetwork(hub, devices, topology, medium, width, nextId){
  if (!devices.length) return [];
  const frame = FRAMES[direction(hub, devices)];
  const hubBox = localBox(frame, hub);
  const layout = rows(frame, devices);
  const firstRow = layout[0];
  const busY = snap(hubBox.y + hubBox.height + (firstRow[0].box.y - hubBox.y - hubBox.height) / 2);
  const pipes = [];
  const pipe = (from, to, points) => {
    const entry = { id: nextId(), kind: "pipe", from, to, points: worldPoints(frame, points), medium, width };
    pipes.push(entry);
    return entry;
  };

  if (topology === "daisy") {
    const order = layout.flatMap((group, index) => index % 2 ? [...group].reverse() : group);
    const first = order[0];
    const out = nearestPort(frame, hub, "bottom", first.box.cx);
    const into = nearestPort(frame, first.element, "top", out.at.x);
    pipe(out.end, into.end, [{ x: out.at.x, y: busY }, { x: into.at.x, y: busY }]);
    for (let index = 1; index < order.length; index += 1) {
      const previous = order[index - 1];
      const current = order[index];
      if (Math.abs(previous.box.y - current.box.y) < current.box.height / 2) {
        const forward = current.box.cx > previous.box.cx;
        const exit = nearestPort(frame, previous.element, forward ? "right" : "left", previous.box.cx);
        const entry = nearestPort(frame, current.element, forward ? "left" : "right", current.box.cx);
        const mid = (exit.at.x + entry.at.x) / 2;
        pipe(exit.end, entry.end, [{ x: mid, y: exit.at.y }, { x: mid, y: entry.at.y }]);
      } else {
        const exit = nearestPort(frame, previous.element, "bottom", previous.box.cx);
        const entry = nearestPort(frame, current.element, "top", exit.at.x);
        const mid = (exit.at.y + entry.at.y) / 2;
        pipe(exit.end, entry.end, [{ x: exit.at.x, y: mid }, { x: entry.at.x, y: mid }]);
      }
    }
    return pipes;
  }

  const targets = layout.flat();
  if (topology === "star") {
    const spread = hubPorts(frame, hub, targets.length);
    const links = targets.map((target, index) => {
      const out = spread ? spread[index] : nearestPort(frame, hub, "bottom", hubBox.cx);
      return { out, into: nearestPort(frame, target.element, "top", target.box.cx) };
    });
    const lefts = links.filter((link) => link.into.at.x < link.out.at.x - 1).sort((a, b) => a.into.at.x - b.into.at.x);
    const rights = links.filter((link) => link.into.at.x > link.out.at.x + 1).sort((a, b) => b.into.at.x - a.into.at.x);
    const depth = Math.max(lefts.length, rights.length, 1);
    const lane = (rank) => busY + (rank - (depth - 1) / 2) * STAR_LANE;
    for (const link of links) {
      const rank = Math.max(lefts.indexOf(link), rights.indexOf(link));
      const y = rank < 0 ? busY : lane(rank);
      pipe(link.out.end, link.into.end, [{ x: link.out.at.x, y }, { x: link.into.at.x, y }]);
    }
    return pipes;
  }

  const drops = firstRow.map((target) => ({ target, port: nearestPort(frame, target.element, "top", target.box.cx) }));
  const out = nearestPort(frame, hub, "bottom", hubBox.cx);
  const xs = drops.map((drop) => drop.port.at.x);
  const low = Math.min(...xs);
  const high = Math.max(...xs);
  let trunk;
  if (drops.length === 1) {
    trunk = pipe(out.end, drops[0].port.end, [{ x: out.at.x, y: busY }, { x: drops[0].port.at.x, y: busY }]);
  } else if (out.at.x > low && out.at.x < high) {
    const left = drops.find((drop) => drop.port.at.x === low);
    const right = drops.find((drop) => drop.port.at.x === high);
    trunk = pipe(left.port.end, right.port.end, [{ x: low, y: busY }, { x: high, y: busY }]);
    const junction = frame.world({ x: out.at.x, y: busY });
    pipe(out.end, { pipe: trunk.id, x: snap(junction.x), y: snap(junction.y) }, [{ x: out.at.x, y: busY }]);
  } else {
    const far = drops.reduce((best, drop) => Math.abs(drop.port.at.x - out.at.x) > Math.abs(best.port.at.x - out.at.x) ? drop : best);
    trunk = pipe(out.end, far.port.end, [{ x: out.at.x, y: busY }, { x: far.port.at.x, y: busY }]);
  }
  for (const drop of drops) {
    if (trunk.to.id === drop.target.element.id || trunk.from.id === drop.target.element.id) continue;
    const junction = frame.world({ x: drop.port.at.x, y: busY });
    pipe({ pipe: trunk.id, x: snap(junction.x), y: snap(junction.y) }, drop.port.end, [{ x: drop.port.at.x, y: busY }]);
  }
  for (let index = 1; index < layout.length; index += 1) {
    for (const target of layout[index]) {
      const above = layout[index - 1].reduce((best, entry) => Math.abs(entry.box.cx - target.box.cx) < Math.abs(best.box.cx - target.box.cx) ? entry : best);
      const exit = nearestPort(frame, above.element, "bottom", above.box.cx);
      const entry = nearestPort(frame, target.element, "top", target.box.cx);
      const mid = (exit.at.y + entry.at.y) / 2;
      pipe(exit.end, entry.end, [{ x: exit.at.x, y: mid }, { x: entry.at.x, y: mid }]);
    }
  }
  return pipes;
}

export function placeDevices(gateway, type, count, name, firstSlave){
  const spec = HYDRONIC_ELEMENTS[type];
  const perRow = count > ONE_ROW_LIMIT ? Math.ceil(count / 2) : count;
  const rowCount = Math.ceil(count / perRow);
  const centreX = gateway.x + gateway.width / 2;
  const top = snap(gateway.y + gateway.height + FIRST_ROW);
  const devices = [];
  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / perRow);
    const inRow = row === rowCount - 1 ? count - row * perRow : perRow;
    const column = index % perRow;
    const span = inRow * spec.width + (inRow - 1) * COLUMN_GAP;
    const number = index + 1;
    devices.push({
      kind: "equipment",
      type,
      x: snap(centreX - span / 2 + column * (spec.width + COLUMN_GAP)),
      y: top + row * (spec.height + ROW_GAP),
      width: spec.width,
      height: spec.height,
      name: name.includes("{n}") ? name.replaceAll("{n}", String(number)) : `${name} ${number}`,
      params: spec.device === "rtu" || spec.device === "ip" ? { slave: firstSlave + index } : {}
    });
  }
  return devices;
}
