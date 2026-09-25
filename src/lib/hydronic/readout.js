import { HYDRONIC_ELEMENTS } from "./elements.js";
import { routePoint } from "./route.js";
import { fittingPose, fittingSize } from "./geometry.js";

export const READOUT = {
  labelWidth: 28,
  boxWidth: 100,
  rowHeight: 40,
  rowGap: 4,
  gap: 10
};

export function readoutSpec(type){
  return HYDRONIC_ELEMENTS[type]?.readout ?? null;
}

export function readoutRows(fitting){
  const spec = readoutSpec(fitting.type);
  const mode = fitting.readout ?? "none";
  if (!spec || mode === "none") return [];
  const setpoint = { kind: "setpoint", label: "S:", unit: spec.unit };
  const value = { kind: "value", label: spec.label, unit: spec.unit };
  if (mode === "setpoint") return [{ ...setpoint, label: "" }];
  if (mode === "value") return [{ ...value, label: "" }];
  return [setpoint, value];
}

function labelSpace(rows){
  return rows.some((row) => row.label) ? READOUT.labelWidth : 0;
}

export function readoutExtent(rows, scale = 1){
  return {
    width: (labelSpace(rows) + READOUT.boxWidth) * scale,
    height: (rows.length * READOUT.rowHeight + Math.max(0, rows.length - 1) * READOUT.rowGap) * scale
  };
}

function overlap(a, b){
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return width > 0 && height > 0 ? width * height : 0;
}

function segmentBoxes(route, thickness){
  const boxes = [];
  for (let index = 1; index < route.length; index += 1) {
    const a = route[index - 1];
    const b = route[index];
    boxes.push({
      x: Math.min(a.x, b.x) - thickness / 2,
      y: Math.min(a.y, b.y) - thickness / 2,
      width: Math.abs(b.x - a.x) + thickness,
      height: Math.abs(b.y - a.y) + thickness
    });
  }
  return boxes;
}

function candidates(pose, size, extent, horizontal){
  const halfW = size.width / 2 + READOUT.gap;
  const halfH = size.height / 2 + READOUT.gap;
  const sides = {
    left: { x: pose.x - halfW - extent.width, y: pose.y - extent.height / 2 },
    right: { x: pose.x + halfW, y: pose.y - extent.height / 2 },
    top: { x: pose.x - extent.width / 2, y: pose.y - halfH - extent.height },
    bottom: { x: pose.x - extent.width / 2, y: pose.y + halfH }
  };
  const order = horizontal ? ["top", "bottom", "left", "right"] : ["left", "right", "top", "bottom"];
  return order.map((side) => ({ side, ...sides[side], ...extent }));
}

export function readoutLayout(shapes, routes, bounds = null){
  const boxes = new Map();
  const obstacles = [];
  const pipes = shapes.filter((shape) => shape.kind === "pipe" && routes.get(shape.id));
  for (const shape of shapes) {
    if (shape.kind === "equipment" && HYDRONIC_ELEMENTS[shape.type]) obstacles.push({ x: shape.x, y: shape.y, width: shape.width, height: shape.height });
  }
  for (const pipe of pipes) {
    const route = routes.get(pipe.id);
    obstacles.push(...segmentBoxes(route, 16));
    for (const fitting of pipe.fittings ?? []) {
      if (!HYDRONIC_ELEMENTS[fitting.type]) continue;
      const pose = fittingPose(route, fitting);
      const size = fittingSize(fitting);
      const reach = Math.max(size.width, size.height);
      obstacles.push({ x: pose.x - reach / 2, y: pose.y - reach / 2, width: reach, height: reach });
    }
  }

  for (const pipe of pipes) {
    const route = routes.get(pipe.id);
    for (const fitting of pipe.fittings ?? []) {
      const rows = readoutRows(fitting);
      if (!rows.length) continue;
      const pose = fittingPose(route, fitting);
      const size = fittingSize(fitting);
      const scale = fitting.scale ?? 1;
      const extent = readoutExtent(rows, scale);
      let box;
      if (fitting.readoutOffset) {
        box = {
          side: "free",
          x: pose.x + fitting.readoutOffset.x - extent.width / 2,
          y: pose.y + fitting.readoutOffset.y - extent.height / 2,
          ...extent
        };
      } else {
        const angle = routePoint(route, fitting.t).angle;
        const horizontal = angle === 0 || Math.abs(angle) === 180;
        let best = null;
        candidates(pose, size, extent, horizontal).forEach((candidate, index) => {
          let score = obstacles.reduce((total, obstacle) => total + overlap(candidate, obstacle), 0) + index;
          if (bounds && (candidate.x < 0 || candidate.y < 0 || candidate.x + candidate.width > bounds.width || candidate.y + candidate.height > bounds.height)) score += 1e6;
          if (!best || score < best.score) best = { ...candidate, score };
        });
        box = best;
      }
      const placed = { x: box.x, y: box.y, width: box.width, height: box.height, side: box.side, rows, pose, pipeId: pipe.id, scale };
      boxes.set(fitting.id, placed);
      obstacles.push(placed);
    }
  }
  return boxes;
}

export function readoutRowBoxes(box){
  const scale = box.scale ?? 1;
  return box.rows.map((row, index) => {
    const y = box.y + index * (READOUT.rowHeight + READOUT.rowGap) * scale;
    return {
      ...row,
      scale,
      labelX: box.x + 2 * scale,
      textY: y + (READOUT.rowHeight / 2 + 6.5) * scale,
      box: { x: box.x + labelSpace(box.rows) * scale, y, width: READOUT.boxWidth * scale, height: READOUT.rowHeight * scale }
    };
  });
}
