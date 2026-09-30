
import { electricSize } from "../electric/symbols.js";

const HUB_NODES = [0.1507, 0.3243, 0.4979, 0.6715, 0.8451];
const HUB_PORTS = { top: HUB_NODES, bottom: HUB_NODES, left: [0.5], right: [0.5] };

export const HYDRONIC_ELEMENTS = {
  boiler: { label: "Boiler", atv: "Bojler", width: 205, height: 330 },
  heatPump: { label: "Heat pump", atv: "Toplotna_Crpalka", width: 330, height: 235, params: ["name"] },
  bufferTank: { label: "Buffer tank", atv: "Zalogovnik", width: 163, height: 330, tankProbes: true },
  heatExchanger: { label: "Heat exchanger", atv: "Toplotni_Izmenjevalnik", width: 101, height: 201 },
  electricHeater: { label: "Electric heater", atv: "Elektricni_Grelec", width: 101, height: 221 },
  manifold: { label: "Manifold", atv: "Manifold", width: 300, height: 40, bar: true, fixedHeight: true },
  branch: { label: "Branch", width: 240, height: 210, branch: true, ownLabel: true, ports: { bottom: [90 / 240, 150 / 240] } },
  pump: { label: "Pump", atv: "Crpalka", native: { width: 55, height: 55 }, width: 52, height: 52, inline: true, orient: "flow" },
  valve: { label: "Valve", atv: "Valve", width: 56, height: 32, inline: true, orient: "axis" },
  controlValve: { label: "Motorized valve", atv: "Dvosmerni_Ventil", native: { width: 22, height: 26.05, axisY: 19.545 }, width: 60, height: 100, inline: true, orient: "axis", readout: { measure: "Position", label: "", unit: "%", decimals: 0 } },
  threeWayValve: { label: "Three-way valve", atv: "Trismerni_Ventil", native: { width: 22, height: 30.6, axisY: 19.545 }, width: 60, height: 100, inline: true, orient: "axis", junction: true, readout: { measure: "Position", label: "", unit: "%", decimals: 0 } },
  energyValve: { label: "Energy valve", atv: "Energijski_Ventil", native: { width: 50, height: 130, axisY: 101.8 }, width: 50, height: 203.6, inline: true, orient: "stem", readout: { measure: "Position", label: "", unit: "%", decimals: 0 } },
  checkValve: { label: "Check valve", atv: "Nepovratna_Loputa", native: { width: 83.01, height: 43.02 }, width: 52, height: 32, inline: true, orient: "flow" },
  tempProbe: { label: "Temperature probe", atv: "Temperaturni_Senzor", native: { width: 35, height: 35 }, width: 40, height: 40, inline: true, orient: "upright", readout: { measure: "Temperature", label: "T:", unit: "°C" } },
  pressureProbe: { label: "Pressure probe", atv: "Tlacni_Senzor", width: 40, height: 40, inline: true, orient: "upright", readout: { measure: "Pressure", label: "P:", unit: "bar" } },
  meterSensor: { label: "Energy meter sensor", width: 22, height: 22, inline: true, orient: "upright", primitive: true },
  tempSwitch: { label: "Temperature switch", atv: "Varnostni_Termostat", width: 40, height: 40, inline: true, orient: "upright" },
  pressureSwitch: { label: "Pressure switch", atv: "Varnostno_Tlacno_Stikalo", width: 40, height: 40, inline: true, orient: "upright" },
  router: { label: "Router", atv: "Topologija.Hub", width: 240, height: 80, device: "hub", ownLabel: true, ports: HUB_PORTS },
  networkSwitch: { label: "Switch", atv: "Topologija.Hub", width: 240, height: 80, device: "hub", ownLabel: true, ports: HUB_PORTS },
  ipDevice: { label: "IP device", atv: "Topologija.IP_Naprava", width: 240, height: 80, device: "ip", ownLabel: true, centerPorts: true },
  rtuDevice: { label: "RTU device", atv: "Topologija.RTU_Naprava", width: 240, height: 80, device: "rtu", ownLabel: true, centerPorts: true },
  gateway: { label: "Gateway", atv: "Topologija.Gateway", width: 240, height: 80, device: "gateway", ownLabel: true, centerPorts: true },
  controller: { label: "Controller", ...electricSize("controller"), electric: true, ownLabel: true },
  terminalStrip: { label: "Terminals", ...electricSize("terminalStrip"), electric: true, ownLabel: true },
  cable: { label: "Cable", ...electricSize("cable"), electric: true, ownLabel: true },
  relayCoil: { label: "Relay coil", ...electricSize("relayCoil"), electric: true, ownLabel: true },
  relayContact: { label: "Relay contact", ...electricSize("relayContact"), electric: true, ownLabel: true },
  fieldDevice: { label: "Field device", ...electricSize("fieldDevice"), electric: true, ownLabel: true }
};

