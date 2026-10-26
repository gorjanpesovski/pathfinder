const ACCESS_SUPPLY_FAN = {
    speed: ".Status_Supply_Air_Fan",
    pressure: ".Status_Supply_Air_Pressure",
    flow: ".Status_Supply_Air_Flow",
    "setpoint:pressure": ".Status_Setpoint_Supply_Fan",
    "setpoint:flow": ".Status_Setpoint_Supply_Fan",
    alarm: ".ALM_Malfunction_Supply_Air_Fan",
    status: ".Status_Supply_Air_Fan_Start"
};

const ACCESS_EXTRACT_FAN = {
    speed: ".Status_Extract_Air_Fan",
    pressure: ".Status_Extract_Air_Pressure",
    flow: ".Status_Extract_Air_Flow",
    "setpoint:pressure": ".Status_Setpoint_Extract_Fan",
    "setpoint:flow": ".Status_Setpoint_Extract_Fan",
    alarm: ".ALM_Malfunction_Extract_Air_Fan",
    status: ".Status_Extract_Air_Fan_Start"
};

const ACCESS_SUPPLY_FILTER = {
    pressure: ".Status_Supply_Air_Filter_Pressure",
    dpSwitch: ".ALM_Filter_Guard_Supply_Air",
    alarm: ".ALM_Filter_Guard_Supply_Air"
};

const ACCESS_HEATING = {
    position: ".Status_Heating_Sequence_A",
    temperature: ".Status_Freeze_Protection_Temperature",
    alarm: ".ALM_Malfunction_Sequence_A",
    pump: ".Status_Heating_Pump",
    pumpFault: ".ALM_Malfunction_Sequence_A"
};

const ACCESS_ELECTRIC_HEATING = {
    power: ".Status_Heating_Sequence_A",
    alarm: ".ALM_Malfunction_Sequence_A"
};

const SUPPLY_FAN = {
    speed: ".Status_Fan_Supply_Modulating",
    pressure: ".Status_Pressure_Supply",
    flow: ".Status_Air_Flow_Supply",
    "setpoint:pressure": ".CMD_Pressure_Setpoint_Supply",
    dpSwitch: ".ALM_Fan_Supply_1_Flow",
    alarm: ".ALM_Fan_Supply_1_Overload",
    status: ".Status_Fan_Supply_1"
};

