export function createPlacement(ctx){
  function startPlacing(type){
    ctx.pickTool("place");
    ctx.placing = { type, rotation: 0, auto: true };
  }

  function rotatePlacing(){
    if (!ctx.placing) return;
    ctx.placing.rotation = (ctx.placing.rotation + 90) % 360;
    ctx.placing.auto = false;
  }

  function placeElement(event){
    const target = ctx.placement;
    if (!target?.valid) return;
    if (target.kind === "equipment" || target.kind === "fitting") {
      ctx.placeHydronic(target, event.shiftKey);
      return;
    }
    const id = ctx.nextId++;
    if (target.kind === "door") target.room.doors = [...(target.room.doors ?? []), { id, ...target.door }];
    else target.room.furniture = [...(target.room.furniture ?? []), { id, ...target.item }];
    if (event.shiftKey) return;

    const roomId = target.room.id;
    ctx.pickTool("select");
    ctx.selectedId = null;
    ctx.clearSubSelection();
    ctx.selectedParts = [{ kind: target.kind === "door" ? "door" : "furniture", roomId, id }];
  }

  return { startPlacing, rotatePlacing, placeElement };
}
