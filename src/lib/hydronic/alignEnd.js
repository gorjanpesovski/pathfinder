export function alignToAnchor(point, anchor, tolerance){
  if (!point || !anchor) return { point, guide: null, aligned: false };
  if (Math.abs(point.x - anchor.x) <= tolerance) {
    return { point: { x: anchor.x, y: point.y }, guide: { x1: anchor.x, y1: anchor.y, x2: anchor.x, y2: point.y }, aligned: true };
  }
  if (Math.abs(point.y - anchor.y) <= tolerance) {
    return { point: { x: point.x, y: anchor.y }, guide: { x1: anchor.x, y1: anchor.y, x2: point.x, y2: anchor.y }, aligned: true };
  }
  return { point, guide: null, aligned: false };
}

export function trimLastStretch(points, count = 2){
  return points.slice(0, Math.max(0, points.length - count));
}
