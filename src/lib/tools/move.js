import { polygonBounds } from "./polygon.js";
import { outlinePoints } from "./path.js";

export function shapeBox(shape){
  return shape.points ? polygonBounds(outlinePoints(shape)) : { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
}

export function translateShape(shape, dx, dy){
  if (shape.points) {
    const moved = { points: shape.points.map((point) => ({ x: point.x + dx, y: point.y + dy })) };
    if (shape.furniture) moved.furniture = shape.furniture.map((item) => ({ ...item, cx: item.cx + dx, cy: item.cy + dy }));
    return moved;
  }
  return { x: shape.x + dx, y: shape.y + dy };
}

export function clampDelta(box, dx, dy, width, height){
  const inside = box.x >= 0 && box.y >= 0 && box.x + box.width <= width && box.y + box.height <= height;
  if (!inside) return { dx, dy };
  return {
    dx: Math.min(width - box.x - box.width, Math.max(-box.x, dx)),
    dy: Math.min(height - box.y - box.height, Math.max(-box.y, dy))
  };
}

export function dragPointer(node, event, { onmove, onend }){
  const pointerId = event.pointerId;
  node.setPointerCapture(pointerId);

  function move(next){
    if (next.pointerId === pointerId) onmove(next);
  }

  function end(next){
    if (next.pointerId !== pointerId) return;
    node.removeEventListener("pointermove", move);
    node.removeEventListener("pointerup", end);
    node.removeEventListener("pointercancel", end);
    if (node.hasPointerCapture(pointerId)) node.releasePointerCapture(pointerId);
    onend?.(next);
  }

  node.addEventListener("pointermove", move);
  node.addEventListener("pointerup", end);
  node.addEventListener("pointercancel", end);
}

export function unionBox(boxes){
  const x = Math.min(...boxes.map((box) => box.x));
  const y = Math.min(...boxes.map((box) => box.y));
  const right = Math.max(...boxes.map((box) => box.x + box.width));
  const bottom = Math.max(...boxes.map((box) => box.y + box.height));
  return { x, y, width: right - x, height: bottom - y };
}