export const ELECTRIC_GROUPS = [
  { id: "control", label: "Control", items: ["controller", "relayCoil", "relayContact"] },
  { id: "wiring", label: "Wiring", items: ["terminalStrip", "cable", "fieldDevice"] }
];

export function isElectricType(type){
  return !!HYDRONIC_ELEMENTS[type]?.electric;
}

export const NETWORK_GROUPS = [
  { id: "devices", label: "Devices", items: ["ipDevice", "rtuDevice", "gateway"] },
  { id: "infrastructure", label: "Network", items: ["router", "networkSwitch"] }
];

export function isDeviceType(type){
  return !!HYDRONIC_ELEMENTS[type]?.device;
}

export const HYDRONIC_GROUPS = [
  { id: "equipment", label: "Equipment", items: ["heatPump", "boiler", "bufferTank", "heatExchanger", "electricHeater", "manifold", "branch"] },
  { id: "inline", label: "On pipes", items: ["pump", "valve", "controlValve", "threeWayValve", "checkValve"] },
  { id: "sensors", label: "Sensors", items: ["tempProbe", "pressureProbe", "tempSwitch", "pressureSwitch", "meterSensor"] }
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
  { id: "other", label: "Other", color: "#64748B" },
  { id: "modbusTcp", label: "Modbus TCP", color: "#2A5BA7", network: true },
  { id: "modbusRtu", label: "Modbus RTU", color: "#1E3A8A", dash: true, network: true },
  { id: "bacnetIp", label: "BACnet/IP", color: "#2A7A53", network: true },
  { id: "bacnetMstp", label: "BACnet MS/TP", color: "#2A7A53", dash: true, network: true },
  { id: "knx", label: "KNX", color: "#D97706", network: true },
  { id: "mqtt", label: "MQTT", color: "#7C3AED", network: true },
  { id: "opcUa", label: "OPC UA", color: "#0F766E", network: true },
  { id: "ethernet", label: "Ethernet", color: "#64748B", network: true },
  { id: "wire", label: "Wire", color: "#1E293B", electric: true },
  { id: "sp", label: "SP (24 V AC)", color: "#1E293B", electric: true, rail: "SP" },
  { id: "sn", label: "SN (24 V AC)", color: "#1E293B", electric: true, rail: "SN" },
  { id: "dcPlus", label: "DC+ (24 V DC)", color: "#1E293B", electric: true, rail: "DC+" },
  { id: "dcMinus", label: "DC− (24 V DC)", color: "#1E293B", electric: true, rail: "DC−" },
  { id: "neutral", label: "N", color: "#1E293B", electric: true, rail: "N", dashArray: "10 6" },
  { id: "earth", label: "PE", color: "#1E293B", electric: true, rail: "PE", dashArray: "14 4 3 4" }
];

export const DEFAULT_PROTOCOL = "modbusTcp";
export const DEFAULT_WIRE = "wire";

export function familyOf(medium){
  return medium?.network ? "network" : medium?.electric ? "electric" : "hydronic";
}

export function mediaFor(family){
  return PIPE_MEDIA.filter((entry) => familyOf(entry) === family);
}

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
  return PIPE_MEDIA.find((entry) => entry.id === key) ?? PIPE_MEDIA.find((entry) => entry.id === "other");
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
  if (shape.kind === "pipe") return mediumOf(shape.medium).network ? "Connection" : mediumOf(shape.medium).electric ? "Wire" : "Pipe";
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
