<script>
  import { tick } from "svelte";
  import { backOut, cubicIn } from "svelte/easing";
  import { base } from "$app/paths";
  import { ICON_SPRITE } from "$lib/iconSprite.js";
  import { RESOURCE_SECTIONS } from "$lib/resources.js";
  import { DEFAULT_ICON_LIBRARY, DEFAULT_ICON_NAMES, DEFAULT_NODE_PREFIX, ELEMENT_TYPES, FITTINGS, INDICATORS, LINES, MEASURES, RECUPERATION_OPTIONS, UNIT_OPTIONS, setpointId } from "$lib/ahu/elements.js";
  import { frameItems, lineItems, mixingLead, MIXING_KEY, recuperationItems, sideCenters, unitItems } from "$lib/ahu/scene.js";
  import { displayScript, escapeXml, itemsToAtvise } from "$lib/ahu/atvise.js";
  import { loadJson, loadText, saveJson, saveText } from "$lib/settings.js";
  import SettingsDialog from "$lib/components/SettingsDialog.svelte";
  import TargetDialog from "$lib/components/TargetDialog.svelte";
  import HeaderMenu from "$lib/components/HeaderMenu.svelte";
  import PageTabs from "$lib/components/PageTabs.svelte";
  import ProjectCrumb from "$lib/components/ProjectCrumb.svelte";
  import { cleanDocumentName, defaultDocumentName, fileNameFor, loadAutosave, parseDocument, saveAutosave, serializeDocument } from "$lib/document.js";
  import { fileAccess, hashText, recallFile, rememberFile } from "$lib/fileStore.js";

  let displayWidth = $state(Number(loadText("autoAhu.displayWidth", "1920")) || 1920);
  let displayHeight = $state(Number(loadText("autoAhu.displayHeight", "1125")) || 1125);
  let displayTitle = $state("Klimatska Naprava");
  let nodePathPrefix = $state(loadText("autoAhu.nodePrefix", DEFAULT_NODE_PREFIX));
  let iconLibrary = $state(loadText("autoAhu.iconLibrary", DEFAULT_ICON_LIBRARY));
  let iconNames = $state(loadJson("autoAhu.iconNames", { ...DEFAULT_ICON_NAMES }));
  let selectModbusTable = $state(loadText("autoAhu.controller", "carel"));
  let editingTitle = $state(false);
  let settingsOpen = $state(false);

  $effect(() => saveText("autoAhu.nodePrefix", nodePathPrefix));
  $effect(() => saveText("autoAhu.displayWidth", String(displayWidth)));
  $effect(() => saveText("autoAhu.displayHeight", String(displayHeight)));
  $effect(() => saveText("autoAhu.controller", selectModbusTable));
  $effect(() => saveText("autoAhu.iconLibrary", iconLibrary));
  $effect(() => saveJson("autoAhu.iconNames", iconNames));

  let recuperationUnitWidth = $state(150);
  let recuperationUnitHeight = $state(500);
  let recuperationUnitX = $derived(displayWidth / 2);

  const elementPadding = 20;
  const LINE_END_PADDING = 30;

  const yTop = $derived((displayHeight / 2) - (recuperationUnitHeight / 2) + 80);
  const yBottom = $derived((displayHeight / 2) - (recuperationUnitHeight / 2) + 420);
  const xLeft = 60;
  const xCenter = $derived(recuperationUnitX);
  const xRight = $derived(displayWidth - 60);
  let elementScale = $state(1);

  const leftExtreme = $derived(xLeft + LINE_END_PADDING);
  let recuperationOptions = $state({ bypass: false, mixing: false, readouts: [], indicators: [] });
  let unitOptions = $state({ room: [], status: [] });
  let unitOpen = $state(false);
  const centerExtremeLeft = $derived(xCenter - (recuperationUnitWidth / 2) - (recuperationOptions.bypass ? 60 : elementPadding));
  const centerExtremeRight = $derived(xCenter + (recuperationUnitWidth / 2) + (recuperationOptions.bypass ? 60 : elementPadding));
  const rightExtreme = $derived(xRight - LINE_END_PADDING);

  let selectedRecuperation = $state("rotary-heat-exchanger");

  const exhaustY = $derived(selectedRecuperation === "plate-heat-exchanger" ? yBottom : yTop);
  const intakeY = $derived(selectedRecuperation === "plate-heat-exchanger" ? yTop : yBottom);

  const ELEMENT_SCALE_MIN = 0.5;
  const ELEMENT_SCALE_MAX = 1;

  // Chrome has no ::-moz-range-progress, so the filled part of every slider track
  // is faked with a gradient sized by --fill. Each slider needs its own percentage.
  const elementScaleFillPercent = $derived(
      ((elementScale - ELEMENT_SCALE_MIN) / (ELEMENT_SCALE_MAX - ELEMENT_SCALE_MIN)) * 100
  );

  const ELEMENT_OPTIONS = {
      damper: [{
          key: "signalType",
          label: "Signal Type",
          type: "select"
      }],
      humidifier: [{
          key: "signalType",
          label: "Signal Type",
          type: "select"
      }]
  }

  function toggleIn(list, id) {
      return list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id];
  }

  const SUPPLY_CATALOG = [{
          key: "sup-filter",
          label: "Filter",
          type: "filter"
      },
      {
          key: "sup-frost-thermostat",
          label: "Frost thermostat",
          type: "frostThermostat"
      },
      {
          key: "sup-preheat-hot-water-coils",
          label: "Preheat hot water coil",
          type: "hotWaterCoils"
      },
      {
          key: "sup-preheat-electric-heater",
          label: "Preheat electric heater",
          type: "electricHeater"
      },
      {
          key: "sup-cold-water-coils",
          label: "Cold water coil",
          type: "coldWaterCoils"
      },
      {
          key: "sup-reheat-hot-water-coils",
          label: "Reheat hot water coil",
          type: "hotWaterCoils"
      },
      {
          key: "sup-reheat-electric-heater",
          label: "Reheat electric heater",
          type: "electricHeater"
      },
      {
          key: "sup-humidifier",
          label: "Humidifier",
          type: "humidifier",
          signalType: "continious"
      },
      {
          key: "sup-fan",
          label: "Fan",
          type: "fan"
      },
      {
          key: "sup-temp-sensor",
          label: "Temperature sensor",
          type: "temperatureSensor"
      },
      {
          key: "sup-humidity-sensor",
          label: "Humidity sensor",
          type: "humiditySensor"
      },
      {
          key: "sup-co2-sensor",
          label: "CO₂ sensor",
          type: "co2Sensor"
      },
      {
          key: "sup-pressure-sensor",
          label: "Pressure sensor",
          type: "pressureSensor"
      },
      {
          key: "sup-flow-sensor",
          label: "Air flow sensor",
          type: "flowSensor"
      },
      {
          key: "sup-voc-sensor",
          label: "VOC sensor",
          type: "vocSensor"
      },
      {
          key: "sup-after-recovery-temp-sensor",
          label: "Temperature sensor (after recovery)",
          type: "temperatureSensor"
      },
      {
          key: "sup-saturation-temp-sensor",
          label: "Temperature sensor (saturation)",
          type: "temperatureSensor"
      },
      {
          key: "sup-dx-coil",
          label: "DX cooling coil",
          type: "dxCoil"
      },
      {
          key: "sup-silencer",
          label: "Silencer",
          type: "silencer"
      }
  ];

  const INTAKE_CATALOG = [{
          key: "int-damper",
          label: "Damper",
          type: "damper",
          signalType: "continious"
      },
      {
          key: "int-pre-filter",
          label: "Filter",
          type: "filter"
      },
      {
          key: "int-temp-sensor",
          label: "Temperature sensor",
          type: "temperatureSensor"
      },
      {
          key: "int-humidity-sensor",
          label: "Humidity sensor",
          type: "humiditySensor"
      },
      {
          key: "int-fan",
          label: "Fan",
          type: "fan"
      },
      {
          key: "int-silencer",
          label: "Silencer",
          type: "silencer"
      }
  ];

  const EXHAUST_CATALOG = [
      {
          key: "exh-damper",
          label: "Damper",
          type: "damper",
          signalType: "continious"
      },
      {
          key: "exh-frost-thermostat",
          label: "Frost thermostat",
          type: "frostThermostat"
      },
      {
          key: "exh-temp-sensor",
          label: "Temperature sensor",
          type: "temperatureSensor"
      },
      {
          key: "exh-humidity-sensor",
          label: "Humidity sensor",
          type: "humiditySensor"
      },
      {
          key: "exh-fan",
          label: "Fan",
          type: "fan"
      },
      {
          key: "exh-silencer",
          label: "Silencer",
          type: "silencer"
      }
  ];

  const RETURN_CATALOG = [{
          key: "ret-filter",
          label: "Filter",
          type: "filter"
      },
      {
          key: "ret-temp-sensor",
          label: "Temperature sensor",
          type: "temperatureSensor"
      },
      {
          key: "ret-humidity-sensor",
          label: "Humidity sensor",
          type: "humiditySensor"
      },
      {
          key: "ret-co2-sensor",
          label: "CO₂ sensor",
          type: "co2Sensor"
      },
      {
          key: "ret-fan",
          label: "Fan",
          type: "fan"
      },
      {
          key: "ret-pressure-sensor",
          label: "Pressure sensor",
          type: "pressureSensor"
      },
      {
          key: "ret-flow-sensor",
          label: "Air flow sensor",
          type: "flowSensor"
      },
      {
          key: "ret-voc-sensor",
          label: "VOC sensor",
          type: "vocSensor"
      },
      {
          key: "ret-silencer",
          label: "Silencer",
          type: "silencer"
      }
  ];


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
      const objectUrl = URL.createObjectURL(new Blob([resource.text], { type: "text/plain;charset=utf-8" }));

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = resource.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(objectUrl);
  }

  let copySuccess = $state(false);
  let hoverLine = $state(null);
  let hoveredOwner = null;
  let picker = $state(null);
  let selected = $state(null);
  let viewer = $state(null);
  let viewportTick = $state(0);
  let previewSvg = $state(null);
  let moving = $state(null);
  let settling = $state(null);
  let instant = $state(false);

  const CATALOG = { sup: SUPPLY_CATALOG, int: INTAKE_CATALOG, exh: EXHAUST_CATALOG, ret: RETURN_CATALOG };

  let placements = $state({ exh: [], int: [], ret: [], sup: [] });
  let nextInstance = 1;

  const LINE_LISTS = Object.fromEntries(Object.keys(CATALOG).map((line) => [line, {
      get: () => placements[line],
      set: (list) => placements[line] = list
  }]));

  function createInstance(entry, line) {
      const same = placements[line].filter((element) => element.template === entry.key).length;
      return {
          ...entry,
          key: `${entry.key}_${nextInstance++}`,
          template: entry.key,
          label: same ? `${entry.label} ${same + 1}` : entry.label,
          readouts: [],
          fittings: [],
          indicators: []
      };
  }

  function lineOf(key) {
      return key.split("-")[0];
  }

  const lineSpecs = $derived({
      exh: { elements: placements.exh, start: leftExtreme, end: centerExtremeLeft, y: exhaustY, pipeStart: xLeft, pipeEnd: xCenter - recuperationUnitWidth / 2 },
      int: { elements: placements.int, start: leftExtreme, end: centerExtremeLeft, y: intakeY, pipeStart: xLeft, pipeEnd: xCenter - recuperationUnitWidth / 2 },
      ret: { elements: placements.ret, start: centerExtremeRight, end: rightExtreme, y: yTop, pipeStart: xCenter + recuperationUnitWidth / 2, pipeEnd: xRight },
      sup: { elements: placements.sup, start: centerExtremeRight, end: rightExtreme, y: yBottom, pipeStart: xCenter + recuperationUnitWidth / 2, pipeEnd: xRight }
  });

  const DIRECTION = { exh: -1, int: 1, ret: -1, sup: 1 };
  const PARTNER = { exh: "int", int: "exh", ret: "sup", sup: "ret" };

  function leadOf(line) {
      return recuperationOptions.mixing && (line === "ret" || line === "sup") ? mixingLead(elementScale) : null;
  }

  const mixingCenter = $derived(recuperationOptions.mixing
      ? sideCenters(placements.ret, placements.sup, centerExtremeRight, rightExtreme, elementScale, leadOf("ret")).get(MIXING_KEY)
      : null);

  function buildLine(line, lists = {}) {
      const { start, end, y } = lineSpecs[line];
      const elements = lists[line] ?? lineSpecs[line].elements;
      const centers = sideCenters(elements, lists[PARTNER[line]] ?? lineSpecs[PARTNER[line]].elements, start, end, elementScale, leadOf(line));
      return lineItems({ elements, y, centers, direction: DIRECTION[line], outward: y === yTop ? -1 : 1, scale: elementScale, controller: selectModbusTable, prefix: nodePathPrefix });
  }

  function centersOf(items) {
      return new Map(items.filter((item) => item.center !== undefined).map((item) => [item.owner, item.center]));
  }

  const frameBase = $derived(frameItems({
      xLeft, xRight, xCenter, exhaustY, intakeY, returnY: yTop, supplyY: yBottom, topY: yTop, displayWidth, displayHeight,
      recuperation: selectedRecuperation, recuperationWidth: recuperationUnitWidth, recuperationHeight: recuperationUnitHeight
  }));

  const recuperationExtras = $derived(recuperationItems({
      cx: xCenter, width: recuperationUnitWidth, height: recuperationUnitHeight, displayHeight, recuperation: selectedRecuperation,
      options: recuperationOptions, intakeY, supplyY: yBottom, returnY: yTop, controller: selectModbusTable, prefix: nodePathPrefix, scale: elementScale, mixingCenter
  }));

  const frame = $derived({
      under: [...frameBase.under, ...recuperationExtras.under],
      over: [
          frameBase.over[0],
          ...recuperationExtras.over.map((item) => ({ ...item, owner: RECUPERATION })),
          ...frameBase.over.slice(1),
          ...unitItems({ displayWidth, options: unitOptions, controller: selectModbusTable, prefix: nodePathPrefix })
      ]
  });

  const sceneItems = $derived([
      ...frame.under,
      ...Object.keys(lineSpecs).flatMap((line) => buildLine(line)),
      ...frame.over
  ]);

  const baseCenters = $derived(centersOf(sceneItems));

  const sceneGroups = $derived.by(() => {
      const groups = [];
      for (const item of sceneItems) {
          const last = groups.at(-1);
          if (item.owner && last?.owner === item.owner) last.items.push(item);
          else groups.push({ id: item.owner ?? item.id, owner: item.owner, items: [item] });
      }
      for (const group of groups) {
          const icon = group.items.find((item) => item.center !== undefined);
          if (icon) group.box = { x: icon.x - 10, y: icon.y - 10, width: icon.boxWidth + 20, height: icon.boxHeight + 20 };
      }
      return groups;
  });

  function placedOthers(key) {
      return lineSpecs[lineOf(key)].elements.filter((element) => element.key !== key && baseCenters.has(element.key));
  }

  function reordered(list, key, index) {
      const moved = list.find((element) => element.key === key);
      const rest = list.filter((element) => element.key !== key);
      const placed = rest.filter((element) => baseCenters.has(element.key));
      const at = index < placed.length ? rest.indexOf(placed[index]) : rest.indexOf(placed.at(-1)) + 1;
      rest.splice(at, 0, moved);
      return rest;
  }

  const movePreview = $derived.by(() => {
      if (!moving || moving.key === RECUPERATION) return null;
      const line = lineOf(moving.key);
      const list = reordered(lineSpecs[line].elements, moving.key, moving.index);
      const lists = { [line]: list };
      return { list, centers: centersOf([...buildLine(line, lists), ...buildLine(PARTNER[line], lists)]) };
  });

  const orderedGroups = $derived(moving
      ? [...sceneGroups.filter((group) => group.owner !== moving.key), ...sceneGroups.filter((group) => group.owner === moving.key)]
      : sceneGroups);

  const RECUPERATION = "recuperation";
  let lastRecuperationPress = 0;

  let reflow = $state(null);
  let previousCenters = new Map();

  $effect(() => {
      const current = baseCenters;
      const before = previousCenters;
      previousCenters = current;
      const keys = (map) => [...map.keys()].sort().join("|");
      if (moving || settling || keys(before) === keys(current)) return;
      const offsets = new Map();
      for (const [owner, center] of current) {
          if (before.has(owner) && Math.abs(before.get(owner) - center) > 0.5) offsets.set(owner, before.get(owner) - center);
      }
      if (!offsets.size) return;
      slide(offsets);
  });

  async function slide(offsets) {
      instant = true;
      reflow = offsets;
      await tick();
      previewSvg.getBoundingClientRect();
      instant = false;
      reflow = null;
  }

  function pop(node, { easing, delay = 0, duration = 260 }) {
      return {
          delay,
          duration,
          easing,
          css: (t) => `opacity: ${Math.min(1, t * 1.6)}; transform-box: fill-box; transform-origin: center; transform: translateY(${(1 - t) * 14}px) scale(${0.6 + 0.4 * t});`
      };
  }

  function shiftOf(owner) {
      if (!owner || owner === RECUPERATION) return 0;
      if (settling?.key === owner) return settling.offset;
      if (reflow?.has(owner)) return reflow.get(owner);
      if (!moving || ![lineOf(moving.key), PARTNER[lineOf(moving.key)]].includes(lineOf(owner))) return 0;
      if (owner === moving.key) return moving.dx;
      return (movePreview.centers.get(owner) ?? baseCenters.get(owner)) - baseCenters.get(owner);
  }

  const LINE_KEYS = { exh: "exhaust", int: "intake", ret: "return", sup: "supply" };

  function svgPoint(event) {
      const matrix = previewSvg.getScreenCTM();
      return { x: (event.clientX - matrix.e) / matrix.a, y: (event.clientY - matrix.f) / matrix.d };
  }

  function svgX(event) {
      return svgPoint(event).x;
  }

  function toLocal(x, y) {
      viewportTick;
      const matrix = previewSvg.getScreenCTM();
      const frame = viewer.getBoundingClientRect();
      return { left: matrix.a * x + matrix.e - frame.left, top: matrix.d * y + matrix.f - frame.top, scale: matrix.a };
  }

  function elementOf(key) {
      return LINE_LISTS[lineOf(key)]?.get().find((element) => element.key === key) ?? null;
  }

  const boxes = $derived(new Map(sceneGroups.filter((group) => group.box && group.owner !== RECUPERATION).map((group) => [group.owner, group.box])));

  const insertSlots = $derived(Object.fromEntries(Object.entries(lineSpecs).map(([line, spec]) => {
      const placed = spec.elements.filter((element) => boxes.has(element.key));
      const edges = [leadOf(line) && mixingCenter !== null ? mixingCenter + mixingLead(elementScale).width / 2 : spec.pipeStart + 6, ...placed.flatMap((element) => {
          const box = boxes.get(element.key);
          return [box.x, box.x + box.width];
      }), spec.pipeEnd - 6];
      const slots = [];
      for (let index = 0; index <= placed.length; index += 1) {
          if (edges[index * 2 + 1] - edges[index * 2] >= 44) slots.push({ index, x: (edges[index * 2] + edges[index * 2 + 1]) / 2 });
      }
      return [line, slots];
  })));

  let pickerQuery = $state("");

  const pickerMatches = $derived(picker
      ? CATALOG[picker.line].filter((entry) => entry.label.toLowerCase().includes(pickerQuery.trim().toLowerCase()))
      : []);

  function lineAt(point) {
      for (const [line, spec] of Object.entries(lineSpecs)) {
          if (Math.abs(point.y - spec.y) < 70 && point.x >= spec.pipeStart && point.x <= spec.pipeEnd) return line;
      }
      return null;
  }

  function closeOverlays() {
      picker = null;
      selected = null;
      editingTitle = false;
  }

  const DEFAULT_TITLE = "Klimatska Naprava";

  function newPageId() {
      return `page-${crypto.randomUUID().slice(0, 8)}`;
  }

  function capturePage() {
      return $state.snapshot({
          title: displayTitle,
          recuperation: selectedRecuperation,
          recuperationX: recuperationUnitX,
          recuperationOptions,
          unitOptions,
          placements,
          elementScale,
          controller: selectModbusTable,
          nodePrefix: nodePathPrefix
      });
  }

  function applyPage(data) {
      closeOverlays();
      unitOpen = false;
      hoveredOwner = null;
      displayTitle = data?.title ?? DEFAULT_TITLE;
      selectedRecuperation = data?.recuperation ?? "rotary-heat-exchanger";
      recuperationOptions = { bypass: false, mixing: false, readouts: [], indicators: [], ...data?.recuperationOptions };
      unitOptions = { room: [], status: [], ...data?.unitOptions };
      placements = { exh: [], int: [], ret: [], sup: [], ...data?.placements };
      elementScale = data?.elementScale ?? 1;
      if (typeof data?.controller === "string") selectModbusTable = data.controller;
      if (typeof data?.nodePrefix === "string") nodePathPrefix = data.nodePrefix;
      recuperationUnitX = data?.recuperationX ?? displayWidth / 2;
  }

  function syncInstanceCounter() {
      let highest = 0;
      for (const page of pages) {
          const lists = page.id === activePage ? placements : page.data?.placements;
          for (const list of Object.values(lists ?? {})) {
              for (const element of list) highest = Math.max(highest, Number(/_(\d+)$/.exec(element.key)?.[1] ?? 0));
          }
      }
      nextInstance = highest + 1;
  }

  const firstPageId = newPageId();
  let pages = $state([{ id: firstPageId, name: "Page 1", data: null }]);
  let activePage = $state(firstPageId);
  let documentName = $state(null);
  const activePageName = $derived(pages.find((page) => page.id === activePage)?.name ?? "");

  function stashActive() {
      const page = pages.find((entry) => entry.id === activePage);
      if (page) page.data = capturePage();
  }

  function selectPage(pageId) {
      if (pageId === activePage) return;
      stashActive();
      activePage = pageId;
      applyPage(pages.find((page) => page.id === pageId).data);
  }

  function addPage() {
      const taken = new Set(pages.map((page) => page.name));
      let index = pages.length + 1;
      while (taken.has(`Page ${index}`)) index += 1;
      stashActive();
      const id = newPageId();
      pages.push({ id, name: `Page ${index}`, data: null });
      activePage = id;
      applyPage(null);
  }

  function movePage(pageId, index) {
      const from = pages.findIndex((page) => page.id === pageId);
      if (from < 0 || index < 0 || index >= pages.length || index === from) return;
      const [page] = pages.splice(from, 1);
      pages.splice(index, 0, page);
  }

  function duplicatePage(pageId) {
      const index = pages.findIndex((page) => page.id === pageId);
      const source = pages[index];
      if (!source) return;
      const data = structuredClone(source.id === activePage ? capturePage() : $state.snapshot(source.data));
      const taken = new Set(pages.map((page) => page.name));
      let name = `${source.name} (copy)`;
      for (let count = 2; taken.has(name); count += 1) name = `${source.name} (copy ${count})`;
      stashActive();
      const id = newPageId();
      pages.splice(index + 1, 0, { id, name, data });
      activePage = id;
      applyPage(data);
  }

  function renamePage(pageId, name) {
      const page = pages.find((entry) => entry.id === pageId);
      if (page) page.name = name;
  }

  function pageFilled(page) {
      const data = page.id === activePage ? capturePage() : page.data;
      return Object.values(data?.placements ?? {}).some((list) => list.length > 0);
  }

  function deletePage(pageId) {
      if (pages.length < 2) return;
      const index = pages.findIndex((page) => page.id === pageId);
      const page = pages[index];
      if (!page) return;
      if (pageFilled(page) && !window.confirm(`Delete "${page.name}" and everything on it?`)) return;
      pages.splice(index, 1);
      if (pageId !== activePage) return;
      activePage = pages[Math.min(index, pages.length - 1)].id;
      applyPage(pages.find((entry) => entry.id === activePage).data);
  }

  function projectSettings() {
      return { displayWidth, displayHeight };
  }

  function currentDocument(name = documentName) {
      return serializeDocument({
          name,
          active: activePage,
          settings: projectSettings(),
          pages: pages.map((page) => ({ id: page.id, name: page.name, data: page.id === activePage ? capturePage() : $state.snapshot(page.data) }))
      });
  }

  function applyDocument(doc) {
      const settings = doc.settings ?? {};
      if (Number(settings.displayWidth)) displayWidth = Number(settings.displayWidth);
      if (Number(settings.displayHeight)) displayHeight = Number(settings.displayHeight);
      documentName = doc.name;
      pages = doc.pages.map((page) => page.data ? { ...page, data: { controller: settings.controller, nodePrefix: settings.nodePrefix, ...page.data } } : page);
      activePage = doc.active;
      applyPage(pages.find((page) => page.id === activePage).data);
      syncInstanceCounter();
  }

  function projectHash(text) {
      return hashText(text.replace(/"savedAt":"[^"]*",?/, "").replace(/"active":"page-[^"]*",?/, ""));
  }

  const restored = loadAutosave();
  if (restored) applyDocument(restored);

  const documentText = $derived(currentDocument());
  const documentHash = $derived(projectHash(documentText));
  let savedHash = $state(loadText("autoAhu.savedHash", ""));
  $effect(() => saveText("autoAhu.savedHash", savedHash));
  const unsaved = $derived(documentHash !== savedHash);
  let autosaveFile = $state(loadText("autoAhu.autosaveFile", "false") === "true");
  $effect(() => saveText("autoAhu.autosaveFile", String(autosaveFile)));
  let fileWriting = $state(false);
  let fileHandle = $state.raw(null);
  let fileAccessState = $state("none");
  const projectTitle = $derived(documentName ?? "Untitled project");
  const projectStatus = $derived(
      fileWriting ? "saving"
      : autosaveFile && fileHandle && fileAccessState !== "granted" ? "paused"
      : unsaved ? (autosaveFile && fileHandle ? "pending" : fileHandle || savedHash ? "unsaved" : "unlinked")
      : autosaveFile && fileHandle ? "autosaved" : "saved"
  );

  let fileNotice = $state(null);
  let fileNoticeTimer;

  function showFileNotice(text) {
      fileNotice = text;
      clearTimeout(fileNoticeTimer);
      fileNoticeTimer = setTimeout(() => fileNotice = null, 2400);
  }

  let browserTimer;
  $effect(() => {
      const text = documentText;
      clearTimeout(browserTimer);
      browserTimer = setTimeout(() => saveAutosave(text), 400);
  });

  let fileTimer;
  $effect(() => {
      const hash = documentHash;
      clearTimeout(fileTimer);
      if (!autosaveFile || !fileHandle || fileAccessState !== "granted" || hash === savedHash) return;
      fileTimer = setTimeout(autosaveToFile, 1500);
  });

  async function autosaveToFile() {
      if (fileWriting || !fileHandle) return;
      try {
          await writeProject(fileHandle, documentName);
      } catch (error) {
          fileAccessState = await fileAccess(fileHandle);
          if (fileAccessState === "granted") showFileNotice(`Autosave failed: ${error.message}`);
      }
  }

  function linkFile(handle, access) {
      fileHandle = handle;
      fileAccessState = handle ? access : "none";
      rememberFile(handle);
  }

  async function ensureAccess() {
      if (!fileHandle) return false;
      if (fileAccessState !== "granted") fileAccessState = await fileAccess(fileHandle, true);
      return fileAccessState === "granted";
  }

  async function resumeAutosave() {
      if (await ensureAccess()) autosaveToFile();
  }

  async function setAutosaveFile(on) {
      if (!on) {
          autosaveFile = false;
          return;
      }
      if (!fileHandle) await saveProjectAs();
      if (!fileHandle || !(await ensureAccess())) return;
      autosaveFile = true;
  }

  const FILE_TYPES = [{ description: "Auto AHU project", accept: { "application/json": [".json"] } }];
  const PICKER_ID = "auto-ahu-project";
  const canPickFiles = typeof window !== "undefined" && typeof window.showSaveFilePicker === "function";

  recallFile().then(async (handle) => {
      if (!handle || fileHandle || !canPickFiles || cleanDocumentName(handle.name) !== documentName) return;
      fileHandle = handle;
      fileAccessState = await fileAccess(handle);
  });

  function saveFailed(error) {
      if (error?.name !== "AbortError") showFileNotice(`Could not save: ${error.message}`);
  }

  async function writeProject(handle, name, adopt = true) {
      const text = currentDocument(name);
      const hash = projectHash(text);
      fileWriting = true;
      try {
          const writable = await handle.createWritable();
          await writable.write(text);
          await writable.close();
          if (adopt) savedHash = hash;
      } finally {
          fileWriting = false;
      }
  }

  async function saveProject() {
      if (!fileHandle) return saveProjectAs();
      if (!(await ensureAccess())) return saveProjectAs();
      try {
          await writeProject(fileHandle, documentName);
          showFileNotice(`Saved to ${fileHandle.name}`);
      } catch (error) {
          saveFailed(error);
      }
  }

  async function saveProjectAs(copy = false) {
      if (!canPickFiles) {
          downloadProject(documentName ?? defaultDocumentName(), !copy);
          return;
      }
      try {
          const handle = await window.showSaveFilePicker({
              suggestedName: fileNameFor(documentName ?? defaultDocumentName()),
              types: FILE_TYPES,
              id: PICKER_ID,
              ...(fileHandle ? { startIn: fileHandle } : {})
          });
          const name = cleanDocumentName(handle.name);
          if (!copy) documentName = name;
          await writeProject(handle, name, !copy);
          if (!copy) linkFile(handle, "granted");
          showFileNotice(copy ? `Saved a copy to ${handle.name}` : `Saved to ${handle.name}`);
      } catch (error) {
          saveFailed(error);
      }
  }

  function downloadProject(name = documentName ?? defaultDocumentName(), adopt = false) {
      const fileName = fileNameFor(name);
      const clean = cleanDocumentName(fileName);
      if (adopt) {
          documentName = clean;
          linkFile(null);
      }
      const text = currentDocument(clean);
      if (adopt) savedHash = projectHash(text);
      const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showFileNotice(`Downloaded ${fileName}`);
  }

  let pickedFileName = null;

  function pickFileText() {
      return new Promise((resolve, reject) => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".json,application/json";
          input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return reject(Object.assign(new Error("No file"), { name: "AbortError" }));
              pickedFileName = file.name;
              resolve(await file.text());
          };
          input.click();
      });
  }

  function newProject() {
      const pending = unsaved && pages.some(pageFilled) && !(autosaveFile && fileHandle && fileAccessState === "granted");
      if (pending && !window.confirm(`Start a new project? Unsaved changes in "${projectTitle}" will be lost.`)) return;
      const id = newPageId();
      applyDocument({ name: null, active: id, settings: {}, pages: [{ id, name: "Page 1", data: null }] });
      linkFile(null);
      savedHash = "";
      showFileNotice("New project");
  }

  async function openProject() {
      try {
          if (typeof window.showOpenFilePicker === "function") {
              const [handle] = await window.showOpenFilePicker({ types: FILE_TYPES, id: PICKER_ID });
              applyDocument(parseDocument(await (await handle.getFile()).text()));
              documentName = cleanDocumentName(handle.name) ?? documentName;
              linkFile(handle, await fileAccess(handle));
              savedHash = projectHash(currentDocument());
              showFileNotice(`Opened ${handle.name}`);
          } else {
              applyDocument(parseDocument(await pickFileText()));
              linkFile(null);
              documentName = cleanDocumentName(pickedFileName) ?? documentName;
              savedHash = projectHash(currentDocument());
              showFileNotice("Project opened");
          }
      } catch (error) {
          if (error?.name !== "AbortError") showFileNotice(`Could not open: ${error.message}`);
      }
  }

  function renameProject(value) {
      const clean = cleanDocumentName(value);
      if (clean) documentName = clean;
  }

  function fileKeydown(event) {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return false;
      const key = event.key.toLowerCase();
      if (key === "s") {
          event.preventDefault();
          if (event.shiftKey) saveProjectAs();
          else saveProject();
          return true;
      }
      if (key === "o" && !event.shiftKey) {
          event.preventDefault();
          openProject();
          return true;
      }
      return false;
  }

  const fileItems = $derived([
      { label: "New project", hint: "Start an empty project", onclick: newProject },
      { label: "Open…", shortcut: "Ctrl+O", onclick: openProject },
      { separator: true },
      { label: "Save", shortcut: "Ctrl+S", hint: fileHandle ? "Update the current file" : "Choose where to save the project", onclick: saveProject },
      { label: "Save as…", shortcut: "Ctrl+Shift+S", hint: "New name or folder, keep working in the new file", onclick: () => saveProjectAs() },
      { label: "Save a copy…", hint: "Keep working in this file", onclick: () => saveProjectAs(true) },
      { label: "Download", hint: "Put a copy in the Downloads folder", onclick: () => downloadProject() },
      canPickFiles
          ? { toggle: true, label: "Autosave to file", checked: autosaveFile, onchange: setAutosaveFile, hint: autosaveFile ? "Every change is written to the project file" : "Write every change to the project file" }
          : { note: "This browser can't pick a folder, so projects go to Downloads. Use Chrome or Edge to choose where to save." },
      { separator: true },
      { label: "Resources…", hint: "Modbus tables and atvise files to download", onclick: openResources },
      { label: "Settings…", hint: "Display size and icons", onclick: () => settingsOpen = true }
  ]);

  function openPicker(line, slot) {
      selected = null;
      pickerQuery = "";
      picker = picker?.line === line && picker.index === slot.index ? null : { line, index: slot.index, x: slot.x, y: lineSpecs[line].y };
  }

  function insertElement(entry) {
      const { line, index } = picker;
      const list = [...placements[line]];
      list.splice(Math.min(index, list.length), 0, createInstance(entry, line));
      placements[line] = list;
      picker = null;
  }

  function removeElement(key) {
      const line = lineOf(key);
      placements[line] = placements[line].filter((element) => element.key !== key);
      if (selected === key) selected = null;
  }

  function pickerKey(event) {
      if (event.key === "Enter" && pickerMatches.length) {
          event.preventDefault();
          insertElement(pickerMatches[0]);
      }
  }

  function focusSearch(node) {
      node.focus();
  }

  function focusTitle(node) {
      node.focus();
      node.select();
  }

  const recuperationBox = $derived(sceneGroups.find((group) => group.owner === RECUPERATION)?.box ?? null);

  function handleKey(event) {
      if (fileKeydown(event)) return;
      if (event.key === "Escape" && (picker || selected || editingTitle)) {
          closeOverlays();
          return;
      }
      const typing = event.target.closest?.("input, select, textarea");
      const target = selected ?? hoveredOwner;
      if (target && target !== RECUPERATION && !typing && (event.key === "Delete" || event.key === "Backspace")) {
          event.preventDefault();
          removeElement(target);
          hoveredOwner = null;
      }
  }

  function handleOutside(event) {
      if (unitOpen && !event.target.closest?.(".unit-control")) unitOpen = false;
      if (!picker && !selected) return;
      if (event.target.closest?.(".canvas-popover, .preview-svg, .title-input, .unit-control")) return;
      closeOverlays();
  }

  function startMove(event) {
      if (event.target.closest(".insert, .remove")) return;
      if (event.target.closest(".title-text")) {
          event.preventDefault();
          picker = null;
          selected = null;
          editingTitle = true;
          return;
      }
      editingTitle = false;
      const key = event.target.closest("[data-owner]")?.dataset.owner;
      if (!key) {
          closeOverlays();
          return;
      }
      if (event.button !== 0 || settling) return;
      event.preventDefault();
      picker = null;
      previewSvg.setPointerCapture(event.pointerId);
      if (key === RECUPERATION) {
          if (event.timeStamp - lastRecuperationPress < 400) {
              lastRecuperationPress = 0;
              recuperationUnitX = displayWidth / 2;
              return;
          }
          lastRecuperationPress = event.timeStamp;
      }
      pressing = { key, x: svgX(event), startX: svgX(event), timer: setTimeout(beginMove, HOLD_DELAY) };
  }

  const HOLD_DELAY = 260;
  const DRAG_THRESHOLD = 6;
  let pressing = null;

  function beginMove() {
      if (!pressing) return;
      const { key, x, timer } = pressing;
      clearTimeout(timer);
      pressing = null;
      selected = null;
      if (key === RECUPERATION) {
          moving = { key, origin: x, dx: 0, start: recuperationUnitX };
          return;
      }
      const center = baseCenters.get(key);
      moving = { key, origin: x, dx: 0, index: placedOthers(key).filter((element) => baseCenters.get(element.key) < center).length };
  }

  function updateMove(event) {
      if (pressing) {
          const x = svgX(event);
          if (Math.abs(x - pressing.startX) * previewSvg.getScreenCTM().a < DRAG_THRESHOLD) return;
          pressing.x = pressing.startX;
          beginMove();
      }
      if (!moving) {
          hoveredOwner = event.target.closest?.("[data-owner]")?.dataset.owner ?? null;
          const line = lineAt(svgPoint(event));
          if (line !== hoverLine) hoverLine = line;
          return;
      }
      if (moving.key === RECUPERATION) {
          recuperationUnitX = Math.min(rightExtreme, Math.max(leftExtreme, moving.start + svgX(event) - moving.origin));
          moving.dx = recuperationUnitX - moving.start;
          return;
      }
      const spec = lineSpecs[lineOf(moving.key)];
      const base = baseCenters.get(moving.key);
      const center = Math.min(spec.end, Math.max(spec.start, base + svgX(event) - moving.origin));
      moving.dx = center - base;
      const index = placedOthers(moving.key).filter((element) => baseCenters.get(element.key) < center).length;
      if (index !== moving.index) moving.index = index;
  }

  async function endMove() {
      if (pressing) {
          clearTimeout(pressing.timer);
          const { key } = pressing;
          pressing = null;
          selected = selected === key ? null : key;
          return;
      }
      if (!moving) return;
      if (moving.key === RECUPERATION) {
          moving = null;
          return;
      }
      const { key, dx } = moving;
      const { list, centers } = movePreview;
      const offset = baseCenters.get(key) + dx - centers.get(key);
      instant = true;
      settling = { key, offset };
      LINE_LISTS[lineOf(key)].set(list);
      moving = null;
      await tick();
      previewSvg.getBoundingClientRect();
      instant = false;
      settling = null;
  }

  let exportOpen = $state(false);

  function confirmTarget(choice) {
      exportOpen = false;
      selectModbusTable = choice.controller;
      nodePathPrefix = choice.prefix;
      handleConfiguration();
  }

  async function handleConfiguration() {
      const script = displayScript(sceneItems);
      const scriptOpen = '<script atv:desc="" atv:name="" type="text/ecmascript"';
      const scriptTag = script ? `${scriptOpen}><![CDATA[${script}]]><${"/"}script>` : `${scriptOpen}/>`;
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
              <text atv:refpx="960" atv:refpy="65.5" fill="#1E293B" font-family="Roboto" font-size="46" font-weight="bold" id="title" x="765.5" y="81.5">${escapeXml(displayTitle)}</text>
              <svg atv:refpx="55.0001" atv:refpy="65.3353" height="121" id="back_button" transform="matrix(0.6667,0,0,0.6667,0,0)" width="121" x="21.996" xlink:href="SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.4.%20Gumbi.Round_Buttons.Button" y="37.498">
              <atv:argument name="animation_type" value="Background"/>
              <atv:argument name="hover_color" value="#A32A3A"/>
              <atv:argument name="icon_type" value="Back"/>
              </svg>
              ${scriptTag}
              <svg atv:refpx="1765" atv:refpy="65.6677" height="121" id="graph_button" transform="matrix(0.6612,0,0,0.6612,0,0)" width="121" x="2608.893" xlink:href="SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.4.%20Gumbi.Round_Buttons.Button" y="38.816">
              <atv:argument name="hover_color" value="#2A7A53"/>
              <atv:argument name="animation_type" value="Background"/>
              <atv:argument name="icon_type" value="Graph"/>
              </svg>
              ${itemsToAtvise(sceneItems, iconLibrary, iconNames)}
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
    font-family: 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f1f5f9;
    color: #0f172a;
    box-sizing: border-box;
    overflow: hidden;
  }


  .header{
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 44px;
    padding: 0 12px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    box-sizing: border-box;
  }


  .logo-section {
    display: flex;
    align-items: center;
  }


  .logo{
    height: 26px;
  }


  .resources-icon {
    width: 16px;
    height: 16px;
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
    font-family: 'Sora', 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
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
    font-family: 'Sora', 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
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
    font-family: 'IBM Plex Mono', Consolas, monospace;
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
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: 11px;
    line-height: 1.5;
    overflow: auto;
  }


  .app-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    height: calc(100dvh - 84px);
    padding: 12px;
    box-sizing: border-box;
  }


  label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #334155;
    cursor: pointer;
  }

  input[type="range"] {
    /* Track and thumb sizes live here so the thumb offset below can be derived
       from them instead of being a hand-tuned magic number. No box-sizing is
       set on the pseudo-elements, so borders add to these values. */
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

  /* Track — filled portion driven by --fill, set inline from the bound value */
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
    /* Chrome offsets the thumb from the top of the track's border box, so centre
       it by half the difference between the two outer heights. Firefox centres
       ::-moz-range-thumb on its own and ignores this. */
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

  .viewer-section {
    position: relative;
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
    position: relative;
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

  svg.preview-svg .part {
    transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  svg.preview-svg.instant .part,
  svg.preview-svg .part.dragging {
    transition: none;
  }

  svg.preview-svg .part.dragging {
    transform-box: fill-box;
    transform-origin: center;
    filter: drop-shadow(0 12px 16px rgba(15, 23, 42, 0.22));
    opacity: 0.95;
  }

  svg.preview-svg [data-owner] {
    cursor: pointer;
  }

  svg.preview-svg.moving,
  svg.preview-svg.moving [data-owner] {
    cursor: grabbing;
  }

  svg.preview-svg .hit {
    fill: transparent;
    stroke: transparent;
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
    transition: fill 0.15s ease, stroke 0.15s ease;
  }

  svg.preview-svg:not(.moving) .part:hover .hit {
    fill: rgba(37, 99, 235, 0.06);
    stroke: #93c5fd;
  }

  svg.preview-svg .part.dragging .hit {
    fill: rgba(37, 99, 235, 0.08);
    stroke: #2563eb;
    stroke-dasharray: 6 5;
  }

  svg.preview-svg .part.dragging:not([data-owner="recuperation"]) .hit {
    visibility: hidden;
  }

  svg.preview-svg .part.target .hit {
    fill: rgba(16, 185, 129, 0.07);
    stroke: #34d399;
  }

  svg.preview-svg .drop-slot {
    fill: rgba(37, 99, 235, 0.08);
    stroke: #2563eb;
    stroke-width: 1.5;
    stroke-dasharray: 6 5;
    vector-effect: non-scaling-stroke;
    transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  svg.preview-svg .part.selected .hit {
    fill: rgba(37, 99, 235, 0.08);
    stroke: #2563eb;
  }

  svg.preview-svg .remove {
    opacity: 0;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }

  svg.preview-svg:not(.moving) .part:hover .remove,
  svg.preview-svg .part.selected .remove {
    opacity: 1;
  }

  svg.preview-svg .remove circle {
    fill: #ffffff;
    stroke: #fca5a5;
    stroke-width: 2;
  }

  svg.preview-svg .remove path {
    stroke: #dc2626;
    stroke-width: 2.5;
    stroke-linecap: round;
  }

  svg.preview-svg .remove:hover circle {
    fill: #fee2e2;
  }

  svg.preview-svg .insert {
    cursor: pointer;
    animation: insert-in 0.18s ease both;
  }

  svg.preview-svg .insert .insert-hit {
    fill: transparent;
  }

  svg.preview-svg .insert .insert-dot {
    fill: #ffffff;
    stroke: var(--accent);
    stroke-width: 3;
    transition: fill 0.15s ease, r 0.15s ease;
  }

  svg.preview-svg .insert path {
    pointer-events: none;
    stroke: var(--accent);
    stroke-width: 4;
    stroke-linecap: round;
    transition: stroke 0.15s ease;
  }

  svg.preview-svg .insert:hover .insert-dot,
  svg.preview-svg .insert.active .insert-dot {
    fill: var(--accent);
    r: 26px;
  }

  svg.preview-svg .insert:hover path,
  svg.preview-svg .insert.active path {
    stroke: #ffffff;
  }

  @keyframes insert-in {
    from {
      opacity: 0;
    }
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

  .canvas-popover.side {
    transform: none;
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
    width: 260px;
  }

  .pick-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 280px;
    margin-top: 8px;
    overflow-y: auto;
  }

  .pick {
    display: flex;
    align-items: center;
    gap: 10px;
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

  .pick-search {
    width: 100%;
    height: 32px;
    margin-top: 10px;
    padding: 0 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font: inherit;
    font-size: 13px;
    color: #0f172a;
    box-sizing: border-box;
  }

  .pick-search:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .pick-empty {
    margin: 6px 8px;
    font-size: 12.5px;
    color: #94a3b8;
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

  .title-input {
    position: absolute;
    z-index: 5;
    width: min(70%, 900px);
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

  .unit-control {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 6;
  }

  .unit-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
    font: inherit;
    font-size: 12.5px;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
  }

  .unit-button:hover,
  .unit-button.on {
    border-color: #93c5fd;
    color: #1d4ed8;
  }

  .unit-count {
    min-width: 16px;
    padding: 0 4px;
    border-radius: 999px;
    background: #dbeafe;
    font-size: 10.5px;
    line-height: 16px;
    color: #1d4ed8;
    box-sizing: border-box;
  }

  .unit-panel {
    position: absolute;
    top: 38px;
    left: 0;
    width: 320px;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #ffffff;
    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.18);
    animation: popover-in 0.16s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }

  .scale-control {
    position: absolute;
    right: 12px;
    bottom: 12px;
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

  .scale-control label {
    font-weight: 500;
    cursor: default;
  }

  .scale-control input[type="range"] {
    width: 120px;
  }

  .scale-control span {
    min-width: 34px;
    text-align: right;
    font-variant-numeric: tabular-nums;
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

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
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

  .file-notice {
    position: fixed;
    left: 50%;
    bottom: 56px;
    z-index: 80;
    transform: translateX(-50%);
    padding: 8px 14px;
    border-radius: 8px;
    background: #0f172a;
    font-size: 12px;
    font-weight: 500;
    color: #ffffff;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.2);
    pointer-events: none;
  }

  .viewer-hint {
    margin: -10px 0 14px;
    font-size: 12px;
    color: #94a3b8;
  }

  svg.preview-svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  .resources-section {
    display: flex;
    gap: 8px;
  }

  .element-options {
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

  .toggles {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .toggle,
  .segmented button {
    height: 24px;
    padding: 0 9px;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    background: #ffffff;
    font: inherit;
    font-size: 11.5px;
    font-weight: 500;
    color: #475569;
    cursor: pointer;
  }

  .toggle:hover,
  .segmented button:hover {
    background: #eff6ff;
    color: #1d4ed8;
  }

  .toggle.on,
  .segmented button.on {
    border-color: #93c5fd;
    background: #eff6ff;
    color: #1d4ed8;
    font-weight: 600;
  }

  .segmented {
    display: inline-flex;
    justify-self: start;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    overflow: hidden;
  }

  .segmented button {
    height: 22px;
    border: none;
    border-radius: 0;
  }

  .segmented button + button {
    border-left: 1px solid #cbd5e1;
  }

  .segmented button.on {
    box-shadow: inset 0 0 0 1px #93c5fd;
  }
</style>

<svelte:window onkeydown={handleKey} onpointerdown={handleOutside} onresize={() => viewportTick += 1}/>
<title>{unsaved && !(autosaveFile && fileHandle) ? "• " : ""}{projectTitle} — Auto AHU</title>
{@html ICON_SPRITE}
<div class="header">
    <div class="header-left">
        <div class="logo-section">
            <link rel="icon" type="image/x-icon" href="{base}/logo.svg">
            <img class="logo" src="{base}/logo.svg" alt="Auto AHU" title="Auto AHU {__APP_VERSION__} · commit {__APP_COMMIT__}">
        </div>
        <nav class="menus" aria-label="Main menu">
            <HeaderMenu label="File" items={fileItems} width={290}
                        status={{ label: "Saving to", value: fileHandle?.name ?? null, empty: "Not saved to a file yet" }}/>
        </nav>
        <span class="header-divider" aria-hidden="true"></span>
        <ProjectCrumb name={projectTitle} view={activePageName} fileName={fileHandle?.name ?? null} status={projectStatus}
                      onrename={renameProject} onresume={resumeAutosave}/>
    </div>
    <div class="resources-section">
        <button class="export-button" class:copied={copySuccess} type="button" onclick={() => exportOpen = true}>
            <svg class="resources-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
</div>

<dialog class="resources-dialog" bind:this={resourcesDialog} onclick={handleDialogClick} onclose={handleDialogClose}>
    <div class="dialog-panel">
        <div class="dialog-head">
            <div>
                <div class="dialog-title">Resources</div>
                <div class="dialog-subtitle">Modbus tables.</div>
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
                                            <button class="resource-button primary" class:copied={copiedResourceId === resource.id} type="button" onclick={() => copyResource(resource)}>
                                                {copiedResourceId === resource.id ? "Copied" : "Copy"}
                                            </button>
                                            <button class="resource-button" type="button" onclick={() => downloadResource(resource)}>
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                    <pre class="resource-preview">{resource.text}</pre>
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
  <div class="viewer-section">
    <p class="viewer-hint">Hover a pipe and click + to add an element. Click an element to edit it, drag it to move it. Click the title to rename it, click the heat exchanger to change its type.</p>
    <div class="svg-container" bind:this={viewer}>
      <svg class="preview-svg" role="application" aria-label="AHU preview" class:moving={moving} class:instant viewBox="0 0 {displayWidth} {displayHeight}" bind:this={previewSvg}
           onpointerdown={startMove} onpointermove={updateMove} onpointerup={endMove} onpointercancel={endMove}
           onpointerleave={() => { hoveredOwner = null; if (!moving) hoverLine = null; }}>
        <text class="title-text" class:editing={editingTitle} x={displayWidth/2} y="81.5" font-family="Roboto" font-size="46" font-weight="bold" fill="#1E293B" text-anchor="middle">{displayTitle || "Untitled display"}</text>
        {#if movePreview}
          {@const slot = sceneGroups.find((group) => group.owner === moving.key)?.box}
          {#if slot}
            <rect class="drop-slot" x={slot.x} y={slot.y} width={slot.width} height={slot.height} rx="10"
                  style="transform: translate({(movePreview.centers.get(moving.key) ?? baseCenters.get(moving.key)) - baseCenters.get(moving.key)}px, 0)"/>
          {/if}
        {/if}
        {#each orderedGroups as group (group.id)}
          <g class="part" class:dragging={!!moving && moving.key === group.owner} class:selected={selected === group.owner} data-owner={group.owner}
             in:pop={{ easing: backOut, delay: 60 }} out:pop={{ easing: cubicIn, duration: 120 }}
             class:target={movePreview && group.owner && group.owner !== moving.key && lineOf(group.owner) === lineOf(moving.key)}
             style:transform={group.owner ? `translate(${shiftOf(group.owner)}px, 0)${moving?.key === group.owner ? " scale(1.04)" : ""}` : undefined}>
            {#if group.box}
              <rect class="hit" x={group.box.x} y={group.box.y} width={group.box.width} height={group.box.height} rx="10"/>
            {/if}
            {#each group.items as item (item.id)}
              {#if item.kind === "polyline"}
                <polyline points={item.points} fill="none" stroke={item.color} stroke-width={item.width} stroke-dasharray={item.dash}
                          stroke-linecap={item.round ? "round" : undefined} stroke-linejoin={item.round ? "round" : undefined}/>
              {:else if item.kind === "junction"}
                <circle cx={item.cx} cy={item.cy} r={item.radius} fill="#FFFFFF" stroke={item.color} stroke-width={item.stroke}/>
              {:else if item.kind === "icon"}
                <use href="#icon-{item.sprite}" width={item.width} height={item.height} transform="matrix({item.matrix.join(",")})"/>
              {:else if item.kind === "field"}
                <rect x={item.x} y={item.y} width={item.width} height={item.height} rx={2 * item.height / 40} fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.5"/>
                <text x={item.x + item.width / 2} y={item.y + item.height / 2 + 7 * item.height / 40} text-anchor="middle"
                      font-family="Roboto" font-size={20 * item.height / 40} fill="#414142">{item.decimals ? "--.-" : "--"} {item.unit}</text>
              {:else}
                <text x={item.x} y={item.y} text-anchor={item.anchor} font-family="Roboto" font-size={item.size}
                      font-weight={item.bold ? "bold" : undefined} fill={item.color}>{item.text}</text>
              {/if}
            {/each}
            {#if group.box && group.owner !== RECUPERATION}
              <g class="remove" role="button" tabindex="-1" aria-label="Remove {elementOf(group.owner)?.label}"
                 transform="translate({group.box.x + group.box.width}, {group.box.y})"
                 onclick={() => removeElement(group.owner)} onkeydown={(e) => e.key === "Enter" && removeElement(group.owner)}>
                <circle r="13"/>
                <path d="M -4.5 -4.5 L 4.5 4.5 M 4.5 -4.5 L -4.5 4.5"/>
              </g>
            {/if}
          </g>
        {/each}
        {#if !moving}
          {#each Object.entries(insertSlots) as [line, slots] (line)}
            {#if hoverLine === line || picker?.line === line}
              {#each slots as slot (slot.index)}
                <g class="insert" class:active={picker?.line === line && picker.index === slot.index}
                   role="button" tabindex="0" aria-label="Add an element to {LINES[LINE_KEYS[line]].label}"
                   style="--accent: {LINES[LINE_KEYS[line]].color}"
                   transform="translate({slot.x}, {lineSpecs[line].y})"
                   onclick={() => openPicker(line, slot)} onkeydown={(e) => e.key === "Enter" && openPicker(line, slot)}>
                  <circle class="insert-hit" r="34"/>
                  <circle class="insert-dot" r="22"/>
                  <path d="M -9 0 H 9 M 0 -9 V 9"/>
                </g>
              {/each}
            {/if}
          {/each}
        {/if}
      </svg>

      {#if picker && previewSvg && viewer}
        {@const anchor = toLocal(picker.x, picker.y)}
        {@const below = picker.y === yTop}
        <div class="canvas-popover picker" class:below style="left: {Math.min(Math.max(anchor.left, 140), viewer.clientWidth - 140)}px; top: {anchor.top + (below ? 22 : -22)}px">
          <div class="popover-title">Add to {LINES[LINE_KEYS[picker.line]].label}</div>
          <input class="pick-search" type="search" placeholder="Search elements" aria-label="Search elements"
                 bind:value={pickerQuery} onkeydown={pickerKey} use:focusSearch>
          <div class="pick-list">
            {#each pickerMatches as entry (entry.key)}
              <button type="button" class="pick" onclick={() => insertElement(entry)}>{entry.label}</button>
            {:else}
              <p class="pick-empty">No elements match "{pickerQuery}".</p>
            {/each}
          </div>
        </div>
      {/if}

      {#if editingTitle && previewSvg && viewer}
        {@const anchor = toLocal(displayWidth / 2, 81.5)}
        <input class="title-input" type="text" aria-label="Display title" bind:value={displayTitle} use:focusTitle
               style="left: {anchor.left}px; top: {anchor.top - 46 * anchor.scale}px; font-size: {46 * anchor.scale}px; height: {60 * anchor.scale}px"
               onkeydown={(e) => { if (e.key === "Enter" || e.key === "Escape") editingTitle = false; }} onblur={() => editingTitle = false}>
      {/if}

      {#if selected === RECUPERATION && recuperationBox && previewSvg && viewer}
        {@const topRight = toLocal(recuperationBox.x + recuperationBox.width, recuperationBox.y)}
        {@const topLeft = toLocal(recuperationBox.x, recuperationBox.y)}
        {@const fitsRight = topRight.left + 16 + 300 <= viewer.clientWidth - 8}
        <div class="canvas-popover panel side" style="left: {fitsRight ? topRight.left + 16 : topLeft.left - 316}px; top: {Math.max(8, topRight.top)}px">
          <div class="panel-head">
            <span class="popover-title">Heat exchanger</span>
            <button type="button" class="panel-close" aria-label="Close" onclick={() => selected = null}>&times;</button>
          </div>
          <div class="element-options">
            <span class="option-name">Type</span>
            <div class="segmented" role="group" aria-label="Heat exchanger type">
              <button type="button" class:on={selectedRecuperation === "plate-heat-exchanger"} onclick={() => selectedRecuperation = "plate-heat-exchanger"}>Plate</button>
              <button type="button" class:on={selectedRecuperation === "rotary-heat-exchanger"} onclick={() => selectedRecuperation = "rotary-heat-exchanger"}>Rotary</button>
            </div>
            <span class="option-name">Dampers</span>
            <div class="toggles">
              {#each RECUPERATION_OPTIONS.dampers as entry (entry.id)}
                {@render toggle(entry.name, recuperationOptions[entry.id], () => recuperationOptions[entry.id] = !recuperationOptions[entry.id])}
              {/each}
            </div>
            <span class="option-name">Readout</span>
            <div class="toggles">
              {#each RECUPERATION_OPTIONS.readouts.filter((entry) => !entry.rotaryOnly || selectedRecuperation === "rotary-heat-exchanger") as entry (entry.id)}
                {@render toggle(entry.name, recuperationOptions.readouts.includes(entry.id), () => recuperationOptions.readouts = toggleIn(recuperationOptions.readouts, entry.id))}
              {/each}
            </div>
            <span class="option-name">Indicator</span>
            <div class="toggles">
              {#each RECUPERATION_OPTIONS.indicators as entry (entry.id)}
                {@render toggle(entry.name, recuperationOptions.indicators.includes(entry.id), () => recuperationOptions.indicators = toggleIn(recuperationOptions.indicators, entry.id))}
              {/each}
            </div>
            <span class="option-name">Position</span>
            <div class="toggles">
              <button type="button" class="toggle" onclick={() => recuperationUnitX = displayWidth / 2}>Centre</button>
            </div>
          </div>
        </div>
      {/if}

      <div class="unit-control canvas-popover-anchor">
        <button type="button" class="unit-button" class:on={unitOpen} aria-expanded={unitOpen} onclick={() => { unitOpen = !unitOpen; picker = null; selected = null; }}>
          Unit
          {#if unitOptions.room.length + unitOptions.status.length}<span class="unit-count">{unitOptions.room.length + unitOptions.status.length}</span>{/if}
        </button>
        {#if unitOpen}
          <div class="unit-panel">
            <div class="panel-head">
              <span class="popover-title">Unit</span>
              <button type="button" class="panel-close" aria-label="Close" onclick={() => unitOpen = false}>&times;</button>
            </div>
            <div class="element-options">
              <span class="option-name">Room</span>
              <div class="toggles">
                {#each UNIT_OPTIONS.room as entry (entry.id)}
                  {@render toggle(entry.name, unitOptions.room.includes(entry.id), () => unitOptions.room = toggleIn(unitOptions.room, entry.id))}
                {/each}
              </div>
              <span class="option-name">Status</span>
              <div class="toggles">
                {#each UNIT_OPTIONS.status as entry (entry.id)}
                  {@render toggle(entry.name, unitOptions.status.includes(entry.id), () => unitOptions.status = toggleIn(unitOptions.status, entry.id))}
                {/each}
              </div>
            </div>
          </div>
        {/if}
      </div>

      <div class="scale-control">
        <label for="element-scale">Element size</label>
        <input type="range" id="element-scale" min={ELEMENT_SCALE_MIN} max={ELEMENT_SCALE_MAX} step="0.01" bind:value={elementScale} style="--fill: {elementScaleFillPercent}%">
        <span>{Math.round(elementScale * 100)}%</span>
      </div>

      {#if selected && boxes.has(selected) && previewSvg && viewer}
        {@const element = elementOf(selected)}
        {@const box = boxes.get(selected)}
        {@const below = lineSpecs[lineOf(selected)].y === yTop}
        {@const anchor = toLocal(box.x + box.width / 2, below ? box.y + box.height : box.y)}
        <div class="canvas-popover panel" class:below style="left: {Math.min(Math.max(anchor.left, 160), viewer.clientWidth - 160)}px; top: {anchor.top + (below ? 10 : -10)}px">
          <div class="panel-head">
            <span class="popover-title">{element.label}</span>
            <button type="button" class="panel-close" aria-label="Close" onclick={() => selected = null}>&times;</button>
          </div>
          {@render elementOptions(element)}
          <button type="button" class="panel-remove" onclick={() => removeElement(element.key)}>Remove from {LINES[LINE_KEYS[lineOf(element.key)]].label}</button>
        </div>
      {/if}
    </div>
  </div>
</div>
<PageTabs {pages} active={activePage} onselect={selectPage} onadd={addPage} onrename={renamePage} ondelete={deletePage}
          onmove={movePage} onduplicate={duplicatePage}
          version={__APP_VERSION__} build={__APP_COMMIT__}/>
{#if fileNotice}
  <div class="file-notice" role="status">{fileNotice}</div>
{/if}
{#snippet toggle(label, on, flip)}
  <button type="button" class="toggle" class:on aria-pressed={on} onclick={flip}>{label}</button>
{/snippet}

{#snippet elementOptions(element)}
  {@const spec = ELEMENT_TYPES[element.type]}
  <div class="element-options">
    {#each ELEMENT_OPTIONS[element.type] ?? [] as option (option.key)}
      <span class="option-name">Signal</span>
      <div class="segmented" role="group" aria-label={option.label}>
        <button type="button" class:on={element[option.key] === "continious"} onclick={() => element[option.key] = "continious"}>Continuous</button>
        <button type="button" class:on={element[option.key] === "discrete"} onclick={() => element[option.key] = "discrete"}>Discrete</button>
      </div>
    {/each}
    {#if spec.measures.length === 1}
      {@const measure = spec.measures[0]}
      <span class="option-name">Readout</span>
      <div class="toggles">
        {@render toggle(MEASURES[measure].name, element.readouts.includes(measure), () => element.readouts = toggleIn(element.readouts, measure))}
        {#if spec.setpoints.includes(measure)}
          {@render toggle("Setpoint", element.readouts.includes(setpointId(measure)), () => element.readouts = toggleIn(element.readouts, setpointId(measure)))}
        {/if}
      </div>
    {:else if spec.measures.length}
      <span class="option-name">Readout</span>
      <div class="toggles">
        {#each spec.measures as measure (measure)}
          {@render toggle(MEASURES[measure].name, element.readouts.includes(measure), () => element.readouts = toggleIn(element.readouts, measure))}
        {/each}
      </div>
      {#if spec.setpoints.length}
        <span class="option-name">Setpoint</span>
        <div class="toggles">
          {#each spec.setpoints as measure (measure)}
            {@render toggle(MEASURES[measure].name, element.readouts.includes(setpointId(measure)), () => element.readouts = toggleIn(element.readouts, setpointId(measure)))}
          {/each}
        </div>
      {/if}
    {/if}
    {#if spec.fittings?.length}
      <span class="option-name">Hydraulics</span>
      <div class="toggles">
        {#each spec.fittings as fitting (fitting)}
          {@render toggle(FITTINGS[fitting].name, element.fittings.includes(fitting), () => element.fittings = toggleIn(element.fittings, fitting))}
        {/each}
      </div>
    {/if}
    {#if spec.indicators.length}
      <span class="option-name">Indicator</span>
      <div class="toggles">
        {#each spec.indicators as indicator (indicator)}
          {@render toggle(INDICATORS[indicator].name, element.indicators.includes(indicator), () => element.indicators = toggleIn(element.indicators, indicator))}
        {/each}
      </div>
    {/if}
  </div>
{/snippet}

{#if exportOpen}
  <TargetDialog controller={selectModbusTable} prefix={nodePathPrefix} onconfirm={confirmTarget} onclose={() => exportOpen = false}/>
{/if}

{#if settingsOpen}
  <SettingsDialog bind:iconLibrary bind:iconNames bind:displayWidth bind:displayHeight
                  onclose={() => settingsOpen = false}/>
{/if}
