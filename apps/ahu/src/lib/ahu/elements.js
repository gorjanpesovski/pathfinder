export const DEFAULT_ICON_LIBRARY = "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone";
export const DEFAULT_NODE_PREFIX = "AGENT.OBJECTS.Klimat";

export const MEASURES = {
    temperature: { label: "T:", name: "Temperature", unit: "°C", decimals: 1 },
    humidity: { label: "RH:", name: "Humidity", unit: "%", decimals: 0 },
    co2: { label: "CO₂:", name: "CO₂", unit: "ppm", decimals: 0 },
    pressure: { label: "p:", name: "Pressure", unit: "Pa", decimals: 0 },
    flow: { label: "q:", name: "Flow", unit: "m³/h", decimals: 0 },
    position: { label: "Y:", name: "Position", unit: "%", decimals: 0 },
    speed: { label: "n:", name: "Speed", unit: "%", decimals: 0 }
};

export const INDICATORS = {
    dpSwitch: { name: "ΔP switch", sprite: "dpSwitch", width: 32, height: 32, scale: 1.25 },
    alarm: { name: "Alarm", sprite: "alarm", width: 80, height: 80, scale: 0.7 }
};

export const ELEMENT_TYPES = {
    damper: { name: "Damper", sprite: "damper", width: 103, height: 241.49, axis: 139.73, measures: ["position"], setpoints: [], indicators: [], baseMeasure: "position" },
    filter: { name: "Filter", sprite: "filter", width: 103, height: 203, measures: ["pressure"], setpoints: [], indicators: ["dpSwitch"] },
    fan: { name: "Fan", sprite: "fan", width: 102, height: 102, measures: ["speed", "pressure", "flow"], setpoints: ["speed", "pressure", "flow"], indicators: ["dpSwitch", "alarm"] },
    temperatureSensor: { name: "Temperature sensor", sprite: "temperatureSensor", width: 32, height: 32, scale: 1.25, measures: ["temperature"], setpoints: ["temperature"], indicators: ["alarm"] },
    humiditySensor: { name: "Humidity sensor", sprite: "humiditySensor", width: 32, height: 32, scale: 1.25, measures: ["humidity"], setpoints: ["humidity"], indicators: [] },
    pressureSensor: { name: "Pressure sensor", sprite: "pressureSensor", width: 32, height: 32, scale: 1.25, measures: ["pressure"], setpoints: ["pressure"], indicators: [] },
    co2Sensor: { name: "CO₂ sensor", sprite: "co2Sensor", width: 32, height: 32, scale: 1.25, measures: ["co2"], setpoints: ["co2"], indicators: [] },
    hotWaterCoils: { name: "Hot water coil", sprite: "hotWaterCoils", width: 103, height: 203, measures: ["position", "temperature"], setpoints: [], indicators: ["alarm"] },
    coldWaterCoils: { name: "Cold water coil", sprite: "coldWaterCoils", width: 103, height: 203, measures: ["position", "temperature"], setpoints: [], indicators: ["alarm"] },
    electricHeater: { name: "Electric heater", sprite: "hotWaterCoils", width: 103, height: 203, measures: ["position"], setpoints: [], indicators: ["alarm"] },
    humidifier: { name: "Humidifier", sprite: "humidifier", width: 103, height: 221, axis: 101.5, measures: ["position"], setpoints: [], indicators: ["alarm"] },
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
    hotWaterCoils: "Grelec",
    coldWaterCoils: "Hladilec",
    electricHeater: "Grelec",
    humidifier: "Vlazilec",
    frostThermostat: "Varnostni_Termostat",
    dpSwitch: "Delta_P",
    alarm: "Opozorilo",
    "plate-heat-exchanger": "",
    "rotary-heat-exchanger": ""
};

export const ICON_SLOTS = [
    ...Object.entries(ELEMENT_TYPES).map(([id, spec]) => ({ id, name: spec.name })),
    ...Object.entries(INDICATORS).map(([id, spec]) => ({ id, name: `${spec.name} indicator` })),
    ...Object.entries(RECUPERATION_TYPES).map(([id, spec]) => ({ id, name: spec.name }))
];

export const LINES = {
    supply: { name: "Supply", label: "Dovod", color: "#3B82F6" },
    return: { name: "Return", label: "Odvod", color: "#EF4444" },
    intake: { name: "Intake", label: "Zajem", color: "#22C55E" },
    exhaust: { name: "Exhaust", label: "Izpuh", color: "#F59E0B" }
};

export function setpointId(measure){
    return `setpoint:${measure}`;
}
