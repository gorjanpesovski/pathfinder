import { svgElement, escapeXml } from "../export/atvise.js";
import { HYDRONIC_ELEMENTS, HYDRONIC_STYLE, mediumOf } from "./elements.js";
import { pipeRoute, routePoint, computeRoutes, pipeCrossings, arrowMarks, arrowPoints } from "./route.js";
import { touchRoute } from "./outline.js";
import { branchArgs, branchGaps } from "./branch.js";
import { readoutLayout, readoutRowBoxes } from "./readout.js";
import { rotationOf, uprightSize } from "./frame.js";
import { tankParts } from "./tank.js";

// const IN_OUT_VALUE = "SYSTEM.LIBRARY.ATVISE.OBJECTDISPLAYS.Default.Number.in_out_value";
const IN_OUT_VALUE = "SYSTEM.LIBRARY.ATVISE.OBJECTDISPLAYS.Advanced.in_out_value";
const IN_OUT_NATIVE = { width: 100, height: 40 };
const IN_OUT_FONT = 20;

const IN_OUT_OVERWRITES = [
  '<atv:overwrite id="input_label" transform="matrix(2,0,0,0.75,0,0)" x="73" y="24.499"/>',
  '<atv:overwrite height="32.499" id="blinking_frame" transform="matrix(2,0,0,0.75,0,0)" width="73"/>',
  '<atv:overwrite height="32.499" id="focus_frame" transform="matrix(2,0,0,0.75,0,0)" width="72"/>',
  '<atv:overwrite height="34.499" id="id_2" transform="matrix(2,0,0,0.75,0,0)" width="74.5"/>',
  '<atv:overwrite height="39.499" id="input_bg" transform="matrix(2,0,0,0.75,0,0)" width="79.5"/>'
].join("");

function round(value){
  return Math.round(value * 1000) / 1000;
}

export function elementMatrix(cx, cy, width, height, rotation = 0, sx = 1, sy = 1){
  const radians = rotation * Math.PI / 180;
  // const a = round(Math.cos(radians));
  // const b = round(Math.sin(radians));
  // const c = -b;
  // const d = a;
  const cos = Math.abs(Math.cos(radians)) < 1e-9 ? 0 : Math.cos(radians);
  const sin = Math.abs(Math.sin(radians)) < 1e-9 ? 0 : Math.sin(radians);
  const a = cos * sx;
  const b = sin * sx;
  const c = -sin * sy;
  const d = cos * sy;
  const e = round(cx - (a * width / 2 + c * height / 2));
  const f = round(cy - (b * width / 2 + d * height / 2));
  return `matrix(${round(a)},${round(b)},${round(c)},${round(d)},${e},${f})`;
}

export function orientAngle(type, angle, flip = false){
  const orient = HYDRONIC_ELEMENTS[type]?.orient ?? "flow";
  if (orient === "upright") return 0;
  if (orient === "axis") {
    const vertical = Math.abs(Math.abs(angle) - 90) < 1;
    return ((vertical ? 270 : 0) + (flip ? 180 : 0)) % 360;
  }
  return (angle + (flip ? 180 : 0) + 720) % 360;
}

export function fittingPose(route, fitting){
  const point = routePoint(route, fitting.t);
  // return { x: point.x, y: point.y, rotation: (point.angle + (fitting.flip ? 180 : 0) + 360) % 360 };
  return { x: point.x, y: point.y, rotation: orientAngle(fitting.type, point.angle, fitting.flip) };
}

