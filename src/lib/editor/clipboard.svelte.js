import { branchPipeIds } from "@pathfinder/diagram/branch.js";
import { nextRoomName } from "@pathfinder/floorplan/rooms.js";
import { translateShape } from "@pathfinder/core/tools/move.js";
import { linkPastedPipes } from "@pathfinder/diagram/route.js";

export function createClipboard(ctx){
  let clipboardBox = null;

  function handleCopy(event){
    if (ctx.ioVisible || ctx.wiringListVisible) return;
    if (!ctx.typingInto(event.target) && ctx.copyFurniture(event)) return;
    if (!ctx.typingInto(event.target) && ctx.copyFittingSelection(event)) return;
    if (ctx.typingInto(event.target) || ctx.selectionIds.length === 0) return;
    ctx.clipboardFurniture = null;
    ctx.clipboardFittings = null;
    const owned = branchPipeIds(ctx.shapes, ctx.selectionIds).filter((id) => !ctx.selectionIds.includes(id)).map(ctx.shapeById);
    ctx.clipboardShapes = $state.snapshot([...ctx.selectedShapes, ...owned]);
    clipboardBox = ctx.transformBox ? { ...ctx.transformBox } : null;
    ctx.clipboardToken = `${Date.now()}`;
    ctx.pasteCount = 0;
    ctx.pasteKey = null;
    event.clipboardData?.setData("text/plain", ctx.CLIPBOARD_PREFIX + ctx.clipboardToken);
    event.preventDefault();
  }

  function handleCut(event){
    if (ctx.ioVisible || ctx.wiringListVisible) return;
    handleCopy(event);
    if (!event.defaultPrevented) return;
    if (ctx.clipboardFurniture && ctx.partGroup.length) ctx.removeParts();
    else if (ctx.clipboardFittings && ctx.activeFitting) ctx.removeFitting();
    else ctx.deleteSelection();
  }

  function copyName(name, taken){
    if (/^Room \d+$/.test(name)) return nextRoomName(taken);
    let candidate = `${name} copy`;
    let index = 2;
    while (taken.some((shape) => shape.kind === "room" && shape.name === candidate)) candidate = `${name} copy ${index++}`;
    return candidate;
  }

  function pasteShapes(){
    const present = ctx.clipboardShapes.some((source) => ctx.shapes.some((shape) => shape.id === source.id));
    const step = (ctx.snapToGrid ? ctx.gridSize : 20) * 2;
    const grid = ctx.snapToGrid ? ctx.gridSize : 1;
    const origin = ctx.pointer && clipboardBox ? { x: Math.round(ctx.pointer.x / grid) * grid, y: Math.round(ctx.pointer.y / grid) * grid } : null;
    const key = origin ? `${origin.x}:${origin.y}` : "source";
    if (key !== ctx.pasteKey) {
      ctx.pasteKey = key;
      ctx.pasteCount = 0;
    }
    ctx.pasteCount += 1;
    const ring = step * (origin || !present ? ctx.pasteCount - 1 : ctx.pasteCount);
    const base = origin ? { x: origin.x - Math.round((clipboardBox.x + clipboardBox.width / 2) / grid) * grid, y: origin.y - Math.round((clipboardBox.y + clipboardBox.height / 2) / grid) * grid } : { x: 0, y: 0 };
    const offset = { x: base.x + ring, y: base.y + ring };
    const groups = new Map();
    const created = [];
    const idMap = new Map();

    for (const source of ctx.clipboardShapes) {
      const copy = { ...structuredClone(source), ...translateShape(source, offset.x, offset.y), id: ctx.nextId++ };
      idMap.set(source.id, copy.id);
      if (copy.fittings) copy.fittings = copy.fittings.map((item) => ({ ...item, id: ctx.nextId++ }));
      delete copy.locked;
      if (copy.groupId) {
        if (!groups.has(copy.groupId)) groups.set(copy.groupId, ctx.nextId++);
        copy.groupId = groups.get(copy.groupId);
      }
      if (copy.doors) copy.doors = copy.doors.map((door) => ({ ...door, id: ctx.nextId++ }));
      if (copy.furniture) copy.furniture = copy.furniture.map((item) => ({ ...item, id: ctx.nextId++ }));
      if (copy.kind === "room") copy.name = copyName(copy.name, [...ctx.shapes, ...created]);
      created.push(copy);
    }

    const linked = linkPastedPipes(created, idMap, offset).map((shape) => shape.branchOf !== undefined && idMap.has(shape.branchOf) ? { ...shape, branchOf: idMap.get(shape.branchOf) } : shape).filter((shape) => shape.branchOf === undefined || created.some((entry) => entry.id === shape.branchOf));
    if (ctx.tool !== "select") ctx.pickTool("select");
    ctx.shapes.push(...linked);
    ctx.selectedIds = linked.map((shape) => shape.id);
    ctx.selectedId = ctx.selectedIds[ctx.selectedIds.length - 1] ?? null;
    ctx.clearSubSelection();
  }

  function handlePaste(event){
    if (ctx.ioVisible || ctx.wiringListVisible) return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
    const text = event.clipboardData?.getData("text/plain");
    if (ctx.clipboardFurniture && text === ctx.CLIPBOARD_PREFIX + ctx.clipboardToken) {
      event.preventDefault();
      ctx.pasteFurniture();
      return;
    }
    if (ctx.clipboardShapes && text === ctx.CLIPBOARD_PREFIX + ctx.clipboardToken) {
      event.preventDefault();
      pasteShapes();
      return;
    }
    if (ctx.clipboardFittings && text === ctx.CLIPBOARD_PREFIX + ctx.clipboardToken) {
      event.preventDefault();
      ctx.pasteFittings();
      return;
    }
    const item = [...(event.clipboardData?.items ?? [])].find((entry) => entry.type.startsWith("image/"));
    if (!item) return;
    event.preventDefault();
    ctx.readImage(item.getAsFile());
  }

  return { handleCopy, handleCut, copyName, pasteShapes, handlePaste };
}
