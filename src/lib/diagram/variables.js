import { HYDRONIC_ELEMENTS, METER_MEASURES } from "./elements.js";
import { readoutRows } from "./readout.js";
import { TANK_PROBES, hasTankProbes } from "./tank.js";

const NAME = /^[A-Za-z_][\w.]*$/;

export function nodePath(prefix, name){
  const clean = String(name ?? "").trim().replace(/^\.+|\.+$/g, "");
  if (!clean) return null;
  const root = String(prefix ?? "").trim().replace(/^\.+|\.+$/g, "");
  return root ? `${root}.${clean}` : clean;
}

export function parseVariableNames(text){
  const rows = String(text ?? "").split(/\r?\n/).map((line) => line.split("\t").map((cell) => cell.trim()));
  const tableRow = (cells) => cells.length >= 3 && /^\d+$/.test(cells[1]) && NAME.test(cells[2]);
  const tabled = rows.some(tableRow);
  const names = [];
  for (const cells of rows) {
    const name = tabled ? (tableRow(cells) ? cells[2] : null) : (cells.filter(Boolean).length === 1 ? cells.find(Boolean) : null);
    if (name && NAME.test(name) && !names.includes(name)) names.push(name);
  }
  return names;
}

function rowLabel(row){
  if (row.kind === "setpoint") return "Setpoint";
  if (row.kind === "value") return "Value";
  return METER_MEASURES.find((measure) => measure.id === row.kind)?.name ?? row.kind;
}

export function elementSlots(element){
  const slots = [{ key: "self", label: HYDRONIC_ELEMENTS[element.type]?.label ?? "Element", value: element.variable ?? "" }];
  if (hasTankProbes(element)) {
    for (const probe of TANK_PROBES) {
      if (element.probes?.[probe.id]) slots.push({ key: `probe:${probe.id}`, label: `${probe.label} probe`, value: element.probeVariables?.[probe.id] ?? "" });
    }
  }
  return slots;
}

export function fittingSlots(fitting){
  const slots = [{ key: "self", label: HYDRONIC_ELEMENTS[fitting.type]?.label ?? "Element", value: fitting.variable ?? "" }];
  for (const row of readoutRows(fitting)) slots.push({ key: `readout:${row.kind}`, label: `${rowLabel(row)} box`, value: fitting.readoutVariables?.[row.kind] ?? "" });
  return slots;
}

export function setSlot(target, key, value){
  const name = value.trim();
  const [kind, id] = key.split(":");
  if (kind === "self") {
    if (name) target.variable = name;
    else delete target.variable;
    return;
  }
  const field = kind === "probe" ? "probeVariables" : "readoutVariables";
  const next = { ...(target[field] ?? {}) };
  if (name) next[id] = name;
  else delete next[id];
  if (Object.keys(next).length) target[field] = next;
  else delete target[field];
}

export function variableUsage(shapes){
  const usage = new Map();
  const add = (name, where) => {
    if (!name) return;
    if (!usage.has(name)) usage.set(name, []);
    usage.get(name).push(where);
  };
  for (const shape of shapes) {
    if (shape.kind === "equipment") {
      const label = shape.name || HYDRONIC_ELEMENTS[shape.type]?.label || "Element";
      add(shape.variable, label);
      for (const [probe, name] of Object.entries(shape.probeVariables ?? {})) add(name, `${label} · ${probe} probe`);
    }
    if (shape.kind === "pipe") {
      for (const fitting of shape.fittings ?? []) {
        const label = fitting.name || HYDRONIC_ELEMENTS[fitting.type]?.label || "Element";
        add(fitting.variable, label);
        for (const [row, name] of Object.entries(fitting.readoutVariables ?? {})) add(name, `${label} · ${row}`);
      }
    }
  }
  return usage;
}

export function carryLinks(fittings, previous){
  return fittings.map((fitting) => {
    if (!fitting.auto) return fitting;
    const old = previous.find((entry) => entry.auto && entry.type === fitting.type && (entry.meter ?? null) === (fitting.meter ?? null));
    if (!old || (!old.variable && !old.readoutVariables)) return fitting;
    return { ...fitting, ...(old.variable ? { variable: old.variable } : {}), ...(old.readoutVariables ? { readoutVariables: old.readoutVariables } : {}) };
  });
}
