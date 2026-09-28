import { escapeXml } from "../export/atvise.js";

export const PAGE = { width: 1680, height: 1188, gap: 80 };
export const STRIDE = PAGE.width + PAGE.gap;

export const FRAME = { left: 36, top: 36, right: 1660, bottom: 1096, outer: 20, footer: 1168 };
export const COLUMNS = 9;
export const ROWS = ["A", "B", "C", "D", "E", "F"];

const INK = "#1E293B";
const FONT = "Arial, Helvetica, sans-serif";

const COLUMN_WIDTH = (FRAME.right - FRAME.left) / COLUMNS;
const ROW_HEIGHT = (FRAME.bottom - FRAME.top) / ROWS.length;

export function pageIndex(x){
  return Math.max(0, Math.floor(x / STRIDE));
}

export function pageLeft(index){
  return index * STRIDE;
}

export function location(x){
  const index = pageIndex(x);
  const local = x - pageLeft(index);
  const column = Math.min(COLUMNS, Math.max(1, Math.floor((local - FRAME.left) / COLUMN_WIDTH) + 1));
  return `${index + 1}.${column}`;
}

export function usedPages(shapes){
  let last = -1;
  for (const shape of shapes) {
    if (shape.kind === "equipment") last = Math.max(last, pageIndex(shape.x + shape.width / 2));
    if (shape.kind === "pipe") for (const point of [...(shape.points ?? []), shape.from, shape.to]) {
      if (Number.isFinite(point?.x)) last = Math.max(last, pageIndex(point.x));
    }
  }
  return last + 1;
}

export function boardSize(shapes){
  const used = usedPages(shapes);
  const pages = used + 1;
  return { pages, used, width: pages * STRIDE - PAGE.gap, height: PAGE.height };
}

function text(x, y, value, { size = 12, anchor = "start", bold = false, fill = INK } = {}){
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}"${bold ? ` font-weight="bold"` : ""}${anchor === "start" ? "" : ` text-anchor="${anchor}"`} fill="${fill}">${escapeXml(value)}</text>`;
}

function line(x1, y1, x2, y2, width = 1){
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="${width}"/>`;
}

const TITLE_CELLS = [
  { key: "company", label: "", width: 250 },
  { key: "content", label: "Vsebina načrta:", width: 300 },
  { key: "page", label: "Opis strani:", width: 210 },
  { key: "project", label: "Projekt:", width: 430 },
  { key: "date", label: "Datum:", width: 150 },
  { key: "number", label: "Št. načrta:", width: 150 },
  { key: "sheet", label: "Stran:", width: 150 }
];

export function sheetDate(date = new Date()){
  const months = ["januar", "februar", "marec", "april", "maj", "junij", "julij", "avgust", "september", "oktober", "november", "december"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function sheetSvg(index, count, meta = {}){
  const x0 = pageLeft(index);
  const parts = [];
  parts.push(`<rect x="${x0}" y="0" width="${PAGE.width}" height="${PAGE.height}" fill="none" stroke="#CBD5E1" stroke-width="1"/>`);
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
      parts.push(text(left + cell.width / 2, FRAME.bottom + 36, "T3-TECH", { size: 24, anchor: "middle", bold: true, fill: "#1D4ED8" }));
      parts.push(text(left + cell.width / 2, FRAME.bottom + 56, "T3-TECH storitve, d.o.o.", { size: 11, anchor: "middle" }));
    } else {
      parts.push(text(left + 6, FRAME.bottom + 14, cell.label, { size: 9, fill: "#475569" }));
      parts.push(text(left + cell.width / 2, FRAME.bottom + 46, values[cell.key], { size: cell.key === "project" ? 15 : 13, anchor: "middle" }));
    }
    left += cell.width;
  });
  return parts.join("");
}

export function sheetsSvg(frames, used, meta = {}){
  const parts = [];
  const count = Math.max(1, used);
  for (let index = 0; index < frames; index += 1) parts.push(sheetSvg(index, count, meta));
  for (let index = 1; index < frames; index += 1) {
    parts.push(`<rect x="${pageLeft(index) - PAGE.gap}" y="0" width="${PAGE.gap}" height="${PAGE.height}" fill="#E2E8F0"/>`);
  }
  return parts.join("");
}
