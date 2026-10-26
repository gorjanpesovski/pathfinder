import { escapeXml } from "../export/atvise.js";
import { HYDRONIC_STYLE } from "./elements.js";
import { DRAIN_SVG } from "./branch.js";
import { layoutText } from "../tools/text.js";
import { buildScene, showsIn } from "./scene.js";
import { fitTarget, scaleItems, scaleText } from "./target.js";

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

function genericSvg(width, height){
  const w = Math.round(width);
  const h = Math.round(height);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="10" ry="10" fill="#FFFFFF" stroke="#9CA9BF" stroke-width="1"/></svg>
`;
}

const PUMP_OFF = "#1E293B";
const PUMP_ON = "#018E42";

function pumpRingSvg(){
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="23.5" fill="#FFFFFF" stroke="${PUMP_OFF}" stroke-width="4"/></svg>
`;
}

function pumpArrowSvg(color = PUMP_OFF){
  const shape = `<polygon points="15.25,7.4 47.5,26 15.25,44.6" fill="${color}"/>`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">${shape}</svg>\n`;
}

const LED_OFF = "#475569";
const LED_ON = "#22C55E";
const ALARM_FILL = "#FBBF24";

function alarmSvg(){
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><polygon points="20,4 37,34.5 3,34.5" fill="${ALARM_FILL}" stroke="${PUMP_OFF}" stroke-linejoin="round" stroke-width="4"/><rect x="18.3" y="13" width="3.4" height="11.5" rx="1.7" fill="${PUMP_OFF}"/><circle cx="20" cy="29" r="2.1" fill="${PUMP_OFF}"/></svg>
`;
}

export const PGD_TAGS = { prefix: "1_", float: "float(swap4,swap2)" };

export function pgdTag(name, prefix = ""){
  const tag = String(name ?? "").trim().replace(/\./g, "_");
  return tag && prefix && !tag.startsWith(prefix) ? `${prefix}${tag}` : tag;
}

function linkEntry(name, tagType, attribute, palette, prefix){
  const transform = palette
    ? `\n   <xForms>\n    <xForm class="ColorPaletteCustomXForm" ColorPaletteCustom="${palette.join(";")}" name="ColorPaletteCustom"/>\n   </xForms>\n  `
    : "";
  const body = `<dataLink class="TagMgrWgt" tagType="${tagType}" sourceType="Tag" tag="${escapeXml(pgdTag(name, prefix))}" dataSource="_TagMgr" tagIndex="-1" widgetType="Project" readWrite="R" attribute="${attribute}"`;
  return `  ${body}${palette ? `>${transform}</dataLink>` : "/>"}\n`;
}

function dataLink(name, tagType, attribute, palette = null, prefix = "", extra = []){
  const entries = [[attribute, palette], ...extra].map(([key, colors]) => linkEntry(name, tagType, key, colors, prefix)).join("");
  return ` <dataLinks>\n${entries} </dataLinks>\n`;
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
  const floatType = page.tags?.float || PGD_TAGS.float;
  const prefix = page.tags?.prefix ?? PGD_TAGS.prefix;
  const link = (name, tagType, attribute, palette = null, extra = []) => dataLink(name, tagType, attribute, palette, prefix, extra);
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

  const ellipse = (cx, cy, w, h, fill, stroke, strokeWidth, links) => {
    objects.push(`<object class="ShapeWgt" id="${nextId("circle")}">
 <wgtStyle ${attributes({ ry: h / 2, x: cx - w / 2, y: cy - h / 2, "stroke-width": strokeWidth, cx: w / 2, cy: h / 2, stroke: rgb(stroke), width: w, height: h, fill: rgb(fill), nodeName: "ellipse", forcePaint: 136, rx: w / 2 })}/>
${links}</object>`);
  };

  const image = (name, data, cx, cy, w, h, rotation = 0, extra = {}, links = "") => {
    const turned = rotation % 360 === 0 ? null : rotationMatrix(w, h, rotation);
    const boxW = turned ? turned.width : w;
    const boxH = turned ? turned.height : h;
    objects.push(`<object class="ImageWgt" id="${nextId("pfImg")}"${links ? "" : ' static="true"'}>
 <wgtStyle ${attributes({ width: w, imagePath: imagePath(name, data), x: cx - boxW / 2, y: cy - boxH / 2, cx: boxW / 2, cy: boxH / 2, height: h, ...extra, ...(links ? { forcePaint: 137 } : {}), mtx: turned?.mtx })}/>
${links}</object>`);
  };

  const label = (value, x, y, w, h, sizePx, options = {}) => {
    if (!value) return;
    const id = textId(value);
    objects.push(`<object class="LabelWgt" id="${nextId("label")}" static="true">
 <wgtStyle ${attributes({
   "font-bold": options.bold ? "true" : undefined,
   marker: "true",
   "font-family": options.font ?? FONT,
   "font-sizepx": Math.round(sizePx),
   cx: w / 2,
   cy: h / 2,
   alignment: options.align === "center" || options.align === "right" ? options.align : undefined,
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
   <MLFontFamily L1="${options.font ?? FONT}"/>
  </lang>
 </links>
</object>`);
  };

  const numeric = (x, y, w, h, unit, decimals, variable = null) => {
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
   max: variable ? "3.40282e+38" : 32767,
   usingFormat: "",
   decimalDigits: decimals,
   leadingDigits: 2,
   value: sample,
   "keypad-type": "Numeric",
   "font-color": "rgb(255,255,255)",
   min: variable ? "-3.40282e+38" : -32768,
   width: fieldWidth,
   numberFormat: 1,
   readWrite: "true",
   height: h,
   frame: "true",
   "font-size": Math.round(fontPx * 0.75),
   form: "Numeric",
   frameColor: rgb(PANEL)
 })}/>
${variable ? link(variable, floatType, "value") : ""}</object>`);
    if (unit) {
      shape(x + fieldWidth, y, unitWidth, h, PANEL);
      label(` ${unit}`, x + fieldWidth, y, unitWidth, h, fontPx, { bold: true, color: "#FFFFFF", font: "Tahoma" });
    }
  };

  shape(0, 0, width, height, style.background ?? "#FFFFFF");

  const iconImage = (type, cx, cy, w, h, rotation = 0) => {
    const source = icons[type];
    if (!source) return;
    image(`pf_${type}`, cleanIcon(source), cx, cy, w, h, rotation);
  };

  const caption = (item) => label(item.text, item.box.x, item.box.y, item.box.width, item.box.height, item.size, { align: item.anchor === "middle" ? "center" : item.anchor === "end" ? "right" : undefined, bold: item.bold, color: item.color });

  const branchPart = (part) => {
    if (part.kind === "drain") {
      const size = (part.outer + part.stroke / 2) * 2;
      image("pf_branch_drain", `<?xml version="1.0" encoding="UTF-8"?>\n${DRAIN_SVG}\n`, part.cx, part.cy, size, size);
    } else if (part.kind === "text") {
      const boxHeight = part.size * 1.4;
      const top = part.baseline - part.size * 1.05;
      if (part.align === "center") label(part.text, part.x - 160 * part.size / 22, top, 320 * part.size / 22, boxHeight, part.size, part);
      else label(part.text, part.x, top, 60 * part.size / 18, boxHeight, part.size, part);
    }
  };

  const RENDER = {
    gap: (item) => shape(item.x, item.y, item.width, item.height, style.background ?? "#FFFFFF"),
    bar: (item) => shape(item.x, item.y, item.width, item.height, item.color),
    pipe: (item) => {
      for (let index = 1; index < item.points.length; index += 1) {
        const a = item.points[index - 1];
        const b = item.points[index];
        shape(Math.min(a.x, b.x) - item.width / 2, Math.min(a.y, b.y) - item.width / 2, Math.abs(b.x - a.x) + item.width, Math.abs(b.y - a.y) + item.width, item.color);
      }
    },
    arrow: (item) => image(`pf_arrow_${item.color.replace("#", "").toLowerCase()}`, arrowSvg(item.color, style.arrowSize), item.mark.x, item.mark.y, item.size, item.size, item.mark.angle, { fill: rgb(item.color) }),
    junction: (item) => {
      const size = (item.radius + item.stroke) * 2;
      image("pf_junction", junctionSvg(style), item.x, item.y, size, size);
    },
    icon: (item) => {
      if (item.type === "pump" && item.variable) {
        image("pf_pump_ring", pumpRingSvg(), item.cx, item.cy, item.width, item.height, item.rotation);
        image("pf_pump_arrow", pumpArrowSvg(), item.cx, item.cy, item.width, item.height, item.rotation);
        image("pf_pump_arrow_on", pumpArrowSvg(PUMP_ON), item.cx, item.cy, item.width, item.height, item.rotation, {}, link(item.variable, "boolean", "visibility"));
        return;
      }
      if (item.type === "statusLed" && item.variable) {
        ellipse(item.cx, item.cy, item.width, item.height, LED_OFF, LED_OFF, 0, link(item.variable, "boolean", "fill", [LED_OFF, LED_ON]));
        return;
      }
      if (item.type === "alarm" && item.variable) {
        image("pf_alarm", alarmSvg(), item.cx, item.cy, item.width, item.height, item.rotation, {},
          link(item.variable, "boolean", "visibility", null, [["blink", null]]));
        return;
      }
      iconImage(item.type, item.cx, item.cy, item.width, item.height, item.rotation);
    },
    branch: (item) => item.parts.forEach(branchPart),
    generic: (item) => {
      image(`pf_generic_${Math.round(item.width)}x${Math.round(item.height)}`, genericSvg(item.width, item.height), item.cx, item.cy, item.width, item.height, item.rotation ?? 0);
      label(item.name, item.cx - item.width / 2, item.cy - item.height / 2, item.width, item.height, item.fontSize, { align: "center", color: "#475569" });
    },
    field: (item) => numeric(item.x, item.y, item.width, item.height, item.unit, item.decimals, item.variable),
    label: caption
  };

  const design = page.design ?? { width, height };
  const fit = fitTarget(design, { width, height, minFont: page.minFont ?? 0 });
  for (const item of scaleItems(buildScene(shapes, { ...style, bounds: style.bounds ?? design }), fit)) {
    if (showsIn(item, "pgd")) RENDER[item.kind](item);
  }

  for (const source of shapes.filter((entry) => entry.kind === "text")) {
    const text = scaleText(source, fit);
    const layout = layoutText(text);
    for (const line of layout.lines) {
      const first = line.segments[0]?.style;
      if (!first) continue;
      label(line.segments.map((segment) => segment.text).join(""), text.x, text.y + line.top, Math.max(layout.width, first.size) + 6, line.advance, first.size, { bold: first.bold, color: first.color, align: layout.align });
    }
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
