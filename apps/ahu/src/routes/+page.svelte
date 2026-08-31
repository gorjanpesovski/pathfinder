<script>
    let recuperationUnitWidth = $state(150);
    let recuperationUnitHeight = $state(500);

    let displayWidth = $state(1920);
    let displayHeight = $state(1080);
    let displayTitle = $state("Klimatska Naprava");
    let nodePathPrefix = $state("AGENT.OBJECTS.Klimat");
    let selectModbusTable = $state("carel");

    const elementPadding = 20;

    const yTop      = $derived((displayHeight / 2) - (recuperationUnitHeight / 2) + 100);
    const yBottom   = $derived((displayHeight / 2) - (recuperationUnitHeight / 2) + 400);
    const xLeft     = 60;
    const xCenter   = $derived(displayWidth / 2);
    const xRight    = $derived(displayWidth - 60);
    let scaleWidth  = 1;

    const leftExtreme         = $derived(xLeft + elementPadding);
    const centerExtremeLeft   = $derived(xCenter - (recuperationUnitWidth/2) - elementPadding);
    const centerExtremeRight  = $derived(xCenter + (recuperationUnitWidth/2) + elementPadding);
    const rightExtreme        = $derived(xRight - elementPadding);

    const RECUPERATION_MAP = {
        "plate-heat-exchanger": "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.Plate_Heat_Exchnager",
        "rotary-heat-exchanger": "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.Rotary_Heat_Exchnager",
        "run-around-coils": "SYSTEM.LIBRARY.CAREL.OBJECTDISPLAYS.4-Symbols.Heat%20recovery.rotary_exchanger"
    };

    const MODBUS_MAP = {
    "carel": {
        "sup-damper": (el) => `.SupDamper_${el.signalType === "continous" ? "AO" : "DO"}`,
        "int-damper": (el) => `.SupDamper_${el.signalType === "continous" ? "AO" : "DO"}`,
        "exh-damper": (el) => `.SupDamper_${el.signalType === "continous" ? "AO" : "DO"}`,
        "ret-damper": (el) => `.SupDamper_${el.signalType === "continous" ? "AO" : "DO"}`,  
        "sup-fan": ".Supply_Fan",
        "exh-fan": ".Exhaust_Fan"
    }
};

    const OBJECT_DISPLAY_MAP = $derived({
        damper: { path: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.Damper", width: 120, height: 300, offset: 11 },
        filter: { path: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.Filter", width: 145, height: 225, offset: -11 },
        fan:    { path: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.Fan", width: 135, height: 190, offset: 11 },
        temperatureSensor: { path: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.Temperature_Sensor", width: 120, height: 90, offset: 29 },
        humiditySensor:    { path: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.Humidity_Sensor", width: 120, height: 90, offset: 29 },
        pressureSensor:    { path: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.Pressure_Sensor", width: 120, height: 90, offset: 29 },
        co2Sensor:         { path: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.CO2_Sensor", width: 120, height: 90, offset: 29 }
    });

    const ELEMENT_OPTIONS = {
      damper: [ 
        {key: "signalType", label: "Signal Type", type: "select"}
      ],
      filter: [
        {key: "dpSwitch", label: "DP Switch", type: "checkbox"}
      ],
      fan: [
        {key: "dpSwitch", label: "DP Switch", type: "checkbox"}
      ]
    }

    let supplyLineElements = $state([
        { key: "sup-damper",          label: "Supply Air Damper",                checked: false, type: "damper", signalType: "continious" },
        { key: "sup-filter",          label: "Supply Air Filter",                checked: false, type: "filter", dpSwitch: false },
        { key: "sup-fan",             label: "Supply Fan",                       checked: false, type: "fan", dpSwitch: false},
        { key: "sup-temp-sensor",     label: "Temperature Sensor",               checked: false, type: "temperatureSensor" },
        { key: "sup-humidity-sensor", label: "Humidity Sensor",                  checked: false, type: "humiditySensor" },
        { key: "sup-pressure-sensor", label: "Pressure Transmit / Switch",       checked: false, type: "pressureSensor" },
        { key: "sup-co2-sensor",      label: "CO2 Air Quality Sensor",           checked: false, type: "co2Sensor" }
    ]);

    let intakeLineElements = $state([
        { key: "int-damper",          label: "Outdoor Air Damper",                checked: false, type: "damper", signalType: "continious" },
        { key: "int-pre-filter",      label: "Intake Weather Louver / Pre-Filter",checked: false, type: "filter", dpSwitch: false },
        { key: "int-fan",             label: "Intake Fan",                        checked: false, type: "fan", dpSwitch: false },
        { key: "int-temp-sensor",     label: "Outdoor Temperature Sensor",        checked: false, type: "temperatureSensor" },
        { key: "int-humidity-sensor", label: "Outdoor Humidity Sensor",           checked: false, type: "humiditySensor" },
        { key: "int-pressure-sensor", label: "Intake Pressure Transmit / Switch", checked: false, type: "pressureSensor" },
        { key: "int-co2-sensor",      label: "Intake CO2 Sensor",                 checked: false, type: "co2Sensor" }
    ]);

    let exhaustLineElements = $state([
        { key: "exh-damper",          label: "Exhaust Air Damper",                checked: false, type: "damper", signalType: "continious" },
        { key: "exh-filter",          label: "Exhaust Filter",                    checked: false, type: "filter", dpSwitch: false },
        { key: "exh-fan",             label: "Exhaust Fan",                       checked: false, type: "fan", dpSwitch: false },
        { key: "exh-temp-sensor",     label: "Exhaust Temperature Sensor",        checked: false, type: "temperatureSensor" },
        { key: "exh-humidity-sensor", label: "Exhaust Humidity Sensor",           checked: false, type: "humiditySensor" },
        { key: "exh-pressure-sensor", label: "Exhaust Pressure Transmit / Switch",checked: false, type: "pressureSensor" },
        { key: "exh-co2-sensor",      label: "Exhaust CO2 Sensor",                checked: false, type: "co2Sensor" }
    ]);

    let returnLineElements = $state([
        { key: "ret-damper",          label: "Return Air / Recirculation Damper", checked: false, type: "damper", signalType: "continious" },
        { key: "ret-filter",          label: "Return Air Filter",                 checked: false, type: "filter", dpSwitch: false },
        { key: "ret-fan",             label: "Return Fan",                        checked: false, type: "fan", dpSwitch: false },
        { key: "ret-temp-sensor",     label: "Return Temperature Sensor",         checked: false, type: "temperatureSensor" },
        { key: "ret-humidity-sensor", label: "Return Humidity Sensor",            checked: false, type: "humiditySensor" },
        { key: "ret-pressure-sensor", label: "Return Pressure Transmit / Switch", checked: false, type: "pressureSensor" },
        { key: "ret-co2-sensor",      label: "Return CO2 / VOC Sensor",           checked: false, type: "co2Sensor" }
    ]);

    let selectedRecuperation = $state("plate-heat-exchanger");

    let dragSourceArray = $state(null);
    let dragSourceIndex = $state(null);
    let dragOverArray = $state(null);
    let dragOverIndex = $state(null);
    let copySuccess = $state(false);

    function handleDragStart(array, index){
        dragSourceArray = array;
        dragSourceIndex = index;
    }

    function handleDragOver(event, array, index){
        event.preventDefault();
        dragOverArray = array;
        dragOverIndex = index;
    }

    function handleDragEnd(){
        dragSourceArray = null;
        dragSourceIndex = null;
        dragOverArray = null;
        dragOverIndex = null;
    }

    function handleDrop(array, index){
        if(dragSourceArray === array && dragSourceIndex !== null && dragSourceIndex !== index){
            const updated = [...array];
            const [movedItem] = updated.splice(dragSourceIndex, 1);
            updated.splice(index, 0, movedItem);
            
            if (array === supplyLineElements) supplyLineElements = updated;
            else if (array === intakeLineElements) intakeLineElements = updated;
            else if (array === exhaustLineElements) exhaustLineElements = updated;
            else if (array === returnLineElements) returnLineElements = updated;
        }
        handleDragEnd();
    }

    function calculateLineLayout(array, startingPosition, distance, centerY){
        const checkedItems = array.filter(item => item.checked && item.type && OBJECT_DISPLAY_MAP[item.type]);
        let drawItemMap = [];
        let shapes = [];
        let elementCount = checkedItems.length;

        if (elementCount === 0) {
            return { objects: "", shapes: [] };
        }

        const totalElementsWidth = checkedItems.reduce((sum, item) => {
            return sum + OBJECT_DISPLAY_MAP[item.type].width;
        }, 0);

        const gap = elementCount > 1 
            ? (distance - totalElementsWidth) / (elementCount - 1) 
            : 0;

        let currentX = startingPosition;

        for (let i = 0; i < elementCount; i++){
            const item = checkedItems[i];
            const config = OBJECT_DISPLAY_MAP[item.type];
            
            let positionX = currentX;
            let positionY = centerY - (config.height / 2) + config.offset;
            let elementCenterPosition = positionX + (config.width / 2);

            const mapEntry = MODBUS_MAP[selectModbusTable]?.[item.key];
            const suffix = typeof mapEntry === "function" ? mapEntry(item) : (mapEntry || "");
            const appendix = suffix ? `<atv:argument name="base" value="${nodePathPrefix}${suffix}"/>` : "";

            let svgString = `<svg atv:refpx="${elementCenterPosition}" atv:refpy="${centerY}" height="${config.height}" id="${item.key}" width="${config.width}" x="${positionX}" y="${positionY}" xlink:href="${config.path}">${appendix}</svg>`;
            drawItemMap.push(svgString);

            shapes.push({ key: item.key, x: positionX, y: centerY - (config.height / 2), width: config.width, height: config.height });

            currentX += config.width + gap;
        }

        return { objects: drawItemMap.join("\n            "), shapes };
    }

    const exhaustLineLayout = $derived(calculateLineLayout(exhaustLineElements, leftExtreme, centerExtremeLeft - leftExtreme, yTop));
    const intakeLineLayout = $derived(calculateLineLayout(intakeLineElements, leftExtreme, centerExtremeLeft - leftExtreme, yBottom));
    const returnLineLayout = $derived(calculateLineLayout(returnLineElements, centerExtremeRight, rightExtreme - centerExtremeRight, yTop));
    const supplyLineLayout = $derived(calculateLineLayout(supplyLineElements, centerExtremeRight, rightExtreme - centerExtremeRight, yBottom));

    async function handleConfiguration() {
        const boilerPlate =            
            `<?xml version='1.0' encoding='UTF-8' standalone='no'?>
            <svg height="${displayHeight}" version="1.2" width="${displayWidth}" xmlns="http://www.w3.org/2000/svg" xmlns:atv="http://webmi.atvise.com/2007/svgext" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:ns1="http://sozi.baierouge.fr" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:svg="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
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
            ${exhaustLineLayout.objects}
            <polyline atv:refpx="500" atv:refpy="700.5" fill="#22C55E" fill-opacity="0" id="intake_line" points="${xLeft},${yBottom} ${xCenter},${yBottom}" stroke="#22C55E" stroke-width="10"/>
            ${intakeLineLayout.objects}
            <polyline atv:refpx="1420" atv:refpy="400.5" fill="#F59E0B" fill-opacity="0" id="return_line" points="${xRight},${yTop} ${xCenter},${yTop}" stroke="#F59E0B" stroke-width="10"/>
            ${returnLineLayout.objects}
            <polyline atv:refpx="1420" atv:refpy="700.5" fill="#3B82F6" fill-opacity="0" id="supply_line" points="${xRight},${yBottom} ${xCenter},${yBottom}" stroke="#3B82F6" stroke-width="10"/>
            ${supplyLineLayout.objects}
            <svg atv:refpx="${(displayWidth/2) - (recuperationUnitWidth/2)}" atv:refpy="${(displayHeight/2) - (recuperationUnitHeight/2)}" height="${recuperationUnitHeight}" id="recuperation_unit" width="${displayWidth}" x="${(displayWidth/2) - (recuperationUnitWidth/2)}" xlink:href="${RECUPERATION_MAP[selectedRecuperation] || ''}" y="${(displayHeight/2) - (recuperationUnitHeight/2)}"/>
            <svg atv:refpx="40" atv:refpy="390" height="20" id="exhaust_arrows" width="40" x="${xLeft - 40}" xlink:href="SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.Arrows" y="${yTop - 10}"><atv:argument name="color" value="#EF4444"/></svg>
            <svg atv:refpx="40" atv:refpy="390" height="20" id="intake_arrows" width="40" x="${xLeft - 40}" xlink:href="SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.Arrows" y="${yBottom - 10}"><atv:argument name="color" value="#22C55E"/></svg>
            <svg atv:refpx="40" atv:refpy="390" height="20" id="return_arrows" width="40" x="${xRight}" xlink:href="SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.Arrows" y="${yTop - 10}"><atv:argument name="color" value="#F59E0B"/></svg>
            <svg atv:refpx="40" atv:refpy="390" height="20" id="supply_arrows" width="40" x="${xRight}" xlink:href="SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.Arrows" y="${yBottom - 10}"><atv:argument name="color" value="#3B82F6"/></svg>
            </svg>`;

        try {
            await navigator.clipboard.writeText(boilerPlate);
            console.log("Copied to clipboard");
            copySuccess = true;
            setTimeout(() => { copySuccess = false; }, 2000);
        } catch(err) {
            console.log("Failed to copy:", err);
        }
    }
</script>

<style>
  :global(body) {
    height: 100dvh;
    width: 100vw;
    font-family: 'Segoe UI', Arial, sans-serif;
    margin: 0;
    padding: 24px;
    background-color: #f1f5f9;
    color: #0f172a;
    box-sizing: border-box;
    overflow: hidden;
  }

  h1 {
    font-size: 26px;
    font-weight: 700;
    margin: 0 0 20px 0;
    color: #0f172a;
  }

  h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 16px 0;
    color: #334155;
  }

  .app-layout {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 24px;
    align-items: stretch;
    max-width: 1800px;
    height: calc(100dvh - 110px);
    margin: 0 auto;
  }

  .selection-section {
    display: flex;
    height: 100%;
    flex-direction: column;
    gap: 16px;
    background: #ffffff;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    max-height: 100%;
    overflow-y: auto;
    box-sizing: border-box;
    min-height: 0;
  }

  #select-display-dimensions{
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
  }

  #select-display-dimensions .input-group {
    flex: 1;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-weight: 600;
    font-size: 13px;
    color: #475569;
  }

  .input-group input,
  .input-group select {
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 14px;
    background-color: #f8fafc;
    color: #0f172a;
  }

  .selection-section input[type="text"],
  .selection-section select {
    width: 100%;
    height: 38px;
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 14px;
    background-color: #FFFFFF;
    color: #0f172a;
    box-sizing: border-box;
    text-align: left;
  }

  fieldset {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #f8fafc;
    margin: 0;
  }

  #select-supply-line-elements {
    background: #eff6ff;
  }

  #select-intake-line-elements {
    background: #f0fdf4;
  }

  #select-exhaust-line-elements {
    background: #fef2f2;
  }

  #select-return-line-elements {
    background: #fffbeb;
  }

  #select-modbus{
    gap:12px;
  }

  legend {
    font-weight: 600;
    font-size: 13px;
    color: #334155;
    padding: 0 6px;
  }

  label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #334155;
    cursor: pointer;
  }

  label.sub-element {
    padding-left: 28px;
    color: #94a3b8;
    font-size: 12px;
  }

  label.sub-element select {
    padding: 4px 8px;
    height: 28px;
    font-size: 12px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    background-color: #f8fafc;
    color: #94a3b8;
  }

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #2563eb;
    cursor: pointer;
  }

  button.configure {
    padding: 12px 16px;
    background-color: #2563eb;
    color: #ffffff;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    margin-top: 8px;
    transition: background-color 0.15s ease;
  }

  button.configure:hover {
    background-color: #1d4ed8;
  }

  button.configure.copied {
    background-color: #16a34a;
  }

  .viewer-section {
    height: 100%;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    min-height: 0;
  }

  .svg-container {
    width: 100%;
    max-width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    overflow: hidden;
  }

  svg.preview-svg {
    width: 100%;
    height: auto;
    display: block;
  }

  label.dragging {
    opacity: 0.4;
  }

  label.drag-over-top {
    border-top: 3px solid #2563eb;
  }

  label.drag-over-bottom {
    border-bottom: 3px solid #2563eb;
  }
