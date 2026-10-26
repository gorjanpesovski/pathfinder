export const DEFAULT_ICON_LIBRARY = "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone";
export const DEFAULT_NODE_PREFIX = "AGENT.OBJECTS.Klimat";

export const MEASURES = {
    temperature: { label: "T:", name: "Temperature", unit: "°C", decimals: 1 },
    humidity: { label: "RH:", name: "Humidity", unit: "%", decimals: 0 },
    co2: { label: "CO₂:", name: "CO₂", unit: "ppm", decimals: 0 },
    pressure: { label: "p:", name: "Pressure", unit: "Pa", decimals: 0 },
    flow: { label: "q:", name: "Flow", unit: "m³/h", decimals: 0 },
    position: { label: "Y:", name: "Position", unit: "%", decimals: 0 },
    output: { label: "Y:", name: "Output", unit: "%", decimals: 0 },
    power: { label: "P:", name: "Power", unit: "%", decimals: 0 },
    speed: { label: "n:", name: "Speed", unit: "%", decimals: 0 },
    voc: { label: "VOC:", name: "VOC", unit: "%", decimals: 0 },
    efficiency: { label: "η:", name: "Efficiency", unit: "%", decimals: 0 }
};

export const INDICATORS = {
    dpSwitch: { name: "ΔP switch", sprite: "dpSwitch", width: 32, height: 32, scale: 1.25 },
    alarm: { name: "Alarm", sprite: "alarm", width: 80, height: 80, scale: 0.7 },
    status: { name: "Status", sprite: "statusIndicator", width: 30, height: 30, scale: 28 / 30 }
};

export const FITTINGS = {
    pump: { name: "Pump", sprite: "pump", width: 55, height: 55, scale: 0.75 },
    valve: { name: "Valve", sprite: "threeWayValve", width: 22, height: 30.6, axis: 19.545, scale: 1.5 }
};

export const ELEMENT_TYPES = {
    damper: { name: "Damper", sprite: "damper", width: 103, height: 241.49, axis: 139.73, measures: ["position"], setpoints: [], indicators: [], baseMeasure: "position" },
    filter: { name: "Filter", sprite: "filter", width: 103, height: 203, measures: ["pressure"], setpoints: [], indicators: ["dpSwitch", "alarm"] },
    fan: { name: "Fan", sprite: "fan", width: 102, height: 102, directional: true, measures: ["speed", "pressure", "flow"], setpoints: ["speed", "pressure", "flow"], indicators: ["status", "dpSwitch", "alarm"] },
    temperatureSensor: { name: "Temperature sensor", sprite: "temperatureSensor", width: 32, height: 32, scale: 1.25, measures: ["temperature"], setpoints: ["temperature"], indicators: ["alarm"] },
    humiditySensor: { name: "Humidity sensor", sprite: "humiditySensor", width: 32, height: 32, scale: 1.25, measures: ["humidity"], setpoints: ["humidity"], indicators: [] },
    pressureSensor: { name: "Pressure sensor", sprite: "pressureSensor", width: 32, height: 32, scale: 1.25, measures: ["pressure"], setpoints: ["pressure"], indicators: [] },
    flowSensor: { name: "Air flow sensor", sprite: "flowSensor", width: 32, height: 32, scale: 1.25, measures: ["flow"], setpoints: [], indicators: [] },
    vocSensor: { name: "VOC sensor", sprite: "vocSensor", width: 32, height: 32, scale: 1.25, measures: ["voc"], setpoints: [], indicators: [] },
    dxCoil: { name: "DX cooling coil", sprite: "coldWaterCoils", width: 103, height: 203, measures: [], setpoints: [], indicators: ["status"] },
    silencer: { name: "Silencer", sprite: "silencer", width: 103, height: 203, measures: [], setpoints: [], indicators: [] },
    co2Sensor: { name: "CO₂ sensor", sprite: "co2Sensor", width: 32, height: 32, scale: 1.25, measures: ["co2"], setpoints: ["co2"], indicators: [] },
    hotWaterCoils: { name: "Hot water coil", sprite: "hotWaterCoils", width: 103, height: 203, measures: ["position", "temperature"], setpoints: [], indicators: ["alarm"], fittings: ["pump", "valve"], water: { supply: "#EF4444", return: "#830B0B" } },
    coldWaterCoils: { name: "Cold water coil", sprite: "coldWaterCoils", width: 103, height: 203, measures: ["position", "temperature"], setpoints: [], indicators: ["alarm"], fittings: ["pump", "valve"], water: { supply: "#3B82F6", return: "#063888" } },
    electricHeater: { name: "Electric heater", sprite: "electricHeater", width: 103, height: 203, measures: ["power"], setpoints: [], indicators: ["alarm"] },
    humidifier: { name: "Humidifier", sprite: "humidifier", width: 103, height: 221, axis: 101.5, measures: ["output"], setpoints: [], indicators: ["status", "alarm"] },
    frostThermostat: { name: "Frost thermostat", sprite: "frostThermostat", width: 32, height: 32, scale: 1.25, measures: ["temperature"], setpoints: [], indicators: ["alarm"] }
};

