import { HYDRONIC_ELEMENTS } from "./elements.js";
import { rotationOf, rotateVector, uprightSize, toCanvasPoint } from "./frame.js";

export const BRANCH_GEOMETRY = {
  supplyX: 154.118,
  returnX: 215.709,
  supplyTop: 207.424,
  returnTop: 206.827,
  supplyBottom: 720.25,
  returnBottom: 780.752,
  hitHeight: 716
};

export const BRANCH_COLORS = {
  heating: { supply: "#e43a51", return: "#8e2331" },
  cooling: { supply: "#2a5ba7", return: "#1d3f72" }
};

export const BRANCH_LABELS = [
  { name: "temperature_range", label: "Temperature range", default: "xx/xx°C" },
  { name: "power", label: "Power", default: "Q: xx kW" },
  { name: "flow", label: "Flow", default: "q: xx l/h" }
];

export const BRANCH_CONFIG = [
  { name: "branch_type", label: "Branch type", type: "enum", options: ["Heating", "Cooling", "Combined"], default: "Heating" },
  { name: "cooling_heating_mode", label: "Mode node", type: "address", default: "", when: (params) => params.branch_type === "Combined" },
  { name: "supply_side_temperature_sensor", label: "Supply side temperature sensor", type: "bool", default: true },
  { name: "return_side_temperature_sensor", label: "Return side temperature sensor", type: "bool", default: true },
  { name: "pump_config", label: "Pump configuration", type: "enum", options: ["No Pump", "Supply Side", "Return Side"], default: "Supply Side" },
  { name: "energy_valve_config", label: "Valve configuration", type: "enum", options: ["No Valve", "Supply Side", "Return Side"], default: "Return Side" },
  { name: "valve_type", label: "Valve type", type: "enum", options: ["2-way", "3-way"], default: "2-way", when: (params) => params.energy_valve_config !== "No Valve" },
  { name: "energy_metering", label: "Energy metering (sensors and flow value)", type: "bool", default: true, when: (params) => params.energy_valve_config !== "No Valve" },
  { name: "bypass", label: "Bypass with check valve", type: "bool", default: true },
  { name: "flow_animation", label: "Flow animation", type: "bool", default: true }
];

export function isBranch(shape){
  return shape?.kind === "equipment" && !!HYDRONIC_ELEMENTS[shape.type]?.branch;
}

export function isBar(shape){
  return shape?.kind === "equipment" && !!HYDRONIC_ELEMENTS[shape.type]?.bar;
}

export function branchDefaults(){
  return Object.fromEntries([...BRANCH_LABELS, ...BRANCH_CONFIG].map((field) => [field.name, field.default]));
}

export function branchParams(element){
  return { ...branchDefaults(), ...(element.params ?? {}) };
}

export function branchColors(params){
  return params.branch_type === "Cooling" ? BRANCH_COLORS.cooling : BRANCH_COLORS.heating;
}

export function branchArgs(element){
  const params = branchParams(element);
  const args = { branch_name: element.name ?? "" };
  for (const field of [...BRANCH_LABELS, ...BRANCH_CONFIG]) {
    const value = params[field.name];
    if (field.type === "address" && !value) continue;
    args[field.name] = typeof value === "boolean" ? String(value) : value;
  }
  return args;
}

function scale(element){
  const spec = HYDRONIC_ELEMENTS[element.type];
  return { sx: element.width / spec.width, sy: element.height / spec.height };
}

/*
export function branchAnchors(element){
  const { sx, sy } = scale(element);
  return {
    supply: { x: element.x + BRANCH_GEOMETRY.supplyX * sx, y: element.y + BRANCH_GEOMETRY.supplyBottom * sy },
    return: { x: element.x + BRANCH_GEOMETRY.returnX * sx, y: element.y + BRANCH_GEOMETRY.returnBottom * sy }
  };
}

function onBar(point, bar, radius){
  return point.x >= bar.x && point.x <= bar.x + bar.width && Math.abs(point.y - bar.y) <= radius;
}

export function snapBranch(element, shapes, radius){
  const anchors = branchAnchors(element);
  let best = null;
  for (const bar of shapes) {
    if (!isBar(bar) || bar.id === element.id) continue;
    for (const key of ["supply", "return"]) {
      const anchor = anchors[key];
      if (!onBar(anchor, bar, radius)) continue;
      const dy = bar.y - anchor.y;
      const score = Math.abs(dy) + (key === "supply" ? 0 : 0.01);
      if (!best || score < best.score) best = { dy, score };
    }
  }
  return { x: element.x, y: best ? Math.round((element.y + best.dy) * 1000) / 1000 : element.y };
}

export function alignBranch(element, snap){
  const { sx } = scale(element);
  const supply = element.x + BRANCH_GEOMETRY.supplyX * sx;
  return { ...element, x: Math.round((element.x + snap(supply) - supply) * 1000) / 1000 };
}

export function branchRiders(shapes, ids){
  const bars = shapes.filter((shape) => ids.includes(shape.id) && isBar(shape));
  if (!bars.length) return [];
  return shapes
    .filter((shape) => isBranch(shape) && !ids.includes(shape.id))
    .filter((shape) => {
      const anchors = branchAnchors(shape);
      return bars.some((bar) => onBar(anchors.supply, bar, 1) || onBar(anchors.return, bar, 1));
    })
    .map((shape) => shape.id);
}

export function branchGaps(shapes, size){
  const gaps = [];
  const bars = shapes.filter(isBar);
  for (const branch of shapes.filter(isBranch)) {
    const { sx, sy } = scale(branch);
    const legs = [
      [BRANCH_GEOMETRY.supplyX, BRANCH_GEOMETRY.supplyTop, BRANCH_GEOMETRY.supplyBottom],
      [BRANCH_GEOMETRY.returnX, BRANCH_GEOMETRY.returnTop, BRANCH_GEOMETRY.returnBottom]
    ];
    for (const [legX, legTop, legBottom] of legs) {
      const x = branch.x + legX * sx;
      const top = branch.y + legTop * sy;
      const bottom = branch.y + legBottom * sy;
      for (const bar of bars) {
        if (x <= bar.x || x >= bar.x + bar.width) continue;
        if (bar.y <= top || bar.y + bar.height >= bottom - 0.5) continue;
        gaps.push({ branchId: branch.id, barId: bar.id, x: x - size / 2, y: bar.y, width: size, height: bar.height });
      }
    }
  }
  return gaps;
}
*/

