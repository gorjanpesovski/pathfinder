import { screenToWorld, worldToScreen, zoomAround, fitView } from "./coords.js";

export class Viewport {
  x = $state(0);
  y = $state(0);
  zoom = $state(1);
  width = $state(0);
  height = $state(0);

  transform = $derived(`translate(${this.x} ${this.y}) scale(${this.zoom})`);

  get center(){
    return { x: this.width / 2, y: this.height / 2 };
  }

  toWorld(point){
    return screenToWorld(this, point);
  }

  toScreen(point){
    return worldToScreen(this, point);
  }

  set(view){
    this.x = view.x;
    this.y = view.y;
    this.zoom = view.zoom;
  }

  panBy(dx, dy){
    this.x += dx;
    this.y += dy;
  }

  zoomAt(point, zoom){
    this.set(zoomAround(this, point, zoom));
  }

  zoomBy(factor){
    this.zoomAt(this.center, this.zoom * factor);
  }

  resetZoom(){
    this.zoomAt(this.center, 1);
  }

  fit(bounds, padding = 40){
    if (this.width === 0 || this.height === 0) return;
    this.set(fitView(bounds, this.width, this.height, padding));
  }
}
