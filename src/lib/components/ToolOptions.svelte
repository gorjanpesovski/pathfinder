<script>
  import { ALIGN_ACTIONS } from "$lib/tools/align.js";
  import { ROOM_CATEGORIES } from "$lib/tools/categories.js";
  import { MIN_DOOR_WIDTH } from "$lib/tools/doors.js";
  import SelectionOptions from "./SelectionOptions.svelte";
  import MediumPicker from "./MediumPicker.svelte";

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
    groups = null,
    onnamesize,
    onfittingnamesize,
    medium = "supply",
    onmedium,
    onfittingflip,
    onfittingremove,
    onfittingscale,
    onfittingreadout,
    onreadoutreset,
    onbranchparam,
    onelementrotate,
    onelementsize,
    ontankprobe,
    pipewidth = 8,
    onpipewidth,
    onedittext,
    ontextstyle,
    onreverse,
    onpipelayer,
    onresetsize,
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
    text: "Text",
    line: "Line",
    rect: "Rectangle"
  };

  const MAX_WIDTH = 50;
  const TARGET_TOOLS = ["room-rect", "room-poly", "curve"];

  let keepRatio = $state(true);

  function readNumber(event, min, max){
    const value = Number(event.currentTarget.value);
    if (event.currentTarget.value === "" || !Number.isFinite(value)) return null;
    return Math.min(max, Math.max(min, Math.round(value)));
  }

  function plural(count, word){
    return `${count} ${word}${count === 1 ? "" : "s"}`;
  }
</script>

