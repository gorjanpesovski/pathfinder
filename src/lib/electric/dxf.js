import { sheetParts } from "./print.js";
import { paperOf, pageLeft } from "./sheet.js";

const LAYERS = [
  { name: "SHEET", color: 8, weight: 13, plot: false },
  { name: "FRAME", color: 7, weight: 25 },
  { name: "TITLE", color: 7, weight: -3 },
  { name: "LOGO", color: 7, weight: -3 },
  { name: "WIRES", color: 7, weight: 30 },
  { name: "PE", color: 3, weight: 30 },
  { name: "SYMBOLS", color: 7, weight: 30 },
  { name: "TEXT", color: 7, weight: -3 },
  { name: "NOTES", color: 7, weight: -3 }
];

const WEIGHTS = [0, 5, 9, 13, 15, 18, 20, 25, 30, 35, 40, 50, 53, 60, 70, 80, 90, 100, 106, 120, 140, 158, 200, 211];
const CAP_HEIGHT = 0.716;
const NAMED = { black: "#000000", white: "#FFFFFF", red: "#FF0000", green: "#008000", blue: "#0000FF" };

function decode(value){
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (match, entity) => {
    const key = entity.toLowerCase();
    if (key[0] === "#") return String.fromCodePoint(key[1] === "x" ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10));
    return { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'" }[key];
  });
}

export function parseXml(source){
  const root = { tag: "#root", attrs: {}, children: [] };
  const stack = [root];
  const pattern = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[([\s\S]*?)\]\]>|<\/([^\s>]+)\s*>|<([^\s/>]+)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let match;
  while ((match = pattern.exec(source))) {
    const parent = stack[stack.length - 1];
    if (match[1] !== undefined) parent.children.push({ tag: "#text", text: match[1] });
    else if (match[2]) {
      if (stack.length > 1) stack.pop();
    } else if (match[3]) {
      const attrs = {};
      for (const pair of match[4].matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[pair[1]] = decode(pair[2] ?? pair[3]);
      const node = { tag: match[3], attrs, children: [] };
      parent.children.push(node);
      if (!match[5]) stack.push(node);
    } else if (match[6] !== undefined) parent.children.push({ tag: "#text", text: decode(match[6]) });
  }
  return root;
}

function multiply(m, n){
  return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
}

function apply(m, x, y){
  return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
}

function parseTransform(value){
  let m = [1, 0, 0, 1, 0, 0];
  for (const part of String(value ?? "").matchAll(/(matrix|translate|scale|rotate)\s*\(([^)]*)\)/g)) {
    const v = part[2].split(/[\s,]+/).filter(Boolean).map(Number);
    let n = [1, 0, 0, 1, 0, 0];
    if (part[1] === "matrix") n = v;
    if (part[1] === "translate") n = [1, 0, 0, 1, v[0] ?? 0, v[1] ?? 0];
    if (part[1] === "scale") n = [v[0], 0, 0, v[1] ?? v[0], 0, 0];
    if (part[1] === "rotate") {
      const a = (v[0] * Math.PI) / 180;
      const [cx, cy] = [v[1] ?? 0, v[2] ?? 0];
      n = multiply(multiply([1, 0, 0, 1, cx, cy], [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]), [1, 0, 0, 1, -cx, -cy]);
    }
    m = multiply(m, n);
  }
  return m;
}

function styleOf(node, inherited){
  const style = { ...inherited };
  const props = { ...node.attrs };
  for (const entry of String(node.attrs.style ?? "").split(";")) {
    const [key, value] = entry.split(":").map((part) => part?.trim());
    if (key && value) props[key] = value;
  }
  for (const key of ["fill", "stroke", "stroke-width", "stroke-dasharray", "font-size", "font-weight", "text-anchor", "text-decoration", "opacity"]) {
    if (props[key] !== undefined) style[key] = props[key];
  }
  return style;
}

