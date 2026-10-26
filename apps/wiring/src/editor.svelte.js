import { pageLeft } from "@pathfinder/diagram/electric/sheet.js";
import { powerPageCount, isPowerShape, drawPower, shiftShapes, POLES as POWER_POLES } from "./power.js";
import { collectEdits, stamp, applyEdits, ownerOf, resetShape } from "./edits.js";
import { drawControl, crossReference } from "./control.js";
import { PROTECTION_KINDS } from "@pathfinder/diagram/electric/symbols.js";
import { wiringFromIo } from "./generate.js";
import { printSheets } from "./print.js";
import { downloadDxf } from "./dxf.js";

export function createWiring(ctx){
  function showSheet(index){
    if (!ctx.electricBoard) return;
    ctx.sheet = Math.max(0, Math.min(ctx.sheetLast, index));
    ctx.viewport.fit({ x: pageLeft(ctx.sheet, ctx.paper), y: 0, width: ctx.paper.width, height: ctx.paper.height });
  }

  function drawPowerPages(quiet = false){
    const before = powerPageCount(ctx.shapes, ctx.paper);
    const current = $state.snapshot(ctx.shapes);
    const edits = collectEdits(current.filter(isPowerShape));
    const keys = quiet ? ctx.selectedShapes.map((shape) => shape?.source?.key).filter(Boolean) : [];
    const removed = new Set(current.filter(isPowerShape).map((shape) => shape.id));
    const touches = (end) => removed.has(end?.id) || removed.has(end?.pipe);
    const kept = current.filter((shape) => !removed.has(shape.id) && !(shape.kind === "pipe" && (touches(shape.from) || touches(shape.to))));
    const result = drawPower($state.snapshot(ctx.powerList), () => ctx.nextId++, ctx.paper);
    const control = drawControl($state.snapshot(ctx.controlList), $state.snapshot(ctx.powerList), () => ctx.nextId++, ctx.paper, result.pages);
    const generated = stamp(crossReference([...result.shapes, ...control.shapes], ctx.paper));
    const restored = applyEdits(generated, edits);
    shiftShapes(kept, (result.pages + control.pages - before) * (ctx.paper.width + ctx.paper.gap));
    ctx.shapes = [...generated, ...kept];
    if (quiet) {
      const picked = generated.filter((shape) => keys.includes(shape.source?.key)).map((shape) => shape.id);
      ctx.selectedIds = picked;
      ctx.selectedId = picked[0] ?? null;
      return;
    }
    ctx.sheet = 0;
    setTimeout(ctx.fitContent, 0);
    ctx.selectedId = null;
    ctx.selectedIds = [];
    ctx.ioOpen = false;
    ctx.showFileNotice(`Drew ${result.pages} power and ${control.pages} control page${control.pages === 1 ? "" : "s"}${restored ? ` · kept ${restored} change${restored === 1 ? "" : "s"} made on the drawing` : ""}`);
  }

  function listFields(shape){
    const owner = ownerOf(shape);
    if (!owner) return [];
    const type = shape.kind === "text" ? "text" : shape.type;
    const text = (key, label, value, placeholder = "") => ({ key, label, value: value ?? "", placeholder });
    const tag = (key, value) => ({ key, label: "Tag", value: value ?? "", tag: true });
    if (owner.part === "supply") {
      const supply = ctx.powerList.supply;
      if (type === "terminalStrip") return [text("incoming", "Incoming terminals", supply.incoming, "-X0")];
      if (type === "cable") return [tag("tag", supply.tag), text("cable", "Cable type", supply.cable)];
      if (type === "supply") return [text("description", "Description", supply.description)];
      return [];
    }
    if (owner.part === "power") {
      const row = ctx.powerList.rows.find((entry) => entry.id === owner.id);
      if (!row) return [];
      if (type === "protection" && shape.params?.kind === "contact") return [text("switchedBy", "Switched by", row.switchedBy)];
      if (type === "protection") return [
        tag("tag", row.tag),
        { key: "protection", label: "Protection", value: row.protection, options: [...PROTECTION_KINDS.map((kind) => ({ value: kind.id, label: kind.label })), { value: "none", label: "None" }] },
        text("rating", "Rating", row.rating, String(shape.params?.rating ?? "").split("/")[0] || "auto"),
        { key: "poles", label: "Poles", value: row.poles, options: POWER_POLES.map((pole) => ({ value: pole.id, label: pole.id })) }
      ];
      if (type === "fieldDevice" || type === "psu") return [tag("loadTag", row.loadTag), text("loadData", "Load data", row.loadData)];
      if (type === "cable") return [text("cable", "Cable type", row.cable, shape.params?.cableType ?? "")];
      if (type === "terminalStrip") return [text("strip", "Terminals", row.strip, shape.name ?? "")];
      if (type === "text") return [text("description", "Description", row.description)];
      return [];
    }
    if (owner.part === "control") {
      const row = ctx.controlList.rows.find((entry) => entry.id === owner.id);
      if (!row) return [];
      if (type === "fieldDevice" || type === "relayCoil") return [tag("tag", row.tag), ...(type === "fieldDevice" ? [text("model", "Model", row.model)] : [])];
      if (type === "cable") return [text("cable", "Cable type", row.cable, shape.params?.cableType ?? "")];
      if (type === "terminalStrip") return [text("strip", "Terminals", row.strip, shape.name ?? "")];
      if (type === "text") return [text("description", "Description", row.description)];
      return [];
    }
    const link = ctx.controlList.links?.find((entry) => entry.id === owner.id);
    if (!link) return [];
    if (type === "cable") return [tag("tag", link.tag), text("cable", "Cable type", link.cable)];
    if (type === "busLine") return [text("text", "Far end", link.text)];
    if (type === "fieldDevice") return [tag("display", link.display)];
    if (type === "terminalStrip") return [text("strip", "Terminals", link.strip, shape.name ?? "")];
    if (type === "text") return [text("description", "Description", link.description)];
    return [];
  }

  function editFromDrawing(key, value){
    const shape = ctx.selectedShapes[0];
    const owner = shape ? ownerOf(shape) : null;
    if (!owner) return;
    const target = owner.part === "supply" ? ctx.powerList.supply
      : owner.part === "power" ? ctx.powerList.rows.find((entry) => entry.id === owner.id)
      : owner.part === "control" ? ctx.controlList.rows.find((entry) => entry.id === owner.id)
      : ctx.controlList.links?.find((entry) => entry.id === owner.id);
    if (!target || target[key] === value) return;
    target[key] = value;
    if (owner.part === "power" && key === "protection") target.rating = "";
    drawPowerPages(true);
  }

  function resetFromDrawing(){
    for (const shape of ctx.selectedShapes) if (shape?.source?.original) resetShape(shape);
  }

  function generateWiring(options){
    const result = wiringFromIo(ctx.wiringIo?.points ?? [], $state.snapshot(ctx.shapes), () => ctx.nextId++, { ...options, paper: ctx.wiringPaper });
    if (!result.shapes.length) return;
    ctx.shapes.push(...result.shapes);
    ctx.selectedId = null;
    ctx.selectedIds = [];
    ctx.showFileNotice(`Added ${result.points} IO point${result.points === 1 ? "" : "s"} on ${result.pages} page${result.pages === 1 ? "" : "s"}`);
  }

  async function pickIoSource(){
    try {
      const file = await ctx.readProjectFile();
      const part = ctx.readParts(file).hydronic;
      if (!part) {
        ctx.showFileNotice(`${file.name} is not a Hydronic station file`);
        return;
      }
      ctx.wiringIo = { name: file.name, points: part.io?.points ?? [] };
    } catch (error) {
      if (error?.name !== "AbortError") ctx.showFileNotice(`Could not read the IO list: ${error.message}`);
    }
  }

  function printWiring(){
    printSheets($state.snapshot(ctx.shapes), ctx.sheetMeta, ctx.paper);
  }

  function exportDxf(){
    downloadDxf($state.snapshot(ctx.shapes), ctx.sheetMeta, ctx.paper, ctx.documentName || "vezalna-shema");
    ctx.showFileNotice("Downloaded the DXF drawing");
  }

  return { showSheet, drawPowerPages, listFields, editFromDrawing, resetFromDrawing, generateWiring, printWiring, exportDxf, pickIoSource };
}
