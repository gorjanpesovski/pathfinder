function round2(value){
  return Math.round(value * 100) / 100;
}

export function curveControl(start, through, end){
  return {
    x: 2 * through.x - (start.x + end.x) / 2,
    y: 2 * through.y - (start.y + end.y) / 2
  };
}

export function curvePath(points){
  const [start, through, end] = points;
  const control = curveControl(start, through, end);
  return `M ${start.x} ${start.y} Q ${round2(control.x)} ${round2(control.y)} ${end.x} ${end.y}`;
}

export function curveLength(points){
  const [start, through, end] = points;
  const control = curveControl(start, through, end);
  let total = 0;
  let previous = start;
  for (let step = 1; step <= 32; step += 1) {
    const t = step / 32;
    const u = 1 - t;
    const point = {
      x: u * u * start.x + 2 * u * t * control.x + t * t * end.x,
      y: u * u * start.y + 2 * u * t * control.y + t * t * end.y
    };
    total += Math.hypot(point.x - previous.x, point.y - previous.y);
    previous = point;
  }
  return total;
}

export function describeCurve(shape){
  return `Curve · ${(curveLength(shape.points) / 100).toFixed(2)} m`;
}

export function curveToSvg(shape, color){
  return `<path d="${curvePath(shape.points)}" fill="none" id="curve_${shape.id}" stroke="${color}" stroke-linecap="round" stroke-width="${shape.strokeWidth}"/>`;
}