function parseColor(value, gradients){
  if (!value || value === "none" || value === "transparent") return null;
  const url = /url\(#([^)]+)\)/.exec(value);
  if (url) return gradients.get(url[1]) ?? null;
  let hex = NAMED[value.toLowerCase()] ?? value;
  const rgb = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(hex);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  if (/^#[0-9a-f]{3}$/i.test(hex)) hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return [0, 0, 0];
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
}

function isWhite(color){
  return color && color.every((part) => part >= 245);
}

function aci(color){
  const [r, g, b] = color.map((part) => part / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 0.12) return max < 0.3 ? 7 : max < 0.6 ? 8 : 9;
  let hue = max === r ? ((g - b) / (max - min)) % 6 : max === g ? (b - r) / (max - min) + 2 : (r - g) / (max - min) + 4;
  hue = (hue * 60 + 360) % 360;
  return [1, 2, 3, 4, 5, 6, 1][Math.round(hue / 60)];
}

function colorCodes(color){
  if (!color) return [];
  const luminance = (0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2]) / 255;
  if (luminance < 0.2) return [[62, 7]];
  return [[62, aci(color)], [420, (color[0] << 16) | (color[1] << 8) | color[2]]];
}

function weightOf(width){
  return WEIGHTS.reduce((best, entry) => (Math.abs(entry - width * 100) < Math.abs(best - width * 100) ? entry : best), WEIGHTS[0]);
}

function arcPoints(from, rx, ry, angle, large, sweep, to){
  if (!rx || !ry) return [to];
  const phi = (angle * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (from.x - to.x) / 2;
  const dy = (from.y - to.y) / 2;
  const x1 = cos * dx + sin * dy;
  const y1 = -sin * dx + cos * dy;
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const scale = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (scale > 1) {
    rx *= Math.sqrt(scale);
    ry *= Math.sqrt(scale);
  }
  const sign = large === sweep ? -1 : 1;
  const top = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const factor = sign * Math.sqrt(Math.max(0, top / (rx * rx * y1 * y1 + ry * ry * x1 * x1)));
  const cx1 = (factor * rx * y1) / ry;
  const cy1 = (-factor * ry * x1) / rx;
  const cx = cos * cx1 - sin * cy1 + (from.x + to.x) / 2;
  const cy = sin * cx1 + cos * cy1 + (from.y + to.y) / 2;
  const start = Math.atan2((y1 - cy1) / ry, (x1 - cx1) / rx);
  let delta = Math.atan2((-y1 - cy1) / ry, (-x1 - cx1) / rx) - start;
  if (sweep && delta < 0) delta += 2 * Math.PI;
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  const steps = Math.max(4, Math.ceil(Math.abs(delta) / (Math.PI / 18)));
  const points = [];
  for (let step = 1; step <= steps; step += 1) {
    const t = start + (delta * step) / steps;
    points.push({ x: cx + rx * Math.cos(t) * cos - ry * Math.sin(t) * sin, y: cy + rx * Math.cos(t) * sin + ry * Math.sin(t) * cos });
  }
  points[points.length - 1] = to;
  return points;
}

function bezier(points, steps){
  const result = [];
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    const u = 1 - t;
    if (points.length === 3) result.push({ x: u * u * points[0].x + 2 * u * t * points[1].x + t * t * points[2].x, y: u * u * points[0].y + 2 * u * t * points[1].y + t * t * points[2].y });
    else result.push({
      x: u * u * u * points[0].x + 3 * u * u * t * points[1].x + 3 * u * t * t * points[2].x + t * t * t * points[3].x,
      y: u * u * u * points[0].y + 3 * u * u * t * points[1].y + 3 * u * t * t * points[2].y + t * t * t * points[3].y
    });
  }
  return result;
}

export function pathPolylines(d){
  const tokens = String(d ?? "").match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];
  const paths = [];
  let current = null;
  let point = { x: 0, y: 0 };
  let start = point;
  let control = null;
  let command = "";
  let index = 0;
  const number = () => Number(tokens[index++]);
  const begin = (next) => {
    current = { points: [next], closed: false };
    paths.push(current);
    start = next;
  };
  while (index < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[index])) command = tokens[index++];
    const relative = command === command.toLowerCase();
    const base = relative ? point : { x: 0, y: 0 };
    const upper = command.toUpperCase();
    let next;
    if (upper === "Z") {
      if (current) current.closed = true;
      point = start;
      control = null;
      current = null;
      continue;
    }
    if (upper === "M") {
      next = { x: base.x + number(), y: base.y + number() };
      begin(next);
      command = relative ? "l" : "L";
      point = next;
      control = null;
      continue;
    }
    if (!current) begin(point);
    if (upper === "L") next = { x: base.x + number(), y: base.y + number() };
    else if (upper === "H") next = { x: (relative ? point.x : 0) + number(), y: point.y };
    else if (upper === "V") next = { x: point.x, y: (relative ? point.y : 0) + number() };
    if (next) {
      current.points.push(next);
      point = next;
      control = null;
      continue;
    }
    if (upper === "C" || upper === "S") {
      const first = upper === "C" ? { x: base.x + number(), y: base.y + number() } : control ? { x: 2 * point.x - control.x, y: 2 * point.y - control.y } : point;
      const second = { x: base.x + number(), y: base.y + number() };
      next = { x: base.x + number(), y: base.y + number() };
      current.points.push(...bezier([point, first, second, next], 12));
      control = second;
    } else if (upper === "Q" || upper === "T") {
      const first = upper === "Q" ? { x: base.x + number(), y: base.y + number() } : control ? { x: 2 * point.x - control.x, y: 2 * point.y - control.y } : point;
      next = { x: base.x + number(), y: base.y + number() };
      current.points.push(...bezier([point, first, next], 8));
      control = first;
    } else if (upper === "A") {
      const [rx, ry, angle, large, sweep] = [number(), number(), number(), number(), number()];
      next = { x: base.x + number(), y: base.y + number() };
      current.points.push(...arcPoints(point, rx, ry, angle, !!large, !!sweep, next));
      control = null;
    } else {
      index += 1;
      continue;
    }
    point = next;
  }
  return paths.filter((path) => path.points.length > 1);
}

