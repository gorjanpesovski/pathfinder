import { SLOT, electricSize, changeoverNumbers } from "./symbols.js";
import { paperOf, pageLeft, pageIndex, location, noteText, noteWidth } from "./sheet.js";
import { normalizeGroups } from "./rowGroups.js";

const range = (prefix, from, to) => Array.from({ length: to - from + 1 }, (_, index) => `${prefix}${from + index}`);

const LARGE_BASE = [
  { id: "J1", terminals: ["G", "G0"] },
  { id: "J24", terminals: ["+Vterm", "GND", "+5VREF"] },
  { id: "J2", terminals: ["U1", "U2", "U3", "GND", "+VDC"] },
  { id: "J3", terminals: ["U4", "GND", "U5", "GND"] },
  { id: "J4", terminals: ["VG", "VG0", "Y1", "Y2", "Y3", "Y4"] },
  { id: "J5", terminals: [...range("ID", 1, 8), "IDC1"] },
  { id: "J6", terminals: ["U6", "U7", "U8", "GND"] },
  { id: "J7", terminals: [...range("ID", 9, 12), "IDC9"] },
  { id: "J8", terminals: ["ID13H", "ID13", "IDC13", "ID14", "ID14H"] },
  { id: "J12", terminals: ["C1", "NO1", "NO2", "NO3", "C1"] },
  { id: "J13", terminals: ["C4", "NO4", "NO5", "NO6", "C4"] },
  { id: "J14", terminals: ["C7", "NO7", "C7"] },
  { id: "J15", terminals: ["NO8", "C8", "NC8"] },
  { id: "J16", terminals: ["C9", "NO9", "NO10", "NO11", "C9"] },
  { id: "J17", terminals: ["NO12", "C12", "NC12"] },
  { id: "J18", terminals: ["NO13", "C13", "NC13"] }
];

const MINI_BASE = [
  { id: "J1", terminals: ["G", "G0", "Vbat"] },
  { id: "J2", terminals: ["U1", "U2", "U3", "GND", "U4", "U5", "U6", "GND", "U7", "U8", "U9", "U10", "GND"] },
  { id: "J9", terminals: ["ID1", "ID2", "GND", "Y1", "Y2", "GND", "+5VREF", "GND", "+VDC"] },
  { id: "J10", terminals: ["NO1", "C1/2", "NO2"] },
  { id: "J11", terminals: ["NO3", "C3/4/5", "NO4", "C3/4/5", "NO5"] },
  { id: "J12", terminals: ["NO6", "NC6", "C6"] }
];

export const CONTROLLER_MODELS = [
  { id: "mini", label: "c.pCO mini", inputCommon: "GND", connectors: MINI_BASE },
  { id: "large", label: "c.pCO Large", part: "P+500SEA00EL0", inputCommon: "SP", connectors: [
    ...LARGE_BASE,
    { id: "J19", terminals: ["ID15H", "ID15", "IDC15", "ID16", "ID16H"] },
    { id: "J20", terminals: ["Y5", "Y6", "U9", "GND", "U10", "GND", "ID17", "ID18", "IDC17"] },
    { id: "J21", terminals: ["NO14", "C14", "NC14", "NO15", "C15", "NC15"] },
    { id: "J22", terminals: ["C16", "NO16", "NO17", "NO18", "C16"] }
  ] },
  { id: "xlarge", label: "c.pCO Extralarge", inputCommon: "SP", connectors: [
    ...LARGE_BASE,
    { id: "J19", terminals: ["C21", ...range("NO", 21, 24), "C21"] },
    { id: "J20", terminals: ["C25", ...range("NO", 25, 29), "C25"] },
    { id: "J21", terminals: ["C14", ...range("NO", 14, 16), "C14"] },
    { id: "J22", terminals: ["C17", ...range("NO", 17, 20), "C17"] }
  ] },
  { id: "pcoe", label: "c.pCOe extension", inputCommon: "GND", connectors: MINI_BASE },
  { id: "mgate3180", label: "MOXA MGate MB3180", gateway: true, inputCommon: "GND", connectors: [] },
  { id: "mgate3280", label: "MOXA MGate MB3280", gateway: true, inputCommon: "GND", connectors: [] },
  { id: "mgate3480", label: "MOXA MGate MB3480", gateway: true, inputCommon: "GND", connectors: [] },
  { id: "eds205", label: "MOXA EDS-205", gateway: true, switch: true, inputCommon: "GND", connectors: [] },
  { id: "eds208", label: "MOXA EDS-208", gateway: true, switch: true, inputCommon: "GND", connectors: [] },
  { id: "eds208a", label: "MOXA EDS-208A", gateway: true, switch: true, inputCommon: "GND", connectors: [] }
];

export const CONTROL_TYPES = [
  { id: "ntc", label: "Temperature sensor NTC", prefix: "-B", mark: "NTC", signals: [{ key: "in", label: "Input", kind: "U" }], cable: "J-H(St)H 2x2x0,8mm2" },
  { id: "pt1000", label: "Temperature sensor Pt1000", prefix: "-B", mark: "Pt1000", signals: [{ key: "in", label: "Input", kind: "U" }], cable: "J-H(St)H 2x2x0,8mm2" },
  { id: "pressure", label: "Pressure sensor 0-10 V, 24 V", prefix: "-BP", mark: "0-10V", signals: [{ key: "in", label: "0-10 V", kind: "U" }], cable: "J-H(St)H 2x2x0,8mm2" },
  { id: "diverter", label: "Diverter valve 0-10 V, 24 V (L24, M, Yv)", prefix: "-MV", signals: [{ key: "out", label: "0-10 V", kind: "Y" }], cable: "J-H(St)H 2x2x0,8mm2" },
  { id: "valve", label: "Valve / actuator 0-10 V, 24 V", prefix: "-MV", signals: [{ key: "out", label: "0-10 V", kind: "Y" }], cable: "J-H(St)H 2x2x0,8mm2" },
  { id: "actuator", label: "Open/close actuator 24 V via relay", prefix: "-Y", signals: [{ key: "relay", label: "Relay", kind: "relay" }], cable: "J-H(St)H 2x2x0,8mm2" },
  { id: "relay", label: "Relay 24 V, 4 changeover contacts", prefix: "-K", contacts: 4, signals: [{ key: "coil", label: "Output", kind: "NO" }] },
  { id: "contactor", label: "Contactor 24 V, 1 NO", prefix: "-KI", contacts: 1, signals: [{ key: "coil", label: "Output", kind: "NO" }] },
  { id: "pumpSsm", label: "Pump: enable (DI) + fault (SSM)", prefix: "-M", signals: [{ key: "fault", label: "Fault", kind: "ID" }, { key: "enable", label: "Enable", kind: "relay" }], cable: "J-H(St)H 3x2x0,8mm2" },
  { id: "heatPump", label: "Heat pump: alarm, on/off, heat/cool", prefix: "-TČ", signals: [{ key: "alarm", label: "Alarm", kind: "ID" }, { key: "onoff", label: "On/off", kind: "relay" }, { key: "mode", label: "Heat/cool", kind: "relay" }], cable: "J-H(St)H 4x2x0,8mm2" },
  { id: "heatPumpStv", label: "Heat pump: alarm, on/off, heat/cool, STV", prefix: "-TČ", signals: [{ key: "alarm", label: "Alarm", kind: "ID" }, { key: "onoff", label: "On/off", kind: "relay" }, { key: "mode", label: "Heat/cool", kind: "relay" }, { key: "stv", label: "STV", kind: "relay" }], cable: "J-H(St)H 6x2x0,8mm2" },
  { id: "safetyThermostat", label: "Safety thermostat (1 SP, 2 DI, 3 spare, PE)", prefix: "-ST", contact: "NC", signals: [{ key: "in", label: "Input", kind: "ID" }], cable: "J-H(St)H 2x2x0,8mm2" },
  { id: "contact", label: "Contact input (thermostat, flow switch …)", prefix: "-S", signals: [{ key: "in", label: "Input", kind: "ID" }], cable: "J-H(St)H 2x2x0,8mm2" },
  { id: "aux", label: "Breaker auxiliary contact (tag = breaker)", prefix: "", signals: [{ key: "in", label: "Input", kind: "ID" }], contact: "NC" }
];

