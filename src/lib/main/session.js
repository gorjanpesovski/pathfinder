import { loadText, saveText } from "@pathfinder/core/settings.js";
import { isSuiteRoute } from "./suite.js";

const KEY = "pathfinder.lastRoute";
const start = loadText(KEY, "/");
let resumed = false;

export function resumeRoute(){
  if (resumed) return null;
  resumed = true;
  return start && start !== "/" && isSuiteRoute(start) ? start : null;
}

export function rememberRoute(route, entering){
  if (entering && route !== "/") resumed = true;
  saveText(KEY, route);
}
