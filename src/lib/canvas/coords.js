export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 10;
export const MIN_GRID_PX = 6;

export function clampZoom(zoom){
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function screenToWorld(view, point){
  return {
    x: (point.x - view.x) / view.zoom,
    y: (point.y - view.y) / view.zoom
  };
}

export function worldToScreen(view, point){
  return {
    x: point.x * view.zoom + view.x,
    y: point.y * view.zoom + view.y
  };
}

export function zoomAround(view, point, zoom){
  const next = clampZoom(zoom);
  const anchor = screenToWorld(view, point);
  return {
    x: point.x - anchor.x * next,
    y: point.y - anchor.y * next,
    zoom: next
  };
}

export function fitView(bounds, width, height, padding){
  const room = {
    width: Math.max(1, width - padding * 2),
    height: Math.max(1, height - padding * 2)
  };
  const zoom = clampZoom(Math.min(
    room.width / Math.max(1, bounds.width),
    room.height / Math.max(1, bounds.height)
  ));
  return {
    x: (width - bounds.width * zoom) / 2 - bounds.x * zoom,
    y: (height - bounds.height * zoom) / 2 - bounds.y * zoom,
    zoom
  };
}