/*
function reference(type, cx, cy, rotation, id, library){
  const spec = HYDRONIC_ELEMENTS[type];
  return svgElement("svg", {
    "atv:refpx": round(cx),
    "atv:refpy": round(cy),
    height: spec.height,
    id,
    transform: elementMatrix(cx, cy, spec.width, spec.height, rotation),
    width: spec.width,
    x: 0,
    y: 0,
    "xlink:href": `${library}.${spec.atv}`
  });
}

export function hydronicToSvg(shapes, style = HYDRONIC_STYLE){
  const byId = new Map(shapes.map((shape) => [shape.id, shape]));
  const pipes = shapes.filter((shape) => shape.kind === "pipe").map((pipe) => ({ pipe, route: pipeRoute(pipe, byId) })).filter((entry) => entry.route);
  const equipment = shapes.filter((shape) => shape.kind === "equipment" && HYDRONIC_ELEMENTS[shape.type]);

  const lines = pipes.map(({ pipe, route }) => {
    const xs = route.map((point) => point.x);
    const ys = route.map((point) => point.y);
    return svgElement("polyline", {
      "atv:refpx": round((Math.min(...xs) + Math.max(...xs)) / 2),
      "atv:refpy": round((Math.min(...ys) + Math.max(...ys)) / 2),
      fill: "none",
      id: `pipe_${pipe.id}`,
      points: route.map((point) => `${point.x},${point.y}`).join(" "),
      stroke: mediumOf(pipe.medium).color,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke-width": style.pipeWidth
    });
  });

  const blocks = equipment.map((element) => reference(element.type, element.x + element.width / 2, element.y + element.height / 2, 0, `${element.type}_${element.id}`, style.library));

  const fittings = pipes.flatMap(({ pipe, route }) => (pipe.fittings ?? [])
    .filter((fitting) => HYDRONIC_ELEMENTS[fitting.type])
    .map((fitting) => {
      const pose = fittingPose(route, fitting);
      return reference(fitting.type, pose.x, pose.y, pose.rotation, `${fitting.type}_${fitting.id}`, style.library);
    }));

  return [...lines, ...blocks, ...fittings].join("\n");
}

*/

export function fittingSize(fitting){
  const spec = HYDRONIC_ELEMENTS[fitting.type];
  const scale = fitting.scale ?? 1;
  return { width: spec.width * scale, height: spec.height * scale };
}

export function pipeWidthOf(pipe, style = HYDRONIC_STYLE){
  return pipe?.width ?? style.pipeWidth;
}

export function pipeScale(pipe, style = HYDRONIC_STYLE){
  return pipeWidthOf(pipe, style) / style.pipeWidth;
}

export function pipeDecorations(pipes, style = HYDRONIC_STYLE){
  const crossings = pipeCrossings(pipes.map(({ pipe, route }) => ({ id: pipe.id, route })));
  const byId = new Map(pipes.map(({ pipe }) => [pipe.id, pipe]));
  const margin = style.gapSize - style.pipeWidth;
  for (const crossing of crossings) {
    crossing.size = Math.max(pipeWidthOf(byId.get(crossing.upper), style), pipeWidthOf(byId.get(crossing.lower), style)) + margin;
  }
  const junctions = [];
  for (const { pipe, route } of pipes) {
    const k = pipeScale(pipe, style);
    const extra = { radius: style.junctionRadius * k, stroke: style.junctionWidth * k };
    // if (pipe.from?.pipe !== undefined) junctions.push({ pipeId: pipe.id, host: pipe.from.pipe, x: route[0].x, y: route[0].y, ...extra });
    // if (pipe.to?.pipe !== undefined) junctions.push({ pipeId: pipe.id, host: pipe.to.pipe, x: route[route.length - 1].x, y: route[route.length - 1].y, ...extra });
    if (pipe.from?.pipe !== undefined && pipe.from.fitting === undefined) junctions.push({ pipeId: pipe.id, host: pipe.from.pipe, x: route[0].x, y: route[0].y, ...extra });
    if (pipe.to?.pipe !== undefined && pipe.to.fitting === undefined) junctions.push({ pipeId: pipe.id, host: pipe.to.pipe, x: route[route.length - 1].x, y: route[route.length - 1].y, ...extra });
  }
  const arrows = new Map();
  for (const { pipe, route } of pipes) {
    const size = style.arrowSize * pipeScale(pipe, style);
    const avoid = [
      ...(pipe.fittings ?? []).filter((fitting) => HYDRONIC_ELEMENTS[fitting.type]).map((fitting) => fittingPose(route, fitting)),
      ...crossings.filter((crossing) => crossing.upper === pipe.id || crossing.lower === pipe.id),
      ...junctions.filter((junction) => junction.host === pipe.id || junction.pipeId === pipe.id)
    ];
    arrows.set(pipe.id, arrowMarks(route, avoid, size * 1.8, Math.max(40, 100 * pipeScale(pipe, style))).map((mark) => ({ ...mark, size })));
  }
  return { crossings, junctions, arrows };
}

