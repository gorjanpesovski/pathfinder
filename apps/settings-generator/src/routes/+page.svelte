<script>
  import { base } from "$app/paths";
  import { prefersReducedMotion } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import HeaderMenu from "$lib/components/HeaderMenu.svelte";
  import Modal from "$lib/components/Modal.svelte";

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

  let columns = $state([{ key: 0, sections: [{ key: -1, settings: [] }] }]);

  let buttonsList = $state([]);
  let buttonSize = $state(80);
  const buttonGap = 12;

  let settingsWidht = $state(600);
  let settingsWidthMin = $derived(paddingSettings * 2 + elementWidth + 80);

  let rowStep = $derived(elementHeight + paddingElements);

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
  let visibleColumns = $derived(isFull ? columns : [{ key: columns[0].key, sections: columns[0].sections.slice(0, 1) }]);
  let displayWidth = $derived(visibleColumns.length * settingsWidht + (visibleColumns.length - 1) * canvasMargin + canvasMargin * 2);

  function settingId(setting, index, sectionIndex){
    const slug = setting.title
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^\w]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase();
    const prefix = sectionIndex === 0 ? "" : `section${sectionIndex + 1}_`;
    return `${prefix}${slug || "setting"}_${index + 1}`;
  }

  let layout = $derived.by(() => {
    const entries = [];
    visibleColumns.forEach((column, columnIndex) => {
      const x = settingsX + columnIndex * (settingsWidht + canvasMargin);
      const contentLeft = x + paddingSettings;
      const contentRight = x + settingsWidht - paddingSettings;
      let y = settingsY;
      column.sections.forEach((section) => {
        const sectionIndex = entries.length;
        const count = section.settings.length;
        const height = paddingSettings * 2 + (count === 0 ? 0 : count * elementHeight + (count - 1) * paddingElements);
        const rows = section.settings.map((setting, index) => {
          const top = y + paddingSettings + index * rowStep;
          const width = setting.type === "switch" ? switchWidth : elementWidth;
          return {
            setting,
            id: settingId(setting, index, sectionIndex),
            top,
            width,
            x: contentRight - width,
            labelX: contentLeft,
            baselineY: top + elementHeight / 2 + rowFontSize * centralRatio,
            dividerY: top - paddingElements / 2,
          };
        });
        entries.push({ section, column, index: sectionIndex, x, y, height, rows, contentLeft, contentRight });
        y += height + canvasMargin;
      });
    });
    return entries;
  });

  let columnEnds = $derived(visibleColumns.map((column) => {
    const entries = layout.filter((entry) => entry.column.key === column.key);
    const last = entries[entries.length - 1];
    return { column, x: last.x, bottom: last.y + last.height };
  }));

  let displayHeight = $derived(Math.max(...columnEnds.map((end) => end.bottom)) + canvasMargin);

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
          : displayWidth - canvasMargin - buttonSize - inset,
        y: headerCenterY - buttonSize / 2,
      };
    });
  });

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

  // Every display atvise writes itself carries an empty ecmascript node, and so
  // does the Auto AHU generator. Leaving it out is what breaks re-saving: the
  // first save takes, but reopening and editing the display gives Builder no
  // script node to write back to, and the save is refused.
  const ATVISE_SCRIPT = `<script atv:desc="" atv:name="" type="text/ecmascript"/>`;

  function buildAtviseSvg(){
    const sectionObjects = layout.map((entry) => {
      const suffix = entry.index === 0 ? "" : `_${entry.index + 1}`;
      const background = `<rect atv:refpx="${entry.x + settingsWidht / 2}" atv:refpy="${entry.y + entry.height / 2}" fill="${settingsFillRef}" height="${entry.height}" id="settings_background${suffix}" rx="10" ry="10" stroke="${settingsBackgroundStroke}" stroke-width="1" style="${settingsShadow}" width="${settingsWidht}" x="${entry.x}" y="${entry.y}"/>`;
      const objects = entry.rows.map((row, index) => {
        const id = escapeXml(row.id);
        const display = OBJECT_DISPLAY_MAP[row.setting.type];
        const scaleX = round4(row.width / display.width);
        const scaleY = round4(elementHeight / display.height);
        const divider = index === 0
          ? ""
          : `<line fill="none" id="${id}_divider" stroke="#E2E8F0" stroke-width="1" x1="${entry.contentLeft}" x2="${entry.contentRight}" y1="${row.dividerY}" y2="${row.dividerY}"/>\n  `;
        const label = `<text atv:refpx="${entry.contentLeft}" atv:refpy="${row.baselineY}" fill="#1E293B" font-family="Roboto" font-size="${rowFontSize}" id="${id}_title" text-anchor="start" x="${entry.contentLeft}" y="${row.baselineY}">${escapeXml(row.setting.title)}</text>`;
        const args = display.takesFontSize
          ? `<atv:argument name="fontSize" value="${inputFontSize}"/>`
          : "";
        const placedX = round4(row.x / scaleX);
        const placedY = round4(row.top / scaleY);
        const openTag = `<svg atv:refpx="${row.x + row.width / 2}" atv:refpy="${row.top + elementHeight / 2}" height="${display.height}" id="${id}" transform="matrix(${scaleX},0,0,${scaleY},0,0)" width="${display.width}" x="${placedX}" xlink:href="${display.path}" y="${placedY}"`;
        const control = args ? `${openTag}>${args}</svg>` : `${openTag}/>`;
        return `${divider}${label}\n  ${control}`;
      }).join("\n  ");
      return [background, objects].filter(Boolean).join("\n  ");
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
      sectionObjects,
    ].filter(Boolean).join("\n  ");

    return `<?xml version='1.0' encoding='UTF-8' standalone='no'?>
<svg height="${displayHeight}" version="1.2" width="${displayWidth}" xmlns="http://www.w3.org/2000/svg" xmlns:atv="http://webmi.atvise.com/2007/svgext" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:ns1="http://sozi.baierouge.fr" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:svg="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  ${buildDefs()}
  <metadata>
    <atv:gridconfig enabled="true" gridstyle="lines" height="20" width="20"/>
    <atv:snapconfig enabled="true" height="10" width="10"/>
  </metadata>
  ${ATVISE_SCRIPT}
  ${body}
</svg>`;
  }

  function appear(node, { duration = 240, dy = 6, delay = 0 } = {}) {
    if (prefersReducedMotion.current) return { duration: 0 };
    return {
      delay,
      duration,
      easing: cubicOut,
      css: (t, u) => `opacity: ${t}; transform: translate(0, ${u * dy}px);`
    };
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

  const SETTING_TYPES = [
    { id: "value", label: "Value" },
    { id: "dropdown", label: "Dropdown" },
    { id: "switch", label: "Switch" },
  ];

  const BUTTON_TYPES = [
    { id: "close", label: "Close window" },
    { id: "general", label: "Round button" },
  ];

  const DRAG_THRESHOLD = 6;
  const MARKER_RADIUS = 11;
  const HANDLE_WIDTH = 14;

  let nextKey = 1;
  let previewSvg = $state(null);
  let viewer = $state(null);
  let viewportTick = $state(0);
  let picker = $state(null);
  let selected = $state(null);
  let editingTitle = $state(false);
  let editingLabel = $state(null);
  let settingsOpen = $state(false);
  let hovered = null;
  let press = null;
  let resizing = $state(null);
  let dragging = $state(null);

  function findSetting(key){
    for (const column of columns) {
      for (const section of column.sections) {
        const setting = section.settings.find((entry) => entry.key === key);
        if (setting) return { section, setting };
      }
    }
    return null;
  }

  function findRow(key){
    for (const entry of layout) {
      const row = entry.rows.find((candidate) => candidate.setting.key === key);
      if (row) return row;
    }
    return null;
  }

  let selectedRow = $derived(selected?.kind === "setting" ? findRow(selected.key) : null);
  let labelRow = $derived(editingLabel === null ? null : findRow(editingLabel));
  let selectedButton = $derived(selected?.kind === "button" ? buttons.find((entry) => entry.button.key === selected.key) ?? null : null);

  let insertSlots = $derived(layout.flatMap((entry) => {
    const x = entry.x + settingsWidht / 2;
    const slot = (index, y) => ({ id: `${entry.section.key}:${index}`, section: entry.section, index, x, y });
    if (entry.rows.length === 0) return [slot(0, entry.y + entry.height / 2)];
    return [
      slot(0, entry.y + paddingSettings / 2),
      ...entry.rows.slice(1).map((row, index) => slot(index + 1, row.dividerY)),
      slot(entry.rows.length, entry.y + entry.height - paddingSettings / 2),
    ];
  }));

  let buttonSlots = $derived.by(() => {
    if (!isFull) return [];
    const count = (side) => buttonsList.filter((button) => button.side === side).length;
    const step = buttonSize + buttonGap;
    return [
      { side: "left", x: settingsX + count("left") * step + buttonSize / 2, y: headerCenterY },
      { side: "right", x: displayWidth - canvasMargin - count("right") * step - buttonSize / 2, y: headerCenterY },
    ];
  });

  function toLocal(x, y){
    viewportTick;
    displayWidth;
    displayHeight;
    const matrix = previewSvg.getScreenCTM();
    const frame = viewer.getBoundingClientRect();
    return { left: matrix.a * x + matrix.e - frame.left, top: matrix.d * y + matrix.f - frame.top, scale: matrix.a };
  }

  function toSvgY(clientY){
    const matrix = previewSvg.getScreenCTM();
    return (clientY - matrix.f) / matrix.d;
  }

  function closeOverlays(){
    picker = null;
    selected = null;
    editingTitle = false;
    editingLabel = null;
  }

  function openPicker(next){
    selected = null;
    editingTitle = false;
    editingLabel = null;
    picker = picker?.side === next.side ? null : next;
  }

  function insertSetting(section, index){
    closeOverlays();
    section.settings.splice(index, 0, { key: nextKey++, title: "Title", type: "dropdown", value: "" });
  }

  function addSection(column){
    closeOverlays();
    column.sections.push({ key: nextKey++, settings: [] });
  }

  function addColumn(side){
    closeOverlays();
    const column = { key: nextKey++, sections: [{ key: nextKey++, settings: [] }] };
    if (side === "left") columns.unshift(column);
    else columns.push(column);
  }

  function removeSection(key){
    if (columns.reduce((sum, column) => sum + column.sections.length, 0) < 2) return;
    const column = columns.find((candidate) => candidate.sections.some((section) => section.key === key));
    const index = column.sections.findIndex((section) => section.key === key);
    if (column.sections[index].settings.length && !window.confirm("Remove this settings section and its settings?")) return;
    closeOverlays();
    column.sections.splice(index, 1);
    if (column.sections.length === 0) columns.splice(columns.indexOf(column), 1);
  }

  function addButtonOn(side, type){
    buttonsList.push({ key: nextKey++, type, side });
    picker = null;
  }

  function removeSetting(key){
    const found = findSetting(key);
    if (found) found.section.settings.splice(found.section.settings.indexOf(found.setting), 1);
    if (selected?.key === key) selected = null;
    if (editingLabel === key) editingLabel = null;
  }

  function removeButton(key){
    const index = buttonsList.findIndex((button) => button.key === key);
    if (index >= 0) buttonsList.splice(index, 1);
    if (selected?.key === key) selected = null;
  }

  function selectButton(key){
    picker = null;
    editingTitle = false;
    editingLabel = null;
    selected = selected?.key === key ? null : { kind: "button", key };
  }

  function pressRow(event, entry, row){
    if (event.button !== 0) return;
    press = {
      key: row.setting.key,
      section: entry.section,
      part: event.target.closest?.("[data-part]")?.dataset.part ?? null,
      clientY: event.clientY,
      startY: toSvgY(event.clientY),
      startTop: row.top,
      moved: false
    };
  }

  function pressResize(event, side){
    if (event.button !== 0) return;
    event.preventDefault();
    closeOverlays();
    resizing = { side, clientX: event.clientX, startWidth: settingsWidht, scale: previewSvg.getScreenCTM().a };
  }

  function movePointer(event){
    if (resizing) {
      const delta = (event.clientX - resizing.clientX) / resizing.scale * (resizing.side === "right" ? 2 : -2) / visibleColumns.length;
      const width = Math.round((resizing.startWidth + delta) / 10) * 10;
      settingsWidht = Math.max(settingsWidthMin, Math.min(settingsWidthMax, width));
      return;
    }
    if (!press) return;
    if (!press.moved) {
      if (Math.abs(event.clientY - press.clientY) < DRAG_THRESHOLD) return;
      press.moved = true;
      closeOverlays();
    }
    const list = press.section.settings;
    const entry = layout.find((candidate) => candidate.section.key === press.section.key);
    const firstTop = entry.y + paddingSettings;
    const wanted = press.startTop + toSvgY(event.clientY) - press.startY;
    const from = list.findIndex((setting) => setting.key === press.key);
    const to = Math.max(0, Math.min(list.length - 1, Math.round((wanted - firstTop) / rowStep)));
    if (to !== from) {
      const [setting] = list.splice(from, 1);
      list.splice(to, 0, setting);
    }
    dragging = { key: press.key, offset: wanted - (firstTop + to * rowStep) };
  }

  function releasePointer(){
    if (resizing) {
      resizing = null;
      return;
    }
    if (!press) return;
    const { key, moved, part } = press;
    press = null;
    if (moved) {
      dragging = null;
      return;
    }
    picker = null;
    editingTitle = false;
    if (part === "label") {
      selected = null;
      editingLabel = key;
    } else if (part === "control") {
      editingLabel = null;
      selected = selected?.key === key ? null : { kind: "setting", key };
    }
  }

  function startTitleEdit(event){
    event.preventDefault();
    picker = null;
    selected = null;
    editingLabel = null;
    editingTitle = true;
  }

  function focusInput(node){
    node.focus();
    node.select();
  }

  function handleKey(event){
    if (settingsOpen || defaultsOpen) return;
    if (event.key === "Escape") {
      closeOverlays();
      return;
    }
    if (event.target.closest?.("input, select, textarea")) return;
    const target = selected ?? hovered;
    if (target && (event.key === "Delete" || event.key === "Backspace")) {
      event.preventDefault();
      if (target.kind === "setting") removeSetting(target.key);
      else removeButton(target.key);
      hovered = null;
    }
  }

  function handleOutside(event){
    if (event.target.closest?.(".canvas-popover, .title-input, .label-input, [data-hit]")) return;
    closeOverlays();
  }

  function newDisplay(){
    const filled = buttonsList.length || layout.length > 1 || layout.some((entry) => entry.rows.length);
    if (filled && !window.confirm("Start a new display? The current settings and buttons will be removed.")) return;
    closeOverlays();
    columns.splice(0, columns.length, { key: nextKey++, sections: [{ key: nextKey++, settings: [] }] });
    buttonsList.length = 0;
    settingsTitle = "Naslov";
  }

  const DEFAULTS_KEY = "autoSettings.defaults";
  const SIDE_OFFSET = 22;

  function loadDefaults(){
    try {
      const stored = JSON.parse(localStorage.getItem(DEFAULTS_KEY) ?? "[]");
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }

  let savedDefaults = $state(loadDefaults());
  let defaultsOpen = $state(false);
  let defaultName = $state("");

  function storeDefaults(){
    try {
      localStorage.setItem(DEFAULTS_KEY, JSON.stringify(savedDefaults));
    } catch {}
  }

  function snapshot(){
    return $state.snapshot({
      title: settingsTitle,
      buildMode,
      width: settingsWidht,
      columns,
      buttons: buttonsList,
      elementWidth,
      elementHeight,
      rowFontSize,
      inputFontSize,
      buttonSize,
      backgroundFill,
      settingsFill,
      stroke: settingsBackgroundStroke
    });
  }

  function saveDefault(){
    const name = defaultName.trim();
    if (!name) return;
    const index = savedDefaults.findIndex((entry) => entry.name.toLowerCase() === name.toLowerCase());
    if (index >= 0 && !window.confirm(`Replace the saved default "${savedDefaults[index].name}"?`)) return;
    const entry = { name, savedAt: new Date().toISOString(), display: snapshot() };
    if (index >= 0) savedDefaults[index] = entry;
    else savedDefaults.push(entry);
    savedDefaults.sort((a, b) => a.name.localeCompare(b.name));
    storeDefaults();
    defaultName = "";
  }

  function rekey(display){
    return {
      columns: display.columns.map((column) => ({
        key: nextKey++,
        sections: column.sections.map((section) => ({
          key: nextKey++,
          settings: section.settings.map((setting) => ({ ...setting, key: nextKey++ }))
        }))
      })),
      buttons: display.buttons.map((button) => ({ ...button, key: nextKey++ }))
    };
  }

  function applyDefault(entry){
    const filled = buttonsList.length || layout.length > 1 || layout.some((section) => section.rows.length);
    if (filled && !window.confirm(`Load "${entry.name}"? The current display will be replaced.`)) return;
    const display = entry.display;
    const { columns: nextColumns, buttons: nextButtons } = rekey(display);
    closeOverlays();
    settingsTitle = display.title;
    buildMode = display.buildMode;
    elementWidth = display.elementWidth;
    elementHeight = display.elementHeight;
    rowFontSize = display.rowFontSize;
    inputFontSize = display.inputFontSize;
    buttonSize = display.buttonSize;
    backgroundFill = display.backgroundFill;
    settingsFill = display.settingsFill;
    settingsBackgroundStroke = display.stroke;
    columns = nextColumns;
    buttonsList = nextButtons;
    settingsWidht = display.width;
    defaultsOpen = false;
  }

  function deleteDefault(entry){
    if (!window.confirm(`Delete the saved default "${entry.name}"?`)) return;
    savedDefaults.splice(savedDefaults.indexOf(entry), 1);
    storeDefaults();
  }

  function settingCount(display){
    return display.columns.reduce((sum, column) => sum + column.sections.reduce((inner, section) => inner + section.settings.length, 0), 0);
  }

  let fileItems = $derived([
    { label: "New display", hint: "Start with an empty settings box", onclick: newDisplay },
    { separator: true },
    { label: "Save as default…", hint: "Keep this display to start from later, for example a fan coil unit", onclick: () => defaultsOpen = true },
    { label: "Load default…", hint: savedDefaults.length ? `${savedDefaults.length} saved` : "Nothing saved yet", onclick: () => defaultsOpen = true },
    { separator: true },
    { label: "Settings…", hint: "Element size, fonts and colours", onclick: () => settingsOpen = true },
  ]);
</script>


<style>
  :global(body) {
    height: 100dvh;
    width: 100vw;
    font-family: 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f1f5f9;
    color: #0f172a;
    box-sizing: border-box;
    overflow: hidden;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 44px;
    padding: 0 12px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    box-sizing: border-box;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .logo-section {
    display: flex;
    align-items: center;
  }

  .logo {
    height: 26px;
  }

  .menus {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .header-divider {
    width: 1px;
    height: 20px;
    background: #e2e8f0;
  }

  .app-name {
    font-size: 13px;
    font-weight: 500;
    color: #0f172a;
  }

  .export-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .export-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 14px;
    border: 1px solid #2563eb;
    border-radius: 6px;
    background: #2563eb;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    color: #ffffff;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .export-button:hover {
    background: #1d4ed8;
    border-color: #1d4ed8;
  }

  .export-button.copied {
    background: #16a34a;
    border-color: #16a34a;
  }

  .app-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    height: calc(100dvh - 44px);
    padding: 12px;
    box-sizing: border-box;
  }

  .viewer-section {
    position: relative;
    height: 100%;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    min-height: 0;
  }

  .viewer-hint {
    margin: -10px 0 14px;
    font-size: 12px;
    color: #94a3b8;
  }

  .app-version {
    position: absolute;
    right: 14px;
    bottom: 6px;
    font-size: 11px;
    color: #94a3b8;
  }

  .svg-container {
    position: relative;
    width: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #f8fafc;
    overflow: hidden;
  }

  svg.preview-svg {
    width: auto;
    height: auto;
    max-width: calc(100% - 120px);
    max-height: calc(100% - 96px);
    display: block;
    overflow: visible;
  }

  svg.preview-svg .row {
    cursor: grab;
    transition: transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  svg.preview-svg .row.dragging {
    cursor: grabbing;
    transition: none;
    filter: drop-shadow(0 10px 14px rgba(15, 23, 42, 0.2));
  }

  svg.preview-svg .hit {
    fill: transparent;
    stroke: transparent;
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
    transition: fill 0.15s ease, stroke 0.15s ease;
  }

  svg.preview-svg .row:hover .hit,
  svg.preview-svg .title-button:hover .hit {
    fill: rgba(37, 99, 235, 0.04);
  }

  svg.preview-svg .row.selected .hit,
  svg.preview-svg .title-button.selected .hit {
    fill: rgba(37, 99, 235, 0.08);
    stroke: #2563eb;
  }

  svg.preview-svg .title-button {
    cursor: pointer;
  }

  svg.preview-svg .preview-control {
    pointer-events: none;
  }

  svg.preview-svg .title-text {
    cursor: text;
    transition: fill 0.15s ease;
  }

  svg.preview-svg .title-text:hover {
    fill: #2563eb;
  }

  svg.preview-svg .title-text.editing {
    visibility: hidden;
  }

  svg.preview-svg .insert {
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  svg.preview-svg:hover .insert,
  svg.preview-svg .insert.active {
    opacity: 1;
  }

  svg.preview-svg.moving .insert {
    display: none;
  }

  svg.preview-svg .insert-hit {
    fill: transparent;
  }

  svg.preview-svg .insert-dot {
    fill: #ffffff;
    stroke: #2563eb;
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    transition: fill 0.15s ease;
  }

  svg.preview-svg .insert.button-slot .insert-dot {
    stroke-dasharray: 4 3;
  }

  svg.preview-svg .insert path {
    pointer-events: none;
    stroke: #2563eb;
    stroke-width: 2;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }

  svg.preview-svg .insert:hover .insert-dot,
  svg.preview-svg .insert.active .insert-dot {
    fill: #2563eb;
  }

  svg.preview-svg .insert:hover path,
  svg.preview-svg .insert.active path {
    stroke: #ffffff;
  }

  .preview-control {
    width: 100%;
    height: 100%;
  }

  .preview-control .fake-input {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 0 12px;
    border: 1px solid #CBD5E1;
    border-radius: 6px;
    background-color: #FFFFFF;
    color: #94a3b8;
    font-family: Roboto, 'Segoe UI', Arial, sans-serif;
    font-size: var(--input-font-size, 18px);
    white-space: nowrap;
    overflow: hidden;
  }

  .preview-control .fake-input.dropdown {
    justify-content: space-between;
  }

  .preview-control .preview-switch {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    height: 100%;
    padding: 4%;
    box-sizing: border-box;
    border-radius: 999px;
    background-color: #9CA9BF;
  }

  .preview-control .preview-switch .knob {
    height: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 50%;
    background-color: #FFFFFF;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  }

  .canvas-chip {
    position: absolute;
    z-index: 4;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
    font-size: 12px;
    color: #64748b;
  }

  .canvas-chip.top-left {
    top: 12px;
    left: 12px;
  }

  .canvas-chip.bottom-right {
    right: 12px;
    bottom: 12px;
  }

  .canvas-chip span {
    font-weight: 500;
  }

  .canvas-chip output {
    min-width: 44px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .canvas-chip input[type="range"] {
    width: 140px;
  }

  .canvas-popover {
    position: absolute;
    z-index: 5;
    transform: translate(-50%, -100%);
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #ffffff;
    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.18);
    animation: popover-in 0.16s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }

  .canvas-popover.below {
    transform: translate(-50%, 0);
  }

  @keyframes popover-in {
    from {
      opacity: 0;
      margin-top: 6px;
    }
  }

  .popover-title {
    font-family: 'Sora', 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
  }

  .picker {
    width: 200px;
  }

  .pick-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 8px;
  }

  .pick {
    padding: 6px 8px;
    border: none;
    border-radius: 6px;
    background: none;
    font: inherit;
    font-size: 13px;
    text-align: left;
    color: #334155;
    cursor: pointer;
  }

  .pick:hover {
    background: #eff6ff;
    color: #1d4ed8;
  }

  .panel {
    width: 300px;
  }

  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;
  }

  .panel-close {
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 6px;
    background: none;
    font-size: 18px;
    line-height: 1;
    color: #64748b;
    cursor: pointer;
  }

  .panel-close:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  .panel-remove {
    width: 100%;
    height: 30px;
    margin-top: 14px;
    border: 1px solid #fecaca;
    border-radius: 6px;
    background: #ffffff;
    font: inherit;
    font-size: 12.5px;
    font-weight: 500;
    color: #b91c1c;
    cursor: pointer;
  }

  .panel-remove:hover {
    background: #fef2f2;
  }

  .options {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    align-items: center;
    gap: 8px 10px;
  }

  .option-name {
    font-size: 11.5px;
    font-weight: 500;
    color: #64748b;
  }

  .options input[type="text"] {
    height: 28px;
    padding: 0 8px;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    font: inherit;
    font-size: 12.5px;
    color: #0f172a;
    box-sizing: border-box;
  }

  .options input[type="text"]:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .segmented {
    display: inline-flex;
    justify-self: start;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    overflow: hidden;
  }

  .segmented button {
    height: 24px;
    padding: 0 9px;
    border: none;
    background: #ffffff;
    font: inherit;
    font-size: 11.5px;
    font-weight: 500;
    color: #475569;
    cursor: pointer;
  }

  .segmented button + button {
    border-left: 1px solid #cbd5e1;
  }

  .segmented button:hover {
    background: #eff6ff;
    color: #1d4ed8;
  }

  .segmented button.on {
    background: #eff6ff;
    color: #1d4ed8;
    font-weight: 600;
    box-shadow: inset 0 0 0 1px #93c5fd;
  }

  .title-input {
    position: absolute;
    z-index: 5;
    width: min(70%, 700px);
    transform: translateX(-50%);
    padding: 0 12px;
    border: 1.5px solid #2563eb;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
    font-family: Roboto, 'IBM Plex Sans', Arial, sans-serif;
    font-weight: 700;
    text-align: center;
    color: #1e293b;
    box-sizing: border-box;
  }

  .title-input:focus {
    outline: none;
  }

  input[type="range"] {
    --track-height: 6px;
    --track-border: 1px;
    --thumb-size: 12px;
    --thumb-border: 2px;
    -webkit-appearance: none;
    appearance: none;
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
    margin-top: calc((var(--track-height) + 2 * var(--track-border) - var(--thumb-size) - 2 * var(--thumb-border)) / 2);
    border-radius: 50%;
    background-color: #ffffff;
    border: 2px solid #2563eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #ffffff;
    border: 2px solid #2563eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  input[type="range"]:focus {
    outline: none;
  }

  .settings {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .settings h4 {
    margin: 14px 0 6px;
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
  }

  .settings h4:first-child {
    margin-top: 0;
  }

  .settings-card {
    padding: 0 16px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #ffffff;
  }

  .setting {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 12px 0;
  }

  .setting + .setting {
    border-top: 1px solid #eef2f7;
  }

  .setting-title {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: #0f172a;
  }

  .setting-control {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    color: #64748b;
  }

  .setting-control input[type="number"],
  .setting-control input[type="text"],
  .setting-control select {
    height: 30px;
    padding: 0 8px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font: inherit;
    font-size: 12.5px;
    color: #0f172a;
    box-sizing: border-box;
  }

  .setting-control input[type="number"] {
    width: 76px;
  }

  .setting-control input[type="text"] {
    width: 96px;
    font-family: 'IBM Plex Mono', Consolas, monospace;
  }

  .setting-control input[type="color"] {
    width: 34px;
    height: 30px;
    padding: 2px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    box-sizing: border-box;
    cursor: pointer;
  }

  .setting-control input:focus,
  .setting-control select:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  svg.preview-svg .section-box {
    transition: y 0.24s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  svg.preview-svg .row-label {
    cursor: text;
    transition: fill 0.15s ease;
  }

  svg.preview-svg .row-label:hover {
    fill: #2563eb;
  }

  svg.preview-svg .row-label.editing {
    visibility: hidden;
  }

  svg.preview-svg .row-control {
    cursor: pointer;
  }

  svg.preview-svg .control-outline {
    fill: transparent;
    stroke: transparent;
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
    transition: stroke 0.15s ease, fill 0.15s ease;
  }

  svg.preview-svg .row-control:hover .control-outline {
    stroke: #93c5fd;
  }

  svg.preview-svg .row-control.selected .control-outline {
    fill: rgba(37, 99, 235, 0.08);
    stroke: #2563eb;
  }

  svg.preview-svg .resize-handle {
    cursor: ew-resize;
  }

  svg.preview-svg .handle-hit {
    fill: transparent;
  }

  svg.preview-svg .handle-grip {
    fill: #2563eb;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  svg.preview-svg .section:hover .handle-grip {
    opacity: 0.35;
  }

  svg.preview-svg .resize-handle:hover .handle-grip,
  .svg-container.resizing svg.preview-svg .handle-grip {
    opacity: 0.9;
  }

  .svg-container.resizing,
  .svg-container.resizing * {
    cursor: ew-resize !important;
    user-select: none;
  }

  svg.preview-svg .section-remove {
    opacity: 0;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  svg.preview-svg:not(.moving) .section:hover .section-remove {
    opacity: 1;
  }

  svg.preview-svg .section-remove circle {
    fill: #ffffff;
    stroke: #fca5a5;
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
  }

  svg.preview-svg .section-remove path {
    stroke: #dc2626;
    stroke-width: 2.5;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }

  svg.preview-svg .section-remove:hover circle {
    fill: #fee2e2;
  }

  .defaults {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .defaults h4 {
    margin: 14px 0 6px;
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
  }

  .defaults h4:first-child {
    margin-top: 0;
  }

  .save-row {
    display: flex;
    gap: 8px;
  }

  .save-row input {
    flex: 1;
    height: 32px;
    padding: 0 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font: inherit;
    font-size: 13px;
    color: #0f172a;
    box-sizing: border-box;
  }

  .save-row input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .action {
    height: 32px;
    padding: 0 14px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font: inherit;
    font-size: 12.5px;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
  }

  .action:hover:not(:disabled) {
    background: #f1f5f9;
  }

  .action.primary {
    border-color: #2563eb;
    background: #2563eb;
    color: #ffffff;
  }

  .action.primary:hover:not(:disabled) {
    background: #1d4ed8;
  }

  .action.danger {
    border-color: #fecaca;
    color: #b91c1c;
  }

  .action.danger:hover {
    background: #fef2f2;
  }

  .action:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .default-list {
    margin: 0;
    padding: 0;
    list-style: none;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
  }

  .default-list li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
  }

  .default-list li + li {
    border-top: 1px solid #eef2f7;
  }

  .default-name {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: #0f172a;
  }

  .default-meta {
    font-size: 12px;
    color: #94a3b8;
  }

  .defaults-empty {
    margin: 0;
    padding: 14px;
    border: 1px dashed #cbd5e1;
    border-radius: 10px;
    font-size: 12.5px;
    color: #64748b;
  }

  .label-input {
    position: absolute;
    z-index: 5;
    padding: 0 6px;
    border: 1.5px solid #2563eb;
    border-radius: 6px;
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
    font-family: Roboto, 'IBM Plex Sans', Arial, sans-serif;
    color: #1e293b;
    box-sizing: border-box;
  }

  .label-input:focus {
    outline: none;
  }
</style>

<title>Auto Settings</title>

<svelte:window onkeydown={handleKey} onpointerdown={handleOutside} onpointermove={movePointer} onpointerup={releasePointer}
               onresize={() => viewportTick += 1}/>

{#snippet colorInput(label, value, set)}
  <input type="color" aria-label={label} {value} oninput={(e) => set(e.currentTarget.value.toUpperCase())}>
  <input type="text" aria-label="{label} hex" {value} onchange={(e) => set(readHex(e, value))}>
{/snippet}

{#snippet fillRow(title, fill)}
  <div class="setting">
    <span class="setting-title">{title}</span>
    <div class="setting-control">
      <div class="segmented">
        <button type="button" class:on={fill.mode === "solid"} onclick={() => fill.mode = "solid"}>Solid</button>
        <button type="button" class:on={fill.mode === "gradient"} onclick={() => fill.mode = "gradient"}>Gradient</button>
      </div>
    </div>
  </div>
  {#if fill.mode === "gradient"}
    <div class="setting">
      <span class="setting-title">From · to</span>
      <div class="setting-control">
        {@render colorInput("Gradient start", fill.from, (value) => fill.from = value)}
        {@render colorInput("Gradient end", fill.to, (value) => fill.to = value)}
      </div>
    </div>
    <div class="setting">
      <span class="setting-title">Angle</span>
      <div class="setting-control">
        <input type="range" min="0" max="360" step="15" bind:value={fill.angle} style="width: 140px; --fill: {(fill.angle / 360) * 100}%">
        <span>{fill.angle}°</span>
      </div>
    </div>
  {:else}
    <div class="setting">
      <span class="setting-title">Colour</span>
      <div class="setting-control">
        {@render colorInput("Fill colour", fill.color, (value) => fill.color = value)}
      </div>
    </div>
  {/if}
{/snippet}

<div class="header">
  <div class="header-left">
    <div class="logo-section">
      <img class="logo" src="{base}/logo.svg" alt="Auto Settings" title="Auto Settings {__APP_VERSION__} · commit {__APP_COMMIT__}">
    </div>
    <nav class="menus" aria-label="Main menu">
      <HeaderMenu label="File" items={fileItems} width={270}/>
    </nav>
    <span class="header-divider" aria-hidden="true"></span>
    <span class="app-name">Auto Settings</span>
  </div>
  <button class="export-button" class:copied={copySuccess} type="button" onclick={handleConfiguration}>
    <svg class="export-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      {#if copySuccess}
        <path d="m5 12 5 5 9-10"/>
      {:else}
        <rect x="9" y="9" width="11" height="11" rx="2"/>
        <path d="M5 15V6a2 2 0 0 1 2-2h9"/>
      {/if}
    </svg>
    {copySuccess ? "Copied" : "Copy to atvise"}
  </button>
</div>

<div class="app-layout">
  <div class="viewer-section">
    <span class="app-version" title="Auto Settings {__APP_VERSION__} · commit {__APP_COMMIT__}">{__APP_VERSION__}</span>
    <p class="viewer-hint">Hover the display and click + to add. Click a label or the title to rename it, click a control to change its type. Drag a row to reorder it, drag a box's side to resize.</p>
    <div class="svg-container" class:resizing={!!resizing} bind:this={viewer}>
      <svg class="preview-svg" class:moving={!!dragging || !!resizing} bind:this={previewSvg} width="{displayWidth}" height="{displayHeight}" viewBox="0 0 {displayWidth} {displayHeight}">
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
          <text class="title-text" class:editing={editingTitle} data-hit onpointerdown={startTitleEdit}
                x={displayWidth / 2} y="{titleBaselineY}" font-family="Roboto" font-size={titleFontSize} font-weight="bold" fill="#1E293B" text-anchor="middle">{settingsTitle || "Untitled"}</text>
        {/if}
        {#each buttons as entry (entry.button.key)}
          {@const cx = entry.x + buttonSize / 2}
          {@const cy = entry.y + buttonSize / 2}
          {@const radius = buttonSize * CLOSE_BUTTON.radius}
          <g class="title-button" class:selected={selected?.key === entry.button.key} data-hit role="button" tabindex="-1"
             aria-label="{entry.button.type === "close" ? "Close" : "Round"} button"
             onclick={() => selectButton(entry.button.key)} onkeydown={(e) => e.key === "Enter" && selectButton(entry.button.key)}
             onpointerenter={() => hovered = { kind: "button", key: entry.button.key }} onpointerleave={() => hovered = null}
             transition:appear={{ delay: 60 }}>
            <rect class="hit" x={entry.x - 4} y={entry.y - 4} width={buttonSize + 8} height={buttonSize + 8} rx="10"/>
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
          </g>
        {/each}

        {#each layout as entry (entry.section.key)}
          <g class="section" transition:appear>
            <rect class="section-box" x={entry.x} fill="{settingsFillRef}" stroke="{settingsBackgroundStroke}" stroke-width="1" rx="10" ry="10" width="{settingsWidht}"
                  style="{settingsShadow}; y: {entry.y}px; height: {entry.height}px"/>
            {#each entry.rows as row, index (row.setting.key)}
              {#if index > 0}
                <line x1={entry.contentLeft} x2={entry.contentRight} y1={row.dividerY} y2={row.dividerY} stroke="#E2E8F0" stroke-width="1"/>
              {/if}
            {/each}
            {#each entry.rows as row (row.setting.key)}
              {@const isDragged = dragging?.key === row.setting.key}
              <g class="row" class:dragging={isDragged} data-hit role="button" tabindex="-1" aria-label={row.setting.title}
                 style="transform: translate(0px, {row.top + (isDragged ? dragging.offset : 0)}px)"
                 onpointerdown={(e) => pressRow(e, entry, row)}
                 onpointerenter={() => hovered = { kind: "setting", key: row.setting.key }} onpointerleave={() => hovered = null}>
                <g transition:appear={{ delay: 60 }}>
                  <rect class="hit" x={entry.x + 6} y={-paddingElements / 2 + 2} width={settingsWidht - 12} height={elementHeight + paddingElements - 4} rx="8"/>
                  <text class="row-label" class:editing={editingLabel === row.setting.key} data-part="label"
                        x={entry.contentLeft} y={row.baselineY - row.top} font-family="Roboto" font-size={rowFontSize} fill="#1E293B" text-anchor="start">{row.setting.title || "Untitled"}</text>
                  <g class="row-control" class:selected={selected?.key === row.setting.key} data-part="control">
                    <rect class="control-outline" x={row.x - 4} y="-4" width={row.width + 8} height={elementHeight + 8} rx="9"/>
                    <foreignObject x={row.x} y="0" width={row.width} height={elementHeight}>
                      <div xmlns="http://www.w3.org/1999/xhtml" class="preview-control" style="--input-font-size: {inputFontSize}px">
                        {#if row.setting.type === "dropdown"}
                          <div class="fake-input dropdown"><span>Combobox</span><span>▾</span></div>
                        {:else if row.setting.type === "switch"}
                          <div class="preview-switch"><span class="knob"></span></div>
                        {:else}
                          <div class="fake-input">In/Out Value</div>
                        {/if}
                      </div>
                    </foreignObject>
                  </g>
                </g>
              </g>
            {/each}
            {#each ["left", "right"] as side (side)}
              {@const x = side === "left" ? entry.x : entry.x + settingsWidht}
              <g class="resize-handle" data-hit role="separator" aria-orientation="vertical" aria-label="Resize the settings box from the {side}"
                 onpointerdown={(e) => pressResize(e, side)}>
                <rect class="handle-hit" x={x - HANDLE_WIDTH / 2} y={entry.y} width={HANDLE_WIDTH} height={entry.height}/>
                <rect class="handle-grip" x={x - 3} y={entry.y + entry.height / 2 - Math.min(24, entry.height / 4)} width="6" height={Math.min(48, entry.height / 2)} rx="3"/>
              </g>
            {/each}
            {#if isFull && layout.length > 1}
              <g class="section-remove" data-hit role="button" tabindex="0" aria-label="Remove this settings section"
                 transform="translate({entry.x + settingsWidht} {entry.y})"
                 onclick={() => removeSection(entry.section.key)} onkeydown={(e) => e.key === "Enter" && removeSection(entry.section.key)}>
                <circle r="11"/>
                <path d="M -4 -4 L 4 4 M 4 -4 L -4 4"/>
              </g>
            {/if}
          </g>
        {/each}

        {#each insertSlots as slot (slot.id)}
          <g class="insert" data-hit role="button" tabindex="0"
             aria-label="Add a setting" transform="translate({slot.x} {slot.y})"
             onclick={() => insertSetting(slot.section, slot.index)}
             onkeydown={(e) => e.key === "Enter" && insertSetting(slot.section, slot.index)}>
            <circle class="insert-hit" r={MARKER_RADIUS + 6}/>
            <circle class="insert-dot" r={MARKER_RADIUS}/>
            <path d="M -5 0 H 5 M 0 -5 V 5"/>
          </g>
        {/each}
        {#if isFull}
          {#each columnEnds as end (end.column.key)}
            <g class="insert add-section" data-hit role="button" tabindex="0" aria-label="Add a settings section below"
               transform="translate({end.x + settingsWidht / 2} {end.bottom + canvasMargin / 2})"
               onclick={() => addSection(end.column)} onkeydown={(e) => e.key === "Enter" && addSection(end.column)}>
              <rect class="insert-hit" x="-38" y="-14" width="76" height="28"/>
              <rect class="insert-dot" x="-28" y="-8" width="56" height="16" rx="8"/>
              <path d="M -4 0 H 4 M 0 -4 V 4"/>
            </g>
          {/each}
          {#each ["left", "right"] as side (side)}
            <g class="insert add-column" data-hit role="button" tabindex="0" aria-label="Add a settings section on the {side}"
               transform="translate({side === "left" ? -SIDE_OFFSET : displayWidth + SIDE_OFFSET} {settingsY + (displayHeight - canvasMargin - settingsY) / 2})"
               onclick={() => addColumn(side)} onkeydown={(e) => e.key === "Enter" && addColumn(side)}>
              <rect class="insert-hit" x="-14" y="-38" width="28" height="76"/>
              <rect class="insert-dot" x="-8" y="-28" width="16" height="56" rx="8"/>
              <path d="M -4 0 H 4 M 0 -4 V 4"/>
            </g>
          {/each}
        {/if}
        {#each buttonSlots as slot (slot.side)}
          <g class="insert button-slot" class:active={picker?.side === slot.side} data-hit role="button" tabindex="0"
             aria-label="Add a title button on the {slot.side}" transform="translate({slot.x} {slot.y})"
             onclick={() => openPicker({ side: slot.side, x: slot.x, y: slot.y })}
             onkeydown={(e) => e.key === "Enter" && openPicker({ side: slot.side, x: slot.x, y: slot.y })}>
            <circle class="insert-hit" r={buttonSize * 0.42}/>
            <circle class="insert-dot" r={buttonSize * 0.3}/>
            <path d="M -6 0 H 6 M 0 -6 V 6"/>
          </g>
        {/each}
      </svg>

      <div class="canvas-chip top-left">
        <span>Build</span>
        <div class="segmented">
          <button type="button" class:on={isFull} onclick={() => buildMode = "full"}>Full display</button>
          <button type="button" class:on={!isFull} onclick={() => { buildMode = "section"; closeOverlays(); }}>Settings section only</button>
        </div>
      </div>

      <div class="canvas-chip bottom-right">
        <output>{displayWidth} × {displayHeight} px</output>
      </div>

      {#if editingTitle && isFull && previewSvg && viewer}
        {@const anchor = toLocal(displayWidth / 2, titleBaselineY)}
        <input class="title-input" type="text" aria-label="Display title" bind:value={settingsTitle} use:focusInput
               style="left: {anchor.left}px; top: {anchor.top - titleFontSize * anchor.scale}px; font-size: {titleFontSize * anchor.scale}px; height: {titleFontSize * 1.5 * anchor.scale}px"
               onkeydown={(e) => { if (e.key === "Enter" || e.key === "Escape") editingTitle = false; }} onblur={() => editingTitle = false}>
      {/if}

      {#if labelRow && previewSvg && viewer}
        {@const anchor = toLocal(labelRow.labelX, labelRow.baselineY)}
        {@const end = toLocal(labelRow.x - 12, labelRow.baselineY)}
        <input class="label-input" type="text" aria-label="Setting title" value={labelRow.setting.title} use:focusInput
               oninput={(e) => labelRow.setting.title = e.currentTarget.value}
               style="left: {anchor.left - 7}px; top: {anchor.top - rowFontSize * anchor.scale * 1.05}px; width: {Math.max(80, end.left - anchor.left + 7)}px; font-size: {rowFontSize * anchor.scale}px; height: {rowFontSize * 1.45 * anchor.scale}px"
               onkeydown={(e) => { if (e.key === "Enter" || e.key === "Escape") editingLabel = null; }} onblur={() => editingLabel = null}>
      {/if}

      {#if picker && previewSvg && viewer}
        {@const anchor = toLocal(picker.x, picker.y)}
        <div class="canvas-popover picker below" style="left: {anchor.left}px; top: {anchor.top + 22}px">
          <span class="popover-title">Add a title button ({picker.side})</span>
          <div class="pick-list">
            {#each BUTTON_TYPES as option (option.id)}
              <button type="button" class="pick" onclick={() => addButtonOn(picker.side, option.id)}>{option.label}</button>
            {/each}
          </div>
        </div>
      {/if}

      {#if selectedRow && previewSvg && viewer}
        {@const anchor = toLocal(selectedRow.x + selectedRow.width / 2, selectedRow.top + elementHeight)}
        <div class="canvas-popover panel below" style="left: {anchor.left}px; top: {anchor.top + 10}px">
          <div class="panel-head">
            <span class="popover-title">{selectedRow.setting.title || "Setting"}</span>
            <button type="button" class="panel-close" aria-label="Close" onclick={() => selected = null}>&times;</button>
          </div>
          <div class="options">
            <span class="option-name">Type</span>
            <div class="segmented">
              {#each SETTING_TYPES as option (option.id)}
                <button type="button" class:on={selectedRow.setting.type === option.id} onclick={() => selectedRow.setting.type = option.id}>{option.label}</button>
              {/each}
            </div>
          </div>
          <button type="button" class="panel-remove" onclick={() => removeSetting(selectedRow.setting.key)}>Remove setting</button>
        </div>
      {/if}

      {#if selectedButton && previewSvg && viewer}
        {@const anchor = toLocal(selectedButton.x + buttonSize / 2, selectedButton.y + buttonSize)}
        <div class="canvas-popover panel below" style="left: {anchor.left}px; top: {anchor.top + 10}px">
          <div class="panel-head">
            <span class="popover-title">Title button</span>
            <button type="button" class="panel-close" aria-label="Close" onclick={() => selected = null}>&times;</button>
          </div>
          <div class="options">
            <span class="option-name">Type</span>
            <div class="segmented">
              {#each BUTTON_TYPES as option (option.id)}
                <button type="button" class:on={selectedButton.button.type === option.id} onclick={() => selectedButton.button.type = option.id}>{option.label}</button>
              {/each}
            </div>
            <span class="option-name">Side</span>
            <div class="segmented">
              <button type="button" class:on={selectedButton.button.side === "left"} onclick={() => selectedButton.button.side = "left"}>Left</button>
              <button type="button" class:on={selectedButton.button.side === "right"} onclick={() => selectedButton.button.side = "right"}>Right</button>
            </div>
          </div>
          <button type="button" class="panel-remove" onclick={() => removeButton(selectedButton.button.key)}>Remove button</button>
        </div>
      {/if}
    </div>
  </div>
</div>

{#if defaultsOpen}
  <Modal title="Defaults" subtitle="Saved displays to start from, kept in this browser" width={520} onclose={() => defaultsOpen = false}>
    <div class="defaults">
      <h4>Save the current display</h4>
      <form class="save-row" onsubmit={(e) => { e.preventDefault(); saveDefault(); }}>
        <input type="text" placeholder="Name, for example Fan coil unit" aria-label="Default name" bind:value={defaultName}>
        <button type="submit" class="action primary" disabled={!defaultName.trim()}>Save</button>
      </form>
      <h4>Saved defaults</h4>
      {#if savedDefaults.length}
        <ul class="default-list">
          {#each savedDefaults as entry (entry.name)}
            <li>
              <span class="default-name">{entry.name}</span>
              <span class="default-meta">{settingCount(entry.display)} settings</span>
              <button type="button" class="action" onclick={() => applyDefault(entry)}>Load</button>
              <button type="button" class="action danger" onclick={() => deleteDefault(entry)}>Delete</button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="defaults-empty">No defaults saved yet. Build a display, give it a name above and save it.</p>
      {/if}
    </div>
  </Modal>
{/if}

{#if settingsOpen}
  <Modal title="Settings" subtitle="Sizes, fonts and colours of the generated display" width={560} onclose={() => settingsOpen = false}>
    <div class="settings">
      <h4>Inputs</h4>
      <div class="settings-card">
        <div class="setting">
          <span class="setting-title">Input element size</span>
          <div class="setting-control">
            <input type="number" aria-label="Input width" min="40" step="10" bind:value={elementWidth}>
            <span>×</span>
            <input type="number" aria-label="Input height" min="20" step="2" bind:value={elementHeight}>
            <span>px</span>
          </div>
        </div>
        <div class="setting">
          <span class="setting-title">Label font size</span>
          <div class="setting-control">
            <input type="number" aria-label="Label font size" min="8" step="1" bind:value={rowFontSize}>
          </div>
        </div>
        <div class="setting">
          <span class="setting-title">Input font size</span>
          <div class="setting-control">
            <select aria-label="Input font size" bind:value={inputFontSize}>
              {#each INPUT_FONT_SIZES as size (size)}
                <option value={size}>{size}</option>
              {/each}
            </select>
          </div>
        </div>
      </div>

      <h4>Settings box</h4>
      <div class="settings-card">
        {@render fillRow("Fill", settingsFill)}
        <div class="setting">
          <span class="setting-title">Border</span>
          <div class="setting-control">
            {@render colorInput("Border colour", settingsBackgroundStroke, (value) => settingsBackgroundStroke = value)}
          </div>
        </div>
      </div>

      <h4>Full display</h4>
      <div class="settings-card">
        <div class="setting">
          <span class="setting-title">Title button size</span>
          <div class="setting-control">
            <input type="number" aria-label="Title button size" min="16" step="4" bind:value={buttonSize}>
            <span>px</span>
          </div>
        </div>
        {@render fillRow("Canvas background", backgroundFill)}
      </div>
    </div>
  </Modal>
{/if}