function textOf(node){
  if (node.tag === "#text") return node.text;
  return node.children.map(textOf).join("");
}

function unicode(value){
  return Array.from(value).map((char) => {
    const code = char.codePointAt(0);
    if (char === "\\") return "\\\\";
    if (code < 32) return "";
    return code > 126 ? `\\U+${code.toString(16).toUpperCase().padStart(4, "0")}` : char;
  }).join("");
}

class Drawing {
  constructor(){
    this.handle = 0x100;
    this.entities = [];
    this.linetypes = new Map();
    this.min = { x: Infinity, y: Infinity };
    this.max = { x: -Infinity, y: -Infinity };
    this.gradients = new Map();
    this.space = this.next();
  }

  next(){
    return (this.handle++).toString(16).toUpperCase();
  }

  extend(point){
    this.min = { x: Math.min(this.min.x, point.x), y: Math.min(this.min.y, point.y) };
    this.max = { x: Math.max(this.max.x, point.x), y: Math.max(this.max.y, point.y) };
  }

  linetype(dash, scale){
    if (!dash || dash === "none") return null;
    const parts = String(dash).split(/[\s,]+/).filter(Boolean).map((part) => Number(part) * scale);
    if (!parts.length || parts.some((part) => !Number.isFinite(part))) return null;
    const pattern = parts.length % 2 ? [...parts, ...parts] : parts;
    const key = pattern.map((part) => part.toFixed(3)).join(",");
    if (!this.linetypes.has(key)) this.linetypes.set(key, { name: `DASH${this.linetypes.size + 1}`, pattern });
    return this.linetypes.get(key).name;
  }

  entity(type, layer, codes, style = {}){
    const head = [[0, type], [5, this.next()], [330, this.space], [100, "AcDbEntity"], [8, layer]];
    if (style.linetype) head.push([6, style.linetype]);
    head.push(...colorCodes(style.color));
    if (style.weight !== undefined) head.push([370, style.weight]);
    this.entities.push(...head, ...codes);
  }

  polyline(layer, points, closed, style){
    if (points.length < 2) return;
    points.forEach((point) => this.extend(point));
    this.entity("LWPOLYLINE", layer, [[100, "AcDbPolyline"], [90, points.length], [70, closed ? 1 : 0], [43, 0], ...points.flatMap((point) => [[10, point.x], [20, point.y]])], style);
  }

  circle(layer, center, radius, style){
    this.extend({ x: center.x - radius, y: center.y - radius });
    this.extend({ x: center.x + radius, y: center.y + radius });
    this.entity("CIRCLE", layer, [[100, "AcDbCircle"], [10, center.x], [20, center.y], [30, 0], [40, radius]], style);
  }

