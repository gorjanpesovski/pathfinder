import { escapeXml } from "../export/atvise.js";
import { HYDRONIC_ELEMENTS, HYDRONIC_STYLE, mediumOf } from "./elements.js";
import { computeRoutes } from "./route.js";
import { fittingPose, fittingSize, pipeDecorations, pipeWidthOf } from "./export.js";
import { touchRoute } from "./outline.js";
import { branchGaps, isBar, isBranch } from "./branch.js";
import { branchParts, BRANCH_IMAGES } from "./branchParts.js";
import { readoutLayout, readoutRowBoxes, READOUT } from "./readout.js";
import { rotationOf, uprightSize } from "./frame.js";
import { textLines, TEXT_LINE } from "../tools/text.js";
import { tankParts } from "./tank.js";
import { elementLabel } from "./label.js";
import { fittingLabel } from "./fittingLabel.js";

export const PGD_VERSION = { ver: "020900744", v: "02.09.00.744" };

const INK = "#414142";
const PANEL = "#58595B";
const FONT = "Calibri";

function num(value){
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export function rgb(hex){
  const value = parseInt(String(hex).replace("#", "").slice(0, 6), 16);
  return `rgb(${(value >> 16) & 255},${(value >> 8) & 255},${value & 255})`;
}

function attributes(map){
  return Object.entries(map)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => `${key}="${escapeXml(typeof value === "number" ? num(value) : value)}"`)
    .join(" ");
}

export function rotationMatrix(width, height, rotation){
  const radians = rotation * Math.PI / 180;
  const cos = Math.round(Math.cos(radians) * 1e6) / 1e6 || 0;
  const sin = Math.round(Math.sin(radians) * 1e6) / 1e6 || 0;
  const corners = [[0, 0], [width, 0], [0, height], [width, height]].map(([x, y]) => [cos * x - sin * y, sin * x + cos * y]);
  const minX = Math.min(...corners.map(([x]) => x));
  const minY = Math.min(...corners.map(([, y]) => y));
  const maxX = Math.max(...corners.map(([x]) => x));
  const maxY = Math.max(...corners.map(([, y]) => y));
  return {
    mtx: [cos, sin, 0, -sin, cos, 0, -minX, -minY, 1].map((value) => num(value || 0)).join(","),
    width: maxX - minX,
    height: maxY - minY
  };
}

