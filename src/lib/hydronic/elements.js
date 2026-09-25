
export const HYDRONIC_ELEMENTS = {
  boiler: { label: "Boiler", atv: "Bojler", width: 205, height: 330 },
  heatPump: { label: "Heat pump", atv: "Toplotna_Crpalka", width: 330, height: 235, params: ["name"] },
  bufferTank: { label: "Buffer tank", atv: "Zalogovnik", width: 163, height: 330, tankProbes: true },
  heatExchanger: { label: "Heat exchanger", atv: "Toplotni_Izmenjevalnik", width: 101, height: 201 },
  electricHeater: { label: "Electric heater", atv: "Elektricni_Grelec", width: 101, height: 221 },
  manifold: { label: "Manifold", atv: "Manifold", width: 300, height: 40, bar: true, fixedHeight: true },
  branch: { label: "Branch", atv: "Veja", path: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.2.%20Toplotna%20Postaja.Veja", width: 340, height: 800, branch: true, noPorts: true, ownLabel: true },
  pump: { label: "Pump", atv: "Crpalka", native: { width: 55, height: 55 }, width: 52, height: 52, inline: true, orient: "flow" },
  valve: { label: "Valve", atv: "Valve", width: 56, height: 32, inline: true, orient: "axis" },
  controlValve: { label: "Motorized valve", atv: "Dvosmerni_Ventil", native: { width: 22, height: 26.05, axisY: 19.545 }, width: 60, height: 100, inline: true, orient: "axis" },
  threeWayValve: { label: "Three-way valve", atv: "Trismerni_Ventil", native: { width: 22, height: 30.6, axisY: 19.545 }, width: 60, height: 100, inline: true, orient: "axis", junction: true },
  checkValve: { label: "Check valve", atv: "Nepovratna_Loputa", native: { width: 83.01, height: 43.02 }, width: 52, height: 32, inline: true, orient: "flow" },
  tempProbe: { label: "Temperature probe", atv: "Temperaturni_Senzor", native: { width: 35, height: 35 }, width: 40, height: 40, inline: true, orient: "upright", readout: { measure: "Temperature", label: "T:", unit: "°C" } },
  pressureProbe: { label: "Pressure probe", atv: "Tlacni_Senzor", width: 40, height: 40, inline: true, orient: "upright", readout: { measure: "Pressure", label: "P:", unit: "bar" } },
  tempSwitch: { label: "Temperature switch", atv: "Varnostni_Termostat", width: 40, height: 40, inline: true, orient: "upright" },
  pressureSwitch: { label: "Pressure switch", atv: "Varnostno_Tlacno_Stikalo", width: 40, height: 40, inline: true, orient: "upright" }
};

export const HYDRONIC_GROUPS = [
  { id: "equipment", label: "Equipment", items: ["heatPump", "boiler", "bufferTank", "heatExchanger", "electricHeater", "manifold", "branch"] },
  { id: "inline", label: "On pipes", items: ["pump", "valve", "controlValve", "threeWayValve", "checkValve"] },
  { id: "sensors", label: "Sensors", items: ["tempProbe", "pressureProbe", "tempSwitch", "pressureSwitch"] }
];

export const READOUT_MODES = [
  { id: "none", label: "None" },
  { id: "value", label: "Value" },
  { id: "setpoint", label: "Setpoint" },
  { id: "both", label: "Both" }
];

export const PIPE_MEDIA = [
  { id: "hotSupply", label: "Hot supply", color: "#EF4444" },
  { id: "hotReturn", label: "Hot return", color: "#830B0B" },
  { id: "coldSupply", label: "Cold supply", color: "#3B82F6" },
  { id: "coldReturn", label: "Cold return", color: "#063888" },
  { id: "glycolSupply", label: "Glycol supply", color: "#A855F7" },
  { id: "glycolReturn", label: "Glycol return", color: "#4C1D95" },
  { id: "dhw", label: "Domestic hot water", color: "#F97316" },
  { id: "dhwCirculation", label: "DHW circulation", color: "#9A3412" },
  { id: "coldWater", label: "Cold water", color: "#14B8A6" },
  { id: "coldWaterReturn", label: "Cold water return", color: "#115E59" },
  { id: "other", label: "Other", color: "#64748B" }
];

const MEDIUM_ALIASES = { supply: "hotSupply", return: "hotReturn" };

export const DEFAULT_MEDIUM = "hotSupply";

export const HYDRONIC_STYLE = {
  pipeWidth: 8,
  junctionRadius: 10,
  junctionStroke: "#414142",
  junctionWidth: 3,
  arrowSize: 22,
  gapSize: 18,
  background: "#FFFFFF",
  library: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone"
};

export const PORT_STEP = 20;

export function isHydronicType(type){
  return !!HYDRONIC_ELEMENTS[type];
}

export function isInlineType(type){
  return !!HYDRONIC_ELEMENTS[type]?.inline;
}

export function mediumOf(id){
  const key = MEDIUM_ALIASES[id] ?? id;
  return PIPE_MEDIA.find((entry) => entry.id === key) ?? PIPE_MEDIA[PIPE_MEDIA.length - 1];
}

export function nextElementName(type, shapes){
  const label = HYDRONIC_ELEMENTS[type]?.label ?? "Element";
  const taken = new Set(shapes.filter((shape) => shape.kind === "equipment").map((shape) => shape.name));
  let index = 1;
  while (taken.has(`${label} ${index}`)) index += 1;
  return `${label} ${index}`;
}

export function hydronicLabel(shape){
  if (shape.kind === "equipment") return HYDRONIC_ELEMENTS[shape.type]?.label ?? "Element";
  if (shape.kind === "pipe") return "Pipe";
  return null;
}

export function describeHydronic(shape){
  if (shape.kind === "equipment") return `${hydronicLabel(shape)} · ${shape.x}, ${shape.y}`;
  const bends = shape.points?.length ?? 0;
  const fittings = shape.fittings?.length ?? 0;
  return [mediumOf(shape.medium).label, bends ? `${bends} bend point${bends === 1 ? "" : "s"}` : null, fittings ? `${fittings} on pipe` : null]
    .filter(Boolean)
    .join(" · ");
}