/*
export function pipeDecorations(pipes, style = HYDRONIC_STYLE){
  const crossings = pipeCrossings(pipes.map(({ pipe, route }) => ({ id: pipe.id, route })));
  const junctions = [];
  for (const { pipe, route } of pipes) {
    if (pipe.from?.pipe !== undefined) junctions.push({ pipeId: pipe.id, host: pipe.from.pipe, x: route[0].x, y: route[0].y });
    if (pipe.to?.pipe !== undefined) junctions.push({ pipeId: pipe.id, host: pipe.to.pipe, x: route[route.length - 1].x, y: route[route.length - 1].y });
  }
  const arrows = new Map();
  for (const { pipe, route } of pipes) {
    const avoid = [
      ...(pipe.fittings ?? []).filter((fitting) => HYDRONIC_ELEMENTS[fitting.type]).map((fitting) => fittingPose(route, fitting)),
      ...crossings.filter((crossing) => crossing.upper === pipe.id || crossing.lower === pipe.id),
      ...junctions.filter((junction) => junction.host === pipe.id || junction.pipeId === pipe.id)
    ];
    arrows.set(pipe.id, arrowMarks(route, avoid, style.arrowSize * 1.8));
  }
  return { crossings, junctions, arrows };
}
*/

function scaledReference(type, cx, cy, rotation, id, style, width, height, args = {}){
  const spec = HYDRONIC_ELEMENTS[type];
  // const native = style.native?.[type] ?? { width: spec.width, height: spec.height };
  const native = spec.native ?? style.native?.[type] ?? { width: spec.width, height: spec.height };
  const sx = width / native.width;
  const sy = spec.inline ? sx : height / native.height;
  const lift = native.axisY === undefined ? 0 : (native.axisY - native.height / 2) * sy;
  const turn = rotation * Math.PI / 180;
  const centreX = cx + Math.sin(turn) * lift;
  const centreY = cy - Math.cos(turn) * lift;
  return svgElement("svg", {
    "atv:refpx": round(cx),
    "atv:refpy": round(cy),
    height: native.height,
    id,
    // transform: elementMatrix(cx, cy, native.width, native.height, rotation, width / native.width, height / native.height),
    // transform: elementMatrix(cx, cy, native.width, native.height, rotation, sx, sy),
    transform: elementMatrix(centreX, centreY, native.width, native.height, rotation, sx, sy),
    width: native.width,
    x: 0,
    y: 0,
    // "xlink:href": `${style.library}.${spec.atv}`
    "xlink:href": spec.path ?? `${style.library}.${spec.atv}`
  }, Object.keys(args).length ? Object.entries(args).map(([name, value]) => `<atv:argument name="${escapeXml(name)}" value="${escapeXml(value)}"/>`).join("") : null);
}

function elementArgs(element){
  if (HYDRONIC_ELEMENTS[element.type]?.branch) return branchArgs(element);
  const params = HYDRONIC_ELEMENTS[element.type]?.params ?? [];
  return params.includes("name") && element.name ? { name: element.name } : {};
}

function barRect(element){
  return svgElement("rect", {
    "atv:refpx": round(element.x + element.width / 2),
    "atv:refpy": round(element.y + element.height / 2),
    fill: mediumOf(element.medium).color,
    height: round(element.height),
    id: `${element.type}_${element.id}`,
    "stroke-width": 0,
    width: round(element.width),
    x: round(element.x),
    y: round(element.y)
  });
}

function readoutElements(fittingId, box){
  return readoutRowBoxes(box).flatMap((row) => {
    const id = `readout_${fittingId}_${row.kind}`;
    const field = valueField(id, row.box.x, row.box.y, row.box.width, row.box.height, row.unit, 1);
    if (!row.label) return [field];
    return [
      svgElement("text", {
        "atv:refpx": round(row.labelX + 10),
        "atv:refpy": round(row.box.y + row.box.height / 2),
        fill: "#414142",
        "font-family": "Roboto, Arial, sans-serif",
        "font-size": round(18 * row.scale),
        id: `${id}_label`,
        x: round(row.labelX),
        y: round(row.textY)
      }, escapeXml(row.label)),
      field
    ];
  });
}

/*
function readoutElements(fittingId, box){
  return readoutRowBoxes(box).flatMap((row) => {
    const id = `readout_${fittingId}_${row.kind}`;
    const args = {
      postDecimal: 1,
      decimalFraction: 0,
      unit: `T{${row.unit}}`,
      editable: "No",
      fillNotEditable: "#ffffff",
      fontSize: Math.round(18 * row.scale)
    };
    return [
      svgElement("text", {
        "atv:refpx": round(row.labelX + 10),
        "atv:refpy": round(row.box.y + row.box.height / 2),
        fill: "#414142",
        "font-family": "Roboto, Arial, sans-serif",
        "font-size": round(18 * row.scale),
        id: `${id}_label`,
        x: round(row.labelX),
        y: round(row.textY)
      }, escapeXml(row.label)),
      svgElement("svg", {
        "atv:refpx": round(row.box.x + row.box.width / 2),
        "atv:refpy": round(row.box.y + row.box.height / 2),
        height: 30,
        id,
        // transform: `matrix(0.5,0,0,1.3333,${round(row.box.x)},${round(row.box.y)})`,
        transform: `matrix(${round(0.5 * row.scale)},0,0,${round(1.3333 * row.scale)},${round(row.box.x)},${round(row.box.y)})`,
        width: 160,
        x: 0,
        y: 0,
        "xlink:href": IN_OUT_VALUE
      }, Object.entries(args).map(([name, value]) => `<atv:argument name="${escapeXml(name)}" value="${escapeXml(value)}"/>`).join("") + IN_OUT_OVERWRITES)
    ];
  });
}
*/

