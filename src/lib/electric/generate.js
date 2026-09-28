import { SLOT, electricSize } from "./symbols.js";
import { pageLeft, usedPages } from "./sheet.js";
import { cleanChannel } from "../io/patterns.js";
import { displayLabel } from "../io/mask.js";

const LAYOUT = {
  controllerY: 160,
  sp: 300,
  coilY: 380,
  sn: 560,
  contactY: 600,
  stripY: 680,
  cableY: 760,
  deviceY: 840,
  firstSlot: 80,
  railLeft: 40,
  railRight: 1640,
  slots: 78,
  prefix: 3,
  group: 8
};

const WIRE_WIDTH = 1.5;

export const WIRING_DEFAULTS = { relay: true, cable: "J-H(St)H {pairs}x2x0,8mm2", strip: "-X2" };

function slotX(page, slot){
  return pageLeft(page) + LAYOUT.firstSlot + slot * SLOT;
}

function highest(shapes, type, pattern){
  let top = 0;
  for (const shape of shapes) {
    if (shape.kind !== "equipment" || shape.type !== type) continue;
    const values = type === "terminalStrip" ? (shape.params?.terminals ?? []) : [shape.name];
    for (const value of values) {
      const match = String(value ?? "").match(pattern);
      if (match) top = Math.max(top, Number(match[1]));
    }
  }
  return top;
}

function devicePoints(shapes){
  return new Set(shapes.filter((shape) => shape.kind === "equipment" && shape.source?.point).map((shape) => shape.source.point));
}

function deviceTerminals(point, relay){
  if (point.kind === "AI") return ["1", "2"];
  if (point.kind === "AO") return ["Y", "GND"];
  if (point.kind === "DI") return ["C", "NO"];
  return relay ? ["1", "2"] : ["L", "N"];
}

function deviceName(point){
  const base = String(point.name ?? "").trim() || [cleanChannel(point.board), cleanChannel(point.channel)].filter(Boolean).join("_");
  return `-${base}`;
}

function cableType(template, conductors){
  return template.replace("{pairs}", String(Math.ceil(conductors / 2)));
}

function paginate(points){
  const pages = [];
  const perPage = Math.floor((LAYOUT.slots - LAYOUT.prefix) / LAYOUT.group);
  let board = null;
  for (const point of points) {
    const key = cleanChannel(point.board);
    const current = pages[pages.length - 1];
    if (!current || key !== board || current.points.length >= perPage) {
      pages.push({ board: key, first: key !== board, points: [] });
      board = key;
    }
    pages[pages.length - 1].points.push(point);
  }
  return pages;
}

export function missingPoints(points, shapes){
  const placed = devicePoints(shapes);
  return points.filter((point) => point.id && !placed.has(point.id));
}

