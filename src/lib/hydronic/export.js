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

function reference(item, style){
  const spec = HYDRONIC_ELEMENTS[item.type];
  const native = spec.native ?? style.native?.[item.type] ?? { width: spec.width, height: spec.height };
  const sx = item.width / native.width;
  const sy = spec.inline ? sx : item.height / native.height;
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
  const args = { postDecimal: item.decimals, decimalFraction: 0, unit: `T{${item.unit}}`, editable: "No", fillNotEditable: "#ffffff", fontSize: Math.max(8, Math.round(IN_OUT_FONT * item.height / IN_OUT_NATIVE.height)) };
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
  junction: (item, style) => svgElement("circle", {
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
  branch: reference,
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
