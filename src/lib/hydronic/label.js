import { HYDRONIC_ELEMENTS } from "./elements.js";

export const NAME_SIZE = 13;

export function hasNameLabel(element){
  const spec = HYDRONIC_ELEMENTS[element?.type];
  return !!spec && !spec.bar && !spec.ownLabel;
}

export function nameSizeOf(element){
  return element?.nameSize > 0 ? element.nameSize : NAME_SIZE;
}

export function elementLabel(element){
  const size = nameSizeOf(element);
  const scale = size / NAME_SIZE;
  const inside = HYDRONIC_ELEMENTS[element.type]?.caption === "inside";
  const dx = element.nameOffset?.x ?? 0;
  const dy = element.nameOffset?.y ?? 0;
  const x = element.x + element.width / 2 + dx;
  const y = (inside ? element.y + 24 * scale : element.y + element.height + 18 * scale) + dy;
  return { x, y, size, top: (inside ? element.y + 10 * scale : element.y + element.height + 4 * scale) + dy, height: 18 * scale, middle: y - size * 0.35 };
}
