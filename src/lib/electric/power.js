import { SLOT, PROTECTION_KINDS, PSU_PORTS, electricSize } from "./symbols.js";
import { paperOf, pageLeft, pageIndex, noteText, noteWidth } from "./sheet.js";
import { normalizeGroups } from "./rowGroups.js";

export const POLES = [
  { id: "1p", lines: 1, neutral: false },
  { id: "1p+N", lines: 1, neutral: true },
  { id: "3p", lines: 3, neutral: false },
  { id: "3p+N", lines: 3, neutral: true }
];

export const LOADS = [
  { id: "consumer", label: "Consumer", prefix: "-E", symbol: "", cosphi: 0.9 },
  { id: "heatPump", label: "Heat pump / compressor", prefix: "-E", symbol: "motor", cosphi: 0.8 },
  { id: "motor", label: "Motor / pump", prefix: "-M", symbol: "motor", cosphi: 0.8 },
  { id: "heater", label: "Heater", prefix: "-E", symbol: "heater", cosphi: 1 },
  { id: "socket", label: "Socket on DIN rail", prefix: "-SOC", cabinet: true, kind: "socket", cosphi: 1 },
  { id: "wallSocket", label: "Wall socket (with cable)", prefix: "-SOC", symbol: "socket", cosphi: 1 },
  { id: "light", label: "Lighting", prefix: "-E", symbol: "light", cosphi: 0.95 },
  { id: "valve3", label: "Valve / actuator 230 V 3-wire", prefix: "-Y", symbol: "", cosphi: 0.9, labels: ["1", "2", "3"], roles: ["L", "N", "Lp"] },
  { id: "psu", label: "PSU 24 V DC", prefix: "-T", cabinet: true, kind: "dc", cosphi: 0.9 },
  { id: "transformer", label: "Transformer 24 V AC", prefix: "-T", cabinet: true, kind: "ac", cosphi: 0.9 },
  { id: "none", label: "None · feeds others", prefix: "" }
];

export const LOAD_LIBRARY = [
  { id: "pump1", label: "Circulation pump 230 V", description: "OBTOČNA ČRPALKA", load: "motor", poles: "1p", power: "0,1", protection: "mcb", cable: "NYM-J 3x1,5mm2" },
  { id: "pump3", label: "Circulation pump 400 V", description: "OBTOČNA ČRPALKA", load: "motor", poles: "3p", power: "0,75", protection: "mpcb", cable: "NYM-J 4x1,5mm2" },
  { id: "convector", label: "Convector / fan coil 230 V", description: "KONVEKTOR", load: "motor", poles: "1p", power: "0,1", protection: "mcb", cable: "FLAME-JZ-H FRNC 3x1,5 mm2" },
  { id: "fan3", label: "AHU fan 400 V with VFD", description: "VENTILATOR", load: "motor", poles: "3p", power: "2,2", protection: "mcb", cable: "NYCY 4x2,5mm2" },
  { id: "blind", label: "Blind motor 230 V", description: "ŽALUZIJA", load: "motor", poles: "1p", power: "0,15", protection: "mcb", cable: "FLAME-JZ-H FRNC 4x1,5 mm2" },
  { id: "heater1", label: "Electric heater 2 kW 230 V", description: "ELEKTRIČNI GRELNIK", load: "heater", poles: "1p", power: "2", protection: "mcb", cable: "NYM-J 3x2,5mm2" },
  { id: "heater3", label: "Electric heater 6 kW 400 V", description: "ELEKTRIČNI GRELNIK", load: "heater", poles: "3p", power: "6", protection: "mcb", cable: "NYM-J 4x2,5mm2" },
  { id: "dhw", label: "DHW electric heater 3 kW", description: "ELEKTRIČNI GRELEC STV", load: "heater", poles: "1p+N", power: "3", protection: "rcbo", cable: "NYM-J 3x2,5mm2" },
  { id: "hp1", label: "Heat pump 230 V, 4 kW", description: "TOPLOTNA ČRPALKA", load: "heatPump", poles: "1p", power: "4", protection: "mcb", cable: "NYM-J 3x4mm2" },
  { id: "hp3", label: "Heat pump 400 V, 8 kW", description: "TOPLOTNA ČRPALKA", load: "heatPump", poles: "3p+N", power: "8", protection: "mcb", cable: "NYY-J 5x4mm2" },
  { id: "socket", label: "Socket on DIN rail 230 V 16 A", description: "Vtičnica\nna DIN letvi", load: "socket", poles: "1p", power: "", protection: "mcb" },
  { id: "wallSocket", label: "Wall socket 230 V 16 A", description: "VTIČNICA", load: "wallSocket", poles: "1p+N", power: "3,5", protection: "rcbo", cable: "NYM-J 3x2,5mm2" },
  { id: "valve3", label: "Zone valve 230 V 3-wire (on a shared breaker)", description: "ZAPORNI VENTIL", load: "valve3", poles: "1p", power: "0,01", protection: "none", cable: "NYM-J 3x1,5mm2" },
  { id: "light", label: "Lighting circuit", description: "RAZSVETLJAVA", load: "light", poles: "1p", power: "0,5", protection: "mcb", cable: "NYM-J 3x1,5mm2" },
  { id: "psu25", label: "PSU 230 V AC / 24 V DC 2,5 A", description: "NAPAJALNIK 24 V DC", load: "psu", poles: "1p", power: "0,07", protection: "mcb", loadData: "230VAC/24VDC 2,5A" },
  { id: "psu5", label: "PSU 230 V AC / 24 V DC 5 A", description: "NAPAJALNIK 24 V DC", load: "psu", poles: "1p", power: "0,14", protection: "mcb", loadData: "230VAC/24VDC 5A" },
  { id: "trafo", label: "Transformer 230 / 24 V AC 100 VA", description: "TRANSFORMATOR 24 V AC", load: "transformer", poles: "1p", power: "0,1", protection: "mcb", loadData: "230VAC/24VAC 100VA" },
  { id: "panel3", label: "Sub-panel 400 V, 10 kW", description: "RAZDELILNIK", load: "consumer", poles: "3p+N", power: "10", protection: "mcb", cable: "NYY-J 5x6mm2" }
];

