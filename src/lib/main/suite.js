import { APPS } from "$lib/editor/apps.js";
import floorplan from "./icons/floorplan.svg";
import hydronic from "./icons/hydronic.svg";
import network from "./icons/network.svg";
import wiring from "./icons/wiring.svg";
import ahu from "./icons/ahu.svg";
import settingsGenerator from "./icons/settings-generator.svg";
import mainScreen from "./icons/main-screen.svg";

const ICONS = { floorplan, hydronic, network, electrical: wiring };

export const SUITE = [
  ...APPS.map((app) => ({ id: app.id, name: app.label, tagline: app.description, route: app.route, icon: ICONS[app.id] })),
  { id: "ahu", name: "AHU", tagline: "AHU Generator", route: "ahu", icon: ahu },
  { id: "settings-generator", name: "Settings", tagline: "Settings Generator", route: "settings-generator", icon: settingsGenerator },
  { id: "main-screen", name: "Main Screen", tagline: "Main Screen Generator", route: "main-screen", icon: mainScreen, soon: true }
];

export function suiteEntry(id){
  return SUITE.find((entry) => entry.id === id) ?? null;
}

export function isSuiteRoute(path){
  return path === "/" || SUITE.some((entry) => path === `/${entry.route}`);
}
