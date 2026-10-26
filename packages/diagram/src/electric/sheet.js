import { escapeXml } from "@pathfinder/core/export/atvise.js";
import { newText } from "@pathfinder/core/tools/text.js";
import { LOGO } from "./logo.js";

export const PAPERS = {
  A4: {
    id: "A4", mm: [297, 210], width: 1188, height: 840, gap: 112,
    frame: { left: 36, top: 36, right: 1168, bottom: 748, outer: 20, footer: 820 },
    columns: 9, rows: ["A", "B", "C", "D", "E", "F"],
    cells: { company: 200, content: 200, page: 150, project: 288, date: 110, number: 100, sheet: 100 }
  },
  A3: {
    id: "A3", mm: [420, 297], width: 1680, height: 1188, gap: 120,
    frame: { left: 36, top: 36, right: 1660, bottom: 1096, outer: 20, footer: 1168 },
    columns: 9, rows: ["A", "B", "C", "D", "E", "F"],
    cells: { company: 250, content: 300, page: 210, project: 430, date: 150, number: 150, sheet: 150 }
  }
};

export const DEFAULT_PAPER = "A4";

export function paperOf(id){
  return PAPERS[id] ?? PAPERS[DEFAULT_PAPER];
}

const INK = "#1E293B";
const FONT = "Arial, Helvetica, sans-serif";

function stride(paper){
  return paper.width + paper.gap;
}

export function pageIndex(x, paper = paperOf()){
  return Math.max(0, Math.floor(x / stride(paper)));
}

export function pageLeft(index, paper = paperOf()){
  return index * stride(paper);
}

export function location(x, paper = paperOf()){
  const { frame, columns } = paper;
  const index = pageIndex(x, paper);
  const local = x - pageLeft(index, paper);
  const column = Math.min(columns, Math.max(1, Math.floor((local - frame.left) / ((frame.right - frame.left) / columns)) + 1));
  return `${index + 1}.${column}`;
}

export function usedPages(shapes, paper = paperOf()){
  let last = -1;
  for (const shape of shapes) {
    if (shape.kind === "equipment") last = Math.max(last, pageIndex(shape.x + shape.width / 2, paper));
    if (shape.kind === "pipe") for (const point of [...(shape.points ?? []), shape.from, shape.to]) {
      if (Number.isFinite(point?.x)) last = Math.max(last, pageIndex(point.x, paper));
    }
  }
  return last + 1;
}

export function boardSize(shapes, paper = paperOf()){
  const used = usedPages(shapes, paper);
  const pages = used + 1;
  return { pages, used, width: pages * stride(paper) - paper.gap, height: paper.height };
}

function text(x, y, value, { size = 12, anchor = "start", bold = false, fill = INK } = {}){
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}"${bold ? ` font-weight="bold"` : ""}${anchor === "start" ? "" : ` text-anchor="${anchor}"`} fill="${fill}">${escapeXml(value)}</text>`;
}

