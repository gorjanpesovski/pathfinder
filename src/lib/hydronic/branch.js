import { HYDRONIC_ELEMENTS } from "./elements.js";
import { portPose } from "./route.js";
import { fittingPose } from "./geometry.js";
import { carryLinks } from "./variables.js";

export const BRANCH_HEADER = {
  width: 240,
  height: 210,
  supply: 90,
  return: 150,
  drain: { outer: 30.84, inner: 17.62, stroke: 6 },
  texts: [40.75, 77.7, 114.65, 151.6]
};

export const BRANCH_PORTS = { bottom: [BRANCH_HEADER.supply / BRANCH_HEADER.width, BRANCH_HEADER.return / BRANCH_HEADER.width] };

const LEG = { supply: 510, return: 571 };

const AT = {
  sensor: 85.46,
  pump: 177.86,
  bypass: 232.79,
  valve: 351,
  meterOther: 292,
  meterSame: 400
};

const SCALE = { pump: 1.05, tempProbe: 0.71, controlValve: 0.56, threeWayValve: 0.56, energyValve: 0.9, checkValve: 0.71, meterSensor: 1 };

const TEXT = { size: 22, gap: 37, lift: 58.4 };

const LAYOUT = 3;

const READOUT_GAP = 12;

function sideOf(element, role){
  const supply = legTop(element, "supply").x;
  const ret = legTop(element, "return").x;
  const outward = role === "supply" ? Math.sign(supply - ret) : Math.sign(ret - supply);
  return outward || (role === "supply" ? -1 : 1);
}

function readoutAt(element, role, halfWidth, boxWidth){
  return { x: Math.round(sideOf(element, role) * (halfWidth + READOUT_GAP + boxWidth / 2)), y: 0 };
}

const WIDTH = { leg: 7, bypass: 4 };

export const BRANCH_LABELS = [
  { name: "temperature_range", label: "Temperature range", default: "xx/xx°C" },
  { name: "power", label: "Power", default: "Q: xx kW" },
  { name: "flow", label: "Flow", default: "q: xx l/h" }
];

export const BRANCH_CONFIG = [
  { name: "branch_type", label: "Branch type", type: "enum", options: ["Heating", "Cooling", "Combined"], default: "Heating" },
  { name: "cooling_heating_mode", label: "Mode node", type: "address", default: "", when: (params) => params.branch_type === "Combined" },
  { name: "supply_side_temperature_sensor", label: "Supply temperature sensor", type: "bool", default: true, group: "sensors" },
  { name: "return_side_temperature_sensor", label: "Return temperature sensor", type: "bool", default: true, group: "sensors" },
  { name: "pump_config", label: "Pump", type: "enum", options: ["No Pump", "Supply Side", "Return Side"], default: "Supply Side", group: "equipment" },
  { name: "energy_valve_config", label: "Valve", type: "enum", options: ["No Valve", "Supply Side", "Return Side"], default: "Return Side", group: "equipment" },
  { name: "valve_type", label: "Valve type", type: "enum", options: ["2-way", "3-way"], default: "2-way", group: "equipment", when: (params) => params.energy_valve_config !== "No Valve" },
  { name: "energy_metering", label: "Energy metering", type: "bool", default: true, group: "equipment", when: (params) => params.energy_valve_config !== "No Valve" },
  { name: "bypass", label: "Bypass with check valve", type: "bool", default: true, group: "equipment" }
];

export function isBranch(shape){
  return shape?.kind === "equipment" && !!HYDRONIC_ELEMENTS[shape.type]?.branch;
}

export function isBar(shape){
  return shape?.kind === "equipment" && !!HYDRONIC_ELEMENTS[shape.type]?.bar;
}

export function branchDefaults(){
  return { ...Object.fromEntries([...BRANCH_LABELS, ...BRANCH_CONFIG].map((field) => [field.name, field.default])), layout: LAYOUT };
}

export function branchParams(element){
  return { ...branchDefaults(), ...(element.params ?? {}) };
}

export function branchMedia(params){
  return params.branch_type === "Cooling"
    ? { supply: "coldSupply", return: "coldReturn" }
    : { supply: "hotSupply", return: "hotReturn" };
}

