<script>
  import { PROTECTION_KINDS } from "$lib/electric/symbols.js";
  import { POLES, LOADS, PHASES, COLUMNS, SYSTEMS, CABLE_TYPES, LOAD_LIBRARY, newPowerRow, libraryRow, parsePowerTable, powerTable, powerTree, powerSizing, loadTags, loadOf, formatNumber } from "$lib/electric/power.js";
  import { portal } from "$lib/actions/portal.js";

  let { power = $bindable(), ondraw, onnotice } = $props();

  let pasting = $state(null);
  let pasteArea = $state(null);

  let rows = $derived(power.rows);
  let tree = $derived(powerTree(power));
  let sizing = $derived(powerSizing(power));
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

  function addFromLibrary(id){
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

  let dragId = $state(null);
  let dropAt = $state(null);

  function dragStart(event, row){
    dragId = row.id;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", row.tag);
    const line = event.currentTarget.closest("tr");
    if (line) event.dataTransfer.setDragImage(line, 16, line.offsetHeight / 2);
  }

  function dragOver(event, row){
    if (!dragId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const box = event.currentTarget.getBoundingClientRect();
    dropAt = { id: row.id, after: event.clientY > box.top + box.height / 2 };
  }

  function dropRow(event){
    event.preventDefault();
    if (dragId && dropAt && dropAt.id !== dragId) {
      const moved = power.rows.find((row) => row.id === dragId);
      const list = power.rows.filter((row) => row.id !== dragId);
      const index = list.findIndex((row) => row.id === dropAt.id) + (dropAt.after ? 1 : 0);
      list.splice(index, 0, moved);
      power.rows = list;
    }
    endDrag();
  }

  function endDrag(){
    dragId = null;
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

  function startPaste(){
    pasting = { text: "" };
    setTimeout(() => pasteArea?.focus(), 0);
  }

  function finishPaste(event){
    event.preventDefault();
    const added = parsePowerTable(pasting.text, power.rows);
    pasting = null;
    if (!added.length) {
      onnotice?.("No rows found in the pasted text");
      return;
    }
    power.rows.push(...added);
    onnotice?.(`Added ${added.length} row${added.length === 1 ? "" : "s"}`);
  }

  async function copyTable(){
    try {
      await navigator.clipboard.writeText(powerTable(power.rows));
      onnotice?.("Copied the power list · paste it into Excel");
    } catch {
      onnotice?.("The browser did not allow copying");
    }
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

  .library {
    width: auto;
    height: 28px;
    font-weight: 600;
    color: #475569;
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

  .paste-dialog {
    position: fixed;
    inset: 0;
    z-index: 70;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.35);
  }

  .paste-dialog form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: min(720px, calc(100vw - 32px));
    padding: 16px;
    border-radius: 10px;
    background: #ffffff;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
    font-size: 12px;
  }

  .paste-dialog p {
    margin: 0;
    color: #475569;
  }

  .paste-dialog code {
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: 11px;
  }

  .paste-dialog textarea {
    height: 240px;
    padding: 8px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: 11px;
    resize: vertical;
  }

  .paste-dialog .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>

<datalist id="cable-types">
  {#each CABLE_TYPES as type (type)}
    <option value={type}></option>
  {/each}
</datalist>

<div class="wiring-view">
  <div class="bar">
    <h2>Wiring list</h2>
    <div class="tabs" role="tablist" aria-label="Wiring list part">
      <button type="button" role="tab" class="active" aria-selected="true">Power</button>
      <button type="button" role="tab" aria-selected="false" disabled title="Comes next">Control</button>
      <button type="button" role="tab" aria-selected="false" disabled title="Comes next">Communication</button>
    </div>
    <span class="count">{rows.length} device{rows.length === 1 ? "" : "s"}</span>
    <span class="spacer"></span>
    <button type="button" onclick={() => addRow({ protection: "switch", poles: power.supply.phases === 1 ? "1p+N" : "3p+N", load: "none", from: mains.length ? "" : "supply", description: "Glavno stikalo" })}
            disabled={mains.length > 0} title="The main switch or breaker between the incoming supply and the rails">+ Main switch</button>
    <button type="button" onclick={() => addRow({ protection: "rcd", poles: power.supply.phases === 1 ? "1p+N" : "3p+N", load: "none" })}
            title="An RCD that protects several feeders · set their Fed from to this RCD">+ RCD group</button>
    <button type="button" onclick={() => addRow()} title="One breaker feeding one load">+ Feeder</button>
    <select class="library" aria-label="Add a feeder from the load library" value=""
            onchange={(event) => { addFromLibrary(event.currentTarget.value); event.currentTarget.value = ""; }}>
      <option value="">+ From load library…</option>
      {#each LOAD_LIBRARY as entry (entry.id)}
        <option value={entry.id}>{entry.label}{entry.power ? ` · ${entry.power} kW` : ""}</option>
      {/each}
    </select>
    <button type="button" onclick={startPaste} title="Rows copied from Excel, in the column order of this table">Paste from Excel</button>
    <button type="button" disabled={!rows.length} onclick={copyTable} title="The list as a table, to paste into Excel">Copy table</button>
    <button type="button" class="primary" onclick={draw}
            title="Draw the power pages at the start of the wiring diagram · drawn power pages are replaced, control pages move along">Draw power pages</button>
  </div>

  <div class="scroll">
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
          <input type="text" list="cable-types" bind:value={power.supply.cable} placeholder="NHXMH-J 5x2,5mm2" spellcheck="false">
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
      {#if !rows.length}
        <div class="empty">No devices yet · add a main switch, RCD groups and feeders with the buttons above, or paste rows from Excel</div>
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
              <th title="Empty uses NYM-J with one core per terminal">Cable</th>
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
              <tr class:child={groupChild} class:grouped={tint} style:--group-fill={tint?.fill} style:--group-line={tint?.line} class:dragging={dragId === row.id}
                  class:drop-before={dropAt?.id === row.id && !dropAt.after && dragId !== row.id}
                  class:drop-after={dropAt?.id === row.id && dropAt.after && dragId !== row.id}
                  ondragover={(event) => dragOver(event, row)} ondrop={dropRow}>
                <td>
                  <span class="grip" role="button" tabindex="-1" draggable="true" aria-label="Drag to reorder" title="Drag to reorder"
                        ondragstart={(event) => dragStart(event, row)} ondragend={endDrag}>
                    <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                      <circle cx="4" cy="2.5" r="1.1"/><circle cx="8" cy="2.5" r="1.1"/><circle cx="4" cy="6" r="1.1"/><circle cx="8" cy="6" r="1.1"/><circle cx="4" cy="9.5" r="1.1"/><circle cx="8" cy="9.5" r="1.1"/>
                    </svg>
                  </span>
                </td>
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
                <td><input type="text" bind:value={row.loadData} aria-label="Load data" disabled={load.id === "none"}></td>
                <td><input type="text" list="cable-types" bind:value={row.cable} aria-label="Cable" disabled={load.id === "none" || load.cabinet}
                           placeholder={load.id === "none" || load.cabinet ? "" : "NYM-J"} spellcheck="false"></td>
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
        <p class="help">Feeders with Fed from empty hang on the main rails. To group breakers under an RCD, add an RCD group and pick it as Fed from. Load "None" is a device that only feeds others.
          Several loads on one breaker: give that breaker Load "None", set the loads' Fed from to it and their Protection to "None"; each can still have its own Switched by contact.
          An empty Rating is sized automatically: feeders from their kW, RCD groups and the main switch from everything below them. Check the result against the cable and the installation rules.</p>
      {/if}
    </section>
  </div>
</div>

{#if pasting}
  <div class="paste-dialog" use:portal role="presentation" onpointerdown={(event) => event.target === event.currentTarget && (pasting = null)}>
    <form onsubmit={finishPaste}>
      <p>Copy rows in Excel and paste them here. Columns in this order, a header row is skipped:</p>
      <p><code>{COLUMNS.join(" · ")}</code></p>
      <p>Protection: MCB, RCBO, RCD, Fuse, Motor protection or Switch. Poles: 1p, 1p+N, 3p or 3p+N. Fed from: a tag in the list, "supply" for the main switch, or empty for the main rails.</p>
      <textarea bind:this={pasteArea} bind:value={pasting.text} spellcheck="false"
                placeholder={"-F1\tKONVEKTOR\tMCB\t\t1p\t\t\tMotor / pump\t-M1\t0,1\t\tFLAME-JZ-H FRNC 3x1,5 mm2\t-X1"}></textarea>
      <div class="actions">
        <button type="button" onclick={() => pasting = null}>Cancel</button>
        <button type="submit" class="primary" disabled={!pasting.text.trim()}>Add rows</button>
      </div>
    </form>
  </div>
{/if}
