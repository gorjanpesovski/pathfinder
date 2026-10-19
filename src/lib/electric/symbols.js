import { escapeXml } from "../export/atvise.js";

export const SLOT = 20;

const INK = "#1E293B";
const FONT = "Arial, Helvetica, sans-serif";

export const ELECTRIC_DEFAULTS = {
  controller: { name: "-N1", params: { model: "Controller", terminals: ["G", "G0", "", "U1", "GND"] } },
  terminalStrip: { name: "-X2", params: { terminals: ["1", "2"] } },
  cable: { name: "-W1", params: { conductors: ["1", "2"], cableType: "J-H(St)H 2x2x0,8mm2" } },
  relayCoil: { name: "-K1", params: { note: "" } },
  changeover: { name: "-K1", params: { variant: "A", index: 1, ref: "" } },
  relayContact: { name: "-K1", params: {} },
  fieldDevice: { name: "-B1", params: { terminals: ["1", "2"], model: "", description: "", symbol: "" } },
  protection: { name: "-F1", params: { kind: "mcb", poles: ["L"], rating: "C10", note: "" } },
  psu: { name: "-T1", params: { kind: "dc", terminals: ["L", "N", "PE"], rating: "230VAC/24VDC" } },
  supply: { name: "", params: { terminals: ["L1", "L2", "L3", "N", "PE"], description: "DOVOD" } },
  busLine: { name: "", params: { wires: ["1", "2"], cableType: "2x2x0,8", label: "Modbus linija 1" } }
};

export const PROTECTION_KINDS = [
  { id: "mcb", label: "MCB" },
  { id: "rcbo", label: "RCBO" },
  { id: "rcd", label: "RCD" },
  { id: "fuse", label: "Fuse" },
  { id: "mpcb", label: "Motor protection" },
  { id: "switch", label: "Switch" }
];

export const DEVICE_SYMBOLS = [
  { id: "", label: "None" },
  { id: "motor", label: "Motor" },
  { id: "heater", label: "Heater" },
  { id: "socket", label: "Socket" },
  { id: "light", label: "Light" }
];

const SLOTTED = {
  controller: { key: "terminals", sides: ["bottom"] },
  terminalStrip: { key: "terminals", sides: ["top", "bottom"] },
  cable: { key: "conductors", sides: ["top", "bottom"] },
  fieldDevice: { key: "terminals", sides: ["top"] },
  protection: { key: "poles", sides: ["top", "bottom"] },
  psu: { key: "terminals", sides: ["left"] },
  supply: { key: "terminals", sides: ["top"] },
  busLine: { key: "wires", sides: ["top"] }
};

export function slotsOf(element){
  const spec = SLOTTED[element.type];
  if (!spec) return [];
  const list = element.params?.[spec.key] ?? ELECTRIC_DEFAULTS[element.type].params[spec.key];
  return Array.isArray(list) ? list.map((entry) => String(entry ?? "").trim()) : [];
}

export function parseSlots(text){
  return String(text ?? "").split(",").map((entry) => entry.trim());
}

export function formatSlots(list){
  return (list ?? []).join(", ");
}

export function electricSize(type, params = {}){
  const spec = SLOTTED[type];
  const count = spec ? (params[spec.key] ?? ELECTRIC_DEFAULTS[type].params[spec.key]).length : 0;
  const span = (count + 1) * SLOT;
  if (type === "controller") return { width: Math.max(200, span), height: 80 };
  if (type === "terminalStrip") return { width: span, height: 40 };
  if (type === "cable") return { width: span + 100, height: 40 };
  if (type === "fieldDevice") return { width: Math.max(120, span), height: 80 };
  if (type === "protection") return { width: span, height: 60 };
  if (type === "psu") return params.kind === "ac" ? { width: 80, height: 72 } : params.kind === "socket" ? { width: 60, height: 96 } : { width: 160, height: 72 };
  if (type === "supply") return { width: Math.max(80, span), height: 60 };
  if (type === "relayCoil") return { width: 40, height: 60 };
  if (type === "changeover") return { width: 60, height: 60 };
  if (type === "relayContact") return { width: 60, height: 40 };
  if (type === "busLine") return { width: span + 120, height: 70 };
  return { width: 40, height: 40 };
}

