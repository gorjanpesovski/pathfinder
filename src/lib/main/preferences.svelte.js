import { HYDRONIC_STYLE } from "@pathfinder/diagram/elements.js";
import { PGD_TAGS } from "@pathfinder/hydronic/pgd.js";
import { DEFAULT_PAPER, PAPERS } from "@pathfinder/diagram/electric/sheet.js";
import { LOGO } from "@pathfinder/diagram/electric/logo.js";
import { loadFlag } from "@pathfinder/core/settings.js";

const KEY = "pathfinder.preferences";

export const PREFERENCE_DEFAULTS = {
  company: "T3-TECH storitve, d.o.o.",
  logo: null,
  content: "Vezalna shema krmilja",
  canvasWidth: 1920,
  canvasHeight: 1080,
  gridSize: 20,
  snapToGrid: true,
  paper: DEFAULT_PAPER,
  library: HYDRONIC_STYLE.library,
  nodePrefix: "",
  pgdPrefix: PGD_TAGS.prefix,
  pgdFloat: PGD_TAGS.float,
  toolHints: true,
  viewsOnHover: true
};

function clean(saved){
  const merged = { ...PREFERENCE_DEFAULTS };
  for (const [key, fallback] of Object.entries(PREFERENCE_DEFAULTS)) {
    const value = saved?.[key];
    if (key === "logo") merged.logo = value && typeof value.href === "string" && value.width > 0 && value.height > 0 ? value : null;
    else if (typeof fallback === "number") merged[key] = Number.isFinite(value) && value > 0 ? value : fallback;
    else if (typeof fallback === "boolean") merged[key] = typeof value === "boolean" ? value : fallback;
    else if (typeof value === "string") merged[key] = value;
  }
  if (!PAPERS[merged.paper]) merged.paper = DEFAULT_PAPER;
  return merged;
}

function load(){
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (saved) return clean(saved);
    return clean({ toolHints: loadFlag("pathfinder.showToolHints", true), viewsOnHover: loadFlag("pathfinder.viewBarOnHover", true) });
  } catch {
    return clean(null);
  }
}

export const preferences = $state(load());

export function setPreference(key, value){
  preferences[key] = value;
  Object.assign(preferences, clean($state.snapshot(preferences)));
  try {
    localStorage.setItem(KEY, JSON.stringify($state.snapshot(preferences)));
  } catch {}
}

export function resetPreferences(){
  Object.assign(preferences, clean(null));
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function titleLogo(){
  return preferences.logo ?? LOGO;
}