function side(value){
  return value === "Return Side" ? "return" : value === "Supply Side" ? "supply" : null;
}

export function branchScale(element){
  return element.width / BRANCH_HEADER.width;
}

export function ownedPipes(shapes, branchId){
  return shapes.filter((shape) => shape.kind === "pipe" && shape.branchOf === branchId);
}

export function branchPipeIds(shapes, ids){
  const chosen = new Set(ids);
  return shapes.filter((shape) => shape.kind === "pipe" && chosen.has(shape.branchOf)).map((shape) => shape.id);
}

function legPort(role, element){
  const offset = (role === "supply" ? BRANCH_HEADER.supply : BRANCH_HEADER.return) * branchScale(element);
  return { id: element.id, side: "bottom", offset: Math.round(offset * 1000) / 1000 };
}

function legTop(element, role){
  return portPose(element, legPort(role, element)).point;
}

function legEnd(pipe){
  return pipe.role === "supply" ? pipe.from : pipe.to;
}

export function isLeg(pipe){
  return pipe?.branchOf !== undefined && (pipe.role === "supply" || pipe.role === "return");
}

export function branchLegEnds(shapes, branch){
  const ends = {};
  for (const pipe of ownedPipes(shapes, branch.id)) {
    if (!isLeg(pipe)) continue;
    const end = legEnd(pipe);
    if (end && end.id === undefined && end.pipe === undefined) ends[pipe.role] = { x: legTop(branch, pipe.role).x, y: end.y };
  }
  return ends;
}

function legLength(element, pipe){
  const top = legTop(element, pipe.role);
  const end = legEnd(pipe);
  return Math.max(1, Math.abs(end.y - top.y));
}

function along(element, pipe, distance){
  const length = legLength(element, pipe);
  const fraction = Math.min(0.98, Math.max(0.02, distance / length));
  const t = pipe.role === "supply" ? 1 - fraction : fraction;
  return Math.round(t * 10000) / 10000;
}

function sizeOf(element){
  return Math.min(branchScale(element), element.height / BRANCH_HEADER.height);
}

function scaleOf(type, element){
  const size = sizeOf(element);
  return Math.round((SCALE[type] ?? 1) * size * 1000) / 1000;
}

export function createBranch(element, nextId){
  const s = branchScale(element);
  const params = branchParams(element);
  const media = branchMedia(params);
  const legs = ["supply", "return"].map((role) => {
    const top = legTop(element, role);
    const bottom = { x: top.x, y: Math.round((top.y + LEG[role] * s) * 1000) / 1000 };
    const port = legPort(role, element);
    return {
      id: nextId(),
      kind: "pipe",
      branchOf: element.id,
      role,
      from: role === "supply" ? bottom : port,
      to: role === "supply" ? port : bottom,
      points: [],
      medium: media[role],
      width: Math.round(WIDTH.leg * sizeOf(element) * 100) / 100
    };
  });
  return rebuildBranch(element, [...legs], nextId);
}

function autoFitting(nextId, type, t, extra = {}){
  return { id: nextId(), type, t, auto: true, nameHidden: true, ...extra };
}

function crossPipe(element, legs, role, distance, medium, width, nextId, existing){
  const supply = legs.supply;
  const ret = legs.return;
  const a = legTop(element, "supply");
  const b = legTop(element, "return");
  const y = Math.round((a.y + distance) * 1000) / 1000;
  const pipe = existing ?? { id: nextId(), kind: "pipe", branchOf: element.id, role, points: [], fittings: [] };
  return {
    ...pipe,
    from: { pipe: supply.id, x: a.x, y },
    to: { pipe: ret.id, x: b.x, y },
    medium,
    width
  };
}