function poleLabel(label, index, side){
  if (label === "N") return "N";
  const number = index * 2 + 1;
  return String(side === "top" ? number : number + 1);
}

export function psuOutputs(element){
  return element.params?.kind === "ac" ? ["24V", "0V"] : ["+", "-"];
}

export const PSU_PORTS = {
  dc: { inputs: [16, 36, 56], outputs: [26, 46] },
  ac: { line: 20, neutral: 20, earth: 40, outputs: [12, 60] },
  socket: { line: 20, neutral: 20, earth: 40 }
};

export const CHANGEOVER = {
  A: { common: ["top", 40], nc: ["bottom", 20], no: ["bottom", 40] },
  AR: { common: ["top", 20], nc: ["bottom", 40], no: ["bottom", 20] },
  B: { common: ["bottom", 40], nc: ["top", 20], no: ["top", 40] },
  BL: { common: ["bottom", 20], nc: ["top", 40], no: ["top", 20] }
};

export function changeoverNumbers(index){
  const k = Math.max(1, Number(index) || 1);
  return { common: `${k}1`, nc: `${k}2`, no: `${k}4` };
}

export function electricPorts(element){
  const spec = SLOTTED[element.type];
  if (element.type === "protection") {
    let line = 0;
    return slotsOf(element).flatMap((label, index) => {
      if (!label) return [];
      const position = label === "N" ? 0 : line++;
      return spec.sides.map((side) => ({ side, offset: (index + 1) * SLOT, label: poleLabel(label, position, side) }));
    });
  }
  if (element.type === "psu" && element.params?.kind === "socket") {
    const ports = PSU_PORTS.socket;
    return [
      { side: "top", offset: ports.line, label: "L" },
      { side: "bottom", offset: ports.neutral, label: "N" },
      { side: "bottom", offset: ports.earth, label: "PE" }
    ];
  }
  if (element.type === "psu") {
    const [plus, minus] = psuOutputs(element);
    if (element.params?.kind === "ac") {
      const ports = PSU_PORTS.ac;
      return [
        { side: "top", offset: ports.line, label: "L" },
        { side: "bottom", offset: ports.neutral, label: "N" },
        { side: "bottom", offset: ports.earth, label: "PE" },
        { side: "right", offset: ports.outputs[0], label: plus },
        { side: "right", offset: ports.outputs[1], label: minus }
      ];
    }
    const ports = PSU_PORTS.dc;
    return [
      ...["L", "N", "PE"].map((label, index) => ({ side: "left", offset: ports.inputs[index], label })),
      { side: "right", offset: ports.outputs[0], label: plus },
      { side: "right", offset: ports.outputs[1], label: minus }
    ];
  }
  if (spec) {
    return slotsOf(element).flatMap((label, index) => label
      ? spec.sides.map((side) => ({ side, offset: (index + 1) * SLOT, label }))
      : []);
  }
  if (element.type === "relayCoil") return [{ side: "top", offset: 20, label: "A1" }, { side: "bottom", offset: 20, label: "A2" }];
  if (element.type === "changeover") {
    const layout = CHANGEOVER[element.params?.variant] ?? CHANGEOVER.A;
    const numbers = changeoverNumbers(element.params?.index);
    return ["common", "nc", "no"].map((role) => ({ side: layout[role][0], offset: layout[role][1], label: numbers[role] }));
  }
  if (element.type === "relayContact") return [{ side: "bottom", offset: 20, label: "11" }, { side: "bottom", offset: 40, label: "14" }];
  return [];
}

function text(x, y, value, { size = 10, anchor = "start", bold = false, fill = INK } = {}){
  if (!value) return "";
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}"${bold ? ` font-weight="bold"` : ""}${anchor === "start" ? "" : ` text-anchor="${anchor}"`} fill="${fill}">${escapeXml(value)}</text>`;
}

function line(x1, y1, x2, y2, width = 1.2){
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="${width}"/>`;
}

function box(x, y, width, height, strokeWidth = 1.2, fill = "#FFFFFF"){
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="${INK}" stroke-width="${strokeWidth}"/>`;
}

function wrap(value, limit){
  const words = String(value ?? "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    if (current && (current + " " + word).length > limit) {
      lines.push(current);
      current = word;
    } else current = current ? `${current} ${word}` : word;
  }
  if (current) lines.push(current);
  return lines;
}

