<script>
  import { ALIGN_ACTIONS } from "$lib/tools/align.js";
  import { ROOM_CATEGORIES } from "$lib/tools/categories.js";
  import { MIN_DOOR_WIDTH } from "$lib/tools/doors.js";
  // import { PIPE_MEDIA, mediumOf } from "$lib/hydronic/elements.js";
  import { PIPE_MEDIA, READOUT_MODES, mediumOf } from "$lib/hydronic/elements.js";
  import BranchOptions from "./BranchOptions.svelte";

  let {
    tool,
    elbow,
    elbows,
    lineWidth,
    snapToGrid,
    target,
    selection = null,
    door = null,
    furniture = null,
    placing = null,
    fitting = null,
    medium = "supply",
    onmedium,
    onfittingflip,
    onfittingremove,
    onfittingscale,
    onfittingreadout,
    onreadoutreset,
    onbranchparam,
    onreverse,
    onpipelayer,
    onresetsize,
    onelementname,
    onlinewidth,
    onelbow,
    onsnap,
    ontarget,
    onalign,
    ondistribute,
    onlock,
    oncategory,
    onfurnish,
    onclearfurniture,
    onfurniturerotate,
    onfurnitureremove,
    onrotateplacing,
    onthermostat,
    ongroup,
    onungroup,
    onopacity,
    onfitimage,
    ondoor,
    ondoorremove,
    onradius,
    onname
  } = $props();

  const NAMES = {
    select: "Select",
    pan: "Pan",
    floor: "Floor outline",
    "room-rect": "Rectangle",
    "room-poly": "Polygon",
    curve: "Curve",
    place: "Place",
    pipe: "Pipe",
    line: "Line",
    rect: "Rectangle"
  };

  const MAX_WIDTH = 50;

  function readNumber(event, min, max){
    const value = Number(event.currentTarget.value);
    if (event.currentTarget.value === "" || !Number.isFinite(value)) return null;
    return Math.min(max, Math.max(min, Math.round(value)));
  }

  const TARGET_TOOLS = ["room-rect", "room-poly", "curve"];

  let mediumMenu = $state(null);

  function openMedium(event){
    const box = event.currentTarget.getBoundingClientRect();
    mediumMenu = mediumMenu ? null : { x: box.left, y: box.bottom + 4 };
  }

  function cycleMedium(value, event){
    const index = PIPE_MEDIA.findIndex((entry) => entry.id === mediumOf(value).id);
    const step = event.deltaY > 0 ? 1 : event.deltaY < 0 ? -1 : 0;
    if (step === 0) return;
    onmedium(PIPE_MEDIA[(index + step + PIPE_MEDIA.length) % PIPE_MEDIA.length].id);
  }

  function closeMedium(event){
    if (mediumMenu && !event.target.closest?.(".medium-menu, .medium-current")) mediumMenu = null;
  }

  function plural(count, word){
    return `${count} ${word}${count === 1 ? "" : "s"}`;
  }
</script>