function line(x1, y1, x2, y2, width = 1){
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="${width}"/>`;
}

const TITLE_CELLS = [
  { key: "company", label: "" },
  { key: "content", label: "Vsebina načrta:" },
  { key: "page", label: "Opis strani:" },
  { key: "project", label: "Projekt:" },
  { key: "date", label: "Datum:" },
  { key: "number", label: "Št. načrta:" },
  { key: "sheet", label: "Stran:" }
];

export function sheetDate(date = new Date()){
  const months = ["januar", "februar", "marec", "april", "maj", "junij", "julij", "avgust", "september", "oktober", "november", "december"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function sheetSvg(index, count, meta = {}, paper = paperOf()){
  const { frame: FRAME, columns: COLUMNS, rows: ROWS } = paper;
  const COLUMN_WIDTH = (FRAME.right - FRAME.left) / COLUMNS;
  const ROW_HEIGHT = (FRAME.bottom - FRAME.top) / ROWS.length;
  const x0 = pageLeft(index, paper);
  const parts = [];
  parts.push(`<rect x="${x0}" y="0" width="${paper.width}" height="${paper.height}" fill="none" stroke="#CBD5E1" stroke-width="1"/>`);
  parts.push(`<rect x="${x0 + FRAME.outer}" y="${FRAME.outer}" width="${FRAME.right - FRAME.outer}" height="${FRAME.footer - FRAME.outer}" fill="none" stroke="${INK}" stroke-width="2"/>`);
  parts.push(line(x0 + FRAME.left, FRAME.outer, x0 + FRAME.left, FRAME.bottom));
  parts.push(line(x0 + FRAME.outer, FRAME.top, x0 + FRAME.right, FRAME.top));
  for (let column = 0; column < COLUMNS; column += 1) {
    const left = x0 + FRAME.left + column * COLUMN_WIDTH;
    if (column > 0) parts.push(line(left, FRAME.outer, left, FRAME.top));
    parts.push(text(left + COLUMN_WIDTH / 2, FRAME.outer + 12, String(column + 1), { size: 10, anchor: "middle" }));
  }
  ROWS.forEach((row, position) => {
    const top = FRAME.top + position * ROW_HEIGHT;
    if (position > 0) parts.push(line(x0 + FRAME.outer, top, x0 + FRAME.left, top));
    parts.push(text(x0 + FRAME.outer + 8, top + ROW_HEIGHT / 2 + 4, row, { size: 10, anchor: "middle" }));
  });
  parts.push(line(x0 + FRAME.outer, FRAME.bottom, x0 + FRAME.right, FRAME.bottom, 2));
  const note = meta.notes?.[index];
  if (note) parts.push(text(x0 + FRAME.left + 8, FRAME.top + 16, note, { size: 11 }));
  const values = {
    company: "",
    content: meta.content ?? "Vezalna shema krmilja",
    page: meta.pages?.[index] ?? meta.page ?? "KRMILJE",
    project: meta.project ?? "",
    date: meta.date ?? sheetDate(),
    number: meta.number ?? "",
    sheet: index < count ? `${index + 1} / ${count}` : ""
  };
  let left = x0 + FRAME.outer;
  TITLE_CELLS.forEach((cell, position) => {
    if (position > 0) parts.push(line(left, FRAME.bottom, left, FRAME.footer));
    if (cell.key === "company") {
      const logo = meta.logo ?? LOGO;
      const height = Math.min(46, (paper.cells[cell.key] - 12) * logo.height / logo.width);
      const width = height * logo.width / logo.height;
      parts.push(`<image x="${left + (paper.cells[cell.key] - width) / 2}" y="${FRAME.bottom + 4 + (46 - height) / 2}" width="${width}" height="${height}" href="${logo.href}"/>`);
      parts.push(text(left + paper.cells[cell.key] / 2, FRAME.bottom + 62, meta.company ?? "T3-TECH storitve, d.o.o.", { size: 11, anchor: "middle" }));
    } else {
      parts.push(text(left + 6, FRAME.bottom + 14, cell.label, { size: 9, fill: "#475569" }));
      parts.push(text(left + paper.cells[cell.key] / 2, FRAME.bottom + 46, values[cell.key], { size: cell.key === "project" ? 15 : 13, anchor: "middle" }));
    }
    left += paper.cells[cell.key];
  });
  return parts.join("");
}

export function sheetsSvg(frames, used, meta = {}, paper = paperOf()){
  const parts = [];
  const count = Math.max(1, used);
  for (let index = 0; index < frames; index += 1) parts.push(sheetSvg(index, count, meta, paper));
  for (let index = 1; index < frames; index += 1) {
    parts.push(`<rect x="${pageLeft(index, paper) - paper.gap}" y="0" width="${paper.gap}" height="${paper.height}" fill="#E2E8F0"/>`);
  }
  return parts.join("");
}

const NOTE_SIZE = 10;
const NOTE_CHAR = 5.8;

function noteRows(description){
  return String(description ?? "").split("\n").map((part) => part.trim()).filter(Boolean);
}

export function noteWidth(description, box){
  const longest = Math.max(0, ...noteRows(description).map((row) => row.length));
  return Math.min(longest * NOTE_CHAR, Math.max(box + 40, 220));
}

export function noteText(description, x, y, width, id, source){
  const limit = Math.max(8, Math.floor(width / NOTE_CHAR));
  const lines = [];
  for (const row of noteRows(description)) {
    let current = "";
    for (const word of row.split(/\s+/)) {
      if (current && (current + " " + word).length > limit) {
        lines.push(current);
        current = word;
      } else current = current ? `${current} ${word}` : word;
    }
    if (current) lines.push(current);
  }
  if (!lines.length) return null;
  return { ...newText(x, y, { text: lines.join("\n"), fontSize: NOTE_SIZE, lineHeight: 1.5, color: "#1E293B" }), id, source };
}
