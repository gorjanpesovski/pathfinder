<script>
  import { base } from "$app/paths";
  import { ICON_SPRITE } from "$lib/iconSprite.js";
  import { RESOURCE_SECTIONS } from "$lib/resources.js";

  let displayWidth = $state(1920);
  let displayHeight = $state(1125);
  let displayTitle = $state("Klimatska Naprava");
  let nodePathPrefix = $state("AGENT.OBJECTS.Klimat");
  let elementMapLocation = $state("SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone.AHU");
  let selectModbusTable = $state("carel");

  let recuperationUnitWidth = $state(150);
  let recuperationUnitHeight = $state(500);
  let recuperationUnitX = $derived(displayWidth / 2);

  const elementPadding = 20;

  const yTop = $derived((displayHeight / 2) - (recuperationUnitHeight / 2) + 80);
  const yBottom = $derived((displayHeight / 2) - (recuperationUnitHeight / 2) + 420);
  const xLeft = 60;
  const xCenter = $derived(recuperationUnitX);
  const xRight = $derived(displayWidth - 60);
  let elementScale = $state(1);

  const leftExtreme = $derived(xLeft + elementPadding);
  const centerExtremeLeft = $derived(xCenter - (recuperationUnitWidth / 2) - elementPadding);
  const centerExtremeRight = $derived(xCenter + (recuperationUnitWidth / 2) + elementPadding);
  const rightExtreme = $derived(xRight - elementPadding);

  const RECUPERATION_MAP = $derived(
    {
          "plate-heat-exchanger": `${elementMapLocation}.Plate_Heat_Exchnager`,
          "rotary-heat-exchanger": `${elementMapLocation}.Rotary_Heat_Exchnager`
    });
    

  let selectedRecuperation = $state("rotary-heat-exchanger");

  const exhaustY = $derived(selectedRecuperation === "plate-heat-exchanger" ? yBottom : yTop);
  const intakeY = $derived(selectedRecuperation === "plate-heat-exchanger" ? yTop : yBottom);

  const recuperationFillPercent = $derived(
      rightExtreme > leftExtreme ?
      ((recuperationUnitX - leftExtreme) / (rightExtreme - leftExtreme)) * 100 :
      0
  );

  const MODBUS_MAP = {
      "carel": {
          "int-damper": (el) => `${el.signalType === "continous" ? ".Mod_External_Damper" : ".On_Off_External_Damper"}`,
          "exh-damper": (el) => `${el.signalType === "continous" ? ".Mod_Exhaust_Damper" : ".On_Off_Exhaust_Damper"}`,
          "sup-fan": {
              base: ".Supply_Fan",
              alarm: ".Supply_Fan_Alarm"
          },
          "exh-fan": {
              base: ".Exhaust_Fan",
              alarm: ".ALM_Return_Fan_Overload_1"
          },
          "ret-fan": {
              base: ".Return_Fan",
              alarm: ".ALM_Return_Fan_Overload_1"
          },
          "sup-filter": {
              base: ".ALM_Supply_Filter",
          },
          "ret-filter": {
              base: ".ALM_Return_Filter",
          },
          "int-pre-filter": {
              base: ".ALM_Filter", // generic alarm, no intake-specific entry in table
          },
          "exh-filter": {
              base: ".ALM_Filters", // generic alarm, no exhaust-specific entry in table
          },
          "sup-temp-sensor": {
              base: ".Supply_Temp",
              alarm: ".ALM_Regulation_Probe" // only generic probe alarm exists
          },
          "int-temp-sensor": {
              base: ".External_Temp"
          },
          "exh-temp-sensor": {
              base: ".Exhaust_Temp"
          },
          "ret-temp-sensor": {
              base: ".Return_Temp"
          },
          "sup-humidity-sensor": {
              base: ".Supply_Humid"
          },
          "int-humidity-sensor": {
              base: ".External_Humid"
          },
          "ret-humidity-sensor": {
              base: ".Return_Humid"
          },
          "sup-co2-sensor": {
              base: ".Air_Quality_CO2"
          },
          "sup-preheat-hot-water-coils": {
              base: ".Pre_Heat_Coil_Temp",
              valve: ".Mod_Valve_Preheat",
              pump: ".Pre_Heat_Pump_1",
              alarm_pump_1_overload: ".ALM_Pre_Heat_Pump_1_Overload",
              alarm_pump_1_flow: ".ALM_Pre_Heat_Pump_1_Flow",
              alarm_water_temp: ".ALM_Pre_Heat_Pump_Water_Temperature",
          },
          "sup-postheat-hot-water-coils": {
              base: ".Post_Heat_Coil_Temp",
              valve: ".Mod_Valve_Postheat",
              pump: ".Post_Heat_Pump_1",
              alarm_pump_1_overload: ".ALM_Post_Heat_Pump_1_Overload",
              alarm_pump_1_flow: ".ALM_Post_Heat_Pump_1_Flow",
              alarm_water_temp: ".ALM_Post_Heat_Pump_Water_Temperature",
          },
          "sup-cold-water-coils": {
              base: ".Cool_Coil_Temp",
              valve: ".Mod_Valve_Cool",
              pump: ".Cool_Pump_1",
              alarm_pump_1_overload: ".ALM_Cool_Pump_1_Overload",
              alarm_pump_1_flow: ".ALM_Cool_Pump_1_Flow",
              alarm_water_temp: ".ALM_Cool_Pump_Water_Temperature",
          },
          "sup-preheat-electric-heater": {
              base: ".Heaters_Pre_1",
              alarm_overload: ".Din_OverL_Pre_H_Heaters",
              alarm_heaters: ".ALM_Pre_H_Heaters",
          },
          "sup-postheat-electric-heater": {
              base: ".Heaters_Post_1",
              alarm_overload: ".Din_OverL_Post_H_Heaters",
              alarm_heaters: ".ALM_Post_H_Heaters",
          }
      }
  };

  const OBJECT_DISPLAY_MAP = $derived({
      damper: {
          path: `${elementMapLocation}.Damper`,
          width: 120,
          height: 300,
          offset: 11
      },
      filter: {
          path: `${elementMapLocation}.Filter`,
          width: 145,
          height: 225,
          offset: -11
      },
      fan: {
          path: `${elementMapLocation}.Fan`,
          width: 135,
          height: 190,
          offset: 11
      },
      temperatureSensor: {
          path: `${elementMapLocation}.Temperature_Sensor`,
          width: 120,
          height: 90,
          offset: 29
      },
      humiditySensor: {
          path: `${elementMapLocation}.Humidity_Sensor`,
          width: 120,
          height: 90,
          offset: 29
      },
      pressureSensor: {
          path: `${elementMapLocation}.Pressure_Sensor`,
          width: 120,
          height: 90,
          offset: 29
      },
      co2Sensor: {
          path: `${elementMapLocation}.CO2_Sensor`,
          width: 120,
          height: 90,
          offset: 29
      },
      hotWaterCoils: {
          path: `${elementMapLocation}.Hot_Water_Coil`,
          width: 120,
          height: 280,
          offset: 38
      },
      coldWaterCoils: {
          path: `${elementMapLocation}.Cold_Water_Coil`,
          width: 120,
          height: 280,
          offset: 38
      },
      electricHeater: {
          path: `${elementMapLocation}.Electric_Heater`,
          width: 100,
          height: 200,
          offset: -2
      },
      humidifier: {
          path: `${elementMapLocation}.Humidifier`,
          width: 100,
          height: 210,
          offset: -2
      },
      frostThermostat: {
          path: `${elementMapLocation}.Frost_Protection_Thermostat`,
          width: 35,
          height: 35,
          offset: 0
      },
  });

  const ELEMENT_OPTIONS = {
      damper: [{
          key: "signalType",
          label: "Signal Type",
          type: "select"
      }],
      filter: [{
          key: "dpSwitch",
          label: "DP Switch",
          type: "checkbox"
      }],
      fan: [{
          key: "dpSwitch",
          label: "DP Switch",
          type: "checkbox"
      }]
  }

  let supplyLineElements = $state([{
          key: "sup-filter",
          label: "Supply Air Filter",
          checked: false,
          type: "filter",
          dpSwitch: false
      },
      {
          key: "sup-frost-thermostat",
          label: "Frost Protection Thermostat",
          checked: false,
          type: "frostThermostat"
      },
      {
          key: "sup-preheat-hot-water-coils",
          label: "Preheat Hot Water Coils",
          checked: false,
          type: "hotWaterCoils"
      },
      {
          key: "sup-cold-water-coils",
          label: "Cold Water Coils",
          checked: false,
          type: "coldWaterCoils"
      },
      {
          key: "sup-postheat-hot-water-coils",
          label: "Postheat Hot Water Coils",
          checked: false,
          type: "hotWaterCoils"
      },
      {
          key: "sup-electric-heater",
          label: "Electric Heaters",
          checked: false,
          type: "electricHeater"
      },
      {
          key: "sup-humidifier",
          label: "Humidifier",
          checked: false,
          type: "humidifier"
      },
      {
          key: "sup-fan",
          label: "Supply Fan",
          checked: false,
          type: "fan",
          dpSwitch: false
      },
      {
          key: "sup-temp-sensor",
          label: "Temperature Sensor",
          checked: false,
          type: "temperatureSensor"
      },
      {
          key: "sup-humidity-sensor",
          label: "Humidity Sensor",
          checked: false,
          type: "humiditySensor"
      },
      {
          key: "sup-co2-sensor",
          label: "CO2 Air Quality Sensor",
          checked: false,
          type: "co2Sensor"
      }
  ]);

  let intakeLineElements = $state([{
          key: "int-damper",
          label: "Outdoor Air Damper",
          checked: false,
          type: "damper",
          signalType: "continious"
      },
      {
          key: "int-pre-filter",
          label: "Intake Weather Louver / Pre-Filter",
          checked: false,
          type: "filter",
          dpSwitch: false
      },
      {
          key: "int-temp-sensor",
          label: "Outdoor Temperature Sensor",
          checked: false,
          type: "temperatureSensor"
      },
      {
          key: "int-humidity-sensor",
          label: "Outdoor Humidity Sensor",
          checked: false,
          type: "humiditySensor"
      },
      {
          key: "int-fan",
          label: "Intake Fan",
          checked: false,
          type: "fan",
          dpSwitch: false
      }
  ]);

  let exhaustLineElements = $state([{
          key: "exh-frost-thermostat",
          label: "Recovery Core Frost Thermostat",
          checked: false,
          type: "frostThermostat"
      },
      {
          key: "exh-filter",
          label: "Exhaust Filter",
          checked: false,
          type: "filter",
          dpSwitch: false
      },
      {
          key: "exh-temp-sensor",
          label: "Exhaust Temperature Sensor",
          checked: false,
          type: "temperatureSensor"
      },
      {
          key: "exh-humidity-sensor",
          label: "Exhaust Humidity Sensor",
          checked: false,
          type: "humiditySensor"
      },
      {
          key: "exh-fan",
          label: "Exhaust Fan",
          checked: false,
          type: "fan",
          dpSwitch: false
      },
      {
          key: "exh-damper",
          label: "Exhaust Air Damper",
          checked: false,
          type: "damper",
          signalType: "continious"
      }
  ]);

  let returnLineElements = $state([{
          key: "ret-filter",
          label: "Return Air Filter",
          checked: false,
          type: "filter",
          dpSwitch: false
      },
      {
          key: "ret-temp-sensor",
          label: "Return Temperature Sensor",
          checked: false,
          type: "temperatureSensor"
      },
      {
          key: "ret-humidity-sensor",
          label: "Return Humidity Sensor",
          checked: false,
          type: "humiditySensor"
      },
      {
          key: "ret-co2-sensor",
          label: "Return CO2 Sensor",
          checked: false,
          type: "co2Sensor"
      },
      {
          key: "ret-fan",
          label: "Return Fan",
          checked: false,
          type: "fan",
          dpSwitch: false
      }
  ]);


  let resourcesDialog = $state(null);
  let copiedResourceId = $state(null);
  let copiedResourceTimer;

  function openResources() {
      resourcesDialog?.showModal();
  }

  function closeResources() {
      resourcesDialog?.close();
  }

  // showModal() already handles Escape and the focus trap, so the only thing
  // left is dismissing on a click that lands on the backdrop rather than the panel.
  function handleDialogClick(event) {
      if (event.target === resourcesDialog) closeResources();
  }

  function handleDialogClose() {
      clearTimeout(copiedResourceTimer);
      copiedResourceId = null;
  }

  async function copyResource(resource) {
      try {
          await navigator.clipboard.writeText(resource.text);
          copiedResourceId = resource.id;
          clearTimeout(copiedResourceTimer);
          copiedResourceTimer = setTimeout(() => {
              copiedResourceId = null;
          }, 2000);
      } catch (err) {
          console.log("Failed to copy:", err);
      }
  }

  function downloadResource(resource) {
      // Text resources are inlined rather than emitted as assets, so they need
      // a blob URL; everything under elements/ already has one.
      const objectUrl = resource.url ? null : URL.createObjectURL(
          new Blob([resource.text], { type: "text/plain;charset=utf-8" })
      );

      const link = document.createElement("a");
      link.href = resource.url ?? objectUrl;
      link.download = resource.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      if (objectUrl) URL.revokeObjectURL(objectUrl);
  }

  let dragSourceArray = $state(null);
  let dragSourceIndex = $state(null);
  let dragOverArray = $state(null);
  let dragOverIndex = $state(null);
  let copySuccess = $state(false);

  function handleDragStart(array, index) {
      dragSourceArray = array;
      dragSourceIndex = index;
  }

  function handleDragOver(event, array, index) {
      event.preventDefault();
      dragOverArray = array;
      dragOverIndex = index;
  }

  function handleDragEnd() {
      dragSourceArray = null;
      dragSourceIndex = null;
      dragOverArray = null;
      dragOverIndex = null;
  }

  function handleDrop(array, index) {
      if (dragSourceArray === array && dragSourceIndex !== null && dragSourceIndex !== index) {
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

  function calculateLineLayout(array, startingPosition, distance, centerY) {
      const checkedItems = array.filter(item => item.checked && item.type && OBJECT_DISPLAY_MAP[item.type]);
      let drawItemMap = [];
      let shapes = [];
      let elementCount = checkedItems.length;

      if (elementCount === 0) {
          return {
              objects: "",
              shapes: []
          };
      }

      const totalElementsWidth = checkedItems.reduce((sum, item) => {
          return sum + (OBJECT_DISPLAY_MAP[item.type].width * elementScale);
      }, 0);

      const gap = elementCount > 1 ?
          (distance - totalElementsWidth) / (elementCount - 1) :
          0;

      let currentX = startingPosition;

      for (let i = 0; i < elementCount; i++) {
          const item = checkedItems[i];
          const config = OBJECT_DISPLAY_MAP[item.type];
          const scaledWidth = config.width * elementScale;

          let positionX = currentX;
          let positionY = centerY - ((config.height * elementScale) / 2) + (config.offset * elementScale);
          let elementCenterPosition = positionX + (scaledWidth / 2);

          const mapEntry = MODBUS_MAP[selectModbusTable]?.[item.key];
          let appendix = "";

          if (typeof(mapEntry) === "object") {

              for (const [key, value] of Object.entries(mapEntry)) {
                  appendix += `<atv:argument name="${key}" value="${nodePathPrefix}${value}"/>`
              }
          } else {
              let suffix = typeof mapEntry === "function" ? mapEntry(item) : (mapEntry || "");
              appendix = suffix ? `<atv:argument name="base" value="${nodePathPrefix}${suffix}"/>` : "";
          }

          let svgString = `<svg atv:refpx="${elementCenterPosition}" atv:refpy="${centerY}" height="${config.height}" id="${item.key}" width="${config.width}" x="0" y="0" transform="matrix(${elementScale},0,0,${elementScale},${positionX},${positionY})" xlink:href="${config.path}">${appendix}</svg>`;
          drawItemMap.push(svgString);

          shapes.push({
              key: item.key,
              type: item.type,
              x: positionX,
              y: centerY - ((config.height * elementScale) / 2),
              width: scaledWidth,
              height: config.height * elementScale,
              offset: config.offset * elementScale
          });

          currentX += scaledWidth + gap;
      }

      return {
          objects: drawItemMap.join("\n            "),
          shapes
      };
  }

  const exhaustLineLayout = $derived(calculateLineLayout(exhaustLineElements, leftExtreme, centerExtremeLeft - leftExtreme, exhaustY));
  const intakeLineLayout = $derived(calculateLineLayout(intakeLineElements, leftExtreme, centerExtremeLeft - leftExtreme, intakeY));
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
              <polyline atv:refpx="700.5" atv:refpy="700.5" fill="#EF4444" fill-opacity="0" id="exhaust_line" points="${xLeft},${exhaustY} ${xCenter},${exhaustY}" stroke="#EF4444" stroke-width="10"/>
              ${exhaustLineLayout.objects}
              <polyline atv:refpx="500" atv:refpy="700.5" fill="#22C55E" fill-opacity="0" id="intake_line" points="${xLeft},${intakeY} ${xCenter},${intakeY}" stroke="#22C55E" stroke-width="10"/>
              ${intakeLineLayout.objects}
              <polyline atv:refpx="1420" atv:refpy="400.5" fill="#F59E0B" fill-opacity="0" id="return_line" points="${xRight},${yTop} ${xCenter},${yTop}" stroke="#F59E0B" stroke-width="10"/>
              ${returnLineLayout.objects}
              <polyline atv:refpx="1420" atv:refpy="700.5" fill="#3B82F6" fill-opacity="0" id="supply_line" points="${xRight},${yBottom} ${xCenter},${yBottom}" stroke="#3B82F6" stroke-width="10"/>
              ${supplyLineLayout.objects}
              <svg atv:refpx="${(displayWidth/2) - (recuperationUnitWidth/2)}" atv:refpy="${(displayHeight/2) - (recuperationUnitHeight/2)}" height="${recuperationUnitHeight}" id="recuperation_unit" width="${displayWidth}" x="${(recuperationUnitX) - (recuperationUnitWidth/2)}" xlink:href="${RECUPERATION_MAP[selectedRecuperation] || ''}" y="${(displayHeight/2) - (recuperationUnitHeight/2)}"/>
              <svg atv:refpx="40" atv:refpy="390" height="20" id="exhaust_arrows" width="40" x="${xLeft - 40}" xlink:href="${elementMapLocation}.Arrows" y="${exhaustY - 10}"><atv:argument name="color" value="#EF4444"/></svg>
              <svg atv:refpx="40" atv:refpy="390" height="20" id="intake_arrows" width="40" x="${xLeft - 40}" xlink:href="${elementMapLocation}.Arrows" y="${intakeY - 10}"><atv:argument name="color" value="#22C55E"/></svg>
              <svg atv:refpx="40" atv:refpy="390" height="20" id="return_arrows" width="40" x="${xRight}" xlink:href="${elementMapLocation}.Arrows" y="${yTop - 10}"><atv:argument name="color" value="#F59E0B"/></svg>
              <svg atv:refpx="40" atv:refpy="390" height="20" id="supply_arrows" width="40" x="${xRight}" xlink:href="${elementMapLocation}.Arrows" y="${yBottom - 10}"><atv:argument name="color" value="#3B82F6"/></svg>
              </svg>`;

      try {
          await navigator.clipboard.writeText(boilerPlate);
          console.log("Copied to clipboard");
          copySuccess = true;
          setTimeout(() => {
              copySuccess = false;
          }, 2000);
      } catch (err) {
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

  .header{
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1800px;
    margin: 0 auto 20px auto;
  }

  .logo-section {
    display: flex;
    align-items: center;
    font-size: 20px;
    color: #1E293B;

    .subtitle{
        font-size: 12px;
        color: #475569;
        font-weight: 500;
    }
  }

  .logo{
    height: 50px;
    margin-right: 10px;
  }

  .resources-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    color: #2563eb;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  .resources-link:hover {
    background: #eff6ff;
    border-color: #93c5fd;
    color: #1d4ed8;
  }

  .resources-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .resources-dialog {
    width: min(760px, calc(100vw - 48px));
    max-height: calc(100dvh - 96px);
    padding: 0;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #ffffff;
    color: #0f172a;
    box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
    overflow: hidden;
  }

  .resources-dialog::backdrop {
    background: rgba(15, 23, 42, 0.45);
  }

  .dialog-panel {
    display: flex;
    flex-direction: column;
    max-height: calc(100dvh - 96px);
  }

  .dialog-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 24px 16px 24px;
    border-bottom: 1px solid #e2e8f0;
  }

  .dialog-title {
    font-size: 18px;
    font-weight: 600;
    color: #1E293B;
  }

  .dialog-subtitle {
    margin-top: 4px;
    font-size: 12px;
    color: #64748b;
  }

  .dialog-close {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #f8fafc;
    color: #475569;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
  }

  .dialog-close:hover {
    background: #e2e8f0;
    color: #0f172a;
  }

  .dialog-body {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 20px 24px 24px 24px;
    overflow-y: auto;
    min-height: 0;
  }

  .resource-group-title {
    font-size: 14px;
    font-weight: 600;
    color: #334155;
  }

  .resource-group-note {
    margin: 4px 0 0 0;
    font-size: 12px;
    color: #94a3b8;
  }

  .resource-empty {
    margin: 12px 0 0 0;
    padding: 14px;
    border: 1px dashed #cbd5e1;
    border-radius: 6px;
    background: #f8fafc;
    font-size: 12px;
    color: #64748b;
  }

  .resource-empty code {
    font-size: 11px;
    color: #475569;
  }

  .resource-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 12px 0 0 0;
    padding: 0;
  }

  .resource {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #f8fafc;
    padding: 14px;
  }

  .resource-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .resource-title {
    font-size: 13px;
    font-weight: 600;
    color: #334155;
  }

  .resource-meta {
    margin-top: 2px;
    font-size: 11px;
    color: #94a3b8;
    font-family: 'Consolas', 'Courier New', monospace;
  }

  .resource-description {
    margin: 6px 0 0 0;
    font-size: 12px;
    color: #64748b;
  }

  .resource-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .resource-button {
    padding: 7px 14px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    color: #334155;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  .resource-button:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  .resource-button.primary {
    background: #2563eb;
    border-color: #2563eb;
    color: #ffffff;
  }

  .resource-button.primary:hover {
    background: #1d4ed8;
    border-color: #1d4ed8;
  }

  .resource-button.primary.copied,
  .resource-button.primary.copied:hover {
    background: #16a34a;
    border-color: #16a34a;
  }

  .resource-preview {
    max-height: 180px;
    margin: 12px 0 0 0;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #ffffff;
    color: #475569;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 11px;
    line-height: 1.5;
    overflow: auto;
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
    align-items: stretch;
    text-align: left;
    gap: 6px;
    font-weight: 600;
    font-size: 13px;
    color: #475569;
  }

  .input-group:has(input[type="range"]) {
    gap: 0;
  }

  .field-hint {
    font-weight: 400;
    font-size: 12px;
    color: #94a3b8;
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

  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 20px;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
  }

  /* Track — filled portion driven by --fill, set inline from the bound value */
  input[type="range"]::-webkit-slider-runnable-track {
    height: 6px;
    border-radius: 999px;
    border: 1px solid #cbd5e1;
    background:
      linear-gradient(#2563eb, #2563eb) 0 / var(--fill, 50%) 100% no-repeat,
      #e2e8f0;
  }

  input[type="range"]::-moz-range-track {
    height: 6px;
    border-radius: 999px;
    border: 1px solid #cbd5e1;
    background: #e2e8f0;
  }

  input[type="range"]::-moz-range-progress {
    height: 6px;
    border-radius: 999px;
    background-color: #2563eb;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    margin-top: -6px; /* centers the 16px thumb on the 6px track */
    border-radius: 50%;
    background-color: #ffffff;
    border: 2px solid #2563eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }

  input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #ffffff;
    border: 2px solid #2563eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }

  input[type="range"]:hover::-webkit-slider-thumb {
    background-color: #eff6ff;
    border-color: #1d4ed8;
  }

  input[type="range"]:hover::-moz-range-thumb {
    background-color: #eff6ff;
    border-color: #1d4ed8;
  }

  input[type="range"]:active::-webkit-slider-thumb {
    background-color: #2563eb;
    transform: scale(1.1);
  }

  input[type="range"]:active::-moz-range-thumb {
    background-color: #2563eb;
    transform: scale(1.1);
  }

  input[type="range"]:focus {
    outline: none;
  }

  input[type="range"]:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  input[type="range"]:focus-visible::-moz-range-thumb {
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
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
    flex: 1;
    min-height: 0;
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
    height: 100%;
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

<title>Auto AHU</title>
{@html ICON_SPRITE}
<div class="header">
    <div class="logo-section">
        <link rel="icon" type="image/x-icon" href="{base}/logo.svg">
        <img class="logo" src="{base}/logo.svg" alt="Auto AHU logo">
        <div class="title">
            <div class="title">Auto AHU</div>
            <div class="subtitle">Automatic AHU Generator v0.2</div>
        </div>
    </div>
    <div class="resources-section">
        <button class="resources-link" type="button" onclick={openResources}>
            <svg class="resources-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 3v10"/>
                <path d="m8 11 4 4 4-4"/>
                <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>
            </svg>
            Resources
        </button>
    </div>
</div>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog class="resources-dialog" bind:this={resourcesDialog} onclick={handleDialogClick} onclose={handleDialogClose}>
    <div class="dialog-panel">
        <div class="dialog-head">
            <div>
                <div class="dialog-title">Resources</div>
                <div class="dialog-subtitle">Object display element and modbus tables.</div>
            </div>
            <button class="dialog-close" type="button" onclick={closeResources} aria-label="Close resources">&times;</button>
        </div>

        <div class="dialog-body">
            {#each RESOURCE_SECTIONS as section (section.id)}
                <section class="resource-group">
                    <div class="resource-group-title">{section.title}</div>
                    {#if section.description}
                        <p class="resource-group-note">{section.description}</p>
                    {/if}

                    {#if section.resources.length === 0}
                        <p class="resource-empty">
                            Nothing here yet — drop files into <code>{section.folder}</code> and list them in <code>manifest.js</code>.
                        </p>
                    {:else}
                        <ul class="resource-list">
                            {#each section.resources as resource (resource.id)}
                                <li class="resource">
                                    <div class="resource-row">
                                        <div class="resource-info">
                                            <div class="resource-title">{resource.title}</div>
                                            <div class="resource-meta">
                                                {resource.filename}{resource.size ? ` · ${resource.size}` : ""}
                                            </div>
                                            {#if resource.description}
                                                <p class="resource-description">{resource.description}</p>
                                            {/if}
                                        </div>
                                        <div class="resource-actions">
                                            {#if resource.text !== undefined}
                                                <button class="resource-button primary" class:copied={copiedResourceId === resource.id} type="button" onclick={() => copyResource(resource)}>
                                                    {copiedResourceId === resource.id ? "Copied" : "Copy"}
                                                </button>
                                            {/if}
                                            <button class="resource-button" type="button" onclick={() => downloadResource(resource)}>
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                    {#if resource.text !== undefined}
                                        <pre class="resource-preview">{resource.text}</pre>
                                    {/if}
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </section>
            {/each}
        </div>
    </div>
</dialog>
<div class="app-layout">
  <div class="selection-section">
  <fieldset id="select-title">
      <legend>Display Title</legend>
      <input id="title" type="text" bind:value={displayTitle}>
    </fieldset>
  <fieldset id="select-display-dimensions">
      <legend>Select Display Dimensions</legend>
      <label class="input-group" for="width"> 
        <input id="width" type="text" bind:value={displayWidth}>
      </label>
      x
      <label class="input-group" for="height"> 
        <input id="height" type="text" bind:value={displayHeight}>
      </label>
    </fieldset>
    <fieldset id="select-recuperations-unit">
      <legend>Select Recuperation Unit and Bypass Damper</legend>
      <label class="input-group" for="select-recuperations-unit">
        <select id="select-recuperations-unit" name="select-recuperations-unit" bind:value={selectedRecuperation}>
          <option value="plate-heat-exchanger">Plate Heat Exchanger</option>
          <option value="rotary-heat-exchanger">Rotary Heat Exchanger</option>
        </select>
      </label>
      <!-- <label class="input-group" for="select-bypass-damper">
        <select id="select-bypass-damper" name="select-bypass-damper">
          <option value="no-bypass-damper">No Bypass Damper</option>
          <option value="bypass-damper-present">Bypass Damper Present</option>
        </select>
      </label> -->
    </fieldset>
    <fieldset id="select-layout-adjustments">
      <legend>Layout Adjustments</legend>
      <label class="input-group" for="recuperation-unit-x-position">
        <span class="field-hint">Recuperation Unit X Position</span>
        <input type="range" name="recuperation-unit-x-position" id="recuperation-unit-x-position" min={leftExtreme} max={rightExtreme} bind:value={recuperationUnitX} style="--fill: {recuperationFillPercent}%">
      </label>
      <label class="input-group" for="element-scale">
        <span class="field-hint">Element Scale</span>
        <input type="range" name="element-scale" id="element-scale" min={0.5} max={1} step="0.01" bind:value={elementScale} style="--fill: {recuperationFillPercent}%">
      </label>
    </fieldset>
    <fieldset id="select-modbus">
      <legend>Modbus Table, Node Path Prefix, Element Map</legend>
      <label class="input-group" for="modbus-table-selection">
        <select id="modbus-table-selection" name="modbus-table-selection" bind:value={selectModbusTable}>
          <option value="empty">Empty</option>
          <option value="carel">Carel</option>
          
        </select>
        <input id="node-path-prefix" type="text" bind:value={nodePathPrefix}>
        <input id="element-map" type="text" bind:value={elementMapLocation}>
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

        <polyline points="{xLeft},{exhaustY} {xCenter},{exhaustY}" fill="none" stroke="#EF4444" stroke-width="10"/>
        {#each exhaustLineLayout.shapes as shape (shape.key)}
          <use href="#icon-{shape.type}" x={shape.x} y={shape.y + shape.offset} width={shape.width} height={shape.height} />
        {/each}

        <polyline points="{xLeft},{intakeY} {xCenter},{intakeY}" fill="none" stroke="#22C55E" stroke-width="10"/>
        {#each intakeLineLayout.shapes as shape (shape.key)}
          <use href="#icon-{shape.type}" x={shape.x} y={shape.y + shape.offset} width={shape.width} height={shape.height} />
          {/each}
          
          <polyline points="{xRight},{yTop} {xCenter},{yTop}" fill="none" stroke="#F59E0B" stroke-width="10"/>
        {#each returnLineLayout.shapes as shape (shape.key)}
        <use href="#icon-{shape.type}" x={shape.x} y={shape.y + shape.offset} width={shape.width} height={shape.height} />
        {/each}

        <polyline points="{xRight},{yBottom} {xCenter},{yBottom}" fill="none" stroke="#3B82F6" stroke-width="10"/>
        {#each supplyLineLayout.shapes as shape (shape.key)}
        <use href="#icon-{shape.type}" x={shape.x} y={shape.y + shape.offset} width={shape.width} height={shape.height} />
        {/each}
        
        
        <polyline points="{xLeft - 10},{exhaustY - 10} {xLeft - 30},{exhaustY} {xLeft - 10},{exhaustY + 10}" fill="none" stroke="#EF4444" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="{xLeft - 30},{intakeY - 10} {xLeft - 10},{intakeY} {xLeft - 30},{intakeY + 10}" fill="none" stroke="#22C55E" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="{xRight + 30},{yTop - 10} {xRight + 10},{yTop} {xRight + 30},{yTop + 10}" fill="none" stroke="#F59E0B" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="{xRight + 10},{yBottom - 10} {xRight + 30},{yBottom} {xRight + 10},{yBottom + 10}" fill="none" stroke="#3B82F6" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        
        <use href={`#icon-${selectedRecuperation}`} x={(recuperationUnitX) - (recuperationUnitWidth/2)} y={(displayHeight/2) - (recuperationUnitHeight/2)} width={recuperationUnitWidth} height={recuperationUnitHeight} />
        </svg>
    </div>
  </div>
</div>