function controller(element){
  const { x, y, width, height } = element;
  const parts = [box(x, y, width, height, 1.5)];
  parts.push(text(x + 8, y + 18, element.name, { size: 13, bold: true }));
  parts.push(text(x + 8, y + 34, element.params?.model, { size: 10 }));
  parts.push(line(x, y + height - 20, x + width, y + height - 20));
  const marks = element.params?.marks ?? [];
  slotsOf(element).forEach((label, index) => {
    if (!label) return;
    const cx = x + (index + 1) * SLOT;
    parts.push(box(cx - SLOT / 2, y + height - 20, SLOT, 20, 1));
    parts.push(text(cx, y + height - 6, label, { size: label.length > 3 ? 7 : 8, anchor: "middle" }));
    parts.push(text(cx, y + height - 24, marks[index], { size: 6, anchor: "middle" }));
  });
  return parts.join("");
}

function haloText(x, y, value, { size = 10, anchor = "start", bold = false } = {}){
  if (!value) return "";
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}"${bold ? ` font-weight="bold"` : ""}${anchor === "start" ? "" : ` text-anchor="${anchor}"`} fill="${INK}" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round" paint-order="stroke">${escapeXml(value)}</text>`;
}

function changeover(element){
  const { x, y } = element;
  const layout = CHANGEOVER[element.params?.variant] ?? CHANGEOVER.A;
  const numbers = changeoverNumbers(element.params?.index);
  const top = layout.common[0] === "top";
  const cx = x + layout.common[1];
  const ncx = x + layout.nc[1];
  const nox = x + layout.no[1];
  const pivot = top ? y + 18 : y + 42;
  const tip = top ? y + 42 : y + 18;
  const far = top ? y + 60 : y;
  const parts = [
    line(cx, top ? y : y + 60, cx, pivot),
    line(cx, pivot, ncx + (ncx > cx ? -2 : 2), tip),
    line(ncx, tip, ncx, far),
    line(ncx, tip, ncx + (ncx > cx ? -6 : 6), tip),
    line(nox, top ? tip - 4 : tip + 4, nox, far),
    line(nox - 4, top ? tip - 4 : tip + 4, nox + 4, top ? tip - 4 : tip + 4)
  ];
  parts.push(text(cx + 3, top ? y + 10 : y + 56, numbers.common, { size: 7 }));
  parts.push(text(ncx + 3, top ? y + 56 : y + 10, numbers.nc, { size: 7 }));
  parts.push(text(nox + 3, top ? y + 56 : y + 10, numbers.no, { size: 7 }));
  if (top) {
    const left = Math.min(cx, ncx, nox) - 8;
    parts.push(haloText(left, y + 28, element.name, { size: 11, bold: true, anchor: "end" }));
    parts.push(haloText(left, y + 41, element.params?.ref, { size: 8, anchor: "end" }));
  } else {
    const right = cx === Math.min(cx, ncx, nox);
    const anchor = right ? "start" : "end";
    const at = right ? cx + 15 : cx - 5;
    parts.push(haloText(at, y + 54, element.name, { size: 11, bold: true, anchor }));
    parts.push(haloText(at, y + 66, element.params?.ref, { size: 8, anchor }));
  }
  return parts.join("");
}

function terminalStrip(element){
  const { x, y } = element;
  const parts = [];
  const slots = slotsOf(element);
  const first = slots.findIndex(Boolean);
  if (first >= 0) parts.push(text(x + (first + 1) * SLOT - 8, y + 24, element.name, { size: 11, anchor: "end" }));
  slots.forEach((label, index) => {
    if (!label) return;
    const cx = x + (index + 1) * SLOT;
    parts.push(line(cx, y, cx, y + 16.5));
    parts.push(line(cx, y + 23.5, cx, y + 40));
    parts.push(`<circle cx="${cx}" cy="${y + 20}" r="3.5" fill="#FFFFFF" stroke="${INK}" stroke-width="1.2"/>`);
    parts.push(text(cx + 5, y + 14, label, { size: 8 }));
  });
  return parts.join("");
}

function cable(element){
  const { x, y } = element;
  const parts = [];
  const slots = slotsOf(element);
  const last = (slots.length) * SLOT;
  const left = element.params?.labelLeft;
  const at = left ? x + SLOT - 14 : x + last + 14;
  const reach = Math.max(String(element.name ?? "").length * 6.6, String(element.params?.cableType ?? "").length * 4.4) + 4;
  parts.push(left ? line(at - reach, y + 20, x + last + 8, y + 20, 1) : line(x + 8, y + 20, at + reach, y + 20, 1));
  slots.forEach((label, index) => {
    if (!label) return;
    const cx = x + (index + 1) * SLOT;
    parts.push(line(cx, y, cx, y + 40));
    parts.push(line(cx - 4, y + 25, cx + 4, y + 15, 1));
    parts.push(text(cx + 3, y + 13, label, { size: 7 }));
  });
  if (element.params?.shield && slots.length) {
    const middle = x + (slots.length + 1) * SLOT / 2;
    parts.push(`<ellipse cx="${middle}" cy="${y + 20}" rx="${(slots.length - 1) * SLOT / 2 + 12}" ry="8" fill="none" stroke="${INK}" stroke-width="1" stroke-dasharray="3 2"/>`);
  }
  const anchor = left ? "end" : "start";
  parts.push(text(at, y + 17, element.name, { size: 11, bold: true, anchor }));
  parts.push(text(at, y + 32, element.params?.cableType, { size: 8, anchor }));
  return parts.join("");
}

function fieldDevice(element){
  const { x, y, width, height } = element;
  const parts = [box(x, y, width, height, 1.5)];
  const slots = slotsOf(element);
  for (let index = 0; index < slots.length; index += 1) {
    const label = slots[index];
    if (!label) continue;
    let last = index;
    while (last + 1 < slots.length && slots[last + 1] === label && label.length > 3) last += 1;
    const left = x + (index + 1) * SLOT - SLOT / 2;
    const span = (last - index + 1) * SLOT;
    parts.push(box(left, y, span, 16, 1));
    parts.push(text(left + span / 2, y + 12, label, { size: label.length > 3 && span === SLOT ? 6 : 7, anchor: "middle" }));
    index = last;
  }
  parts.push(text(x + 6, y + 34, element.name, { size: 11, bold: true }));
  parts.push(text(x + 6, y + height - 8, element.params?.model, { size: 8 }));
  parts.push(deviceGlyph(element));
  String(element.params?.description ?? "").split("\n").map((part) => part.trim()).filter(Boolean).slice(0, 5).forEach((row, index, rows) => {
    const centred = Math.max(...rows.map((entry) => entry.length)) * 5.4 <= width + 40;
    parts.push(text(centred ? x + width / 2 : x, y + height + 14 + index * 12, row, { size: 9, anchor: centred ? "middle" : "start" }));
  });
  return parts.join("");
}

const GLYPHS = {
  motor: (cx, cy, element) => {
    const three = slotsOf(element).some((label) => /^(U|V|W|L2|L3)$/.test(label));
    return `<circle cx="${cx}" cy="${cy}" r="15" fill="#FFFFFF" stroke="${INK}" stroke-width="1.2"/>`
      + text(cx, cy - 1, "M", { size: 11, anchor: "middle", bold: true }) + text(cx, cy + 10, three ? "3~" : "1~", { size: 8, anchor: "middle" });
  },
  heater: (cx, cy) => box(cx - 14, cy - 10, 28, 20, 1.2) + `<polyline points="${cx - 10},${cy} ${cx - 6},${cy - 6} ${cx - 2},${cy + 6} ${cx + 2},${cy - 6} ${cx + 6},${cy + 6} ${cx + 10},${cy}" fill="none" stroke="${INK}" stroke-width="1"/>`,
  socket: (cx, cy) => `<path d="M ${cx - 13} ${cy + 6} A 13 13 0 0 1 ${cx + 13} ${cy + 6}" fill="none" stroke="${INK}" stroke-width="1.2"/>` + line(cx - 16, cy + 6, cx + 16, cy + 6) + line(cx, cy + 6, cx, cy + 14),
  sensor: (cx, cy) => box(cx - 12, cy - 6, 24, 12, 1.2) + line(cx - 16, cy + 10, cx + 16, cy - 10, 1) + line(cx + 10, cy - 10, cx + 16, cy - 10, 1),
  light: (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="12" fill="#FFFFFF" stroke="${INK}" stroke-width="1.2"/>` + line(cx - 8.5, cy - 8.5, cx + 8.5, cy + 8.5) + line(cx - 8.5, cy + 8.5, cx + 8.5, cy - 8.5)
};