export const SYSTEMS = [
  { id: "TN-S", label: "TN-S · separate N and PE throughout" },
  { id: "TN-C-S", label: "TN-C-S · PEN split into N and PE at the panel" },
  { id: "TN-C", label: "TN-C · combined PEN conductor" },
  { id: "TT", label: "TT · own earth electrode, RCDs required" },
  { id: "IT", label: "IT · isolated supply" }
];

export const CABLE_TYPES = [
  "NYM-J 3x1,5mm2", "NYM-J 3x2,5mm2", "NYM-J 3x4mm2", "NYM-J 4x1,5mm2", "NYM-J 4x2,5mm2", "NYM-J 5x1,5mm2", "NYM-J 5x2,5mm2", "NYM-J 5x4mm2", "NYM-J 5x6mm2",
  "NYY-J 3x2,5mm2", "NYY-J 5x2,5mm2", "NYY-J 5x4mm2", "NYY-J 5x6mm2", "NYY-J 5x10mm2", "NYY-J 5x16mm2",
  "NHXMH-J 3x1,5mm2", "NHXMH-J 3x2,5mm2", "NHXMH-J 5x2,5mm2", "NHXMH-J 5x4mm2", "NHXMH-J 5x6mm2", "NHXMH-J 5x10mm2",
  "FLAME-JZ-H FRNC 3x1,0 mm2", "FLAME-JZ-H FRNC 3x1,5 mm2", "FLAME-JZ-H FRNC 4x1,5 mm2", "FLAME-JZ-H FRNC 5x1,5 mm2",
  "NYCY 4x1,5mm2", "NYCY 4x2,5mm2", "J-H(St)H 2x2x0,8mm2"
];

export const SIZING_DEFAULTS = {
  voltage: 230,
  lineVoltage: 400,
  loading: 80,
  simultaneity: 100,
  characteristic: "C",
  sensitivity: "30mA",
  minimum: { feeder: 10, cabinet: 6, socket: 16, heatPump: 16, group: 10 },
  cosphi: { consumer: 0.9, heatPump: 0.8, motor: 0.8, heater: 1, socket: 1, wallSocket: 1, light: 0.95, psu: 0.9, transformer: 0.9 },
  mcbSizes: "6, 10, 13, 16, 20, 25, 32, 40, 50, 63",
  rcdSizes: "25, 40, 63, 80, 100",
  switchSizes: "20, 25, 32, 40, 63, 80, 100, 125"
};

export function sizingOf(power){
  const saved = power?.sizing ?? {};
  return {
    ...SIZING_DEFAULTS,
    ...saved,
    minimum: { ...SIZING_DEFAULTS.minimum, ...(saved.minimum ?? {}) },
    cosphi: { ...SIZING_DEFAULTS.cosphi, ...(saved.cosphi ?? {}) }
  };
}

function sizeList(text, fallback){
  const list = String(text ?? "").split(/[,;\s]+/).map((entry) => Number(entry.replace(",", "."))).filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  return list.length ? list : sizeList(fallback, "10");
}
const MPCB_RANGES = [[0.1, 0.16], [0.16, 0.25], [0.25, 0.4], [0.4, 0.63], [0.63, 1], [1, 1.6], [1.6, 2.5], [2.5, 4], [4, 6.3], [6, 10], [9, 14], [13, 18], [17, 23], [20, 25], [24, 32]];

export const PHASES = ["L1", "L2", "L3"];

export const SUPPLY_DEFAULTS = { phases: 3, system: "TN-S", tag: "-W.DOVOD", cable: "NHXMH-J 5x2,5mm2", description: "DOVOD", incoming: "-X0", strip: "-X1" };

export const COLUMNS = ["Tag", "Description", "Protection", "Rating", "Poles", "Phase", "Fed from", "Load", "Load tag", "Power kW", "Load data", "Cable", "Terminals", "Switched by", "LV protection", "Max current A"];

const Y = { rails: 80, railStep: 20, top: [140, 160], bottom: [448, 464], group: 180, bus: 256, busStep: 12, device: 300, contactGap: 76, cabinetRail: 260, cabinetGroup: 364, socketRail: 252, socketGroup: 352, neutral: 480, pe: 500, strip: 518, cable: 562, load: 608 };
const GRID = 20;
const LEAD = 60;
const TAIL = 20;
const SUPPLY_TAIL = 120;
const SPILL = 60;

function withPoles(rating, poles){
  const text = String(rating ?? "").trim();
  if (!poles || /\/\s*\d+\s*p(\+N)?\s*$/i.test(text)) return text;
  return [text, poles].filter(Boolean).join("/");
}

function snapUp(value){
  return Math.ceil(value / GRID) * GRID;
}
const WIRE_WIDTH = 1.5;
const RAIL_MEDIA = { L1: "l1", L2: "l2", L3: "l3" };

export function poleOf(id){
  return POLES.find((entry) => entry.id === id) ?? POLES[0];
}

export function loadOf(id){
  return LOADS.find((entry) => entry.id === id) ?? LOADS[0];
}

