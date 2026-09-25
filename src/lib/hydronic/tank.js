import { HYDRONIC_ELEMENTS } from "./elements.js";
import { uprightSize, toCanvasPoint } from "./frame.js";

export const TANK_PROBES = [
  { id: "top", label: "Top", y: 75 },
  { id: "middle", label: "Middle", y: 165 },
  { id: "bottom", label: "Bottom", y: 255 }
];

const PROBE_X = 40;
const FIELD_X = 105;

export function hasTankProbes(element){
  return !!HYDRONIC_ELEMENTS[element?.type]?.tankProbes;
}

export function tankParts(element){
  const spec = HYDRONIC_ELEMENTS[element.type];
  if (!spec?.tankProbes || !element.probes) return [];
  const upright = uprightSize(element);
  const sx = upright.width / spec.width;
  const sy = upright.height / spec.height;
  const s = Math.min(sx, sy);
  const parts = [];
  for (const probe of TANK_PROBES) {
    if (!element.probes[probe.id]) continue;
    // const icon = toCanvasPoint(element, PROBE_X * sx, probe.y * sy);
    // const field = toCanvasPoint(element, FIELD_X * sx, probe.y * sy);
    // parts.push({ kind: "icon", type: "tempProbe", probe: probe.id, cx: icon.x, cy: icon.y, width: 28 * s, height: 28 * s, rotation: 0 });
    // parts.push({ kind: "numeric", probe: probe.id, x: field.x - 40 * s, y: field.y - 20 * s, width: 80 * s, height: 40 * s, unit: "°C", decimals: 1 });
    const field = toCanvasPoint(element, spec.width / 2 * sx, probe.y * sy);
    parts.push({ kind: "numeric", probe: probe.id, x: field.x - 50 * s, y: field.y - 20 * s, width: 100 * s, height: 40 * s, unit: "°C", decimals: 1 });
  }
  return parts;
}