export const SIGNAL_KINDS = {
  U: /^U\d+$/,
  ID: /^ID\d+$/,
  NO: /^NO\d+$/,
  Y: /^Y\d+$/
};

const ETHERNET = { id: "ETH", label: "ETH", kind: "eth", terminals: ["ETH"] };
const serial = (id, name, label = `${id} ${name}`) => ({ id, label, kind: "serial", terminals: ["-", "+", "GND"] });
const LARGE_PORTS = [ETHERNET, serial("J11", "pLAN"), serial("J23", "FBus2"), serial("J25", "BMS2"), serial("J26", "FBus2"), serial("BMS", "card", "BMS card"), serial("FBUS", "card", "FBus card")];

const gatewayPorts = (count) => [...Array.from({ length: count }, (_, index) => ({ id: `P${index + 1}`, label: `Port ${index + 1}`, kind: "serial", terminals: ["-", "+"] })), ETHERNET];

const switchPorts = (count) => Array.from({ length: count }, (_, index) => ({ id: `P${index + 1}`, label: `Port ${index + 1}`, kind: "eth", terminals: [String(index + 1)] }));

export const COMM_PORTS = {
  mini: [ETHERNET, serial("J4", "FBus"), serial("J3", "BMS")],
  large: LARGE_PORTS,
  xlarge: LARGE_PORTS,
  pcoe: [serial("J6", "BMS")],
  mgate3180: gatewayPorts(1),
  mgate3280: gatewayPorts(2),
  mgate3480: gatewayPorts(4),
  eds205: switchPorts(5),
  eds208: switchPorts(8),
  eds208a: switchPorts(8)
};

export const PROTOCOLS = ["Modbus TCP/IP", "Modbus RTU", "BACnet/IP", "BACnet MS/TP", "FBus", "pLAN"];

export const LINK_TARGETS = [
  { id: "external", label: "Outside the panel (CNS, BMS …)" },
  { id: "controller", label: "Another controller" },
  { id: "display", label: "pGDx touch display" }
];

export function isGateway(model){
  return Boolean(modelOf(model).gateway);
}

export function isSwitch(model){
  return Boolean(modelOf(model).switch);
}

export function commPorts(model){
  return COMM_PORTS[modelOf(model).id] ?? [];
}

export function portOf(model, id){
  return commPorts(model).find((entry) => entry.id === id) ?? null;
}

export function linkDefaults(model, port){
  return portOf(model, port)?.kind === "eth" ? { protocol: "Modbus TCP/IP", cable: "UTP" } : { protocol: "Modbus RTU", cable: "J-H(St)H 2x2x0,8mm2" };
}

export function newLink(control, values = {}){
  const controller = values.controller ?? control.controllers[0]?.id ?? "";
  const model = control.controllers.find((entry) => entry.id === controller)?.model ?? "large";
  const busy = new Set((control.links ?? []).filter((link) => link.controller === controller).map((link) => link.port));
  const port = values.port ?? (commPorts(model).find((entry) => !busy.has(entry.id)) ?? commPorts(model)[0])?.id ?? "";
  const link = {
    id: uid(),
    tag: nextTag(control.links ?? [], "-W.K"),
    description: "",
    controller,
    port,
    target: "external",
    text: "POVEZAVA NA CNS",
    targetController: "",
    targetPort: "",
    display: "-TD1",
    strip: "",
    group: "",
    ...linkDefaults(model, port)
  };
  for (const [key, value] of Object.entries(values)) if (value !== undefined) link[key] = value;
  return link;
}

export function modelOf(id){
  return CONTROLLER_MODELS.find((entry) => entry.id === id) ?? CONTROLLER_MODELS[1];
}

export const CUSTOM_CONNECTIONS = [
  { id: "sp", label: "SP · 24 V supply" },
  { id: "sn", label: "SN · 24 V return" },
  { id: "pe", label: "PE" },
  { id: "U", label: "Analog input U" },
  { id: "gnd", label: "GND of the analog input" },
  { id: "ID", label: "Digital input ID" },
  { id: "common", label: "Digital input common (SP or GND)" },
  { id: "Y", label: "Analog output Y" },
  { id: "contactA", label: "Contact · common side" },
  { id: "contactB", label: "Contact · switched side" },
  { id: "none", label: "Not connected" }
];

export const CUSTOM_SYMBOLS = [
  { id: "", label: "None" },
  { id: "sensor", label: "Sensor" },
  { id: "motor", label: "Motor / pump" },
  { id: "heater", label: "Heater" },
  { id: "light", label: "Light" },
  { id: "socket", label: "Socket" }
];

const CONNECTION_IDS = new Set(CUSTOM_CONNECTIONS.map((entry) => entry.id));

export function newTemplate(values = {}){
  return {
    id: uid(),
    name: "Custom device",
    prefix: "-E",
    cable: "J-H(St)H 2x2x0,8mm2",
    symbol: "",
    terminals: [{ label: "1", connect: "sp" }, { label: "2", connect: "sn" }],
    ...values
  };
}

export function normalizeTemplates(list){
  if (!Array.isArray(list)) return [];
  return list.filter((entry) => entry && typeof entry === "object").map((entry) => newTemplate({
    id: entry.id || uid(),
    name: typeof entry.name === "string" ? entry.name : "Custom device",
    prefix: typeof entry.prefix === "string" ? entry.prefix : "",
    cable: typeof entry.cable === "string" ? entry.cable : "",
    symbol: CUSTOM_SYMBOLS.some((symbol) => symbol.id === entry.symbol) ? entry.symbol : "",
    libraryId: typeof entry.libraryId === "string" ? entry.libraryId : "",
    terminals: Array.isArray(entry.terminals) ? entry.terminals.filter((terminal) => terminal && typeof terminal === "object").map((terminal) => ({
      label: String(terminal.label ?? ""),
      connect: CONNECTION_IDS.has(terminal.connect) ? terminal.connect : "none"
    })) : []
  }));
}

