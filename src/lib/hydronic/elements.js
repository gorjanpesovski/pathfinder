/*
export const HYDRONIC_ELEMENTS = {
  boiler: { label: "Boiler", atv: "Boiler", width: 80, height: 120 },
  heatPump: { label: "Heat pump", atv: "Heat_Pump", width: 120, height: 100 },
  bufferTank: { label: "Buffer tank", atv: "Buffer_Tank", width: 80, height: 160 },
  heatExchanger: { label: "Heat exchanger", atv: "Heat_Exchanger", width: 60, height: 120 },
  consumer: { label: "Heating circuit", atv: "Heating_Circuit", width: 100, height: 60 },
  expansionVessel: { label: "Expansion vessel", atv: "Expansion_Vessel", width: 60, height: 80 },
  manifold: { label: "Manifold", atv: "Manifold", width: 240, height: 40 },
  pump: { label: "Pump", atv: "Pump", width: 40, height: 40, inline: true },
  valve: { label: "Valve", atv: "Valve", width: 40, height: 24, inline: true },
  controlValve: { label: "Control valve", atv: "Control_Valve", width: 40, height: 40, inline: true },
  checkValve: { label: "Check valve", atv: "Check_Valve", width: 40, height: 24, inline: true },
  tempProbe: { label: "Temperature probe", atv: "Temperature_Probe", width: 24, height: 40, inline: true }
};
*/

