import { HYDRONIC_ELEMENTS } from "./elements.js";
import { BRANCH_GEOMETRY as G, branchParams, branchColors } from "./branch.js";
import { rotationOf, uprightSize, toCanvasPoint } from "./frame.js";

const INK = "#414142";
const VALVE_Y = 561;

const METERING = {
  return: {
    sensors: [[154.23, 541.49], [216.8, 489.67]],
    links: [[[215.7, 520.6], [171.3, 520.6], [171.3, 490.2], [209.4, 490.2]], [[204.2, 541.5], [157.3, 541.5]]],
    value: [284.04, 538.8]
  },
  supply: {
    sensors: [[156.64, 489.94], [217.1, 541.1]],
    links: [[[165.7, 520.1], [210.1, 520.1], [210.1, 489.6], [164.3, 489.6]], [[213.9, 541], [166.9, 541]]],
    value: [81.94, 538.8]
  }
};

export const BRANCH_IMAGES = {
  drain: {
    width: 68,
    height: 68,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="68" height="68" viewBox="0 0 68 68"><circle cx="34" cy="34" r="30.839" fill="#FFFFFF" stroke="${INK}" stroke-width="6"/><circle cx="34" cy="34" r="17.622" fill="#FFFFFF" stroke="${INK}" stroke-width="6"/></svg>`
  },
  meter: {
    width: 22,
    height: 22,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="10" fill="#FFFFFF" stroke="${INK}" stroke-width="2"/><path d="M7 7 H15 M11 7 V16" fill="none" stroke="${INK}" stroke-width="2"/></svg>`
  }
};

function side(value){
  return value === "Return Side" ? "return" : value === "Supply Side" ? "supply" : null;
}

function mix(hex, opacity){
  const value = parseInt(hex.slice(1), 16);
  const channel = (shift) => Math.round(((value >> shift) & 255) * opacity + 255 * (1 - opacity));
  return `#${[16, 8, 0].map((shift) => channel(shift).toString(16).padStart(2, "0")).join("")}`;
}

export function branchParts(element){
  const spec = HYDRONIC_ELEMENTS[element.type];
  const upright = uprightSize(element);
  const turn = rotationOf(element);
  const sx = upright.width / spec.width;
  const sy = upright.height / spec.height;
  const s = Math.min(sx, sy);
  const at = (x, y) => toCanvasPoint(element, x * sx, y * sy);
  const params = branchParams(element);
  const colors = branchColors(params);
  const pumpSide = side(params.pump_config);
  const valveSide = side(params.energy_valve_config);
  const threeWay = params.valve_type === "3-way";
  const pipeX = (which) => (which === "return" ? G.returnX : G.supplyX);
  const parts = [];

  const rect = (left, top, width, height, color) => {
    const a = at(left, top);
    const b = at(left + width, top + height);
    parts.push({ kind: "bar", x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y), color });
  };
  const vertical = (x, top, bottom, width, color) => rect(x - width / 2, top, width, bottom - top, color);
  const horizontal = (y, left, right, height, color) => rect(left, y - height / 2, right - left, height, color);
  const icon = (type, cx, cy, width, height, rotation = 0) => {
    const centre = at(cx, cy);
    parts.push({ kind: "icon", type, cx: centre.x, cy: centre.y, width: width * s, height: height * s, rotation: (rotation + turn + 360) % 360 });
  };
  const image = (name, cx, cy) => {
    const centre = at(cx, cy);
    parts.push({ kind: "image", name, cx: centre.x, cy: centre.y, width: BRANCH_IMAGES[name].width * s, height: BRANCH_IMAGES[name].height * s });
  };
  const numeric = (cx, cy, unit, decimals) => {
    const centre = at(cx, cy);
    parts.push({ kind: "numeric", x: centre.x - 50 * s, y: centre.y - 20 * s, width: 100 * s, height: 40 * s, unit, decimals });
  };
  const text = (value, x, baseline, size, options = {}) => {
    const anchor = at(x, baseline);
    parts.push({ kind: "text", text: value, x: anchor.x, baseline: anchor.y, size: size * s, bold: false, color: INK, align: "center", ...options });
  };

  if (params.bypass) horizontal(442.787, G.supplyX, G.returnX, 4, colors.supply);
  vertical(G.supplyX, G.supplyTop, G.supplyBottom, 7, colors.supply);
  vertical(G.returnX, G.returnTop, G.returnBottom, 7, colors.return);
  if (valveSide && threeWay) horizontal(VALVE_Y, G.supplyX, G.returnX, 7, colors.return);

  if (pumpSide) icon("pump", pipeX(pumpSide), 387.855, 55, 55, pumpSide === "return" ? 90 : -90);

  if (params.supply_side_temperature_sensor) {
    icon("tempProbe", 154.14, 295.46, 28.4, 28.4);
    numeric(87.814, 274.649, "°C", 1);
    numeric(87.814, 317.399, "°C", 1);
    text("S:", 20.46, 280.64, 18, { align: "start" });
    text("T:", 21.96, 323.456, 18, { align: "start" });
  }
  if (params.return_side_temperature_sensor) {
    icon("tempProbe", 216.83, 295.46, 28.4, 28.4);
    numeric(277.598, 296.049, "°C", 1);
  }

  if (valveSide) {
    if (params.energy_metering) {
      const layout = METERING[valveSide];
      for (const link of layout.links) {
        for (let index = 1; index < link.length; index += 1) {
          const [ax, ay] = link[index - 1];
          const [bx, by] = link[index];
          if (ay === by) horizontal(ay, Math.min(ax, bx), Math.max(ax, bx), 1.5, INK);
          else vertical(ax, Math.min(ay, by), Math.max(ay, by), 1.5, INK);
        }
      }
      for (const [cx, cy] of layout.sensors) image("meter", cx, cy);
      numeric(layout.value[0], layout.value[1], "%", 0);
    }
    icon(threeWay ? "threeWayValve" : "controlValve", pipeX(valveSide), VALVE_Y, 34, 56, valveSide === "return" ? 90 : -90);
  }

  if (params.bypass) icon("checkValve", 184.6, 442.53, 37.09, 19.22, 180);

  image("drain", 185.332, 209.159);

  text(element.name ?? "", 185.333, 40.748, 22, { bold: true });
  text(params.temperature_range, 185.333, 77.7, 22, { color: mix(INK, 0.6) });
  text(params.power, 185.333, 114.653, 22, { color: mix(INK, 0.6) });
  text(params.flow, 185.333, 151.605, 22, { color: mix(INK, 0.6) });

  return parts;
}