<style>
  .tool-options {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    font-size: 12px;
    color: #475569;
  }

  .tool-name {
    font-family: 'Sora', 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
  }

  .sep {
    width: 1px;
    height: 18px;
    background: #e2e8f0;
  }

  label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    cursor: pointer;
  }

  input[type="number"],
  input[type="text"],
  select {
    height: 26px;
    padding: 2px 6px;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    background: #ffffff;
    font-family: inherit;
    font-size: 12px;
    color: #0f172a;
    box-sizing: border-box;
  }

  input[type="number"] {
    width: 58px;
  }

  input[type="text"] {
    width: 160px;
  }

  input[type="range"] {
    width: 120px;
    accent-color: #2563eb;
  }

  input[type="checkbox"] {
    width: 14px;
    height: 14px;
    margin: 0;
    accent-color: #2563eb;
  }

  input:focus-visible,
  select:focus-visible {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .unit,
  .muted {
    font-weight: 400;
    color: #94a3b8;
  }

  .icon-group {
    display: inline-flex;
    align-items: center;
    gap: 1px;
  }

  .icon-group button {
    width: 26px;
    padding: 0;
    border-color: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .icon-group button:hover:not(:disabled) {
    border-color: #bfdbfe;
  }

  .icon-group svg {
    width: 16px;
    height: 16px;
  }

  .segmented {
    display: inline-flex;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    overflow: hidden;
  }

  .segmented button {
    height: 24px;
    border: none;
    border-radius: 0;
  }

  .segmented button + button {
    border-left: 1px solid #cbd5e1;
  }

  .swatch {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 5px;
    border-radius: 2px;
    vertical-align: 0;
  }

  .swatches {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .swatches button,
  .swatches button:hover:not(:disabled) {
    width: 16px;
    height: 16px;
    padding: 0;
    border: 2px solid #ffffff;
    border-radius: 50%;
    background: var(--swatch);
    box-shadow: 0 0 0 1px #cbd5e1;
  }

  .swatches button:hover:not(:disabled) {
    box-shadow: 0 0 0 1px #64748b;
  }

  .swatches button.active,
  .swatches button.active:hover:not(:disabled) {
    box-shadow: 0 0 0 2px #2563eb;
  }

  button.medium-current {
    display: inline-flex;
    align-items: center;
    min-width: 170px;
  }

  .caret {
    margin-left: auto;
    padding-left: 8px;
    font-size: 10px;
    color: #94a3b8;
  }

  .medium-menu {
    position: fixed;
    z-index: 30;
    display: flex;
    flex-direction: column;
    min-width: 190px;
    padding: 4px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
  }

  .medium-menu button {
    display: flex;
    align-items: center;
    height: 28px;
    border: none;
    border-radius: 5px;
    text-align: left;
  }

  .medium-menu button.active {
    background: #eff6ff;
    color: #1d4ed8;
  }

  .medium-name {
    display: inline-flex;
    align-items: center;
    min-width: 118px;
  }

  .segmented button.active {
    background: #eff6ff;
    color: #1d4ed8;
  }

  button {
    height: 26px;
    padding: 0 10px;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    background: #ffffff;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
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
</style>

<!--
{#snippet mediumField(value)}
  <div class="segmented" role="group" aria-label="Pipe medium">
    {#each PIPE_MEDIA as entry (entry.id)}
      <button type="button" class:active={value === entry.id} aria-pressed={value === entry.id}
              onclick={() => onmedium(entry.id)}>
        <span class="swatch" style="background: {entry.color}"></span>{entry.label}
      </button>
    {/each}
  </div>
{/snippet}
-->

<svelte:window onpointerdown={closeMedium} onkeydown={(e) => e.key === "Escape" && (mediumMenu = null)}/>

{#snippet mediumField(value)}
  <button type="button" class="medium-current" aria-haspopup="listbox" aria-expanded={!!mediumMenu}
          title="Pipe type · scroll the mouse wheel to switch" onclick={openMedium} onwheel={(e) => cycleMedium(value, e)}>
    <span class="swatch" style="background: {mediumOf(value).color}"></span>{mediumOf(value).label}<span class="caret" aria-hidden="true">▾</span>
  </button>
  {#if mediumMenu}
    <div class="medium-menu" role="listbox" aria-label="Pipe type" style="left: {mediumMenu.x}px; top: {mediumMenu.y}px">
      {#each PIPE_MEDIA as entry (entry.id)}
        <button type="button" role="option" class:active={mediumOf(value).id === entry.id} aria-selected={mediumOf(value).id === entry.id}
                onclick={() => { onmedium(entry.id); mediumMenu = null; }}>
          <span class="swatch" style="background: {entry.color}"></span>{entry.label}
        </button>
      {/each}
    </div>
  {/if}
{/snippet}

<!--
{#snippet mediumField(value)}
  <div class="swatches" role="radiogroup" aria-label="Pipe medium">
    {#each PIPE_MEDIA as entry (entry.id)}
      <button type="button" role="radio" class:active={mediumOf(value).id === entry.id} aria-checked={mediumOf(value).id === entry.id}
              aria-label={entry.label} title={entry.label} style="--swatch: {entry.color}"
              onclick={() => onmedium(entry.id)}></button>
    {/each}
  </div>
  <span class="medium-name"><span class="swatch" style="background: {mediumOf(value).color}"></span>{mediumOf(value).label}</span>
{/snippet}
-->

{#snippet snapField()}
  <label>
    <input type="checkbox" checked={snapToGrid} onchange={(e) => onsnap(e.currentTarget.checked)}>
    Snap to grid
  </label>
{/snippet}

<div class="tool-options">
  <span class="tool-name">{NAMES[tool] ?? tool}</span>

  {#if tool === "select"}
    <span class="sep" aria-hidden="true"></span>
    {#if selection}
      <div class="icon-group" role="group" aria-label="Align">
        {#each ALIGN_ACTIONS as action}
          <button type="button" disabled={!selection.canAlign} aria-label={action.label}
                  title="{action.label} to {selection.alignTarget} ({action.shortcut})" onclick={() => onalign(action.id)}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true">
              {#if action.id === "left"}
                <path d="M2 1.5 V14.5"/><rect x="4" y="3.5" width="9" height="3" rx="0.6"/><rect x="4" y="9.5" width="5.5" height="3" rx="0.6"/>
              {:else if action.id === "hcenter"}
                <path d="M8 1.5 V14.5"/><rect x="3" y="3.5" width="10" height="3" rx="0.6"/><rect x="5" y="9.5" width="6" height="3" rx="0.6"/>
              {:else if action.id === "right"}
                <path d="M14 1.5 V14.5"/><rect x="3" y="3.5" width="9" height="3" rx="0.6"/><rect x="6.5" y="9.5" width="5.5" height="3" rx="0.6"/>
              {:else if action.id === "top"}
                <path d="M1.5 2 H14.5"/><rect x="3.5" y="4" width="3" height="9" rx="0.6"/><rect x="9.5" y="4" width="3" height="5.5" rx="0.6"/>
              {:else if action.id === "vcenter"}
                <path d="M1.5 8 H14.5"/><rect x="3.5" y="3" width="3" height="10" rx="0.6"/><rect x="9.5" y="5" width="3" height="6" rx="0.6"/>
              {:else}
                <path d="M1.5 14 H14.5"/><rect x="3.5" y="3" width="3" height="9" rx="0.6"/><rect x="9.5" y="6.5" width="3" height="5.5" rx="0.6"/>
              {/if}
            </svg>
          </button>
        {/each}
        <button type="button" disabled={!selection.canDistribute} aria-label="Distribute horizontally"
                title="Distribute horizontally (Ctrl+Shift+3)" onclick={() => ondistribute("x")}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true">
            <path d="M1.5 2 V14 M14.5 2 V14"/><rect x="6" y="4" width="4" height="8" rx="0.6"/>
          </svg>
        </button>
        <button type="button" disabled={!selection.canDistribute} aria-label="Distribute vertically"
                title="Distribute vertically (Ctrl+Shift+9)" onclick={() => ondistribute("y")}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true">
            <path d="M2 1.5 H14 M2 14.5 H14"/><rect x="4" y="6" width="8" height="4" rx="0.6"/>
          </svg>
        </button>
        <button type="button" disabled={!selection.canGroup} aria-label="Group" title="Group (Ctrl+G)" onclick={ongroup}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true">
            <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" stroke-dasharray="2 2"/>
            <rect x="4" y="4" width="4" height="4" rx="0.6"/><rect x="8.5" y="8.5" width="3.5" height="3.5" rx="0.6"/>
          </svg>
        </button>
        <button type="button" disabled={!selection.canUngroup} aria-label="Ungroup" title="Ungroup (Ctrl+Shift+G)" onclick={onungroup}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true">
            <rect x="1.5" y="1.5" width="6" height="6" rx="1"/><rect x="8.5" y="8.5" width="6" height="6" rx="1"/>
          </svg>
        </button>
        <button type="button" aria-label="Lock selection" title="Lock (Ctrl+Shift+L)" onclick={onlock}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="7" width="10" height="7" rx="1.2"/><path d="M5.5 7 V5 a2.5 2.5 0 0 1 5 0 V7"/>
          </svg>
        </button>
      </div>
      <span class="sep" aria-hidden="true"></span>
    {/if}
    {#if fitting}
      <span>{fitting.label}</span>
      <!-- <button type="button" onclick={onfittingflip} title="Turn it around: reverses a pump or check valve, moves a valve actuator to the other side">Flip</button> -->
      {#if fitting.measure}
        <div class="segmented" role="group" aria-label="Readout">
          {#each READOUT_MODES as mode (mode.id)}
            <button type="button" class:active={fitting.readout === mode.id} aria-pressed={fitting.readout === mode.id}
                    onclick={() => onfittingreadout(mode.id)}>{mode.id === "value" ? fitting.measure : mode.label}</button>
          {/each}
        </div>
        {#if fitting.moved}
          <button type="button" onclick={onreadoutreset} title="Let the readout pick a free side again">Auto position</button>
        {/if}
      {:else}
        <button type="button" onclick={onfittingflip} title="Turn it around: reverses a pump or check valve, moves a valve actuator to the other side">Flip</button>
      {/if}
      <label>
        Size
        <input type="range" min="50" max="200" step="5" value={Math.round(fitting.scale * 100)}
               oninput={(e) => onfittingscale(Number(e.currentTarget.value) / 100)}>
        <span class="unit">{Math.round(fitting.scale * 100)}%</span>
      </label>
      <button type="button" onclick={onfittingremove}>Remove</button>
      <!-- <span class="muted">Drag it along the pipe to move it</span> -->
      <span class="muted">{fitting.measure && fitting.readout !== "none" ? "Drag it along the pipe · drag the readout to place it" : "Drag it along the pipe to move it"}</span>
    {:else if furniture}
      <span>{furniture.label} · {furniture.roomName}</span>
      <button type="button" onclick={onfurniturerotate} title="Rotate 90°">Rotate 90°</button>
      <button type="button" onclick={onfurnitureremove}>Remove</button>
      <span class="muted">Drag to move it inside the room</span>
    {:else if door}
      <span>Door · {door.roomName}</span>
      <span>Hinge</span>
      <div class="segmented" role="group" aria-label="Hinge side">
        <button type="button" class:active={door.hinge === "left"} aria-pressed={door.hinge === "left"}
                onclick={() => ondoor({ hinge: "left" })}>Left</button>
        <button type="button" class:active={door.hinge === "right"} aria-pressed={door.hinge === "right"}
                onclick={() => ondoor({ hinge: "right" })}>Right</button>
      </div>
      <span>Opens</span>
      <div class="segmented" role="group" aria-label="Opening direction">
        <button type="button" class:active={door.swing === "in"} aria-pressed={door.swing === "in"}
                onclick={() => ondoor({ swing: "in" })}>Into room</button>
        <button type="button" class:active={door.swing === "out"} aria-pressed={door.swing === "out"}
                onclick={() => ondoor({ swing: "out" })}>Out of room</button>
      </div>
      <label>
        Width
        <input type="number" min={MIN_DOOR_WIDTH} max={door.maxWidth} step="5" value={door.width}
               onchange={(e) => { const next = readNumber(e, MIN_DOOR_WIDTH, door.maxWidth); if (next !== null) ondoor({ width: next }); }}>
        <span class="unit">cm</span>
      </label>
      <button type="button" onclick={ondoorremove}>Remove door</button>
      <span class="muted">Drag the door along the walls to move it</span>
    {:else if !selection}
      <span class="muted">Nothing selected · drag on empty space to select an area</span>
    {:else if selection.points > 0}
      <span>{plural(selection.points, "corner")}</span>
      {#if selection.maxRadius > 0}
        <label>
          Radius
          <input type="range" min="0" max={selection.maxRadius} step="1" value={selection.radius}
                 oninput={(e) => onradius(Number(e.currentTarget.value))}>
          <input type="number" min="0" max={selection.maxRadius} step="1" value={selection.radius}
                 oninput={(e) => { const next = readNumber(e, 0, selection.maxRadius); if (next !== null) onradius(next); }}>
          <span class="unit">cm</span>
        </label>
        <button type="button" disabled={selection.radius === 0} onclick={() => onradius(0)}>Square corner</button>
      {:else}
        <!-- <span class="muted">Curved corners can't be rounded</span> -->
        <span class="muted">{selection.shape.open ? "Open wall corners can't be rounded" : "Curved corners can't be rounded"}</span>
      {/if}
      <span class="muted">Delete removes the corner</span>
    {:else if selection.edges > 0}
      <span>{plural(selection.edges, "edge")}</span>
      <span class="muted">Drag to push or pull · Alt+drag moves freely</span>
    {:else if selection.count > 1}
      <span>{selection.grouped ? `Group · ${plural(selection.count, "shape")}` : `${plural(selection.count, "shape")} selected`}</span>
      <span class="muted">Drag to move together · Delete removes them</span>
    {:else}
      <span>{selection.kindLabel}</span>
      {#if selection.shape.kind === "room"}
        <label>
          Name
          <input type="text" value={selection.shape.name}
                 onchange={(e) => onname(e.currentTarget.value)}
                 onkeydown={(e) => e.key === "Enter" && e.currentTarget.blur()}>
        </label>
      {/if}
      {#if selection.shape.kind === "pipe"}
        {@render mediumField(selection.shape.medium)}
        <button type="button" onclick={onreverse} title="Reverse the flow direction">Reverse flow</button>
        <div class="segmented" role="group" aria-label="Crossing order">
          <button type="button" onclick={() => onpipelayer(false)} title="Pass under other pipes where they cross">Below</button>
          <button type="button" onclick={() => onpipelayer(true)} title="Pass over other pipes where they cross">Above</button>
        </div>
        <!-- <span class="muted">Drag the square handles to move bend points · Alt+click removes one</span> -->
        <span class="muted">Drag a corner or an edge to reshape · Alt+click a corner removes it</span>
      {/if}
      {#if selection.shape.kind === "equipment"}
        <label>
          Name
          <input type="text" value={selection.shape.name ?? ""}
                 onchange={(e) => onelementname(e.currentTarget.value)}
                 onkeydown={(e) => e.key === "Enter" && e.currentTarget.blur()}>
        </label>
        {#if selection.shape.type === "manifold"}
          {@render mediumField(selection.shape.medium)}
        {/if}
        {#if selection.shape.type === "branch"}
          <BranchOptions element={selection.shape} onchange={onbranchparam}/>
        {/if}
        <button type="button" onclick={onresetsize}>Reset size</button>
        <!-- <span class="muted">Drag a corner to scale · Shift frees the aspect ratio</span> -->
        <span class="muted">{selection.shape.type === "manifold" ? "Drag a corner to change the length" : "Drag a corner to scale · Shift frees the aspect ratio"}</span>
      {/if}
      {#if selection.legacy}
        <label>
          Stroke (all traces)
          <input type="number" min="1" max={MAX_WIDTH} step="1" value={lineWidth}
                 oninput={(e) => { const next = readNumber(e, 1, MAX_WIDTH); if (next !== null) onlinewidth(next); }}>
        </label>
      {/if}
      {#if selection.shape.kind === "image"}
        <label>
          Opacity
          <input type="range" min="5" max="100" step="5" value={Math.round(selection.shape.opacity * 100)}
                 oninput={(e) => onopacity(Number(e.currentTarget.value) / 100)}>
          <span class="unit">{Math.round(selection.shape.opacity * 100)}%</span>
        </label>
        <button type="button" onclick={onfitimage}>Fit to display</button>
        <span class="muted">Drag a corner to scale · Shift frees the aspect ratio</span>
      {/if}
    {/if}
    {#if selection && selection.roomCount > 0 && selection.points === 0 && selection.edges === 0}
      <label>
        Category
        <select value={selection.category} onchange={(e) => oncategory(e.currentTarget.value)}>
          {#if selection.category === "mixed"}
            <option value="mixed" disabled>Mixed</option>
          {/if}
          <option value="">Room</option>
          {#each ROOM_CATEGORIES as category}
            <option value={category.id}>{category.label}</option>
          {/each}
        </select>
      </label>
      <label>
        <input type="checkbox" checked={selection.thermostat === "all"}
               indeterminate={selection.thermostat === "mixed"}
               onchange={(e) => onthermostat(e.currentTarget.checked)}>
        Thermostat
      </label>
      {#if selection.furnish}
        <button type="button" disabled={!selection.furnish.supported}
                title={selection.furnish.supported ? "Lay out furniture for this room's category" : "Set a category first"}
                onclick={onfurnish}>{selection.furnish.count ? "Refurnish" : "Furnish"}</button>
        {#if selection.furnish.count}
          <button type="button" onclick={onclearfurniture}>Clear furniture</button>
        {/if}
      {/if}
    {/if}
  {:else if tool === "place"}
    <span class="sep" aria-hidden="true"></span>
    {#if placing}
      <span>{placing.label}</span>
      {#if placing.label !== "Door" && placing.rotatable !== false}
        <button type="button" onclick={onrotateplacing}>Rotate 90° (R)</button>
      {/if}
      <span class="muted">{placing.hint}</span>
    {/if}
  {:else if tool === "pipe"}
    <span class="sep" aria-hidden="true"></span>
    {@render mediumField(medium)}
    <span class="muted">Click an element · Ctrl+click adds a bend point · click another element to connect</span>
  {:else if tool !== "pan"}
    <span class="sep" aria-hidden="true"></span>
    {#if TARGET_TOOLS.includes(tool)}
      <span>Creates</span>
      <div class="segmented" role="group" aria-label="Shape to create">
        <button type="button" class:active={target === "floor"} aria-pressed={target === "floor"}
                onclick={() => ontarget("floor")}>Floor</button>
        <button type="button" class:active={target === "room"} aria-pressed={target === "room"}
                onclick={() => ontarget("room")}>Room</button>
        <button type="button" class:active={target === "wall"} aria-pressed={target === "wall"}
                title="Decorative wall · Enter or clicking the last corner again leaves it open"
                onclick={() => ontarget("wall")}>Wall</button>
      </div>
    {/if}
    {#if tool === "line" || tool === "rect"}
      <label>
        Stroke
        <input type="number" min="1" max={MAX_WIDTH} step="1" value={lineWidth}
               oninput={(e) => { const next = readNumber(e, 1, MAX_WIDTH); if (next !== null) onlinewidth(next); }}>
      </label>
    {/if}
    {#if tool === "line"}
      <label>
        Routing
        <select value={elbow} onchange={(e) => onelbow(e.currentTarget.value)}>
          {#each elbows as option}
            <option value={option.id}>{option.label}</option>
          {/each}
        </select>
      </label>
    {/if}
    {@render snapField()}
  {/if}
</div>