function deviceGlyph(element){
  const draw = GLYPHS[element.params?.symbol];
  return draw ? draw(element.x + element.width - 30, element.y + 48, element) : "";
}

const OPERATORS = {
  rcbo: ["residual"],
  rcd: ["residual"],
  switch: ["manual"]
};

const QUALIFIED = new Set(["mcb", "mpcb", "rcbo"]);

function qualifiers(cx, y){
  const blade = (at) => cx - 11 * (44 - at) / 23;
  return [
    `<polyline points="${cx - 30},${y + 31} ${cx - 25},${y + 31} ${cx - 25},${y + 26} ${cx - 19},${y + 26} ${cx - 19},${y + 28} ${blade(28)},${y + 28}" fill="none" stroke="${INK}" stroke-width="1.2"/>`,
    line(blade(38), y + 38, cx - 18, y + 38, 1.2),
    `<polygon points="${cx - 25},${y + 38} ${cx - 17},${y + 34.5} ${cx - 17},${y + 41.5}" fill="${INK}" stroke="${INK}" stroke-width="0.6"/>`
  ].join("");
}

function operator(kind, bx, y){
  if (kind === "manual") return line(bx, y + 25, bx, y + 39, 1.2);
  const parts = [box(bx, y + 25, 16, 14, 1)];
  if (kind === "thermal") parts.push(`<polyline points="${bx + 3},${y + 35} ${bx + 8},${y + 35} ${bx + 8},${y + 29} ${bx + 13},${y + 29}" fill="none" stroke="${INK}" stroke-width="1"/>`);
  if (kind === "magnetic") parts.push(text(bx + 8, y + 35.5, "I>", { size: 8, anchor: "middle" }));
  if (kind === "residual") parts.push(text(bx + 8, y + 35.5, "IΔ", { size: 8, anchor: "middle" }));
  return parts.join("");
}

