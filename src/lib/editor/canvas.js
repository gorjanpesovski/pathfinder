import { describeWall } from "$lib/apps/floorplan/walls.js";
import { describeHydronic } from "$lib/diagram/elements.js";
import { isRoomShape, describeRoom } from "$lib/apps/floorplan/rooms.js";
import { describeCurve } from "$lib/apps/floorplan/curve.js";
import { describeText } from "$lib/core/tools/text.js";

export function createCanvas(ctx){
  function clamp(value, max){
    return Math.min(max, Math.max(0, value));
  }

  function snapValue(value, max){
    const stepped = ctx.snapToGrid ? Math.round(value / ctx.gridSize) * ctx.gridSize : Math.round(value);
    return clamp(stepped, max);
  }

  function snapPoint(point){
    return { x: snapValue(point.x, ctx.boardWidth), y: snapValue(point.y, ctx.boardHeight) };
  }

  function toCanvas(event){
    const matrix = ctx.svgEl?.getScreenCTM();
    if (!matrix) return null;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return ctx.viewport.toWorld({ x: point.x, y: point.y });
  }

  function fitContent(){
    ctx.viewport.fit(ctx.sheetRect ?? { x: 0, y: 0, width: ctx.boardWidth, height: ctx.boardHeight });
  }

  function zoomToSelection(){
    const box = ctx.transformBox;
    if (!box) return;
    ctx.viewport.fit({ x: box.x, y: box.y, width: Math.max(box.width, 1), height: Math.max(box.height, 1) }, Math.min(80, Math.min(ctx.viewport.width, ctx.viewport.height) * 0.12));
  }

  function manhattan(from, to, mode){
    if (from.x === to.x || from.y === to.y) return [from, to];

    if (mode === "v") return [from, { x: from.x, y: to.y }, to];

    if (mode === "zh") {
      const x = snapValue((from.x + to.x) / 2, ctx.boardWidth);
      return [from, { x, y: from.y }, { x, y: to.y }, to];
    }

    if (mode === "zv") {
      const y = snapValue((from.y + to.y) / 2, ctx.boardHeight);
      return [from, { x: from.x, y }, { x: to.x, y }, to];
    }

    return [from, { x: to.x, y: from.y }, to];
  }

  function rectBetween(from, to){
    return {
      x: Math.min(from.x, to.x),
      y: Math.min(from.y, to.y),
      width: Math.abs(to.x - from.x),
      height: Math.abs(to.y - from.y)
    };
  }

  function pathFor(points){
    return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  }

  function traceLength(points){
    let total = 0;
    for (let index = 1; index < points.length; index += 1) {
      total += Math.abs(points[index].x - points[index - 1].x);
      total += Math.abs(points[index].y - points[index - 1].y);
    }
    return total;
  }

  function describe(shape){
    if (shape.kind === "wall") return describeWall(shape);
    if (shape.kind === "equipment" || shape.kind === "pipe") return describeHydronic(shape);
    if (isRoomShape(shape)) return describeRoom(shape);
    if (shape.kind === "curve") return describeCurve(shape);
    if (shape.kind === "image") return `Reference image · ${Math.round(shape.opacity * 100)}% opacity`;
    if (shape.kind === "text") return describeText(shape);
    if (shape.kind === "line") {
      const start = shape.points[0];
      const end = shape.points[shape.points.length - 1];
      return `${start.x},${start.y} → ${end.x},${end.y} · ${traceLength(shape.points)} long`;
    }
    return `${shape.x},${shape.y} · ${shape.width} × ${shape.height}`;
  }

  function commitFields(){
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) active.blur();
  }

  function round2(value){
    return Math.round(value * 100) / 100;
  }

  function constrainAngle(vector){
    const length = Math.hypot(vector.x, vector.y);
    const angle = Math.round(Math.atan2(vector.y, vector.x) / (Math.PI / 4)) * (Math.PI / 4);
    return { x: Math.cos(angle) * length, y: Math.sin(angle) * length };
  }

  function typingInto(target){
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
  }

  let fileNoticeTimer;

  function showFileNotice(text){
    ctx.fileNotice = text;
    clearTimeout(fileNoticeTimer);
    fileNoticeTimer = setTimeout(() => ctx.fileNotice = null, 2400);
  }

  function round4(value){
    return Math.round(value * 10000) / 10000;
  }

  function cycleElbow(step){
    const index = ctx.ELBOW_ORDER.indexOf(ctx.elbow);
    ctx.elbow = ctx.ELBOW_ORDER[(index + step + ctx.ELBOW_ORDER.length) % ctx.ELBOW_ORDER.length];
  }

  function focusName(node){
    node.focus();
    node.select();
  }

  function readHex(event, current){
    const value = event.currentTarget.value.trim();
    const next = /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : current;
    event.currentTarget.value = next;
    return next;
  }

  return { clamp, snapValue, snapPoint, toCanvas, fitContent, zoomToSelection, manhattan, rectBetween, pathFor, traceLength, describe, commitFields, round2, constrainAngle, typingInto, showFileNotice, round4, cycleElbow, focusName, readHex };
}