const DOWN = { x: 0, y: 1 };

function legPoint(element, x, y){
  const spec = HYDRONIC_ELEMENTS[element.type];
  const upright = uprightSize(element);
  return toCanvasPoint(element, x * upright.width / spec.width, y * upright.height / spec.height);
}

export function branchAnchors(element){
  const direction = rotateVector(DOWN, rotationOf(element));
  return {
    supply: { ...legPoint(element, BRANCH_GEOMETRY.supplyX, BRANCH_GEOMETRY.supplyBottom), direction },
    return: { ...legPoint(element, BRANCH_GEOMETRY.returnX, BRANCH_GEOMETRY.returnBottom), direction }
  };
}

function barEdge(bar, direction){
  if (direction.y > 0.5) return { axis: "y", value: bar.y };
  if (direction.y < -0.5) return { axis: "y", value: bar.y + bar.height };
  if (direction.x > 0.5) return { axis: "x", value: bar.x };
  return { axis: "x", value: bar.x + bar.width };
}

function onBar(point, bar, radius){
  const edge = barEdge(bar, point.direction ?? DOWN);
  const across = edge.axis === "y"
    ? point.x >= bar.x && point.x <= bar.x + bar.width
    : point.y >= bar.y && point.y <= bar.y + bar.height;
  return across && Math.abs(point[edge.axis] - edge.value) <= radius;
}

export function snapBranch(element, shapes, radius){
  const anchors = branchAnchors(element);
  let best = null;
  for (const bar of shapes) {
    if (!isBar(bar) || bar.id === element.id) continue;
    for (const key of ["supply", "return"]) {
      const anchor = anchors[key];
      if (!onBar(anchor, bar, radius)) continue;
      const edge = barEdge(bar, anchor.direction);
      const shift = edge.value - anchor[edge.axis];
      const score = Math.abs(shift) + (key === "supply" ? 0 : 0.01);
      if (!best || score < best.score) best = { axis: edge.axis, shift, score };
    }
  }
  const settle = (value) => Math.round(value * 1000) / 1000;
  if (!best) return { x: element.x, y: element.y };
  return best.axis === "x"
    ? { x: settle(element.x + best.shift), y: element.y }
    : { x: element.x, y: settle(element.y + best.shift) };
}

export function alignBranch(element, snap){
  const supply = legPoint(element, BRANCH_GEOMETRY.supplyX, BRANCH_GEOMETRY.supplyBottom);
  const direction = rotateVector(DOWN, rotationOf(element));
  const settle = (value) => Math.round(value * 1000) / 1000;
  return Math.abs(direction.y) > 0.5
    ? { ...element, x: settle(element.x + snap(supply.x) - supply.x) }
    : { ...element, y: settle(element.y + snap(supply.y) - supply.y) };
}

export function branchRiders(shapes, ids){
  const bars = shapes.filter((shape) => ids.includes(shape.id) && isBar(shape));
  if (!bars.length) return [];
  return shapes
    .filter((shape) => isBranch(shape) && !ids.includes(shape.id))
    .filter((shape) => {
      const anchors = branchAnchors(shape);
      return bars.some((bar) => onBar(anchors.supply, bar, 1) || onBar(anchors.return, bar, 1));
    })
    .map((shape) => shape.id);
}

export function branchGaps(shapes, size){
  const gaps = [];
  const bars = shapes.filter(isBar);
  for (const branch of shapes.filter(isBranch)) {
    const legs = [
      [BRANCH_GEOMETRY.supplyX, BRANCH_GEOMETRY.supplyTop, BRANCH_GEOMETRY.supplyBottom],
      [BRANCH_GEOMETRY.returnX, BRANCH_GEOMETRY.returnTop, BRANCH_GEOMETRY.returnBottom]
    ];
    for (const [legX, legTop, legBottom] of legs) {
      const a = legPoint(branch, legX, legTop);
      const b = legPoint(branch, legX, legBottom);
      const upright = Math.abs(a.x - b.x) < 0.5;
      const low = upright ? Math.min(a.y, b.y) : Math.min(a.x, b.x);
      const high = upright ? Math.max(a.y, b.y) : Math.max(a.x, b.x);
      for (const bar of bars) {
        if (upright) {
          if (a.x <= bar.x || a.x >= bar.x + bar.width) continue;
          if (bar.y <= low + 0.5 || bar.y + bar.height >= high - 0.5) continue;
          gaps.push({ branchId: branch.id, barId: bar.id, x: a.x - size / 2, y: bar.y, width: size, height: bar.height });
        } else {
          if (a.y <= bar.y || a.y >= bar.y + bar.height) continue;
          if (bar.x <= low + 0.5 || bar.x + bar.width >= high - 0.5) continue;
          gaps.push({ branchId: branch.id, barId: bar.id, x: bar.x, y: a.y - size / 2, width: bar.width, height: size });
        }
      }
    }
  }
  return gaps;
}
