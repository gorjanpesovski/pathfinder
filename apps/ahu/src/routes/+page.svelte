<script>
    let recuperationUnitWidth = 100;
    let recuperationUnitHeight = 500;

    let displayWidht = 1920;
    let displayHeight = 1125;
    let displayTitle = "Klimatska Naprava";

    const elementPadding = 40;

    const yTop      = (displayHeight/2) - (recuperationUnitHeight/2) + 100;
    const yBottom   = (displayHeight/2) - (recuperationUnitHeight/2) + 400;
    const xLeft     = 60;
    const xCenter   = displayWidht/2;
    const xRight    = displayWidht - 60;

    const leftExtreme = xLeft + elementPadding;
    const centerExtreme = xCenter - elementPadding;
    const rightExtreme = xRight - elementPadding;

    let exhaustLineObjects;

    const RECUPERATION_MAP = {
        "plate-heat-exchanger": "SYSTEM.LIBRARY.CAREL.OBJECTDISPLAYS.4-Symbols.Heat%20recovery.rotary_exchanger",
        "rotary-heat-exchanger": "SYSTEM.LIBRARY.CAREL.OBJECTDISPLAYS.4-Symbols.Heat%20recovery.rotary_exchanger",
        "run-around-coils": "SYSTEM.LIBRARY.CAREL.OBJECTDISPLAYS.4-Symbols.Heat%20recovery.rotary_exchanger"
    };

    const OBJECT_DISPLAY_MAP = {
        damper: { path: "", width: 0 },
        filter: { path: "", width: 0 },
        fan: { path: "", width: 0 },
        temperatureSensor: { path: "", width: 0 },
        humiditySensor: { path: "", width: 0 },
        pressureSensor: { path: "", width: 0 },
        co2Sensor: { path: "", width: 0 }
    };

    let supplyLineElements = [
        { key: "sup-temp-sensor",       label: "Temperature Sensor",                checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.temperatureSensor.path, objectWidth: OBJECT_DISPLAY_MAP.temperatureSensor.width },
        { key: "sup-humidity-sensor",   label: "Humidity Sensor",                 checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.humiditySensor.path,    objectWidth: OBJECT_DISPLAY_MAP.humiditySensor.width },
        { key: "sup-pressure-sensor",   label: "Pressure Transmit / Switch",      checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.pressureSensor.path,    objectWidth: OBJECT_DISPLAY_MAP.pressureSensor.width },
        { key: "sup-co2-sensor",        label: "CO2 Air Quality Sensor",          checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.co2Sensor.path,         objectWidth: OBJECT_DISPLAY_MAP.co2Sensor.width },
        { key: "sup-airflow-sensor",    label: "Airflow Measuring Station",       checked: false, objectDisplayPath: "",                                       objectWidth: 0 },
        { key: "sup-frost-thermostat",  label: "Frost Protection Thermostat",     checked: false, objectDisplayPath: "",                                       objectWidth: 0 },
        { key: "sup-filter-dp-switch",  label: "Filter Differential Pressure Switch", checked: false, objectDisplayPath: "",                                   objectWidth: 0 },
        { key: "sup-smoke-detector",    label: "Duct Smoke Detector",             checked: false, objectDisplayPath: "",                                       objectWidth: 0 }
    ];

    let intakeLineElements = [
        { key: "int-damper",          label: "Outdoor Air Damper",                checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.damper.path,            objectWidth: OBJECT_DISPLAY_MAP.damper.width },
        { key: "int-pre-filter",      label: "Intake Weather Louver / Pre-Filter",checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.filter.path,            objectWidth: OBJECT_DISPLAY_MAP.filter.width },
        { key: "int-temp-sensor",     label: "Outdoor Temperature Sensor",       checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.temperatureSensor.path, objectWidth: OBJECT_DISPLAY_MAP.temperatureSensor.width },
        { key: "int-humidity-sensor", label: "Outdoor Humidity Sensor",          checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.humiditySensor.path,    objectWidth: OBJECT_DISPLAY_MAP.humiditySensor.width },
        { key: "int-airflow-sensor",  label: "Intake Airflow Measuring Station", checked: false, objectDisplayPath: "",                                       objectWidth: 0 }
    ];

    let exhaustLineElements = [
        { key: "exh-damper",          label: "Exhaust Air Damper",                checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.damper.path,            objectWidth: OBJECT_DISPLAY_MAP.damper.width },
        { key: "exh-fan",             label: "Exhaust Fan",                       checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.fan.path,               objectWidth: OBJECT_DISPLAY_MAP.fan.width },
        { key: "exh-silencer",        label: "Exhaust Silencer",                  checked: false, objectDisplayPath: "",                                       objectWidth: 0 },
        { key: "exh-temp-sensor",     label: "Exhaust Temperature Sensor",        checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.temperatureSensor.path, objectWidth: OBJECT_DISPLAY_MAP.temperatureSensor.width },
        { key: "exh-pressure-sensor", label: "Exhaust Pressure Transmit / Switch", checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.pressureSensor.path,    objectWidth: OBJECT_DISPLAY_MAP.pressureSensor.width }
    ];

    let returnLineElements = [
        { key: "ret-damper",          label: "Return Air / Recirculation Damper", checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.damper.path,            objectWidth: OBJECT_DISPLAY_MAP.damper.width },
        { key: "ret-filter",          label: "Return Air Filter",                 checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.filter.path,            objectWidth: OBJECT_DISPLAY_MAP.filter.width },
        { key: "ret-fan",             label: "Return Fan",                        checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.fan.path,               objectWidth: OBJECT_DISPLAY_MAP.fan.width },
        { key: "ret-temp-sensor",     label: "Return Temperature Sensor",         checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.temperatureSensor.path, objectWidth: OBJECT_DISPLAY_MAP.temperatureSensor.width },
        { key: "ret-humidity-sensor", label: "Return Humidity Sensor",            checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.humiditySensor.path,    objectWidth: OBJECT_DISPLAY_MAP.humiditySensor.width },
        { key: "ret-co2-sensor",      label: "Return CO2 / VOC Sensor",           checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.co2Sensor.path,         objectWidth: OBJECT_DISPLAY_MAP.co2Sensor.width },
        { key: "ret-filter-dp-switch",label: "Return Filter DP Switch",           checked: false, objectDisplayPath: "",                                       objectWidth: 0 },
        { key: "ret-smoke-detector",  label: "Return Duct Smoke Detector",        checked: false, objectDisplayPath: "",                                       objectWidth: 0 }
    ];

    let selectedRecuperation;

    function calculateElementPosition(array, distance, centerY){
        const svgString = "";
        let checkedItemMap = [];
        let elementCount = 0;

        for(let i = 0; i < array.length; i++){
            if(array[i].checked){
                elementCount += 1;
            }
        }

        console.log(elementCount);
    }

    async function handleConfiguration() {
        const boilerPlate =            
            `<?xml version='1.0' encoding='UTF-8' standalone='no'?>
            <svg height="${displayHeight}" version="1.2" width="${displayWidht}" xmlns="http://www.w3.org/2000/svg" xmlns:atv="http://webmi.atvise.com/2007/svgext" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:ns1="http://sozi.baierouge.fr" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:svg="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <defs/>
            <metadata>
            <atv:gridconfig enabled="true" gridstyle="lines" height="20" width="20"/>
            <atv:snapconfig enabled="true" height="10" width="10"/>
            </metadata>
            <svg atv:refpx="1865" atv:refpy="65.335" height="121" id="settings_button" transform="matrix(0.6667,0,0,0.6667,0,0)" width="121" x="2736.86" xlink:href="SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.4.%20Gumbi.Round_Buttons.Button" y="37.498">
            <atv:argument name="animation_type" value="Background"/>
            <atv:argument name="hover_color" value="#2A7A53"/>
            </svg>
            <text atv:refpx="960" atv:refpy="66" fill="#1E293B" font-family="Roboto" font-size="46" font-weight="bold" id="title" x="765.5" y="82">${displayTitle}</text>
            <svg atv:refpx="55.0001" atv:refpy="65.3353" height="121" id="back_button" transform="matrix(0.6667,0,0,0.6667,0,0)" width="121" x="21.996" xlink:href="SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.4.%20Gumbi.Round_Buttons.Button" y="37.498">
            <atv:argument name="animation_type" value="Background"/>
            <atv:argument name="hover_color" value="#A32A3A"/>
            <atv:argument name="icon_type" value="Back"/>
            </svg>
            <script atv:desc="" atv:name="" type="text/ecmascript"/>
            <svg atv:refpx="1765" atv:refpy="65.6677" height="121" id="graph_button" transform="matrix(0.6612,0,0,0.6612,0,0)" width="121" x="2608.893" xlink:href="SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.4.%20Gumbi.Round_Buttons.Button" y="38.816">
            <atv:argument name="hover_color" value="#2A7A53"/>
            <atv:argument name="animation_type" value="Background"/>
            <atv:argument name="icon_type" value="Graph"/>
            </svg>
            <polyline atv:refpx="700.5" atv:refpy="700.5" fill="#EF4444" fill-opacity="0" id="exhaust_line" points="${xLeft},${yTop} ${xCenter},${yTop}" stroke="#EF4444" stroke-width="10"/>
            ${exhaustLineObjects}
            <polyline atv:refpx="500" atv:refpy="700.5" fill="#22C55E" fill-opacity="0" id="intake_line" points="${xLeft},${yBottom} ${xCenter},${yBottom}" stroke="#22C55E" stroke-width="10"/>
            <polyline atv:refpx="1420" atv:refpy="400.5" fill="#F59E0B" fill-opacity="0" id="return_line" points="${xRight},${yTop} ${xCenter},${yTop}" stroke="#F59E0B" stroke-width="10"/>
            <polyline atv:refpx="1420" atv:refpy="700.5" fill="#3B82F6" fill-opacity="0" id="supply_line" points="${xRight},${yBottom} ${xCenter},${yBottom}" stroke="#3B82F6" stroke-width="10"/>
            <svg atv:refpx="${(displayWidht/2) - (recuperationUnitWidth/2)}" atv:refpy="${(displayHeight/2) - (recuperationUnitHeight/2)}" height="500" id="recuperation_unit" width="86.97" x="916.515" xlink:href="${RECUPERATION_MAP[selectedRecuperation]}" y="312.5"/>
            <polyline atv:refpx="50" atv:refpy="700" fill="#22C55E" fill-opacity="1" id="intake_line_arrow_2" points="40,690 40,710 60,700 40,690" stroke="#22C55E" stroke-width="0"/>
            <polyline atv:refpx="30" atv:refpy="700" fill="#22C55E" fill-opacity="1" id="intake_line_arrow_1" points="20,690 20,710 40,700 20,690" stroke="#22C55E" stroke-width="0"/>
            <polyline atv:refpx="30" atv:refpy="400" fill="#EF4444" fill-opacity="1" id="exhaust_line_arrow_1" points="40,410 40,390 20,400 40,410" stroke="#EF4444" stroke-width="0"/>
            <polyline atv:refpx="50" atv:refpy="400" fill="#EF4444" fill-opacity="1" id="exhaust_line_arrow_2" points="60,410 60,390 40,400 60,410" stroke="#EF4444" stroke-width="0"/>
            <polyline atv:refpx="1890" atv:refpy="700" fill="#3B82F6" fill-opacity="1" id="supply_line_arrow_1" points="1880,690 1880,710 1900,700 1880,690" stroke="#3B82F6" stroke-width="0"/>
            <polyline atv:refpx="1870" atv:refpy="700" fill="#3B82F6" fill-opacity="1" id="supply_line_arrow_2" points="1860,690 1860,710 1880,700 1860,690" stroke="#3B82F6" stroke-width="0"/>
            <polyline atv:refpx="1870" atv:refpy="400" fill="#F59E0B" fill-opacity="1" id="return_line_arrow_2" points="1880,410 1880,390 1860,400 1880,410" stroke="#F59E0B" stroke-width="0"/>
            <polyline atv:refpx="1890" atv:refpy="400" fill="#F59E0B" fill-opacity="1" id="return_line_arrow_1" points="1900,410 1900,390 1880,400 1900,410" stroke="#F59E0B" stroke-width="0"/>
            </svg>`;

        try {
            await navigator.clipboard.writeText(boilerPlate);
            console.log("Copied to clipboard");
        } catch(err) {
            console.log("Failed to copy:", err);
        }
    }