function cleanIcon(source){
  let svg = source
    .replace(/<\?xml[^>]*\?>\s*/, "")
    .replace(/<metadata\b[^>]*\/>|<metadata\b[\s\S]*?<\/metadata>/g, "")
    .replace(/<script\b[^>]*\/>|<script\b[\s\S]*?<\/script>/g, "")
    .replace(/<svg\b[^>]*xlink:href="SYSTEM[^"]*"[^>]*\/>/g, "")
    .replace(/\satv:[\w-]+="[^"]*"/g, "");
  const root = svg.match(/<svg\b[^>]*>/)[0];
  if (!/\sviewBox=/.test(root)) {
    const width = root.match(/\swidth="([\d.]+)"/)?.[1];
    const height = root.match(/\sheight="([\d.]+)"/)?.[1];
    if (width && height) svg = svg.replace(root, root.replace("<svg", `<svg viewBox="0 0 ${width} ${height}"`));
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${svg.trim()}\n`;
}

function arrowSvg(color, size){
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><polygon points="0,0 ${size},${size / 2} 0,${size}" fill="${color}"/></svg>\n`;
}

function junctionSvg(style){
  const size = (style.junctionRadius + style.junctionWidth) * 2;
  const middle = size / 2;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${middle}" cy="${middle}" r="${style.junctionRadius}" fill="#FFFFFF" stroke="${style.junctionStroke}" stroke-width="${style.junctionWidth}"/></svg>\n`;
}

export function hydronicToPgd(shapes, style = HYDRONIC_STYLE, page = {}){
  const width = page.width ?? 272;
  const height = page.height ?? 480;
  const pageName = page.name ?? "Page1";
  const icons = style.iconSources ?? {};
  const texts = [];
  const images = new Map();
  const objects = [];
  const counters = new Map();

  const nextId = (prefix) => {
    const value = (counters.get(prefix) ?? 0) + 1;
    counters.set(prefix, value);
    return `${prefix}${value}`;
  };

  const textId = (value) => {
    const found = texts.find((entry) => entry.text === value);
    if (found) return found.id;
    const id = texts.length + 1;
    texts.push({ id, text: value });
    return id;
  };

  const imagePath = (name, data) => {
    if (!images.has(name)) images.set(name, data);
    return `images/${name}.svg`;
  };

  const shape = (x, y, w, h, fill, extra = {}) => {
    objects.push(`<object class="ShapeWgt" id="${nextId("rect")}" static="true">
 <wgtStyle ${attributes({ width: w, x, y, fill: rgb(fill), cx: w / 2, cy: h / 2, height: h, nodeName: "rect", "stroke-width": 0, ...extra })}/>
</object>`);
  };

  const image = (name, data, cx, cy, w, h, rotation = 0, extra = {}) => {
    const turned = rotation % 360 === 0 ? null : rotationMatrix(w, h, rotation);
    const boxW = turned ? turned.width : w;
    const boxH = turned ? turned.height : h;
    objects.push(`<object class="ImageWgt" id="${nextId("pfImg")}" static="true">
 <wgtStyle ${attributes({ width: w, imagePath: imagePath(name, data), x: cx - boxW / 2, y: cy - boxH / 2, cx: boxW / 2, cy: boxH / 2, height: h, ...extra, mtx: turned?.mtx })}/>
</object>`);
  };

  const label = (value, x, y, w, h, sizePx, options = {}) => {
    if (!value) return;
    const id = textId(value);
    objects.push(`<object class="LabelWgt" id="${nextId("label")}" static="true">
 <wgtStyle ${attributes({
   "font-bold": options.bold ? "true" : undefined,
   marker: "true",
   "font-family": FONT,
   "font-sizepx": Math.round(sizePx),
   cx: w / 2,
   cy: h / 2,
   alignment: options.align === "center" ? "center" : undefined,
   x,
   y,
   "vert-align": "middle",
   "keypad-type": "None",
   "font-color": rgb(options.color ?? INK),
   width: w,
   wrapping: "true",
   height: h,
   "font-size": Math.round(sizePx * 0.75)
 })}/>
 <links>
  <lang class="MLTextLink" textid="${id}">
   <MLFontFamily L1="${FONT}"/>
  </lang>
 </links>
</object>`);
  };

  const numeric = (x, y, w, h, unit, decimals) => {
    const unitWidth = unit ? Math.min(28, w * 0.35) : 0;
    const fieldWidth = w - unitWidth;
    const fontPx = Math.max(8, Math.round(h * 0.42));
    const sample = decimals > 0 ? `0.${"0".repeat(decimals)}` : "0";
    objects.push(`<object class="NumericWgt" id="${nextId("field")}">
 <wgtStyle ${attributes({
   "font-bold": "true",
   forcePaint: 8,
   "font-family": "Tahoma",
   cx: fieldWidth / 2,
   cy: h / 2,
   step: 1,
   timeSpec: "local",
   alignment: "center",
   x,
   y,
   "vert-align": "middle",
   frameFill: rgb(PANEL),
   text: sample,
   max: 32767,
   usingFormat: "",
   decimalDigits: decimals,
   leadingDigits: 2,
   value: sample,
   "keypad-type": "Numeric",
   "font-color": "rgb(255,255,255)",
   min: -32768,
   width: fieldWidth,
   numberFormat: 1,
   readWrite: "true",
   height: h,
   frame: "true",
   "font-size": Math.round(fontPx * 0.75),
   form: "Numeric",
   frameColor: rgb(PANEL)
 })}/>
</object>`);
    if (unit) label(` ${unit}`, x + fieldWidth, y, unitWidth, h, Math.max(8, Math.round(h * 0.4)), { bold: true, color: PANEL });
  };

  shape(0, 0, width, height, style.background ?? "#FFFFFF");

  const routes = computeRoutes(shapes);
  const byId = new Map(shapes.map((entry) => [entry.id, entry]));
  const pipes = shapes.filter((entry) => entry.kind === "pipe" && routes.has(entry.id)).map((pipe) => ({ pipe, route: routes.get(pipe.id) }));
  const { crossings, junctions, arrows } = pipeDecorations(pipes, style);
  const pipeWidth = style.pipeWidth;
  const gap = style.gapSize;

  for (const { pipe, route } of pipes) {
    for (const crossing of crossings.filter((entry) => entry.upper === pipe.id)) {
      // shape(crossing.x - gap / 2, crossing.y - gap / 2, gap, gap, style.background ?? "#FFFFFF");
      const side = crossing.size ?? gap;
      shape(crossing.x - side / 2, crossing.y - side / 2, side, side, style.background ?? "#FFFFFF");
    }
    const drawn = touchRoute(route, pipe, byId);
    const color = mediumOf(pipe.medium).color;
    const pipeWidth = pipeWidthOf(pipe, style);
    for (let index = 1; index < drawn.length; index += 1) {
      const a = drawn[index - 1];
      const b = drawn[index];
      const left = Math.min(a.x, b.x) - pipeWidth / 2;
      const top = Math.min(a.y, b.y) - pipeWidth / 2;
      shape(left, top, Math.abs(b.x - a.x) + pipeWidth, Math.abs(b.y - a.y) + pipeWidth, color);
    }
  }

  for (const { pipe } of pipes) {
    const color = mediumOf(pipe.medium).color;
    const name = `pf_arrow_${color.replace("#", "").toLowerCase()}`;
    for (const mark of arrows.get(pipe.id) ?? []) {
      // image(name, arrowSvg(color, style.arrowSize), mark.x, mark.y, style.arrowSize, style.arrowSize, mark.angle, { fill: rgb(color) });
      const size = mark.size ?? style.arrowSize;
      image(name, arrowSvg(color, style.arrowSize), mark.x, mark.y, size, size, mark.angle, { fill: rgb(color) });
    }
  }

  for (const junction of junctions) {
    // const size = (style.junctionRadius + style.junctionWidth) * 2;
    const size = ((junction.radius ?? style.junctionRadius) + (junction.stroke ?? style.junctionWidth)) * 2;
    image("pf_junction", junctionSvg(style), junction.x, junction.y, size, size);
  }

  const equipment = shapes.filter((entry) => entry.kind === "equipment" && HYDRONIC_ELEMENTS[entry.type]);
  for (const bar of equipment.filter(isBar)) shape(bar.x, bar.y, bar.width, bar.height, mediumOf(bar.medium).color);
  for (const entry of branchGaps(shapes, gap)) shape(entry.x, entry.y, entry.width, entry.height, style.background ?? "#FFFFFF");

  const iconImage = (type, cx, cy, w, h, rotation = 0) => {
    const source = icons[type];
    if (!source) return;
    image(`pf_${type}`, cleanIcon(source), cx, cy, w, h, rotation);
  };

  for (const element of equipment) {
    if (isBar(element)) continue;
    if (isBranch(element)) {
      for (const part of branchParts(element)) {
        if (part.kind === "bar") shape(part.x, part.y, part.width, part.height, part.color);
        else if (part.kind === "icon") iconImage(part.type, part.cx, part.cy, part.width, part.height, part.rotation);
        else if (part.kind === "image") image(`pf_branch_${part.name}`, `<?xml version="1.0" encoding="UTF-8"?>\n${BRANCH_IMAGES[part.name].svg}\n`, part.cx, part.cy, part.width, part.height);
        else if (part.kind === "numeric") numeric(part.x, part.y, part.width, part.height, part.unit, part.decimals);
        else if (part.kind === "text") {
          const boxHeight = part.size * 1.4;
          const top = part.baseline - part.size * 1.05;
          if (part.align === "center") label(part.text, part.x - 160 * part.size / 22, top, 320 * part.size / 22, boxHeight, part.size, part);
          else label(part.text, part.x, top, 60 * part.size / 18, boxHeight, part.size, part);
        }
      }
      continue;
    }
    // iconImage(element.type, element.x + element.width / 2, element.y + element.height / 2, element.width, element.height);
    iconImage(element.type, element.x + element.width / 2, element.y + element.height / 2, uprightSize(element).width, uprightSize(element).height, rotationOf(element));
    for (const part of tankParts(element)) {
      if (part.kind === "icon") iconImage(part.type, part.cx, part.cy, part.width, part.height, part.rotation);
      else numeric(part.x, part.y, part.width, part.height, part.unit, part.decimals);
    }
    if (element.name && !HYDRONIC_ELEMENTS[element.type].ownLabel) {
      // label(element.name, element.x - 20, element.y + element.height + 4, element.width + 40, 18, 13, { align: "center" });
      const caption = elementLabel(element);
      label(element.name, element.x - 20, caption.top, element.width + 40, caption.height, caption.size, { align: "center" });
    }
  }

  for (const { pipe, route } of pipes) {
    for (const fitting of pipe.fittings ?? []) {
      if (!HYDRONIC_ELEMENTS[fitting.type]) continue;
      const pose = fittingPose(route, fitting);
      const size = fittingSize(fitting);
      iconImage(fitting.type, pose.x, pose.y, size.width, size.height, pose.rotation);
      if (fitting.name) {
        const caption = fittingLabel(route, fitting);
        const width = 160 * caption.size / 13;
        if (caption.anchor === "middle") label(fitting.name, caption.x - width / 2, caption.top, width, caption.height, caption.size, { align: "center" });
        else label(fitting.name, caption.x, caption.top, width, caption.height, caption.size);
      }
    }
  }

  for (const [, box] of readoutLayout(shapes, routes, style.bounds ?? { width, height })) {
    for (const row of readoutRowBoxes(box)) {
      label(row.label, row.labelX, row.box.y, (READOUT.labelWidth - 2) * row.scale, row.box.height, 18 * row.scale, { bold: true });
      numeric(row.box.x, row.box.y, row.box.width, row.box.height, row.unit, 1);
    }
  }

  for (const text of shapes.filter((entry) => entry.kind === "text")) {
    const size = text.fontSize ?? 16;
    textLines(text).forEach((line, index) => {
      label(line, text.x, text.y + index * size * TEXT_LINE, Math.max(text.width ?? 0, size) + 6, size * TEXT_LINE, size, { bold: text.bold, color: text.color });
    });
  }

  const mlTexts = texts.map((entry) => `     <MLText ${attributes({ L1: entry.text, id: entry.id })}/>`).join("\n");
  const body = objects.map((entry) => entry.split("\n").map((line) => `  ${line}`).join("\n")).join("\n");

  const xml = `<wgtPage rev="1" projectType="HMI Project">
 <object ${attributes({ pageName, pageSize: `${width},${height}`, class: "PageWgt", dataWndSize: "0,70", usedFonts: "Calibri,Tahoma", id: pageName })}>
  <wgtStyle ${attributes({ width, x: 0, y: 0, height, ver: PGD_VERSION.ver, v: PGD_VERSION.v })}/>
  <object class="PageMLTextMgrWgt" id="_PageMLTextMgrWgt" mgrType="Page" mlFileName="">
   <wgtStyle width="0" x="0" y="0" height="0"/>
   <langs defLangId="L1" curLangId="L1">
    <lang removable="false" langCode="en-US" langId="L1" writingsystem="Any" name="Lang1" defaultFont="Tahoma"/>
   </langs>
   <MLTexts>
${mlTexts}
   </MLTexts>
  </object>
  <object class="GroupSubscribeWgt" id="${pageName}@$GroupSubscrWgt@$0">
   <wgtStyle width="0" x="0" y="0" height="0"/>
  </object>
${body}
 </object>
</wgtPage>
`;

  return {
    page: xml,
    fileName: `${pageName.toLowerCase()}.jmx`,
    images: [...images].map(([name, data]) => ({ name: `images/${name}.svg`, data }))
  };
}