export function contactPairs(template){
  const a = [];
  const b = [];
  (template.terminals ?? []).forEach((terminal, index) => {
    if (terminal.connect === "contactA") a.push(index);
    if (terminal.connect === "contactB") b.push(index);
  });
  return a.slice(0, Math.min(a.length, b.length)).map((index, position) => [index, b[position]]);
}

function templateType(template){
  const signals = [];
  (template.terminals ?? []).forEach((terminal, index) => {
    if (terminal.connect === "U" || terminal.connect === "ID" || terminal.connect === "Y") {
      signals.push({ key: `t${index}`, label: terminal.label || String(index + 1), kind: terminal.connect });
    }
  });
  contactPairs(template).forEach(([a, b], position) => {
    signals.push({ key: `k${position}`, label: `${template.terminals[a].label || "A"}–${template.terminals[b].label || "B"}`, kind: "relay" });
  });
  return { id: `custom:${template.id}`, label: template.name || "Custom device", prefix: template.prefix ?? "", signals, cable: template.cable, custom: template };
}

export function customTypes(control){
  return (control?.templates ?? []).map(templateType);
}

export function controlTypeOf(id, control = null){
  const builtin = CONTROL_TYPES.find((entry) => entry.id === id);
  if (builtin) return builtin;
  if (String(id ?? "").startsWith("custom:")) {
    const template = control?.templates?.find((entry) => `custom:${entry.id}` === id);
    if (template) return templateType(template);
  }
  return CONTROL_TYPES[0];
}

export function modelTerminals(model, kind){
  const pattern = SIGNAL_KINDS[kind];
  const list = [];
  for (const connector of modelOf(model).connectors) {
    for (const name of connector.terminals) if (pattern?.test(name) && !list.includes(name)) list.push(name);
  }
  return list;
}

function connectorOf(model, terminal){
  return modelOf(model).connectors.find((connector) => connector.terminals.includes(terminal)) ?? null;
}

function groundGroup(model, terminal){
  const connector = connectorOf(model, terminal);
  if (!connector) return null;
  const start = connector.terminals.indexOf(terminal);
  const offset = connector.terminals.slice(start).indexOf("GND");
  return offset < 0 ? null : `${connector.id}:${start + offset}`;
}

function supplyTerminals(model){
  const result = [];
  const seen = new Set();
  const add = (name, rail) => {
    if (seen.has(name)) return;
    seen.add(name);
    result.push([name, rail]);
  };
  for (const connector of modelOf(model).connectors) {
    for (const name of connector.terminals) {
      if (name === "G" || name === "VG") add(name, "SP");
      else if (name === "G0" || name === "VG0" || /^IDC\d+$/.test(name)) add(name, "SN");
      else if (/^C[\d/]+$/.test(name)) add(name, "SP");
    }
  }
  return result;
}

