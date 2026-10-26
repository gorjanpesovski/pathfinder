import { connectNetwork, belowAnchor, batchHeight, batchWidth, placeDevices } from "./network.js";
import { isDeviceType, isElectricType } from "@pathfinder/diagram/elements.js";
import { electricSize } from "@pathfinder/diagram/electric/symbols.js";

export function createNetwork(ctx){
  function commitDescription(value){
    const shape = ctx.describing;
    ctx.describingId = null;
    if (!shape) return;
    ctx.selectShape(shape.id);
    setDeviceParam("description", value.split("\n").map((part) => part.trim()).join("\n").trim());
  }

  function connectSelected({ topology, medium }){
    const selection = ctx.networkSelection;
    if (!selection?.centre || !selection.devices.length) return;
    const pipes = connectNetwork($state.snapshot(selection.centre), $state.snapshot(selection.devices), topology, medium, ctx.pipeThickness, () => ctx.nextId++);
    ctx.shapes.push(...pipes);
    ctx.showFileNotice(`Connected ${selection.devices.length} device${selection.devices.length === 1 ? "" : "s"} as a ${topology === "daisy" ? "daisy chain" : topology}`);
  }

  function saveRegisters(list){
    for (const device of ctx.registerDevices) device.params = { ...$state.snapshot(device.params ?? {}), symbols: list.map((entry) => ({ ...entry })) };
    ctx.showFileNotice(`Saved ${list.length} register${list.length === 1 ? "" : "s"} to ${ctx.registerDevices.length === 1 ? ctx.registerDevices[0].name || "the device" : `${ctx.registerDevices.length} devices`}`);
  }

  function addDevices({ type, count, name, slave, ip, medium, topology, symbols = [] }, standalone = false){
    const centre = standalone ? null : ctx.networkSelection?.centre;
    const margin = 60;
    const room = Math.max(0, ctx.boardWidth - margin * 2);
    const middle = ctx.viewport.toWorld({ x: ctx.viewport.width / 2, y: ctx.viewport.height / 2 });
    const start = centre ? belowAnchor($state.snapshot(centre)) : { x: middle.x, top: middle.y - batchHeight(type, count, room) / 2 };
    const half = batchWidth(type, count, room) / 2;
    const anchor = {
      x: Math.min(ctx.boardWidth - margin - half, Math.max(margin + half, start.x)),
      top: Math.max(margin, start.top)
    };
    const added = placeDevices(anchor, type, count, name, slave, ip, room, symbols).map((device) => ({ id: ctx.nextId++, ...device }));
    ctx.shapes.push(...added);
    if (centre) ctx.shapes.push(...connectNetwork($state.snapshot(centre), added, topology, medium, ctx.pipeThickness, () => ctx.nextId++));
    ctx.pickTool("select");
    ctx.selectedIds = added.map((device) => device.id);
    ctx.selectedId = added[0]?.id ?? null;
    ctx.showFileNotice(`Added ${added.length} device${added.length === 1 ? "" : "s"}${centre ? ` under ${centre.name || "the gateway"}` : ""}`);
  }

  function setDeviceParam(name, value){
    for (const element of ctx.selectedElements()) {
      if (!isDeviceType(element.type) && !isElectricType(element.type)) continue;
      element.params = { ...$state.snapshot(element.params ?? {}), [name]: value };
      if (isElectricType(element.type)) Object.assign(element, electricSize(element.type, element.params));
      const row = element.source?.row ? ctx.powerList.rows.find((entry) => entry.id === element.source.row) : null;
      if (row && name === "description") row.description = value;
    }
  }

  return { commitDescription, connectSelected, saveRegisters, addDevices, setDeviceParam };
}