export function rebuildBranch(element, pipes, nextId){
  const s = branchScale(element);
  const params = branchParams(element);
  const media = branchMedia(params);
  const legs = {
    supply: pipes.find((pipe) => pipe.role === "supply"),
    return: pipes.find((pipe) => pipe.role === "return")
  };
  if (!legs.supply || !legs.return) return pipes;
  const k = legLength(element, legs.supply) / LEG.supply;
  const pumpSide = side(params.pump_config);
  const valveSide = side(params.energy_valve_config);
  const threeWay = params.valve_type === "3-way";
  const keep = (pipe) => (pipe.fittings ?? []).filter((fitting) => !fitting.auto);
  const next = [];

  for (const role of ["supply", "return"]) {
    const leg = legs[role];
    const fittings = keep(leg);
    const probe = role === "supply" ? params.supply_side_temperature_sensor : params.return_side_temperature_sensor;
    const previous = (leg.fittings ?? []).find((fitting) => fitting.auto && fitting.type === "tempProbe");
    if (probe) {
      fittings.push(autoFitting(nextId, "tempProbe", along(element, leg, AT.sensor * k), {
        scale: scaleOf("tempProbe", element),
        readout: previous?.readout ?? (role === "supply" ? "both" : "value"),
        readoutOffset: previous?.readoutOffset ?? readoutAt(element, role, 20 * scaleOf("tempProbe", element), (previous?.readout ?? (role === "supply" ? "both" : "value")) === "both" ? 138 : 100),
        ...(previous?.readoutScale ? { readoutScale: previous.readoutScale } : {})
      }));
    }
    if (pumpSide === role) fittings.push(autoFitting(nextId, "pump", along(element, leg, AT.pump * k), { scale: scaleOf("pump", element) }));
    if (valveSide === role) {
      const type = threeWay ? "threeWayValve" : params.energy_metering ? "energyValve" : "controlValve";
      const oldValve = (leg.fittings ?? []).find((fitting) => fitting.auto && (fitting.type === "controlValve" || fitting.type === "threeWayValve" || fitting.type === "energyValve"));
      fittings.push(autoFitting(nextId, type, along(element, leg, AT.valve * k), {
        scale: scaleOf(type, element),
        flip: type === "energyValve" ? false : role === "return",
        readout: params.energy_metering ? (oldValve?.readout ?? "value") : "none",
        ...(oldValve?.type === type && oldValve.readouts ? { readouts: oldValve.readouts } : {}),
        ...(oldValve?.type === type && oldValve.flip !== undefined ? { flip: oldValve.flip } : {}),
        ...(oldValve?.readoutScale ? { readoutScale: oldValve.readoutScale } : {}),
        readoutOffset: oldValve?.readoutOffset ?? readoutAt(element, role, type === "energyValve" ? 14 * scaleOf(type, element) : 50 * scaleOf(type, element), 100)
      }));
    }
    if (valveSide && params.energy_metering) {
      const head = !threeWay ? AT.valve * k - (101.8 - 36.35) * scaleOf("energyValve", element) : AT.meterOther * k;
      const distance = valveSide === role ? AT.meterSame * k : head;
      fittings.push(autoFitting(nextId, "meterSensor", along(element, leg, distance), { scale: scaleOf("meterSensor", element), meter: valveSide === role ? "same" : "other" }));
    }
    next.push({ ...leg, medium: media[role], fittings: carryLinks(fittings, leg.fittings ?? []) });
  }

  const bypass = pipes.find((pipe) => pipe.role === "bypass");
  if (params.bypass) {
    const pipe = crossPipe(element, legs, "bypass", AT.bypass * k, media.supply, Math.round(WIDTH.bypass * sizeOf(element) * 100) / 100, nextId, bypass);
    next.push({ ...pipe, fittings: carryLinks([...keep(pipe), autoFitting(nextId, "checkValve", 0.5, { scale: scaleOf("checkValve", element), flip: true })], bypass?.fittings ?? []) });
  }

  const mix = pipes.find((pipe) => pipe.role === "mix");
  if (valveSide && threeWay) {
    const pipe = crossPipe(element, legs, "mix", AT.valve * k, media.return, Math.round(WIDTH.leg * sizeOf(element) * 100) / 100, nextId, mix);
    next.push({ ...pipe, fittings: keep(pipe) });
  }

  for (const pipe of pipes) {
    if (pipe.role !== "supply" && pipe.role !== "return" && pipe.role !== "bypass" && pipe.role !== "mix") next.push(pipe);
  }
  return next;
}