function uid(){
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function nextTag(rows, prefix){
  let top = 0;
  for (const row of rows) {
    for (const value of [row.tag, row.loadTag]) {
      const match = String(value ?? "").match(new RegExp(`^${prefix}(\\d+)$`));
      if (match) top = Math.max(top, Number(match[1]));
    }
  }
  return `${prefix}${top + 1}`;
}

export function newPowerRow(rows, values = {}){
  const protection = values.protection ?? "mcb";
  const prefix = protection === "switch" || protection === "mpcb" ? "-Q" : "-F";
  return {
    id: uid(),
    tag: values.protection === "none" ? "" : nextTag(rows, prefix),
    description: "",
    protection,
    rating: "",
    poles: "1p",
    phase: "",
    from: "",
    load: "consumer",
    loadTag: "",
    power: "",
    maxCurrent: "",
    loadData: "",
    cable: "",
    strip: "",
    switchedBy: "",
    lvProtection: "",
    group: "",
    ...values
  };
}

export function emptyPower(){
  return { supply: { ...SUPPLY_DEFAULTS }, rows: [], groups: [], sizing: structuredClone(SIZING_DEFAULTS) };
}

export function normalizePower(data){
  const base = emptyPower();
  if (!data || typeof data !== "object") return base;
  const supply = { ...base.supply, ...(data.supply ?? {}) };
  supply.phases = supply.phases === 1 ? 1 : 3;
  const rows = Array.isArray(data.rows) ? data.rows.filter((row) => row && typeof row === "object").map((row) => newPowerRow([], { ...row, id: typeof row.id === "string" && row.id ? row.id : uid() })) : [];
  return { supply, rows, groups: normalizeGroups(data.groups, rows), sizing: sizingOf(data) };
}

function pick(list, value, fallback){
  const needle = String(value ?? "").trim().toLowerCase();
  if (!needle) return fallback;
  return list.find((entry) => entry.id.toLowerCase() === needle || entry.label?.toLowerCase() === needle)?.id ?? fallback;
}

function tableCells(text){
  const lines = [];
  let cells = [];
  let cell = "";
  let quoted = false;
  const source = String(text ?? "").replace(/\r\n?/g, "\n");
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"' && cell === "") quoted = true;
    else if (char === "\t") { cells.push(cell); cell = ""; }
    else if (char === "\n") { cells.push(cell); lines.push(cells); cells = []; cell = ""; }
    else cell += char;
  }
  cells.push(cell);
  lines.push(cells);
  return lines.map((row) => row.map((value) => value.trim())).filter((row) => row.some(Boolean));
}

