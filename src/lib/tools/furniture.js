import { pointInPolygon } from "./polygon.js";
import { outlinePoints } from "./path.js";
import { svgElement } from "../export/atvise.js";

export const FURNITURE = {
  desk: { label: "Desk", width: 160, depth: 80, wall: true },
  chair: { label: "Chair", width: 56, depth: 56 },
  drawer: { label: "Drawer", width: 42, depth: 58, wall: true },
  shelf: { label: "Shelf", width: 90, depth: 35, wall: true },
  cabinet: { label: "Cabinet", width: 100, depth: 50, wall: true },
  sofa: { label: "Sofa", width: 180, depth: 80, wall: true },
  plant: { label: "Plant", width: 45, depth: 45 },
  roundTable: { label: "Round table", width: 220, depth: 220 },
  meetingTable: { label: "Meeting table", width: 220, depth: 220 },
  whiteboard: { label: "Whiteboard", width: 180, depth: 8, wall: true },
  counter: { label: "Counter", width: 180, depth: 60, wall: true },
  sink: { label: "Sink", width: 60, depth: 50, wall: true },
  fridge: { label: "Fridge", width: 60, depth: 60, wall: true },
  toilet: { label: "Toilet", width: 40, depth: 65, wall: true },
  washbasin: { label: "Washbasin", width: 50, depth: 40, wall: true },
  rack: { label: "Storage rack", width: 120, depth: 50, wall: true },
  bench: { label: "Bench", width: 120, depth: 40, wall: true },
  ahu: { label: "Air handling unit", width: 240, depth: 110, wall: true },
  boiler: { label: "Boiler", width: 70, depth: 70, wall: true },
  tank: { label: "Buffer tank", width: 80, depth: 80 },
  panel: { label: "Electrical panel", width: 80, depth: 30, wall: true },
  serverRack: { label: "Server rack", width: 60, depth: 110, wall: true },
  cooling: { label: "Cooling unit", width: 90, depth: 60, wall: true },
  ups: { label: "UPS", width: 60, depth: 80, wall: true },
  stairs: { label: "Staircase", width: 120, depth: 300 }
};

export const ELEMENT_GROUPS = [
  { id: "general", label: "General", items: ["door", "plant", "sofa", "whiteboard", "bench"] },
  { id: "office", label: "Office", items: ["desk", "chair", "drawer", "shelf", "cabinet"] },
  { id: "meeting", label: "Meeting room", items: ["meetingTable", "roundTable", "chair", "whiteboard"] },
  { id: "kitchen", label: "Kitchen", items: ["counter", "sink", "fridge", "roundTable"] },
  { id: "wc", label: "WC", items: ["toilet", "washbasin"] },
  { id: "storage", label: "Storage", items: ["rack", "shelf", "cabinet"] },
  { id: "corridor", label: "Corridor", items: ["bench", "plant", "shelf"] },
  { id: "technical", label: "Technical room", items: ["ahu", "boiler", "tank", "panel"] },
  { id: "server", label: "Server room", items: ["serverRack", "cooling", "ups", "panel"] },
  { id: "stairs", label: "Stairs", items: ["stairs"] }
];

export const FURNITURE_STYLE = {
  stroke: "#94A3B8",
  fill: "#FFFFFF",
  leaf: "#DCFCE7",
  width: 2,
  opacity: 0.5
};

const SEAT_PITCH = 70;
const TREAD = 28;

function round(value){
  return Math.round(value * 100) / 100;
}

function chairParts(cx, cy, rotation, w = 56, h = 56){
  const transform = `translate(${round(cx)} ${round(cy)}) rotate(${round(rotation)})`;
  const x = -w / 2;
  const y = -h / 2;
  return [
    { tag: "rect", attrs: { x: x + 6, y: y + 4, width: w - 12, height: h - 16, rx: 10, transform } },
    { tag: "rect", attrs: { x: x + 4, y: y + h - 14, width: w - 8, height: 10, rx: 5, transform } },
    { tag: "rect", attrs: { x, y: y + 10, width: 6, height: h - 28, rx: 3, transform } },
    { tag: "rect", attrs: { x: x + w - 6, y: y + 10, width: 6, height: h - 28, rx: 3, transform } }
  ];
}