</script>

<style>
  :global(body) {
    font-family: Arial, sans-serif;
    margin: 20px;
    background-color: #f8fafc;
    color: #1e293b;
  }

  h1 {
    font-size: 24px;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 18px;
    margin-bottom: 12px;
  }

  .app-layout {
    display: flex;
    gap: 40px;
    align-items: flex-start;
  }

  .selection-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 360px;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-weight: bold;
    font-size: 14px;
  }

  .input-group input,
  .input-group select {
    padding: 8px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    font-size: 14px;
  }

  fieldset {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #ffffff;
  }

  legend {
    font-weight: bold;
    font-size: 14px;
    padding: 0 4px;
  }

  label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    cursor: pointer;
  }

  button.configure {
    padding: 10px 16px;
    background-color: #2563eb;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    margin-top: 8px;
  }

  button.configure:hover {
    background-color: #1d4ed8;
  }

  .viewer-section {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 20px;
  }

  svg {
    border: 1px solid #e2e8f0;
    background-color: #ffffff;
    display: block;
  }
</style>

<h1>Auto AHU</h1>
<div class="app-layout">
  <div class="selection-section">
    <label class="input-group" for="width">Screen Width: 
      <input id="width" type="text" bind:value={recuperationUnitWidth}>
    </label>
    <label class="input-group" for="height">Screen Height: 
      <input id="height" type="text" bind:value={recuperationUnitHeight}>
    </label>
    <label class="input-group" for="select-recuperations-unit">Select Recuperation Unit 
      <select id="select-recuperations-unit" name="select-recuperations-unit" bind:value={selectedRecuperation}>
        <option value="plate-heat-exchanger">Plate Heat Exchanger</option>
        <option value="rotary-heat-exchanger">Rotary Heat Exchanger</option>
        <option value="run-around-coils">Run Around Coils</option>
      </select>
    </label>
    <fieldset>
      <legend>Select Supply Line Sensors</legend>
      {#each supplyLineElements as element(element.key)}
          <label for="{element.key}">
              <input type="checkbox" id={element.key} bind:checked={element.checked} onchange={() => calculateElementPosition(supplyLineElements, rightExtreme - centerExtreme, yBottom)}> {element.label}
          </label>
      {/each}
    </fieldset>
    <fieldset>
      <legend>Select Intake Line Elements</legend>
      {#each intakeLineElements as element(element.key)}
          <label for="{element.key}">
              <input type="checkbox" id={element.key} bind:checked={element.checked} onchange={() => calculateElementPosition(intakeLineElements, centerExtreme - leftExtreme, yBottom)}> {element.label}
          </label>
      {/each}
    </fieldset>
    <fieldset>
      <legend>Select Exhaust Line Elements</legend>
      {#each exhaustLineElements as element(element.key)}
          <label for="{element.key}">
              <input type="checkbox" id={element.key} bind:checked={element.checked} onchange={() => calculateElementPosition(exhaustLineElements, rightExtreme - centerExtreme, yTop)}> {element.label}
          </label>
      {/each}
    </fieldset>
    <fieldset>
      <legend>Select Return Line Elements</legend>
      {#each returnLineElements as element(element.key)}
          <label for="{element.key}">
              <input type="checkbox" id={element.key} bind:checked={element.checked} onchange={() => calculateElementPosition(returnLineElements, centerExtreme - leftExtreme, yTop)}> {element.label}
          </label>
      {/each}
    </fieldset>
    <button class="configure" type="button" onclick={handleConfiguration}>Configure Selection</button>
  </div>
  <div class="viewer-section">
    <h2>Live Preview</h2>
    <svg viewBox="0 0 {displayWidht} {displayHeight}" width="500" height="{500 * (displayHeight/displayWidht)}">
      <text x={displayWidht/2} y="60" font-family="Roboto" font-size="46" font-weight="bold" fill="#1E293B" text-anchor="middle">{displayTitle}</text>
      <polyline points="{xLeft},{yTop} {xCenter},{yTop}" fill="none" stroke="#EF4444" stroke-width="10"/>
      <polyline points="{xLeft},{yBottom} {xCenter},{yBottom}" fill="none" stroke="#22C55E" stroke-width="10"/>
      <polyline points="{xRight},{yTop} {xCenter},{yTop}" fill="none" stroke="#F59E0B" stroke-width="10"/>
      <polyline points="{xRight},{yBottom} {xCenter},{yBottom}" fill="none" stroke="#3B82F6" stroke-width="10"/>
      <rect x={(displayWidht/2) - (recuperationUnitWidth/2)} y={(displayHeight/2) - (recuperationUnitHeight/2)} width={recuperationUnitWidth} height={recuperationUnitHeight} fill="#CBD5E1" stroke="#1E293B" stroke-width="2"/>
      <text x={displayWidht/2} y={displayHeight/2} font-family="Roboto" font-size="20" fill="#1E293B" text-anchor="middle">Recuperation Unit</text>
    </svg>
  </div>
</div>