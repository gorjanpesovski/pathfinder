import { ALIGN_ACTIONS, DISTRIBUTE_ACTIONS } from "$lib/core/tools/align.js";
import { isBranch } from "$lib/diagram/branch.js";
import { APPS } from "$lib/apps/index.js";

export function createKeyboard(ctx){
  function appKeydown(event){
    const ctrl = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    if (!ctrl && event.shiftKey && event.code === "Digit1") {
      event.preventDefault();
      ctx.fitContent();
      return true;
    }
    if (!ctrl && event.shiftKey && event.code === "Digit2") {
      event.preventDefault();
      ctx.zoomToSelection();
      return true;
    }
    if (!ctrl && event.shiftKey && event.code === "Digit0") {
      event.preventDefault();
      ctx.viewport.resetZoom();
      return true;
    }
    if (ctrl && (key === "y" || (event.shiftKey && key === "z"))) {
      event.preventDefault();
      ctx.redo();
      return true;
    }
    if (ctrl && key === "g") {
      event.preventDefault();
      if (event.shiftKey) ctx.ungroupSelection();
      else ctx.groupSelection();
      return true;
    }
    if (ctrl && event.shiftKey && key === "l") {
      event.preventDefault();
      ctx.lockSelection();
      return true;
    }
    if (ctrl && !event.altKey && key === "m" && ctx.tool === "select" && ctx.transformBox) {
      event.preventDefault();
      ctx.flipSelection(event.shiftKey ? "x" : "y");
      return true;
    }
    if (ctrl && !event.altKey && (key === "f" || key === "b") && ctx.tool === "select" && (ctx.partGroup.length || ctx.selectionIds.length)) {
      event.preventDefault();
      ctx.reorderSelection(key === "f" ? (event.shiftKey ? "front" : "forward") : (event.shiftKey ? "back" : "backward"));
      return true;
    }
    if (!ctrl && !event.altKey && event.shiftKey && (key === "h" || key === "v") && ctx.tool === "select" && ctx.transformBox) {
      event.preventDefault();
      ctx.flipSelection(key === "h" ? "x" : "y");
      return true;
    }
    if (ctrl && event.shiftKey) {
      const align = ALIGN_ACTIONS.find((action) => action.code === event.code);
      const spread = DISTRIBUTE_ACTIONS.find((action) => action.code === event.code);
      if (align || spread) {
        event.preventDefault();
        if (align) ctx.alignSelection(align.id);
        else ctx.distributeSelection(spread.axis);
        return true;
      }
    }
    if (ctrl && key === "s") {
      event.preventDefault();
      if (event.shiftKey) ctx.saveProjectAs();
      else ctx.saveProject();
      return true;
    }
    if (ctrl && key === "o") {
      event.preventDefault();
      ctx.openDrawing();
      return true;
    }
    if (ctrl && key === "a") {
      event.preventDefault();
      if (ctx.tool !== "select") ctx.pickTool("select");
      ctx.selectAll();
      return true;
    }
    if (ctx.tool === "select" && ctx.app === "hydronic" && !ctrl && key === "r" && ctx.selectedShapes.some((shape) => shape.kind === "equipment" && !shape.locked)) {
      event.preventDefault();
      if (!ctx.selectedShapes.some(isBranch)) ctx.rotateElements();
      return true;
    }
    if (ctx.tool === "select" && ctx.app === "hydronic" && !ctrl && !event.altKey && key === "f" && ctx.selectedShapes.some((shape) => shape.kind === "pipe")) {
      event.preventDefault();
      ctx.reversePipes();
      return true;
    }
    if (ctx.tool === "place" && !ctrl && key === "r") {
      event.preventDefault();
      ctx.rotatePlacing();
      return true;
    }
    if (event.key === "Escape") {
      if (ctx.tool !== "select") ctx.pickTool("select");
      ctx.branchEditing = false;
      ctx.clearSubSelection();
      ctx.renamingId = null;
      return false;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      if (ctx.activeFitting) {
        event.preventDefault();
        const mixed = ctx.selectionIds.length > 0;
        ctx.removeFitting();
        if (mixed) ctx.deleteSelection();
        return true;
      }
      if (ctx.partGroup.length) {
        event.preventDefault();
        ctx.removeParts();
        return true;
      }
      if (ctx.activePoints.length > 0) {
        event.preventDefault();
        ctx.deletePoints();
        return true;
      }
      if (ctx.selectionIds.length > 1) {
        event.preventDefault();
        ctx.deleteSelection();
        return true;
      }
    }
    return false;
  }

  function viewKeydown(event){
    if (!(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey) return false;
    const index = /^Digit([1-9])$/.exec(event.code)?.[1];
    const target = index ? APPS[Number(index) - 1] : null;
    if (!target) return false;
    event.preventDefault();
    ctx.switchApp(target.id);
    return true;
  }

  function handleKeydown(event){
    const target = event.target;
    if (ctx.typingInto(target) || target?.isContentEditable) return;
    if (viewKeydown(event)) return;
    if (ctx.electricBoard && !ctx.wiringListVisible && (event.key === "PageUp" || event.key === "PageDown")) {
      event.preventDefault();
      ctx.showSheet(ctx.sheetShown + (event.key === "PageDown" ? 1 : -1));
      return;
    }
    if (ctx.ioVisible || ctx.wiringListVisible) {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && (key === "s" || key === "o")) appKeydown(event);
      return;
    }

    if (ctx.roomKeydown(event)) return;
    if (ctx.pipeKeydown(event)) return;
    if (appKeydown(event)) return;

    if (event.key === "Escape") {
      ctx.draft = null;
      ctx.selectedId = null;
      ctx.showDisplaySettings = false;
      return;
    }

    if (event.key.toLowerCase() === "z" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      ctx.undo();
      return;
    }

    if (event.key.toLowerCase() === "r" && ctx.tool === "line") {
      ctx.cycleElbow(event.shiftKey ? -1 : 1);
      return;
    }

    if ((event.key === "Delete" || event.key === "Backspace") && ctx.selectedId !== null) {
      event.preventDefault();
      ctx.removeShape(ctx.selectedId);
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const shortcut = (ctx.currentApp.shortcuts ?? { s: "select", h: "pan" })[event.key.toLowerCase()];
    if (shortcut && ctx.currentApp.tools.includes(shortcut)) ctx.pickTool(shortcut);
  }

  return { appKeydown, viewKeydown, handleKeydown };
}