  ellipse(layer, center, major, ratio, style){
    this.extend({ x: center.x - Math.hypot(major.x, major.y), y: center.y - Math.hypot(major.x, major.y) });
    this.extend({ x: center.x + Math.hypot(major.x, major.y), y: center.y + Math.hypot(major.x, major.y) });
    this.entity("ELLIPSE", layer, [[100, "AcDbEllipse"], [10, center.x], [20, center.y], [30, 0], [11, major.x], [21, major.y], [31, 0], [210, 0], [220, 0], [230, 1], [40, ratio], [41, 0], [42, 2 * Math.PI]], style);
  }

  hatch(layer, loops, color){
    const usable = loops.filter((loop) => loop.length > 2);
    if (!usable.length) return;
    usable.flat().forEach((point) => this.extend(point));
    const codes = [[100, "AcDbHatch"], [10, 0], [20, 0], [30, 0], [210, 0], [220, 0], [230, 1], [2, "SOLID"], [70, 1], [71, 0], [91, usable.length]];
    for (const loop of usable) codes.push([92, 2], [72, 0], [73, 1], [93, loop.length], ...loop.flatMap((point) => [[10, point.x], [20, point.y]]), [97, 0]);
    codes.push([75, 0], [76, 1], [98, 0]);
    this.entity("HATCH", layer, codes, { color });
  }

  text(layer, point, height, value, { anchor = "start", bold = false, rotation = 0, color, underline = false } = {}){
    const content = `${underline ? "%%u" : ""}${unicode(value.replace(/\s+$/, ""))}`;
    if (!content.trim()) return;
    this.extend(point);
    this.extend({ x: point.x + height * value.length * 0.6, y: point.y + height });
    const justify = anchor === "middle" ? 1 : anchor === "end" ? 2 : 0;
    const codes = [[100, "AcDbText"], [10, point.x], [20, point.y], [30, 0], [40, height], [1, content], [50, rotation], [7, bold ? "ARIAL_BOLD" : "ARIAL"]];
    if (justify) codes.push([72, justify], [11, point.x], [21, point.y], [31, 0]);
    codes.push([100, "AcDbText"]);
    this.entity("TEXT", layer, codes, { color });
  }
}

function collectGradients(node, drawing){
  if (/linearGradient|radialGradient/.test(node.tag)) {
    const stops = node.children.filter((child) => child.tag === "stop").map((child) => {
      const style = styleOf(child, {});
      const color = child.attrs["stop-color"] ?? /stop-color:\s*([^;]+)/.exec(child.attrs.style ?? "")?.[1];
      return parseColor(color ?? style.fill, drawing.gradients);
    }).filter(Boolean);
    if (stops.length) {
      const sum = stops.reduce((total, stop) => total.map((part, position) => part + stop[position]), [0, 0, 0]);
      drawing.gradients.set(node.attrs.id, sum.map((part) => Math.round(part / stops.length)));
    }
  }
  node.children?.forEach((child) => collectGradients(child, drawing));
}

