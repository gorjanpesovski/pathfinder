import { escapeXml } from "../export/atvise.js";

export const TEXT_FONT = "Roboto, Arial, sans-serif";

export const TEXT_DEFAULTS = {
  text: "Text",
  fontSize: 16,
  color: "#1E293B",
  bold: false,
  italic: false,
  underline: false,
  align: "left"
};

export const TEXT_LINE = 1.25;

export const TEXT_ALIGNS = ["left", "center", "right"];

const RUN_KEYS = ["bold", "italic", "underline", "size", "color"];

export function lineOf(shape){
  return shape.lineHeight ?? TEXT_LINE;
}

let context = null;

function fontOf(style){
  return `${style.italic ? "italic " : ""}${style.bold ? "700 " : ""}${style.size}px ${TEXT_FONT}`;
}

function measure(value, style){
  try {
    context ??= document.createElement("canvas").getContext("2d");
    context.font = fontOf(style);
    return context.measureText(value).width;
  } catch {
    return value.length * style.size * (style.bold ? 0.6 : 0.55);
  }
}

export function textLines(shape){
  return String(shape.text ?? "").split("\n");
}

export function textParagraphs(shape){
  if (Array.isArray(shape.rich) && shape.rich.length) return shape.rich;
  return textLines(shape).map((line) => ({ runs: line ? [{ text: line }] : [] }));
}

export function baseStyle(shape){
  return { bold: !!shape.bold, italic: !!shape.italic, underline: !!shape.underline, size: shape.fontSize ?? TEXT_DEFAULTS.fontSize, color: shape.color ?? TEXT_DEFAULTS.color };
}

export function runStyle(shape, run){
  const base = baseStyle(shape);
  return Object.fromEntries(RUN_KEYS.map((key) => [key, run[key] ?? base[key]]));
}

function sameStyle(a, b){
  return RUN_KEYS.every((key) => a[key] === b[key]);
}

export function layoutText(shape){
  const base = baseStyle(shape);
  const factor = lineOf(shape);
  const wrap = shape.wrap > 0 ? shape.wrap : Infinity;
  const rows = [];
  const finish = (pieces) => {
    while (pieces.length && pieces[pieces.length - 1].space) pieces.pop();
    const segments = [];
    for (const piece of pieces) {
      const last = segments[segments.length - 1];
      if (last && sameStyle(last.style, piece.style)) {
        last.text += piece.text;
        last.width += piece.width;
      } else segments.push({ text: piece.text, style: piece.style, width: piece.width });
    }
    const size = Math.max(0, ...segments.map((segment) => segment.style.size)) || base.size;
    rows.push({ segments, size, width: segments.reduce((sum, segment) => sum + segment.width, 0) });
  };
  for (const paragraph of textParagraphs(shape)) {
    const pieces = [];
    for (const run of paragraph.runs ?? []) {
      const style = runStyle(shape, run);
      for (const part of String(run.text ?? "").split(/(\s+)/)) {
        if (part) pieces.push({ text: part, style, space: /^\s+$/.test(part), width: measure(part, style) });
      }
    }
    let line = [];
    let width = 0;
    let wrapped = false;
    for (const piece of pieces) {
      if (!piece.space && line.some((entry) => !entry.space) && width + piece.width > wrap) {
        finish(line);
        line = [];
        width = 0;
        wrapped = true;
      }
      if (piece.space && wrapped && !line.length) continue;
      line.push(piece);
      width += piece.width;
    }
    finish(line);
  }
  let top = 0;
  const lines = rows.map((row) => {
    const entry = { ...row, top, baseline: top + row.size * 0.8, advance: row.size * factor };
    top += entry.advance;
    return entry;
  });
  const natural = Math.max(base.size * 0.5, ...lines.map((line) => line.width));
  const width = Number.isFinite(wrap) ? wrap : natural;
  const align = TEXT_ALIGNS.includes(shape.align) ? shape.align : "left";
  return {
    lines,
    width: Math.ceil(width),
    height: Math.ceil(Math.max(top, shape.boxHeight > 0 ? shape.boxHeight : 0)),
    align,
    anchor: align === "center" ? "middle" : align === "right" ? "end" : "start",
    offset: align === "center" ? width / 2 : align === "right" ? width : 0
  };
}