</style>

<title>AUTO AHU</title>
<h1>Auto AHU</h1>
<div class="app-layout">
  <div class="selection-section">
  <fieldset id="select-title">
      <legend>Display Title</legend>
      <input id="title" type="text" bind:value={displayTitle}>
    </fieldset>
  <fieldset id="select-display-dimensions">
      <legend>Selectt Display Dimensions</legend>
      <label class="input-group" for="width"> 
        <input id="width" type="text" bind:value={displayWidth}>
      </label>
      x
      <label class="input-group" for="height"> 
        <input id="height" type="text" bind:value={displayHeight}>
      </label>
    </fieldset>
    <fieldset id="select-recuperations-unit">
      <legend>Select Recuperation Unit</legend>
      <label class="input-group" for="select-recuperations-unit">
        <select id="select-recuperations-unit" name="select-recuperations-unit" bind:value={selectedRecuperation}>
          <option value="plate-heat-exchanger">Plate Heat Exchanger</option>
          <option value="rotary-heat-exchanger">Rotary Heat Exchanger</option>
          <option value="run-around-coils">Run Around Coils</option>
        </select>
      </label>
    </fieldset>
    <fieldset id="select-modbus">
      <legend>Select Modbus Table and Node Path Prefix</legend>
      <label class="input-group" for="modbus-table-selection">
        <select id="modbus-table-selection" name="modbus-table-selection" bind:value={selectModbusTable}>
          <option value="empty">Empty</option>
          <option value="carel">Carel</option>
          
        </select>
        <input id="node-path-prefix" type="text" bind:value={nodePathPrefix}>
      </label>
    </fieldset>
    <fieldset id="select-exhaust-line-elements">
      <legend>Select Exhaust Line Elements</legend>
      {#each exhaustLineElements as element, index (element.key)}
          <label for="{element.key}"
              class:dragging={dragSourceArray === exhaustLineElements && dragSourceIndex === index}
              class:drag-over-top={dragOverArray === exhaustLineElements && dragOverIndex === index && dragSourceIndex !== null && dragSourceIndex > index}
              class:drag-over-bottom={dragOverArray === exhaustLineElements && dragOverIndex === index && dragSourceIndex !== null && dragSourceIndex < index}
              class:sub-element={element.sub}
              draggable="true"
              ondragstart={() => handleDragStart(exhaustLineElements, index)}
              ondragover={(event) => handleDragOver(event, exhaustLineElements, index)}
              ondrop={() => handleDrop(exhaustLineElements, index)}
              ondragend={handleDragEnd}>
              <input type="checkbox" id={element.key} bind:checked={element.checked}> {element.label}
          </label>
          {#if element.checked}
              {#each ELEMENT_OPTIONS[element.type] ?? [] as option (option.key)}
                  <label class="sub-element" for="{element.key}-{option.key}">
                      {#if option.type === "checkbox"}
                          <input type="checkbox" id="{element.key}-{option.key}" bind:checked={element[option.key]}>
                      {:else}
                          <select id="{element.key}-{option.key}" bind:value={element[option.key]}>
                              <option value="continious">Continuous</option>
                              <option value="discrete">Discrete</option>
                          </select>
                      {/if}
                      {option.label}
                  </label>
              {/each}
          {/if}
      {/each}
    </fieldset>

    <fieldset id="select-intake-line-elements">
      <legend>Select Intake Line Elements</legend>
      {#each intakeLineElements as element, index (element.key)}
          <label for="{element.key}"
              class:dragging={dragSourceArray === intakeLineElements && dragSourceIndex === index}
              class:drag-over-top={dragOverArray === intakeLineElements && dragOverIndex === index && dragSourceIndex !== null && dragSourceIndex > index}
              class:drag-over-bottom={dragOverArray === intakeLineElements && dragOverIndex === index && dragSourceIndex !== null && dragSourceIndex < index}
              class:sub-element={element.sub}
              draggable="true"
              ondragstart={() => handleDragStart(intakeLineElements, index)}
              ondragover={(event) => handleDragOver(event, intakeLineElements, index)}
              ondrop={() => handleDrop(intakeLineElements, index)}
              ondragend={handleDragEnd}>
              <input type="checkbox" id={element.key} bind:checked={element.checked}> {element.label}
          </label>
          {#if element.checked}
              {#each ELEMENT_OPTIONS[element.type] ?? [] as option (option.key)}
                  <label class="sub-element" for="{element.key}-{option.key}">
                      {#if option.type === "checkbox"}
                          <input type="checkbox" id="{element.key}-{option.key}" bind:checked={element[option.key]}>
                      {:else}
                          <select id="{element.key}-{option.key}" bind:value={element[option.key]}>
                              <option value="continious">Continuous</option>
                              <option value="discrete">Discrete</option>
                          </select>
                      {/if}
                      {option.label}
                  </label>
              {/each}
          {/if}
      {/each}
    </fieldset>
    
    <fieldset id="select-return-line-elements">
      <legend>Select Return Line Elements</legend>
      {#each returnLineElements as element, index (element.key)}
          <label for="{element.key}"
              class:dragging={dragSourceArray === returnLineElements && dragSourceIndex === index}
              class:drag-over-top={dragOverArray === returnLineElements && dragOverIndex === index && dragSourceIndex !== null && dragSourceIndex > index}
              class:drag-over-bottom={dragOverArray === returnLineElements && dragOverIndex === index && dragSourceIndex !== null && dragSourceIndex < index}
              class:sub-element={element.sub}
              draggable="true"
              ondragstart={() => handleDragStart(returnLineElements, index)}
              ondragover={(event) => handleDragOver(event, returnLineElements, index)}
              ondrop={() => handleDrop(returnLineElements, index)}
              ondragend={handleDragEnd}>
              <input type="checkbox" id={element.key} bind:checked={element.checked}> {element.label}
          </label>
          {#if element.checked}
              {#each ELEMENT_OPTIONS[element.type] ?? [] as option (option.key)}
                  <label class="sub-element" for="{element.key}-{option.key}">
                      {#if option.type === "checkbox"}
                          <input type="checkbox" id="{element.key}-{option.key}" bind:checked={element[option.key]}>
                      {:else}
                          <select id="{element.key}-{option.key}" bind:value={element[option.key]}>
                              <option value="continious">Continuous</option>
                              <option value="discrete">Discrete</option>
                          </select>
                      {/if}
                      {option.label}
                  </label>
              {/each}
          {/if}
      {/each}
    </fieldset>

    <fieldset id="select-supply-line-elements">
      <legend>Select Supply Line Elements</legend>
      {#each supplyLineElements as element, index (element.key)}
          <label for="{element.key}"
              class:dragging={dragSourceArray === supplyLineElements && dragSourceIndex === index}
              class:drag-over-top={dragOverArray === supplyLineElements && dragOverIndex === index && dragSourceIndex !== null && dragSourceIndex > index}
              class:drag-over-bottom={dragOverArray === supplyLineElements && dragOverIndex === index && dragSourceIndex !== null && dragSourceIndex < index}
              class:sub-element={element.sub}
              draggable="true"
              ondragstart={() => handleDragStart(supplyLineElements, index)}
              ondragover={(event) => handleDragOver(event, supplyLineElements, index)}
              ondrop={() => handleDrop(supplyLineElements, index)}
              ondragend={handleDragEnd}>
              <input type="checkbox" id={element.key} bind:checked={element.checked}> {element.label}
            </label>
          {#if element.checked}
              {#each ELEMENT_OPTIONS[element.type] ?? [] as option (option.key)}
                  <label class="sub-element" for="{element.key}-{option.key}">
                      {#if option.type === "checkbox"}
                          <input type="checkbox" id="{element.key}-{option.key}" bind:checked={element[option.key]}>
                      {:else}
                          <select id="{element.key}-{option.key}" bind:value={element[option.key]}>
                              <option value="continious">Continuous</option>
                              <option value="discrete">Discrete</option>
                          </select>
                      {/if}
                      {option.label}
                  </label>
              {/each}
          {/if}
      {/each}
    </fieldset>

    <button class="configure" class:copied={copySuccess} type="button" onclick={handleConfiguration}>
      {copySuccess ? "Copied to Clipboard" : "Configure Selection"}
    </button>
  </div>

  <div class="viewer-section">
    <h2>Live Preview</h2>
    <div class="svg-container">
      <svg class="preview-svg" viewBox="0 0 {displayWidth} {displayHeight}">
        <text x={displayWidth/2} y="60" font-family="Roboto" font-size="46" font-weight="bold" fill="#1E293B" text-anchor="middle">{displayTitle}</text>
        
        <polyline points="{xLeft},{yTop} {xCenter},{yTop}" fill="none" stroke="#EF4444" stroke-width="10"/>
        {@html exhaustLineLayout.objects}
        {#each exhaustLineLayout.shapes as shape (shape.key)}
          <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill="#94A3B8" stroke="#475569" stroke-width="2"/>
        {/each}

        <polyline points="{xLeft},{yBottom} {xCenter},{yBottom}" fill="none" stroke="#22C55E" stroke-width="10"/>
        {@html intakeLineLayout.objects}
        {#each intakeLineLayout.shapes as shape (shape.key)}
          <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill="#94A3B8" stroke="#475569" stroke-width="2"/>
        {/each}

        <polyline points="{xRight},{yTop} {xCenter},{yTop}" fill="none" stroke="#F59E0B" stroke-width="10"/>
        {@html returnLineLayout.objects}
        {#each returnLineLayout.shapes as shape (shape.key)}
          <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill="#94A3B8" stroke="#475569" stroke-width="2"/>
        {/each}

        <polyline points="{xRight},{yBottom} {xCenter},{yBottom}" fill="none" stroke="#3B82F6" stroke-width="10"/>
        {@html supplyLineLayout.objects}
        {#each supplyLineLayout.shapes as shape (shape.key)}
          <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill="#94A3B8" stroke="#475569" stroke-width="2"/>
        {/each}

        <rect x={(displayWidth/2) - (recuperationUnitWidth/2)} y={(displayHeight/2) - (recuperationUnitHeight/2)} width={recuperationUnitWidth} height={recuperationUnitHeight} fill="#94A3B8" stroke="#475569" stroke-width="2"/>
        <svg x={(displayWidth/2) - (recuperationUnitWidth/2)} y={(displayHeight/2) - (recuperationUnitHeight/2)} width={recuperationUnitWidth} height={recuperationUnitHeight} xlink:href={RECUPERATION_MAP[selectedRecuperation] || ''}></svg>
      </svg>
    </div>
  </div>
</div>