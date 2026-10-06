import { svgElement, escapeXml } from "../export/atvise.js";
import { HYDRONIC_ELEMENTS, HYDRONIC_STYLE } from "./elements.js";
import { arrowPoints } from "./route.js";
import { buildScene, showsIn } from "./scene.js";

const IN_OUT_VALUE = "SYSTEM.LIBRARY.ATVISE.OBJECTDISPLAYS.Advanced.in_out_value";
const IN_OUT_NATIVE = { width: 100, height: 40 };
const IN_OUT_FONT = 20;
const FONT = "Roboto, Arial, sans-serif";

function round(value){
  return Math.round(value * 1000) / 1000;
}

function argumentsOf(args){
  const entries = Object.entries(args ?? {});
  return entries.length ? entries.map(([name, value]) => `<atv:argument name="${escapeXml(name)}" value="${escapeXml(value)}"/>`).join("") : null;
}

export function elementMatrix(cx, cy, width, height, rotation = 0, sx = 1, sy = 1){
  const radians = rotation * Math.PI / 180;
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

function meterSensor(item){
  const r = item.width / 2 - 1;
  const k = item.width / 22;
  return [
    `<g atv:refpx="${round(item.cx)}" atv:refpy="${round(item.cy)}" id="${item.id}">`,
    svgElement("circle", { cx: round(item.cx), cy: round(item.cy), fill: "#FFFFFF", id: `${item.id}_ring`, r: round(r), stroke: "#414142", "stroke-width": round(2 * k) }),
    svgElement("path", { d: `M ${round(item.cx - 4 * k)} ${round(item.cy - 4 * k)} H ${round(item.cx + 4 * k)} M ${round(item.cx)} ${round(item.cy - 4 * k)} V ${round(item.cy + 5 * k)}`, fill: "none", id: `${item.id}_mark`, stroke: "#414142", "stroke-width": round(2 * k) }),
    `</g>`
  ].join("\n");
}

function branchHeader(item){
  return item.parts.map((part, index) => {
    const id = `${item.id}_${index}`;
    if (part.kind === "drain") {
      return [
        svgElement("circle", { cx: round(part.cx), cy: round(part.cy), fill: "#FFFFFF", id: `${id}_outer`, r: round(part.outer), stroke: "#414142", "stroke-width": round(part.stroke) }),
        svgElement("circle", { cx: round(part.cx), cy: round(part.cy), fill: "#FFFFFF", id: `${id}_inner`, r: round(part.inner), stroke: "#414142", "stroke-width": round(part.stroke) })
      ].join("\n");
    }
    return svgElement("text", {
      "atv:refpx": round(part.x),
      "atv:refpy": round(part.baseline),
      fill: part.color,
      "font-family": FONT,
      "font-size": round(part.size),
      "font-weight": part.bold ? "bold" : undefined,
      id,
      "text-anchor": "middle",
      x: round(part.x),
      y: round(part.baseline)
    }, escapeXml(part.text ?? ""));
  }).join("\n");
}

function reference(item, style){
  const spec = HYDRONIC_ELEMENTS[item.type];
  if (spec.primitive) return meterSensor(item);
  const native = spec.native ?? style.native?.[item.type] ?? { width: spec.width, height: spec.height };
  const sx = item.width / native.width * (item.mirror?.x ? -1 : 1);
  const sy = (spec.inline ? item.width / native.width : item.height / native.height) * (item.mirror?.y ? -1 : 1);
  const lift = native.axisY === undefined ? 0 : (native.axisY - native.height / 2) * sy;
  const turn = item.rotation * Math.PI / 180;
  return svgElement("svg", {
    "atv:refpx": round(item.cx),
    "atv:refpy": round(item.cy),
    height: native.height,
    id: item.id,
    transform: elementMatrix(item.cx + Math.sin(turn) * lift, item.cy - Math.cos(turn) * lift, native.width, native.height, item.rotation, sx, sy),
    width: native.width,
    x: 0,
    y: 0,
    "xlink:href": spec.path ?? `${style.library}.${spec.atv}`
  }, argumentsOf(item.args));
}

function rect(item, fill){
  return svgElement("rect", {
    "atv:refpx": round(item.x + item.width / 2),
    "atv:refpy": round(item.y + item.height / 2),
    fill,
    height: round(item.height),
    id: item.id,
    "stroke-width": 0,
    width: round(item.width),
    x: round(item.x),
    y: round(item.y)
  });
}

function valueField(item){
  const args = { ...(item.address ? { base: item.address } : {}), postDecimal: item.decimals, decimalFraction: 0, unit: `T{${item.unit}}`, editable: "No", fillNotEditable: "#ffffff", fontSize: Math.max(8, Math.round(IN_OUT_FONT * item.height / IN_OUT_NATIVE.height)) };
  return svgElement("svg", {
    "atv:refpx": round(item.x + item.width / 2),
    "atv:refpy": round(item.y + item.height / 2),
    height: IN_OUT_NATIVE.height,
    id: item.id,
    transform: `matrix(${round(item.width / IN_OUT_NATIVE.width)},0,0,${round(item.height / IN_OUT_NATIVE.height)},${round(item.x)},${round(item.y)})`,
    width: IN_OUT_NATIVE.width,
    x: 0,
    y: 0,
    "xlink:href": IN_OUT_VALUE
  }, argumentsOf(args));
}

const DEVICE_NATIVES = {
  hub: { width: 248.305, height: 88, boxX: 4.153, boxY: 4, boxWidth: 240, boxHeight: 80 },
  other: { width: 248.31, height: 87.9, boxX: 4.277, boxY: 3.939, boxWidth: 240, boxHeight: 80 }
};

function device(item, style){
  const spec = HYDRONIC_ELEMENTS[item.type];
  const DEVICE_NATIVE = DEVICE_NATIVES[spec.device] ?? DEVICE_NATIVES.other;
  const sx = item.width / DEVICE_NATIVE.boxWidth;
  const sy = item.height / DEVICE_NATIVE.boxHeight;
  const x = item.cx - item.width / 2 - DEVICE_NATIVE.boxX * sx;
  const y = item.cy - item.height / 2 - DEVICE_NATIVE.boxY * sy;
  return svgElement("svg", {
    "atv:refpx": round(item.cx),
    "atv:refpy": round(item.cy),
    height: DEVICE_NATIVE.height,
    id: item.id,
    transform: `matrix(${round(sx)},0,0,${round(sy)},${round(x)},${round(y)})`,
    width: DEVICE_NATIVE.width,
    x: 0,
    y: 0,
    "xlink:href": `${style.library}.${spec.atv}`
  }, argumentsOf(item.args));
}

function generic(item, style){
  const spec = HYDRONIC_ELEMENTS[item.type];
  const native = spec.native;
  const sx = item.width / native.boxWidth;
  const sy = item.height / native.boxHeight;
  const turn = item.rotation ?? 0;
  return svgElement("svg", {
    "atv:refpx": round(item.cx),
    "atv:refpy": round(item.cy),
    height: native.height,
    id: item.id,
    transform: elementMatrix(item.cx, item.cy, native.width, native.height, turn, sx, sy),
    width: native.width,
    x: 0,
    y: 0,
    "xlink:href": `${style.library}.${spec.atv}`
  }, argumentsOf({ ...item.args, font_size: round(item.fontSize / sy) }));
}

const RENDER = {
  gap: (item, style) => rect(item, style.background),
  bar: (item) => rect(item, item.color),
  pipe: (item) => {
    const xs = item.points.map((point) => point.x);
    const ys = item.points.map((point) => point.y);
    return svgElement("polyline", {
      "atv:refpx": round((Math.min(...xs) + Math.max(...xs)) / 2),
      "atv:refpy": round((Math.min(...ys) + Math.max(...ys)) / 2),
      fill: "none",
      id: item.id,
      points: item.points.map((point) => `${point.x},${point.y}`).join(" "),
      stroke: item.color,
      "stroke-dasharray": item.dashArray ?? (item.dash ? `${round(item.width * 2)} ${round(item.width * 1.5)}` : undefined),
      "stroke-linejoin": "round",
      "stroke-width": item.width
    });
  },
  arrow: (item) => svgElement("polygon", {
    "atv:refpx": item.mark.x,
    "atv:refpy": item.mark.y,
    fill: item.color,
    id: item.id,
    points: arrowPoints(item.mark, item.size),
    "stroke-width": 0
  }),
  electric: (item) => item.svg,
  junction: (item, style) => item.dot ? svgElement("circle", { cx: round(item.x), cy: round(item.y), fill: "#1E293B", id: item.id, r: item.radius }) : svgElement("circle", {
    "atv:refpx": round(item.x),
    "atv:refpy": round(item.y),
    cx: round(item.x),
    cy: round(item.y),
    fill: "#ffffff",
    id: item.id,
    r: round(item.radius),
    stroke: style.junctionStroke,
    "stroke-width": round(item.stroke)
  }),
  icon: reference,
  branch: branchHeader,
  device,
  generic,
  field: valueField,
  label: (item) => svgElement("text", {
    "atv:refpx": round(item.box.x + item.box.width / 2),
    "atv:refpy": round(item.box.y + item.box.height / 2),
    fill: item.color,
    "font-family": FONT,
    "font-size": round(item.size),
    "font-weight": item.bold ? "bold" : undefined,
    id: item.id,
    "text-anchor": item.anchor === "start" ? undefined : item.anchor,
    x: round(item.x),
    y: round(item.y)
  }, escapeXml(item.text))
};

export function hydronicToSvg(shapes, style = HYDRONIC_STYLE){
  return buildScene(shapes, style)
    .filter((item) => showsIn(item, "atvise"))
    .map((item) => RENDER[item.kind](item, style))
    .join("\n");
}
