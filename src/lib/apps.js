import { ELEMENT_GROUPS } from "./tools/furniture.js";
import { HYDRONIC_GROUPS } from "./hydronic/elements.js";

/*
export const APPS = [
  {
    id: "floorplan",
    label: "Floor plan",
    description: "Floors, rooms, walls, doors and furniture",
    tools: ["select", "pan", "room-rect", "room-poly", "curve"],
    shortcuts: { s: "select", h: "pan", r: "room-rect", p: "room-poly", c: "curve" },
    elements: ELEMENT_GROUPS,
    automations: true
  },
  {
    id: "hydronic",
    label: "Hydronic station",
    description: "Pumps, valves, heat exchangers and piping",
    tools: ["select", "pan", "pipe"],
    shortcuts: { s: "select", h: "pan", p: "pipe" },
    elements: HYDRONIC_GROUPS,
    automations: false
  },
  {
    id: "network",
    label: "Network topology",
    description: "Controllers, switches, devices and their links",
    tools: ["select", "pan"],
    shortcuts: { s: "select", h: "pan" },
    elements: [],
    automations: false
  }
];
*/

export const GENERAL_TOOLS = ["select", "pan", "text"];

export const GENERAL_SHORTCUTS = { s: "select", h: "pan", t: "text" };

function defineApp(config){
  return {
    ...config,
    tools: [...GENERAL_TOOLS, ...config.special],
    shortcuts: { ...GENERAL_SHORTCUTS, ...config.specialShortcuts }
  };
}

export const APPS = [
  defineApp({
    id: "floorplan",
    label: "Floor plan",
    description: "Floors, rooms, walls, doors and furniture",
    special: ["room-rect", "room-poly", "curve"],
    specialShortcuts: { r: "room-rect", p: "room-poly", c: "curve" },
    elements: ELEMENT_GROUPS,
    automations: true,
    exports: ["svg"]
  }),
  defineApp({
    id: "hydronic",
    label: "Hydronic station",
    description: "Pumps, valves, heat exchangers and piping",
    special: ["pipe"],
    specialShortcuts: { p: "pipe" },
    elements: HYDRONIC_GROUPS,
    automations: false,
    exports: ["svg", "pgd"]
  }),
  defineApp({
    id: "network",
    label: "Network topology",
    description: "Controllers, switches, devices and their links",
    special: [],
    specialShortcuts: {},
    elements: [],
    automations: false,
    exports: ["svg"]
  })
];

export function appById(id){
  return APPS.find((entry) => entry.id === id) ?? APPS[0];
}
