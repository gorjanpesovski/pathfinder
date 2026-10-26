import { hydronicToPgd } from "./pgd.js";
import { ICON_SOURCES } from "@pathfinder/diagram/iconSprite.js";
import { zipFiles } from "@pathfinder/core/export/zip.js";

export function createPgdExport(ctx){
  function buildPgd(){
    const target = ctx.exportTargets.pgd;
    return hydronicToPgd(ctx.shapes, { ...ctx.hydronicStyle, iconSources: ICON_SOURCES }, { width: target.width, height: target.height, design: { width: ctx.canvasWidth, height: ctx.canvasHeight }, minFont: target.minFont, name: "Page1", tags: { prefix: ctx.pgdPrefix, float: ctx.pgdFloat } });
  }

  async function copyPgd(){
    try {
      await navigator.clipboard.writeText(buildPgd().page);
      ctx.showFileNotice("pGD page copied to the clipboard");
    } catch (err) {
      ctx.showFileNotice(`Could not copy: ${err.message}`);
    }
  }

  function downloadPgdImages(){
    const result = buildPgd();
    const blob = zipFiles(result.images.map((image) => ({ name: image.name.replace(/^images\//, ""), data: image.data })));
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pathfinder-pgd-images.zip";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    ctx.showFileNotice(`Downloaded ${result.images.length} pGD image${result.images.length === 1 ? "" : "s"}`);
  }

  return { buildPgd, copyPgd, downloadPgdImages };
}