function valueField(id, x, y, width, height, unit, decimals){
  const scale = height / IN_OUT_NATIVE.height;
  const args = { postDecimal: decimals, decimalFraction: 0, unit: `T{${unit}}`, editable: "No", fillNotEditable: "#ffffff", fontSize: Math.max(8, Math.round(IN_OUT_FONT * scale)) };
  return svgElement("svg", {
    "atv:refpx": round(x + width / 2),
    "atv:refpy": round(y + height / 2),
    height: IN_OUT_NATIVE.height,
    id,
    transform: `matrix(${round(width / IN_OUT_NATIVE.width)},0,0,${round(height / IN_OUT_NATIVE.height)},${round(x)},${round(y)})`,
    width: IN_OUT_NATIVE.width,
    x: 0,
    y: 0,
    "xlink:href": IN_OUT_VALUE
  }, Object.entries(args).map(([name, value]) => `<atv:argument name="${escapeXml(name)}" value="${escapeXml(value)}"/>`).join(""));
}

/*
function valueField(id, x, y, width, height, unit, decimals){
  const args = { postDecimal: decimals, decimalFraction: 0, unit: `T{${unit}}`, editable: "No", fillNotEditable: "#ffffff", fontSize: Math.max(8, Math.round(18 * height / 40)) };
  return svgElement("svg", {
    "atv:refpx": round(x + width / 2),
    "atv:refpy": round(y + height / 2),
    height: 30,
    id,
    transform: `matrix(${round(width / 160)},0,0,${round(height / 30)},${round(x)},${round(y)})`,
    width: 160,
    x: 0,
    y: 0,
    "xlink:href": IN_OUT_VALUE
  }, Object.entries(args).map(([name, value]) => `<atv:argument name="${escapeXml(name)}" value="${escapeXml(value)}"/>`).join("") + IN_OUT_OVERWRITES);
}
*/

function tankElements(element, style){
  return tankParts(element).map((part) => part.kind === "icon"
    ? scaledReference(part.type, part.cx, part.cy, 0, `${element.type}_${element.id}_probe_${part.probe}`, style, part.width, part.height)
    : valueField(`${element.type}_${element.id}_probe_${part.probe}_value`, part.x, part.y, part.width, part.height, part.unit, part.decimals));
}