export function textExtent(shape){
  const layout = layoutText(shape);
  return { width: layout.width, height: layout.height };
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

export function clearRunStyle(shape, key){
  const runKey = key === "fontSize" ? "size" : key;
  if (!RUN_KEYS.includes(runKey) || !Array.isArray(shape.rich)) return;
  shape.rich = shape.rich.map((paragraph) => ({ ...paragraph, runs: (paragraph.runs ?? []).map((run) => {
    const { [runKey]: _, ...rest } = run;
    return rest;
  }) }));
}

export function scaleRich(rich, factor){
  if (!Array.isArray(rich)) return rich;
  const round = (value) => Math.round(value * 100) / 100;
  return rich.map((paragraph) => ({ ...paragraph, runs: (paragraph.runs ?? []).map((run) => run.size ? { ...run, size: round(run.size * factor) } : run) }));
}

export function richFrom(shape, paragraphs){
  const base = baseStyle(shape);
  const rich = paragraphs.map((runs) => {
    const merged = [];
    for (const run of runs) {
      if (!run.text) continue;
      const entry = { text: run.text };
      for (const key of RUN_KEYS) if (run[key] !== undefined && run[key] !== base[key]) entry[key] = run[key];
      const last = merged[merged.length - 1];
      if (last && RUN_KEYS.every((key) => last[key] === entry[key])) last.text += entry.text;
      else merged.push(entry);
    }
    return { runs: merged };
  });
  const text = rich.map((paragraph) => paragraph.runs.map((run) => run.text).join("")).join("\n");
  const styled = rich.some((paragraph) => paragraph.runs.some((run) => RUN_KEYS.some((key) => run[key] !== undefined)));
  return { text, rich: styled ? rich : undefined };
}

export function describeText(shape){
  const first = textLines(shape)[0];
  return `“${first.length > 24 ? `${first.slice(0, 24)}…` : first}” · ${shape.fontSize}px`;
}

function round(value){
  return Math.round(value * 1000) / 1000;
}

function segmentAttributes(segment, base){
  const style = segment.style;
  const parts = [];
  if (style.size !== base.size) parts.push(`font-size="${style.size}"`);
  if (style.bold !== base.bold) parts.push(`font-weight="${style.bold ? "bold" : "normal"}"`);
  if (style.italic !== base.italic) parts.push(`font-style="${style.italic ? "italic" : "normal"}"`);
  if (style.underline !== base.underline) parts.push(`text-decoration="${style.underline ? "underline" : "none"}"`);
  if (style.color !== base.color) parts.push(`fill="${style.color}"`);
  return parts.length ? ` ${parts.join(" ")}` : "";
}

export function textToSvg(shape){
  const base = baseStyle(shape);
  const layout = layoutText(shape);
  const x = round(shape.x + layout.offset);
  const spans = layout.lines.map((line) => `<tspan x="${x}" y="${round(shape.y + line.baseline)}">${line.segments.map((segment) => `<tspan${segmentAttributes(segment, base)}>${escapeXml(segment.text)}</tspan>`).join("")}</tspan>`).join("");
  const attributes = [
    `fill="${base.color}"`,
    `font-family="${TEXT_FONT}"`,
    `font-size="${base.size}"`,
    base.bold ? `font-weight="bold"` : "",
    base.italic ? `font-style="italic"` : "",
    base.underline ? `text-decoration="underline"` : "",
    layout.anchor === "start" ? "" : `text-anchor="${layout.anchor}"`
  ].filter(Boolean).join(" ");
  return `<text atv:refpx="${round(shape.x + shape.width / 2)}" atv:refpy="${round(shape.y + shape.height / 2)}" ${attributes} xml:space="preserve" id="text_${shape.id}">${spans}</text>`;
}