function tableCell(value){
  const text = String(value ?? "");
  return /[\t\n"]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function parsePowerTable(text, existing = []){
  const rows = [];
  const sources = [];
  for (const cells of tableCells(text)) {
    if (cells[0].toLowerCase() === "tag") continue;
    const [tag, description, protection, rating, poles, phase, from, load, loadTag, power, loadData, cable, strip, switchedBy, lvProtection, maxCurrent] = cells;
    const kind = pick(PROTECTION_KINDS, protection, "mcb");
    const row = newPowerRow([...existing, ...rows], {
      description: description ?? "",
      protection: kind,
      poles: pick(POLES, poles, "1p"),
      phase: PHASES.includes(String(phase ?? "").toUpperCase()) ? phase.toUpperCase() : "",
      load: pick(LOADS, load, "consumer"),
      loadTag: loadTag ?? "",
      power: power ?? "",
      loadData: loadData ?? "",
      cable: cable ?? "",
      strip: strip ?? "",
      switchedBy: switchedBy ?? "",
      lvProtection: lvProtection ?? "",
      maxCurrent: maxCurrent ?? ""
    });
    if (tag) row.tag = tag;
    if (rating) row.rating = rating;
    rows.push(row);
    sources.push(from ?? "");
  }
  const all = [...existing, ...rows];
  rows.forEach((row, index) => {
    const source = sources[index];
    if (/^(supply|dovod|napajanje)$/i.test(source)) row.from = "supply";
    else row.from = all.find((other) => other !== row && other.tag === source)?.id ?? "";
  });
  return rows;
}

export function powerTable(rows){
  const tagOf = (id) => id === "supply" ? "supply" : rows.find((row) => row.id === id)?.tag ?? "";
  const body = rows.map((row) => [row.tag, row.description, row.protection, row.rating, row.poles, row.phase, tagOf(row.from), row.load, row.loadTag, row.power, row.loadData, row.cable, row.strip, row.switchedBy, row.lvProtection, row.maxCurrent].map(tableCell).join("\t"));
  return [COLUMNS.join("\t"), ...body].join("\n");
}

export function libraryRow(rows, entry, values = {}){
  return newPowerRow(rows, {
    description: entry.description,
    protection: entry.protection,
    poles: entry.poles,
    load: entry.load,
    power: entry.power,
    loadData: entry.loadData ?? "",
    cable: entry.cable ?? "",
    ...values
  });
}

function decimal(value){
  const number = Number(String(value ?? "").trim().replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

export function formatNumber(value, digits = 1){
  return (Math.round(value * 10 ** digits) / 10 ** digits).toString().replace(".", ",");
}

export function loadCurrent(row, sizing = SIZING_DEFAULTS){
  const given = decimal(row.maxCurrent);
  if (given) return given;
  const kw = decimal(row.power);
  if (!kw) return 0;
  const cosphi = Number(sizing.cosphi?.[row.load]) || loadOf(row.load).cosphi || 1;
  const voltage = Number(sizing.voltage) || 230;
  const lineVoltage = Number(sizing.lineVoltage) || 400;
  return poleOf(row.poles).lines === 3 ? kw * 1000 / (Math.sqrt(3) * lineVoltage * cosphi) : kw * 1000 / (voltage * cosphi);
}

export function ratingAmps(rating){
  const text = String(rating ?? "").replace(/,/g, ".");
  const range = text.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (range) return Number(range[2]);
  const first = text.match(/(\d+(?:\.\d+)?)/);
  return first ? Number(first[1]) : 0;
}

function sizeFor(kind, amps, floor, sizing){
  const need = Math.max(amps, floor);
  const pick = (text, fallback) => {
    const list = sizeList(text, fallback);
    return list.find((size) => size >= need) ?? list[list.length - 1];
  };
  const mcb = pick(sizing.mcbSizes, SIZING_DEFAULTS.mcbSizes);
  const curve = sizing.characteristic || "C";
  const sensitivity = sizing.sensitivity || "30mA";
  if (kind === "fuse") return `${mcb}A`;
  if (kind === "rcbo") return `${curve}${mcb}/${sensitivity}`;
  if (kind === "rcd") return `${pick(sizing.rcdSizes, SIZING_DEFAULTS.rcdSizes)}A/${sensitivity}`;
  if (kind === "switch") return `${pick(sizing.switchSizes, SIZING_DEFAULTS.switchSizes)}A`;
  if (kind === "mpcb") {
    if (!amps) return "";
    const [low, high] = MPCB_RANGES.find(([, top]) => top >= amps) ?? MPCB_RANGES[MPCB_RANGES.length - 1];
    return `${formatNumber(low, 2)}-${formatNumber(high, 2)}A`;
  }
  return `${curve}${mcb}`;
}

export function powerSizing(power){
  const { rows, supply } = power;
  const lines = supply.phases === 1 ? ["L1"] : PHASES;
  const { main, units } = powerTree(power);
  const ratings = new Map();
  const currents = new Map();
  let turn = 0;
  const phaseLoad = (leaves) => {
    const totals = lines.map(() => 0);
    for (const row of leaves) {
      const amps = currents.get(row.id) ?? 0;
      if (poleOf(row.poles).lines === 3) totals.forEach((_, index) => { totals[index] += amps; });
      else {
        const index = lines.includes(row.phase) ? lines.indexOf(row.phase) : turn++ % lines.length;
        totals[index] += amps;
      }
    }
    return Math.max(0, ...totals);
  };
  const sizing = sizingOf(power);
  const loading = Math.min(1, Math.max(0.1, (Number(sizing.loading) || 100) / 100));
  const together = Math.min(1, Math.max(0.1, (Number(sizing.simultaneity) || 100) / 100));
  const minimum = sizing.minimum;
  const rate = (row, amps, floor) => row.protection === "none" ? "" : row.rating || sizeFor(row.protection, row.protection === "mpcb" ? amps : amps / loading, floor, sizing);
  const floorOf = (row) => {
    const load = loadOf(row.load);
    if (load.kind === "socket") return Number(minimum.socket) || 0;
    if (load.id === "heatPump") return Number(minimum.heatPump) || 0;
    if (load.cabinet) return Number(minimum.cabinet) || 0;
    return Number(minimum.feeder) || 0;
  };
  const groupFloor = Number(minimum.group) || 0;
  for (const row of rows) currents.set(row.id, loadCurrent(row, sizing));
  const leaves = [];
  const tops = [];
  for (const unit of units) {
    const group = unit.children.length ? unit.children : [unit.row];
    for (const child of group) {
      const load = loadOf(child.load);
      ratings.set(child.id, rate(child, currents.get(child.id), floorOf(child)));
      leaves.push(child);
    }
    if (unit.children.length) {
      const demand = phaseLoad(unit.children) * together;
      const largest = Math.max(0, ...unit.children.map((child) => ratingAmps(ratings.get(child.id))));
      currents.set(unit.row.id, demand);
      ratings.set(unit.row.id, rate(unit.row, Math.max(demand, largest * loading), groupFloor));
    }
    tops.push(unit.row);
  }
  if (main) {
    const total = phaseLoad(leaves) * together;
    const largest = Math.max(0, ...tops.map((row) => ratingAmps(ratings.get(row.id))));
    currents.set(main.id, total);
    ratings.set(main.id, rate(main, Math.max(total, largest * loading), groupFloor));
  }
  return { ratings, currents };
}

export function loadTags(rows){
  const taken = new Set(rows.map((row) => row.loadTag).filter(Boolean));
  const counters = new Map();
  const tags = new Map();
  for (const row of rows) {
    const prefix = loadOf(row.load).prefix;
    if (row.loadTag || !prefix || row.load === "none") {
      if (row.loadTag) tags.set(row.id, row.loadTag);
      continue;
    }
    let number = counters.get(prefix) ?? 0;
    do number += 1; while (taken.has(`${prefix}${number}`));
    counters.set(prefix, number);
    tags.set(row.id, `${prefix}${number}`);
  }
  return tags;
}

export function loadRoles(row){
  const load = loadOf(row.load);
  if (load.roles) return load.roles;
  return loadTerminals(row).map((label) => label === "PE" || label === "N" ? label : "L");
}

export function loadTerminals(row){
  const pole = poleOf(row.poles);
  const load = loadOf(row.load);
  if (load.id === "none") return [];
  if (load.labels) return load.labels;
  if (load.cabinet || pole.lines === 1) return ["L", "N", "PE"];
  if (load.id === "motor") return ["U", "V", "W", "PE"];
  return pole.neutral ? ["L1", "L2", "L3", "N", "PE"] : ["L1", "L2", "L3", "PE"];
}

function devicePoles(row, lines = poleOf(row.poles).lines){
  return [...Array(lines).fill("L"), ...(poleOf(row.poles).neutral ? ["N"] : [])];
}

function leafOffset(row){
  const load = loadOf(row.load);
  return load.cabinet && load.kind !== "dc" ? 60 : 0;
}

export function lvProtection(row){
  const load = loadOf(row.load);
  const text = String(row.lvProtection ?? "").trim();
  if (!text || !load.cabinet || load.kind === "socket") return null;
  const [first, ...rest] = text.split(/\s+/);
  return first.startsWith("-") ? { tag: first, rating: rest.join(" ") } : { tag: "", rating: text };
}

function leafWidth(row){
  const load = loadOf(row.load);
  if (load.cabinet) {
    const extra = lvProtection(row) ? 140 : 0;
    if (load.kind === "socket") return snapUp(leafOffset(row) + LEAD + 100);
    return snapUp((load.kind === "ac" ? leafOffset(row) + LEAD + 160 : LEAD + 280) + extra);
  }
  const slots = Math.max(loadTerminals(row).length, devicePoles(row).length);
  const box = Math.max(120, (loadTerminals(row).length + 1) * SLOT);
  const text = noteWidth(row.description, box);
  const terminals = loadTerminals(row).length;
  const cableLabel = Math.max(String(row.cable || `NYM-J ${terminals}x1,5mm2`).length, String(row.loadTag || "-W.XXXX").length + 3) * 4.6;
  const cable = LEAD - SLOT + terminals * SLOT + 14 + cableLabel - (LEAD - 4);
  return snapUp(Math.max(LEAD + (slots + 1) * SLOT + TAIL, LEAD - SLOT + box + SLOT - (LEAD - SLOT), cable, LEAD - SLOT + text + 12 - SPILL));
}

export function powerTree(power){
  const { rows } = power;
  const byId = new Map(rows.map((row) => [row.id, row]));
  const main = rows.find((row) => row.from === "supply") ?? null;
  const onRails = (row) => !row.from || row.from === "supply" || row.from === row.id || !byId.has(row.from) || byId.get(row.from) === main;
  const isRoot = (row) => onRails(row) || !onRails(byId.get(row.from));
  const roots = rows.filter((row) => row !== main && isRoot(row));
  const childrenOf = (row) => rows.filter((other) => other !== main && other.from === row.id && !isRoot(other));
  return { main, units: roots.map((row) => ({ row, children: childrenOf(row) })) };
}

export function isPowerShape(shape){
  return Boolean(shape.source?.power);
}

export function powerPageCount(shapes, paper = paperOf()){
  let last = -1;
  for (const shape of shapes) {
    if (!isPowerShape(shape)) continue;
    if (shape.kind === "equipment") last = Math.max(last, pageIndex(shape.x + shape.width / 2, paper));
  }
  return last + 1;
}

export function shiftShapes(shapes, dx){
  if (!dx) return;
  const move = (point) => { if (point && Number.isFinite(point.x)) point.x += dx; };
  for (const shape of shapes) {
    if (shape.kind === "equipment") shape.x += dx;
    else if (shape.kind === "pipe") {
      (shape.points ?? []).forEach(move);
      move(shape.from);
      move(shape.to);
    } else if (Number.isFinite(shape.x)) shape.x += dx;
  }
}

export function drawPower(power, nextId, paper = paperOf()){
  const { supply } = power;
  const lines = supply.phases === 1 ? ["L1"] : PHASES;
  const { main, units } = powerTree(power);
  const { ratings } = powerSizing(power);
  const tags = loadTags(power.rows);
  const label = (row, poles = row.poles) => withPoles(ratings.get(row.id), poles);
  const shapes = [];
  const source = { power: true, sheet: "NAPAJANJE" };
  let phaseTurn = 0;
  const terminalCount = new Map();
  const oneLine = (text) => String(text ?? "").split("\n").map((part) => part.trim()).filter(Boolean).join(" ");
  const balance = (row) => lines.includes(row.phase) ? row.phase : lines[phaseTurn++ % lines.length];
  const conductorMedium = (label) => label === "N" ? "neutral" : label === "PE" ? "earth" : "wire";

  const element = (type, x, y, name, params) => {
    const shape = { id: nextId(), kind: "equipment", type, x, y, ...electricSize(type, params), name, params, source };
    shapes.push(shape);
    return shape;
  };
  const pipe = (from, to, medium) => {
    const shape = { id: nextId(), kind: "pipe", from, to, points: [], medium, width: WIRE_WIDTH, source };
    shapes.push(shape);
    return shape;
  };
  const wire = (from, to, medium = "wire") => pipe(from, to, medium);
  const note = (description, device) => {
    const shape = noteText(description, device.x, device.y + device.height + 8, noteWidth(description, device.width), nextId(), source);
    if (shape) shapes.push(shape);
  };
  const port = (shape, side, slot) => ({ id: shape.id, side, offset: (slot + 1) * SLOT });
  const tap = (rail, x) => ({ pipe: rail.id, x, y: rail.from.y });
  const neutralIn = (rails, device, slot, side) => {
    const x = device.x + (slot + 1) * SLOT;
    const y = device.y - 10;
    const shape = wire(tap(rails.N, side), port(device, "top", slot), "neutral");
    shape.points = [{ x: side, y }, { x, y }];
  };

  const pages = [];
  const anchored = new Map();
  const anchor = (shape, ...ends) => anchored.set(shape.id, new Set([...(anchored.get(shape.id) ?? []), ...ends]));
  const extras = { sp: false, dc: false };
  const EXTRA = {
    sp: [["SP", Y.top[0], "sp"], ["SN", Y.bottom[1], "sn"]],
    dc: [["DC+", Y.top[1], "dcPlus"], ["DC-", Y.bottom[0], "dcMinus"]]
  };
  const addExtra = (target, kind, starts = null) => {
    for (const [key, y, medium] of EXTRA[kind]) {
      const start = starts?.[key] ?? target.from;
      const rail = target.rails[key];
      if (!rail) {
        target.rails[key] = pipe({ x: start, y }, { x: target.to, y }, medium);
        if (starts) target.rails[key].railEnds = [1];
        if (starts) anchor(target.rails[key], "to");
        else anchor(target.rails[key], "from", "to");
      } else if (start < rail.from.x) rail.from = { ...rail.from, x: start };
    }
  };
  const needExtra = (target, kind, starts) => {
    const fresh = !extras[kind];
    extras[kind] = true;
    addExtra(target, kind, starts);
    if (fresh) pages.filter((entry) => entry.index > target.index).forEach((entry) => addExtra(entry, kind));
  };
  const firstColumn = (index) => snapUp(pageLeft(index, paper) + paper.frame.left + 4);
  const openPage = () => {
    const index = pages.length;
    const left = pageLeft(index, paper);
    const from = left + paper.frame.left + GRID;
    const to = left + paper.frame.right - GRID;
    const rails = {};
    lines.forEach((phase, position) => {
      const y = Y.rails + position * Y.railStep;
      rails[phase] = pipe({ x: from, y }, { x: to, y }, RAIL_MEDIA[phase]);
    });
    rails.N = pipe({ x: from, y: Y.neutral }, { x: to, y: Y.neutral }, "neutral");
    rails.PE = pipe({ x: from, y: Y.pe }, { x: to, y: Y.pe }, "earth");
    Object.values(rails).forEach((rail) => anchor(rail, "from", "to"));
    const created = { index, rails, from, to, cursor: firstColumn(index), limit: to - 10 };
    pages.push(created);
    for (const kind of Object.keys(extras)) if (extras[kind]) addExtra(created, kind);
    return created;
  };
  let page = openPage();
  const place = (width) => {
    if (page.cursor + width > page.limit && page.cursor > firstColumn(page.index)) page = openPage();
    const x = page.cursor;
    page.cursor += width;
    return x;
  };
  const slotX = (x0, slot) => x0 + LEAD + slot * SLOT;

  const supplyTerminals = [...lines, "N", "PE"];
  const supplyX = place(snapUp(LEAD + (supplyTerminals.length + 1) * SLOT + SUPPLY_TAIL));
  const rails = page.rails;
  let mainDevice = null;
  if (main) {
    mainDevice = element("protection", supplyX + LEAD - SLOT, Y.group, main.tag, { kind: main.protection, poles: devicePoles(main, lines.length), rating: label(main, `${lines.length}p${poleOf(main.poles).neutral ? "+N" : ""}`), note: oneLine(main.description) });
    lines.forEach((phase, index) => wire(tap(rails[phase], slotX(supplyX, index)), port(mainDevice, "top", index)));
    if (poleOf(main.poles).neutral) neutralIn(rails, mainDevice, lines.length, slotX(supplyX, lines.length) + SLOT);
  }
  const incoming = element("terminalStrip", supplyX + LEAD - SLOT, Y.strip, supply.incoming || "-X0", { terminals: supplyTerminals });
  const supplyCable = element("cable", supplyX + LEAD - SLOT, Y.cable, supply.tag, { conductors: supplyTerminals.map((_, index) => String(index + 1)), cableType: supply.cable });
  const supplyShape = element("supply", supplyX + LEAD - SLOT, Y.load, "", { terminals: supplyTerminals, description: supply.description });
  supplyTerminals.forEach((conductor, index) => {
    const x = slotX(supplyX, index);
    const medium = conductorMedium(conductor);
    let from;
    if (conductor === "PE") from = tap(rails.PE, x);
    else if (conductor === "N") from = mainDevice && poleOf(main.poles).neutral ? port(mainDevice, "bottom", lines.length) : tap(rails.N, x);
    else from = mainDevice ? port(mainDevice, "bottom", index) : tap(rails[conductor], x);
    wire(from, port(incoming, "top", index), medium);
    wire(port(incoming, "bottom", index), port(supplyCable, "top", index), medium);
    wire(port(supplyCable, "bottom", index), port(supplyShape, "top", index), medium);
  });

  const railSource = (row, rails) => {
    const pole = poleOf(row.poles);
    const phase = pole.lines === 1 ? balance(row) : null;
    return {
      line: (index, x) => tap(rails[pole.lines === 1 ? phase : lines[index] ?? lines[0]], x),
      neutral: (x) => tap(rails.N, x),
      rails
    };
  };

  const drawLeaf = (row, x0, from, target, top) => {
    const rails = target.rails;
    const nested = top !== Y.group;
    const pole = poleOf(row.poles);
    const load = loadOf(row.load);
    const ex = x0 + LEAD - SLOT;
    const direct = row.protection === "none";
    const device = direct ? null : element("protection", ex, top, row.tag, { kind: row.protection, poles: devicePoles(row), rating: label(row), note: load.id === "none" ? oneLine(row.description) : "" });
    if (device) {
      for (let index = 0; index < pole.lines; index += 1) wire(from.line(index, slotX(x0, index)), port(device, "top", index));
      if (pole.neutral && from.rails) neutralIn(from.rails, device, pole.lines, slotX(x0, pole.lines) + SLOT);
      else if (pole.neutral) wire(from.neutral(slotX(x0, pole.lines)), port(device, "top", pole.lines), "neutral");
    }
    if (load.id === "none") return;
    const loadTag = tags.get(row.id) ?? "";
    const terminals = loadTerminals(row);
    const roles = loadRoles(row);
    const protectedLine = (index) => device ? port(device, "bottom", Math.min(index, pole.lines - 1)) : from.line(Math.min(index, pole.lines - 1), slotX(x0, index));
    let lineOut = protectedLine;
    const switched = String(row.switchedBy ?? "").trim();
    if (switched && !load.cabinet) {
      const contact = element("protection", ex, device ? top + Y.contactGap : top, switched, { kind: "contact", poles: Array(pole.lines).fill("L"), rating: "", note: "" });
      for (let index = 0; index < pole.lines; index += 1) wire(protectedLine(index), port(contact, "top", index));
      lineOut = (index) => port(contact, "bottom", Math.min(index, pole.lines - 1));
    }
    const neutralOut = (x) => device && pole.neutral ? port(device, "bottom", pole.lines) : from.neutral(x);
    const sourceOf = (role, index) => {
      if (role === "PE") return tap(rails.PE, slotX(x0, index));
      if (role === "N") return neutralOut(slotX(x0, index));
      if (role === "Lp") return device ? port(device, "bottom", 0) : from.line(0, slotX(x0, index));
      return lineOut(index);
    };
    if (load.cabinet) {
      const a = slotX(x0, 0);
      let unit = null;
      const sideIn = (side, offset) => ({ id: unit.id, side, offset });
      if (load.kind === "socket") {
        const ports = PSU_PORTS.socket;
        unit = element("psu", a - ports.line, nested ? Y.socketGroup : Y.socketRail, loadTag, { kind: "socket", terminals, rating: "", description: row.description });
        wire(lineOut(0), sideIn("top", ports.line));
        wire(neutralOut(a), sideIn("bottom", ports.neutral), "neutral");
        wire(tap(rails.PE, a - ports.line + ports.earth), sideIn("bottom", ports.earth), "earth");
        unit.source = { ...source, row: row.id };
        return;
      }
      const ac = load.kind === "ac";
      const rating = row.loadData || (ac ? "230V/24V, 100VA" : "230V/24VDC");
      const level = nested ? Y.cabinetGroup : Y.cabinetRail;
      if (ac) {
        const ports = PSU_PORTS.ac;
        unit = element("psu", a - ports.line, level, loadTag, { kind: "ac", terminals, rating });
        wire(lineOut(0), sideIn("top", ports.line));
        wire(neutralOut(a), sideIn("bottom", ports.neutral), "neutral");
        wire(tap(rails.PE, a - ports.line + ports.earth), sideIn("bottom", ports.earth), "earth");
      } else {
        const ports = PSU_PORTS.dc;
        unit = element("psu", a + 3 * SLOT, level, loadTag, { kind: "dc", terminals, rating });
        wire(lineOut(0), sideIn("left", ports.inputs[0]));
        wire(neutralOut(a + SLOT), sideIn("left", ports.inputs[1]), "neutral");
        wire(tap(rails.PE, a + 2 * SLOT), sideIn("left", ports.inputs[2]), "earth");
      }
      const outputs = ac ? PSU_PORTS.ac.outputs : PSU_PORTS.dc.outputs;
      const [upper, lower] = ac ? ["SP", "SN"] : ["DC+", "DC-"];
      const kind = ac ? "sp" : "dc";
      const right = unit.x + unit.width;
      const lv = lvProtection(row);
      if (lv) {
        const breaker = element("protection", right + 3 * SLOT, unit.y - 70, lv.tag, { kind: "mcb", poles: ["L", "L"], rating: withPoles(lv.rating || "C6", "2p"), note: "" });
        const first = right + 4 * SLOT;
        const second = right + 5 * SLOT;
        needExtra(target, kind, { [upper]: first, [lower]: second + SLOT });
        wire(sideIn("right", outputs[0]), port(breaker, "bottom", 0));
        wire(sideIn("right", outputs[1]), port(breaker, "bottom", 1));
        wire(port(breaker, "top", 0), tap(rails[upper], first));
        wire(port(breaker, "top", 1), tap(rails[lower], second + SLOT));
      } else {
        needExtra(target, kind, { [upper]: right + SLOT, [lower]: right + 2 * SLOT });
        wire(sideIn("right", outputs[0]), tap(rails[upper], right + SLOT));
        wire(sideIn("right", outputs[1]), tap(rails[lower], right + 2 * SLOT));
      }
      unit.source = { ...source, row: row.id };
      return;
    }
    const stripName = row.strip || supply.strip || "-X1";
    const numbers = roles.map((label) => {
      if (label === "PE" || label === "N") return label;
      terminalCount.set(stripName, (terminalCount.get(stripName) ?? 0) + 1);
      return String(terminalCount.get(stripName));
    });
    const strip = element("terminalStrip", ex, Y.strip, stripName, { terminals: numbers });
    const conductors = terminals.map((_, index) => String(index + 1));
    const cableType = row.cable || `NYM-J ${terminals.length}x1,5mm2`;
    const cable = element("cable", ex, Y.cable, loadTag ? `-W.${loadTag.replace(/^-/, "")}` : `-W.${row.tag.replace(/^-/, "")}`, { conductors, cableType });
    const device2 = element("fieldDevice", ex, Y.load, loadTag, { terminals, model: row.loadData, description: "", symbol: load.symbol });
    device2.source = { ...source, row: row.id };
    note(row.description, device2);
    roles.forEach((role, index) => {
      const medium = conductorMedium(role);
      wire(sourceOf(role, index), port(strip, "top", index), medium);
      wire(port(strip, "bottom", index), port(cable, "top", index), medium);
      wire(port(cable, "bottom", index), port(device2, "top", index), medium);
    });
  };

  for (const unit of units) {
    if (!unit.children.length) {
      const x0 = place(leafWidth(unit.row)) + leafOffset(unit.row);
      drawLeaf(unit.row, x0, railSource(unit.row, page.rails), page, Y.group);
      continue;
    }
    const widths = unit.children.map(leafWidth);
    const group = unit.row;
    const pole = poleOf(group.poles);
    const own = snapUp(LEAD + devicePoles(group).length * SLOT);
    const x0 = place(own + widths[0]);
    page.cursor -= widths[0];
    const groupPhase = pole.lines === 1 ? balance(group) : null;
    const ex = x0 + LEAD - SLOT;
    const device = element("protection", ex, Y.group, group.tag, { kind: group.protection, poles: devicePoles(group), rating: label(group), note: oneLine(group.description), labels: "right" });
    for (let index = 0; index < pole.lines; index += 1) wire(tap(page.rails[groupPhase ?? lines[index] ?? lines[0]], slotX(x0, index)), port(device, "top", index));
    if (pole.neutral) neutralIn(page.rails, device, pole.lines, slotX(x0, 0) - SLOT);
    const busCount = pole.lines + (pole.neutral ? 1 : 0);
    const busPhase = (index) => index < pole.lines ? (groupPhase ?? lines[index]) : "N";
    const segment = (start) => ({ page, start, taps: Array.from({ length: busCount }, () => []), plans: [] });
    const segments = [segment(true)];
    segments[0].taps.forEach((list, index) => list.push(slotX(x0, index)));
    unit.children.forEach((child, position) => {
      const before = page;
      const cursor = place(widths[position]);
      if (page !== before) segments.push(segment(false));
      const current = segments[segments.length - 1];
      const childPole = poleOf(child.poles);
      const childPhase = childPole.lines === 1 && pole.lines === 3 ? (lines.includes(child.phase) ? child.phase : lines[phaseTurn++ % lines.length]) : null;
      const busLine = (index) => pole.lines === 1 ? 0 : childPhase ? lines.indexOf(childPhase) : Math.min(index, pole.lines - 1);
      const at = cursor + leafOffset(child);
      for (let index = 0; index < childPole.lines; index += 1) current.taps[busLine(index)].push(slotX(at, index));
      const childRoles = loadRoles(child);
      if (child.protection === "none") childRoles.forEach((role, index) => { if (role === "Lp") current.taps[busLine(0)].push(slotX(at, index)); });
      const needsNeutral = childPole.neutral || childRoles.includes("N");
      const neutralSlot = childPole.neutral ? childPole.lines : childRoles.indexOf("N");
      if (pole.neutral && needsNeutral) current.taps[pole.lines].push(loadOf(child.load).cabinet ? slotX(at, 0) + (loadOf(child.load).kind === "dc" ? SLOT : 0) : slotX(at, neutralSlot));
      current.plans.push({ child, x0: at, busLine });
    });
    segments.forEach((part, number) => {
      const continued = number < segments.length - 1;
      const left = part.page.from;
      const buses = part.taps.map((xs, index) => {
        if (!xs.length) return null;
        const y = Y.bus + (busCount - 1 - index) * Y.busStep;
        const start = part.start ? Math.min(...xs) : left;
        const end = continued ? part.page.to : Math.max(...xs);
        if (end - start < 1) return null;
        const isNeutral = busPhase(index) === "N";
        const medium = isNeutral ? "neutral" : part.start ? "wire" : RAIL_MEDIA[busPhase(index)];
        const bus = pipe({ x: start, y }, { x: end, y }, medium);
        bus.railEnds = part.start ? [] : [0];
        if (!part.start) anchor(bus, "from");
        if (continued) anchor(bus, "to");
        if (part.start) wire(port(device, "bottom", index), tap(bus, slotX(x0, index)), isNeutral ? "neutral" : "wire");
        return bus;
      });
      const fromBus = (index, x) => buses[index] ? tap(buses[index], x) : port(device, "bottom", index);
      for (const plan of part.plans) {
        drawLeaf(plan.child, plan.x0, {
          line: (index, x) => fromBus(plan.busLine(index), x),
          neutral: (x) => pole.neutral ? fromBus(pole.lines, x) : tap(part.page.rails.N, x),
          rails: pole.neutral ? null : part.page.rails
        }, part.page, Y.device);
      }
    });
  }
  for (const entry of pages) {
    const offset = Math.floor((entry.from + entry.to - firstColumn(entry.index) - entry.cursor) / 2 / GRID) * GRID;
    if (offset <= 0) continue;
    const here = (x) => pageIndex(x, paper) === entry.index;
    for (const shape of shapes) {
      if (shape.kind === "equipment" || shape.kind === "text") {
        if (here(shape.x + 1)) shape.x += offset;
        continue;
      }
      const fixed = anchored.get(shape.id);
      for (const end of ["from", "to"]) {
        const point = shape[end];
        if (point && point.id === undefined && Number.isFinite(point.x) && !fixed?.has(end) && here(point.x)) shape[end] = { ...point, x: point.x + offset };
      }
      shape.points = (shape.points ?? []).map((point) => here(point.x) ? { ...point, x: point.x + offset } : point);
    }
  }
  return { shapes, pages: pages.length };
}
