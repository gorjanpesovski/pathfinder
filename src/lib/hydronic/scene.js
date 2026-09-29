import { HYDRONIC_ELEMENTS, HYDRONIC_STYLE, mediumOf } from "./elements.js";
import { computeRoutes } from "./route.js";
import { touchRoute } from "./outline.js";
import { branchArgs, branchGaps } from "./branch.js";
import { branchParts } from "./branchParts.js";
import { readoutLayout, readoutRowBoxes, READOUT } from "./readout.js";
import { rotationOf, uprightSize } from "./frame.js";
import { tankParts } from "./tank.js";
import { elementLabel, hasNameLabel } from "./label.js";
import { fittingLabel } from "./fittingLabel.js";
import { fittingPose, fittingSize, pipeDecorations, pipeWidthOf } from "./geometry.js";
import { electricSvg } from "../electric/symbols.js";
import { location } from "../electric/sheet.js";

const INK = "#1E293B";
const LABEL_FORMATS = ["app", "pgd"];

function elementArgs(element){
  const spec = HYDRONIC_ELEMENTS[element.type];
  if (spec?.branch) return branchArgs(element);
  if (spec?.device) return deviceArgs(element);
  return (spec?.params ?? []).includes("name") && element.name ? { name: element.name } : {};
}

export function deviceArgs(element){
  const spec = HYDRONIC_ELEMENTS[element.type];
  const args = { ime_naprave: element.name ?? "" };
  if (spec.device !== "hub") args.ip = spec.device === "rtu" ? `ID ${element.params?.slave ?? 1}` : element.params?.ip ?? "";
  return args;
}

const LABEL_SIZE = 13;
const LABEL_GAP = 6;
const LABEL_STEPS = [0.5, 0.35, 0.65, 0.2, 0.8, 0.1, 0.9];