export function branchHeaderParts(element){
  const params = branchParams(element);
  const supply = legTop(element, "supply");
  const ret = legTop(element, "return");
  const cx = (supply.x + ret.x) / 2;
  const cy = element.y + element.height;
  const outer = Math.abs(ret.x - supply.x) / 2;
  const ratio = outer / BRANCH_HEADER.drain.outer;
  const stroke = Math.min(BRANCH_HEADER.drain.stroke, BRANCH_HEADER.drain.stroke * ratio);
  const muted = "#8D8D8E";
  const lines = [
    { text: element.name ?? "", bold: true, color: "#414142" },
    { text: params.temperature_range, color: muted },
    { text: params.power, color: muted },
    { text: params.flow, color: muted }
  ];
  const k = branchScale(element);
  const last = cy - Math.max(outer + stroke / 2 + 10 * k, TEXT.lift * k);
  return [
    ...lines.map((line, index) => ({ kind: "text", text: line.text, x: cx, baseline: last - (lines.length - 1 - index) * TEXT.gap * k, size: TEXT.size * k, bold: !!line.bold, color: line.color, align: "center" })),
    { kind: "drain", cx, cy, outer, inner: BRANCH_HEADER.drain.inner * ratio, stroke }
  ];
}

export function meterWires(shapes, routes){
  const wires = [];
  for (const branch of shapes.filter(isBranch)) {
    const params = branchParams(branch);
    const valveSide = side(params.energy_valve_config);
    if (!valveSide || !params.energy_metering) continue;
    const pipes = ownedPipes(shapes, branch.id);
    const legs = Object.fromEntries(pipes.filter(isLeg).map((pipe) => [pipe.role, pipe]));
    const valveLeg = legs[valveSide];
    const otherLeg = legs[valveSide === "supply" ? "return" : "supply"];
    const valve = valveLeg?.fittings?.find((fitting) => fitting.auto && ["energyValve", "threeWayValve", "controlValve"].includes(fitting.type));
    if (!valve || !otherLeg || !routes.get(valveLeg.id) || !routes.get(otherLeg.id)) continue;
    const pose = fittingPose(routes.get(valveLeg.id), valve);
    const k = valve.scale ?? 1;
    const up = valve.type === "energyValve" && valve.flip ? -1 : 1;
    const head = valve.type === "energyValve"
      ? { x: pose.x, y: pose.y - up * (101.8 - 36.35) * k, half: 20 * k }
      : { x: pose.x, y: pose.y, half: 10 * k };
    const same = valveLeg.fittings.find((fitting) => fitting.auto && fitting.meter === "same");
    const other = otherLeg.fittings.find((fitting) => fitting.auto && fitting.meter === "other");
    const inward = Math.sign((legTop(branch, valveSide === "supply" ? "return" : "supply").x) - pose.x) || 1;
    if (other) {
      const target = fittingPose(routes.get(otherLeg.id), other);
      const radius = 11 * (other.scale ?? 1);
      wires.push([{ x: head.x + inward * head.half, y: target.y }, { x: target.x - inward * radius, y: target.y }]);
    }
    if (same) {
      const target = fittingPose(routes.get(valveLeg.id), same);
      const radius = 11 * (same.scale ?? 1);
      const inner = head.x + inward * (head.half + 4 * k);
      const start = head.y + up * 16 * k;
      wires.push([
        { x: head.x + inward * head.half, y: start },
        { x: inner, y: start },
        { x: inner, y: target.y },
        { x: target.x + inward * radius, y: target.y }
      ]);
    }
  }
  return wires;
}

const DOWN = { x: 0, y: 1 };

function onBar(point, bar, radius){
  const across = point.x >= bar.x && point.x <= bar.x + bar.width;
  return across && Math.abs(point.y - bar.y) <= radius;
}

export function snapBranch(ends, shapes, radius, skip = new Set()){
  let best = null;
  for (const bar of shapes) {
    if (!isBar(bar) || skip.has(bar.id)) continue;
    for (const key of ["supply", "return"]) {
      const end = ends[key];
      if (!end || !onBar(end, bar, radius)) continue;
      const shift = bar.y - end.y;
      const score = Math.abs(shift) + (key === "supply" ? 0 : 0.01);
      if (!best || score < best.score) best = { shift, score };
    }
  }
  return best ? Math.round(best.shift * 1000) / 1000 : 0;
}

