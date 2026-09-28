import { escapeXml } from "../export/atvise.js";

export const SLOT = 20;

const INK = "#1E293B";
const FONT = "Arial, Helvetica, sans-serif";

export const ELECTRIC_DEFAULTS = {
  controller: { name: "-N1", params: { model: "Controller", terminals: ["G", "G0", "", "U1", "GND"] } },
  terminalStrip: { name: "-X2", params: { terminals: ["1", "2"] } },
  cable: { name: "-W1", params: { conductors: ["1", "2"], cableType: "J-H(St)H 2x2x0,8mm2" } },
  relayCoil: { name: "-K1", params: { note: "" } },
  relayContact: { name: "-K1", params: {} },
  fieldDevice: { name: "-B1", params: { terminals: ["1", "2"], model: "", description: "" } }
};

const SLOTTED = {
  controller: { key: "terminals", sides: ["bottom"] },
  terminalStrip: { key: "terminals", sides: ["top", "bottom"] },
  cable: { key: "conductors", sides: ["top", "bottom"] },
  fieldDevice: { key: "terminals", sides: ["top"] }
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
  if (type === "fieldDevice") return { width: Math.max(140, span), height: 80 };
  if (type === "relayCoil") return { width: 40, height: 60 };
  if (type === "relayContact") return { width: 60, height: 40 };
  return { width: 40, height: 40 };
}

export function electricPorts(element){
  const spec = SLOTTED[element.type];
  if (spec) {
    return slotsOf(element).flatMap((label, index) => label
      ? spec.sides.map((side) => ({ side, offset: (index + 1) * SLOT, label }))
      : []);
  }
  if (element.type === "relayCoil") return [{ side: "top", offset: 20, label: "A1" }, { side: "bottom", offset: 20, label: "A2" }];
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
  slotsOf(element).forEach((label, index) => {
    if (!label) return;
    const cx = x + (index + 1) * SLOT;
    parts.push(box(cx - SLOT / 2, y + height - 20, SLOT, 20, 1));
    parts.push(text(cx, y + height - 6, label, { size: label.length > 3 ? 7 : 8, anchor: "middle" }));
  });
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
  parts.push(line(x + 8, y + 20, x + last + 8, y + 20, 1));
  slots.forEach((label, index) => {
    if (!label) return;
    const cx = x + (index + 1) * SLOT;
    parts.push(line(cx, y, cx, y + 40));
    parts.push(line(cx - 4, y + 25, cx + 4, y + 15, 1));
    parts.push(text(cx + 3, y + 13, label, { size: 7 }));
  });
  parts.push(text(x + last + 14, y + 17, element.name, { size: 11, bold: true }));
  parts.push(text(x + last + 14, y + 32, element.params?.cableType, { size: 8 }));
  return parts.join("");
}

function fieldDevice(element){
  const { x, y, width, height } = element;
  const parts = [box(x, y, width, height, 1.5)];
  slotsOf(element).forEach((label, index) => {
    if (!label) return;
    const cx = x + (index + 1) * SLOT;
    parts.push(box(cx - SLOT / 2, y, SLOT, 16, 1));
    parts.push(text(cx, y + 12, label, { size: label.length > 3 ? 6 : 7, anchor: "middle" }));
  });
  parts.push(text(x + 6, y + 34, element.name, { size: 11, bold: true }));
  parts.push(text(x + 6, y + height - 8, element.params?.model, { size: 8 }));
  wrap(element.params?.description, Math.max(12, Math.floor(width / 6.2))).slice(0, 4).forEach((row, index) => {
    parts.push(text(x + width / 2, y + height + 14 + index * 12, row, { size: 9, anchor: "middle" }));
  });
  return parts.join("");
}

function relayCoil(element, refs){
  const { x, y } = element;
  const parts = [line(x + 20, y, x + 20, y + 20), box(x + 6, y + 20, 28, 20, 1.5), line(x + 20, y + 40, x + 20, y + 60)];
  parts.push(text(x + 23, y + 13, "A1", { size: 7 }));
  parts.push(text(x + 23, y + 55, "A2", { size: 7 }));
  parts.push(text(x + 40, y + 29, element.name, { size: 11, bold: true }));
  parts.push(text(x + 40, y + 42, element.params?.note, { size: 8 }));
  if (refs?.length) parts.push(text(x + 40, y + 54, `14 → ${refs.join(", ")}`, { size: 8, fill: "#475569" }));
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

const DRAW = { controller, terminalStrip, cable, fieldDevice, relayCoil, relayContact };

export function electricSvg(element, refs = null){
  return DRAW[element.type]?.(element, refs) ?? "";
}

const PREFIXES = { controller: "-N", relayCoil: "-K", fieldDevice: "-B", cable: "-W" };

export function nextElectricName(type, shapes){
  if (type === "terminalStrip") return ELECTRIC_DEFAULTS.terminalStrip.name;
  const prefix = PREFIXES[type] ?? "-K";
  const pattern = new RegExp(`^${prefix}(\d+)$`);
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
