<script>
  import { base } from "$app/paths";
  import { IO_KINDS, DATA_TYPES, ioKind, pointVariables, allVariables, manifestXml, importManifest, nextChannel, cleanChannel, cleanName, hasAlarm, alarmsTxt, DI_USES, diUse, ROLES, roleOf, branchInputs, pointBase } from "$lib/io/patterns.js";
  import { fbdBlocks, clipboardPackage, FBD_FORMATS } from "$lib/io/fbd.js";
  import { branchSolution, branchVariables, solutionLibraries, SOLUTION_FORMATS } from "$lib/io/solution.js";
  import { updateWorksheet, displayLabel, pouName, MASK_COLUMNS } from "$lib/io/mask.js";
  import { portal } from "$lib/actions/portal.js";

  let { points = $bindable([]), others = $bindable([]), branches = [], onnotice } = $props();

  let filter = $state("");
  let selected = $state(new Set());
  let pasting = $state(null);
  let pasteArea = $state(null);
  let helperMissing = $state(false);
  let worksheetInput = $state(null);
  let branchFilter = $state("all");

  const FLAG_COLUMNS = [
    { key: "retain", label: "Retain" },
    { key: "io", label: "IO" },
    { key: "protocol", label: "Protocol" },
    { key: "ui", label: "UI" },
    { key: "dev", label: "DEV" },
    { key: "log", label: "LOG" }
  ];

  function uid(){
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }

  let generated = $derived(new Map(points.map((point) => [point.id, pointVariables(point)])));
  let nameCounts = $derived.by(() => {
    const counts = new Map();
    for (const entry of allVariables(points, others)) counts.set(entry.name, (counts.get(entry.name) ?? 0) + 1);
    return counts;
  });
  let channelCounts = $derived.by(() => {
    const counts = new Map();
    for (const point of points) {
      const key = `${cleanChannel(point.board)}|${cleanChannel(point.channel)}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  });
  let totalVariables = $derived(allVariables(points, others).length);

  let branchIds = $derived(new Set(branches.map((branch) => branch.id)));

  function inBranch(entry){
    if (branchFilter === "all") return true;
    if (branchFilter === "none") return !branchIds.has(entry.branch);
    return entry.branch === branchFilter;
  }

  function matches(text){
    const needle = filter.trim().toLowerCase();
    return !needle || text.toLowerCase().includes(needle);
  }

  function visibleOthers(){
    return others.filter((entry) => inBranch(entry) && matches(entry.name + " " + entry.comment));
  }

  function assignBranch(value){
    const branch = value === "none" ? null : value;
    for (const entry of [...points, ...others]) if (selected.has(entry.id)) entry.branch = branch;
    const name = branches.find((item) => item.id === branch)?.label;
    onnotice?.(name ? `Moved ${selected.size} row${selected.size === 1 ? "" : "s"} to ${name}` : `Removed ${selected.size} row${selected.size === 1 ? "" : "s"} from their branch`);
  }

  function sortKey(point){
    const channel = cleanChannel(point.channel);
    const number = Number(channel.replace(/^[A-Z]+/, "")) || 0;
    return [cleanChannel(point.board), channel.replace(/\d+$/, ""), number];
  }

  function ordered(kind){
    return points
      .filter((point) => point.kind === kind && inBranch(point) && matches([point.board, point.channel, point.name, point.comment, ...(generated.get(point.id) ?? []).map((entry) => entry.name)].join(" ")))
      .sort((a, b) => {
        const [ba, pa, na] = sortKey(a);
        const [bb, pb, nb] = sortKey(b);
        return ba.localeCompare(bb) || pa.localeCompare(pb) || na - nb;
      });
  }

  let sections = $derived(IO_KINDS.map((kind) => {
    const rows = ordered(kind.id);
    const picked = chosen(rows);
    return { kind, rows, picked, alarms: picked.filter(hasAlarm) };
  }));

  const BRANCH_ROLES = ROLES.filter((role) => !role.station);
  const BRANCH_TYPES = { Heating: "heating" };

  let roleCounts = $derived.by(() => {
    const counts = new Map();
    for (const point of points) {
      const role = roleOf(point.role);
      if (!role || role.kind !== point.kind) continue;
      const key = role.station ? role.id : `${role.id}|${point.branch}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  });

  let allAlarms = $derived(points.filter((point) => complete(point) && hasAlarm(point)));

  let outdoor = $derived(points.find((point) => point.kind === "AI" && point.role === "outdoor") ?? null);

  let branchRows = $derived(branches.map((branch) => {
    const io = branchInputs(points, branch.id);
    const template = BRANCH_TYPES[branch.type];
    const problem = !template ? `${branch.type} branches are not available yet`
      : io.duplicates.length ? `Two IO points have the role ${io.duplicates.map((id) => roleOf(id).label).join(", ")}`
      : io.missing.length ? `Missing: ${io.missing.map((id) => roleOf(id).label).join(", ")}`
      : null;
    return { branch, io, template, problem };
  }));

  function roleClash(point){
    const role = roleOf(point.role);
    if (!role || role.kind !== point.kind) return false;
    return (roleCounts.get(role.station ? role.id : `${role.id}|${point.branch}`) ?? 0) > 1;
  }

  function addPoint(kind){
    const last = [...points].reverse().find((point) => point.kind === kind);
    const board = last?.board ?? "";
    const branch = typeof branchFilter === "number" ? branchFilter : null;
    points.push({ id: uid(), kind, board, channel: nextChannel(points, kind, board), name: "", comment: "", branch, ...(kind === "DI" ? { use: "alarm" } : {}) });
    focusLast(`[data-point-name]`);
  }

  function addVariable(){
    others.push({ id: uid(), branch: typeof branchFilter === "number" ? branchFilter : null, name: "", dataType: "BOOL", io: false, protocol: true, ui: true, dev: false, log: false, retain: false, decimals: "", min: "", max: "", initial: "", comment: "" });
    focusLast(`[data-variable-name]`);
  }

  function focusLast(selector){
    setTimeout(() => {
      const fields = document.querySelectorAll(selector);
      const empty = [...fields].find((field) => !field.value);
      (empty ?? fields[fields.length - 1])?.focus();
    }, 0);
  }

  function removePoint(id){
    points = points.filter((point) => point.id !== id);
    selected.delete(id);
    selected = new Set(selected);
  }

  function removeVariable(id){
    others = others.filter((entry) => entry.id !== id);
    selected.delete(id);
    selected = new Set(selected);
  }

  function toggle(id){
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    selected = new Set(selected);
  }

  async function copy(onlySelected){
    const chosenPoints = onlySelected ? points.filter((point) => selected.has(point.id)) : points;
    const chosenOthers = onlySelected ? others.filter((entry) => selected.has(entry.id)) : others;
    const list = allVariables(chosenPoints, chosenOthers).filter((entry) => entry.name);
    if (!list.length) return;
    try {
      await navigator.clipboard.writeText(manifestXml(list));
      onnotice?.(`Copied ${list.length} variable${list.length === 1 ? "" : "s"} · paste them into the c.strategy variable list`);
    } catch (error) {
      onnotice?.(`Could not copy: ${error.message}`);
    }
  }

  function complete(point){
    return !!cleanName(point.name) && !!cleanChannel(point.channel);
  }

  function chosen(rows){
    const picked = rows.filter((point) => selected.has(point.id));
    return (picked.length ? picked : rows).filter(complete);
  }


  async function copyBlocks(list){
    if (!list.length) return;
    await copyPackage(() => fbdBlocks(list), `Copied blocks for ${list.length} IO point${list.length === 1 ? "" : "s"} · paste them into the POU in c.strategy`);
  }

  async function copyBranch(row){
    await copyPackage(() => branchSolution(row.template, pouName(row.branch), row.io.names),
      `Copied the POU ${pouName(row.branch)} · paste it on Programs in c.strategy, then use Copy variables for this branch`, SOLUTION_FORMATS);
  }

  async function copyBranchVariables(row){
    try {
      const list = await branchVariables(row.template);
      await navigator.clipboard.writeText(manifestXml(list));
      onnotice?.(`Copied ${list.length} variables · paste them into the variable list of the POU ${pouName(row.branch)}`);
    } catch (error) {
      onnotice?.(`Could not copy: ${error.message}`);
    }
  }

  async function copyPackage(make, message, formats = FBD_FORMATS){
    let text;
    try {
      text = clipboardPackage(formats, await make());
      await navigator.clipboard.writeText(text);
    } catch (error) {
      onnotice?.(`Could not copy the blocks: ${error.message}`);
      return;
    }
    onnotice?.(message);
    setTimeout(async () => {
      try {
        helperMissing = (await navigator.clipboard.readText()) === text;
      } catch {}
    }, 1000);
  }

  async function updateMasks(file){
    if (!file) return;
    try {
      const text = new TextDecoder("utf-8", { ignoreBOM: true }).decode(await file.arrayBuffer());
      const ready = branchRows.filter((row) => row.template).map((row) => row.branch);
      const result = updateWorksheet(text, points.filter(complete), ready);
      save(new Blob([result.text], { type: "application/xml" }), file.name);
      onnotice?.(`Added ${result.io} IO mask${result.io === 1 ? "" : "s"} and ${result.branches} branch mask${result.branches === 1 ? "" : "s"} · replace ${file.name} in the project with c.mask closed`);
    } catch (error) {
      onnotice?.(`Could not update the worksheet: ${error.message}`);
    }
  }

  function save(blob, name){
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement("a"), { href: url, download: name });
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadAlarms(list){
    if (!list.length) return;
    save(new Blob([alarmsTxt(list)], { type: "text/plain" }), "alarms.txt");
    onnotice?.(`Saved ${list.length} alarm${list.length === 1 ? "" : "s"} · load alarms.txt with Import in the c.strategy Alarm editor`);
  }

  async function startPaste(){
    try {
      const text = await navigator.clipboard.readText();
      if (text.includes("<Variable ")) {
        merge(text);
        return;
      }
    } catch {}
    pasting = { text: "" };
    setTimeout(() => pasteArea?.focus(), 0);
  }

  function merge(text){
    const result = importManifest(text);
    const taken = new Set(allVariables(points, others).map((entry) => entry.name));
    let addedPoints = 0;
    let addedOthers = 0;
    for (const point of result.points) {
      const entry = { id: uid(), ...point };
      if (pointVariables(entry).some((item) => taken.has(item.name))) continue;
      points.push(entry);
      addedPoints += 1;
    }
    for (const item of result.others) {
      if (taken.has(item.name)) continue;
      others.push({ id: uid(), ...item });
      addedOthers += 1;
    }
    pasting = null;
    const skipped = result.points.length - addedPoints + result.others.length - addedOthers;
    onnotice?.(result.total
      ? `Added ${addedPoints} IO point${addedPoints === 1 ? "" : "s"} and ${addedOthers} variable${addedOthers === 1 ? "" : "s"}${skipped > 0 ? ` · ${skipped} already in the list` : ""}`
      : "No c.strategy variables found in the pasted text");
  }
</script>

<style>
  .io-view {
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

  .sep {
    width: 1px;
    height: 18px;
    background: #e2e8f0;
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

  table {
    width: 100%;
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
    padding: 4px 8px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr.picked td {
    background: #eff6ff;
  }

  input[type="text"],
  select {
    width: 100%;
    height: 26px;
    padding: 2px 6px;
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

  input.bad {
    border-color: #f87171;
    background: #fef2f2;
  }

  input[type="checkbox"] {
    width: 14px;
    height: 14px;
    margin: 0;
    accent-color: #2563eb;
  }

  .names {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
    gap: 3px;
  }

  .names code {
    padding: 1px 5px;
    border-radius: 4px;
    background: #f1f5f9;
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: 11px;
    color: #475569;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .names code.clash {
    background: #fee2e2;
    color: #b91c1c;
  }

  .search {
    width: 200px;
  }

  .file-input {
    display: none;
  }

  .branch-filter,
  .assign {
    width: auto;
    max-width: 200px;
  }

  select.missing,
  select.bad {
    border-color: #f87171;
    background: #fef2f2;
  }

  .station {
    margin: 0 0 6px;
    color: #475569;
  }

  .station code,
  td > code {
    display: inline-block;
    max-width: 100%;
    padding: 1px 5px;
    border-radius: 4px;
    background: #f1f5f9;
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: 11px;
    color: #475569;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
    box-sizing: border-box;
  }

  td > code.clash {
    background: #fee2e2;
    color: #b91c1c;
  }

  .none {
    color: #94a3b8;
  }

  .missing {
    color: #b91c1c;
  }

  .branch-actions {
    display: flex;
    gap: 4px;
  }

  .libraries {
    margin: 6px 0 0;
    color: #64748b;
  }

  .branch-label {
    font-weight: 600;
    color: #0f172a;
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

  button.remove {
    width: 26px;
    height: 26px;
    padding: 0;
    border-color: transparent;
    color: #94a3b8;
  }

  button.remove:hover {
    background: #fef2f2;
    color: #dc2626;
  }

  button.small {
    height: 22px;
    padding: 0 8px;
    font-size: 11px;
  }

  .helper {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    border-bottom: 1px solid #fde68a;
    background: #fffbeb;
    color: #92400e;
  }

  .helper span {
    flex: 1;
  }

  .helper a {
    font-weight: 700;
    color: #1d4ed8;
    white-space: nowrap;
  }

  .empty {
    padding: 14px;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    color: #94a3b8;
    text-align: center;
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
    width: min(640px, calc(100vw - 32px));
    padding: 16px;
    border-radius: 10px;
    background: #ffffff;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
    font-size: 12px;
  }

  .paste-dialog textarea {
    height: 260px;
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

{#snippet nameList(list)}
  <div class="names">
    {#each list as entry}
      <code class:clash={(nameCounts.get(entry.name) ?? 0) > 1} title={entry.name}>{entry.name}</code>
    {/each}
  </div>
{/snippet}

{#snippet branchSelect(entry)}
  <select class:missing={entry.branch != null && !branchIds.has(entry.branch)} aria-label="Branch"
          bind:value={() => branchIds.has(entry.branch) ? entry.branch : null, (value) => entry.branch = value}>
    <option value={null}>—</option>
    {#each branches as branch (branch.id)}
      <option value={branch.id}>{branch.label}</option>
    {/each}
  </select>
{/snippet}

<div class="io-view">
  <div class="bar">
    <h2>IO list</h2>
    <span class="count">{points.length} IO points · {others.length} other variables · {totalVariables} c.strategy variables</span>
    <span class="sep" aria-hidden="true"></span>
    {#each IO_KINDS as kind (kind.id)}
      <button type="button" onclick={() => addPoint(kind.id)}>+ {kind.label}</button>
    {/each}
    <button type="button" onclick={addVariable}>+ Variable</button>
    <span class="spacer"></span>
    {#if selected.size}
      <select class="assign" aria-label="Move the selected rows to a branch"
              onchange={(event) => {
                const index = event.currentTarget.selectedIndex;
                if (index > 0) assignBranch(index === 1 ? "none" : branches[index - 2].id);
                event.currentTarget.selectedIndex = 0;
              }}>
        <option>Move {selected.size} to branch…</option>
        <option>No branch</option>
        {#each branches as branch (branch.id)}
          <option>{branch.label}</option>
        {/each}
      </select>
    {/if}
    <select class="branch-filter" bind:value={branchFilter} aria-label="Show branch">
      <option value="all">All branches</option>
      <option value="none">Not in a branch</option>
      {#each branches as branch (branch.id)}
        <option value={branch.id}>{branch.label}</option>
      {/each}
    </select>
    <input class="search" type="text" placeholder="Filter" bind:value={filter} aria-label="Filter the list">
    <button type="button" onclick={startPaste}>Paste from c.strategy</button>
    <button type="button" disabled={selected.size === 0} onclick={() => copy(true)}>Copy selected variables ({selected.size})</button>
    <button type="button" class="primary" disabled={totalVariables === 0} onclick={() => copy(false)}
            title="Every variable in the list, for the c.strategy variable list">Copy variables</button>
    <button type="button" class="primary" disabled={!allAlarms.length} onclick={() => downloadAlarms(allAlarms)}
            title="A TXT file with every alarm, for Import in the c.strategy Alarm editor">Download alarms ({allAlarms.length})</button>
    <button type="button" class="primary" onclick={() => worksheetInput?.click()}
            title="Pick the project's 03_Devices.otws · Pathfinder adds its IO and branch masks and leaves everything else as it is">Update c.mask file…</button>
    <input class="file-input" type="file" accept=".otws" bind:this={worksheetInput}
           onchange={(event) => { updateMasks(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }}>
  </div>

  {#if helperMissing}
    <div class="helper">
      <span>c.strategy needs the Pathfinder clipboard helper to paste blocks. Download it, right-click it and choose <strong>Run with PowerShell</strong> and keep its window open. The first time, copy any block and any POU in c.strategy so it learns your project keys, then copy here again.</span>
      <a href="{base}/pathfinder-clipboard.ps1" download>Download helper</a>
      <button type="button" class="remove" aria-label="Dismiss" onclick={() => helperMissing = false}>✕</button>
    </div>
  {/if}

  <div class="scroll">
    {#if points.length === 0 && others.length === 0}
      <div class="empty">No variables yet · add IO points with the buttons above, or paste variables copied from c.strategy</div>
    {/if}

    {#each sections as { kind, rows, picked } (kind.id)}
      {@const digital = kind.id === "DI"}
      {#if rows.length}
        <section>
          <h3>
            {kind.plural} <span class="count">{rows.length}</span>
            <button type="button" class="small" disabled={!picked.length} onclick={() => copyBlocks(picked)}
                    title="FBD blocks for {picked.length < rows.length ? 'the selected rows' : 'every row'} in this list">Copy blocks ({picked.length})</button>
          </h3>
          <table>
            <colgroup>
              <col style="width: 32px">
              <col style="width: 76px">
              <col style="width: 84px">
              <col style="width: 170px">
              <col style="width: 20%">
              <col style="width: 180px">
              <col style="width: 150px">
              {#if digital}
                <col style="width: 130px">
              {/if}
              <col>
              <col style="width: 42px">
            </colgroup>
            <thead>
              <tr>
                <th></th>
                <th title="Extension module prefix, e.g. N2 · empty for the controller">Module</th>
                <th>Channel</th>
                <th>Branch</th>
                <th>Name</th>
                <th title="Text on the pGD display, at most {MASK_COLUMNS} characters">pGD label</th>
                <th title="What the IO point does in its branch, for the branch POU">Role</th>
                {#if digital}
                  <th title="What the input drives after the NC/NO logic and the 2 s delay">Use</th>
                {/if}
                <th>c.strategy variables</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {#each rows as point (point.id)}
                {@const clash = (channelCounts.get(`${cleanChannel(point.board)}|${cleanChannel(point.channel)}`) ?? 0) > 1}
                <tr class:picked={selected.has(point.id)}>
                  <td><input type="checkbox" checked={selected.has(point.id)} onchange={() => toggle(point.id)} aria-label="Select"></td>
                  <td><input type="text" placeholder="—" bind:value={point.board} onblur={() => point.board = cleanChannel(point.board)} aria-label="Extension module" title="Extension module prefix, e.g. N2 · empty for the controller"></td>
                  <td><input type="text" class:bad={clash || !cleanChannel(point.channel)} bind:value={point.channel}
                                            onblur={() => point.channel = cleanChannel(point.channel)} aria-label="Channel"
                                            title={clash ? "This channel is used twice on the same module" : undefined}></td>
                  <td>{@render branchSelect(point)}</td>
                  <td><input type="text" class:bad={!cleanName(point.name)} bind:value={point.name} data-point-name
                             placeholder="{ioKind(point.kind).label} name" onblur={() => point.name = cleanName(point.name)} aria-label="Name"></td>
                  <td><input type="text" maxlength={MASK_COLUMNS} bind:value={point.label} placeholder={displayLabel({ ...point, label: "" })} aria-label="pGD label"></td>
                  <td>
                    <select aria-label="Role" class:bad={roleClash(point)} title={roleClash(point) ? "Another IO point has this role in the same branch" : undefined}
                            bind:value={() => roleOf(point.role)?.kind === point.kind ? point.role : null, (value) => point.role = value}>
                      <option value={null}>—</option>
                      {#each ROLES.filter((role) => role.kind === point.kind) as role (role.id)}
                        <option value={role.id}>{role.label}</option>
                      {/each}
                    </select>
                  </td>
                  {#if digital}
                    <td>
                      <select aria-label="Use" bind:value={() => diUse(point), (value) => { point.use = value; delete point.alarm; }}>
                        {#each DI_USES as use (use.id)}
                          <option value={use.id}>{use.label}</option>
                        {/each}
                      </select>
                    </td>
                  {/if}
                  <td>{@render nameList(generated.get(point.id) ?? [])}</td>
                  <td><button type="button" class="remove" aria-label="Remove" onclick={() => removePoint(point.id)}>✕</button></td>
                </tr>
              {/each}
            </tbody>
          </table>
        </section>
      {/if}
    {/each}

    {#if visibleOthers().length}
      <section>
        <h3>Other variables <span class="count">{others.length}</span></h3>
        <table>
          <colgroup>
            <col style="width: 32px">
            <col style="width: 170px">
            <col>
            <col style="width: 92px">
            <col style="width: 70px">
            <col style="width: 70px">
            <col style="width: 70px">
            <col style="width: 70px">
            {#each FLAG_COLUMNS as flag}
              <col style="width: 62px">
            {/each}
            <col style="width: 42px">
          </colgroup>
          <thead>
            <tr>
              <th></th>
              <th>Branch</th>
              <th>Name</th>
              <th>Data type</th>
              <th>Initial</th>
              <th>Min</th>
              <th>Max</th>
              <th>Decimals</th>
              {#each FLAG_COLUMNS as flag}
                <th>{flag.label}</th>
              {/each}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each visibleOthers() as entry (entry.id)}
              <tr class:picked={selected.has(entry.id)}>
                <td><input type="checkbox" checked={selected.has(entry.id)} onchange={() => toggle(entry.id)} aria-label="Select"></td>
                <td>{@render branchSelect(entry)}</td>
                <td><input type="text" class:bad={!entry.name || (nameCounts.get(entry.name) ?? 0) > 1} bind:value={entry.name} data-variable-name
                           onblur={() => entry.name = cleanName(entry.name)} aria-label="Name"></td>
                <td>
                  <select bind:value={entry.dataType} aria-label="Data type">
                    {#each DATA_TYPES as type}
                      <option value={type}>{type}</option>
                    {/each}
                    {#if !DATA_TYPES.includes(entry.dataType)}
                      <option value={entry.dataType}>{entry.dataType}</option>
                    {/if}
                  </select>
                </td>
                <td><input type="text" bind:value={entry.initial} aria-label="Initial value"></td>
                <td><input type="text" bind:value={entry.min} aria-label="Min"></td>
                <td><input type="text" bind:value={entry.max} aria-label="Max"></td>
                <td><input type="text" bind:value={entry.decimals} aria-label="Decimals"></td>
                {#each FLAG_COLUMNS as flag}
                  <td><input type="checkbox" bind:checked={entry[flag.key]} aria-label={flag.label}></td>
                {/each}
                <td><button type="button" class="remove" aria-label="Remove" onclick={() => removeVariable(entry.id)}>✕</button></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </section>
    {/if}

    {#if branches.length}
      <section>
        <h3>Branches <span class="count">{branches.length}</span></h3>
        <p class="station">
          Outdoor temperature:
          {#if outdoor}
            <code>AI_{pointBase(outdoor)}</code>
          {:else}
            <span class="missing">not set · give an analog input the role Outdoor temperature</span>
          {/if}
        </p>
        <table>
          <colgroup>
            <col style="width: 170px">
            <col style="width: 170px">
            <col style="width: 90px">
            {#each BRANCH_ROLES as role (role.id)}
              <col>
            {/each}
            <col style="width: 190px">
          </colgroup>
          <thead>
            <tr>
              <th>Branch</th>
              <th title="Name the branch POU in c.strategy exactly like this · the c.mask masks point to it">POU name</th>
              <th>Type</th>
              {#each BRANCH_ROLES as role (role.id)}
                <th>{role.label}</th>
              {/each}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each branchRows as row (row.branch.id)}
              <tr>
                <td class="branch-label">{row.branch.label}</td>
                <td><code title={pouName(row.branch)}>{pouName(row.branch)}</code></td>
                <td>{row.branch.type}</td>
                {#each BRANCH_ROLES as role (role.id)}
                  {@const point = row.io.found[role.id]}
                  <td>
                    {#if point}
                      <code class:clash={row.io.duplicates.includes(role.id)} title={pointBase(point)}>{pointBase(point)}</code>
                    {:else}
                      <span class:missing={role.id !== "thermostat"} class="none">{role.id === "thermostat" ? "none" : "missing"}</span>
                    {/if}
                  </td>
                {/each}
                <td>
                  <div class="branch-actions">
                    <button type="button" class="small" disabled={!!row.problem}
                            title={row.problem ?? `The POU ${pouName(row.branch)} with its blocks · the project needs the libraries ${solutionLibraries(row.template).join(", ")}`}
                            onclick={() => copyBranch(row)}>Copy POU</button>
                    <button type="button" class="small" disabled={!row.template} title="The POU's local variables, for its variable list in c.strategy"
                            onclick={() => copyBranchVariables(row)}>Copy variables</button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
        <p class="libraries">Copy POU first, pasted on Programs in c.strategy, then Copy variables into that POU's variable list. The project needs the libraries {solutionLibraries("heating").join(" and ")}.</p>
      </section>
    {/if}
  </div>
</div>

{#if pasting}
  <div class="paste-dialog" use:portal role="presentation" onpointerdown={(event) => event.target === event.currentTarget && (pasting = null)}>
    <form onsubmit={(event) => { event.preventDefault(); merge(pasting.text); }}>
      <strong>Paste variables copied from c.strategy</strong>
      <textarea bind:this={pasteArea} bind:value={pasting.text} placeholder="Copy rows in the c.strategy variable list, then paste them here (Ctrl+V)"
                onkeydown={(event) => event.key === "Escape" && (pasting = null)}></textarea>
      <div class="actions">
        <button type="button" onclick={() => pasting = null}>Cancel</button>
        <button type="submit" class="primary" disabled={!pasting.text.includes("<Variable ")}>Add to the list</button>
      </div>
    </form>
  </div>
{/if}
