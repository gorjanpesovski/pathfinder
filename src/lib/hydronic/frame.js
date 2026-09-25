export function rotationOf(element){
  return (((element?.rotation ?? 0) % 360) + 360) % 360;
}

export function isTurned(element){
  return rotationOf(element) % 180 !== 0;
}

export function uprightSize(element){
  return isTurned(element)
    ? { width: element.height, height: element.width }
    : { width: element.width, height: element.height };
}

export function footprint(width, height, rotation){
  return rotation % 180 === 0 ? { width, height } : { width: height, height: width };
}

function trig(rotation){
  const radians = rotation * Math.PI / 180;
  return { cos: Math.round(Math.cos(radians)), sin: Math.round(Math.sin(radians)) };
}

export function rotateVector(vector, rotation){
  const { cos, sin } = trig(rotation);
  return { x: vector.x * cos - vector.y * sin, y: vector.x * sin + vector.y * cos };
}

export function toCanvasPoint(element, x, y){
  const upright = uprightSize(element);
  const turned = rotateVector({ x: x - upright.width / 2, y: y - upright.height / 2 }, rotationOf(element));
  return { x: element.x + element.width / 2 + turned.x, y: element.y + element.height / 2 + turned.y };
}

export function toLocalPoint(element, x, y){
  const upright = uprightSize(element);
  const turned = rotateVector({ x: x - element.x - element.width / 2, y: y - element.y - element.height / 2 }, -rotationOf(element));
  return { x: turned.x + upright.width / 2, y: turned.y + upright.height / 2 };
}

export function localRect(element, x, y, width, height){
  const a = toCanvasPoint(element, x, y);
  const b = toCanvasPoint(element, x + width, y + height);
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) };
}

const CLOCKWISE = { top: "right", right: "bottom", bottom: "left", left: "top" };

export function turnPort(port, element){
  const height = element.height;
  const offset = port.side === "right" || port.side === "left" ? height - port.offset : port.offset;
  return { ...port, side: CLOCKWISE[port.side], offset: Math.round(offset * 1000) / 1000 };
}