function bounds(route){
  const xs = route.map((point) => point.x);
  const ys = route.map((point) => point.y);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

export function hydronicToSvg(shapes, style = HYDRONIC_STYLE){
  const routes = computeRoutes(shapes);
  const pipes = shapes.filter((shape) => shape.kind === "pipe" && routes.has(shape.id)).map((pipe) => ({ pipe, route: routes.get(pipe.id) }));
  const equipment = shapes.filter((shape) => shape.kind === "equipment" && HYDRONIC_ELEMENTS[shape.type]);
  const { crossings, junctions, arrows } = pipeDecorations(pipes, style);
  const byId = new Map(shapes.map((shape) => [shape.id, shape]));
  const gap = style.gapSize;
  const lines = [];

  for (const { pipe, route } of pipes) {
    crossings.filter((crossing) => crossing.upper === pipe.id).forEach((crossing, index) => {
      const side = crossing.size ?? gap;
      lines.push(svgElement("rect", {
        "atv:refpx": round(crossing.x),
        "atv:refpy": round(crossing.y),
        fill: style.background,
        // height: gap,
        height: round(side),
        id: `pipe_${pipe.id}_gap_${index + 1}`,
        "stroke-width": 0,
        // width: gap,
        // x: round(crossing.x - gap / 2),
        // y: round(crossing.y - gap / 2)
        width: round(side),
        x: round(crossing.x - side / 2),
        y: round(crossing.y - side / 2)
      }));
    });
    // const center = bounds(route);
    const drawn = touchRoute(route, pipe, byId);
    const center = bounds(drawn);
    lines.push(svgElement("polyline", {
      "atv:refpx": round(center.x),
      "atv:refpy": round(center.y),
      fill: "none",
      id: `pipe_${pipe.id}`,
      // points: route.map((point) => `${point.x},${point.y}`).join(" "),
      points: drawn.map((point) => `${point.x},${point.y}`).join(" "),
      stroke: mediumOf(pipe.medium).color,
      "stroke-linejoin": "round",
      // "stroke-width": style.pipeWidth
      "stroke-width": pipeWidthOf(pipe, style)
    }));
  }

  const marks = pipes.flatMap(({ pipe }) => (arrows.get(pipe.id) ?? []).map((mark, index) => svgElement("polygon", {
    "atv:refpx": mark.x,
    "atv:refpy": mark.y,
    fill: mediumOf(pipe.medium).color,
    id: `pipe_${pipe.id}_arrow_${index + 1}`,
    // points: arrowPoints(mark, style.arrowSize),
    points: arrowPoints(mark, mark.size ?? style.arrowSize),
    "stroke-width": 0
  })));

  const joints = junctions.map((junction, index) => svgElement("circle", {
    "atv:refpx": round(junction.x),
    "atv:refpy": round(junction.y),
    cx: round(junction.x),
    cy: round(junction.y),
    fill: "#ffffff",
    id: `junction_${index + 1}`,
    // r: style.junctionRadius,
    r: round(junction.radius ?? style.junctionRadius),
    stroke: style.junctionStroke,
    // "stroke-width": style.junctionWidth
    "stroke-width": round(junction.stroke ?? style.junctionWidth)
  }));

  // const blocks = equipment.map((element) => scaledReference(element.type, element.x + element.width / 2, element.y + element.height / 2, 0, `${element.type}_${element.id}`, style, element.width, element.height));
  // const blocks = equipment.map((element) => scaledReference(element.type, element.x + element.width / 2, element.y + element.height / 2, 0, `${element.type}_${element.id}`, style, element.width, element.height, element.name ? { name: element.name } : {}));
  const layered = [...equipment.filter((element) => HYDRONIC_ELEMENTS[element.type].bar), ...equipment.filter((element) => !HYDRONIC_ELEMENTS[element.type].bar)];
  const bars = layered.filter((element) => HYDRONIC_ELEMENTS[element.type].bar).length;
  const blocks = layered.map((element) => HYDRONIC_ELEMENTS[element.type].bar
    ? barRect(element)
    // : scaledReference(element.type, element.x + element.width / 2, element.y + element.height / 2, 0, `${element.type}_${element.id}`, style, element.width, element.height, elementArgs(element)));
    : scaledReference(element.type, element.x + element.width / 2, element.y + element.height / 2, rotationOf(element), `${element.type}_${element.id}`, style, uprightSize(element).width, uprightSize(element).height, elementArgs(element)));

  const fittings = pipes.flatMap(({ pipe, route }) => (pipe.fittings ?? [])
    .filter((fitting) => HYDRONIC_ELEMENTS[fitting.type])
    .map((fitting) => {
      const pose = fittingPose(route, fitting);
      const size = fittingSize(fitting);
      return scaledReference(fitting.type, pose.x, pose.y, pose.rotation, `${fitting.type}_${fitting.id}`, style, size.width, size.height);
    }));

  const gaps = branchGaps(shapes, gap).map((entry, index) => svgElement("rect", {
    "atv:refpx": round(entry.x + entry.width / 2),
    "atv:refpy": round(entry.y + entry.height / 2),
    fill: style.background,
    height: round(entry.height),
    id: `branch_${entry.branchId}_gap_${index + 1}`,
    "stroke-width": 0,
    width: round(entry.width),
    x: round(entry.x),
    y: round(entry.y)
  }));

  const readouts = [...readoutLayout(shapes, routes, style.bounds ?? null)].flatMap(([fittingId, box]) => readoutElements(fittingId, box));

  const probes = layered.flatMap((element) => tankElements(element, style));

  // return [...lines, ...marks, ...joints, ...blocks, ...fittings].join("\n");
  // return [...lines, ...marks, ...joints, ...blocks.slice(0, bars), ...gaps, ...blocks.slice(bars), ...fittings, ...readouts].join("\n");
  return [...lines, ...marks, ...joints, ...blocks.slice(0, bars), ...gaps, ...blocks.slice(bars), ...probes, ...fittings, ...readouts].join("\n");
}
