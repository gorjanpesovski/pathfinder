import { HYDRONIC_ELEMENTS } from "./elements.js";

export const NAME_SIZE = 13;

const LINE = 18;
const GLYPH = 0.56;

export function hasNameLabel(element){
  const spec = HYDRONIC_ELEMENTS[element?.type];
  return !!spec && !spec.bar && !spec.ownLabel;
}

export function nameSizeOf(element){
  return element?.nameSize > 0 ? element.nameSize : NAME_SIZE;
}

export function textWidth(text, size){
  return (text ?? "").length * size * GLYPH;
}

function round(value){
  return Math.round(value * 10) / 10;
}

export function placeName(box, place, size){
  const scale = size / NAME_SIZE;
  const height = LINE * scale;
  const shift = place.shift ?? 0;
  if (place.side === "left" || place.side === "right") {
    const right = place.side === "right";
    const x = right ? box.x + box.width + place.gap : box.x - place.gap;
    const middle = box.y + box.height / 2 + shift;
    return { x, y: middle + size * 0.35, size, anchor: right ? "start" : "end", top: middle - height / 2, height, middle, center: x + (right ? 1 : -1) * size * 3 };
  }
  const x = box.x + box.width / 2 + shift;
  const top = place.side === "top" ? box.y - place.gap - height : box.y + box.height + place.gap;
  const middle = top + height / 2;
  return { x, y: middle + size * 0.35, size, anchor: "middle", top, height, middle, center: x };
}

export function labelCentre(label, width){
  const x = label.anchor === "start" ? label.x + width / 2 : label.anchor === "end" ? label.x - width / 2 : label.x;
  return { x, y: label.middle };
}

export function labelBox(label, width){
  const x = label.anchor === "start" ? label.x : label.anchor === "end" ? label.x - width : label.x - width / 2;
  return { x, y: label.top, width, height: label.height };
}

export function nameAnchorAt(box, centre, width, height){
  const dx = centre.x - (box.x + box.width / 2);
  const dy = centre.y - (box.y + box.height / 2);
  const ex = Math.abs(dx) - box.width / 2 - width / 2;
  const ey = Math.abs(dy) - box.height / 2 - height / 2;
  if (ex > ey) return { side: dx < 0 ? "left" : "right", gap: round(ex), shift: round(dy) };
  return { side: dy < 0 ? "top" : "bottom", gap: round(ey), shift: round(dx) };
}

export function elementBox(element){
  return { x: element.x, y: element.y, width: element.width, height: element.height };
}

export function elementLabel(element){
  const size = nameSizeOf(element);
  return placeName(elementBox(element), element.nameAnchor ?? { side: "bottom", gap: 4 * size / NAME_SIZE }, size);
}

export function legacyElementAnchor(element){
  const size = nameSizeOf(element);
  const scale = size / NAME_SIZE;
  const centre = {
    x: element.x + element.width / 2 + (element.nameOffset?.x ?? 0),
    y: element.y + element.height + 18 * scale + (element.nameOffset?.y ?? 0) - size * 0.35
  };
  return nameAnchorAt(elementBox(element), centre, textWidth(element.name, size), LINE * scale);
}