function uid(){
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function nextTag(list, prefix){
  if (!prefix) return "";
  let top = 0;
  for (const entry of list) {
    const match = String(entry.tag ?? "").match(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\d+)$`));
    if (match) top = Math.max(top, Number(match[1]));
  }
  return `${prefix}${top + 1}`;
}

export function emptyControl(){
  return { strip: "-X2", controllers: [{ id: uid(), tag: "-N1", model: "large", description: "" }], rows: [], groups: [], templates: [], links: [], linkGroups: [] };
}

export function newController(list, values = {}){
  return { id: uid(), tag: nextTag(list, "-N"), model: "large", description: "", ...values };
}

export function newControlRow(control, values = {}){
  const type = controlTypeOf(values.type ?? "ntc", control);
  return {
    id: uid(),
    tag: nextTag(control.rows, type.prefix),
    description: "",
    type: type.id,
    controller: control.controllers[0]?.id ?? "",
    signals: {},
    contact: type.contact ?? "NO",
    strip: "",
    cable: "",
    model: "",
    group: "",
    ...values
  };
}

export function normalizeControl(data){
  const base = emptyControl();
  if (!data || typeof data !== "object") return base;
  const controllers = Array.isArray(data.controllers) && data.controllers.length
    ? data.controllers.filter((entry) => entry && typeof entry === "object").map((entry) => ({ id: entry.id || uid(), tag: entry.tag ?? "", model: modelOf(entry.model).id, description: entry.description ?? "" }))
    : base.controllers;
  const control = { strip: typeof data.strip === "string" ? data.strip : base.strip, controllers, rows: [], groups: [], templates: normalizeTemplates(data.templates), links: [] };
  const rows = Array.isArray(data.rows) ? data.rows.filter((row) => row && typeof row === "object") : [];
  for (const link of Array.isArray(data.links) ? data.links : []) {
    if (link && typeof link === "object") control.links.push(newLink(control, { ...link, id: link.id || uid() }));
  }
  for (const row of rows.filter((entry) => entry.type === "ethernet")) {
    control.links.push(newLink(control, { controller: row.controller, port: "ETH", tag: row.tag ? `-W.${String(row.tag).replace(/^-/, "")}` : undefined, text: row.description || "POVEZAVA NA CNS", cable: row.cable || "UTP", protocol: "Modbus TCP/IP" }));
  }
  control.rows = rows.filter((row) => row.type !== "ethernet").map((row) => newControlRow(control, { ...row, signals: { ...(row.signals ?? {}) }, id: row.id || uid() }));
  control.groups = normalizeGroups(data.groups, control.rows);
  control.linkGroups = normalizeGroups(data.linkGroups, control.links);
  return control;
}

export function isOutputTerminal(value){
  return SIGNAL_KINDS.NO.test(String(value ?? ""));
}

export function sharesOutput(type){
  return type === "valve" || type === "diverter";
}

export function isRelayType(type){
  return Boolean(controlTypeOf(type).contacts);
}

export function terminalUse(control){
  const use = new Map();
  for (const row of control.rows) {
    const type = controlTypeOf(row.type, control);
    for (const signal of type.signals) {
      const value = row.signals?.[signal.key];
      if (!value || (signal.kind === "relay" && !isOutputTerminal(value))) continue;
      const key = `${row.controller}:${value}`;
      if (!use.has(key)) use.set(key, []);
      use.get(key).push({ row, signal });
    }
  }
  return use;
}

export function contactUse(control, power = null){
  const use = new Map();
  const add = (relay, entry) => {
    if (!use.has(relay.id)) use.set(relay.id, []);
    use.get(relay.id).push(entry);
  };
  const relays = control.rows.filter((row) => isRelayType(row.type));
  for (const row of control.rows) {
    for (const signal of controlTypeOf(row.type, control).signals) {
      if (signal.kind !== "relay") continue;
      const relay = relays.find((entry) => entry.id === row.signals?.[signal.key]);
      if (relay) add(relay, { row, signal });
    }
  }
  for (const row of power?.rows ?? []) {
    const tag = String(row.switchedBy ?? "").trim();
    const relay = tag ? relays.find((entry) => entry.tag === tag) : null;
    if (relay) add(relay, { power: row });
  }
  return use;
}

const Y = { outBus: 282, pe: 496, rail: 80, controller: 110, spBus: 220, gndBus: 244, gndStep: 12, contact: 296, contactLow: 368, coil: 330, coilBus: 310, neutral: 480, strip: 518, cable: 562, load: 608 };
const GRID = 20;
const LEAD = 60;
const TAIL = 20;
const WIRE_WIDTH = 1.5;

function snapUp(value){
  return Math.ceil(value / GRID) * GRID;
}

function layoutOf(type, control = null){
  if (String(type ?? "").startsWith("custom:")) {
    const template = controlTypeOf(type, control).custom;
    const terminals = template?.terminals ?? [];
    return { device: terminals.map((terminal, index) => terminal.label || String(index + 1)), spare: terminals.map((terminal, index) => terminal.connect === "none" ? index : -1).filter((index) => index >= 0), slots: Math.max(1, terminals.length) };
  }
  if (type === "ntc") return { device: ["NTC", "NTC"], slots: 2 };
  if (type === "pt1000") return { device: ["ST+", "ST-"], slots: 2 };
  if (type === "pressure") return { device: ["1", "2", "3", "PE"], slots: 4 };
  if (type === "valve" || type === "actuator") return { device: ["1", "2", "3"], slots: 3 };
  if (type === "diverter") return { device: ["L24", "M", "Yv"], slots: 3 };
  if (type === "pumpSsm") return { device: ["DI1", "+24V", "COM", "FAULT", "OK"], spare: [4], slots: 5 };
  if (type === "heatPump") return { device: ["ALARM", "ALARM", "", "ON/OFF", "ON/OFF", "", "HL/GR", "HL/GR"], slots: 8 };
  if (type === "heatPumpStv") return { device: ["ALARM", "ALARM", "", "ON/OFF", "ON/OFF", "", "HL/GR", "HL/GR", "", "STV", "STV"], slots: 11 };
  if (type === "contact") return { device: ["1", "2"], slots: 2 };
  if (type === "safetyThermostat") return { device: ["1", "2", "3", "PE"], spare: [2], slots: 4 };
  if (type === "relay" || type === "contactor") return { device: [], slots: 1, width: 160 };
  return { device: [], slots: 2 };
}

function columnWidth(row, control){
  const layout = layoutOf(row.type, control);
  if (layout.width) return layout.width;
  const box = Math.max(120, (layout.device.length + 1) * SLOT);
  return snapUp(Math.max(LEAD + (layout.slots + 1) * SLOT + TAIL, LEAD - SLOT + box + 20, LEAD + layout.slots * SLOT + 54));
}

const MAX_EXTRA = 120;

export function drawControl(control, power, nextId, paper = paperOf(), firstPage = 0){
  const shapes = [];
  const ac = !(power?.rows ?? []).some((row) => row.load === "psu") || (power?.rows ?? []).some((row) => row.load === "transformer");
  const media = ac ? { plus: "sp", minus: "sn" } : { plus: "dcPlus", minus: "dcMinus" };
  const relays = control.rows.filter((row) => isRelayType(row.type));
  const relayById = new Map(relays.map((row) => [row.id, row]));
  const used = new Map();
  const takeContact = (relay) => {
    const next = (used.get(relay.id) ?? 0) + 1;
    used.set(relay.id, next);
    return next;
  };
  const terminalCount = new Map();
  const nextTerminal = (name) => {
    terminalCount.set(name, (terminalCount.get(name) ?? 0) + 1);
    return String(terminalCount.get(name));
  };
  const anchored = new Map();
  const anchor = (shape, ...ends) => anchored.set(shape.id, new Set([...(anchored.get(shape.id) ?? []), ...ends]));

  const element = (type, x, y, name, params, sheet = "KRMILJE") => {
    const shape = { id: nextId(), kind: "equipment", type, x, y, ...electricSize(type, params), name, params, source: { power: true, control: true, sheet } };
    shapes.push(shape);
    return shape;
  };
  const pipe = (from, to, medium, points = []) => {
    const shape = { id: nextId(), kind: "pipe", from, to, points, medium, width: WIRE_WIDTH, source: { power: true, control: true } };
    shapes.push(shape);
    return shape;
  };
  const wire = (from, to, points = []) => pipe(from, to, "wire", points);
  const port = (shape, side, slot) => ({ id: shape.id, side, offset: (slot + 1) * SLOT });
  const tap = (rail, x) => ({ pipe: rail.id, x, y: rail.from.y });

  const pages = [];
  let page = null;
  const openPage = (ctrl, sheet, rails = media) => {
    const index = firstPage + pages.length;
    const left = pageLeft(index, paper);
    const from = left + paper.frame.left + 20;
    const to = left + paper.frame.right - 20;
    const plus = pipe({ x: from, y: Y.rail }, { x: to, y: Y.rail }, rails.plus);
    const minus = pipe({ x: from, y: Y.neutral }, { x: to, y: Y.neutral }, rails.minus);
    const start = snapUp(from + 20);
    [plus, minus].forEach((rail) => anchor(rail, "from", "to"));
    const model = modelOf(ctrl.model);
    const box = element("controller", start + 20, Y.controller, ctrl.tag || "-N1", { model: [model.gateway ? model.label : `Controller ${model.label}`, model.part ? `(${model.part})` : ""].filter(Boolean).join(" "), terminals: [], marks: [] }, sheet);
    const created = { index, from, to, start, plus, minus, rails, bus: null, busEnd: start, ctrl, model, box, terms: new Map(), grounds: new Map(), coils: new Map(), cursor: start, limit: to - 10, sheet };
    pages.push(created);
    page = created;
    return created;
  };
  const term = (target, name, x, mark = "") => {
    if (!target.terms.has(x)) target.terms.set(x, { name, mark });
    return { id: target.box.id, side: "bottom", offset: x - target.box.x };
  };
  const busAt = (target, x) => {
    if (!target.bus) {
      target.bus = pipe({ x: target.start, y: Y.spBus }, { x: target.start, y: Y.spBus }, target.rails.plus);
      target.bus.railEnds = [];
      anchor(target.bus, "from");
      anchor(wire(tap(target.plus, target.start), tap(target.bus, target.start)), "from", "to");
    }
    target.busEnd = Math.max(target.busEnd, x);
    return tap(target.bus, x);
  };
  const closePage = (target) => {
    if (target.bus) target.bus.to = { ...target.bus.to, x: target.busEnd };
    const columns = Math.max(1, Math.round(((target.boxEnd ?? target.cursor) - target.box.x) / SLOT) - 1);
    const terminals = Array(columns).fill("");
    const marks = Array(columns).fill("");
    for (const [x, entry] of target.terms) {
      const slot = Math.round((x - target.box.x) / SLOT) - 1;
      if (slot >= 0 && slot < columns) {
        terminals[slot] = entry.name;
        marks[slot] = entry.mark;
      }
    }
    Object.assign(target.box.params, { terminals, marks });
    Object.assign(target.box, electricSize("controller", target.box.params));
    let lane = 0;
    for (const [, group] of target.grounds) {
      const first = group.members[0];
      const gnd = term(target, "GND", first.x);
      if (group.members.length === 1) wire(gnd, first.target);
      else {
        const y = Y.gndBus + lane * Y.gndStep;
        lane += 1;
        const xs = group.members.map((member) => member.x);
        const bus = pipe({ x: Math.min(...xs), y }, { x: Math.max(...xs), y }, "wire");
        bus.railEnds = [];
        wire(gnd, tap(bus, first.x));
        for (const member of group.members) wire(tap(bus, member.x), member.target);
      }
    }
    for (const [name, coils] of target.coils) {
      const first = coils[0];
      const output = term(target, name, first.x);
      if (coils.length === 1) wire(output, first.target);
      else {
        const xs = coils.map((entry) => entry.x);
        const bus = pipe({ x: Math.min(...xs), y: first.y }, { x: Math.max(...xs), y: first.y }, "wire");
        bus.railEnds = [];
        wire(output, tap(bus, first.x));
        for (const entry of coils) wire(tap(bus, entry.x), entry.target);
      }
    }
    const gndTerminals = [...target.grounds.values()].map((group) => group.members[0].x);
    const coilTerminals = [...target.coils.values()].map((coils) => coils[0].x);
    for (const x of [...gndTerminals, ...coilTerminals]) {
      const slot = Math.round((x - target.box.x) / SLOT) - 1;
      const entry = target.terms.get(x);
      if (entry && slot >= 0 && slot < columns) target.box.params.terminals[slot] = entry.name;
    }
  };
  const place = (width) => {
    if (page.cursor + width > page.limit && page.cursor > page.box.x) {
      const ctrl = page.ctrl;
      closePage(page);
      openPage(ctrl, page.sheet);
    }
    const x = page.cursor;
    page.cursor += width;
    return x;
  };
  const ground = (target, group, x, endpoint) => {
    if (!target.grounds.has(group)) target.grounds.set(group, { members: [] });
    target.grounds.get(group).members.push({ x, target: endpoint });
  };
  const inputCommon = (target, row, terminal, x, endpoint) => {
    if (target.model.inputCommon === "SP") wire(busAt(target, x), endpoint);
    else ground(target, groundGroup(target.ctrl.model, terminal) ?? "ID", x, endpoint);
  };

  const fieldColumn = (row, x0, wiring, direct = false) => {
    const layout = layoutOf(row.type, control);
    const type = controlTypeOf(row.type, control);
    const ex = x0 + LEAD - SLOT;
    const stripName = row.strip || control.strip || "-X2";
    const wired = (label, index) => Boolean(label) && !layout.spare?.includes(index);
    const numbers = direct ? [] : layout.device.map((label, index) => !wired(label, index) ? "" : label === "PE" ? "PE" : nextTerminal(stripName));
    const strip = direct ? null : element("terminalStrip", ex, Y.strip, stripName, { terminals: numbers });
    let conductor = 0;
    const conductors = layout.device.map((label, index) => wired(label, index) ? String(++conductor) : "");
    const tag = row.tag || "";
    const cable = element("cable", ex, Y.cable, `-W.${tag.replace(/^-/, "") || "X"}`, { conductors, cableType: row.cable || type.cable || "" });
    const symbol = row.type === "ntc" || row.type === "pt1000" || row.type === "pressure" ? "sensor" : row.type === "pumpSsm" ? "motor" : type.custom?.symbol ?? "";
    const device = element("fieldDevice", ex, Y.load, tag, { terminals: layout.device, model: row.model, description: "", symbol });
    device.source = { ...device.source, controlRow: row.id };
    const caption = noteText(row.description, device.x, device.y + device.height + 8, Math.max(device.width, x0 + widthOf(row) - device.x - 12), nextId(), device.source);
    if (caption) shapes.push(caption);
    layout.device.forEach((label, index) => {
      if (!wired(label, index)) return;
      const medium = label === "PE" ? "earth" : "wire";
      if (strip) pipe(port(strip, "bottom", index), port(cable, "top", index), medium);
      pipe(port(cable, "bottom", index), port(device, "top", index), medium);
    });
    wiring({ strip, slot: (index) => x0 + LEAD + index * SLOT, top: (index) => port(strip ?? cable, "top", index), ex });
  };

  const switchPair = (relay, x0, aSlot, bSlot, top, y, variant = "B") => {
    if (!relay) return;
    const k = takeContact(relay);
    const slot = (index) => x0 + LEAD + index * SLOT;
    const left = variant === "BL" ? slot(aSlot) - SLOT : slot(aSlot) - 2 * SLOT;
    const contact = element("changeover", left, y, relay.tag, { variant, index: k, ref: "" });
    const common = variant === "BL" ? 0 : 1;
    wire(top(aSlot), { id: contact.id, side: "bottom", offset: (common + 1) * SLOT });
    const noOffset = variant === "BL" ? SLOT : 2 * SLOT;
    wire({ id: contact.id, side: "top", offset: noOffset }, top(bSlot), [{ x: left + noOffset, y: y - 20 }, { x: slot(bSlot), y: y - 20 }]);
  };

  const earthRail = (target) => {
    if (!target.earth) {
      target.earth = pipe({ x: target.from, y: Y.pe }, { x: target.to, y: Y.pe }, "earth");
      anchor(target.earth, "from", "to");
    }
    return target.earth;
  };

  const switched = (value, x0, aSlot, bSlot, top, y, variant = "B") => {
    if (!isOutputTerminal(value)) return switchPair(relayById.get(value), x0, aSlot, bSlot, top, y, variant);
    const slot = (index) => x0 + LEAD + index * SLOT;
    wire(term(page, value, slot(bSlot)), top(bSlot));
    if (aSlot !== null) wire(tap(page.minus, slot(aSlot)), top(aSlot));
  };

  const drawRow = (row, target) => {
    const type = controlTypeOf(row.type, control);
    const signal = (key) => row.signals?.[key] ?? "";
    const x0 = place(widthOf(row));
    const t = page;
    const slot = (index) => x0 + LEAD + index * SLOT;
    if (row.type === "ntc" || row.type === "pt1000") {
      fieldColumn(row, x0, ({ top }) => {
        const input = signal("in");
        if (input) wire(term(t, input, slot(0), type.mark), top(0));
        ground(t, groundGroup(t.ctrl.model, input) ?? "U", slot(1), top(1));
      });
    } else if (row.type === "pressure") {
      fieldColumn(row, x0, ({ top }) => {
        wire(busAt(t, slot(0)), top(0));
        wire(tap(t.minus, slot(1)), top(1));
        const input = signal("in");
        if (input) wire(term(t, input, slot(2), type.mark), top(2));
        pipe(tap(earthRail(t), slot(3)), top(3), "earth");
      });
    } else if (row.type === "valve" || row.type === "diverter") {
      fieldColumn(row, x0, ({ top }) => {
        const [plus, minus] = row.type === "diverter" ? [0, 1] : [1, 0];
        wire(tap(t.minus, slot(minus)), top(minus));
        wire(busAt(t, slot(plus)), top(plus));
        const output = signal("out");
        if (output) {
          if (!t.coils.has(output)) t.coils.set(output, []);
          t.coils.get(output).push({ x: slot(2), target: top(2), y: Y.outBus });
        }
      });
    } else if (row.type === "actuator") {
      fieldColumn(row, x0, ({ top }) => {
        wire(tap(t.minus, slot(0)), top(0));
        if (isOutputTerminal(signal("relay"))) return switched(signal("relay"), x0, null, 2, top);
        const relay = relayById.get(signal("relay"));
        if (!relay) return;
        const k = takeContact(relay);
        const contact = element("changeover", slot(1) - SLOT, Y.contact, relay.tag, { variant: "A", index: k, ref: "" });
        wire(busAt(t, slot(2)), { id: contact.id, side: "top", offset: 40 });
        wire({ id: contact.id, side: "bottom", offset: 20 }, top(1));
        wire({ id: contact.id, side: "bottom", offset: 40 }, top(2));
      });
    } else if (row.type === "safetyThermostat") {
      fieldColumn(row, x0, ({ top }) => {
        const input = signal("in");
        inputCommon(t, row, input, slot(0), top(0));
        if (input) wire(term(t, input, slot(1), row.contact || "NC"), top(1));
        pipe(tap(earthRail(t), slot(3)), top(3), "earth");
      });
    } else if (row.type === "contact") {
      fieldColumn(row, x0, ({ top }) => {
        const input = signal("in");
        inputCommon(t, row, input, slot(0), top(0));
        if (input) wire(term(t, input, slot(1), row.contact || "NO"), top(1));
      });
    } else if (row.type === "pumpSsm") {
      fieldColumn(row, x0, ({ top }) => {
        const enable = signal("enable");
        if (isOutputTerminal(enable)) switched(enable, x0, 1, 0, top);
        else switched(enable, x0, 0, 1, top, Y.contact, "B");
        const input = signal("fault");
        inputCommon(t, row, input, slot(2), top(2));
        if (input) wire(term(t, input, slot(3), row.contact || "NO"), top(3));
      });
    } else if (row.type === "heatPump" || row.type === "heatPumpStv") {
      fieldColumn(row, x0, ({ top }) => {
        const input = signal("alarm");
        inputCommon(t, row, input, slot(0), top(0));
        if (input) wire(term(t, input, slot(1), row.contact || "NO"), top(1));
        switched(signal("onoff"), x0, 3, 4, top, Y.contact);
        switched(signal("mode"), x0, 6, 7, top, Y.contactLow);
        if (row.type === "heatPumpStv") switched(signal("stv"), x0, 9, 10, top, Y.contact);
      });
    } else if (type.custom) {
      const template = type.custom;
      fieldColumn(row, x0, ({ top }) => {
        const firstOf = (kind) => {
          const index = template.terminals.findIndex((entry) => entry.connect === kind);
          return index < 0 ? "" : signal(`t${index}`);
        };
        template.terminals.forEach((terminal, index) => {
          const at = slot(index);
          if (terminal.connect === "sp") wire(busAt(t, at), top(index));
          else if (terminal.connect === "sn") wire(tap(t.minus, at), top(index));
          else if (terminal.connect === "pe") pipe(tap(earthRail(t), at), top(index), "earth");
          else if (terminal.connect === "gnd") ground(t, groundGroup(t.ctrl.model, firstOf("U")) ?? "U", at, top(index));
          else if (terminal.connect === "common") inputCommon(t, row, firstOf("ID"), at, top(index));
          else if (terminal.connect === "U" || terminal.connect === "ID" || terminal.connect === "Y") {
            const value = signal(`t${index}`);
            if (value) wire(term(t, value, at, terminal.connect === "ID" ? row.contact || "NO" : ""), top(index));
          }
        });
        contactPairs(template).forEach(([a, b], position) => switched(signal(`k${position}`), x0, a, b, top, position % 2 ? Y.contactLow : Y.contact, b > a ? "B" : "BL"));
      });
    } else if (row.type === "aux") {
      const input = signal("in");
      const contact = element("protection", slot(0) - SLOT, Y.contact, row.tag || "-F", { kind: "contact", poles: ["L"], rating: "", note: "" });
      if (input) wire(term(t, input, slot(0), row.contact || "NC"), { id: contact.id, side: "top", offset: SLOT });
      const bottom = { id: contact.id, side: "bottom", offset: SLOT };
      if (t.model.inputCommon === "SP") wire(bottom, busAt(t, slot(1)));
      else ground(t, groundGroup(t.ctrl.model, input) ?? "ID", slot(1), bottom);
    } else if (isRelayType(row.type)) {
      const coil = element("relayCoil", slot(0) - SLOT, Y.coil, row.tag || "-K", { note: "", contacts: [] });
      coil.source = { ...coil.source, controlRow: row.id };
      const caption = noteText(row.description, coil.x, Y.load, Math.max(80, widthOf(row) - 20), nextId(), coil.source);
      if (caption) shapes.push(caption);
      wire({ id: coil.id, side: "bottom", offset: 20 }, tap(t.minus, slot(0)));
      const output = signal("coil");
      if (output) {
        if (!t.coils.has(output)) t.coils.set(output, []);
        t.coils.get(output).push({ x: slot(0), target: port(coil, "top", 0), y: Y.coilBus });
      }
    }
  };

  const sharedOutput = (row) => {
    if (isRelayType(row.type)) return row.signals?.coil || "";
    if (sharesOutput(row.type)) return row.signals?.out || "";
    return "";
  };
  const batches = (rows) => {
    const seen = new Set();
    const list = [];
    for (const row of rows) {
      if (seen.has(row.id)) continue;
      const output = sharedOutput(row);
      const batch = output ? rows.filter((entry) => !seen.has(entry.id) && sharedOutput(entry) === output) : [row];
      batch.forEach((entry) => seen.add(entry.id));
      list.push(batch);
    }
    return list;
  };
  const planned = new Map();
  const widthOf = (row) => planned.get(row.id) ?? columnWidth(row, control);
  const span = (paper.frame.right - 30) - snapUp(paper.frame.left + 40);
  const planRows = (rows) => {
    let current = [];
    let used = 0;
    const flush = () => {
      if (!current.length) return;
      const widest = Math.max(...current.map(([, width]) => width));
      const even = Math.min(widest + MAX_EXTRA, Math.floor(span / current.length / GRID) * GRID);
      const extra = Math.max(0, Math.min(MAX_EXTRA, Math.floor((span - used) / current.length / GRID) * GRID));
      for (const [row, width] of current) planned.set(row.id, even >= widest ? even : width + extra);
      current = [];
      used = 0;
    };
    for (const batch of batches(rows)) {
      const together = batch.reduce((sum, row) => sum + columnWidth(row, control), 0);
      if (batch.length > 1 && used > 0 && used + together > span && together <= span) flush();
      for (const row of batch) {
        const width = columnWidth(row, control);
        if (used > 0 && used + width > span) flush();
        current.push([row, width]);
        used += width;
      }
    }
    flush();
  };
  const keepTogether = (rows) => {
    if (rows.length < 2) return;
    const width = rows.reduce((sum, row) => sum + widthOf(row), 0);
    if (page.cursor + width > page.limit && page.cursor > page.box.x && width <= page.limit - page.start) {
      const ctrl = page.ctrl;
      closePage(page);
      openPage(ctrl, page.sheet);
    }
  };

  const controllerOf = (id) => control.controllers.find((entry) => entry.id === id);
  const links = (control.links ?? []).filter((link) => portOf(controllerOf(link.controller)?.model, link.port));
  const linked = (ctrl) => links.some((link) => link.controller === ctrl.id || (link.target === "controller" && link.targetController === ctrl.id));
  const active = control.controllers.filter((ctrl) => control.rows.some((row) => row.controller === ctrl.id));
  for (const ctrl of active) {
    planRows(control.rows.filter((entry) => entry.controller === ctrl.id));
    openPage(ctrl, "KRMILJE");
    for (const batch of batches(control.rows.filter((entry) => entry.controller === ctrl.id))) {
      keepTogether(batch);
      for (const row of batch) drawRow(row, page);
    }
    closePage(page);
  }
  for (const ctrl of control.controllers.filter((entry) => !modelOf(entry.model).gateway && (active.includes(entry) || linked(entry)))) {
    const supply = openPage(ctrl, "NAPAJANJE KRMILNIKA");
    supplyTerminals(ctrl.model).forEach(([name, rail], index) => {
      const x = supply.cursor + LEAD + index * SLOT;
      const endpoint = term(supply, name, x);
      if (rail === "SP") wire(endpoint, busAt(supply, x));
      else wire(endpoint, tap(supply.minus, x));
    });
    supply.cursor += snapUp(LEAD + (supplyTerminals(ctrl.model).length + 1) * SLOT);
    closePage(supply);
  }

  const linkWidth = (count) => snapUp(LEAD + count * SLOT + 150);
  const portTerms = (target, iface, x) => iface.terminals.map((name, index) => term(target, name, x + index * SLOT, index ? "" : iface.label));
  const caption = (lines, x, y, width, source) => {
    const note = noteText(lines.filter(Boolean).join("\n"), x, y, width, nextId(), source);
    if (note) shapes.push(note);
  };
  const SHEET = "KOMUNIKACIJA";
  const drawLink = (link) => {
    const ctrl = controllerOf(link.controller);
    const iface = portOf(ctrl.model, link.port);
    const display = link.target === "display";
    const indent = display ? 120 : 0;
    const x0 = place(display ? snapUp(indent + LEAD + 5 * SLOT + 160) : linkWidth(iface.terminals.length));
    const t = page;
    const slot = (index) => x0 + indent + LEAD + index * SLOT;
    const ex = x0 + indent + LEAD - SLOT;
    const source = { power: true, control: true, controlLink: link.id };
    const tops = portTerms(t, iface, slot(0));
    if (link.target === "external" && iface.kind === "serial") {
      const stripName = link.strip || control.strip || "-X2";
      const strip = element("terminalStrip", ex, Y.strip, stripName, { terminals: iface.terminals.map(() => nextTerminal(stripName)) }, SHEET);
      const cable = element("cable", ex, Y.cable, link.tag || "-W.K", { conductors: iface.terminals.map((_, index) => String(index + 1)), cableType: link.cable, shield: true }, SHEET);
      const line = element("busLine", ex, Y.load, "", { wires: iface.terminals.map((_, index) => String(index + 1)), cableType: link.cable, label: link.text }, SHEET);
      tops.forEach((endpoint, index) => {
        wire(endpoint, port(strip, "top", index));
        wire(port(strip, "bottom", index), port(cable, "top", index));
        wire(port(cable, "bottom", index), port(line, "top", index));
      });
      caption([link.protocol, link.description], slot(0) - 30, Y.load + 84, 200, source);
      return;
    }
    if (display) {
      const stripName = control.strip || "-X2";
      const strip = element("terminalStrip", ex, Y.strip, stripName, { terminals: [0, 1, 2, 3, 4].map(() => nextTerminal(stripName)) }, SHEET);
      const data = element("cable", ex, Y.cable, link.tag || "-W.TD2", { conductors: ["1", "2", "3"], cableType: link.cable, shield: iface.kind === "serial", labelLeft: true }, SHEET);
      const feed = element("cable", ex + 3 * SLOT, Y.cable, `${link.tag || "-W.TD2"}N`, { conductors: ["1", "2"], cableType: "FLAME-JZ-H FRNC 3x1,0 mm2" }, SHEET);
      const device = element("fieldDevice", ex, Y.load, link.display || "-TD1", { terminals: ["-", "+", "GND", "+24", "-24"], model: "PGDX", description: "", symbol: "" }, SHEET);
      tops.slice(0, 3).forEach((endpoint, index) => {
        wire(endpoint, port(strip, "top", index));
        wire(port(strip, "bottom", index), port(data, "top", index));
        wire(port(data, "bottom", index), port(device, "top", index));
      });
      wire(busAt(t, slot(3)), port(strip, "top", 3));
      wire(tap(t.minus, slot(4)), port(strip, "top", 4));
      [3, 4].forEach((index) => {
        wire(port(strip, "bottom", index), port(feed, "top", index - 3));
        wire(port(feed, "bottom", index - 3), port(device, "top", index));
      });
      const text = link.description || "ZASLON NA DOTIK";
      caption([text, link.protocol], device.x, device.y + device.height + 8, noteWidth(text, device.width), source);
      return;
    }
    const cable = element("cable", ex, Y.cable, link.tag || "-W.K", { conductors: iface.terminals.map((_, index) => String(index + 1)), cableType: link.cable, shield: iface.kind === "serial" }, SHEET);
    tops.forEach((endpoint, index) => {
      wire(endpoint, port(cable, "top", index));
      wire(port(cable, "bottom", index), { x: slot(index), y: Y.load + 10 });
    });
    const other = link.target === "controller" ? controllerOf(link.targetController) : null;
    const otherPort = other ? portOf(other.model, link.targetPort) : null;
    const to = other ? `POVEZAVA NA ${other.tag || "?"}${otherPort ? ` ${otherPort.label}` : ""}` : link.text;
    caption([to, link.protocol, link.description], slot(0) - 30, Y.load + 26, 200, source);
  };
  const drawIncoming = (link) => {
    const ctrl = controllerOf(link.targetController);
    const iface = portOf(ctrl.model, link.targetPort);
    if (!iface) return;
    const x0 = place(linkWidth(iface.terminals.length));
    const t = page;
    const slot = (index) => x0 + LEAD + index * SLOT;
    portTerms(t, iface, slot(0)).forEach((endpoint, index) => wire(endpoint, { x: slot(index), y: Y.cable + 20 }));
    const from = controllerOf(link.controller);
    caption([`POVEZAVA NA ${from?.tag || "?"} ${portOf(from?.model, link.port)?.label ?? ""}`.trim(), link.tag, link.protocol], slot(0) - 30, Y.cable + 36, 200, { power: true, control: true, controlLink: link.id });
  };
  const switchOf = (id) => Boolean(modelOf(controllerOf(id)?.model).switch);
  const toController = (link) => link.target === "controller" && controllerOf(link.targetController);
  const onSwitch = (link) => toController(link) && (switchOf(link.controller) || switchOf(link.targetController));
  const boxModel = (model) => [model.gateway ? model.label : `Controller ${model.label}`, model.part ? `(${model.part})` : ""].filter(Boolean).join(" ");
  const drawSwitch = (ctrl) => {
    const ports = commPorts(ctrl.model);
    const x0 = place(snapUp(LEAD + (ports.length + 3) * SLOT));
    const t = page;
    const slot = (index) => x0 + LEAD + index * SLOT;
    wire(term(t, "+", slot(0)), busAt(t, slot(0)));
    wire(term(t, "-", slot(1)), tap(t.minus, slot(1)));
    const portX = new Map(ports.map((entry, index) => [entry.id, slot(index + 2)]));
    for (const entry of ports) term(t, entry.terminals[0], portX.get(entry.id));
    t.boxEnd = t.cursor;
    const own = links.filter((link) => link.controller === ctrl.id || (link.target === "controller" && link.targetController === ctrl.id));
    let outside = 0;
    for (const link of own.filter((entry) => entry.controller === ctrl.id && !toController(entry))) {
      const x = portX.get(link.port);
      if (x === undefined) continue;
      const y = Y.cable - outside * 60;
      const cable = element("cable", x - SLOT, y, link.tag || "-W.K", { conductors: ["1"], cableType: link.cable }, SHEET);
      wire({ id: t.box.id, side: "bottom", offset: x - t.box.x }, port(cable, "top", 0));
      wire(port(cable, "bottom", 0), { x, y: Y.load + 10 });
      caption([link.text, link.protocol, link.description], x - 30, Y.load + 26 + outside * 40, 200, { power: true, control: true, controlLink: link.id });
      outside += 1;
    }
    const peers = new Map();
    let lane = 0;
    for (const link of own.filter(toController)) {
      const mine = link.controller === ctrl.id;
      const peer = controllerOf(mine ? link.targetController : link.controller);
      const peerPort = portOf(peer?.model, mine ? link.targetPort : link.port);
      const x = portX.get(mine ? link.port : link.targetPort);
      if (!peer || !peerPort || x === undefined || peer.id === ctrl.id) continue;
      if (!peers.has(peer.id)) {
        const left = place(snapUp(240));
        const box = element("controller", left, Y.controller, peer.tag || "-N", { model: boxModel(modelOf(peer.model)), terminals: [peerPort.terminals[0]], marks: [peerPort.label] }, SHEET);
        peers.set(peer.id, box);
      }
      const box = peers.get(peer.id);
      const px = box.x + SLOT;
      const y = Y.spBus + 50 + lane * 20;
      lane += 1;
      const cable = element("cable", px - SLOT, y - 54, link.tag || "-W.K", { conductors: ["1"], cableType: link.cable }, SHEET);
      wire({ id: t.box.id, side: "bottom", offset: x - t.box.x }, port(cable, "bottom", 0), [{ x, y }, { x: px, y }]);
      wire(port(cable, "top", 0), { id: box.id, side: "bottom", offset: SLOT });
    }
  };
  for (const ctrl of control.controllers) {
    const switchPage = Boolean(modelOf(ctrl.model).switch);
    const outgoing = links.filter((link) => link.controller === ctrl.id && !onSwitch(link));
    const incoming = links.filter((link) => link.target === "controller" && link.targetController === ctrl.id && link.controller !== ctrl.id && !onSwitch(link));
    if (switchPage) {
      if (!links.some((link) => link.controller === ctrl.id || (link.target === "controller" && link.targetController === ctrl.id))) continue;
      openPage(ctrl, SHEET);
      drawSwitch(ctrl);
      closePage(page);
      continue;
    }
    if (!outgoing.length && !incoming.length) continue;
    const gatewayPage = Boolean(modelOf(ctrl.model).gateway);
    openPage(ctrl, SHEET, gatewayPage ? { plus: "dcPlus", minus: "dcMinus" } : media);
    if (gatewayPage) {
      const x0 = place(snapUp(LEAD + 3 * SLOT));
      wire(term(page, "+", x0 + LEAD, "24 VDC"), busAt(page, x0 + LEAD));
      wire(term(page, "-", x0 + LEAD + SLOT), tap(page.minus, x0 + LEAD + SLOT));
    }
    outgoing.forEach(drawLink);
    incoming.forEach(drawIncoming);
    closePage(page);
  }

  for (const entry of pages) {
    const content = entry.cursor - entry.box.x + SLOT;
    const offset = Math.floor((entry.from + entry.to - (entry.box.x - SLOT) - entry.cursor) / 2 / GRID) * GRID;
    const left = entry.box.x;
    const fullWidth = entry.boxEnd === undefined;
    if (offset <= 0 || content <= 0) {
      if (fullWidth) widen(entry, left, 0);
      continue;
    }
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
    if (fullWidth) widen(entry, left, offset);
  }
  return { shapes, pages: pages.length };

  function widen(entry, left, offset){
    const box = entry.box;
    const right = Math.floor((entry.to - 20 - left) / SLOT) * SLOT + left;
    const lead = Array(offset / SLOT).fill("");
    const count = (right - left) / SLOT - 1;
    const fit = (list) => [...lead, ...list].concat(Array(count).fill("")).slice(0, count);
    box.params = { ...box.params, terminals: fit(box.params.terminals ?? []), marks: fit(box.params.marks ?? []) };
    Object.assign(box, electricSize("controller", box.params));
    box.x = left;
    for (const shape of shapes) {
      if (shape.kind !== "pipe") continue;
      for (const end of ["from", "to"]) if (shape[end]?.id === box.id) shape[end] = { ...shape[end], offset: shape[end].offset + offset };
    }
  }
}

export function crossReference(shapes, paper = paperOf()){
  const where = (shape) => location(shape.x + shape.width / 2, paper);
  const coils = shapes.filter((shape) => shape.kind === "equipment" && shape.type === "relayCoil" && shape.source?.control);
  const coilByName = new Map(coils.map((coil) => [coil.name, coil]));
  for (const coil of coils) coil.params = { ...coil.params, contacts: [] };
  for (const shape of shapes) {
    if (shape.kind !== "equipment") continue;
    if (shape.type === "changeover") {
      const coil = coilByName.get(shape.name);
      if (!coil) continue;
      shape.params = { ...shape.params, ref: where(coil) };
      const numbers = changeoverNumbers(shape.params.index);
      coil.params.contacts.push({ ref: where(shape), numbers: `${numbers.common}-${numbers.no}/${numbers.nc}` });
    } else if (shape.type === "protection" && shape.params?.kind === "contact") {
      const coil = coilByName.get(shape.name);
      if (coil) {
        shape.params = { ...shape.params, rating: where(coil) };
        coil.params.contacts.push({ ref: where(shape), numbers: "1-2" });
        continue;
      }
      const breaker = shapes.find((other) => other.kind === "equipment" && other.type === "protection" && other.params?.kind !== "contact" && other.name === shape.name);
      if (breaker) shape.params = { ...shape.params, rating: where(breaker) };
    }
  }
  return shapes;
}
