import { ELEMENT_GROUPS } from "./tools/furniture.js";
import { HYDRONIC_GROUPS } from "./hydronic/elements.js";

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

export function appById(id){
  return APPS.find((entry) => entry.id === id) ?? APPS[0];
}
