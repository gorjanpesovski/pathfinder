import { newText, refitText, clearRunStyle } from "@pathfinder/core/tools/text.js";

export function createText(ctx){
  let freshTextId = null;

  function placeText(point){
    const id = ctx.nextId++;
    ctx.shapes.push({ id, ...newText(point.x, point.y, $state.snapshot(ctx.textStyle)) });
    ctx.pickTool("select");
    ctx.selectShape(id);
    freshTextId = id;
    ctx.editingTextId = id;
  }

  function commitText({ text, rich, align }){
    const shape = ctx.editingText;
    ctx.editingTextId = null;
    freshTextId = null;
    if (!shape) return;
    if (!text.trim()) {
      ctx.removeShape(shape.id);
      return;
    }
    shape.text = text;
    if (rich) shape.rich = rich;
    else delete shape.rich;
    shape.align = align;
    refitText(shape);
  }

  function cancelText(){
    const id = ctx.editingTextId;
    ctx.editingTextId = null;
    if (id !== null && id === freshTextId) ctx.removeShape(id);
    freshTextId = null;
  }

  function editSelectedText(){
    if (ctx.selectedShape?.kind === "text") ctx.editingTextId = ctx.selectedShape.id;
  }

  function setTextStyle(key, value){
    ctx.textStyle[key] = value;
    ctx.editKey = `text-${key}`;
    for (const shape of ctx.selectedShapes) {
      if (shape.kind !== "text") continue;
      shape[key] = value;
      clearRunStyle(shape, key);
      refitText(shape);
    }
  }

  return { placeText, commitText, cancelText, editSelectedText, setTextStyle };
}