export function wiringFromIo(points, shapes, nextId, options = {}){
  const settings = { ...WIRING_DEFAULTS, ...options };
  const pending = missingPoints(points, shapes);
  const added = [];
  const boards = new Map();
  for (const shape of shapes) {
    if (shape.kind === "equipment" && shape.type === "controller" && shape.source?.board !== undefined) boards.set(shape.source.board, shape.name);
  }
  let terminal = highest(shapes, "terminalStrip", /^(\d+)$/);
  let relay = highest(shapes, "relayCoil", /^-K(\d+)$/);
  let pageNumber = usedPages(shapes);

  const element = (type, x, y, name, params, source = null) => {
    const shape = { id: nextId(), kind: "equipment", type, x, y, ...electricSize(type, params), name, params, ...(source ? { source } : {}) };
    added.push(shape);
    return shape;
  };
  const wire = (from, to, medium = "wire") => {
    const shape = { id: nextId(), kind: "pipe", from, to, points: [], medium, width: WIRE_WIDTH };
    added.push(shape);
    return shape;
  };
  const port = (shape, side, slot) => ({ id: shape.id, side, offset: (slot + 1) * SLOT });

  for (const page of paginate(pending)) {
    const index = pageNumber;
    pageNumber += 1;
    if (!boards.has(page.board)) boards.set(page.board, `-N${boards.size + 1}`);
    const controllerName = boards.get(page.board);
    const hasDo = page.points.some((point) => point.kind === "DO" && settings.relay);
    const terminals = Array(LAYOUT.slots).fill("");
    const controllerWires = [];
    if (page.first) {
      terminals[0] = "G";
      terminals[1] = "G0";
    }
    if (hasDo) terminals[2] = "C";

    const left = pageLeft(index);
    const sp = wire({ x: left + LAYOUT.railLeft, y: LAYOUT.sp }, { x: left + LAYOUT.railRight, y: LAYOUT.sp }, "sp");
    const sn = wire({ x: left + LAYOUT.railLeft, y: LAYOUT.sn }, { x: left + LAYOUT.railRight, y: LAYOUT.sn }, "sn");
    const rail = (pipe, slot) => ({ pipe: pipe.id, x: slotX(index, slot), y: pipe === sp ? LAYOUT.sp : LAYOUT.sn });

    if (page.first) {
      controllerWires.push((controller) => wire(port(controller, "bottom", 0), rail(sp, 0)));
      controllerWires.push((controller) => wire(port(controller, "bottom", 1), rail(sn, 1)));
    }
    if (hasDo) controllerWires.push((controller) => wire(port(controller, "bottom", 2), rail(sp, 2)));

    const groups = page.points.map((point, position) => ({ point, slot: LAYOUT.prefix + position * LAYOUT.group }));
    for (const { point, slot } of groups) {
      terminals[slot] = cleanChannel(point.channel) || point.kind;
      if (point.kind !== "DO") terminals[slot + 1] = "GND";
    }
    const used = terminals.reduce((last, label, position) => label ? position : last, 0);
    const controller = element("controller", slotX(index, 0) - SLOT, LAYOUT.controllerY, controllerName,
      { model: page.board ? `Extension ${page.board}` : "Controller", terminals: terminals.slice(0, used + 1) }, { board: page.board });
    controllerWires.forEach((make) => make(controller));

    for (const { point, slot } of groups) {
      const x = slotX(index, slot) - SLOT;
      const label = displayLabel(point);
      const name = deviceName(point);
      const direct = point.kind === "DO" && !settings.relay;
      const numbers = [String(++terminal), String(++terminal)];
      const strip = element("terminalStrip", x, LAYOUT.stripY, settings.strip, { terminals: numbers });
      const cable = element("cable", x, LAYOUT.cableY, `-W.${name.slice(1)}`, { conductors: ["1", "2"], cableType: cableType(settings.cable, 2) });
      const device = element("fieldDevice", x, LAYOUT.deviceY, name, { terminals: deviceTerminals(point, settings.relay), model: "", description: label }, { point: point.id });
      for (const conductor of [0, 1]) {
        wire(port(strip, "bottom", conductor), port(cable, "top", conductor));
        wire(port(cable, "bottom", conductor), port(device, "top", conductor));
      }
      if (point.kind === "DO" && !direct) {
        relay += 1;
        const coil = element("relayCoil", x, LAYOUT.coilY, `-K${relay}`, { note: label });
        const contact = element("relayContact", x, LAYOUT.contactY, `-K${relay}`, {});
        wire(port(controller, "bottom", slot), { id: coil.id, side: "top", offset: 20 });
        wire({ id: coil.id, side: "bottom", offset: 20 }, rail(sn, slot));
        wire({ id: contact.id, side: "bottom", offset: 20 }, port(strip, "top", 0));
        wire({ id: contact.id, side: "bottom", offset: 40 }, port(strip, "top", 1));
      } else if (direct) {
        wire(port(controller, "bottom", slot), port(strip, "top", 0));
        wire(rail(sn, slot + 1), port(strip, "top", 1));
      } else {
        wire(port(controller, "bottom", slot), port(strip, "top", 0));
        wire(port(controller, "bottom", slot + 1), port(strip, "top", 1));
      }
    }
  }
  return { shapes: added, points: pending.length, pages: pageNumber - usedPages(shapes) };
}
