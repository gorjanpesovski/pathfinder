const SUPPLY_FAN = {
    speed: ".Status_Fan_Supply_Modulating",
    pressure: ".Status_Pressure_Supply",
    flow: ".Status_Air_Flow_Supply",
    "setpoint:pressure": ".CMD_Pressure_Setpoint_Supply",
    dpSwitch: ".ALM_Fan_Supply_1_Flow",
    alarm: ".ALM_Fan_Supply_1_Overload"
};

const RETURN_FAN = {
    speed: ".Status_Fan_Return_Modulating",
    pressure: ".Status_Pressure_Return",
    flow: ".Status_Air_Flow_Return",
    "setpoint:pressure": ".CMD_Pressure_Setpoint_Return",
    dpSwitch: ".ALM_Fan_Return_1_Flow",
    alarm: ".ALM_Fan_Return_1_Overload"
};

export const CONTROLLERS = {
    empty: { name: "Empty", registers: {} },
    carel: {
        name: "Carel",
        registers: {
            "int-damper": (el) => ({ position: el.signalType === "continious" ? ".Status_Damper_Outdoor_Modulating" : ".Status_Damper_Outdoor" }),
            "exh-damper": (el) => ({ position: el.signalType === "continious" ? ".Status_Damper_Exhaust_Modulating" : ".Status_Damper_Exhaust" }),
            "sup-fan": SUPPLY_FAN,
            "int-fan": SUPPLY_FAN,
            "ret-fan": RETURN_FAN,
            "exh-fan": RETURN_FAN,
            "sup-filter": { dpSwitch: ".ALM_Filter_Supply" },
            "ret-filter": { dpSwitch: ".ALM_Filter_Return" },
            "int-pre-filter": { dpSwitch: ".ALM_Filter_Dirty_Digital_Input" },
            "sup-temp-sensor": { temperature: ".Status_Temperature_Supply", "setpoint:temperature": ".Status_Temperature_Setpoint_Active", alarm: ".ALM_Probe_Regulation" },
            "int-temp-sensor": { temperature: ".Status_Temperature_Outdoor" },
            "exh-temp-sensor": { temperature: ".Status_Temperature_Exhaust" },
            "ret-temp-sensor": { temperature: ".Status_Temperature_Return", "setpoint:temperature": ".Status_Temperature_Setpoint_Active" },
            "sup-humidity-sensor": { humidity: ".Status_Humidity_Supply", "setpoint:humidity": ".Status_Humidity_Setpoint_Active" },
            "int-humidity-sensor": { humidity: ".Status_Humidity_Outdoor" },
            "ret-humidity-sensor": { humidity: ".Status_Humidity_Return", "setpoint:humidity": ".Status_Humidity_Setpoint_Active" },
            "sup-co2-sensor": { co2: ".Status_Air_Quality_CO2" },
            "ret-co2-sensor": { co2: ".Status_Air_Quality_CO2" },
            "sup-frost-thermostat": { temperature: ".Status_Temperature_Frost_Protection", alarm: ".ALM_Frost_Protection_Thermostat" },
            "exh-frost-thermostat": { alarm: ".ALM_Frost_Protection_Thermostat" },
            "sup-humidifier": (el) => ({ position: el.signalType === "continious" ? ".Status_Humidifier_Modulating" : ".Status_Humidifier", alarm: ".ALM_Humidifier" }),
            "sup-preheat-hot-water-coils": { position: ".Status_Valve_Preheat_Modulating", temperature: ".Status_Temperature_Coil_Preheat_Water", alarm: ".ALM_Coil_Preheat_Water_Temperature" },
            "sup-reheat-hot-water-coils": { position: ".Status_Valve_Reheat_Modulating", temperature: ".Status_Temperature_Coil_Reheat_Water", alarm: ".ALM_Coil_Reheat_Water_Temperature" },
            "sup-cold-water-coils": { position: ".Status_Valve_Cooling_Modulating", temperature: ".Status_Temperature_Coil_Cooling_Water", alarm: ".ALM_Coil_Cooling_Water_Temperature" },
            "sup-preheat-electric-heater": { position: ".Status_Heater_Preheat_Modulating", alarm: ".ALM_Heater_Preheat" },
            "sup-reheat-electric-heater": { position: ".Status_Heater_Reheat_Modulating", alarm: ".ALM_Heater_Reheat" }
        }
    }
};

export function registersOf(controller, element){
    const entry = CONTROLLERS[controller]?.registers[element.template ?? element.key];
    return (typeof entry === "function" ? entry(element) : entry) ?? {};
}
