import { parseDocument, serializeDocument, cleanImages, cleanVariables, cleanIo, cleanName } from "@pathfinder/core/document.js";
import { APPS } from "./apps.js";

export const APP_DATA = { hydronic: ["io", "variables"], electrical: ["wiring"] };

function cleanPages(pages){
  return pages && typeof pages === "object" && Array.isArray(pages.list) ? pages : null;
}

function makePart(app, source, name){
  const owns = APP_DATA[app] ?? [];
  return {
    app,
    name,
    canvas: source.canvas ?? null,
    settings: source.settings && typeof source.settings === "object" ? source.settings : null,
    images: cleanImages(source.images),
    pages: cleanPages(source.pages),
    shapes: Array.isArray(source.shapes) ? source.shapes : [],
    io: owns.includes("io") ? cleanIo(source.io) : null,
    variables: owns.includes("variables") ? cleanVariables(source.variables) : null,
    wiring: owns.includes("wiring") && source.wiring && typeof source.wiring === "object" ? source.wiring : null
  };
}

export function blankPart(app){
  return makePart(app, {}, null);
}

export function partText(part){
  const owns = APP_DATA[part.app] ?? [];
  const body = { name: part.name, canvas: part.canvas, ...(part.pages ? { pages: part.pages } : { shapes: part.shapes }), settings: part.settings, images: part.images };
  for (const key of owns) body[key] = part[key];
  return serializeDocument(part.app, body);
}

export function partHasContent(part){
  const pages = part.pages?.list ?? [];
  return pages.some((page) => Array.isArray(page.shapes) && page.shapes.length)
    || part.shapes.length > 0
    || (part.io && (part.io.points.length || part.io.others.length))
    || (part.variables?.length ?? 0) > 0
    || Boolean(part.wiring?.power?.rows?.length || part.wiring?.control?.rows?.length);
}

export function appLabel(app){
  return APPS.find((entry) => entry.id === app)?.label ?? app;
}

export function splitName(base, app){
  return `${base} – ${appLabel(app)}`;
}

export function readDocument(text, fallbackName = null){
  const parsed = parseDocument(text);
  if (!parsed.legacy) {
    if (!APPS.some((entry) => entry.id === parsed.app)) throw new Error("This drawing is for an app this version of Pathfinder does not have.");
    return { legacy: false, app: parsed.app, parts: { [parsed.app]: makePart(parsed.app, parsed.data, cleanName(parsed.data.name)) } };
  }
  const data = parsed.data;
  const base = cleanName(data.name) ?? fallbackName;
  const parts = {};
  for (const entry of APPS) {
    const app = entry.id;
    const source = {
      canvas: data.canvas, settings: data.settings, images: data.images,
      pages: data.pages?.[app] ?? null,
      shapes: Array.isArray(data.apps?.[app]) ? data.apps[app] : [],
      io: data.io, variables: data.variables, wiring: data.wiring
    };
    const part = makePart(app, source, base ? splitName(base, app) : null);
    if (part.pages && !part.pages.list.length) part.pages = null;
    if (partHasContent(part)) parts[app] = part;
  }
  return { legacy: true, app: APPS.some((entry) => entry.id === data.app) ? data.app : null, parts };
}
