<script module>
  const shared = { power: null, control: null, comms: null };
</script>

<script>
  import { PROTECTION_KINDS } from "$lib/diagram/electric/symbols.js";
  import { expand, moveRows, moveBy, addToGroup, ungroup, dissolve, copyRows, pasteRows } from "$lib/apps/wiring/rowGroups.js";
  import { POLES, LOADS, PHASES, SYSTEMS, CABLE_TYPES, LOAD_LIBRARY, newPowerRow, libraryRow, productRow, powerTable, poleOf, powerTree, powerSizing, loadTags, loadOf, formatNumber } from "$lib/apps/wiring/power.js";
  import { CONTROLLER_MODELS, CONTROL_TYPES, controlTypeOf, modelTerminals, newController, newControlRow, terminalUse, contactUse, isRelayType, sharesOutput, CUSTOM_CONNECTIONS, CUSTOM_SYMBOLS, newTemplate, customTypes, contactPairs, commPorts, portOf, linkDefaults, newLink, PROTOCOLS, LINK_TARGETS, isGateway } from "$lib/apps/wiring/control.js";
  import { portal } from "$lib/core/actions/portal.js";
  import Modal from "../../../core/components/Modal.svelte";
  import Combo from "../../../core/components/Combo.svelte";
  import { allProducts, productOf, productLabel, productRcd, saveProduct, removeProduct, isBuiltIn, builtInOf } from "$lib/apps/wiring/loadProducts.js";
  import { loadLibrary, saveToLibrary, removeFromLibrary, templateFromLibrary, exportLibrary, importLibrary } from "$lib/apps/wiring/deviceLibrary.js";

  let { power = $bindable(), control = $bindable(), ondraw, onnotice } = $props();

  const LINK_CABLES = ["UTP", "UTP Kat5", "FTP Kat6", "J-H(St)H 2x2x0,8mm2"];
  let part = $state("power");
  let libraryOpen = $state(false);
  const linkOwner = {
    get rows(){ return control.links ?? []; },
    set rows(value){ control.links = value; },
    get groups(){ return control.linkGroups ?? []; },
    set groups(value){ control.linkGroups = value; }
  };
  let owner = $derived(part === "power" ? power : part === "comms" ? linkOwner : control);
  let selected = $state([]);
  let selectedSet = $derived(new Set(selected));
  let anchorId = null;
  let clip = $state.raw({ ...shared });

  function switchPart(next){
    part = next;
    selected = [];
    anchorId = null;
  }

  function onField(event){
    return Boolean(event.target.closest?.("input, textarea, select, button, label, .grip"));
  }

  function release(){
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && focused !== document.body) focused.blur();
  }

  function pickRow(event, row){
    if (onField(event)) return;
    const ctrl = event.ctrlKey || event.metaKey;
    const ids = owner.rows.map((entry) => entry.id);
    if (event.shiftKey && anchorId && ids.includes(anchorId)) {
      const [a, b] = [ids.indexOf(anchorId), ids.indexOf(row.id)].sort((x, y) => x - y);
      const range = ids.slice(a, b + 1);
      selected = ctrl ? [...new Set([...selected, ...range])] : range;
      window.getSelection()?.removeAllRanges();
    } else {
      if (ctrl) selected = selectedSet.has(row.id) ? selected.filter((id) => id !== row.id) : [...selected, row.id];
      else selected = selected.length === 1 && selected[0] === row.id ? [] : [row.id];
      anchorId = row.id;
    }
    release();
  }

  function groupOf(id){
    return owner.groups?.find((group) => group.id === id) ?? null;
  }

  function membersOf(id){
    return owner.rows.filter((row) => row.group === id);
  }

  function pickGroup(event, id){
    if (onField(event)) return;
    const ids = membersOf(id).map((row) => row.id);
    if (event.ctrlKey || event.metaKey) {
      const all = ids.every((entry) => selectedSet.has(entry));
      selected = all ? selected.filter((entry) => !ids.includes(entry)) : [...new Set([...selected, ...ids])];
    } else selected = ids;
    anchorId = ids[ids.length - 1] ?? null;
    release();
  }

  function ordered(){
    return owner.rows.filter((row) => selectedSet.has(row.id)).map((row) => row.id);
  }

  function copySelected(){
    if (!selected.length) return;
    const data = copyRows(owner, ordered());
    shared[part] = data;
    clip = { ...shared };
    if (part === "power") navigator.clipboard?.writeText(powerTable(data.rows)).catch(() => {});
    onnotice?.(`Copied ${data.rows.length} row${data.rows.length === 1 ? "" : "s"}`);
  }

  function makeRow(rows, source){
    const { id, tag, ...rest } = source;
    if (part === "comms") return newLink({ ...control, links: rows }, rest);
    if (part === "power") return newPowerRow(rows, { ...rest, from: rest.from === "supply" ? "" : rest.from });
    const row = newControlRow({ ...control, rows }, rest);
    if (source.type === "aux") row.tag = tag;
    return row;
  }

  function remap(row, ids){
    if (part === "comms") return;
    if (part === "power") {
      if (ids.has(row.from)) row.from = ids.get(row.from);
      return;
    }
    for (const key of Object.keys(row.signals ?? {})) {
      const value = row.signals[key];
      if (ids.has(value)) row.signals[key] = ids.get(value);
      else if (!control.rows.some((entry) => entry.id === value)) row.signals[key] = "";
    }
  }

  function insertRows(data){
    const order = ordered();
    const ids = pasteRows(owner, data, order[order.length - 1] ?? null, makeRow, remap);
    selected = ids;
    return ids.length;
  }

  function pasteClip(){
    const data = clip[part];
    if (!data) return;
    const count = insertRows(data);
    onnotice?.(`Pasted ${count} row${count === 1 ? "" : "s"}`);
  }

  function duplicateSelected(){
    if (!selected.length) return;
    insertRows(copyRows(owner, ordered()));
  }

  function removeSelected(){
    const ids = [...selected];
    selected = [];
    for (const id of ids) part === "power" ? removeRow(id) : part === "comms" ? removeLink(id) : removeControl(id);
  }

  function groupSelected(groupId = null){
    if (!selected.length) return;
    addToGroup(owner, ordered(), groupId);
  }

  function ungroupSelected(){
    ungroup(owner, ordered());
  }

  function moveSelected(step){
    if (selected.length) moveBy(owner, ordered(), step);
  }

  function listKeydown(event){
    const target = event.target;
    const typing = (target instanceof HTMLInputElement && target.type !== "checkbox") || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
    if (typing || loadLibraryOpen) return;
    const ctrl = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (ctrl && key === "a") selected = owner.rows.map((row) => row.id);
    else if (ctrl && key === "c" && selected.length) copySelected();
    else if (ctrl && key === "x" && selected.length) { copySelected(); removeSelected(); }
    else if (ctrl && key === "v" && clip[part]) pasteClip();
    else if (ctrl && key === "d" && selected.length) duplicateSelected();
    else if (ctrl && key === "g" && selected.length) event.shiftKey ? ungroupSelected() : groupSelected();
    else if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown") && selected.length) moveSelected(event.key === "ArrowUp" ? -1 : 1);
    else if ((event.key === "Delete") && selected.length) removeSelected();
    else if (event.key === "Escape" && selected.length) selected = [];
    else return;
    event.preventDefault();
  }
  let terminalsUsed = $derived(terminalUse(control));
  let contactsUsed = $derived(contactUse(control, power));
  let relayRows = $derived(control.rows.filter((row) => isRelayType(row.type)));

  let customList = $derived(customTypes(control));
  let library = $state(loadLibrary());
  let libraryOnly = $derived(library.filter((entry) => !(control.templates ?? []).some((template) => template.libraryId === entry.id)));

  function useLibrary(id){
    const entry = library.find((item) => item.id === id);
    if (!entry) return null;
    let template = (control.templates ?? []).find((item) => item.libraryId === id);
    if (!template) {
      control.templates = [...(control.templates ?? []), templateFromLibrary(entry)];
      template = control.templates[control.templates.length - 1];
    }
    return template;
  }

  function storeTemplate(template){
    const { list, updated } = saveToLibrary(template);
    library = list;
    onnotice?.(`${updated ? "Updated" : "Saved"} ${template.name || "the device"} ${updated ? "in" : "to"} the library`);
  }

  function forgetLibrary(id){
    library = removeFromLibrary(id);
  }

  function downloadLibrary(){
    const url = URL.createObjectURL(new Blob([exportLibrary()], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "pathfinder-devices.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function loadLibraryFile(event){
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    try {
      const result = importLibrary(await file.text());
      library = result.list;
      onnotice?.(`Library: ${result.added} added, ${result.updated} updated`);
    } catch {
      onnotice?.("That file is not a device library");
    }
  }

  function addTemplate(){
    control.templates = [...(control.templates ?? []), newTemplate()];
  }

  function removeTemplate(id){
    if (control.rows.some((row) => row.type === `custom:${id}`)) return;
    control.templates = control.templates.filter((entry) => entry.id !== id);
  }

  function addTerminal(template){
    template.terminals.push({ label: String(template.terminals.length + 1), connect: "none" });
  }

  function templateWarning(template){
    const count = (kind) => template.terminals.filter((terminal) => terminal.connect === kind).length;
    if (count("contactA") !== count("contactB")) return "Each contact needs one common side and one switched side";
    if (count("gnd") && !count("U")) return "GND of the analog input needs an analog input U";
    if (count("common") && !count("ID")) return "Digital input common needs a digital input ID";
    return "";
  }

  let deviceTab = $state("library");
  let deviceSearch = $state("");
  let deviceOpen = $state(null);
  let openTemplate = $derived(deviceOpen?.kind === "project" ? (control.templates ?? []).find((template) => template.id === deviceOpen.id) ?? null : deviceOpen?.draft ?? null);

  function openDevice(kind, id){
    if (kind === "project") {
      deviceOpen = { kind, id };
      return;
    }
    const entry = library.find((item) => item.id === id);
    if (entry) deviceOpen = { kind, id, draft: { ...JSON.parse(JSON.stringify(entry)), libraryId: entry.id } };
  }

  function newDevice(){
    addTemplate();
    deviceTab = "project";
    deviceOpen = { kind: "project", id: control.templates[control.templates.length - 1].id };
  }

  function saveLibraryDevice(){
    if (deviceOpen?.draft) storeTemplate(deviceOpen.draft);
    deviceOpen = null;
  }

  function deviceSummary(template){
    const count = template.terminals?.length ?? 0;
    return [template.prefix || "no prefix", `${count} terminal${count === 1 ? "" : "s"}`, template.cable].filter(Boolean).join(" · ");
  }

  function addLink(){
    control.links = [...(control.links ?? []), newLink(control)];
  }

  function removeLink(id){
    control.links = control.links.filter((link) => link.id !== id);
  }

  function linkModel(id){
    return control.controllers.find((entry) => entry.id === id)?.model ?? "large";
  }

  function setLinkController(link, id){
    link.controller = id;
    if (!portOf(linkModel(id), link.port)) setLinkPort(link, commPorts(linkModel(id))[0]?.id ?? "");
  }

  function setLinkPort(link, id){
    const before = linkDefaults(linkModel(link.controller), link.port);
    link.port = id;
    const after = linkDefaults(linkModel(link.controller), id);
    if (!link.protocol || link.protocol === before.protocol) link.protocol = after.protocol;
    if (!link.cable || link.cable === before.cable) link.cable = after.cable;
  }

  function setLinkTarget(link, target){
    link.target = target;
    if (target === "controller" && !link.targetController) {
      const other = control.controllers.find((entry) => entry.id !== link.controller);
      if (other) {
        link.targetController = other.id;
        link.targetPort = commPorts(other.model).find((entry) => entry.kind === "serial")?.id ?? "";
      }
    }
    if (target === "display" && link.protocol === "Modbus RTU") link.protocol = "";
  }

  function portTaken(link, controller, id){
    const other = (control.links ?? []).find((entry) => entry !== link && portOf(linkModel(controller), id)?.kind === "eth"
      && ((entry.controller === controller && entry.port === id) || (entry.target === "controller" && entry.targetController === controller && entry.targetPort === id)));
    return other?.tag || "";
  }

  function addController(){
    control.controllers.push(newController(control.controllers));
  }

  function removeController(id){
    if (control.controllers.length <= 1) return;
    control.controllers = control.controllers.filter((entry) => entry.id !== id);
    const first = control.controllers[0].id;
    for (const row of control.rows) if (row.controller === id) row.controller = first;
  }

  function addControl(type){
    if (!type) return;
    if (type.startsWith("lib:")) {
      const template = useLibrary(type.slice(4));
      if (template) control.rows.push(newControlRow(control, { type: `custom:${template.id}` }));
      return;
    }
    control.rows.push(newControlRow(control, { type }));
  }

  function removeControl(id){
    control.rows = control.rows.filter((row) => row.id !== id);
    for (const row of control.rows) {
      for (const key of Object.keys(row.signals ?? {})) if (row.signals[key] === id) row.signals[key] = "";
    }
  }

  function setControlType(row, type){
    row.type = type;
    row.signals = {};
    row.contact = controlTypeOf(type, control).contact ?? "NO";
  }

  function modelFor(row){
    return control.controllers.find((entry) => entry.id === row.controller)?.model ?? "large";
  }

  function takenBy(row, signal, name){
    const others = (terminalsUsed.get(`${row.controller}:${name}`) ?? []).filter((entry) => entry.row.id !== row.id);
    if (!others.length) return "";
    if (signal.kind === "NO" && isRelayType(row.type) && others.every((entry) => isRelayType(entry.row.type))) return "";
    if (signal.kind === "Y" && sharesOutput(row.type) && others.every((entry) => sharesOutput(entry.row.type))) return "";
    return others[0].row.tag || "?";
  }

  function relayLoad(id){
    const relay = relayRows.find((entry) => entry.id === id);
    return { count: contactsUsed.get(id)?.length ?? 0, capacity: controlTypeOf(relay?.type).contacts ?? 0 };
  }

  function hasInput(row){
    return controlTypeOf(row.type, control).signals.some((signal) => signal.kind === "ID");
  }

  let rows = $derived(power.rows);
  let tree = $derived(powerTree(power));
  let products = $state(allProducts());
  let loadLibraryOpen = $state(false);
  let draft = $state(null);
  let libraryTab = $state("products");
  let librarySearch = $state("");
  let sizing = $derived((products, powerSizing(power)));
  const GROUP_TINTS = [
    { fill: "#eff6ff", line: "#3b82f6" },
    { fill: "#f0fdf4", line: "#22c55e" },
    { fill: "#fffbeb", line: "#f59e0b" },
    { fill: "#fdf4ff", line: "#d946ef" },
    { fill: "#ecfeff", line: "#06b6d4" }
  ];
  let groupTint = $derived.by(() => {
    const map = new Map();
    tree.units.filter((unit) => unit.children.length).forEach((unit, index) => {
      const tint = GROUP_TINTS[index % GROUP_TINTS.length];
      map.set(unit.row.id, tint);
      for (const child of unit.children) map.set(child.id, tint);
    });
    return map;
  });
  let tags = $derived(loadTags(power.rows));
  let mains = $derived(rows.filter((row) => row.from === "supply"));
  let tagCounts = $derived.by(() => {
    const counts = new Map();
    for (const row of rows) counts.set(row.tag, (counts.get(row.tag) ?? 0) + 1);
    return counts;
  });

  function addRow(values = {}){
    power.rows.push(newPowerRow(power.rows, values));
  }

  let productModels = $derived(products.map((product) => product.model));

  function setLoadData(row, value){
    const product = productOf(value);
    if (!product) return;
    row.loadData = product.model;
    row.load = product.load;
    if (!row.power && product.power?.max) row.power = formatNumber(product.power.max, 3);
    if (!row.cable) row.cable = product.cable ?? "";
    if (!row.description) row.description = product.description ?? "";
  }

  let checkList = $derived(power.rows.filter((row) => sizing.checks?.get(row.id)?.length).map((row) => ({ row, notes: sizing.checks.get(row.id) })));

  function addFromLibrary(id){
    if (id.startsWith("product:")) {
      const product = products.find((item) => item.article === id.slice(8));
      if (product) power.rows.push(productRow(power.rows, product));
      return;
    }
    const entry = LOAD_LIBRARY.find((item) => item.id === id);
    if (!entry) return;
    const poles = power.supply.phases === 1 && entry.poles.startsWith("3") ? "1p" : entry.poles;
    power.rows.push(libraryRow(power.rows, entry, { poles }));
  }

  function amps(row){
    const value = sizing.currents.get(row.id) ?? 0;
    return value ? `${formatNumber(value)} A` : "";
  }

  function removeRow(id){
    power.rows = power.rows.filter((row) => row.id !== id).map((row) => row.from === id ? { ...row, from: "" } : row);
  }

  let tableScroll = $state(null);
  let canLeft = $state(false);
  let canRight = $state(false);

  function measure(){
    if (!tableScroll) return;
    canLeft = tableScroll.scrollLeft > 2;
    canRight = tableScroll.scrollLeft + tableScroll.clientWidth < tableScroll.scrollWidth - 2;
  }

  function nudge(direction){
    tableScroll?.scrollBy({ left: direction * Math.max(240, tableScroll.clientWidth * 0.6), behavior: "smooth" });
  }

  $effect(() => {
    if (!tableScroll) return;
    const observer = new ResizeObserver(measure);
    observer.observe(tableScroll);
    const table = tableScroll.querySelector("table");
    if (table) observer.observe(table);
    measure();
    return () => observer.disconnect();
  });

  let dragIds = $state([]);
  let dropAt = $state(null);

  function beginDrag(event, ids, label){
    dragIds = ids;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", label);
    const line = event.currentTarget.closest("tr");
    if (line) event.dataTransfer.setDragImage(line, 16, line.offsetHeight / 2);
  }

  function dragStart(event, row){
    beginDrag(event, expand(owner, selectedSet.has(row.id) ? ordered() : [row.id]), row.tag);
  }

  function dragGroupStart(event, id){
    beginDrag(event, membersOf(id).map((row) => row.id), groupOf(id)?.name ?? "");
  }

  function dragOver(event, row, after = null){
    if (!dragIds.length || dragIds.includes(row.id)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const box = event.currentTarget.getBoundingClientRect();
    dropAt = { id: row.id, after: after ?? event.clientY > box.top + box.height / 2 };
  }

  function dropRow(event){
    event.preventDefault();
    if (dragIds.length && dropAt) moveRows(owner, dragIds, dropAt.id, dropAt.after);
    endDrag();
  }

  function endDrag(){
    dragIds = [];
    dropAt = null;
  }

  function oneLine(text){
    return String(text ?? "").split("\n").map((part) => part.trim()).filter(Boolean).join(" ");
  }

  function setProtection(row, kind){
    row.protection = kind;
    row.rating = "";
  }

  function setLoad(row, id){
    row.load = id;
    if (loadOf(id).cabinet && row.poles.startsWith("3")) row.poles = "1p";
  }

  const LIBRARY_LOADS = LOADS.filter((entry) => entry.id !== "none" && !entry.cabinet);
  const RCD_TYPES = [{ id: "", label: "Not stated" }, { id: "AC", label: "AC" }, { id: "A", label: "A" }, { id: "F", label: "F" }, { id: "B", label: "B" }];

  function text(value){
    return value === undefined || value === null || value === 0 ? "" : String(value).replace(".", ",");
  }

  function num(value){
    const number = Number(String(value ?? "").trim().replace(",", "."));
    return Number.isFinite(number) && number > 0 ? number : 0;
  }

  function newDraft(product = null){
    draft = {
      previous: product?.article ?? "",
      article: product?.article ?? "",
      manufacturer: product?.manufacturer ?? "",
      model: product?.model ?? "",
      description: product?.description ?? "",
      load: product?.load ?? "motor",
      poles: product?.poles ?? "1p",
      protection: product?.protection ?? "mcb",
      cable: product?.cable ?? "",
      power: text(product?.power?.max),
      current: text(product?.current?.max),
      inrush: text(product?.inrush),
      leakage: text(product?.leakage),
      rcd: productRcd(product),
      contact: text(product?.contact?.current),
      terminalMin: text(product?.terminals?.min),
      terminalMax: text(product?.terminals?.max),
      motorProtection: product?.motorProtection ?? false,
      link: product?.link ?? ""
    };
  }

  let draftError = $derived.by(() => {
    if (!draft) return "";
    if (!draft.article.trim()) return "Enter the article number";
    if (!draft.model.trim()) return "Enter the model";
    if (!num(draft.current) && !num(draft.power)) return "Enter the max current or the power";
    if (draft.article.trim() !== draft.previous && products.some((product) => product.article === draft.article.trim())) return "That article number is already in the library";
    if (draft.model.trim() !== products.find((product) => product.article === draft.previous)?.model && products.some((product) => product.model === draft.model.trim())) return "That model is already in the library";
    return "";
  });

  function storeDraft(){
    if (!draft || draftError) return;
    const lines = draft.poles.startsWith("3") ? 3 : 1;
    const old = products.find((entry) => entry.article === draft.previous);
    const product = {
      ...(old ?? {}),
      article: draft.article.trim(),
      manufacturer: draft.manufacturer.trim(),
      model: draft.model.trim(),
      description: draft.description.trim(),
      load: draft.load,
      poles: draft.poles,
      protection: draft.protection,
      cable: draft.cable.trim(),
      supply: { ...(old?.supply ?? {}), voltage: lines === 3 ? 400 : 230, phases: lines },
      power: { ...(old?.power ?? {}), max: num(draft.power) },
      current: { ...(old?.current ?? {}), max: num(draft.current) },
      inrush: num(draft.inrush),
      leakage: num(draft.leakage),
      rcd: draft.rcd,
      contact: num(draft.contact) ? { current: num(draft.contact), voltage: 250 } : null,
      terminals: num(draft.terminalMin) || num(draft.terminalMax) ? { min: num(draft.terminalMin), max: num(draft.terminalMax) || 999 } : null,
      motorProtection: draft.motorProtection,
      link: draft.link.trim()
    };
    if (!saveProduct(product, draft.previous || product.article)) onnotice?.("The browser did not allow saving the library");
    if (old && old.model !== product.model) for (const row of power.rows) if (row.loadData === old.model) row.loadData = product.model;
    products = allProducts();
    draft = null;
  }

  function matches(query, ...fields){
    const words = String(query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
    const haystack = fields.join(" ").toLowerCase();
    return words.every((word) => haystack.includes(word));
  }

  function forgetProduct(article){
    removeProduct(article);
    products = allProducts();
  }

  function productSummary(product){
    return [
      product.article,
      poleOf(product.poles).lines === 3 ? "3~ 400 V" : "1~ 230 V",
      product.current?.max ? `${text(product.current.max)} A` : "",
      product.power?.max ? `${text(product.power.max)} kW` : "",
      product.inrush ? `peak ${text(product.inrush)} A` : "",
      productRcd(product) ? `RCD ${productRcd(product)}` : ""
    ].filter(Boolean).join(" · ");
  }

  function draw(){
    ondraw?.();
  }

  function fedLabel(row){
    if (row.from === "supply") return "Incoming";
    return "";
  }
</script>

<style>
  .wiring-view {
    position: absolute;
    inset: 0;
    z-index: 4;
    display: flex;
    flex-direction: column;
    background: #f8fafc;
    font-size: 12px;
    color: #334155;
  }

  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    padding: 8px 16px;
    border-bottom: 1px solid #e2e8f0;
    background: #ffffff;
  }

  .bar h2 {
    margin: 0 6px 0 0;
    font-family: 'Sora', 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    font-size: 14px;
    color: #0f172a;
  }

  .count {
    color: #94a3b8;
  }

  .spacer {
    flex: 1;
  }

  .tabs {
    display: flex;
    gap: 2px;
    padding: 2px;
    border-radius: 6px;
    background: #f1f5f9;
  }

  .tabs button {
    height: 24px;
    border: none;
    background: transparent;
  }

  .tabs button.active {
    background: #ffffff;
    color: #1d4ed8;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
  }

  .scroll {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 12px 16px 40px;
  }

  section {
    margin-bottom: 18px;
  }

  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 6px;
    font-size: 12px;
    font-weight: 700;
    color: #0f172a;
  }

  h3 .count {
    font-weight: 500;
  }

  .supply {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 8px 12px;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
  }

  .supply label {
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-weight: 600;
    color: #475569;
  }

  table {
    width: 100%;
    min-width: 1860px;
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: 0;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
  }

  th {
    position: sticky;
    top: 0;
    padding: 6px 8px;
    border-bottom: 1px solid #e2e8f0;
    background: #f1f5f9;
    font-weight: 600;
    text-align: left;
    white-space: nowrap;
    color: #475569;
  }

  td {
    padding: 10px 6px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr.grouped td {
    background: var(--group-fill);
  }

  tr.grouped td:first-child {
    box-shadow: inset 3px 0 0 var(--group-line);
  }

  tr.child td:nth-child(2) {
    padding-left: 22px;
  }

  textarea.multi {
    display: block;
    width: 100%;
    min-height: 30px;
    padding: 6px 6px;
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    background: #ffffff;
    font-family: inherit;
    font-size: 12px;
    line-height: 16px;
    color: #0f172a;
    resize: none;
    field-sizing: content;
    box-sizing: border-box;
  }

  .table-frame {
    position: relative;
  }

  .table-scroll {
    overflow-x: auto;
    border-radius: 8px;
    scrollbar-width: thin;
  }

  .fade {
    position: absolute;
    top: 1px;
    bottom: 1px;
    width: 48px;
    pointer-events: none;
  }

  .fade.right {
    right: 0;
    border-radius: 0 8px 8px 0;
    background: linear-gradient(to left, rgba(15, 23, 42, 0.14), rgba(15, 23, 42, 0));
  }

  .fade.left {
    left: 0;
    border-radius: 8px 0 0 8px;
    background: linear-gradient(to right, rgba(15, 23, 42, 0.14), rgba(15, 23, 42, 0));
  }

  button.pan {
    position: absolute;
    top: 6px;
    width: 26px;
    height: 26px;
    padding: 0;
    border-radius: 13px;
    border-color: #cbd5e1;
    background: #ffffff;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.2);
    font-size: 16px;
    line-height: 1;
    color: #1d4ed8;
  }

  button.pan.right {
    right: 8px;
  }

  button.pan.left {
    left: 8px;
  }

  table.compact {
    min-width: 0;
    max-width: 900px;
  }

  table.control {
    min-width: 1440px;
  }

  .signals {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
  }

  .signal {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #64748b;
  }

  .signal select {
    width: 112px;
  }

  .signal span {
    flex: none;
    width: 52px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .far-end {
    display: flex;
    gap: 6px;
  }

  .far-end select {
    flex: 1;
    min-width: 0;
  }

  .add-row {
    display: block;
    width: 100%;
    height: 34px;
    margin-top: 8px;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    background: #ffffff;
    color: #475569;
    font: inherit;
    font-weight: 600;
    text-align: center;
    text-align-last: center;
    appearance: none;
    cursor: pointer;
  }

  .add-row:hover {
    border-color: #94a3b8;
    background: #f8fafc;
  }

  .inline-field {
    display: inline-flex;
    white-space: nowrap;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    font-weight: 600;
    color: #475569;
  }

  .inline-field input {
    width: 90px;
  }

  .grip {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 30px;
    border-radius: 4px;
    color: #94a3b8;
    cursor: grab;
  }

  .grip:hover {
    background: #f1f5f9;
    color: #475569;
  }

  .grip svg {
    width: 12px;
    height: 12px;
  }

  tr.dragging td {
    opacity: 0.4;
  }

  .handle {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  tbody tr {
    cursor: default;
  }

  tr.in-group td:first-child,
  tr.group-head td:first-child {
    border-left: 5px solid var(--row-group);
  }

  tr.selected td {
    background: #bfdbfe;
  }

  tr.group-head td {
    padding: 4px 6px;
    background: color-mix(in srgb, var(--row-group) 14%, #ffffff);
    border-bottom: 1px solid color-mix(in srgb, var(--row-group) 30%, #ffffff);
  }

  .group-bar {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .group-bar .group-name {
    width: 220px;
    height: 26px;
    font-weight: 700;
    color: color-mix(in srgb, var(--row-group) 70%, #0f172a);
  }

  .group-bar button {
    height: 24px;
  }

  input.group-color {
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
  }

  .file-button {
    display: inline-flex;
    align-items: center;
    height: 28px;
    padding: 0 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
  }

  .file-button:hover {
    background: #eff6ff;
    color: #1d4ed8;
  }

  .file-button input {
    display: none;
  }

  .warn {
    color: #b45309;
    font-weight: 600;
  }

  .checks {
    margin: 10px 0 0;
    padding: 0;
    list-style: none;
    font-size: 12px;
    color: #475569;
  }

  .checks li {
    padding: 2px 0;
  }

  .checks b {
    display: inline-block;
    min-width: 64px;
    color: #0f172a;
  }

  .row-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin: 0 0 8px;
  }

  .row-actions kbd {
    margin-left: 4px;
    padding: 0 4px;
    border: 1px solid #e2e8f0;
    border-radius: 3px;
    background: #f8fafc;
    font-family: inherit;
    font-size: 10px;
    font-weight: 500;
    color: #94a3b8;
  }

  .row-actions .count {
    min-width: 120px;
    margin-right: 4px;
  }

  button.danger:hover:not(:disabled) {
    background: #fef2f2;
    color: #dc2626;
  }

  tr.drop-before td {
    box-shadow: inset 0 2px 0 #2563eb;
  }

  tr.drop-after td {
    box-shadow: inset 0 -2px 0 #2563eb;
  }

  input[type="text"],
  select {
    width: 100%;
    height: 30px;
    padding: 4px 6px;
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    background: #ffffff;
    font-family: inherit;
    font-size: 12px;
    color: #0f172a;
    box-sizing: border-box;
  }

  input[type="text"]:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  input.bad,
  select.bad {
    border-color: #f87171;
    background: #fef2f2;
  }

  button {
    height: 28px;
    padding: 0 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    white-space: nowrap;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: #eff6ff;
    color: #1d4ed8;
  }

  button:disabled {
    color: #cbd5e1;
    cursor: not-allowed;
  }

  button.primary {
    border-color: #2563eb;
    background: #2563eb;
    color: #ffffff;
  }

  button.primary:hover:not(:disabled) {
    background: #1d4ed8;
    color: #ffffff;
  }

  button.icon {
    width: 22px;
    height: 22px;
    padding: 0;
    border-color: transparent;
    color: #94a3b8;
  }

  button.icon:hover:not(:disabled) {
    background: #f1f5f9;
  }

  button.remove:hover {
    background: #fef2f2;
    color: #dc2626;
  }

  td.current {
    color: #64748b;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  input::placeholder {
    color: #94a3b8;
  }

  .empty {
    padding: 14px;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    color: #94a3b8;
    text-align: center;
  }

  .help {
    margin: 6px 0 0;
    color: #64748b;
  }

  .load-library {
    font-size: 14px;
    color: #334155;
  }

  .library-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .library-tabs button {
    height: 32px;
    padding: 0 14px;
    font-size: 14px;
  }

  .load-library button {
    font-size: 13px;
  }

  .load-library .library-bar button.primary,
  .load-library .entries li > button:not(.entry) {
    flex: none;
    width: 130px;
    height: 32px;
    padding: 0 12px;
  }

  .library-search {
    flex: 1;
    max-width: 420px;
    height: 34px;
    padding: 6px 10px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 14px;
  }

  .library-search:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .device-terminals {
    max-width: 900px;
    font-size: 14px;
  }

  .device-terminals th {
    font-size: 13px;
  }

  .device-terminals td {
    padding: 4px 6px;
  }

  .device-terminals input,
  .device-terminals select {
    height: 34px;
    font-size: 14px;
  }

  .add-terminal {
    height: 32px;
    margin-top: 10px;
    padding: 0 12px;
  }

  .load-library .file-button {
    height: 32px;
    font-size: 13px;
  }

  .entries li.no-match {
    padding: 16px 10px;
    color: #94a3b8;
  }

  .entries {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .entries li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px 0;
    border-bottom: 1px solid #f1f5f9;
  }

  .entry {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    height: auto;
    padding: 8px 10px;
    border: none;
    border-radius: 6px;
    background: none;
    text-align: left;
    cursor: pointer;
  }

  .entry.static {
    cursor: default;
  }

  button.entry:hover {
    background: #f1f5f9;
  }

  .entry-title {
    font-size: 15px;
    font-weight: 600;
    color: #0f172a;
  }

  .entry-meta {
    font-size: 13px;
    font-weight: 400;
    color: #64748b;
  }

  .back {
    height: 30px;
    margin-bottom: 8px;
    border: none;
    background: none;
    color: #1d4ed8;
    font-weight: 600;
    cursor: pointer;
  }

  .product-form h4 {
    margin: 18px 0 10px;
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
  }

  .product-form h4:first-child {
    margin-top: 4px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px 18px;
  }

  .form-grid label {
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
  }

  .form-grid label.span2 {
    grid-column: span 2;
  }

  .form-grid label.span4 {
    grid-column: 1 / -1;
  }

  .link-field {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .link-field input {
    flex: 1;
    min-width: 0;
  }

  .link-field a {
    flex: none;
    color: #1d4ed8;
    font-weight: 600;
    text-decoration: none;
  }

  .link-field a:hover {
    text-decoration: underline;
  }

  .form-grid label.check {
    flex-direction: row;
    align-items: center;
    align-self: end;
    height: 36px;
    font-weight: 400;
    color: #334155;
  }

  .form-grid input[type="text"],
  .form-grid select,
  .form-grid :global(.combo input) {
    height: 36px;
    padding: 6px 10px;
    font-size: 14px;
  }

  .form-grid :global(.combo .toggle) {
    width: 28px;
  }
</style>

<svelte:window onkeydown={listKeydown}/>

{#snippet rowHandle(row)}
  <div class="handle">
    <span class="grip" role="button" tabindex="-1" draggable="true" aria-label="Drag to reorder" title="Drag to reorder · drags all selected rows and whole groups"
          ondragstart={(event) => dragStart(event, row)} ondragend={endDrag}>
      <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
        <circle cx="4" cy="2.5" r="1.1"/><circle cx="8" cy="2.5" r="1.1"/><circle cx="4" cy="6" r="1.1"/><circle cx="8" cy="6" r="1.1"/><circle cx="4" cy="9.5" r="1.1"/><circle cx="8" cy="9.5" r="1.1"/>
      </svg>
    </span>
  </div>
{/snippet}

{#snippet groupHead(row, span)}
  {@const group = groupOf(row.group)}
  {@const members = membersOf(row.group)}
  {#if group}
    <tr class="group-head" style:--row-group={group.color}
        class:drop-before={dropAt?.id === members[0]?.id && !dropAt.after && !dragIds.includes(members[0]?.id)}
        ondragover={(event) => dragOver(event, members[0], false)} ondrop={dropRow} onclick={(event) => pickGroup(event, group.id)}>
      <td>
        <div class="handle">
          <span class="grip" role="button" tabindex="-1" draggable="true" aria-label="Drag the group" title="Drag the whole group"
                ondragstart={(event) => dragGroupStart(event, group.id)} ondragend={endDrag}>
            <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <circle cx="4" cy="2.5" r="1.1"/><circle cx="8" cy="2.5" r="1.1"/><circle cx="4" cy="6" r="1.1"/><circle cx="8" cy="6" r="1.1"/><circle cx="4" cy="9.5" r="1.1"/><circle cx="8" cy="9.5" r="1.1"/>
            </svg>
          </span>
        </div>
      </td>
      <td colspan={span}>
        <div class="group-bar">
          <input type="color" class="group-color" aria-label="Group colour" title="Group colour" value={group.color} oninput={(event) => group.color = event.currentTarget.value.toUpperCase()}>
          <input type="text" class="group-name" aria-label="Group name" bind:value={group.name} spellcheck="false">
          <span class="count">{members.length} row{members.length === 1 ? "" : "s"}</span>
          <button type="button" onclick={() => dissolve(owner, group.id)} title="Keep the rows, remove the group">Ungroup</button>
        </div>
      </td>
    </tr>
  {/if}
{/snippet}

{#snippet rowActions()}
  {#if owner.rows.length || clip[part]}
    <div class="row-actions">
      <span class="count">{selected.length ? `${selected.length} selected` : "Click a row to select it · Ctrl+click adds rows · Shift+click selects a range"}</span>
      <button type="button" disabled={!selected.length} onclick={copySelected} title="Copy the selected rows · Ctrl+C">Copy <kbd>Ctrl+C</kbd></button>
      <button type="button" disabled={!clip[part]} onclick={pasteClip} title="Paste after the last selected row, or at the end · Ctrl+V">Paste <kbd>Ctrl+V</kbd></button>
      <button type="button" disabled={!selected.length} onclick={duplicateSelected} title="Copy and paste in one step · Ctrl+D">Duplicate <kbd>Ctrl+D</kbd></button>
      <button type="button" disabled={!selected.length} onclick={() => moveSelected(-1)} title="Move up · Alt+↑" aria-label="Move up">↑</button>
      <button type="button" disabled={!selected.length} onclick={() => moveSelected(1)} title="Move down · Alt+↓" aria-label="Move down">↓</button>
      <select class="library" aria-label="Add the selected rows to a group" value="" disabled={!selected.length}
              onchange={(event) => { const value = event.currentTarget.value; event.currentTarget.value = ""; if (value) groupSelected(value === "new" ? null : value); }}>
        <option value="">Add to group…</option>
        <option value="new">New group · Ctrl+G</option>
        {#each owner.groups ?? [] as group (group.id)}
          <option value={group.id}>{group.name || "Group"}</option>
        {/each}
      </select>
      <button type="button" disabled={!selected.some((id) => owner.rows.find((row) => row.id === id)?.group)} onclick={ungroupSelected} title="Take the selected rows out of their group · Ctrl+Shift+G">Ungroup</button>
      <button type="button" class="danger" disabled={!selected.length} onclick={removeSelected} title="Delete">Delete</button>
    </div>
  {/if}
{/snippet}

<datalist id="protocols">
  {#each PROTOCOLS as protocol (protocol)}
    <option value={protocol}></option>
  {/each}
</datalist>

<div class="wiring-view">
  <div class="bar">
    <h2>Wiring list</h2>
    <div class="tabs" role="tablist" aria-label="Wiring list part">
      <button type="button" role="tab" class:active={part === "power"} aria-selected={part === "power"} onclick={() => switchPart("power")}>Power</button>
      <button type="button" role="tab" class:active={part === "control"} aria-selected={part === "control"} onclick={() => switchPart("control")}>Control</button>
      <button type="button" role="tab" class:active={part === "comms"} aria-selected={part === "comms"} onclick={() => switchPart("comms")}>Communication</button>
    </div>
    {#if part === "comms"}
      <span class="count">{control.links?.length ?? 0} link{control.links?.length === 1 ? "" : "s"}</span>
    {:else}
      <span class="count">{part === "power" ? rows.length : control.rows.length} device{(part === "power" ? rows.length : control.rows.length) === 1 ? "" : "s"}</span>
    {/if}
    <span class="spacer"></span>
    {#if part === "control"}
      <button type="button" onclick={addController} title="Another controller or extension module">+ Controller</button>
      <button type="button" onclick={() => libraryOpen = true} title="The device library and the custom devices of this project">Library…</button>
    {:else if part === "comms"}
      <button type="button" onclick={addLink} title="A cable from a controller port to the CNS, another controller or a display">+ Link</button>
    {:else}
    <button type="button" onclick={() => addRow({ protection: "switch", poles: power.supply.phases === 1 ? "1p+N" : "3p+N", load: "none", from: mains.length ? "" : "supply", description: "Glavno stikalo" })}
            disabled={mains.length > 0} title="The main switch or breaker between the incoming supply and the rails">+ Main switch</button>
    <button type="button" onclick={() => addRow({ protection: "rcd", poles: power.supply.phases === 1 ? "1p+N" : "3p+N", load: "none" })}
            title="An RCD that protects several feeders · set their Fed from to this RCD">+ RCD group</button>
    <button type="button" onclick={() => addRow()} title="One breaker feeding one load">+ Feeder</button>
    <button type="button" onclick={() => loadLibraryOpen = true} title="Products and generic loads · add them to the list or add new products">Library…</button>
    {/if}
    <button type="button" class="primary" onclick={draw}
            title="Draw the power and control pages at the start of the wiring diagram · pages drawn before are replaced">Draw pages</button>
  </div>

  <div class="scroll">
    {#if part === "control"}
    <section>
      <h3>Controllers <span class="count">{control.controllers.length}</span></h3>
      <table class="compact">
        <colgroup>
          <col style="width: 90px">
          <col style="width: 260px">
          <col>
          <col style="width: 30px">
        </colgroup>
        <thead>
          <tr><th>Tag</th><th>Model</th><th>Description</th><th></th></tr>
        </thead>
        <tbody>
          {#each control.controllers as entry (entry.id)}
            <tr>
              <td><input type="text" bind:value={entry.tag} aria-label="Controller tag" spellcheck="false"></td>
              <td>
                <select aria-label="Controller model" bind:value={entry.model}>
                  {#each CONTROLLER_MODELS.filter((model) => !model.gateway) as model (model.id)}
                    <option value={model.id}>{model.label}{model.part ? ` · ${model.part}` : ""}</option>
                  {/each}
                  <optgroup label="Gateways and switches · communication only">
                    {#each CONTROLLER_MODELS.filter((model) => model.gateway) as model (model.id)}
                      <option value={model.id}>{model.label}</option>
                    {/each}
                  </optgroup>
                </select>
              </td>
              <td><input type="text" bind:value={entry.description} aria-label="Controller description"></td>
              <td><button type="button" class="icon remove" aria-label="Remove controller" disabled={control.controllers.length <= 1} onclick={() => removeController(entry.id)}>✕</button></td>
            </tr>
          {/each}
        </tbody>
      </table>
      <label class="inline-field">Control terminals <input type="text" bind:value={control.strip} placeholder="-X2" spellcheck="false"></label>
    </section>

    <section>
      <h3>Control devices <span class="count">{control.rows.length}</span></h3>
      {@render rowActions()}
      {#if !control.rows.length}
        <div class="empty">No control devices yet · add sensors, valves, relays and pumps with + Add device below</div>
      {:else}
        <div class="table-frame">
        <div class="table-scroll">
        <table class="control">
          <colgroup>
            <col style="width: 30px">
            <col style="width: 80px">
            <col style="width: 200px">
            <col style="width: 220px">
            <col style="width: 90px">
            <col style="width: 300px">
            <col style="width: 70px">
            <col style="width: 70px">
            <col style="width: 170px">
            <col style="width: 140px">
            <col style="width: 30px">
          </colgroup>
          <thead>
            <tr>
              <th></th>
              <th>Tag</th>
              <th>Description</th>
              <th>Device</th>
              <th>Controller</th>
              <th title="Controller terminal or relay for each signal of the device · terminals in use elsewhere are shown with their tag">Connection</th>
              <th title="Contact type of a digital input, written above the controller terminal">Contact</th>
              <th title="Terminal strip · empty uses the control terminals above">Terminals</th>
              <th>Cable</th>
              <th title="Type or model printed in the device box">Model</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each control.rows as row, index (row.id)}
              {@const type = controlTypeOf(row.type, control)}
              {#if row.group && control.rows[index - 1]?.group !== row.group}
                {@render groupHead(row, 10)}
              {/if}
              <tr class:dragging={dragIds.includes(row.id)} class:selected={selectedSet.has(row.id)} class:in-group={row.group} style:--row-group={groupOf(row.group)?.color}
                  class:drop-before={dropAt?.id === row.id && !dropAt.after}
                  class:drop-after={dropAt?.id === row.id && dropAt.after}
                  ondragover={(event) => dragOver(event, row)} ondrop={dropRow} onclick={(event) => pickRow(event, row)}>
                <td>{@render rowHandle(row)}</td>
                <td><input type="text" bind:value={row.tag} aria-label="Tag" spellcheck="false" placeholder={row.type === "aux" ? "-F5" : ""}
                           class:bad={row.type === "aux" && !row.tag} title={row.type === "aux" ? "Tag of the breaker whose auxiliary contact this is" : undefined}></td>
                <td><textarea class="multi" rows="1" bind:value={row.description} aria-label="Description"></textarea></td>
                <td>
                  <select aria-label="Device" value={row.type} onchange={(event) => setControlType(row, event.currentTarget.value)}>
                    {#each CONTROL_TYPES as entry (entry.id)}
                      <option value={entry.id}>{entry.label}</option>
                    {/each}
                    {#if customList.length}
                      <optgroup label="Custom devices">
                        {#each customList as entry (entry.id)}
                          <option value={entry.id}>{entry.label}</option>
                        {/each}
                      </optgroup>
                    {/if}
                  </select>
                </td>
                <td>
                  <select aria-label="Controller" bind:value={row.controller}>
                    {#each control.controllers.filter((entry) => !isGateway(entry.model) || entry.id === row.controller) as entry (entry.id)}
                      <option value={entry.id}>{entry.tag || "?"}</option>
                    {/each}
                  </select>
                </td>
                <td><div class="signals">
                  {#each type.signals as signal (signal.key)}
                    <label class="signal">
                      <span>{signal.label}</span>
                      {#if signal.kind === "relay"}
                        {@const load = relayLoad(row.signals?.[signal.key])}
                        <select aria-label={signal.label} class:bad={!row.signals?.[signal.key] || load.count > load.capacity}
                                bind:value={() => row.signals?.[signal.key] ?? "", (value) => row.signals[signal.key] = value}>
                          <option value="">—</option>
                          <optgroup label="Relay contact (potential-free)">
                            {#each relayRows as relay (relay.id)}
                              {@const use = relayLoad(relay.id)}
                              <option value={relay.id}>{relay.tag || "?"} · {use.count}/{use.capacity} contacts</option>
                            {:else}
                              <option value="" disabled>Add a relay first</option>
                            {/each}
                          </optgroup>
                          <optgroup label="Controller output (24 VAC)">
                            {#each modelTerminals(modelFor(row), "NO") as name (name)}
                              {@const taken = takenBy(row, signal, name)}
                              <option value={name} disabled={Boolean(taken) && row.signals?.[signal.key] !== name}>{name} · 24 VAC{taken ? ` · ${taken}` : ""}</option>
                            {/each}
                          </optgroup>
                        </select>
                      {:else}
                        <select aria-label={signal.label} class:bad={!row.signals?.[signal.key]}
                                bind:value={() => row.signals?.[signal.key] ?? "", (value) => row.signals[signal.key] = value}>
                          <option value="">—</option>
                          {#each modelTerminals(modelFor(row), signal.kind) as name (name)}
                            {@const taken = takenBy(row, signal, name)}
                            <option value={name} disabled={Boolean(taken) && row.signals?.[signal.key] !== name}>{name}{taken ? ` · ${taken}` : ""}</option>
                          {/each}
                        </select>
                      {/if}
                    </label>
                  {/each}
                </div></td>
                <td>
                  <select aria-label="Contact" bind:value={row.contact} disabled={!hasInput(row)}>
                    <option value="NO">NO</option>
                    <option value="NC">NC</option>
                  </select>
                </td>
                <td><input type="text" bind:value={row.strip} aria-label="Terminal strip" placeholder={isRelayType(row.type) || row.type === "aux" ? "" : control.strip || "-X2"}
                           disabled={isRelayType(row.type) || row.type === "aux"} spellcheck="false"></td>
                <td><Combo bind:value={row.cable} options={CABLE_TYPES} label="Cable" placeholder={type.cable ?? ""}
                           disabled={isRelayType(row.type) || row.type === "aux"}/></td>
                <td><input type="text" bind:value={row.model} aria-label="Model" disabled={isRelayType(row.type) || row.type === "aux"}></td>
                <td><button type="button" class="icon remove" aria-label="Remove" onclick={() => removeControl(row.id)}>✕</button></td>
              </tr>
            {/each}
          </tbody>
        </table>
        </div>
        </div>
      {/if}
      <select class="add-row" aria-label="Add a control device" value=""
              onchange={(event) => { addControl(event.currentTarget.value); event.currentTarget.value = ""; }}>
        <option value="">+ Add device</option>
        {#each CONTROL_TYPES as type (type.id)}
          <option value={type.id}>{type.label}</option>
        {/each}
        {#if customList.length}
          <optgroup label="Custom devices">
            {#each customList as type (type.id)}
              <option value={type.id}>{type.label}</option>
            {/each}
          </optgroup>
        {/if}
        {#if libraryOnly.length}
          <optgroup label="From the library">
            {#each libraryOnly as entry (entry.id)}
              <option value={`lib:${entry.id}`}>{entry.name || "Custom device"}</option>
            {/each}
          </optgroup>
        {/if}
      </select>
      {#if control.rows.length}
        <p class="help">Relays and contactors take a controller output; their contacts are used by devices that pick them under Connection, and by power feeders whose Switched by is the relay's tag. Several relays may share one output. A device can also take a controller output directly, which switches live 24 VAC from SP; its return goes to SN.
          Digital inputs are fed from SP on c.pCO Large and Extralarge, and from the input's GND on c.pCO mini and c.pCOe.</p>
      {/if}
    </section>
    {:else if part === "comms"}
    <section>
      <h3>Communication links <span class="count">{control.links?.length ?? 0}</span></h3>
      {@render rowActions()}
      {#if !control.links?.length}
        <div class="empty">No links yet · connect a controller port to the CNS, another controller or a pGDx display with + Add link below</div>
      {:else}
        <div class="table-frame">
        <div class="table-scroll">
        <table class="control">
          <colgroup>
            <col style="width: 30px">
            <col style="width: 90px">
            <col style="width: 200px">
            <col style="width: 90px">
            <col style="width: 120px">
            <col style="width: 210px">
            <col style="width: 250px">
            <col style="width: 130px">
            <col style="width: 170px">
            <col style="width: 70px">
            <col style="width: 30px">
          </colgroup>
          <thead>
            <tr>
              <th></th>
              <th title="Tag of the cable, e.g. -W.TPCNS">Cable</th>
              <th title="Printed under the link on the drawing">Description</th>
              <th>Controller</th>
              <th title="Communication port of the controller">Port</th>
              <th>Connects to</th>
              <th title="Text at the far end, the other controller and its port, or the tag of the display">Far end</th>
              <th>Protocol</th>
              <th>Cable type</th>
              <th title="Terminal strip a serial line to outside the panel lands on · empty uses the control terminals">Terminals</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each control.links as link, index (link.id)}
              {@const model = linkModel(link.controller)}
              {#if link.group && control.links[index - 1]?.group !== link.group}
                {@render groupHead(link, 10)}
              {/if}
              <tr class:dragging={dragIds.includes(link.id)} class:selected={selectedSet.has(link.id)} class:in-group={link.group} style:--row-group={groupOf(link.group)?.color}
                  class:drop-before={dropAt?.id === link.id && !dropAt.after}
                  class:drop-after={dropAt?.id === link.id && dropAt.after}
                  ondragover={(event) => dragOver(event, link)} ondrop={dropRow} onclick={(event) => pickRow(event, link)}>
                <td>{@render rowHandle(link)}</td>
                <td><input type="text" bind:value={link.tag} aria-label="Cable tag" spellcheck="false"></td>
                <td><textarea class="multi" rows="1" bind:value={link.description} aria-label="Description"></textarea></td>
                <td>
                  <select aria-label="Controller" value={link.controller} onchange={(event) => setLinkController(link, event.currentTarget.value)}>
                    {#each control.controllers as entry (entry.id)}
                      <option value={entry.id}>{entry.tag || "?"}</option>
                    {/each}
                  </select>
                </td>
                <td>
                  <select aria-label="Port" value={link.port} class:bad={!portOf(model, link.port)} onchange={(event) => setLinkPort(link, event.currentTarget.value)}>
                    {#if !portOf(model, link.port)}<option value={link.port}>—</option>{/if}
                    {#each commPorts(model) as entry (entry.id)}
                      {@const taken = portTaken(link, link.controller, entry.id)}
                      <option value={entry.id} disabled={Boolean(taken) && link.port !== entry.id}>{entry.label}{taken ? ` · ${taken}` : ""}</option>
                    {/each}
                  </select>
                </td>
                <td>
                  <select aria-label="Connects to" value={link.target} onchange={(event) => setLinkTarget(link, event.currentTarget.value)}>
                    {#each LINK_TARGETS as entry (entry.id)}
                      <option value={entry.id} disabled={entry.id === "controller" && control.controllers.length < 2}>{entry.label}</option>
                    {/each}
                  </select>
                </td>
                <td>
                  {#if link.target === "controller"}
                    {@const other = control.controllers.find((entry) => entry.id === link.targetController)}
                    <div class="far-end">
                      <select aria-label="Other controller" bind:value={link.targetController} class:bad={!other || other.id === link.controller}>
                        <option value="">—</option>
                        {#each control.controllers.filter((entry) => entry.id !== link.controller) as entry (entry.id)}
                          <option value={entry.id}>{entry.tag || "?"}</option>
                        {/each}
                      </select>
                      <select aria-label="Port of the other controller" bind:value={link.targetPort} class:bad={!other || !portOf(other.model, link.targetPort)}>
                        <option value="">—</option>
                        {#each other ? commPorts(other.model) : [] as entry (entry.id)}
                          <option value={entry.id}>{entry.label}</option>
                        {/each}
                      </select>
                    </div>
                  {:else if link.target === "display"}
                    <input type="text" bind:value={link.display} aria-label="Display tag" spellcheck="false" placeholder="-TD1">
                  {:else}
                    <input type="text" bind:value={link.text} aria-label="Far end" placeholder="POVEZAVA NA CNS">
                  {/if}
                </td>
                <td>
                  <input type="text" list="protocols" bind:value={link.protocol} aria-label="Protocol" spellcheck="false">
                </td>
                <td><Combo bind:value={link.cable} options={LINK_CABLES} label="Cable type"/></td>
                <td><input type="text" bind:value={link.strip} aria-label="Terminal strip" spellcheck="false" placeholder={control.strip || "-X2"}
                           disabled={!(link.target === "external" && portOf(model, link.port)?.kind === "serial")}></td>
                <td><button type="button" class="icon remove" aria-label="Remove" onclick={() => removeLink(link.id)}>✕</button></td>
              </tr>
            {/each}
          </tbody>
        </table>
        </div>
        </div>
      {/if}
      <button type="button" class="add-row" onclick={addLink}>+ Add link</button>
      <p class="help">Each link is one cable from a controller port. Ethernet goes to the CNS or another network device, serial ports (FBus, BMS, pLAN) are drawn as a shielded pair with − + GND.
        A link to another controller is drawn on both controllers' pages. A pGDx display gets a data cable from the port and a supply cable from SP/SN through the control terminals. A serial port going outside the panel is drawn through its terminals and cable to a Modbus line mark with the far end written next to it.
        A MOXA MGate gateway or EDS switch is added under Controllers on the Control tab; its ports then appear here. A gateway's page gets its own 24 V DC supply.
        A switch is drawn with all its ports, and the controllers linked to it are drawn next to it with a UTP cable to their port.
        The links are drawn on KOMUNIKACIJA pages after the control pages. Controllers are set up on the Control tab.</p>
    </section>
    {:else}
    <section>
      <h3>Incoming supply</h3>
      <div class="supply">
        <label>
          Supply
          <select bind:value={power.supply.phases}>
            <option value={3}>3~ 400/230 V · L1 L2 L3 N PE</option>
            <option value={1}>1~ 230 V · L N PE</option>
          </select>
        </label>
        <label title="How the supply is earthed · TN-S has separate N and PE all the way from the transformer">
          System
          <select bind:value={power.supply.system}>
            {#each SYSTEMS as entry (entry.id)}
              <option value={entry.id}>{entry.label}</option>
            {/each}
          </select>
        </label>
        <label>
          Supply cable tag
          <input type="text" bind:value={power.supply.tag} placeholder="-W.DOVOD">
        </label>
        <label>
          Supply cable type
          <Combo bind:value={power.supply.cable} options={CABLE_TYPES} label="Supply cable type" placeholder="NHXMH-J 5x2,5mm2"/>
        </label>
        <label>
          Description
          <input type="text" bind:value={power.supply.description} placeholder="DOVOD">
        </label>
        <label title="Terminals where the incoming supply cable lands">
          Incoming terminals
          <input type="text" bind:value={power.supply.incoming} placeholder="-X0" spellcheck="false">
        </label>
        <label title="Terminals for the outgoing feeder cables">
          Feeder terminals
          <input type="text" bind:value={power.supply.strip} placeholder="-X1" spellcheck="false">
        </label>
      </div>
    </section>

    <section>
      <h3>Protection and loads <span class="count">{rows.length}</span></h3>
      {@render rowActions()}
      {#if !rows.length}
        <div class="empty">No devices yet · add a main switch, RCD groups and feeders with the buttons above or below, or paste rows from Excel</div>
      {:else}
        <div class="table-frame">
        <div class="table-scroll" bind:this={tableScroll} onscroll={measure}>
        <table>
          <colgroup>
            <col style="width: 30px">
            <col style="width: 80px">
            <col style="width: 200px">
            <col style="width: 128px">
            <col style="width: 84px">
            <col style="width: 70px">
            <col style="width: 62px">
            <col style="width: 120px">
            <col style="width: 80px">
            <col style="width: 150px">
            <col style="width: 74px">
            <col style="width: 64px">
            <col style="width: 64px">
            <col style="width: 62px">
            <col style="width: 130px">
            <col style="width: 150px">
            <col style="width: 70px">
            <col style="width: 110px">
            <col style="width: 30px">
          </colgroup>
          <thead>
            <tr>
              <th></th>
              <th>Tag</th>
              <th>Description</th>
              <th>Protection</th>
              <th title="Empty sizes it automatically from the load power (feeders) or from what is connected below (RCD groups, main switch)">Rating</th>
              <th>Poles</th>
              <th title="Phase of a single-pole feeder · empty spreads them over L1, L2 and L3">Phase</th>
              <th title="Where the device takes its supply · main rails, the incoming supply (main switch) or an RCD group">Fed from</th>
              <th title="Contactor or relay whose contact switches this feeder after its breaker, e.g. -K1 · empty when the load is not switched">Switched by</th>
              <th>Load</th>
              <th>Load tag</th>
              <th title="Electrical power of the load, e.g. 0,37">kW</th>
              <th title="Maximum current from the data sheet · when filled in it is used instead of the kW calculation">Max A</th>
              <th title="Current used for sizing · Max A if filled in, otherwise calculated from kW">Current</th>
              <th title="Power, model or output, e.g. 0,37 kW or 230VAC/24VDC 2,5A">Load data</th>
              <th title="Empty uses NHXMH-J with one core per terminal">Cable</th>
              <th title="Terminal strip the feeder cable lands on · empty uses the Feeder terminals of the supply">Terminals</th>
              <th title="2-pole breaker on the low-voltage side of a transformer or PSU, e.g. -F10 C6 · empty for none">LV protection</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each power.rows as row, index (row.id)}
              {@const load = loadOf(row.load)}
              {@const groupChild = row.from && row.from !== "supply" && tree.units.some((unit) => unit.children.includes(row))}
              {@const tint = groupTint.get(row.id)}
              {#if row.group && power.rows[index - 1]?.group !== row.group}
                {@render groupHead(row, 18)}
              {/if}
              <tr class:child={groupChild} class:grouped={tint} style:--group-fill={tint?.fill} style:--group-line={tint?.line} class:dragging={dragIds.includes(row.id)}
                  class:selected={selectedSet.has(row.id)} class:in-group={row.group} style:--row-group={groupOf(row.group)?.color}
                  class:drop-before={dropAt?.id === row.id && !dropAt.after}
                  class:drop-after={dropAt?.id === row.id && dropAt.after}
                  ondragover={(event) => dragOver(event, row)} ondrop={dropRow} onclick={(event) => pickRow(event, row)}>
                <td>{@render rowHandle(row)}</td>
                <td><input type="text" class:bad={row.protection === "none" ? Boolean(row.tag) && (tagCounts.get(row.tag) ?? 0) > 1 : !row.tag || (tagCounts.get(row.tag) ?? 0) > 1}
                           bind:value={row.tag} aria-label="Tag" spellcheck="false" placeholder={row.protection === "none" ? "—" : ""}></td>
                <td><textarea class="multi" rows="1" bind:value={row.description} aria-label="Description" placeholder={fedLabel(row)}
                              title="Shift+Enter or Enter starts a new line in the drawing"></textarea></td>
                <td>
                  <select aria-label="Protection" value={row.protection} onchange={(event) => setProtection(row, event.currentTarget.value)}>
                    {#each PROTECTION_KINDS as kind (kind.id)}
                      <option value={kind.id}>{kind.label}</option>
                    {/each}
                    <option value="none" disabled={!groupChild && row.protection !== "none"}>None · uses the breaker above</option>
                  </select>
                </td>
                <td><input type="text" bind:value={row.rating} aria-label="Rating" spellcheck="false" disabled={row.protection === "none"}
                           placeholder={row.protection === "none" ? "" : sizing.ratings.get(row.id) || "set kW"} title={row.rating ? undefined : "Automatic · type a value to override"}></td>
                <td>
                  <select aria-label="Poles" bind:value={row.poles}>
                    {#each POLES as pole (pole.id)}
                      <option value={pole.id} disabled={power.supply.phases === 1 && pole.lines === 3}>{pole.id}</option>
                    {/each}
                  </select>
                </td>
                <td>
                  <select aria-label="Phase" bind:value={row.phase} disabled={row.poles.startsWith("3") || power.supply.phases === 1}>
                    <option value="">Auto</option>
                    {#each PHASES as phase (phase)}
                      <option value={phase}>{phase}</option>
                    {/each}
                  </select>
                </td>
                <td>
                  <select aria-label="Fed from" bind:value={row.from} class:bad={row.from === "supply" && mains[0] !== row}>
                    <option value="">Main rails</option>
                    <option value="supply" disabled={mains.length > 0 && mains[0] !== row}>Incoming supply</option>
                    {#each power.rows.filter((other) => other !== row && loadOf(other.load).id === "none") as other (other.id)}
                      <option value={other.id}>{other.tag}{other.description ? ` · ${oneLine(other.description)}` : ""}</option>
                    {/each}
                  </select>
                </td>
                <td><input type="text" bind:value={row.switchedBy} aria-label="Switched by" placeholder={load.id === "none" || load.cabinet ? "" : "-K…"}
                           disabled={load.id === "none" || load.cabinet} spellcheck="false"></td>
                <td>
                  <select aria-label="Load" value={row.load} onchange={(event) => setLoad(row, event.currentTarget.value)}>
                    {#each LOADS as entry (entry.id)}
                      <option value={entry.id}>{entry.label}</option>
                    {/each}
                  </select>
                </td>
                <td><input type="text" bind:value={row.loadTag} aria-label="Load tag" disabled={load.id === "none"}
                           placeholder={tags.get(row.id) ?? ""} spellcheck="false"></td>
                <td><input type="text" bind:value={row.power} aria-label="Power in kW" disabled={load.id === "none"} inputmode="decimal" spellcheck="false"></td>
                <td><input type="text" bind:value={row.maxCurrent} aria-label="Maximum current in A" disabled={load.id === "none"} inputmode="decimal" spellcheck="false"></td>
                <td class="current">{amps(row)}</td>
                <td><Combo bind:value={row.loadData} options={productModels} label="Load data" disabled={load.id === "none"} onchange={(value) => setLoadData(row, value)}/></td>
                <td><Combo bind:value={row.cable} options={CABLE_TYPES} label="Cable" disabled={load.id === "none" || load.cabinet}
                           placeholder={load.id === "none" || load.cabinet ? "" : "NHXMH-J"}/></td>
                <td><input type="text" bind:value={row.strip} aria-label="Terminal strip" disabled={load.id === "none" || load.cabinet}
                           placeholder={load.id === "none" || load.cabinet ? "" : power.supply.strip || "-X1"} spellcheck="false"></td>
                <td><input type="text" bind:value={row.lvProtection} aria-label="Low-voltage protection" disabled={!load.cabinet || load.kind === "socket"}
                           placeholder={load.cabinet && load.kind !== "socket" ? "-F10 C6" : ""} spellcheck="false"></td>
                <td><button type="button" class="icon remove" aria-label="Remove" onclick={() => removeRow(row.id)}>✕</button></td>
              </tr>
            {/each}
          </tbody>
        </table>
        </div>
        {#if canLeft}
          <div class="fade left" aria-hidden="true"></div>
          <button type="button" class="pan left" aria-label="Scroll the table left" title="More columns on the left" onclick={() => nudge(-1)}>‹</button>
        {/if}
        {#if canRight}
          <div class="fade right" aria-hidden="true"></div>
          <button type="button" class="pan right" aria-label="Scroll the table right" title="More columns on the right · scroll sideways or use Shift + mouse wheel" onclick={() => nudge(1)}>›</button>
        {/if}
        </div>
      {/if}
      <button type="button" class="add-row" onclick={() => addRow()} title="One breaker feeding one load">+ Add feeder</button>
      {#if checkList.length}
        <ul class="checks">
          {#each checkList as entry (entry.row.id)}
            {#each entry.notes as note, index (index)}
              <li class:warn={note.level === "warn"}><b>{entry.row.tag || entry.row.loadTag || "—"}</b> {note.text}</li>
            {/each}
          {/each}
        </ul>
      {/if}
      {#if rows.length}
        <p class="help">Feeders with Fed from empty hang on the main rails. To group breakers under an RCD, add an RCD group and pick it as Fed from. Load "None" is a device that only feeds others.
          Several loads on one breaker: give that breaker Load "None", set the loads' Fed from to it and their Protection to "None"; each can still have its own Switched by contact.
          An empty Rating is sized automatically: feeders from their kW, RCD groups and the main switch from everything below them. Check the result against the cable and the installation rules.</p>
      {/if}
    </section>
    {/if}
  </div>
</div>

{#snippet productFooter()}
  {#if draft.previous && !isBuiltIn(draft.previous)}
    {#if builtInOf(draft.previous)}
      <button type="button" onclick={() => { forgetProduct(draft.previous); draft = null; }} title="Undo the changes made to this built-in product">Reset to built-in</button>
    {:else}
      <button type="button" class="danger" onclick={() => { forgetProduct(draft.previous); draft = null; }} title="Rows that use it keep their values">Remove from library</button>
    {/if}
  {/if}
  <span class="spacer"></span>
  {#if draftError}<span class="warn">{draftError}</span>{/if}
  <button type="button" onclick={() => draft = null}>Cancel</button>
  <button type="button" class="primary" disabled={Boolean(draftError)} onclick={storeDraft}>{draft.previous ? "Save changes" : "Add to library"}</button>
{/snippet}

{#if loadLibraryOpen}
  <Modal title={draft ? (draft.previous ? productLabel(products.find((product) => product.article === draft.previous) ?? draft) : "New product") : "Load library"}
         subtitle={draft ? "Electrical data from the data sheet and the installation manual" : "Products with their electrical data, and generic loads"}
         width={1240} height={820} footer={draft ? productFooter : null} onclose={() => { loadLibraryOpen = false; draft = null; }}>
    <div class="load-library">
    {#if draft}
      <button type="button" class="back" onclick={() => draft = null}>← Back to the library</button>
      <div class="product-form">
        <h4>Product</h4>
        <div class="form-grid">
          <label>Article no. <input type="text" bind:value={draft.article} spellcheck="false" placeholder="2164580"></label>
          <label>Manufacturer <input type="text" bind:value={draft.manufacturer} placeholder="Wilo"></label>
          <label class="span2">Model <input type="text" bind:value={draft.model} spellcheck="false" placeholder="Stratos MAXO 32/0,5-12 PN6/10"></label>
          <label class="span2">Description in the drawing <input type="text" bind:value={draft.description} placeholder="OBTOČNA ČRPALKA"></label>
          <label class="span4">Website
            <span class="link-field">
              <input type="text" inputmode="url" bind:value={draft.link} spellcheck="false" placeholder="https://… product page with the technical data">
              {#if /^https?:\/\//i.test(draft.link.trim())}
                <a href={draft.link.trim()} target="_blank" rel="noopener noreferrer">Open ↗</a>
              {/if}
            </span>
          </label>
          <label>Load
            <select bind:value={draft.load}>
              {#each LIBRARY_LOADS as entry (entry.id)}
                <option value={entry.id}>{entry.label}</option>
              {/each}
            </select>
          </label>
          <label>Poles
            <select bind:value={draft.poles}>
              {#each POLES as pole (pole.id)}
                <option value={pole.id}>{pole.id}</option>
              {/each}
            </select>
          </label>
        </div>

        <h4>Supply and protection</h4>
        <div class="form-grid">
          <label title="Highest current from the data sheet, at rated voltage">Max current A <input type="text" bind:value={draft.current} inputmode="decimal" placeholder="1,42"></label>
          <label title="Highest input power P1">Power P1 kW <input type="text" bind:value={draft.power} inputmode="decimal" placeholder="0,32"></label>
          <label title="Current peak when the power is switched on · sets the smallest breaker that does not trip">Switch-on peak A <input type="text" bind:value={draft.inrush} inputmode="decimal" placeholder="10"></label>
          <label>Protection
            <select bind:value={draft.protection}>
              {#each PROTECTION_KINDS.filter((kind) => kind.id !== "switch" && kind.id !== "rcd") as kind (kind.id)}
                <option value={kind.id}>{kind.label}</option>
              {/each}
            </select>
          </label>
          <label title="Leakage current per unit · counted against the RCD above it">Leakage mA <input type="text" bind:value={draft.leakage} inputmode="decimal" placeholder="3,5"></label>
          <label>RCD type
            <select bind:value={draft.rcd}>
              {#each RCD_TYPES as type (type.id)}
                <option value={type.id}>{type.label}</option>
              {/each}
            </select>
          </label>
          <label title="Smallest rating of a relay or contactor that switches the mains">Switching contact at least A <input type="text" bind:value={draft.contact} inputmode="decimal" placeholder="10"></label>
          <label class="check"><input type="checkbox" bind:checked={draft.motorProtection}> Integrated motor protection</label>
        </div>

        <h4>Connection</h4>
        <div class="form-grid">
          <label class="span2">Cable <Combo bind:value={draft.cable} options={CABLE_TYPES} label="Cable"/></label>
          <label title="Smallest cross-section the mains terminals take">Terminals from mm² <input type="text" bind:value={draft.terminalMin} inputmode="decimal" placeholder="1,5"></label>
          <label title="Largest cross-section the mains terminals take">Terminals to mm² <input type="text" bind:value={draft.terminalMax} inputmode="decimal" placeholder="2,5"></label>
        </div>
      </div>
    {:else}
      <div class="library-bar">
        <div class="tabs library-tabs" role="tablist" aria-label="Library part">
          <button type="button" role="tab" class:active={libraryTab === "products"} aria-selected={libraryTab === "products"} onclick={() => libraryTab = "products"}>Products</button>
          <button type="button" role="tab" class:active={libraryTab === "loads"} aria-selected={libraryTab === "loads"} onclick={() => libraryTab = "loads"}>Generic loads</button>
        </div>
        <input type="search" class="library-search" bind:value={librarySearch} aria-label="Search the library"
               placeholder={libraryTab === "products" ? "Search by model, manufacturer or article no." : "Search generic loads"} spellcheck="false">
        <span class="spacer"></span>
        {#if libraryTab === "products"}
          <button type="button" class="primary" onclick={() => newDraft()} title="A product from its data sheet · saved in this browser for all projects">+ New product</button>
        {/if}
      </div>
      {#if libraryTab === "products"}
        <ul class="entries">
          {#each products.filter((product) => matches(librarySearch, productLabel(product), productSummary(product), product.description)) as product (product.article)}
            {@const used = power.rows.filter((row) => productOf(row.loadData)?.article === product.article).length}
            <li>
              <button type="button" class="entry" onclick={() => newDraft(product)} title="Open the product">
                <span class="entry-title">{productLabel(product)}</span>
                <span class="entry-meta">{productSummary(product)}{isBuiltIn(product.article) ? " · built in" : builtInOf(product.article) ? " · built in, changed" : ""}{used ? ` · ${used} in the list` : ""}</span>
              </button>
              <button type="button" onclick={() => { addFromLibrary(`product:${product.article}`); onnotice?.(`Added ${product.model}`); }} title="Add one feeder for this product">+ Add to list</button>
            </li>
          {/each}
          {#if librarySearch.trim() && !products.some((product) => matches(librarySearch, productLabel(product), productSummary(product), product.description))}
            <li class="no-match">No product matches "{librarySearch.trim()}"</li>
          {/if}
        </ul>
      {:else}
        <ul class="entries">
          {#each LOAD_LIBRARY.filter((entry) => matches(librarySearch, entry.label, entry.description, entry.cable)) as entry (entry.id)}
            <li>
              <div class="entry static">
                <span class="entry-title">{entry.label}</span>
                <span class="entry-meta">{[entry.poles, entry.power ? `${entry.power} kW` : "", entry.cable].filter(Boolean).join(" · ")}</span>
              </div>
              <button type="button" onclick={() => { addFromLibrary(entry.id); onnotice?.(`Added ${entry.label}`); }}>+ Add to list</button>
            </li>
          {/each}
          {#if librarySearch.trim() && !LOAD_LIBRARY.some((entry) => matches(librarySearch, entry.label, entry.description, entry.cable))}
            <li class="no-match">No generic load matches "{librarySearch.trim()}"</li>
          {/if}
        </ul>
      {/if}
    {/if}
    </div>
  </Modal>
{/if}

{#snippet deviceEditor(template)}
  {@const pairs = contactPairs(template)}
  <div class="product-form">
    <h4>Device</h4>
    <div class="form-grid">
      <label class="span2">Name <input type="text" bind:value={template.name} aria-label="Custom device name" placeholder="Room sensor"></label>
      <label>Tag prefix <input type="text" bind:value={template.prefix} spellcheck="false" placeholder="-E"></label>
      <label>Symbol
        <select bind:value={template.symbol}>
          {#each CUSTOM_SYMBOLS as symbol (symbol.id)}
            <option value={symbol.id}>{symbol.label}</option>
          {/each}
        </select>
      </label>
      <label class="span2">Cable <Combo bind:value={template.cable} options={CABLE_TYPES} label="Cable"/></label>
    </div>

    <h4>Terminals</h4>
    <table class="compact terminal-table device-terminals">
      <colgroup>
        <col style="width: 50px">
        <col style="width: 180px">
        <col style="width: 320px">
        <col>
        <col style="width: 40px">
      </colgroup>
      <thead>
        <tr><th>#</th><th>Terminal label</th><th>Connects to</th><th></th><th></th></tr>
      </thead>
      <tbody>
        {#each template.terminals as terminal, index (index)}
          {@const pair = pairs.findIndex((entry) => entry.includes(index))}
          <tr>
            <td class="current">{index + 1}</td>
            <td><input type="text" bind:value={terminal.label} aria-label="Terminal label" spellcheck="false"></td>
            <td>
              <select bind:value={terminal.connect} aria-label="Connects to">
                {#each CUSTOM_CONNECTIONS as connection (connection.id)}
                  <option value={connection.id}>{connection.label}</option>
                {/each}
              </select>
            </td>
            <td class="current">
              {#if terminal.connect === "U" || terminal.connect === "ID" || terminal.connect === "Y"}picked per device under Connection
              {:else if pair >= 0}contact {pair + 1} · relay or controller output picked per device
              {:else if terminal.connect === "none"}shown on the device, no wire{/if}
            </td>
            <td><button type="button" class="icon remove" aria-label="Remove terminal" disabled={template.terminals.length <= 1}
                        onclick={() => template.terminals.splice(index, 1)}>✕</button></td>
          </tr>
        {/each}
      </tbody>
    </table>
    <button type="button" class="add-terminal" onclick={() => addTerminal(template)}>+ Terminal</button>
  </div>
{/snippet}

{#snippet deviceFooter()}
  {@const warning = templateWarning(openTemplate)}
  {#if deviceOpen.kind === "project"}
    {@const used = control.rows.filter((row) => row.type === `custom:${openTemplate.id}`).length}
    <button type="button" class="danger" disabled={used > 0} title={used ? "Remove its devices from the list first" : "Remove from this project"}
            onclick={() => { removeTemplate(openTemplate.id); deviceOpen = null; }}>Remove device</button>
    <span class="spacer"></span>
    {#if warning}<span class="warn">{warning}</span>{/if}
    <button type="button" onclick={() => storeTemplate(openTemplate)}
            title="Keep this device for other projects · a device taken from the library updates its library copy">{openTemplate.libraryId && library.some((entry) => entry.id === openTemplate.libraryId) ? "Update library" : "Save to library"}</button>
    <button type="button" onclick={() => { addControl(`custom:${openTemplate.id}`); onnotice?.(`Added ${openTemplate.name || "the device"}`); }}>+ Add to list</button>
    <button type="button" class="primary" onclick={() => deviceOpen = null}>Done</button>
  {:else}
    <button type="button" class="danger" title="Remove from the library · projects that use it keep their copy"
            onclick={() => { forgetLibrary(deviceOpen.id); deviceOpen = null; }}>Remove from library</button>
    <span class="spacer"></span>
    {#if warning}<span class="warn">{warning}</span>{/if}
    <button type="button" onclick={() => deviceOpen = null}>Cancel</button>
    <button type="button" class="primary" onclick={saveLibraryDevice}>Save changes</button>
  {/if}
{/snippet}

{#if libraryOpen}
  <Modal title={openTemplate ? openTemplate.name || "Custom device" : "Device library"}
         subtitle={openTemplate ? (deviceOpen.kind === "project" ? "Custom device of this project" : "Saved in the library of this browser") : "Saved devices and the custom devices of this project"}
         width={1240} height={820} footer={openTemplate ? deviceFooter : null} onclose={() => { libraryOpen = false; deviceOpen = null; }}>
    <div class="load-library">
    {#if openTemplate}
      <button type="button" class="back" onclick={() => deviceOpen = null}>← Back to the library</button>
      {@render deviceEditor(openTemplate)}
    {:else}
      <div class="library-bar">
        <div class="tabs library-tabs" role="tablist" aria-label="Library part">
          <button type="button" role="tab" class:active={deviceTab === "library"} aria-selected={deviceTab === "library"} onclick={() => deviceTab = "library"}>Library</button>
          <button type="button" role="tab" class:active={deviceTab === "project"} aria-selected={deviceTab === "project"} onclick={() => deviceTab = "project"}>This project</button>
        </div>
        <input type="search" class="library-search" bind:value={deviceSearch} aria-label="Search the devices" placeholder="Search by name or tag prefix" spellcheck="false">
        <span class="spacer"></span>
        {#if deviceTab === "library"}
          <button type="button" onclick={downloadLibrary} disabled={!library.length} title="Save the library as a file, to back it up or give it to a colleague">Export</button>
          <label class="file-button" title="Add devices from a library file · devices already in the library are updated">Import
            <input type="file" accept=".json,application/json" onchange={loadLibraryFile}>
          </label>
        {/if}
        <button type="button" class="primary" onclick={newDevice} title="A device of your own · set its terminals and where each one connects">+ New device</button>
      </div>
      {#if deviceTab === "library"}
        {@const shown = library.filter((entry) => matches(deviceSearch, entry.name, entry.prefix, entry.cable))}
        <ul class="entries">
          {#each shown as entry (entry.id)}
            {@const inProject = (control.templates ?? []).some((template) => template.libraryId === entry.id)}
            <li>
              <button type="button" class="entry" onclick={() => openDevice("library", entry.id)} title="Open the device">
                <span class="entry-title">{entry.name || "Custom device"}</span>
                <span class="entry-meta">{deviceSummary(entry)}{inProject ? " · in this project" : ""}</span>
              </button>
              <button type="button" onclick={() => { addControl(`lib:${entry.id}`); onnotice?.(`Added ${entry.name || "the device"}`); }} title="Add one to the control devices">+ Add to list</button>
            </li>
          {/each}
          {#if !shown.length}
            <li class="no-match">{deviceSearch.trim() ? `No saved device matches "${deviceSearch.trim()}"` : "Empty · open a device under This project and press Save to library to keep it for other projects"}</li>
          {/if}
        </ul>
      {:else}
        {@const shown = (control.templates ?? []).filter((template) => matches(deviceSearch, template.name, template.prefix, template.cable))}
        <ul class="entries">
          {#each shown as template (template.id)}
            {@const used = control.rows.filter((row) => row.type === `custom:${template.id}`).length}
            {@const saved = template.libraryId && library.some((entry) => entry.id === template.libraryId)}
            <li>
              <button type="button" class="entry" onclick={() => openDevice("project", template.id)} title="Open the device">
                <span class="entry-title">{template.name || "Custom device"}</span>
                <span class="entry-meta">{deviceSummary(template)}{saved ? " · in the library" : ""} · {used ? `${used} in the list` : "not used yet"}{templateWarning(template) ? " · needs attention" : ""}</span>
              </button>
              <button type="button" onclick={() => { addControl(`custom:${template.id}`); onnotice?.(`Added ${template.name || "the device"}`); }}>+ Add to list</button>
            </li>
          {/each}
          {#if !shown.length}
            <li class="no-match">{deviceSearch.trim() ? `No custom device matches "${deviceSearch.trim()}"` : "No custom devices yet · press + New device to make one: give it a name, add its terminals and pick where each one connects"}</li>
          {/if}
        </ul>
      {/if}
    {/if}
    </div>
  </Modal>
{/if}