export const HYDRONIC_ELEMENTS = {
  // boiler: { label: "Boiler", atv: "Boiler", width: 100, height: 140 },
  // heatPump: { label: "Heat pump", atv: "Heat_Pump", width: 140, height: 120, caption: "inside" },
  // bufferTank: { label: "Buffer tank", atv: "Buffer_Tank", width: 100, height: 200 },
  // heatExchanger: { label: "Heat exchanger", atv: "Heat_Exchanger", width: 80, height: 140 },
  // consumer: { label: "Heating circuit", atv: "Heating_Circuit", width: 120, height: 80, caption: "inside" },
  // expansionVessel: { label: "Expansion vessel", atv: "Expansion_Vessel", width: 80, height: 100 },
  // manifold: { label: "Manifold", atv: "Manifold", width: 300, height: 60 },
  // boiler: { label: "Boiler", atv: "Boiler", width: 205, height: 330 },
  boiler: { label: "Boiler", atv: "Bojler", width: 205, height: 330 },
  // heatPump: { label: "Heat pump", atv: "Heat_Pump", width: 330, height: 235, params: ["name"] },
  heatPump: { label: "Heat pump", atv: "Toplotna_Crpalka", width: 330, height: 235, params: ["name"] },
  // bufferTank: { label: "Buffer tank", atv: "Buffer_Tank", width: 163, height: 330 },
  bufferTank: { label: "Buffer tank", atv: "Zalogovnik", width: 163, height: 330 },
  manifold: { label: "Manifold", atv: "Manifold", width: 300, height: 40, bar: true, fixedHeight: true },
  // branch: { label: "Branch", atv: "Branch", width: 340, height: 800, branch: true, noPorts: true, ownLabel: true },
  branch: { label: "Branch", atv: "Veja", path: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.2.%20Toplotna%20Postaja.Veja", width: 340, height: 800, branch: true, noPorts: true, ownLabel: true },
  // pump: { label: "Pump", atv: "Pump", width: 52, height: 52, inline: true },
  // valve: { label: "Valve", atv: "Valve", width: 52, height: 32, inline: true },
  // controlValve: { label: "Control valve", atv: "Control_Valve", width: 52, height: 52, inline: true },
  // checkValve: { label: "Check valve", atv: "Check_Valve", width: 52, height: 32, inline: true },
  // tempProbe: { label: "Temperature probe", atv: "Temperature_Probe", width: 32, height: 52, inline: true }
  // pump: { label: "Pump", atv: "Pump", width: 52, height: 52, inline: true, orient: "flow" },
  // valve: { label: "Valve", atv: "Valve", width: 56, height: 32, inline: true, orient: "axis" },
  // controlValve: { label: "Motorized valve", atv: "Control_Valve", width: 60, height: 100, inline: true, orient: "axis" },
  // threeWayValve: { label: "Three-way valve", atv: "Three_Way_Valve", width: 60, height: 100, inline: true, orient: "axis" },
  // checkValve: { label: "Check valve", atv: "Check_Valve", width: 52, height: 32, inline: true, orient: "flow" },
  // tempProbe: { label: "Temperature probe", atv: "Temperature_Probe", width: 40, height: 40, inline: true, orient: "upright" }
  // pump: { label: "Pump", atv: "Pump", width: 52, height: 52, inline: true, orient: "flow" },
  pump: { label: "Pump", atv: "Crpalka", native: { width: 55, height: 55 }, width: 52, height: 52, inline: true, orient: "flow" },
  valve: { label: "Valve", atv: "Valve", width: 56, height: 32, inline: true, orient: "axis" },
  // controlValve: { label: "Motorized valve", atv: "Control_Valve", width: 60, height: 100, inline: true, orient: "axis" },
  controlValve: { label: "Motorized valve", atv: "Dvosmerni_Ventil", native: { width: 22, height: 26.05 }, width: 60, height: 100, inline: true, orient: "axis" },
  // threeWayValve: { label: "Three-way valve", atv: "Three_Way_Valve", width: 60, height: 100, inline: true, orient: "axis" },
  threeWayValve: { label: "Three-way valve", atv: "Trismerni_Ventil", native: { width: 22, height: 30.6 }, width: 60, height: 100, inline: true, orient: "axis" },
  // checkValve: { label: "Check valve", atv: "Check_Valve", width: 52, height: 32, inline: true, orient: "flow" },
  checkValve: { label: "Check valve", atv: "Nepovratna_Loputa", native: { width: 83.01, height: 43.02 }, width: 52, height: 32, inline: true, orient: "flow" },
  // tempProbe: { label: "Temperature probe", atv: "Temperature_Probe", width: 40, height: 40, inline: true, orient: "upright", readout: { measure: "Temperature", label: "T:", unit: "°C" } },
  tempProbe: { label: "Temperature probe", atv: "Temperaturni_Senzor", native: { width: 35, height: 35 }, width: 40, height: 40, inline: true, orient: "upright", readout: { measure: "Temperature", label: "T:", unit: "°C" } },
  // pressureProbe: { label: "Pressure probe", atv: "Pressure_Probe", width: 40, height: 40, inline: true, orient: "upright", readout: { measure: "Pressure", label: "P:", unit: "bar" } },
  pressureProbe: { label: "Pressure probe", atv: "Tlacni_Senzor", width: 40, height: 40, inline: true, orient: "upright", readout: { measure: "Pressure", label: "P:", unit: "bar" } },
  // tempSwitch: { label: "Temperature switch", atv: "Temperature_Switch", width: 40, height: 40, inline: true, orient: "upright" },
  tempSwitch: { label: "Temperature switch", atv: "Varnostni_Termostat", width: 40, height: 40, inline: true, orient: "upright" },
  // pressureSwitch: { label: "Pressure switch", atv: "Pressure_Switch", width: 40, height: 40, inline: true, orient: "upright" }
  pressureSwitch: { label: "Pressure switch", atv: "Varnostno_Tlacno_Stikalo", width: 40, height: 40, inline: true, orient: "upright" }
};

export const HYDRONIC_GROUPS = [
  // { id: "equipment", label: "Equipment", items: ["boiler", "heatPump", "bufferTank", "heatExchanger", "consumer", "expansionVessel", "manifold"] },
  // { id: "equipment", label: "Equipment", items: ["heatPump", "boiler", "bufferTank", "manifold"] },
  { id: "equipment", label: "Equipment", items: ["heatPump", "boiler", "bufferTank", "manifold", "branch"] },
  // { id: "inline", label: "On pipes", items: ["pump", "valve", "controlValve", "checkValve", "tempProbe"] }
  // { id: "inline", label: "On pipes", items: ["pump", "valve", "controlValve", "threeWayValve", "checkValve", "tempProbe"] }
  { id: "inline", label: "On pipes", items: ["pump", "valve", "controlValve", "threeWayValve", "checkValve"] },
  { id: "sensors", label: "Sensors", items: ["tempProbe", "pressureProbe", "tempSwitch", "pressureSwitch"] }
];

export const READOUT_MODES = [
  { id: "none", label: "None" },
  { id: "value", label: "Value" },
  { id: "setpoint", label: "Setpoint" },
  { id: "both", label: "Both" }
];

/*
export const PIPE_MEDIA = [
  { id: "supply", label: "Supply", color: "#EF4444" },
  { id: "return", label: "Return", color: "#3B82F6" },
  { id: "other", label: "Other", color: "#64748B" }
];
*/

/*
export const PIPE_MEDIA = [
  { id: "hotSupply", label: "Hot supply", color: "#A32A3A" },
  { id: "hotReturn", label: "Hot return", color: "#2A5BA7" },
  { id: "coldSupply", label: "Cold supply", color: "#0E7490" },
  { id: "coldReturn", label: "Cold return", color: "#38BDF8" },
  { id: "glycolSupply", label: "Glycol supply", color: "#F0B9F3" },
  { id: "glycolReturn", label: "Glycol return", color: "#8CCFC3" },
  { id: "dhw", label: "Domestic hot water", color: "#EA580C" },
  { id: "dhwCirculation", label: "DHW circulation", color: "#FDBA74" },
  { id: "coldWater", label: "Cold water", color: "#16A34A" },
  { id: "other", label: "Other", color: "#64748B" }
];
*/

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
  // pipeWidth: 6,
  pipeWidth: 8,
  junctionRadius: 10,
  junctionStroke: "#414142",
  junctionWidth: 3,
  arrowSize: 22,
  gapSize: 18,
  background: "#FFFFFF",
  // library: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.Hydronic"
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