export function alignBranch(element, snap){
  const x = element.x + BRANCH_HEADER.supply * branchScale(element);
  return { ...element, x: Math.round((element.x + snap(x) - x) * 1000) / 1000 };
}

export function branchRiders(shapes, ids){
  const bars = shapes.filter((shape) => ids.includes(shape.id) && isBar(shape));
  if (!bars.length) return [];
  const riders = shapes
    .filter((shape) => isBranch(shape) && !ids.includes(shape.id))
    .filter((shape) => {
      const ends = branchLegEnds(shapes, shape);
      return bars.some((bar) => (ends.supply && onBar(ends.supply, bar, 1)) || (ends.return && onBar(ends.return, bar, 1)));
    })
    .map((shape) => shape.id);
  return [...riders, ...branchPipeIds(shapes, riders)];
}

export function refreshBranches(shapes, nextId){
  let next = shapes;
  for (const branch of shapes.filter((shape) => isBranch(shape) && shape.params?.layout && shape.params.layout < LAYOUT)) {
    const updated = { ...branch, params: { ...branch.params, layout: LAYOUT } };
    const owned = ownedPipes(next, branch.id).map((pipe) => {
      const clean = { ...pipe, fittings: (pipe.fittings ?? []).map(({ readoutOffset, ...fitting }) => fitting) };
      if (pipe.role === "supply") clean.to = legPort("supply", updated);
      if (pipe.role === "return") clean.from = legPort("return", updated);
      return clean;
    });
    next = next.map((shape) => shape === branch ? updated : shape);
    if (!owned.length) continue;
    const rebuilt = rebuildBranch(updated, owned, nextId);
    next = [...next.filter((shape) => !(shape.kind === "pipe" && shape.branchOf === branch.id)), ...rebuilt];
  }
  return next;
}

export function keepLegDistances(element, pipe, before){
  const after = legLength(element, pipe);
  if (!after || !before || after === before) return pipe.fittings;
  return (pipe.fittings ?? []).map((fitting) => {
    const fromTop = pipe.role === "supply" ? (1 - fitting.t) * before : fitting.t * before;
    const fraction = Math.min(0.99, Math.max(0.01, fromTop / after));
    return { ...fitting, t: Math.round((pipe.role === "supply" ? 1 - fraction : fraction) * 10000) / 10000 };
  });
}

export function legSpan(element, pipe){
  return legLength(element, pipe);
}

export function migrateBranches(shapes, nextId){
  const legacy = shapes.filter((shape) => isBranch(shape) && !shape.params?.layout);
  if (!legacy.length) return refreshBranches(shapes, nextId);
  const next = shapes.filter((shape) => !legacy.includes(shape));
  for (const old of legacy) {
    const sx = old.width / 340;
    const sy = old.height / 800;
    const element = {
      ...old,
      rotation: 0,
      x: Math.round((old.x + 65.333 * sx + BRANCH_HEADER.supply) / 20) * 20 - BRANCH_HEADER.supply,
      y: old.y,
      width: Math.round(BRANCH_HEADER.width * sx * 1000) / 1000,
      height: Math.round(BRANCH_HEADER.height * sy * 1000) / 1000,
      params: { ...(old.params ?? {}), layout: LAYOUT }
    };
    const pipes = createBranch(element, nextId).map((pipe) => {
      if (pipe.role !== "supply" && pipe.role !== "return") return pipe;
      const end = legEnd(pipe);
      const target = { ...end, y: Math.round((old.y + (pipe.role === "supply" ? 720.25 : 780.752) * sy) * 1000) / 1000 };
      return pipe.role === "supply" ? { ...pipe, from: target } : { ...pipe, to: target };
    });
    next.push(element, ...rebuildBranch(element, pipes, nextId));
  }
  return next;
}

export { DOWN };

export const DRAIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="68" height="68" viewBox="0 0 68 68"><circle cx="34" cy="34" r="30.839" fill="#FFFFFF" stroke="#414142" stroke-width="6"/><circle cx="34" cy="34" r="17.622" fill="#FFFFFF" stroke="#414142" stroke-width="6"/></svg>`;