function networkGroups(pipes){
  const parent = new Map(pipes.map(({ pipe }) => [pipe.id, pipe.id]));
  const find = (id) => parent.get(id) === id ? id : find(parent.get(id));
  const byId = new Map(pipes.map((entry) => [entry.pipe.id, entry]));
  const owners = new Map();
  for (const { pipe } of pipes) {
    for (const end of [pipe.from, pipe.to]) {
      const host = byId.get(end?.pipe);
      if (host && host.pipe.medium === pipe.medium) parent.set(find(pipe.id), find(host.pipe.id));
      if (end?.id === undefined) continue;
      const key = `${end.id}|${pipe.medium}`;
      if (owners.has(key)) parent.set(find(pipe.id), find(owners.get(key)));
      else owners.set(key, pipe.id);
    }
  }
  const groups = new Map();
  for (const entry of pipes) {
    const root = find(entry.pipe.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(entry);
  }
  return [...groups.values()];
}

function segmentsOf(points){
  const list = [];
  for (let index = 0; index < points.length - 1; index += 1) list.push({ a: points[index], b: points[index + 1] });
  return list;
}

function touches(box, segment, pad){
  const left = Math.min(segment.a.x, segment.b.x) - pad;
  const right = Math.max(segment.a.x, segment.b.x) + pad;
  const top = Math.min(segment.a.y, segment.b.y) - pad;
  const bottom = Math.max(segment.a.y, segment.b.y) + pad;
  return box.x < right && box.x + box.width > left && box.y < bottom && box.y + box.height > top;
}

function overlaps(box, rect){
  return box.x < rect.x + rect.width && box.x + box.width > rect.x && box.y < rect.y + rect.height && box.y + box.height > rect.y;
}

function labelAt(text, segment, t, side, width){
  const x = segment.a.x + (segment.b.x - segment.a.x) * t;
  const y = segment.a.y + (segment.b.y - segment.a.y) * t;
  const boxWidth = text.length * LABEL_SIZE * 0.58;
  const offset = width / 2 + LABEL_GAP;
  if (Math.abs(segment.a.y - segment.b.y) < 0.5) {
    const top = side < 0 ? y - offset - LABEL_SIZE : y + offset;
    return { text, x, y: top + LABEL_SIZE * 0.8, anchor: "middle", size: LABEL_SIZE, box: { x: x - boxWidth / 2, y: top, width: boxWidth, height: LABEL_SIZE } };
  }
  const left = side > 0 ? x + offset : x - offset - boxWidth;
  return { text, x: left, y: y + LABEL_SIZE * 0.35, anchor: "start", size: LABEL_SIZE, box: { x: left, y: y - LABEL_SIZE / 2, width: boxWidth, height: LABEL_SIZE } };
}

function protocolLabel(group, obstacles, solids, taken){
  const text = mediumOf(group[0].pipe.medium).label;
  const width = Math.max(...group.map((entry) => entry.width));
  const runs = group.flatMap((entry) => segmentsOf(entry.points))
    .map((segment) => ({ ...segment, length: Math.hypot(segment.b.x - segment.a.x, segment.b.y - segment.a.y), horizontal: Math.abs(segment.a.y - segment.b.y) < 0.5 }))
    .filter((segment) => segment.length >= 60)
    .sort((p, q) => (q.horizontal - p.horizontal) || q.length - p.length);
  for (const segment of runs) {
    for (const t of LABEL_STEPS) {
      for (const side of [-1, 1]) {
        const label = labelAt(text, segment, t, side, width);
        const box = label.box;
        if (obstacles.some((other) => touches(box, other, other.width / 2 + 2))) continue;
        if (solids.some((rect) => overlaps(box, rect)) || taken.some((rect) => overlaps(box, rect))) continue;
        return label;
      }
    }
  }
  return null;
}

function relayRefs(elements){
  const spots = { relayCoil: new Map(), relayContact: new Map() };
  for (const element of elements) {
    const map = spots[element.type];
    if (!map || !element.name) continue;
    if (!map.has(element.name)) map.set(element.name, []);
    map.get(element.name).push(location(element.x + element.width / 2));
  }
  return (element) => {
    if (element.type === "relayCoil") return spots.relayContact.get(element.name) ?? [];
    if (element.type === "relayContact") return spots.relayCoil.get(element.name) ?? [];
    return null;
  };
}

function railLabels(pipe, points){
  const rail = mediumOf(pipe.medium).rail;
  if (!rail || points.length < 2) return [];
  const labels = [];
  const ends = [[pipe.from, points[0], points[1]], [pipe.to, points[points.length - 1], points[points.length - 2]]];
  ends.forEach(([end, point, next], index) => {
    if (end?.id !== undefined || end?.pipe !== undefined || point.y !== next.y) return;
    const leftward = next.x > point.x;
    const x = leftward ? point.x + 4 : point.x - 4;
    labels.push({ kind: "label", id: `pipe_${pipe.id}_rail_${index}`, text: rail, x, y: point.y - 5, size: 12, anchor: leftward ? "start" : "end", color: INK,
      box: { x: leftward ? x : x - 30, y: point.y - 17, width: 30, height: 14 } });
  });
  return labels;
}

export function buildScene(shapes, style = HYDRONIC_STYLE, options = {}){
  const routes = options.routes ?? computeRoutes(shapes);
  const byId = new Map(shapes.map((shape) => [shape.id, shape]));
  const pipes = shapes
    .filter((shape) => shape.kind === "pipe" && shape.id !== options.hidden && routes.get(shape.id))
    .map((pipe) => ({ pipe, route: routes.get(pipe.id) }));
  const equipment = shapes.filter((shape) => shape.kind === "equipment" && HYDRONIC_ELEMENTS[shape.type]);
  const bars = equipment.filter((element) => HYDRONIC_ELEMENTS[element.type].bar);
  const solids = equipment.filter((element) => !HYDRONIC_ELEMENTS[element.type].bar);
  const { crossings: allCrossings, junctions, arrows } = pipeDecorations(pipes, style);
  const electricPipes = new Set(pipes.filter(({ pipe }) => mediumOf(pipe.medium).electric).map(({ pipe }) => pipe.id));
  const crossings = allCrossings.filter((crossing) => !electricPipes.has(crossing.upper) && !electricPipes.has(crossing.lower));
  const refsOf = relayRefs(equipment);
  const items = [];

  for (const { pipe, route } of pipes) {
    crossings.filter((crossing) => crossing.upper === pipe.id).forEach((crossing, index) => {
      const side = crossing.size ?? style.gapSize;
      items.push({ kind: "gap", id: `pipe_${pipe.id}_gap_${index + 1}`, x: crossing.x - side / 2, y: crossing.y - side / 2, width: side, height: side });
    });
    const medium = mediumOf(pipe.medium);
    items.push({ kind: "pipe", id: `pipe_${pipe.id}`, pipeId: pipe.id, points: touchRoute(route, pipe, byId), route, color: medium.color, width: pipeWidthOf(pipe, style), dash: !!medium.dash, dashArray: medium.dashArray ?? null });
  }

  for (const { pipe } of pipes) {
    if (mediumOf(pipe.medium).network || mediumOf(pipe.medium).electric) continue;
    (arrows.get(pipe.id) ?? []).forEach((mark, index) => {
      items.push({ kind: "arrow", id: `pipe_${pipe.id}_arrow_${index + 1}`, pipeId: pipe.id, mark, size: mark.size ?? style.arrowSize, color: mediumOf(pipe.medium).color });
    });
  }

  const networkPipes = new Set(pipes.filter(({ pipe }) => mediumOf(pipe.medium).network).map(({ pipe }) => pipe.id));
  junctions.forEach((junction, index) => {
    if (networkPipes.has(junction.pipeId)) return;
    if (electricPipes.has(junction.pipeId)) {
      items.push({ kind: "junction", id: `junction_${index + 1}`, x: junction.x, y: junction.y, radius: 3.5, dot: true });
      return;
    }
    items.push({ kind: "junction", id: `junction_${index + 1}`, x: junction.x, y: junction.y, radius: junction.radius ?? style.junctionRadius, stroke: junction.stroke ?? style.junctionWidth });
  });

  for (const bar of bars) {
    items.push({ kind: "bar", id: `${bar.type}_${bar.id}`, elementId: bar.id, x: bar.x, y: bar.y, width: bar.width, height: bar.height, color: mediumOf(bar.medium).color });
  }

  branchGaps(shapes, style.gapSize).forEach((entry, index) => {
    items.push({ kind: "gap", id: `branch_${entry.branchId}_gap_${index + 1}`, x: entry.x, y: entry.y, width: entry.width, height: entry.height });
  });

  for (const element of solids) {
    const upright = uprightSize(element);
    const base = {
      id: `${element.type}_${element.id}`,
      elementId: element.id,
      type: element.type,
      cx: element.x + element.width / 2,
      cy: element.y + element.height / 2,
      width: upright.width,
      height: upright.height,
      rotation: rotationOf(element),
      mirror: element.mirror?.x || element.mirror?.y ? { x: !!element.mirror.x, y: !!element.mirror.y } : null,
      args: elementArgs(element)
    };
    const spec = HYDRONIC_ELEMENTS[element.type];
    items.push(spec.electric ? { kind: "electric", ...base, svg: electricSvg(element, refsOf(element)) }
      : spec.branch ? { kind: "branch", ...base, element, parts: branchParts(element) }
      : spec.device ? { kind: "device", ...base, device: spec.device, x: element.x, y: element.y, name: element.name ?? "", address: base.args.ip ?? "" }
      : { kind: "icon", ...base });
  }

  for (const element of solids) {
    for (const part of tankParts(element)) {
      const id = `${element.type}_${element.id}_probe_${part.probe}`;
      if (part.kind === "icon") items.push({ kind: "icon", id, type: part.type, cx: part.cx, cy: part.cy, width: part.width, height: part.height, rotation: part.rotation ?? 0, args: {} });
      else items.push({ kind: "field", id: `${id}_value`, x: part.x, y: part.y, width: part.width, height: part.height, unit: part.unit, decimals: part.decimals });
    }
  }

  for (const element of solids) {
    if (!element.name || !hasNameLabel(element)) continue;
    const label = elementLabel(element);
    items.push({
      kind: "label", id: `${element.type}_${element.id}_name`, text: element.name, x: label.x, y: label.y, size: label.size, anchor: "middle", color: INK,
      box: { x: element.x - 20, y: label.top, width: element.width + 40, height: label.height },
      ref: { elementId: element.id }, formats: LABEL_FORMATS
    });
  }

  for (const { pipe, route } of pipes) {
    for (const fitting of pipe.fittings ?? []) {
      if (!HYDRONIC_ELEMENTS[fitting.type]) continue;
      const pose = fittingPose(route, fitting);
      const size = fittingSize(fitting);
      items.push({ kind: "icon", id: `${fitting.type}_${fitting.id}`, pipeId: pipe.id, fittingId: fitting.id, type: fitting.type, cx: pose.x, cy: pose.y, width: size.width, height: size.height, rotation: pose.rotation, args: {} });
    }
  }

  for (const { pipe, route } of pipes) {
    for (const fitting of pipe.fittings ?? []) {
      if (!fitting.name || !HYDRONIC_ELEMENTS[fitting.type]) continue;
      const label = fittingLabel(route, fitting);
      const width = 160 * label.size / 13;
      items.push({
        kind: "label", id: `${fitting.type}_${fitting.id}_name`, text: fitting.name, x: label.x, y: label.y, size: label.size, anchor: label.anchor, color: INK,
        box: { x: label.anchor === "middle" ? label.x - width / 2 : label.x, y: label.top, width, height: label.height },
        ref: { pipeId: pipe.id, fittingId: fitting.id }, formats: LABEL_FORMATS
      });
    }
  }

  for (const { pipe, route } of pipes) {
    if (electricPipes.has(pipe.id)) items.push(...railLabels(pipe, touchRoute(route, pipe, byId)));
  }

  const network = pipes
    .filter(({ pipe }) => mediumOf(pipe.medium).network)
    .map(({ pipe, route }) => ({ pipe, points: touchRoute(route, pipe, byId), width: pipeWidthOf(pipe, style) }));
  const obstacles = network.flatMap((entry) => segmentsOf(entry.points).map((segment) => ({ ...segment, width: entry.width })));
  const boxes = solids.map((element) => ({ x: element.x - 6, y: element.y - 6, width: element.width + 12, height: element.height + 12 }));
  const taken = [];
  for (const group of networkGroups(network)) {
    if (group.every((entry) => entry.pipe.label === false)) continue;
    const label = protocolLabel(group.filter((entry) => entry.pipe.label !== false), obstacles, boxes, taken);
    if (!label) continue;
    taken.push(label.box);
    items.push({ kind: "label", id: `pipe_${group[0].pipe.id}_protocol`, ...label, color: "#414142" });
  }

  const readouts = options.readouts ?? readoutLayout(shapes, routes, style.bounds ?? null);
  for (const [fittingId, box] of readouts) {
    if (box.pipeId === options.hidden) continue;
    for (const row of readoutRowBoxes(box)) {
      const id = `readout_${fittingId}_${row.kind}`;
      if (row.label) {
        items.push({
          kind: "label", id: `${id}_label`, text: row.label, x: row.labelX, y: row.textY, size: 18 * row.scale, anchor: "start", bold: true, color: "#414142",
          box: { x: row.labelX, y: row.box.y, width: (READOUT.labelWidth - 2) * row.scale, height: row.box.height }
        });
      }
      items.push({ kind: "field", id, x: row.box.x, y: row.box.y, width: row.box.width, height: row.box.height, unit: row.unit, decimals: 1 });
    }
  }

  return items;
}

export function showsIn(item, format){
  return !item.formats || item.formats.includes(format);
}
