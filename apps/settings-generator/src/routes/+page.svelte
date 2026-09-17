<script>
  import { base } from "$app/paths";
  let padding = $state(40);
  let paddingSettings = $state(40);
  let paddingElements = $state(38);

  const titleFontSize = 32;
  const settingsWidthMax = 1200;
  const shadowMargin = 10;

  const INPUT_FONT_SIZES = [6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

  let rowFontSize = $state(22);
  let inputFontSize = $state(20);

  const OBJECT_DISPLAY_MAP = {
    dropdown: {
      path: "SYSTEM.LIBRARY.ATVISE.OBJECTDISPLAYS.Advanced.combobox",
      width: 160,
      height: 40,
      takesFontSize: true,
    },
    value: {
      path: "SYSTEM.LIBRARY.ATVISE.OBJECTDISPLAYS.Advanced.in_out_value",
      width: 160,
      height: 40,
      takesFontSize: true,
    },
    switch: {
      path: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.8.%20Kontrola%20in%20Prikaz.Stikalo",
      width: 125,
      height: 65,
      takesFontSize: false,
    },
  };

  const BUTTON_DISPLAY_MAP = {
    close: {
      path: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.4.%20Gumbi.Round_Buttons.Close_Popup",
      width: 120,
      height: 120,
    },
    general: {
      path: "SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.4.%20Gumbi.Round_Buttons.Button",
      width: 120,
      height: 120,
    },
  };

  const CLOSE_BUTTON = {
    radius: 50 / 120,
    arm: 12.5368 / 120,
    stroke: 3.6328 / 120,
    fill: "#EF4444",
  };

  const GEAR_SIZE = 512;
  const GEAR_EXTENT = 0.34;
  const GEAR_FILL = "#334155";
  const GEAR_PATH = "M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z";

  const ascentRatio = 0.927;
  const centralRatio = (0.927 - 0.244) / 2;
  let elementWidth = $state(240);
  let elementHeight = $state(40);
  const switchAspect = OBJECT_DISPLAY_MAP.switch.width / OBJECT_DISPLAY_MAP.switch.height;
  let switchWidth = $derived(Math.round(elementHeight * switchAspect));

  const settingsShadow = "filter:drop-shadow(0px 5px 5px rgba(0, 0, 0, 0.2))";

  let buildMode = $state("full");
  let isFull = $derived(buildMode === "full");

  let backgroundFill = $state({
    mode: "gradient",
    color: "#E6E9EF",
    from: "#F8FAFC",
    to: "#F1F5F9",
    angle: 0,
    start: 0.0675583,
    end: 1.27408,
  });

  let settingsFill = $state({
    mode: "solid",
    color: "#FFFFFF",
    from: "#FFFFFF",
    to: "#E2E8F0",
    angle: 0,
    start: 0,
    end: 1,
  });

  function gradientAxis(angle, start = 0, end = 1){
    const radians = (angle * Math.PI) / 180;
    const dx = Math.sin(radians);
    const dy = Math.cos(radians);
    return {
      x1: round4(0.5 + dx * (start - 0.5)),
      y1: round4(0.5 + dy * (start - 0.5)),
      x2: round4(0.5 + dx * (end - 0.5)),
      y2: round4(0.5 + dy * (end - 0.5)),
    };
  }

  function fillRef(fill, id){
    return fill.mode === "gradient" ? `url(#${id})` : fill.color;
  }

  let backgroundFillRef = $derived(fillRef(backgroundFill, "background_gradient"));
  let settingsFillRef = $derived(fillRef(settingsFill, "settings_gradient"));

  let settingsTitle = $state("Naslov");
  let settingsBackgroundStroke = $state("#9CA9BF");

  let settingsList = $state([]);

  let buttonsList = $state([]);
  let buttonSize = $state(80);
  const buttonGap = 12;

  let settingsWidht = $state(600);
  let settingsWidthMin = $derived(paddingSettings * 2 + elementWidth + 80);

  let rowStep = $derived(elementHeight + paddingElements);
  let rowsHeight = $derived(
    settingsList.length === 0
      ? 0
      : settingsList.length * elementHeight + (settingsList.length - 1) * paddingElements
  );
  let settingsHeight = $derived(paddingSettings * 2 + rowsHeight);

  let canvasMargin = $derived(isFull ? padding : shadowMargin);
  let titleY = $derived(canvasMargin);
  let headerHeight = $derived(
    buttonsList.length === 0 ? titleFontSize : Math.max(titleFontSize, buttonSize)
  );
  let headerCenterY = $derived(titleY + headerHeight / 2);
  let titleBaselineY = $derived(headerCenterY + titleFontSize * centralRatio);
  let settingsX = $derived(canvasMargin);
  let settingsY = $derived(
    isFull ? canvasMargin + headerHeight + canvasMargin : canvasMargin
  );
  let displayWidth = $derived(settingsWidht + canvasMargin * 2);
  let displayHeight = $derived(settingsY + settingsHeight + canvasMargin);

  let contentLeft = $derived(settingsX + paddingSettings);
  let contentRight = $derived(settingsX + settingsWidht - paddingSettings);

  function settingId(setting, index){
    const slug = setting.title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase();
    return `${slug || "setting"}_${index + 1}`;
  }

  let rows = $derived(settingsList.map((setting, index) => {
    const top = settingsY + paddingSettings + index * rowStep;
    const width = setting.type === "switch" ? switchWidth : elementWidth;
    return {
      setting,
      id: settingId(setting, index),
      top,
      width,
      x: contentRight - width,
      baselineY: top + elementHeight / 2 + rowFontSize * centralRatio,
      dividerY: top - paddingElements / 2,
    };
  }));

  let buttons = $derived.by(() => {
    if (!isFull) return [];
    let taken = { left: 0, right: 0 };
    return buttonsList.map((button, index) => {
      const slot = taken[button.side]++;
      const inset = slot * (buttonSize + buttonGap);
      return {
        button,
        id: `${button.type}_button_${index + 1}`,
        x: button.side === "left"
          ? settingsX + inset
          : settingsX + settingsWidht - buttonSize - inset,
        y: headerCenterY - buttonSize / 2,
      };
    });
  });

  function addButton(){
    buttonsList.push({type: "close", side: "right"});
  }

  function removeButton(){
    buttonsList.pop();
  }

  function addSetting(){
    settingsList.push({title: "Title", type: "dropdown", value: ""});
  }

  function removeSetting(){
    settingsList.pop();
  }

  function readHex(event, current){
    const value = event.currentTarget.value.trim();
    const next = /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : current;
    event.currentTarget.value = next;
    return next;
  }

  function escapeXml(value){
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function round4(value){
    return Number(value.toFixed(4));
  }

  function buildDefs(){
    const gradients = [
      [backgroundFill, "background_gradient", isFull],
      [settingsFill, "settings_gradient", true],
    ]
      .filter(([fill, , include]) => include && fill.mode === "gradient")
      .map(([fill, id]) => {
        const axis = gradientAxis(fill.angle, fill.start, fill.end);
        return `<linearGradient gradientUnits="objectBoundingBox" id="${id}" x1="${axis.x1}" x2="${axis.x2}" y1="${axis.y1}" y2="${axis.y2}">
      <stop offset="0" stop-color="${fill.from}"/>
      <stop offset="1" stop-color="${fill.to}"/>
    </linearGradient>`;
      });

    return gradients.length === 0
      ? "<defs/>"
      : `<defs>\n    ${gradients.join("\n    ")}\n  </defs>`;
  }

  function buildAtviseSvg(){
    const objects = rows.map((row, index) => {
      const id = escapeXml(row.id);
      const display = OBJECT_DISPLAY_MAP[row.setting.type];
      const scaleX = round4(row.width / display.width);
      const scaleY = round4(elementHeight / display.height);
      const divider = index === 0
        ? ""
        : `<line fill="none" id="${id}_divider" stroke="#E2E8F0" stroke-width="1" x1="${contentLeft}" x2="${contentRight}" y1="${row.dividerY}" y2="${row.dividerY}"/>\n  `;
      const label = `<text atv:refpx="${contentLeft}" atv:refpy="${row.baselineY}" fill="#1E293B" font-family="Roboto" font-size="${rowFontSize}" id="${id}_title" text-anchor="start" x="${contentLeft}" y="${row.baselineY}">${escapeXml(row.setting.title)}</text>`;
      const args = display.takesFontSize
        ? `<atv:argument name="fontSize" value="${inputFontSize}"/>`
        : "";
      const placedX = round4(row.x / scaleX);
      const placedY = round4(row.top / scaleY);
      const openTag = `<svg atv:refpx="${row.x + row.width / 2}" atv:refpy="${row.top + elementHeight / 2}" height="${display.height}" id="${id}" transform="matrix(${scaleX},0,0,${scaleY},0,0)" width="${display.width}" x="${placedX}" xlink:href="${display.path}" y="${placedY}"`;
      const control = args ? `${openTag}>${args}</svg>` : `${openTag}/>`;
      return `${divider}${label}\n  ${control}`;
    }).join("\n  ");

    const buttonObjects = buttons.map((entry) => {
      const display = BUTTON_DISPLAY_MAP[entry.button.type];
      const scale = round4(buttonSize / display.width);
      return `<svg atv:refpx="${entry.x + buttonSize / 2}" atv:refpy="${entry.y + buttonSize / 2}" height="${display.height}" id="${entry.id}" transform="matrix(${scale},0,0,${scale},0,0)" width="${display.width}" x="${round4(entry.x / scale)}" xlink:href="${display.path}" y="${round4(entry.y / scale)}"/>`;
    }).join("\n  ");

    const body = [
      isFull
        ? `<rect atv:refpx="${displayWidth / 2}" atv:refpy="${displayHeight / 2}" fill="${backgroundFillRef}" height="${displayHeight}" id="background" width="${displayWidth}" x="0" y="0"/>`
        : "",
      isFull
        ? `<text atv:refpx="${displayWidth / 2}" atv:refpy="${titleBaselineY}" fill="#1E293B" font-family="Roboto" font-size="${titleFontSize}" font-weight="bold" id="title" text-anchor="middle" x="${displayWidth / 2}" y="${titleBaselineY}">${escapeXml(settingsTitle)}</text>`
        : "",
      buttonObjects,
      `<rect atv:refpx="${settingsX + settingsWidht / 2}" atv:refpy="${settingsY + settingsHeight / 2}" fill="${settingsFillRef}" height="${settingsHeight}" id="settings_background" rx="10" ry="10" stroke="${settingsBackgroundStroke}" stroke-width="1" style="${settingsShadow}" width="${settingsWidht}" x="${settingsX}" y="${settingsY}"/>`,
      objects,
    ].filter(Boolean).join("\n  ");

    return `<?xml version='1.0' encoding='UTF-8' standalone='no'?>
<svg height="${displayHeight}" version="1.2" width="${displayWidth}" xmlns="http://www.w3.org/2000/svg" xmlns:atv="http://webmi.atvise.com/2007/svgext" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:ns1="http://sozi.baierouge.fr" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:svg="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  ${buildDefs()}
  <metadata>
    <atv:gridconfig enabled="true" gridstyle="lines" height="20" width="20"/>
    <atv:snapconfig enabled="true" height="10" width="10"/>
  </metadata>
  ${body}
</svg>`;
  }

  let showDisplaySettings = $state(false);
  let displaySettingsEl;

  function closeOnOutsideClick(event){
    if (showDisplaySettings && !displaySettingsEl?.contains(event.target)) {
      showDisplaySettings = false;
    }
  }

  let copySuccess = $state(false);
  let copyTimer;

  async function handleConfiguration(){
    try {
      await navigator.clipboard.writeText(buildAtviseSvg());
      copySuccess = true;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => copySuccess = false, 2000);
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

  .display-settings {
    position: relative;
  }

  button.display-settings-toggle {
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

  button.display-settings-toggle:hover,
  button.display-settings-toggle.open {
    background: #eff6ff;
    border-color: #93c5fd;
    color: #1d4ed8;
  }

  button.display-settings-toggle:focus-visible {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  .display-settings-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .display-settings-panel {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 20;
    width: 320px;
    max-height: calc(100dvh - 160px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
    box-sizing: border-box;
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
  }

  svg.preview-svg {
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
    display: block;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
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

  .field-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
  }

  .field-row > .input-group,
  .field-row > input[type="text"],
  .field-row > select {
    flex: 1 1 0;
    min-width: 0;
  }

  .field-row > input[type="color"] {
    flex: 0 0 44px;
    width: 44px;
    height: 38px;
    padding: 2px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background-color: #FFFFFF;
    box-sizing: border-box;
    cursor: pointer;
  }

  .field-row > .row-sep {
    flex: 0 0 10px;
    text-align: center;
    font-size: 13px;
    color: #94a3b8;
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

  .preview-control {
    width: 100%;
    height: 100%;
  }

  .preview-control select,
  .preview-control input {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 0 12px;
    border: 1px solid #CBD5E1;
    border-radius: 6px;
    background-color: #FFFFFF;
    color: #334155;
    font-family: Roboto, 'Segoe UI', Arial, sans-serif;
    font-size: var(--input-font-size, 18px);
    cursor: pointer;
  }

  .preview-control input.value-field {
    text-align: center;
  }

  .preview-control .preview-switch {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    height: 100%;
    padding: 4%;
    box-sizing: border-box;
    border: none;
    border-radius: 999px;
    background-color: #9CA9BF;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .preview-control .preview-switch.on {
    justify-content: flex-end;
    background-color: #22C55E;
  }

  .preview-control .preview-switch .knob {
    height: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 50%;
    background-color: #FFFFFF;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  }

  .selection-section input[type="text"],
  .selection-section select,
  .display-settings-panel input[type="text"],
  .display-settings-panel input[type="number"],
  .display-settings-panel select {
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

  input[type="range"] {
    --track-height: 6px;
    --track-border: 1px;
    --thumb-size: 12px;
    --thumb-border: 2px;

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

  input[type="range"]::-webkit-slider-runnable-track {
    height: var(--track-height);
    border-radius: 999px;
    border: var(--track-border) solid #cbd5e1;
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
    width: var(--thumb-size);
    height: var(--thumb-size);
    margin-top: calc(
      (var(--track-height) + 2 * var(--track-border)
        - var(--thumb-size) - 2 * var(--thumb-border)) / 2
    );
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

  .button-secition{
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  button.add-setting,
  button.remove-setting {
    display: flex;
    flex: 1 1 0;
    min-width: 0;
    height: 38px;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px dashed #cbd5e1;
    border-radius: 6px;
    background-color: #ffffff;
    color: #475569;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    box-sizing: border-box;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  button.add-setting:hover {
    border-color: #2563eb;
    background-color: #eff6ff;
    color: #2563eb;
  }

  button.add-setting:focus-visible {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  button.remove-setting:hover:not(:disabled) {
    border-color: #dc2626;
    background-color: #fef2f2;
    color: #dc2626;
  }

  button.remove-setting:focus-visible {
    outline: none;
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.25);
  }

  button.remove-setting:disabled {
    border-color: #e2e8f0;
    background-color: #f8fafc;
    color: #cbd5e1;
    cursor: not-allowed;
  }

  button.add-setting .plus,
  button.remove-setting .minus {
    font-size: 16px;
    line-height: 1;
  }

  button.configure {
    flex: 0 0 auto;
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
</style>

<title>Auto Settings</title>

{#snippet fillControls(fill, idPrefix)}
  <label class="input-group" for="{idPrefix}-fill-mode">
    <select id="{idPrefix}-fill-mode" bind:value={fill.mode}>
      <option value="solid">Solid colour</option>
      <option value="gradient">Gradient</option>
    </select>
  </label>

  {#if fill.mode === "gradient"}
    <div class="field-row">
      <input type="color" bind:value={fill.from} aria-label="Gradient start">
      <input type="text" value={fill.from} onchange={(e) => fill.from = readHex(e, fill.from)}>
    </div>
    <div class="field-row">
      <input type="color" bind:value={fill.to} aria-label="Gradient end">
      <input type="text" value={fill.to} onchange={(e) => fill.to = readHex(e, fill.to)}>
    </div>
    <label class="input-group" for="{idPrefix}-fill-angle">
      <input id="{idPrefix}-fill-angle" type="range" min="0" max="360" step="15" bind:value={fill.angle}
             style="--fill: {(fill.angle / 360) * 100}%">
      <span class="field-hint">{fill.angle}° · 0 sweeps down, 90 sweeps right</span>
    </label>
  {:else}
    <div class="field-row">
      <input type="color" bind:value={fill.color} aria-label="Fill colour">
      <input type="text" value={fill.color} onchange={(e) => fill.color = readHex(e, fill.color)}>
    </div>
  {/if}
{/snippet}

<svelte:window onclick={closeOnOutsideClick} onkeydown={(e) => { if (e.key === "Escape") showDisplaySettings = false; }}/>

<div class="header">
  <div class="logo-section">
    <img class="logo" src="{base}/logo.svg" alt="Auto Settings logo">
    <div class="title">
      <div class="title">Auto Settings</div>
      <div class="subtitle" title="commit {__APP_COMMIT__}">Automatic Settings Generator {__APP_VERSION__}</div>
    </div>
  </div>

  <div class="display-settings" bind:this={displaySettingsEl}>
    <button class="display-settings-toggle" class:open={showDisplaySettings} type="button"
            aria-expanded={showDisplaySettings} aria-controls="display-settings-panel"
            onclick={() => showDisplaySettings = !showDisplaySettings}>
      <svg class="display-settings-icon" viewBox="0 0 {GEAR_SIZE} {GEAR_SIZE}" fill="currentColor" aria-hidden="true">
        <path d={GEAR_PATH}/>
      </svg>
      Display Settings
    </button>

    {#if showDisplaySettings}
      <div class="display-settings-panel" id="display-settings-panel">
        <fieldset id="select-element-size" class="field-row">
          <legend>Input Element Size</legend>
          <label class="input-group" for="element-width">
            <span class="field-hint">Width</span>
            <input id="element-width" type="number" min="40" step="10" bind:value={elementWidth}>
          </label>
          <span class="row-sep" aria-hidden="true">x</span>
          <label class="input-group" for="element-height">
            <span class="field-hint">Height</span>
            <input id="element-height" type="number" min="20" step="2" bind:value={elementHeight}>
          </label>
        </fieldset>

        <fieldset id="select-font-size" class="field-row">
          <legend>Font Size</legend>
          <label class="input-group" for="row-font-size">
            <span class="field-hint">Label</span>
            <input id="row-font-size" type="number" min="8" step="1" bind:value={rowFontSize}>
          </label>
          <label class="input-group" for="input-font-size">
            <span class="field-hint">Input</span>
            <select id="input-font-size" bind:value={inputFontSize}>
              {#each INPUT_FONT_SIZES as size}
                <option value={size}>{size}</option>
              {/each}
            </select>
          </label>
        </fieldset>

        {#if isFull}
          <fieldset id="select-button-size">
            <legend>Title Button Size</legend>
            <label class="input-group" for="button-size">
              <span class="field-hint">Diameter, in canvas units</span>
              <input id="button-size" type="number" min="16" step="4" bind:value={buttonSize}>
            </label>
          </fieldset>

          <fieldset id="select-canvas-fill">
            <legend>Canvas Background</legend>
            {@render fillControls(backgroundFill, "canvas")}
          </fieldset>
        {/if}

        <fieldset id="select-settings-fill">
          <legend>Settings Box</legend>
          {@render fillControls(settingsFill, "settings")}
          <label class="input-group" for="settings-stroke">
            <span class="field-hint">Border</span>
            <div class="field-row">
              <input id="settings-stroke" type="color" bind:value={settingsBackgroundStroke}>
              <input type="text" value={settingsBackgroundStroke}
                     onchange={(e) => settingsBackgroundStroke = readHex(e, settingsBackgroundStroke)}>
            </div>
          </label>
        </fieldset>
      </div>
    {/if}
  </div>
</div>


<div class="app-layout">
  <div class="selection-section">
    <fieldset id="select-build-mode">
      <legend>Build</legend>
      <select id="build-mode" bind:value={buildMode}>
        <option value="full">Full display</option>
        <option value="section">Settings section only</option>
      </select>
    </fieldset>

    {#if isFull}
      <fieldset id="select-title">
        <legend>Display Title</legend>
        <input id="title" type="text" bind:value={settingsTitle}>
      </fieldset>

      <fieldset id="title-buttons">
        <legend>Title Buttons</legend>
        <div class="button-secition">
          <button class="add-setting" type="button" onclick={addButton}>
            <span class="plus" aria-hidden="true">+</span>
            Add button
          </button>
          <button class="remove-setting" type="button" onclick={removeButton} disabled={buttonsList.length === 0}>
            <span class="minus" aria-hidden="true">−</span>
            Remove button
          </button>
        </div>
        {#each buttonsList as button}
          <div class="field-row setting-row">
            <select bind:value={button.type}>
              <option value="close">Close window</option>
              <option value="general">Round button</option>
            </select>
            <span class="row-sep" aria-hidden="true">:</span>
            <select bind:value={button.side}>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
        {/each}
      </fieldset>
    {/if}


    <fieldset id="select-settings-width">
      <legend>Settings Window Width</legend>
      <label class="input-group" for="settings-width">
        <input id="settings-width" type="range" min={settingsWidthMin} max={settingsWidthMax} step="10"
               bind:value={settingsWidht}
               style="--fill: {((settingsWidht - settingsWidthMin) / (settingsWidthMax - settingsWidthMin)) * 100}%">
        <span class="field-hint">{settingsWidht} px wide · canvas {displayWidth} × {displayHeight}</span>
      </label>
    </fieldset>

    <fieldset id="settings-list" >
      <legend>Settings List</legend>
      <div class="button-secition">
        <button class="add-setting" type="button" onclick={addSetting}>
          <span class="plus" aria-hidden="true">+</span>
          Add setting
        </button>
        <button class="remove-setting" type="button" onclick={removeSetting} disabled={settingsList.length === 0}>
          <span class="minus" aria-hidden="true">−</span>
          Remove setting
        </button>
      </div>
      {#each settingsList as setting}
        <div class="field-row setting-row">
          <input type="text" bind:value={setting.title}>
          <span class="row-sep" aria-hidden="true">:</span>
          <select bind:value={setting.type}>
            <option value="value">Value</option>
            <option value="dropdown">Dropdown</option>
            <option value="switch">Switch</option>
          </select>
        </div>
      {/each}
    </fieldset>

    <button class="configure" class:copied={copySuccess} type="button" onclick={handleConfiguration}>
      {copySuccess ? "Copied to Clipboard" : "Configure Display"}
    </button>
  </div>

  <div class="viewer-section">
    <h2>Live Preview</h2>
    <div class="svg-container">
      <svg class="preview-svg" width="{displayWidth}" height="{displayHeight}" viewBox="0 0 {displayWidth} {displayHeight}">
        <defs>
          {#if isFull && backgroundFill.mode === "gradient"}
            {@const axis = gradientAxis(backgroundFill.angle, backgroundFill.start, backgroundFill.end)}
            <linearGradient gradientUnits="objectBoundingBox" id="background_gradient" x1={axis.x1} x2={axis.x2} y1={axis.y1} y2={axis.y2}>
              <stop offset="0" stop-color={backgroundFill.from}/>
              <stop offset="1" stop-color={backgroundFill.to}/>
            </linearGradient>
          {/if}
          {#if settingsFill.mode === "gradient"}
            {@const axis = gradientAxis(settingsFill.angle, settingsFill.start, settingsFill.end)}
            <linearGradient gradientUnits="objectBoundingBox" id="settings_gradient" x1={axis.x1} x2={axis.x2} y1={axis.y1} y2={axis.y2}>
              <stop offset="0" stop-color={settingsFill.from}/>
              <stop offset="1" stop-color={settingsFill.to}/>
            </linearGradient>
          {/if}
        </defs>
        {#if isFull}
          <rect x="0" y="0" width="{displayWidth}" height="{displayHeight}" fill="{backgroundFillRef}"/>
          <text x={displayWidth / 2} y="{titleBaselineY}" font-family="Roboto" font-size={titleFontSize} font-weight="bold" fill="#1E293B" text-anchor="middle">{settingsTitle}</text>
        {/if}
        {#each buttons as entry}
          {@const cx = entry.x + buttonSize / 2}
          {@const cy = entry.y + buttonSize / 2}
          {@const radius = buttonSize * CLOSE_BUTTON.radius}
          {#if entry.button.type === "close"}
            {@const arm = buttonSize * CLOSE_BUTTON.arm}
            <circle cx={cx} cy={cy} r={radius} fill={CLOSE_BUTTON.fill}/>
            <path d="M {cx - arm} {cy - arm} L {cx + arm} {cy + arm} M {cx + arm} {cy - arm} L {cx - arm} {cy + arm}"
                  stroke="#FFFFFF" stroke-width={buttonSize * CLOSE_BUTTON.stroke}
                  stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          {:else}
            {@const gear = buttonSize * GEAR_EXTENT}
            <circle cx={cx} cy={cy} r={radius} fill={settingsFillRef}
                    stroke={settingsBackgroundStroke} stroke-width="1" style={settingsShadow}/>
            <path d={GEAR_PATH} fill={GEAR_FILL}
                  transform="translate({cx - gear / 2} {cy - gear / 2}) scale({gear / GEAR_SIZE})"/>
          {/if}
        {/each}
        <rect x={settingsX} y={settingsY} fill="{settingsFillRef}" height="{settingsHeight}" id="settings_background" stroke="{settingsBackgroundStroke}" stroke-width="1" rx="10" ry="10" style={settingsShadow} width="{settingsWidht}"/>
        {#each rows as row, index}
          {#if index > 0}
            <line x1={contentLeft} x2={contentRight} y1={row.dividerY} y2={row.dividerY} stroke="#E2E8F0" stroke-width="1"/>
          {/if}
          <text x={contentLeft} y={row.baselineY} font-family="Roboto" font-size={rowFontSize} fill="#1E293B" text-anchor="start">{row.setting.title}</text>
          <foreignObject x={row.x} y={row.top} width={row.width} height={elementHeight}>
            <div xmlns="http://www.w3.org/1999/xhtml" class="preview-control" style="--input-font-size: {inputFontSize}px">
              {#if row.setting.type === "dropdown"}
                <select bind:value={row.setting.value}>
                  <option value="">Combobox</option>
                </select>
              {:else if row.setting.type === "switch"}
                <button class="preview-switch" class:on={row.setting.value === true} type="button"
                        role="switch" aria-checked={row.setting.value === true} aria-label={row.setting.title}
                        onclick={() => row.setting.value = row.setting.value !== true}>
                  <span class="knob"></span>
                </button>
              {:else}
                <input type="text" class="value-field" placeholder="In/Out Value" bind:value={row.setting.value}>
              {/if}
            </div>
          </foreignObject>
        {/each}
      </svg>
    </div>
  </div>
</div>