export const RECUPERATION_TYPES = {
    "plate-heat-exchanger": { name: "Plate heat exchanger", sprite: "plate-heat-exchanger" },
    "rotary-heat-exchanger": { name: "Rotary heat exchanger", sprite: "rotary-heat-exchanger" }
};

export const DEFAULT_ICON_NAMES = {
    damper: "Zaluzija",
    filter: "Filter",
    fan: "Ventilator",
    temperatureSensor: "Temperaturni_Sezor",
    humiditySensor: "Senzor_Vlaznosti",
    pressureSensor: "Tlacni_Senzor",
    co2Sensor: "",
    flowSensor: "",
    vocSensor: "",
    dxCoil: "Hladilec",
    silencer: "",
    hotWaterCoils: "Grelec",
    coldWaterCoils: "Hladilec",
    electricHeater: "",
    humidifier: "Vlazilec",
    frostThermostat: "Varnostni_Termostat",
    dpSwitch: "Delta_P",
    alarm: "Opozorilo",
    status: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.7.%20Indikatorji.General",
    pump: "Crpalka",
    valve: "Trismerni_Ventil",
    "plate-heat-exchanger": "",
    "rotary-heat-exchanger": ""
};

export const ICON_SLOTS = [
    ...Object.entries(ELEMENT_TYPES).map(([id, spec]) => ({ id, name: spec.name })),
    ...Object.entries(INDICATORS).map(([id, spec]) => ({ id, name: `${spec.name} indicator` })),
    ...Object.entries(FITTINGS).map(([id, spec]) => ({ id, name: `Coil ${spec.name.toLowerCase()}` })),
    ...Object.entries(RECUPERATION_TYPES).map(([id, spec]) => ({ id, name: spec.name }))
];

export const LINES = {
    supply: { name: "Supply", label: "Dovod", color: "#3B82F6" },
    return: { name: "Return", label: "Odvod", color: "#EF4444" },
    intake: { name: "Intake", label: "Zajem", color: "#22C55E" },
    exhaust: { name: "Exhaust", label: "Izpuh", color: "#F59E0B" }
};

export const RECUPERATION_OPTIONS = {
    dampers: [{ id: "bypass", name: "Bypass" }, { id: "mixing", name: "Mixing" }],
    readouts: [{ id: "wheelSpeed", name: "Wheel speed", measure: "speed", rotaryOnly: true }, { id: "efficiency", name: "Efficiency", measure: "efficiency" }],
    indicators: [{ id: "defrost", name: "Defrost heater" }, { id: "dirty", name: "Dirty alarm" }]
};

export const UNIT_OPTIONS = {
    room: [{ id: "roomTemperature", name: "Temperature", sprite: "temperatureSensor", slot: "temperatureSensor", measure: "temperature" }, { id: "roomHumidity", name: "Humidity", sprite: "humiditySensor", slot: "humiditySensor", measure: "humidity" }],
    status: [
        { id: "mode", name: "Operating mode", text: true },
        { id: "globalAlarm", name: "Global alarm", label: "Alarm", color: "#EF4444" },
        { id: "seriousAlarm", name: "Serious alarm", label: "Kritični alarm", color: "#EF4444" },
        { id: "fire", name: "Fire / smoke", label: "Požar / dim", color: "#EF4444" }
    ]
};

export function setpointId(measure){
    return `setpoint:${measure}`;
}
