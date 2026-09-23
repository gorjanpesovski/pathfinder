export function shapesBounds(shapes){
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  function include(x, y){
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  for (const shape of shapes) {
    if (shape.points) {
      for (const point of shape.points) include(point.x, point.y);
    } else {
      include(shape.x, shape.y);
      include(shape.x + shape.width, shape.y + shape.height);
    }
  }

  if (minX === Infinity) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
