import { escapeXml } from "../export/atvise.js";

export const TEXT_FONT = "Roboto, Arial, sans-serif";

export const TEXT_DEFAULTS = {
  text: "Text",
  fontSize: 16,
  color: "#1E293B",
  bold: false
};

export const TEXT_LINE = 1.25;

let context = null;

function measure(line, size, bold){
  try {
    context ??= document.createElement("canvas").getContext("2d");
    context.font = `${bold ? "700 " : ""}${size}px ${TEXT_FONT}`;
    return context.measureText(line).width;
  } catch {
    return line.length * size * (bold ? 0.6 : 0.55);
  }
}

export function textLines(shape){
  return String(shape.text ?? "").split("\n");
}

export function textExtent(shape){
  const lines = textLines(shape);
  const size = shape.fontSize ?? TEXT_DEFAULTS.fontSize;
  const width = Math.max(size * 0.5, ...lines.map((line) => measure(line, size, shape.bold)));
  return { width: Math.ceil(width), height: Math.ceil(lines.length * size * TEXT_LINE) };
}

export function newText(x, y, options = {}){
  const shape = { kind: "text", x, y, ...TEXT_DEFAULTS, ...options };
  return { ...shape, ...textExtent(shape) };
}

export function refitText(shape){
  const extent = textExtent(shape);
  shape.width = extent.width;
  shape.height = extent.height;
}

export function describeText(shape){
  const first = textLines(shape)[0];
  return `“${first.length > 24 ? `${first.slice(0, 24)}…` : first}” · ${shape.fontSize}px`;
}

function round(value){
  return Math.round(value * 1000) / 1000;
}

export function textToSvg(shape){
  const size = shape.fontSize ?? TEXT_DEFAULTS.fontSize;
  const lines = textLines(shape);
  const baseline = size * 0.8;
  const spans = lines.map((line, index) => `<tspan x="${round(shape.x)}" y="${round(shape.y + baseline + index * size * TEXT_LINE)}">${escapeXml(line)}</tspan>`).join("");
  return `<text atv:refpx="${round(shape.x + shape.width / 2)}" atv:refpy="${round(shape.y + shape.height / 2)}" fill="${shape.color}" font-family="${TEXT_FONT}" font-size="${size}"${shape.bold ? ' font-weight="bold"' : ""} id="text_${shape.id}">${spans}</text>`;
}
