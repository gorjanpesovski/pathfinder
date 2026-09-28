import { escapeXml } from "../export/atvise.js";
import { buildScene } from "../hydronic/scene.js";
import { HYDRONIC_STYLE } from "../hydronic/elements.js";
import { PAGE, pageLeft, sheetSvg, usedPages } from "./sheet.js";

const FONT = "Arial, Helvetica, sans-serif";

function points(list){
  return list.map((point) => `${point.x},${point.y}`).join(" ");
}

function itemSvg(item){
  if (item.kind === "electric") return item.svg;
  if (item.kind === "pipe") {
    const dash = item.dashArray ? ` stroke-dasharray="${item.dashArray}"` : "";
    return `<polyline points="${points(item.points)}" fill="none" stroke="${item.color}" stroke-width="${item.width}" stroke-linejoin="round"${dash}/>`;
  }
  if (item.kind === "junction") return `<circle cx="${item.x}" cy="${item.y}" r="${item.radius}" fill="#1E293B"/>`;
  if (item.kind === "label") {
    const anchor = item.anchor === "start" ? "" : ` text-anchor="${item.anchor}"`;
    return `<text x="${item.x}" y="${item.y}" font-family="${FONT}" font-size="${item.size}"${anchor} fill="${item.color}">${escapeXml(item.text)}</text>`;
  }
  return "";
}

export function sheetPages(shapes, meta = {}){
  const count = Math.max(1, usedPages(shapes));
  const body = buildScene(shapes, HYDRONIC_STYLE).map(itemSvg).join("");
  const pages = [];
  for (let index = 0; index < count; index += 1) {
    pages.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${pageLeft(index)} 0 ${PAGE.width} ${PAGE.height}" width="420mm" height="297mm"><rect x="${pageLeft(index)}" y="0" width="${PAGE.width}" height="${PAGE.height}" fill="#FFFFFF"/>${body}${sheetSvg(index, count, meta).replace(/stroke="#CBD5E1"/, 'stroke="none"')}</svg>`);
  }
  return pages;
}

export function printSheets(shapes, meta = {}){
  const pages = sheetPages(shapes, meta);
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  Object.assign(frame.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  document.body.append(frame);
  const doc = frame.contentDocument;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeXml(meta.project || "Vezalna shema")}</title><style>@page { size: A3 landscape; margin: 0; } html, body { margin: 0; padding: 0; } svg { display: block; width: 420mm; height: 297mm; break-after: page; page-break-after: always; } svg:last-child { break-after: auto; page-break-after: auto; }</style></head><body>${pages.join("")}</body></html>`);
  doc.close();
  const view = frame.contentWindow;
  const cleanup = () => setTimeout(() => frame.remove(), 1000);
  view.addEventListener("afterprint", cleanup, { once: true });
  setTimeout(() => {
    view.focus();
    view.print();
  }, 100);
  return pages.length;
}
