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

const INK = "#1E293B";
const LABEL_FORMATS = ["app", "pgd"];

function elementArgs(element){
  const spec = HYDRONIC_ELEMENTS[element.type];
  if (spec?.branch) return branchArgs(element);
  return (spec?.params ?? []).includes("name") && element.name ? { name: element.name } : {};
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
  const { crossings, junctions, arrows } = pipeDecorations(pipes, style);
  const items = [];

  for (const { pipe, route } of pipes) {
    crossings.filter((crossing) => crossing.upper === pipe.id).forEach((crossing, index) => {
      const side = crossing.size ?? style.gapSize;
      items.push({ kind: "gap", id: `pipe_${pipe.id}_gap_${index + 1}`, x: crossing.x - side / 2, y: crossing.y - side / 2, width: side, height: side });
    });
    items.push({ kind: "pipe", id: `pipe_${pipe.id}`, pipeId: pipe.id, points: touchRoute(route, pipe, byId), route, color: mediumOf(pipe.medium).color, width: pipeWidthOf(pipe, style) });
  }

  for (const { pipe } of pipes) {
    (arrows.get(pipe.id) ?? []).forEach((mark, index) => {
      items.push({ kind: "arrow", id: `pipe_${pipe.id}_arrow_${index + 1}`, pipeId: pipe.id, mark, size: mark.size ?? style.arrowSize, color: mediumOf(pipe.medium).color });
    });
  }

  junctions.forEach((junction, index) => {
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
      args: elementArgs(element)
    };
    items.push(HYDRONIC_ELEMENTS[element.type].branch ? { kind: "branch", ...base, element, parts: branchParts(element) } : { kind: "icon", ...base });
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
