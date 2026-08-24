<script>
    let recuperationUnitWidth = $state(100);
    let recuperationUnitHeight = $state(500);

    let displayWidth = $state(1920);
    let displayHeight = $state(1080);
    let displayTitle = $state("Klimatska Naprava");

    const elementPadding = 20;

    const yTop      = (displayHeight/2) - (recuperationUnitHeight/2) + 100;
    const yBottom   = (displayHeight/2) - (recuperationUnitHeight/2) + 400;
    const xLeft     = 60;
    const xCenter   = displayWidth/2;
    const xRight    = displayWidth - 60;

    const leftExtreme = xLeft + elementPadding;
    const centerExtremeLeft = xCenter - elementPadding;
    const centerExtremeRight = xCenter + elementPadding;
    const rightExtreme = xRight - elementPadding;

    const RECUPERATION_MAP = {
        "plate-heat-exchanger": "SYSTEM.LIBRARY.CAREL.OBJECTDISPLAYS.4-Symbols.Heat%20recovery.rotary_exchanger",
        "rotary-heat-exchanger": "SYSTEM.LIBRARY.CAREL.OBJECTDISPLAYS.4-Symbols.Heat%20recovery.rotary_exchanger",
        "run-around-coils": "SYSTEM.LIBRARY.CAREL.OBJECTDISPLAYS.4-Symbols.Heat%20recovery.rotary_exchanger"
    };

    const OBJECT_DISPLAY_MAP = {
        damper: { path: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.Damper", width: 120, height: 300, offset: 11 },
        filter: { path: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.Filter", width: 145, height: 225, offset: -11 },
        fan: { path: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.Fan", width: 135, height: 190, offset: 11 },
        temperatureSensor: { path: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.Temperature_Sensor", width:120, height: 90, offset: 29 },
        humiditySensor: { path: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.Humidity_Sensor", width: 120, height: 90, offset: 29 },
        pressureSensor: { path: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.Pressure_Sensor", width: 120, height: 90, offset: 29 },
        co2Sensor: { path: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU.CO2_Sensor", width: 120, height: 90, offset: 29 }
    };

    let supplyLineElements = $state([
        { key: "sup-damper",          label: "Supply Air Damper",                checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.damper.path,            objectWidth: OBJECT_DISPLAY_MAP.damper.width,            objectHeight: OBJECT_DISPLAY_MAP.damper.height,            offset: OBJECT_DISPLAY_MAP.damper.offset },
        { key: "sup-filter",          label: "Supply Air Filter",                checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.filter.path,            objectWidth: OBJECT_DISPLAY_MAP.filter.width,            objectHeight: OBJECT_DISPLAY_MAP.filter.height,            offset: OBJECT_DISPLAY_MAP.filter.offset },
        { key: "sup-fan",             label: "Supply Fan",                        checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.fan.path,               objectWidth: OBJECT_DISPLAY_MAP.fan.width,               objectHeight: OBJECT_DISPLAY_MAP.fan.height,               offset: OBJECT_DISPLAY_MAP.fan.offset },
        { key: "sup-temp-sensor",     label: "Temperature Sensor",               checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.temperatureSensor.path, objectWidth: OBJECT_DISPLAY_MAP.temperatureSensor.width, objectHeight: OBJECT_DISPLAY_MAP.temperatureSensor.height, offset: OBJECT_DISPLAY_MAP.temperatureSensor.offset },
        { key: "sup-humidity-sensor", label: "Humidity Sensor",                  checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.humiditySensor.path,    objectWidth: OBJECT_DISPLAY_MAP.humiditySensor.width,    objectHeight: OBJECT_DISPLAY_MAP.humiditySensor.height,    offset: OBJECT_DISPLAY_MAP.humiditySensor.offset },
        { key: "sup-pressure-sensor", label: "Pressure Transmit / Switch",        checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.pressureSensor.path,    objectWidth: OBJECT_DISPLAY_MAP.pressureSensor.width,    objectHeight: OBJECT_DISPLAY_MAP.pressureSensor.height,    offset: OBJECT_DISPLAY_MAP.pressureSensor.offset },
        { key: "sup-co2-sensor",      label: "CO2 Air Quality Sensor",            checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.co2Sensor.path,         objectWidth: OBJECT_DISPLAY_MAP.co2Sensor.width,         objectHeight: OBJECT_DISPLAY_MAP.co2Sensor.height,         offset: OBJECT_DISPLAY_MAP.co2Sensor.offset },
        { key: "sup-filter-dp-switch",label: "Filter Differential Pressure Switch", checked: false, objectDisplayPath: "",                                        objectWidth: 0,                                            objectHeight: 0,                                            offset: 0 },
    ]);

    let intakeLineElements = $state([
        { key: "int-damper",          label: "Outdoor Air Damper",                checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.damper.path,            objectWidth: OBJECT_DISPLAY_MAP.damper.width,            objectHeight: OBJECT_DISPLAY_MAP.damper.height,            offset: OBJECT_DISPLAY_MAP.damper.offset },
        { key: "int-pre-filter",      label: "Intake Weather Louver / Pre-Filter",checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.filter.path,            objectWidth: OBJECT_DISPLAY_MAP.filter.width,            objectHeight: OBJECT_DISPLAY_MAP.filter.height,            offset: OBJECT_DISPLAY_MAP.filter.offset },
        { key: "int-fan",             label: "Intake Fan",                        checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.fan.path,               objectWidth: OBJECT_DISPLAY_MAP.fan.width,               objectHeight: OBJECT_DISPLAY_MAP.fan.height,               offset: OBJECT_DISPLAY_MAP.fan.offset },
        { key: "int-temp-sensor",     label: "Outdoor Temperature Sensor",        checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.temperatureSensor.path, objectWidth: OBJECT_DISPLAY_MAP.temperatureSensor.width, objectHeight: OBJECT_DISPLAY_MAP.temperatureSensor.height, offset: OBJECT_DISPLAY_MAP.temperatureSensor.offset },
        { key: "int-humidity-sensor", label: "Outdoor Humidity Sensor",           checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.humiditySensor.path,    objectWidth: OBJECT_DISPLAY_MAP.humiditySensor.width,    objectHeight: OBJECT_DISPLAY_MAP.humiditySensor.height,    offset: OBJECT_DISPLAY_MAP.humiditySensor.offset },
        { key: "int-pressure-sensor", label: "Intake Pressure Transmit / Switch", checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.pressureSensor.path,    objectWidth: OBJECT_DISPLAY_MAP.pressureSensor.width,    objectHeight: OBJECT_DISPLAY_MAP.pressureSensor.height,    offset: OBJECT_DISPLAY_MAP.pressureSensor.offset },
        { key: "int-co2-sensor",      label: "Intake CO2 Sensor",                 checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.co2Sensor.path,         objectWidth: OBJECT_DISPLAY_MAP.co2Sensor.width,         objectHeight: OBJECT_DISPLAY_MAP.co2Sensor.height,         offset: OBJECT_DISPLAY_MAP.co2Sensor.offset },
        { key: "int-filter-dp-switch",label: "Intake Filter DP Switch",           checked: false, objectDisplayPath: "",                                        objectWidth: 0,                                            objectHeight: 0,                                            offset: 0 },
    ]);

    let exhaustLineElements = $state([
        { key: "exh-damper",          label: "Exhaust Air Damper",                checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.damper.path,            objectWidth: OBJECT_DISPLAY_MAP.damper.width,            objectHeight: OBJECT_DISPLAY_MAP.damper.height,            offset: OBJECT_DISPLAY_MAP.damper.offset },
        { key: "exh-filter",          label: "Exhaust Filter",                    checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.filter.path,            objectWidth: OBJECT_DISPLAY_MAP.filter.width,            objectHeight: OBJECT_DISPLAY_MAP.filter.height,            offset: OBJECT_DISPLAY_MAP.filter.offset },
        { key: "exh-fan",             label: "Exhaust Fan",                       checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.fan.path,               objectWidth: OBJECT_DISPLAY_MAP.fan.width,               objectHeight: OBJECT_DISPLAY_MAP.fan.height,               offset: OBJECT_DISPLAY_MAP.fan.offset },
        { key: "exh-temp-sensor",     label: "Exhaust Temperature Sensor",        checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.temperatureSensor.path, objectWidth: OBJECT_DISPLAY_MAP.temperatureSensor.width, objectHeight: OBJECT_DISPLAY_MAP.temperatureSensor.height, offset: OBJECT_DISPLAY_MAP.temperatureSensor.offset },
        { key: "exh-humidity-sensor", label: "Exhaust Humidity Sensor",           checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.humiditySensor.path,    objectWidth: OBJECT_DISPLAY_MAP.humiditySensor.width,    objectHeight: OBJECT_DISPLAY_MAP.humiditySensor.height,    offset: OBJECT_DISPLAY_MAP.humiditySensor.offset },
        { key: "exh-pressure-sensor", label: "Exhaust Pressure Transmit / Switch",checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.pressureSensor.path,    objectWidth: OBJECT_DISPLAY_MAP.pressureSensor.width,    objectHeight: OBJECT_DISPLAY_MAP.pressureSensor.height,    offset: OBJECT_DISPLAY_MAP.pressureSensor.offset },
        { key: "exh-co2-sensor",      label: "Exhaust CO2 Sensor",                checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.co2Sensor.path,         objectWidth: OBJECT_DISPLAY_MAP.co2Sensor.width,         objectHeight: OBJECT_DISPLAY_MAP.co2Sensor.height,         offset: OBJECT_DISPLAY_MAP.co2Sensor.offset },
        { key: "exh-filter-dp-switch",label: "Exhaust Filter DP Switch",          checked: false, objectDisplayPath: "",                                        objectWidth: 0,                                            objectHeight: 0,                                            offset: 0 },
    ]);

    let returnLineElements = $state([
        { key: "ret-damper",          label: "Return Air / Recirculation Damper", checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.damper.path,            objectWidth: OBJECT_DISPLAY_MAP.damper.width,            objectHeight: OBJECT_DISPLAY_MAP.damper.height,            offset: OBJECT_DISPLAY_MAP.damper.offset },
        { key: "ret-filter",          label: "Return Air Filter",                 checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.filter.path,            objectWidth: OBJECT_DISPLAY_MAP.filter.width,            objectHeight: OBJECT_DISPLAY_MAP.filter.height,            offset: OBJECT_DISPLAY_MAP.filter.offset },
        { key: "ret-fan",             label: "Return Fan",                        checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.fan.path,               objectWidth: OBJECT_DISPLAY_MAP.fan.width,               objectHeight: OBJECT_DISPLAY_MAP.fan.height,               offset: OBJECT_DISPLAY_MAP.fan.offset },
        { key: "ret-temp-sensor",     label: "Return Temperature Sensor",         checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.temperatureSensor.path, objectWidth: OBJECT_DISPLAY_MAP.temperatureSensor.width, objectHeight: OBJECT_DISPLAY_MAP.temperatureSensor.height, offset: OBJECT_DISPLAY_MAP.temperatureSensor.offset },
        { key: "ret-humidity-sensor", label: "Return Humidity Sensor",            checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.humiditySensor.path,    objectWidth: OBJECT_DISPLAY_MAP.humiditySensor.width,    objectHeight: OBJECT_DISPLAY_MAP.humiditySensor.height,    offset: OBJECT_DISPLAY_MAP.humiditySensor.offset },
        { key: "ret-pressure-sensor", label: "Return Pressure Transmit / Switch",  checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.pressureSensor.path,    objectWidth: OBJECT_DISPLAY_MAP.pressureSensor.width,    objectHeight: OBJECT_DISPLAY_MAP.pressureSensor.height,    offset: OBJECT_DISPLAY_MAP.pressureSensor.offset },
        { key: "ret-co2-sensor",      label: "Return CO2 / VOC Sensor",           checked: false, objectDisplayPath: OBJECT_DISPLAY_MAP.co2Sensor.path,         objectWidth: OBJECT_DISPLAY_MAP.co2Sensor.width,         objectHeight: OBJECT_DISPLAY_MAP.co2Sensor.height,         offset: OBJECT_DISPLAY_MAP.co2Sensor.offset },
        { key: "ret-filter-dp-switch",label: "Return Filter DP Switch",           checked: false, objectDisplayPath: "",                                        objectWidth: 0,                                            objectHeight: 0,                                            offset: 0 },
    ]);

    let selectedRecuperation = $state("plate-heat-exchanger");

    let dragSourceArray = $state(null);
    let dragSourceIndex = $state(null);
    let dragOverArray = $state(null);
    let dragOverIndex = $state(null);

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
            const [movedItem] = array.splice(dragSourceIndex, 1);
            array.splice(index, 0, movedItem);
        }
        dragSourceArray = null;
        dragSourceIndex = null;
        dragOverArray = null;
        dragOverIndex = null;
    }

    function calculateElementPosition(array, startingPosition, distance, centerY){
        const checkedItems = array.filter(item => item.checked && item.objectDisplayPath !== "");
        let drawItemMap = [];
        let elementCount = checkedItems.length;

        for(let i = 0; i < elementCount; i++){
            let lineSegmentWidth = parseFloat((distance / (elementCount + 1)).toFixed(1));
            let elementCenterPosition = startingPosition + lineSegmentWidth * (i + 1);
            let positionX = elementCenterPosition - (checkedItems[i].objectWidth / 2);
            let positionY = centerY - (checkedItems[i].objectHeight / 2) + checkedItems[i].offset;

            let svgString = `<svg atv:refpx="${elementCenterPosition}" atv:refpy="${centerY}" height="${checkedItems[i].objectHeight}" id="${checkedItems[i].key}" width="${checkedItems[i].objectWidth}" x="${positionX}" y="${positionY}" xlink:href="${checkedItems[i].objectDisplayPath}"/>`;
            drawItemMap.push(svgString);
        }
        
        return drawItemMap.join("\n            ");
    }

    function calculatePreviewShapes(array, startingPosition, distance, centerY){
        const checkedItems = array.filter(item => item.checked && item.objectDisplayPath !== "");
        let shapes = [];
        let elementCount = checkedItems.length;

        for(let i = 0; i < elementCount; i++){
            let lineSegmentWidth = parseFloat((distance / (elementCount + 1)).toFixed(1));
            let elementCenterPosition = startingPosition + lineSegmentWidth * (i + 1);
            let positionX = elementCenterPosition - (checkedItems[i].objectWidth / 2);
            let positionY = centerY - (checkedItems[i].objectHeight / 2);

            shapes.push({ key: checkedItems[i].key, x: positionX, y: positionY, width: checkedItems[i].objectWidth, height: checkedItems[i].objectHeight });
        }

        return shapes;
    }

    const exhaustLineObjects = $derived(calculateElementPosition(exhaustLineElements, leftExtreme, centerExtremeLeft - leftExtreme, yTop));
    const intakeLineObjects = $derived(calculateElementPosition(intakeLineElements, leftExtreme, centerExtremeLeft - leftExtreme, yBottom));
    const returnLineObjects = $derived(calculateElementPosition(returnLineElements, centerExtremeRight, rightExtreme - centerExtremeRight, yTop));
    const supplyLineObjects = $derived(calculateElementPosition(supplyLineElements, centerExtremeRight, rightExtreme - centerExtremeRight, yBottom));

    const exhaustLineShapes = $derived(calculatePreviewShapes(exhaustLineElements, leftExtreme, centerExtremeLeft - leftExtreme, yTop));
    const intakeLineShapes = $derived(calculatePreviewShapes(intakeLineElements, leftExtreme, centerExtremeLeft - leftExtreme, yBottom));
    const returnLineShapes = $derived(calculatePreviewShapes(returnLineElements, centerExtremeRight, rightExtreme - centerExtremeRight, yTop));
    const supplyLineShapes = $derived(calculatePreviewShapes(supplyLineElements, centerExtremeRight, rightExtreme - centerExtremeRight, yBottom));

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
            ${exhaustLineObjects}
            <polyline atv:refpx="500" atv:refpy="700.5" fill="#22C55E" fill-opacity="0" id="intake_line" points="${xLeft},${yBottom} ${xCenter},${yBottom}" stroke="#22C55E" stroke-width="10"/>
            ${intakeLineObjects}
            <polyline atv:refpx="1420" atv:refpy="400.5" fill="#F59E0B" fill-opacity="0" id="return_line" points="${xRight},${yTop} ${xCenter},${yTop}" stroke="#F59E0B" stroke-width="10"/>
            ${returnLineObjects}
            <polyline atv:refpx="1420" atv:refpy="700.5" fill="#3B82F6" fill-opacity="0" id="supply_line" points="${xRight},${yBottom} ${xCenter},${yBottom}" stroke="#3B82F6" stroke-width="10"/>
            ${supplyLineObjects}
            <svg atv:refpx="${(displayWidth/2) - (recuperationUnitWidth/2)}" atv:refpy="${(displayHeight/2) - (recuperationUnitHeight/2)}" height="500" id="recuperation_unit" width="86.97" x="916.515" xlink:href="${RECUPERATION_MAP[selectedRecuperation] || ''}" y="312.5"/>
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
    align-items: center;
    justify-content: space-around;
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
      <label class="input-group" for="height"> 
        <input id="height" type="text" bind:value={displayHeight}>
      </label>
    </fieldset>
    <label class="input-group" for="select-recuperations-unit">Select Recuperation Unit 
      <select id="select-recuperations-unit" name="select-recuperations-unit" bind:value={selectedRecuperation}>
        <option value="plate-heat-exchanger">Plate Heat Exchanger</option>
        <option value="rotary-heat-exchanger">Rotary Heat Exchanger</option>
        <option value="run-around-coils">Run Around Coils</option>
      </select>
    </label>

    <fieldset id="select-supply-line-elements">
      <legend>Select Supply Line Elements</legend>
      {#each supplyLineElements as element, index (element.key)}
          <label for="{element.key}"
              class:dragging={dragSourceArray === supplyLineElements && dragSourceIndex === index}
              class:drag-over-top={dragOverArray === supplyLineElements && dragOverIndex === index && dragSourceIndex !== null && dragSourceIndex > index}
              class:drag-over-bottom={dragOverArray === supplyLineElements && dragOverIndex === index && dragSourceIndex !== null && dragSourceIndex < index}
              draggable="true"
              ondragstart={() => handleDragStart(supplyLineElements, index)}
              ondragover={(event) => handleDragOver(event, supplyLineElements, index)}
              ondrop={() => handleDrop(supplyLineElements, index)}
              ondragend={handleDragEnd}>
              <input type="checkbox" id={element.key} bind:checked={element.checked}> {element.label}
          </label>
      {/each}
    </fieldset>

    <fieldset id="select-intake-line-elements">
      <legend>Select Intake Line Elements</legend>
      {#each intakeLineElements as element, index (element.key)}
          <label for="{element.key}"
              class:dragging={dragSourceArray === intakeLineElements && dragSourceIndex === index}
              class:drag-over-top={dragOverArray === intakeLineElements && dragOverIndex === index && dragSourceIndex !== null && dragSourceIndex > index}
              class:drag-over-bottom={dragOverArray === intakeLineElements && dragOverIndex === index && dragSourceIndex !== null && dragSourceIndex < index}
              draggable="true"
              ondragstart={() => handleDragStart(intakeLineElements, index)}
              ondragover={(event) => handleDragOver(event, intakeLineElements, index)}
              ondrop={() => handleDrop(intakeLineElements, index)}
              ondragend={handleDragEnd}>
              <input type="checkbox" id={element.key} bind:checked={element.checked}> {element.label}
          </label>
      {/each}
    </fieldset>

    <fieldset id="select-exhaust-line-elements">
      <legend>Select Exhaust Line Elements</legend>
      {#each exhaustLineElements as element, index (element.key)}
          <label for="{element.key}"
              class:dragging={dragSourceArray === exhaustLineElements && dragSourceIndex === index}
              class:drag-over-top={dragOverArray === exhaustLineElements && dragOverIndex === index && dragSourceIndex !== null && dragSourceIndex > index}
              class:drag-over-bottom={dragOverArray === exhaustLineElements && dragOverIndex === index && dragSourceIndex !== null && dragSourceIndex < index}
              draggable="true"
              ondragstart={() => handleDragStart(exhaustLineElements, index)}
              ondragover={(event) => handleDragOver(event, exhaustLineElements, index)}
              ondrop={() => handleDrop(exhaustLineElements, index)}
              ondragend={handleDragEnd}>
              <input type="checkbox" id={element.key} bind:checked={element.checked}> {element.label}
          </label>
      {/each}
    </fieldset>

    <fieldset id="select-return-line-elements">
      <legend>Select Return Line Elements</legend>
      {#each returnLineElements as element, index (element.key)}
          <label for="{element.key}"
              class:dragging={dragSourceArray === returnLineElements && dragSourceIndex === index}
              class:drag-over-top={dragOverArray === returnLineElements && dragOverIndex === index && dragSourceIndex !== null && dragSourceIndex > index}
              class:drag-over-bottom={dragOverArray === returnLineElements && dragOverIndex === index && dragSourceIndex !== null && dragSourceIndex < index}
              draggable="true"
              ondragstart={() => handleDragStart(returnLineElements, index)}
              ondragover={(event) => handleDragOver(event, returnLineElements, index)}
              ondrop={() => handleDrop(returnLineElements, index)}
              ondragend={handleDragEnd}>
              <input type="checkbox" id={element.key} bind:checked={element.checked}> {element.label}
          </label>
      {/each}
    </fieldset>

    <button class="configure" type="button" onclick={handleConfiguration}>Configure Selection</button>
  </div>

  <div class="viewer-section">
    <h2>Live Preview</h2>
    <div class="svg-container">
      <svg class="preview-svg" viewBox="0 0 {displayWidth} {displayHeight}">
        <text x={displayWidth/2} y="60" font-family="Roboto" font-size="46" font-weight="bold" fill="#1E293B" text-anchor="middle">{displayTitle}</text>
        
        <polyline points="{xLeft},{yTop} {xCenter},{yTop}" fill="none" stroke="#EF4444" stroke-width="10"/>
        {@html exhaustLineObjects}
        {#each exhaustLineShapes as shape (shape.key)}
          <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill="#94A3B8" stroke="#475569" stroke-width="2"/>
        {/each}

        <polyline points="{xLeft},{yBottom} {xCenter},{yBottom}" fill="none" stroke="#22C55E" stroke-width="10"/>
        {@html intakeLineObjects}
        {#each intakeLineShapes as shape (shape.key)}
          <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill="#94A3B8" stroke="#475569" stroke-width="2"/>
        {/each}

        <polyline points="{xRight},{yTop} {xCenter},{yTop}" fill="none" stroke="#F59E0B" stroke-width="10"/>
        {@html returnLineObjects}
        {#each returnLineShapes as shape (shape.key)}
          <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill="#94A3B8" stroke="#475569" stroke-width="2"/>
        {/each}

        <polyline points="{xRight},{yBottom} {xCenter},{yBottom}" fill="none" stroke="#3B82F6" stroke-width="10"/>
        {@html supplyLineObjects}
        {#each supplyLineShapes as shape (shape.key)}
          <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill="#94A3B8" stroke="#475569" stroke-width="2"/>
        {/each}

        <rect x={(displayWidth/2) - (recuperationUnitWidth/2)} y={(displayHeight/2) - (recuperationUnitHeight/2)} width={recuperationUnitWidth} height={recuperationUnitHeight} fill="#94A3B8" stroke="#475569" stroke-width="2"/>
        <svg x={(displayWidth/2) - (recuperationUnitWidth/2)} y={(displayHeight/2) - (recuperationUnitHeight/2)} width={recuperationUnitWidth} height={recuperationUnitHeight} xlink:href={RECUPERATION_MAP[selectedRecuperation] || ''}></svg>
      </svg>
    </div>
  </div>
</div>