function numberOf(value, fallback = 0){
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function scaleOf(m){
  return Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
}

function draw(drawing, node, m, inherited, layer){
  if (node.tag === "#text" || ["defs", "clipPath", "linearGradient", "radialGradient", "title", "metadata", "style"].includes(node.tag)) return;
  const local = multiply(m, parseTransform(node.attrs.transform));
  const style = styleOf(node, inherited);
  const fill = parseColor(style.fill ?? "#000000", drawing.gradients);
  const stroke = parseColor(style.stroke, drawing.gradients);
  const scale = scaleOf(local);
  const strokeStyle = stroke ? { color: stroke, weight: weightOf(numberOf(style["stroke-width"], 1) * scale), linetype: drawing.linetype(style["stroke-dasharray"], scale) } : null;
  const filled = fill && !isWhite(fill);
  const attr = (name, fallback = 0) => numberOf(node.attrs[name], fallback);
  const shapes = (paths) => {
    const mapped = paths.map((path) => ({ ...path, points: path.points.map((point) => apply(local, point.x, point.y)) }));
    if (filled) drawing.hatch(layer, mapped.map((path) => path.points), fill);
    if (strokeStyle) for (const path of mapped) drawing.polyline(layer, path.points, path.closed, strokeStyle);
  };
  if (node.tag === "svg" || node.tag === "g" || node.tag === "a" || node.tag === "#root") {
    for (const child of node.children) draw(drawing, child, local, style, layer);
  } else if (node.tag === "line") {
    if (strokeStyle) drawing.polyline(layer, [apply(local, attr("x1"), attr("y1")), apply(local, attr("x2"), attr("y2"))], false, strokeStyle);
  } else if (node.tag === "polyline" || node.tag === "polygon") {
    const values = String(node.attrs.points ?? "").split(/[\s,]+/).filter(Boolean).map(Number);
    const points = [];
    for (let index = 0; index + 1 < values.length; index += 2) points.push({ x: values[index], y: values[index + 1] });
    if (node.tag === "polyline" && !strokeStyle) return;
    shapes([{ points, closed: node.tag === "polygon" }]);
  } else if (node.tag === "rect") {
    const [x, y, width, height] = [attr("x"), attr("y"), attr("width"), attr("height")];
    if (width > 0 && height > 0) shapes([{ points: [{ x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height }], closed: true }]);
  } else if (node.tag === "circle" || node.tag === "ellipse") {
    const [cx, cy] = [attr("cx"), attr("cy")];
    const rx = node.tag === "circle" ? attr("r") : attr("rx");
    const ry = node.tag === "circle" ? attr("r") : attr("ry");
    if (!(rx > 0 && ry > 0)) return;
    if (filled) {
      const ring = [];
      for (let step = 0; step < 36; step += 1) ring.push(apply(local, cx + rx * Math.cos((step * Math.PI) / 18), cy + ry * Math.sin((step * Math.PI) / 18)));
      drawing.hatch(layer, [ring], fill);
    }
    if (!strokeStyle) return;
    const center = apply(local, cx, cy);
    const uniform = Math.abs(Math.hypot(local[0], local[1]) - Math.hypot(local[2], local[3])) < 1e-9 && Math.abs(local[0] * local[2] + local[1] * local[3]) < 1e-9;
    if (rx === ry && uniform) drawing.circle(layer, center, rx * scale, strokeStyle);
    else {
      const majorX = rx >= ry;
      const tip = apply(local, cx + (majorX ? rx : 0), cy + (majorX ? 0 : ry));
      drawing.ellipse(layer, center, { x: tip.x - center.x, y: tip.y - center.y }, Math.min(rx, ry) / Math.max(rx, ry), strokeStyle);
    }
  } else if (node.tag === "path") {
    shapes(pathPolylines(node.attrs.d));
  } else if (node.tag === "image") {
    const href = node.attrs.href ?? node.attrs["xlink:href"] ?? "";
    const data = /^data:image\/svg\+xml;base64,(.*)$/.exec(href);
    if (!data) return;
    const inner = parseXml(typeof atob === "function" ? new TextDecoder().decode(Uint8Array.from(atob(data[1]), (char) => char.charCodeAt(0))) : Buffer.from(data[1], "base64").toString("utf8"));
    const svg = inner.children.find((child) => child.tag === "svg");
    if (!svg) return;
    const box = String(svg.attrs.viewBox ?? `0 0 ${svg.attrs.width} ${svg.attrs.height}`).split(/[\s,]+/).map(Number);
    const fit = Math.min(attr("width") / box[2], attr("height") / box[3]);
    const offset = [attr("x") + (attr("width") - box[2] * fit) / 2, attr("y") + (attr("height") - box[3] * fit) / 2];
    collectGradients(svg, drawing);
    draw(drawing, { ...svg, attrs: { ...svg.attrs, transform: "" } }, multiply(local, [fit, 0, 0, fit, offset[0] - box[0] * fit, offset[1] - box[1] * fit]), {}, "LOGO");
  } else if (node.tag === "text") {
    const rotation = (Math.atan2(local[1], local[0]) * 180) / Math.PI;
    const lineOf = (span, spanStyle, x, y) => {
      const segments = span.children.filter((child) => child.tag === "tspan" || child.tag === "#text");
      const styles = segments.map((segment) => segment.tag === "#text" ? spanStyle : styleOf(segment, spanStyle));
      const value = segments.map(textOf).join("");
      const size = Math.max(...styles.map((entry) => numberOf(entry["font-size"], 12)), numberOf(spanStyle["font-size"], 12));
      const bold = styles.some((entry) => /bold|[6-9]00/.test(entry["font-weight"] ?? "")) && styles.every((entry, position) => /bold|[6-9]00/.test(entry["font-weight"] ?? "") || !textOf(segments[position]).trim());
      const color = parseColor(styles.find((entry, position) => textOf(segments[position]).trim())?.fill ?? spanStyle.fill, drawing.gradients);
      drawing.text(layer, apply(local, x, y), size * CAP_HEIGHT * scale, value, {
        anchor: spanStyle["text-anchor"], bold, rotation, color,
        underline: styles.some((entry) => entry["text-decoration"] === "underline")
      });
    };
    const lines = node.children.filter((child) => child.tag === "tspan" && child.attrs.y !== undefined);
    if (lines.length) for (const span of lines) lineOf(span, styleOf(span, style), numberOf(span.attrs.x, attr("x")), numberOf(span.attrs.y, attr("y")));
    else lineOf(node, style, attr("x"), attr("y"));
  }
}

function tag(code, value){
  const text = typeof value === "number" ? (Number.isInteger(value) ? String(value) : String(Math.round(value * 1e6) / 1e6)) : String(value);
  return `${code}\n${text}`;
}

function table(drawing, name, records, extra = []){
  const handle = drawing.next();
  const rows = [[0, "TABLE"], [2, name], [5, handle], [330, 0], [100, "AcDbSymbolTable"], [70, records.length], ...extra];
  for (const record of records) rows.push(...record(handle));
  rows.push([0, "ENDTAB"]);
  return rows;
}

function record(drawing, type, subclass, codes){
  return (owner) => [[0, type], [type === "DIMSTYLE" ? 105 : 5, drawing.next()], [330, owner], [100, "AcDbSymbolTableRecord"], [100, subclass], ...codes];
}

export function sheetsDxf(shapes, meta = {}, paper = paperOf()){
  const { count, body, frames } = sheetParts(shapes, meta, paper);
  const k = paper.mm[0] / paper.width;
  const root = [k, 0, 0, -k, 0, paper.height * k];
  const drawing = new Drawing();
  const style = { fill: "#000000" };
  const layerOfFrame = (svg) => svg.replace(/<text[\s\S]*?<\/text>/g, "");
  const textOfFrame = (svg) => (svg.match(/<text[\s\S]*?<\/text>/g) ?? []).join("");
  for (let index = 0; index < count; index += 1) {
    const left = pageLeft(index, paper);
    draw(drawing, parseXml(`<rect x="${left}" y="0" width="${paper.width}" height="${paper.height}" fill="none" stroke="#808080" stroke-width="0.5"/>`), root, style, "SHEET");
    draw(drawing, parseXml(layerOfFrame(frames[index])), root, style, "FRAME");
    draw(drawing, parseXml(textOfFrame(frames[index])), root, style, "TITLE");
  }
  for (const part of body) draw(drawing, parseXml(part.svg), root, style, part.layer);

  const blockModel = drawing.next();
  const blockPaper = drawing.next();
  const rootDictionary = drawing.next();
  const groups = drawing.next();
  const layouts = drawing.next();
  const modelLayout = drawing.next();
  const paperLayout = drawing.next();
  const linetypes = [
    record(drawing, "LTYPE", "AcDbLinetypeTableRecord", [[2, "ByBlock"], [70, 0], [3, ""], [72, 65], [73, 0], [40, 0]]),
    record(drawing, "LTYPE", "AcDbLinetypeTableRecord", [[2, "ByLayer"], [70, 0], [3, ""], [72, 65], [73, 0], [40, 0]]),
    record(drawing, "LTYPE", "AcDbLinetypeTableRecord", [[2, "Continuous"], [70, 0], [3, "Solid line"], [72, 65], [73, 0], [40, 0]]),
    ...[...drawing.linetypes.values()].map((entry) => record(drawing, "LTYPE", "AcDbLinetypeTableRecord", [
      [2, entry.name], [70, 0], [3, entry.pattern.map((part, position) => (position % 2 ? " " : "_")).join("")], [72, 65], [73, entry.pattern.length],
      [40, entry.pattern.reduce((sum, part) => sum + part, 0)], ...entry.pattern.flatMap((part, position) => [[49, position % 2 ? -part : part], [74, 0]])
    ]))
  ];
  const layers = [{ name: "0", color: 7, weight: -3 }, ...LAYERS].map((layer) => record(drawing, "LAYER", "AcDbLayerTableRecord", [
    [2, layer.name], [70, 0], [62, layer.color], [6, "Continuous"], ...(layer.plot === false ? [[290, 0]] : []), [370, layer.weight]
  ]));
  const styles = [["Standard", "arial.ttf"], ["ARIAL", "arial.ttf"], ["ARIAL_BOLD", "arialbd.ttf"]].map(([name, font]) => record(drawing, "STYLE", "AcDbTextStyleTableRecord", [
    [2, name], [70, 0], [40, 0], [41, 1], [50, 0], [71, 0], [42, 2.5], [3, font], [4, ""]
  ]));
  const width = drawing.max.x - drawing.min.x || paper.mm[0];
  const height = drawing.max.y - drawing.min.y || paper.mm[1];
  const center = { x: drawing.min.x + width / 2, y: drawing.min.y + height / 2 };
  const vport = record(drawing, "VPORT", "AcDbViewportTableRecord", [
    [2, "*Active"], [70, 0], [10, 0], [20, 0], [11, 1], [21, 1], [12, center.x], [22, center.y], [13, 0], [23, 0], [14, 10], [24, 10], [15, 10], [25, 10],
    [16, 0], [26, 0], [36, 1], [17, 0], [27, 0], [37, 0], [40, height * 1.1], [41, Math.max(1, width / height)], [42, 50], [43, 0], [44, 0], [50, 0], [51, 0],
    [71, 0], [72, 100], [73, 1], [74, 3], [75, 0], [76, 0], [77, 0], [78, 0]
  ]);

  const rows = [];
  rows.push([0, "SECTION"], [2, "HEADER"],
    [9, "$ACADVER"], [1, "AC1018"],
    [9, "$DWGCODEPAGE"], [3, "ANSI_1250"],
    [9, "$INSBASE"], [10, 0], [20, 0], [30, 0],
    [9, "$EXTMIN"], [10, drawing.min.x], [20, drawing.min.y], [30, 0],
    [9, "$EXTMAX"], [10, drawing.max.x], [20, drawing.max.y], [30, 0],
    [9, "$LIMMIN"], [10, 0], [20, 0],
    [9, "$LIMMAX"], [10, paper.mm[0]], [20, paper.mm[1]],
    [9, "$LTSCALE"], [40, 1],
    [9, "$TEXTSTYLE"], [7, "ARIAL"],
    [9, "$CLAYER"], [8, "0"],
    [9, "$INSUNITS"], [70, 4],
    [9, "$MEASUREMENT"], [70, 1],
    [9, "$LWDISPLAY"], [290, 1],
    [9, "$HANDSEED"], [5, "FFFFF"],
    [0, "ENDSEC"]);
  rows.push([0, "SECTION"], [2, "CLASSES"], [0, "ENDSEC"]);
  rows.push([0, "SECTION"], [2, "TABLES"],
    ...table(drawing, "VPORT", [vport]),
    ...table(drawing, "LTYPE", linetypes),
    ...table(drawing, "LAYER", layers),
    ...table(drawing, "STYLE", styles),
    ...table(drawing, "VIEW", []),
    ...table(drawing, "UCS", []),
    ...table(drawing, "APPID", [record(drawing, "APPID", "AcDbRegAppTableRecord", [[2, "ACAD"], [70, 0]])]),
    ...table(drawing, "DIMSTYLE", [record(drawing, "DIMSTYLE", "AcDbDimStyleTableRecord", [[2, "Standard"], [70, 0]])], [[100, "AcDbDimStyleTable"], [71, 0]]));
  const blockTable = drawing.next();
  rows.push([0, "TABLE"], [2, "BLOCK_RECORD"], [5, blockTable], [330, 0], [100, "AcDbSymbolTable"], [70, 2],
    [0, "BLOCK_RECORD"], [5, drawing.space], [330, blockTable], [100, "AcDbSymbolTableRecord"], [100, "AcDbBlockTableRecord"], [2, "*Model_Space"], [340, modelLayout],
    [0, "BLOCK_RECORD"], [5, blockPaper], [330, blockTable], [100, "AcDbSymbolTableRecord"], [100, "AcDbBlockTableRecord"], [2, "*Paper_Space"], [340, paperLayout],
    [0, "ENDTAB"], [0, "ENDSEC"]);
  const block = (name, owner, paperSpace) => [
    [0, "BLOCK"], [5, drawing.next()], [330, owner], [100, "AcDbEntity"], ...(paperSpace ? [[67, 1]] : []), [8, "0"], [100, "AcDbBlockBegin"], [2, name], [70, 0], [10, 0], [20, 0], [30, 0], [3, name], [1, ""],
    [0, "ENDBLK"], [5, drawing.next()], [330, owner], [100, "AcDbEntity"], ...(paperSpace ? [[67, 1]] : []), [8, "0"], [100, "AcDbBlockEnd"]
  ];
  rows.push([0, "SECTION"], [2, "BLOCKS"], ...block("*Model_Space", drawing.space, false), ...block("*Paper_Space", blockPaper, true), [0, "ENDSEC"]);
  const entities = [];
  for (let index = 0; index < drawing.entities.length; index += 1) entities.push(drawing.entities[index]);
  rows.push([0, "SECTION"], [2, "ENTITIES"], ...entities, [0, "ENDSEC"]);
  const layout = (handle, name, order, owner, flags) => [
    [0, "LAYOUT"], [5, handle], [102, "{ACAD_REACTORS"], [330, layouts], [102, "}"], [330, layouts],
    [100, "AcDbPlotSettings"], [1, ""], [2, ""], [4, ""], [6, ""], [40, 0], [41, 0], [42, 0], [43, 0], [44, 0], [45, 0], [46, 0], [47, 0], [48, 0], [49, 0],
    [140, 0], [141, 0], [142, 1], [143, 1], [70, flags], [72, 1], [73, 0], [74, 5], [7, ""], [75, 16], [147, 1], [148, 0], [149, 0],
    [100, "AcDbLayout"], [1, name], [70, 1], [71, order], [10, 0], [20, 0], [11, paper.mm[0]], [21, paper.mm[1]], [12, 0], [22, 0], [32, 0],
    [14, drawing.min.x], [24, drawing.min.y], [34, 0], [15, drawing.max.x], [25, drawing.max.y], [35, 0], [146, 0], [13, 0], [23, 0], [33, 0],
    [16, 1], [26, 0], [36, 0], [17, 0], [27, 1], [37, 0], [76, 0], [330, owner]
  ];
  rows.push([0, "SECTION"], [2, "OBJECTS"],
    [0, "DICTIONARY"], [5, rootDictionary], [330, 0], [100, "AcDbDictionary"], [281, 1], [3, "ACAD_GROUP"], [350, groups], [3, "ACAD_LAYOUT"], [350, layouts],
    [0, "DICTIONARY"], [5, groups], [330, rootDictionary], [100, "AcDbDictionary"], [281, 1],
    [0, "DICTIONARY"], [5, layouts], [330, rootDictionary], [100, "AcDbDictionary"], [281, 1], [3, "Model"], [350, modelLayout], [3, "Layout1"], [350, paperLayout],
    ...layout(modelLayout, "Model", 0, drawing.space, 1712),
    ...layout(paperLayout, "Layout1", 1, blockPaper, 688),
    [0, "ENDSEC"], [0, "EOF"]);
  const seed = (drawing.handle + 1).toString(16).toUpperCase();
  return rows.map(([code, value]) => tag(code, code === 5 && value === "FFFFF" ? seed : value)).join("\n") + "\n";
}

export function downloadDxf(shapes, meta = {}, paper = paperOf(), name = "vezalna-shema"){
  const text = sheetsDxf(shapes, meta, paper);
  const url = URL.createObjectURL(new Blob([text], { type: "application/dxf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name.replace(/[\\/:*?"<>|]+/g, "_") || "vezalna-shema"}.dxf`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
