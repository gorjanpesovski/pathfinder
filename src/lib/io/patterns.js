export const IO_KINDS = [
  { id: "DO", label: "Digital output", plural: "Digital outputs", prefix: "NO" },
  { id: "AO", label: "Analog output", plural: "Analog outputs", prefix: "Y" },
  { id: "DI", label: "Digital input", plural: "Digital inputs", prefix: "ID" },
  { id: "AI", label: "Analog input", plural: "Analog inputs", prefix: "U" }
];

export const DATA_TYPES = ["BOOL", "SINT", "INT", "DINT", "USINT", "UINT", "UDINT", "REAL", "LREAL", "TIME", "STRING"];

const FLAGS = {
  io: { io: true, protocol: true, ui: true, dev: false, retain: false },
  input: { io: true, protocol: false, ui: false, dev: false, retain: false },
  auto: { io: false, protocol: true, ui: true, dev: false, retain: false },
  setting: { io: false, protocol: true, ui: true, dev: true, retain: true }
};

export function ioKind(id){
  return IO_KINDS.find((kind) => kind.id === id) ?? IO_KINDS[0];
}

export function cleanName(value){
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function cleanChannel(value){
  return String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function pointBase(point){
  return [cleanChannel(point.board), cleanChannel(point.channel), cleanName(point.name)].filter(Boolean).join("_");
}

function variable(name, dataType, flags, extra = {}){
  return { name, dataType, ...FLAGS[flags], log: false, decimals: "", min: "", max: "", initial: "", comment: "", ...extra };
}

export function pointVariables(point){
  const base = pointBase(point);
  const comment = point.comment ?? "";
  if (point.kind === "DO") return [
    variable(`${base}_AR`, "BOOL", "setting"),
    variable(`${base}_A`, "BOOL", "auto"),
    variable(`${base}_R`, "BOOL", "setting"),
    variable(`DO_${base}`, "BOOL", "io", { comment })
  ];
  if (point.kind === "AO") return [
    variable(`${base}_AR`, "BOOL", "setting"),
    variable(`${base}_A`, "REAL", "auto", { decimals: "1" }),
    variable(`${base}_R`, "REAL", "setting", { decimals: "1", min: "0.0", max: "100.0", initial: "0.0" }),
    variable(`AO_${base}`, "REAL", "io", { decimals: "1", comment })
  ];
  if (point.kind === "DI") return [
    variable(`DI_${base}`, "BOOL", "input", { comment }),
    variable(`LG_DI_${base}`, "BOOL", "setting"),
    ...(hasStatus(point) ? [variable(statusName(point), "BOOL", "auto")] : [])
  ];
  return [
    variable(`AI_${base}`, "REAL", "io", { decimals: "1", comment }),
    variable(`ERR_AI_${base}`, "INT", "io")
  ];
}

export function alarmName(point){
  const base = pointBase(point);
  if (point.kind === "DI") return `ALM_DI_${base}`;
  if (point.kind === "AI") return `ALM_ERR_AI_${base}`;
  return null;
}

export const DI_USES = [
  { id: "alarm", label: "Alarm" },
  { id: "status", label: "Status" },
  { id: "both", label: "Alarm + status" }
];

export function diUse(point){
  return point.use ?? (point.alarm === false ? "status" : "alarm");
}

export function statusName(point){
  return `STATUS_DI_${pointBase(point)}`;
}

export function hasAlarm(point){
  if (point.kind === "AI") return true;
  return point.kind === "DI" && diUse(point) !== "status";
}

export function hasStatus(point){
  return point.kind === "DI" && diUse(point) !== "alarm";
}

export function alarmsTxt(points){
  const rows = points.filter(hasAlarm).map((point) => [alarmName(point), "Auto reset", "Positive", "", "", "", "", "", ""].join("\t"));
  return ["Version 1.1 Alarms RepoVersion 3.6.6", "Name\tType\tEdge\tDescription\tCounterMax\tTimeValue\tStorVar1\tStorVar2", ...rows, ""].join("\r\n");
}

export const ROLES = [
  { id: "pump", label: "Pump", kind: "DO" },
  { id: "valve", label: "Mixing valve", kind: "AO" },
  { id: "supply", label: "Supply temperature", kind: "AI" },
  { id: "thermostat", label: "Safety thermostat", kind: "DI" },
  { id: "outdoor", label: "Outdoor temperature", kind: "AI", station: true }
];

export function roleOf(id){
  return ROLES.find((role) => role.id === id) ?? null;
}

function same(name){
  return { plain: name, active: name };
}

export function branchInputs(points, branchId){
  const found = {};
  const duplicates = new Set();
  for (const point of points) {
    const role = roleOf(point.role);
    if (!role || role.kind !== point.kind) continue;
    if (!role.station && point.branch !== branchId) continue;
    if (found[role.id]) duplicates.add(role.id);
    else found[role.id] = point;
  }
  const missing = ["pump", "valve", "supply", "outdoor"].filter((id) => !found[id]);
  const base = (id) => pointBase(found[id]);
  const thermostat = found.thermostat;
  const names = missing.length ? null : {
    pump: same(`${base("pump")}_A`),
    valve: same(`${base("valve")}_A`),
    supply: same(`AI_${base("supply")}`),
    outdoor: same(`AI_${base("outdoor")}`),
    outdoorAlarm: { plain: `ALM_ERR_AI_${base("outdoor")}`, active: `ALM_ERR_AI_${base("outdoor")}.Active` },
    thermostat: !thermostat ? same("FALSE")
      : hasAlarm(thermostat) ? { plain: alarmName(thermostat), active: `${alarmName(thermostat)}.Active` }
      : same(statusName(thermostat))
  };
  return { found, missing, duplicates: [...duplicates], names };
}

export function allVariables(points, others){
  return [...points.flatMap(pointVariables), ...others];
}

function attr(value){
  return String(value ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function variableXml(entry){
  const parts = [
    ["Name", entry.name],
    ["Comment", entry.comment ?? ""],
    ["DataType", entry.dataType],
    ["Kind", "Var"],
    ["IO", !!entry.io],
    ["Protocol", !!entry.protocol],
    ["UI", !!entry.ui],
    ["Default", !!entry.dev],
    ["LogPV", !!entry.log],
    ["IsRetained", !!entry.retain],
    ["Alarm", false],
    ["UoM", "NoUnits"],
    ["Access", "ReadWrite"],
    ["Acronym", ""]
  ];
  if (entry.decimals !== "" && entry.decimals !== undefined) parts.push(["Decimals", entry.decimals]);
  parts.push(["Min", entry.min ?? ""], ["Max", entry.max ?? ""]);
  if (entry.initial !== "" && entry.initial !== undefined) parts.push(["InitialValue", entry.initial]);
  parts.push(["StringSize", entry.dataType === "STRING" ? entry.stringSize ?? 80 : 0]);
  return `    <Variable ${parts.map(([key, value]) => `${key}="${attr(value)}"`).join(" ")} />`;
}

export function manifestXml(variables){
  return [
    '<?xml version="1.0" encoding="utf-16"?>',
    "<Manifest>",
    "  <DataTypes />",
    "  <Variables>",
    ...variables.map(variableXml),
    "  </Variables>",
    "</Manifest>"
  ].join("\r\n");
}

function readVariables(text){
  const list = [];
  for (const match of String(text).matchAll(/<Variable\b([^>]*?)\/?>/g)) {
    const attrs = Object.fromEntries([...match[1].matchAll(/(\w+)="([^"]*)"/g)].map(([, key, value]) => [key, value
      .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")]));
    if (!attrs.Name) continue;
    list.push({
      name: attrs.Name,
      dataType: attrs.DataType ?? "BOOL",
      io: attrs.IO === "true",
      protocol: attrs.Protocol === "true",
      ui: attrs.UI === "true",
      dev: attrs.Default === "true",
      log: attrs.LogPV === "true",
      retain: attrs.IsRetained === "true",
      decimals: attrs.Decimals ?? "",
      min: attrs.Min ?? "",
      max: attrs.Max ?? "",
      initial: attrs.InitialValue ?? "",
      comment: attrs.Comment ?? ""
    });
  }
  return list;
}

function splitBase(base){
  const match = base.match(/^(?:(N\d+)_)?([A-Z]+\d+)_(.+)$/);
  return match ? { board: match[1] ?? "", channel: match[2], name: match[3] } : null;
}

export function importManifest(text){
  const found = readVariables(text);
  const byName = new Map(found.map((entry) => [entry.name, entry]));
  const used = new Set();
  const points = [];
  const claim = (names) => {
    if (!names.every((name) => byName.has(name) && !used.has(name))) return false;
    names.forEach((name) => used.add(name));
    return true;
  };
  const alarms = new Set(found.filter((entry) => entry.dataType === "ALM").map((entry) => entry.name));
  alarms.forEach((name) => used.add(name));
  for (const entry of found) {
    const match = entry.name.match(/^(DO|AO|DI|AI)_(.+)$/);
    if (!match || used.has(entry.name)) continue;
    const [, kind, base] = match;
    const parts = splitBase(base);
    if (!parts) continue;
    const group = kind === "DO" || kind === "AO"
      ? [`${base}_AR`, `${base}_A`, `${base}_R`, entry.name]
      : kind === "DI" ? [entry.name, `LG_DI_${base}`] : [entry.name, `ERR_AI_${base}`];
    if (!claim(group)) continue;
    const point = { kind, ...parts, comment: entry.comment };
    if (kind === "DI") {
      const status = `STATUS_DI_${base}`;
      const withStatus = claim([status]);
      point.use = withStatus ? (alarms.has(`ALM_DI_${base}`) ? "both" : "status") : "alarm";
    }
    points.push(point);
  }
  const others = found.filter((entry) => !used.has(entry.name));
  return { points, others, total: found.length };
}

export function nextChannel(points, kind, board = ""){
  const prefix = ioKind(kind).prefix;
  const taken = new Set(points
    .filter((point) => cleanChannel(point.board) === cleanChannel(board))
    .map((point) => cleanChannel(point.channel)));
  let index = 1;
  while (taken.has(`${prefix}${index}`)) index += 1;
  return `${prefix}${index}`;
}