export function furnitureParts(item){
  const w = item.width;
  const h = item.height;
  const x = -w / 2;
  const y = -h / 2;

  switch (item.type) {
    case "chair":
      return chairParts(0, 0, 0, w, h);

    case "drawer":
      return [
        { tag: "rect", attrs: { x, y, width: w, height: h, rx: 2 } },
        { tag: "line", attrs: { x1: x + 4, x2: x + w - 4, y1: y + h - 14, y2: y + h - 14 } },
        { tag: "line", attrs: { x1: -6, x2: 6, y1: y + h - 7, y2: y + h - 7 } }
      ];

    case "shelf":
      return [
        { tag: "rect", attrs: { x, y, width: w, height: h, rx: 1 } },
        { tag: "line", attrs: { x1: x + w / 3, x2: x + w / 3, y1: y, y2: y + h } },
        { tag: "line", attrs: { x1: x + w * 2 / 3, x2: x + w * 2 / 3, y1: y, y2: y + h } },
        { tag: "line", attrs: { x1: x + 3, x2: x + w - 3, y1: y + h - 6, y2: y + h - 6 } }
      ];

    case "cabinet":
      return [
        { tag: "rect", attrs: { x, y, width: w, height: h, rx: 2 } },
        { tag: "line", attrs: { x1: 0, x2: 0, y1: y, y2: y + h } },
        { tag: "line", attrs: { x1: -8, x2: -4, y1: y + h - 8, y2: y + h - 8 } },
        { tag: "line", attrs: { x1: 4, x2: 8, y1: y + h - 8, y2: y + h - 8 } }
      ];

    case "sofa":
      return [
        { tag: "rect", attrs: { x, y, width: w, height: h, rx: 12 } },
        { tag: "rect", attrs: { x: x + 4, y: y + 4, width: w - 8, height: 18, rx: 8 } },
        { tag: "rect", attrs: { x: x + 4, y: y + 24, width: 18, height: h - 28, rx: 8 } },
        { tag: "rect", attrs: { x: x + w - 22, y: y + 24, width: 18, height: h - 28, rx: 8 } },
        { tag: "line", attrs: { x1: 0, x2: 0, y1: y + 24, y2: y + h - 6 } }
      ];

    case "plant":
      return [
        { tag: "circle", attrs: { cx: 0, cy: 0, r: w / 2 - 1 } },
        { tag: "circle", attrs: { cx: -7, cy: -6, r: 9 }, fill: "leaf" },
        { tag: "circle", attrs: { cx: 8, cy: -4, r: 8 }, fill: "leaf" },
        { tag: "circle", attrs: { cx: 0, cy: 8, r: 8 }, fill: "leaf" }
      ];

    case "roundTable": {
      const parts = [{ tag: "circle", attrs: { cx: 0, cy: 0, r: 50 } }];
      for (const angle of [45, 135, 225, 315]) {
        const radians = angle * Math.PI / 180;
        parts.push(...chairParts(Math.cos(radians) * 82, Math.sin(radians) * 82, angle - 90));
      }
      return parts;
    }

    case "meetingTable": {
      const parts = [];
      const table = { width: w - 20, depth: Math.max(40, h - 120) };
      const seats = Math.max(1, Math.floor((table.width - 56) / SEAT_PITCH) + 1);
      for (let seat = 0; seat < seats; seat += 1) {
        const along = (seat - (seats - 1) / 2) * SEAT_PITCH;
        parts.push(...chairParts(along, -table.depth / 2 - 30, 180));
        parts.push(...chairParts(along, table.depth / 2 + 30, 0));
      }
      parts.push({ tag: "rect", attrs: { x: -table.width / 2, y: -table.depth / 2, width: table.width, height: table.depth, rx: 6 } });
      return parts;
    }

    case "bench":
      return [
        { tag: "rect", attrs: { x, y, width: w, height: h, rx: 4 } },
        { tag: "line", attrs: { x1: x + 4, x2: x + w - 4, y1: y + h / 3, y2: y + h / 3 } },
        { tag: "line", attrs: { x1: x + 4, x2: x + w - 4, y1: y + h * 2 / 3, y2: y + h * 2 / 3 } }
      ];

    case "ahu":
      return [
        { tag: "rect", attrs: { x, y, width: w, height: h, rx: 2 } },
        { tag: "line", attrs: { x1: x + w * 0.28, x2: x + w * 0.28, y1: y, y2: y + h } },
        { tag: "line", attrs: { x1: x + w * 0.56, x2: x + w * 0.56, y1: y, y2: y + h } },
        { tag: "line", attrs: { x1: x + 6, x2: x + w * 0.28 - 6, y1: y + 6, y2: y + h - 6 } },
        { tag: "line", attrs: { x1: x + 6, x2: x + w * 0.28 - 6, y1: y + h - 6, y2: y + 6 } },
        { tag: "line", attrs: { x1: x + w * 0.28 + 8, x2: x + w * 0.56 - 8, y1: y + h * 0.3, y2: y + h * 0.3 } },
        { tag: "line", attrs: { x1: x + w * 0.28 + 8, x2: x + w * 0.56 - 8, y1: y + h * 0.5, y2: y + h * 0.5 } },
        { tag: "line", attrs: { x1: x + w * 0.28 + 8, x2: x + w * 0.56 - 8, y1: y + h * 0.7, y2: y + h * 0.7 } },
        { tag: "circle", attrs: { cx: x + w * 0.78, cy: 0, r: Math.min(h, w * 0.44) * 0.36 } },
        { tag: "circle", attrs: { cx: x + w * 0.78, cy: 0, r: 5 } }
      ];

    case "boiler":
      return [
        { tag: "rect", attrs: { x, y, width: w, height: h, rx: 8 } },
        { tag: "circle", attrs: { cx: 0, cy: 2, r: Math.min(w, h) * 0.3 } },
        { tag: "circle", attrs: { cx: 0, cy: 2, r: 4 } },
        { tag: "line", attrs: { x1: x + 8, x2: x + w - 8, y1: y + 8, y2: y + 8 } }
      ];

    case "tank":
      return [
        { tag: "circle", attrs: { cx: 0, cy: 0, r: w / 2 - 1 } },
        { tag: "circle", attrs: { cx: 0, cy: 0, r: w / 2 - 10 } },
        { tag: "line", attrs: { x1: -w / 2 + 10, x2: w / 2 - 10, y1: 0, y2: 0 } }
      ];

    case "panel":
      return [
        { tag: "rect", attrs: { x, y, width: w, height: h, rx: 2 } },
        { tag: "line", attrs: { x1: x + 3, x2: x + w - 3, y1: y + h - 5, y2: y + h - 5 } },
        { tag: "path", attrs: { d: `M 3 ${round(y + 4)} L -5 ${round(y + h / 2)} L 5 ${round(y + h / 2)} L -3 ${round(y + h - 8)}` }, fill: "none" }
      ];

    case "serverRack":
      return [
        { tag: "rect", attrs: { x, y, width: w, height: h, rx: 1 } },
        { tag: "line", attrs: { x1: x + 8, x2: x + 8, y1: y + 4, y2: y + h - 12 } },
        { tag: "line", attrs: { x1: x + w - 8, x2: x + w - 8, y1: y + 4, y2: y + h - 12 } },
        { tag: "line", attrs: { x1: x, x2: x + w, y1: y + h - 10, y2: y + h - 10 } }
      ];

    case "cooling":
      return [
        { tag: "rect", attrs: { x, y, width: w, height: h, rx: 2 } },
        { tag: "circle", attrs: { cx: 0, cy: -4, r: Math.min(w, h) * 0.3 } },
        { tag: "line", attrs: { x1: x + 6, x2: x + w - 6, y1: y + h - 10, y2: y + h - 10 } },
        { tag: "line", attrs: { x1: x + 6, x2: x + w - 6, y1: y + h - 5, y2: y + h - 5 } }
      ];

    case "ups":
      return [
        { tag: "rect", attrs: { x, y, width: w, height: h, rx: 2 } },
        { tag: "rect", attrs: { x: x + 12, y: y + h - 22, width: w - 24, height: 12, rx: 2 } },
        { tag: "line", attrs: { x1: x + 8, x2: x + w - 8, y1: y + 12, y2: y + 12 } }
      ];

    case "stairs": {
      const parts = [{ tag: "rect", attrs: { x, y, width: w, height: h } }];
      const flights = w >= 220 ? 2 : 1;
      const gap = flights === 2 ? 10 : 0;
      const flightWidth = (w - gap) / flights;
      const landing = flights === 2 ? Math.min(flightWidth, h * 0.3) : 0;
      const run = h - landing;
      const steps = Math.max(2, Math.floor(run / TREAD));
      const tread = run / steps;
      for (let flight = 0; flight < flights; flight += 1) {
        const x0 = x + flight * (flightWidth + gap);
        for (let step = 1; step < steps; step += 1) {
          const ty = y + landing + step * tread;
          parts.push({ tag: "line", attrs: { x1: x0, x2: x0 + flightWidth, y1: ty, y2: ty } });
        }
      }
      if (flights === 2) {
        parts.push({ tag: "rect", attrs: { x: x + flightWidth, y: y + landing, width: gap, height: run } });
        parts.push({ tag: "line", attrs: { x1: x, x2: x + w, y1: y + landing, y2: y + landing } });
      }
      const middle = (flight) => x + flight * (flightWidth + gap) + flightWidth / 2;
      const top = flights === 2 ? y + landing / 2 : y + 14;
      const bottom = y + h - 14;
      const walk = flights === 2
        ? `M ${round(middle(0))} ${round(bottom)} V ${round(top)} H ${round(middle(1))} V ${round(bottom)}`
        : `M ${round(middle(0))} ${round(bottom)} V ${round(top)}`;
      const tip = flights === 2 ? { x: middle(1), y: bottom, dir: 1 } : { x: middle(0), y: top, dir: -1 };
      parts.push({ tag: "path", attrs: { d: walk }, fill: "none" });
      parts.push({ tag: "path", attrs: { d: `M ${round(tip.x - 8)} ${round(tip.y - tip.dir * 12)} L ${round(tip.x)} ${round(tip.y)} L ${round(tip.x + 8)} ${round(tip.y - tip.dir * 12)}` }, fill: "none" });
      parts.push({ tag: "circle", attrs: { cx: middle(0), cy: bottom, r: 4 } });
      return parts;
    }

    case "whiteboard":
      return [
        { tag: "rect", attrs: { x, y, width: w, height: h, rx: 1 } },
        { tag: "line", attrs: { x1: x + 10, x2: x + w - 10, y1: y + h + 6, y2: y + h + 6 } }
      ];

    case "counter":
      return [
        { tag: "rect", attrs: { x, y, width: w, height: h, rx: 1 } },
        { tag: "line", attrs: { x1: x, x2: x + w, y1: y + h - 6, y2: y + h - 6 } }
      ];

    case "sink":
      return [
        { tag: "rect", attrs: { x, y, width: w, height: h, rx: 2 } },
        { tag: "rect", attrs: { x: x + 7, y: y + 12, width: w - 14, height: h - 18, rx: 6 } },
        { tag: "circle", attrs: { cx: 0, cy: y + 6, r: 2.5 } }
      ];

    case "fridge":
      return [
        { tag: "rect", attrs: { x, y, width: w, height: h, rx: 2 } },
        { tag: "line", attrs: { x1: x + 4, x2: x + w - 4, y1: y + h - 8, y2: y + h - 8 } },
        { tag: "line", attrs: { x1: x + 6, x2: x + w - 6, y1: y + 6, y2: y + h - 14 } }
      ];

    case "toilet":
      return [
        { tag: "rect", attrs: { x, y, width: w, height: 18, rx: 3 } },
        { tag: "rect", attrs: { x: x + 3, y: y + 20, width: w - 6, height: h - 20, rx: (w - 6) / 2 } }
      ];

    case "washbasin":
      return [
        { tag: "rect", attrs: { x, y, width: w, height: h, rx: 8 } },
        { tag: "rect", attrs: { x: x + 6, y: y + 8, width: w - 12, height: h - 14, rx: 10 } },
        { tag: "circle", attrs: { cx: 0, cy: y + 4, r: 2 } }
      ];

    case "rack":
      return [
        { tag: "rect", attrs: { x, y, width: w, height: h, rx: 1 } },
        { tag: "line", attrs: { x1: x + w / 3, x2: x + w / 3, y1: y, y2: y + h } },
        { tag: "line", attrs: { x1: x + w * 2 / 3, x2: x + w * 2 / 3, y1: y, y2: y + h } },
        { tag: "line", attrs: { x1: x, x2: x + w, y1: y, y2: y + h } },
        { tag: "line", attrs: { x1: x, x2: x + w, y1: y + h, y2: y } }
      ];

    default:
      return [{ tag: "rect", attrs: { x, y, width: w, height: h, rx: 2 } }];
  }
}

