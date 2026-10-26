import { fitTarget, scaleText } from "$lib/diagram/target.js";
import { textToAtvise } from "$lib/core/tools/text.js";
import { atviseDocument } from "$lib/core/export/atvise.js";
import { hydronicToSvg } from "$lib/diagram/export.js";
import { roomsToSvg, layered, isRoomShape } from "$lib/apps/floorplan/rooms.js";
import { curveToSvg } from "$lib/apps/floorplan/curve.js";

export function createExports(ctx){
  function buildSvg(){
    if (ctx.app === "hydronic" || ctx.app === "network") {
      const target = ctx.exportTargets.atvise;
      const fit = fitTarget({ width: ctx.canvasWidth, height: ctx.canvasHeight }, target);
      const scaledTexts = ctx.shapes.filter((shape) => shape.kind === "text").map((shape) => textToAtvise(scaleText(shape, fit)));
      return atviseDocument(target.width, target.height, [hydronicToSvg(ctx.shapes, ctx.hydronicStyle, fit), ...scaledTexts].filter(Boolean).join("\n"));
    }
    const body = [roomsToSvg(ctx.shapes, ctx.roomStyle, ctx.canvasFill), ...layered(ctx.shapes).filter((shape) => !isRoomShape(shape) && shape.kind !== "image" && shape.kind !== "wall").map((shape) => {
      if (shape.kind === "curve") return curveToSvg(shape, ctx.lineColor);
      if (shape.kind === "text") return textToAtvise(shape);
      if (shape.kind === "line") {
        return `<path d="${ctx.pathFor(shape.points)}" fill="none" id="trace_${shape.id}" stroke="${ctx.lineColor}" stroke-linecap="square" stroke-linejoin="miter" stroke-width="${ctx.lineWidth}"/>`;
      }
      return `<rect fill="${ctx.rectFilled ? ctx.rectFill : "none"}" height="${shape.height}" id="rect_${shape.id}" stroke="${ctx.rectStroke}" stroke-width="${ctx.lineWidth}" width="${shape.width}" x="${shape.x}" y="${shape.y}"/>`;
    })].filter(Boolean).join("\n  ");

    return atviseDocument(ctx.canvasWidth, ctx.canvasHeight, body);

  }

  function startExport(){
    if (ctx.app === "hydronic" || ctx.app === "network") ctx.atviseDialog = true;
    else handleExport();
  }

  function confirmAtvise(prefix){
    ctx.nodePrefix = String(prefix ?? "").trim();
    ctx.atviseDialog = false;
    handleExport();
  }

  async function handleExport(){
    try {
      await navigator.clipboard.writeText(buildSvg());
      ctx.showFileNotice("SVG copied to the clipboard");
    } catch (err) {
      ctx.showFileNotice(`Could not copy: ${err.message}`);
    }
  }

  return { buildSvg, startExport, confirmAtvise, handleExport };
}