<style>
  .tool-options {
    display: flex;
    flex: 1 1 auto;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 14px;
    min-width: 0;
    min-height: 40px;
    padding: 6px 12px 6px 0;
    border-bottom: 1px solid #e2e8f0;
    border-bottom-right-radius: 8px;
    background: #ffffff;
    box-sizing: border-box;
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

  .unit {
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

  button.active,
  .segmented button.active {
    background: #eff6ff;
    color: #1d4ed8;
    border-color: #93c5fd;
  }

  button:disabled {
    color: #cbd5e1;
    cursor: not-allowed;
  }
</style>

{#snippet alignIcon(id)}
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true">
    {#if id === "left"}
      <path d="M2 1.5 V14.5"/><rect x="4" y="3.5" width="9" height="3" rx="0.6"/><rect x="4" y="9.5" width="5.5" height="3" rx="0.6"/>
    {:else if id === "hcenter"}
      <path d="M8 1.5 V14.5"/><rect x="3" y="3.5" width="10" height="3" rx="0.6"/><rect x="5" y="9.5" width="6" height="3" rx="0.6"/>
    {:else if id === "right"}
      <path d="M14 1.5 V14.5"/><rect x="3" y="3.5" width="9" height="3" rx="0.6"/><rect x="6.5" y="9.5" width="5.5" height="3" rx="0.6"/>
    {:else if id === "top"}
      <path d="M1.5 2 H14.5"/><rect x="3.5" y="4" width="3" height="9" rx="0.6"/><rect x="9.5" y="4" width="3" height="5.5" rx="0.6"/>
    {:else if id === "vcenter"}
      <path d="M1.5 8 H14.5"/><rect x="3.5" y="3" width="3" height="10" rx="0.6"/><rect x="9.5" y="5" width="3" height="6" rx="0.6"/>
    {:else}
      <path d="M1.5 14 H14.5"/><rect x="3.5" y="3" width="3" height="9" rx="0.6"/><rect x="9.5" y="6.5" width="3" height="5.5" rx="0.6"/>
    {/if}
  </svg>
{/snippet}

{#snippet distributeButtons(disabled)}
  <button type="button" {disabled} aria-label="Distribute horizontally" title="Distribute horizontally (Ctrl+Shift+3)" onclick={() => ondistribute("x")}>
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true">
      <path d="M1.5 2 V14 M14.5 2 V14"/><rect x="6" y="4" width="4" height="8" rx="0.6"/>
    </svg>
  </button>
  <button type="button" {disabled} aria-label="Distribute vertically" title="Distribute vertically (Ctrl+Shift+9)" onclick={() => ondistribute("y")}>
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true">
      <path d="M2 1.5 H14 M2 14.5 H14"/><rect x="4" y="6" width="8" height="4" rx="0.6"/>
    </svg>
  </button>
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
            {@render alignIcon(action.id)}
          </button>
        {/each}
        {@render distributeButtons(!selection.canDistribute)}
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
    {:else if fitting && fitting.count > 1}
      <div class="icon-group" role="group" aria-label="Align">
        {#each ALIGN_ACTIONS as action}
          <button type="button" aria-label={action.label} title="{action.label} ({action.shortcut})" onclick={() => onalign(action.id)}>
            {@render alignIcon(action.id)}
          </button>
        {/each}
        {@render distributeButtons(fitting.count < 3)}
      </div>
      <span class="sep" aria-hidden="true"></span>
    {/if}
    {#if groups}
      <SelectionOptions {groups} bind:keepRatio {onelementsize} {onelementrotate} {onresetsize} {onnamesize} {ontankprobe}
                        {onbranchparam} {onmedium} {onpipewidth} {onreverse} {onpipelayer} {onfittingreadout} {onreadoutreset}
                        {onfittingflip} {onfittingscale} {onfittingremove} {onfittingnamesize} {onedittext} {ontextstyle}/>
    {:else if furniture}
      <span>{furniture.label} · {furniture.roomName}</span>
      <button type="button" onclick={onfurniturerotate}>Rotate 90°</button>
      <button type="button" onclick={onfurnitureremove}>Remove</button>
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
    {:else if selection?.points > 0}
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
      {/if}
    {:else if selection?.edges > 0}
      <span>{plural(selection.edges, "edge")}</span>
    {:else if selection?.count > 1}
      <span>{selection.grouped ? `Group · ${plural(selection.count, "shape")}` : `${plural(selection.count, "shape")} selected`}</span>
    {:else if selection}
      <span>{selection.kindLabel}</span>
      {#if selection.shape.kind === "room"}
        <label>
          Name
          <input type="text" value={selection.shape.name}
                 onchange={(e) => onname(e.currentTarget.value)}
                 onkeydown={(e) => e.key === "Enter" && e.currentTarget.blur()}>
        </label>
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
    {#if placing}
      <span class="sep" aria-hidden="true"></span>
      <span>{placing.label}</span>
      {#if placing.label !== "Door" && placing.rotatable !== false}
        <button type="button" onclick={onrotateplacing}>Rotate 90° (R)</button>
      {/if}
    {/if}
  {:else if tool === "pipe"}
    <span class="sep" aria-hidden="true"></span>
    <MediumPicker value={medium} onchange={onmedium}/>
    <label>
      Width
      <input type="number" min="1" max="40" step="1" value={pipewidth}
             oninput={(e) => { const next = readNumber(e, 1, 40); if (next !== null) onpipewidth(next); }}>
    </label>
  {:else if tool !== "pan" && tool !== "text"}
    <span class="sep" aria-hidden="true"></span>
    {#if TARGET_TOOLS.includes(tool)}
      <span>Creates</span>
      <div class="segmented" role="group" aria-label="Shape to create">
        <button type="button" class:active={target === "floor"} aria-pressed={target === "floor"}
                onclick={() => ontarget("floor")}>Floor</button>
        <button type="button" class:active={target === "room"} aria-pressed={target === "room"}
                onclick={() => ontarget("room")}>Room</button>
        <button type="button" class:active={target === "wall"} aria-pressed={target === "wall"}
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
    <label>
      <input type="checkbox" checked={snapToGrid} onchange={(e) => onsnap(e.currentTarget.checked)}>
      Snap to grid
    </label>
  {/if}
</div>