export function furnitureTransform(item){
  return `translate(${round(item.cx)} ${round(item.cy)}) rotate(${round(item.rotation)})`;
}

export function furnitureCorners(item){
  const angle = item.rotation * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
    const lx = sx * item.width / 2;
    const ly = sy * item.height / 2;
    return { x: item.cx + lx * cos - ly * sin, y: item.cy + lx * sin + ly * cos };
  });
}

export function furnitureFits(room, item){
  const outline = outlinePoints(room);
  return furnitureCorners(item).every((corner) => pointInPolygon(corner, outline));
}

export function newFurniture(type, cx, cy, rotation = 0){
  const spec = FURNITURE[type];
  return { type, cx, cy, width: spec.width, height: spec.depth, rotation };
}

export function partFill(part, style = FURNITURE_STYLE){
  if (part.tag === "line") return "none";
  if (part.fill === "none") return "none";
  return part.fill === "leaf" ? style.leaf : style.fill;
}

export function furnitureToSvg(room, style = FURNITURE_STYLE){
  return (room.furniture ?? []).map((item) => {
    const id = `room_${room.id}_${item.type}_${item.id}`;
    const parts = furnitureParts(item).map((part, index) => svgElement(part.tag, {
      ...Object.fromEntries(Object.entries(part.attrs).map(([key, value]) => [key, typeof value === "number" ? round(value) : value])),
      fill: partFill(part, style),
      id: `${id}_${index + 1}`,
      stroke: style.stroke,
      "stroke-width": style.width
    }));
    return [
      `<g atv:refpx="${round(item.cx)}" atv:refpy="${round(item.cy)}" id="${id}" opacity="${style.opacity}" transform="${furnitureTransform(item)}">`,
      ...parts,
      `</g>`
    ].join("\n");
  });
}