function operatorStart(kind, neutral){
  return (neutral ? 32 : 0) + ((OPERATORS[kind] ?? [])[0] === "manual" ? 14 : 12);
}

function operatorWidth(kind, neutral){
  const list = OPERATORS[kind] ?? [];
  if (!list.length) return 0;
  return operatorStart(kind, neutral) + (list[0] === "manual" ? 0 : list.length * 20);
}

function protection(element){
  const { x, y } = element;
  const kind = element.params?.kind ?? "mcb";
  const parts = [];
  const poles = slotsOf(element).map((label, index) => label ? x + (index + 1) * SLOT : null).filter((value) => value !== null);
  const neutralPoles = new Set(slotsOf(element).map((label, index) => label === "N" ? x + (index + 1) * SLOT : null).filter((value) => value !== null));
  const breaker = kind === "rcd";
  for (const cx of poles) {
    if (kind === "fuse") {
      parts.push(line(cx, y, cx, y + 3.5), line(cx, y + 8.5, cx, y + 16), box(cx - 5, y + 16, 10, 28, 1.2), line(cx, y + 16, cx, y + 44), line(cx, y + 44, cx, y + 51.5), line(cx, y + 56.5, cx, y + 60));
      parts.push(`<circle cx="${cx}" cy="${y + 6}" r="2.5" fill="#FFFFFF" stroke="${INK}" stroke-width="1.2"/>`, `<circle cx="${cx}" cy="${y + 54}" r="2.5" fill="#FFFFFF" stroke="${INK}" stroke-width="1.2"/>`);
      continue;
    }
    if (QUALIFIED.has(kind)) {
      const number = poles.indexOf(cx) * 2 + 1;
      parts.push(line(cx, y, cx, y + 18), line(cx - 6, y + 18, cx + 6, y + 18), line(cx - 3.5, y + 10, cx + 3.5, y + 16), line(cx - 3.5, y + 16, cx + 3.5, y + 10));
      parts.push(line(cx, y + 41.5, cx - 10, y + 21), `<circle cx="${cx}" cy="${y + 44}" r="2.5" fill="#FFFFFF" stroke="${INK}" stroke-width="1.2"/>`, line(cx, y + 46.5, cx, y + 60));
      const neutralPole = neutralPoles.has(cx);
      parts.push(text(cx + 4, y + 8, neutralPole ? "N" : String(number), { size: 7 }), text(cx + 4, y + 58, neutralPole ? "N" : String(number + 1), { size: 7 }));
      if (cx === poles[0] && !neutralPoles.has(cx)) parts.push(qualifiers(cx, y));
      continue;
    }
    parts.push(line(cx, y, cx, y + 18), line(cx, y + 44, cx - 11, y + 21), line(cx, y + 44, cx, y + 60));
    if (breaker) parts.push(line(cx - 3.5, y + 14.5, cx + 3.5, y + 21.5), line(cx - 3.5, y + 21.5, cx + 3.5, y + 14.5));
    if (kind === "switch") {
      parts.push(line(cx - 4, y + 18, cx + 4, y + 18));
      parts.push(`<circle cx="${cx}" cy="${y + 14.5}" r="2.5" fill="#FFFFFF" stroke="${INK}" stroke-width="1"/>`);
    }
  }
  const operators = OPERATORS[kind] ?? [];
  const neutral = slotsOf(element).filter(Boolean).at(-1) === "N";
  if (kind !== "fuse" && poles.length) {
    const right = poles[poles.length - 1];
    const end = operators.length ? right + operatorStart(kind, neutral) : right;
    if (end > poles[0] - 6 && (operators.length || poles.length > 1)) parts.push(`<line x1="${poles[0] - 6}" y1="${y + 32}" x2="${end}" y2="${y + 32}" stroke="${INK}" stroke-width="1" stroke-dasharray="3 2"/>`);
    operators.forEach((entry, index) => parts.push(operator(entry, end + index * 20, y)));
  }
  const onRight = element.params?.labels === "right";
  const last = poles[poles.length - 1] ?? x + SLOT;
  const anchor = onRight ? "start" : "end";
  const left = onRight ? last + Math.max(12, operatorWidth(kind, neutral) + 8) : (poles[0] ?? x + SLOT) - (QUALIFIED.has(kind) ? 34 : 14);
  parts.push(text(left, y + 26, element.name, { size: 11, bold: true, anchor }));
  parts.push(text(left, y + 39, element.params?.rating, { size: 9, anchor }));
  parts.push(text(left, y + 51, element.params?.note, { size: 8, anchor }));
  return parts.join("");
}