const RETURN_FAN = {
    speed: ".Status_Fan_Return_Modulating",
    pressure: ".Status_Pressure_Return",
    flow: ".Status_Air_Flow_Return",
    "setpoint:pressure": ".CMD_Pressure_Setpoint_Return",
    dpSwitch: ".ALM_Fan_Return_1_Flow",
    alarm: ".ALM_Fan_Return_1_Overload",
    status: ".Status_Fan_Return_1"
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
            "sup-filter": { dpSwitch: ".ALM_Filter_Supply", alarm: ".ALM_Filter_Supply" },
            "ret-filter": { dpSwitch: ".ALM_Filter_Return", alarm: ".ALM_Filter_Return" },
            "int-pre-filter": { dpSwitch: ".ALM_Filter_Dirty_Digital_Input", alarm: ".ALM_Filter_Dirty_Digital_Input" },
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
            "sup-humidifier": (el) => ({ output: el.signalType === "continious" ? ".Status_Humidifier_Modulating" : ".Status_Humidifier", status: ".Status_Humidifier", alarm: ".ALM_Humidifier" }),
            "sup-preheat-hot-water-coils": { position: ".Status_Valve_Preheat_Modulating", temperature: ".Status_Temperature_Coil_Preheat_Water", alarm: ".ALM_Coil_Preheat_Water_Temperature", pump: ".Status_Pump_Preheat_1", pumpFault: ".ALM_Pump_Preheat_1_Overload" },
            "sup-reheat-hot-water-coils": { position: ".Status_Valve_Reheat_Modulating", temperature: ".Status_Temperature_Coil_Reheat_Water", alarm: ".ALM_Coil_Reheat_Water_Temperature", pump: ".Status_Pump_Reheat_1", pumpFault: ".ALM_Pump_Reheat_1_Overload" },
            "sup-cold-water-coils": { position: ".Status_Valve_Cooling_Modulating", temperature: ".Status_Temperature_Coil_Cooling_Water", alarm: ".ALM_Coil_Cooling_Water_Temperature", pump: ".Status_Pump_Cooling_1", pumpFault: ".ALM_Pump_Cooling_1_Overload" },
            "sup-preheat-electric-heater": { power: ".Status_Heater_Preheat_Modulating", alarm: ".ALM_Heater_Preheat" },
            "sup-reheat-electric-heater": { power: ".Status_Heater_Reheat_Modulating", alarm: ".ALM_Heater_Reheat" },
            "sup-pressure-sensor": { pressure: ".Status_Pressure_Supply", "setpoint:pressure": ".CMD_Pressure_Setpoint_Supply" },
            "ret-pressure-sensor": { pressure: ".Status_Pressure_Return", "setpoint:pressure": ".CMD_Pressure_Setpoint_Return" },
            "sup-flow-sensor": { flow: ".Status_Air_Flow_Supply" },
            "ret-flow-sensor": { flow: ".Status_Air_Flow_Return" },
            "sup-voc-sensor": { voc: ".Status_Air_Quality_VOC" },
            "ret-voc-sensor": { voc: ".Status_Air_Quality_VOC" },
            "sup-after-recovery-temp-sensor": { temperature: ".Status_Temperature_After_Recovery" },
            "sup-saturation-temp-sensor": { temperature: ".Status_Temperature_Saturation" },
            "sup-dx-coil": { status: ".Status_Cooling_Stage_1" }
        },
        recuperation: {
            bypass: ".Status_Damper_Bypass_Modulating",
            mixing: ".Status_Damper_Mixing_Modulating",
            wheelSpeed: ".Status_Recovery_Rotary_Modulating",
            efficiency: ".Status_Recovery_Efficiency",
            defrost: ".Status_Recovery_Defrost_Heater",
            dirty: ".ALM_Recovery_Dirty"
        },
        unit: {
            roomTemperature: ".Status_Temperature_Room",
            roomHumidity: ".Status_Humidity_Room",
            globalAlarm: ".ALM_Global",
            seriousAlarm: ".ALM_Serious",
            fire: ".ALM_Fire_Smoke"
        },
        unitMode: {
            register: ".Status_Unit_State",
            states: [
                "Čakanje (Wait)",
                "Enota vklopljena",
                "Izklop zaradi alarma (OFFbyALR)",
                "Izklop zaradi omrežja (OFFbyNET)",
                "Izklop zaradi BMS (OFFbyBMS)",
                "Izklop po urniku (OFFdaFSC)",
                "Izklop zaradi digitalnega vhoda (OFFbyDIN)",
                "Izklop preko tipkovnice (OFFbyKEY)",
                "Ročni način",
                "-",
                "Avtomatsko – Comfort",
                "Avtomatsko – Pre-Cooling",
                "Avtomatsko – Economy",
                "Zaščita",
                "Zagon",
                "Zaustavitev",
                "Izklop zaradi protizmrzovalne zaščite",
                "Čiščenje / izpih",
                "Fireman Override",
                "Alarmni izklop"
            ]
        }
    },
    access5: {
        name: "Systemair Access 5",
        registers: {
            "int-damper": { position: ".Status_Intake_Damper" },
            "exh-damper": { position: ".Status_Exhaust_Damper" },
            "sup-fan": ACCESS_SUPPLY_FAN,
            "int-fan": ACCESS_SUPPLY_FAN,
            "ret-fan": ACCESS_EXTRACT_FAN,
            "exh-fan": ACCESS_EXTRACT_FAN,
            "sup-filter": ACCESS_SUPPLY_FILTER,
            "int-pre-filter": ACCESS_SUPPLY_FILTER,
            "ret-filter": { pressure: ".Status_Extract_Air_Filter_Pressure", dpSwitch: ".ALM_Filter_Guard_Extract_Air", alarm: ".ALM_Filter_Guard_Extract_Air" },
            "sup-temp-sensor": { temperature: ".Status_Supply_Air_Temperature", "setpoint:temperature": ".Status_Setpoint_Supply_Temperature", alarm: ".ALM_Deviation_Supply_Air_Temperature" },
            "int-temp-sensor": { temperature: ".Status_Outdoor_Temperature" },
            "exh-temp-sensor": { temperature: ".Status_Exhaust_Air_Temperature" },
            "ret-temp-sensor": { temperature: ".Status_Extract_Air_Temperature", "setpoint:temperature": ".CMD_Setpoint_Temperature_Extract_Air" },
            "sup-co2-sensor": { co2: ".Status_CO2_Extract_Air" },
            "ret-co2-sensor": { co2: ".Status_CO2_Extract_Air" },
            "sup-frost-thermostat": { temperature: ".Status_Freeze_Protection_Temperature", alarm: ".ALM_Freeze_Protection" },
            "sup-after-recovery-temp-sensor": { temperature: ".Status_Efficiency_Temperature" },
            "sup-preheat-hot-water-coils": ACCESS_HEATING,
            "sup-reheat-hot-water-coils": ACCESS_HEATING,
            "sup-preheat-electric-heater": ACCESS_ELECTRIC_HEATING,
            "sup-reheat-electric-heater": ACCESS_ELECTRIC_HEATING,
            "sup-cold-water-coils": { position: ".Status_Cooling_Sequence_C", alarm: ".ALM_Malfunction_Sequence_C", pump: ".Status_Cooling_Pump", pumpFault: ".ALM_Malfunction_Sequence_C" },
            "sup-pressure-sensor": { pressure: ".Status_Supply_Air_Pressure" },
            "ret-pressure-sensor": { pressure: ".Status_Extract_Air_Pressure" },
            "sup-flow-sensor": { flow: ".Status_Supply_Air_Flow" },
            "ret-flow-sensor": { flow: ".Status_Extract_Air_Flow" }
        },
        recuperation: {
            wheelSpeed: ".Status_Sequence_B_Recuperation",
            efficiency: ".Status_Exchanger_Efficiency",
            dirty: ".ALM_Rotary_Exchanger_Alarm"
        },
        unit: {
            roomTemperature: ".Status_Room_Temperature",
            globalAlarm: ".ALM_Sum_Alarm",
            seriousAlarm: ".ALM_Sum_Alarm_A",
            fire: ".ALM_Fire_Alarm"
        },
        unitArgs: {
            fire: { false_value: "0", true_value: "2" }
        },
        unitMode: {
            register: ".Status_Unit_Mode",
            states: ["Ustavljeno", "Zagon", "Nizka hitrost", "Normalna hitrost", "Visoka hitrost", "Podporno ogrevanje", "Podporno hlajenje", "CO₂ regulacija", "Prosto hlajenje", "Ohlajanje", "Požar", "Dim", "Recirkulacija", "Odmrzovanje"]
        }
    }
};

export function groupRegisters(controller, group){
    return CONTROLLERS[controller]?.[group] ?? {};
}

export function registersOf(controller, element){
    const entry = CONTROLLERS[controller]?.registers[element.template ?? element.key];
    return (typeof entry === "function" ? entry(element) : entry) ?? {};
}
