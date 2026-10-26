import { setSlot, elementSlots, fittingSlots } from "@pathfinder/diagram/variables.js";
import { HYDRONIC_ELEMENTS } from "@pathfinder/diagram/elements.js";

export function createVariableLinks(ctx){
  function addVariables(list){
    ctx.variableNames = [...ctx.variableNames, ...list.filter((name) => !ctx.variableNames.includes(name))];
    ctx.showFileNotice(`Added ${list.length} variable name${list.length === 1 ? "" : "s"}`);
  }

  function linkVariable(key, value){
    if (ctx.linkTarget) setSlot(ctx.linkTarget.target, key, value);
  }

  function dropSpot(event){
    const node = event.target?.closest?.("[data-link-key]");
    if (!node) return null;
    const fittingId = node.dataset.linkFitting;
    return { shapeId: Number(node.dataset.linkShape), fittingId: fittingId === undefined ? null : Number(fittingId), key: node.dataset.linkKey };
  }

  function dropOwner(spot){
    const shape = ctx.shapes.find((entry) => entry.id === spot.shapeId);
    if (!shape) return null;
    if (spot.fittingId === null) {
      const spec = HYDRONIC_ELEMENTS[shape.type];
      return { target: shape, title: shape.name || spec?.label || "Element", slots: elementSlots(shape) };
    }
    const fitting = shape.fittings?.find((entry) => entry.id === spot.fittingId);
    return fitting ? { target: fitting, title: fitting.name || HYDRONIC_ELEMENTS[fitting.type]?.label || "Element", slots: fittingSlots(fitting) } : null;
  }

  function variableOver(event){
    if (!ctx.draggingVariable) return;
    const spot = dropSpot(event);
    const same = spot && ctx.linkHover && spot.shapeId === ctx.linkHover.shapeId && spot.fittingId === ctx.linkHover.fittingId && spot.key === ctx.linkHover.key;
    if (!same) ctx.linkHover = spot;
    if (!spot) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "link";
  }

  function variableLeave(event){
    if (!ctx.svgEl?.contains(event.relatedTarget)) ctx.linkHover = null;
  }

  function variableDrop(event){
    const name = event.dataTransfer.getData("application/x-pathfinder-variable") || ctx.draggingVariable;
    const spot = dropSpot(event);
    ctx.linkHover = null;
    ctx.draggingVariable = null;
    if (!name || !spot) return;
    event.preventDefault();
    const owner = dropOwner(spot);
    const slot = owner?.slots.find((entry) => entry.key === spot.key);
    if (!slot) return;
    setSlot(owner.target, spot.key, name);
    const where = spot.key === "self" ? owner.title : `${owner.title} · ${slot.label}`;
    ctx.showFileNotice(slot.value && slot.value !== name ? `${where}: ${slot.value} → ${name}` : `Linked ${name} to ${where}`);
  }

  return { addVariables, linkVariable, dropSpot, dropOwner, variableOver, variableLeave, variableDrop };
}