function coil(cx, top, bottom, toward){
  const turns = 3;
  const step = (bottom - top) / turns;
  let path = `M ${cx} ${top}`;
  for (let index = 0; index < turns; index += 1) path += ` a ${step / 2} ${step / 2} 0 0 ${toward > 0 ? 1 : 0} 0 ${step}`;
  return `<path d="${path}" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
}

function transformer(element){
  const { x, y, width, height } = element;
  const ports = PSU_PORTS.ac;
  const [high, low] = psuOutputs(element);
  const primary = x + ports.line;
  const secondary = x + width - 20;
  const parts = [
    line(primary, y, primary, y + 18), coil(primary, y + 18, y + 54, 1), line(primary, y + 54, primary, y + height),
    line(x + 36, y + 14, x + 36, y + 58, 1.4), line(x + ports.earth, y + 14, x + ports.earth, y + 58, 1.4),
    line(x + ports.earth, y + 58, x + ports.earth, y + height, 1),
    coil(secondary, y + 18, y + 54, -1),
    line(secondary, y + 18, secondary, y + ports.outputs[0]), line(secondary, y + ports.outputs[0], x + width, y + ports.outputs[0]),
    line(secondary, y + 54, secondary, y + ports.outputs[1]), line(secondary, y + ports.outputs[1], x + width, y + ports.outputs[1])
  ];
  parts.push(text(primary - 4, y + 12, "L", { size: 8, anchor: "end" }));
  parts.push(text(primary - 4, y + height - 4, "N", { size: 8, anchor: "end" }));
  parts.push(text(x + width + 2, y + ports.outputs[0] - 3, high, { size: 8 }));
  parts.push(text(x + width + 2, y + ports.outputs[1] - 3, low, { size: 8 }));
  parts.push(text(primary - 14, y + 34, element.name, { size: 11, bold: true, anchor: "end" }));
  parts.push(text(primary - 14, y + 47, element.params?.rating, { size: 8, anchor: "end" }));
  return parts.join("");
}

function dinSocket(element){
  const { x, y, width, height } = element;
  const ports = PSU_PORTS.socket;
  const parts = [box(x, y, width, height, 1.5)];
  const cell = (offset, top, label) => {
    parts.push(box(x + offset - 10, top, 20, 18, 1));
    parts.push(text(x + offset, top + 13, label, { size: 8, anchor: "middle" }));
  };
  parts.push(line(x, y + 18, x + width, y + 18, 1), line(x, y + height - 18, x + width, y + height - 18, 1));
  cell(ports.line, y, "L");
  cell(ports.neutral, y + height - 18, "N");
  cell(ports.earth, y + height - 18, "PE");
  const cx = x + width / 2;
  const cy = y + height / 2;
  parts.push(`<circle cx="${cx}" cy="${cy}" r="17" fill="#FFFFFF" stroke="${INK}" stroke-width="1.2"/>`);
  parts.push(`<circle cx="${cx - 7}" cy="${cy}" r="2.6" fill="none" stroke="${INK}" stroke-width="1"/>`);
  parts.push(`<circle cx="${cx + 7}" cy="${cy}" r="2.6" fill="none" stroke="${INK}" stroke-width="1"/>`);
  parts.push(line(cx, cy - 17, cx, cy - 12, 1.2), line(cx, cy + 12, cx, cy + 17, 1.2));
  parts.push(text(x - 8, cy - 4, element.name, { size: 11, bold: true, anchor: "end" }));
  String(element.params?.description ?? "").split("\n").map((part) => part.trim()).filter(Boolean).slice(0, 4).forEach((row, index) => {
    parts.push(text(x - 8, cy + 9 + index * 10, row, { size: 8, anchor: "end" }));
  });
  return parts.join("");
}

function psu(element){
  if (element.params?.kind === "socket") return dinSocket(element);
  if (element.params?.kind === "ac") return transformer(element);
  const { x, y, width, height } = element;
  const ports = PSU_PORTS.dc;
  const [plus, minus] = psuOutputs(element);
  const parts = [box(x, y, width, height, 1.5)];
  ["L", "N", "PE"].forEach((label, index) => {
    parts.push(box(x + 4, y + ports.inputs[index] - 8, 20, 16, 1));
    parts.push(text(x + 14, y + ports.inputs[index] + 3, label, { size: 7, anchor: "middle" }));
  });
  [plus, minus].forEach((label, index) => {
    parts.push(box(x + width - 24, y + ports.outputs[index] - 8, 20, 16, 1));
    parts.push(text(x + width - 14, y + ports.outputs[index] + 4, label, { size: 9, anchor: "middle" }));
  });
  parts.push(line(x + 34, y + height - 4, x + width - 34, y + 4, 1));
  parts.push(text(x + 48, y + 26, "~", { size: 14, anchor: "middle" }));
  parts.push(text(x + width - 48, y + height - 12, "==", { size: 11, anchor: "middle" }));
  parts.push(text(x + width / 2, y - 18, element.name, { size: 11, bold: true, anchor: "middle" }));
  parts.push(text(x + width / 2, y - 5, element.params?.rating, { size: 8, anchor: "middle" }));
  return parts.join("");
}

function supply(element){
  const { x, y, width } = element;
  const parts = [];
  const slots = slotsOf(element).map((label, index) => label ? { label, cx: x + (index + 1) * SLOT } : null).filter(Boolean);
  if (!slots.length) return "";
  const first = slots[0].cx;
  const last = slots[slots.length - 1].cx;
  for (const { label, cx } of slots) {
    parts.push(line(cx, y, cx, y + 30));
    parts.push(text(cx + 3, y + 10, label, { size: 7 }));
  }
  parts.push(`<polygon points="${first - 10},${y + 30} ${last + 10},${y + 30} ${(first + last) / 2},${y + 52}" fill="none" stroke="${INK}" stroke-width="1.2"/>`);
  parts.push(text(x + width / 2, y + 68, element.params?.description, { size: 10, anchor: "middle" }));
  return parts.join("");
}

function relayCoil(element, refs){
  const { x, y } = element;
  const parts = [line(x + 20, y, x + 20, y + 20), box(x + 2, y + 20, 36, 20, 1.5), line(x + 20, y + 40, x + 20, y + 60)];
  parts.push(text(x + 23, y + 13, "A1", { size: 7 }));
  parts.push(text(x + 23, y + 55, "A2", { size: 7 }));
  parts.push(text(x + 44, y + 29, element.name, { size: 11, bold: true }));
  parts.push(text(x + 40, y + 42, element.params?.note, { size: 8 }));
  if (refs?.length) parts.push(text(x + 40, y + 54, `14 → ${refs.join(", ")}`, { size: 8, fill: "#475569" }));
  (element.params?.contacts ?? []).forEach((entry, index) => parts.push(contactMirror(x + 2, y + 172 + index * 26, entry)));
  return parts.join("");
}

function contactMirror(x, y, entry){
  const [common, no, nc] = entry.common ? [entry.common, entry.no, entry.nc] : String(entry.numbers ?? "").split(/[-/]/);
  const bx = x + 24;
  const parts = [text(x, y + 9, entry.ref, { size: 8 })];
  parts.push(text(bx + 2, y - 1, no, { size: 8 }));
  parts.push(line(bx, y + 2, bx + 14, y + 2, 1));
  if (nc) {
    parts.push(text(bx + 2, y + 12, nc, { size: 8 }));
    parts.push(line(bx, y + 15, bx + 16, y + 15, 1));
    parts.push(line(bx + 16, y + 15, bx + 16, y + 10, 1));
  }
  parts.push(line(bx + 16, y + 15, bx + 34, y + 7, 1));
  parts.push(line(bx + 34, y + 7, bx + 46, y + 7, 1));
  parts.push(text(bx + 38, y + 3, common, { size: 8 }));
  return parts.join("");
}

function relayContact(element, refs){
  const { x, y } = element;
  const parts = [
    line(x + 20, y + 40, x + 20, y + 16),
    line(x + 20, y + 16, x + 37, y + 6),
    line(x + 40, y + 40, x + 40, y + 16),
    line(x + 40, y + 16, x + 34, y + 16)
  ];
  parts.push(text(x + 17, y + 36, "11", { size: 7, anchor: "end" }));
  parts.push(text(x + 43, y + 36, "14", { size: 7 }));
  parts.push(text(x + 44, y + 12, element.name, { size: 11, bold: true }));
  if (refs?.length) parts.push(text(x + 44, y + 24, refs.join(", "), { size: 8, fill: "#475569" }));
  return parts.join("");
}

function busLine(element){
  const { x, y } = element;
  const count = Math.max(1, slotsOf(element).length);
  const cx = x + (count + 1) * SLOT / 2;
  const parts = [`<polygon points="${x + SLOT - 8},${y} ${x + count * SLOT + 8},${y} ${cx},${y + 30}" fill="none" stroke="${INK}" stroke-width="1.2"/>`];
  parts.push(line(cx, y + 30, cx, y + 70, 1.5));
  parts.push(line(cx - 4, y + 55, cx + 4, y + 45, 1));
  parts.push(text(cx + 10, y + 50, element.params?.cableType, { size: 8 }));
  parts.push(text(cx + 10, y + 63, element.params?.label, { size: 9 }));
  if (element.name) parts.push(text(cx + 10, y + 37, element.name, { size: 11, bold: true }));
  return parts.join("");
}

const DRAW = { controller, terminalStrip, cable, fieldDevice, relayCoil, relayContact, protection, psu, supply, changeover, busLine };

export function electricSvg(element, refs = null){
  return DRAW[element.type]?.(element, refs) ?? "";
}

const PREFIXES = { controller: "-N", relayCoil: "-K", fieldDevice: "-B", cable: "-W", protection: "-F", psu: "-T" };

export function nextElectricName(type, shapes){
  if (type === "terminalStrip") return ELECTRIC_DEFAULTS.terminalStrip.name;
  const prefix = PREFIXES[type] ?? "-K";
  const pattern = new RegExp(`^${prefix}(\\d+)$`);
  const kin = type === "relayContact" ? "relayCoil" : type;
  let top = 0;
  for (const shape of shapes) {
    if (shape.kind !== "equipment" || shape.type !== kin) continue;
    const match = String(shape.name ?? "").match(pattern);
    if (match) top = Math.max(top, Number(match[1]));
  }
  return `${prefix}${type === "relayContact" ? Math.max(1, top) : top + 1}`;
}

export function electricDefaults(type){
  return structuredClone(ELECTRIC_DEFAULTS[type]?.params ?? {});
}
