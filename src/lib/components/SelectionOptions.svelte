<script>
  import { TANK_PROBES } from "$lib/hydronic/tank.js";
  import { HYDRONIC_ELEMENTS } from "$lib/hydronic/elements.js";
  import { formatSlots, parseSlots } from "$lib/electric/symbols.js";
  import MediumPicker from "./MediumPicker.svelte";
  import NetworkActions from "./NetworkActions.svelte";
  import BranchOptions from "./BranchOptions.svelte";
  import MeterReadouts from "./MeterReadouts.svelte";

  let {
    groups,
    keepRatio = $bindable(true),
    onelementsize,
    onresetsize,
    onnamesize,
    ontankprobe,
    onbranchparam,
    onbranchname,
    ondeviceparam,
    network = null,
    onconnect,
    onadddevices,
    onmedium,
    onpipewidth,
    onreverse,
    onpipelayer,
    onfittingreadout,
    onmeterreadout,
    onreadoutreset,
    onfittingflip,
    onfittingturn,
    onvariables = null,
    onfittingscale,
    onfittingnamesize,
    onfittingname,
    onreadoutscale,
    onedittext,
    ontextstyle,
    ondelete
  } = $props();

  const GROUP_GAP = 12;
  const MORE_WIDTH = 78;
  const DELETE_WIDTH = 40;

  let elements = $derived(groups.elements);
  let pipes = $derived(groups.pipes);
  let fittings = $derived(groups.fittings);
  let texts = $derived(groups.texts);
  let total = $derived((elements?.count ?? 0) + (pipes?.count ?? 0) + (fittings?.count ?? 0) + (texts?.count ?? 0));

  let single = $derived(total === 1);
  let typeName = $derived(!single ? `${total} elements`
    : elements ? elements.label : fittings ? fittings.label : pipes ? "Pipe" : "Text");

  let plainElements = $derived(elements && !elements.electric ? elements : null);
  let elementName = $derived.by(() => {
    if (!elements) return null;
    if (elements.electric) return elements.wiring?.count === 1 ? elements.wiring.name ?? "" : null;
    if (elements.device) return elements.device.count === 1 ? elements.device.name ?? "" : null;
    if (elements.branch) return elements.count === 1 ? elements.branch.name ?? "" : null;
    return elements.single && !elements.nameless ? elements.single.name ?? "" : null;
  });
  let elementNameSize = $derived(plainElements && (plainElements.labelled || plainElements.generics)
    ? (plainElements.labelled && !plainElements.generics ? plainElements.nameSize : !plainElements.labelled ? plainElements.fontSize : (plainElements.nameSize === plainElements.fontSize ? plainElements.nameSize : null))
    : undefined);

  let readout = $derived.by(() => {
    if (!fittings?.measured) return null;
    const mode = fittings.readout;
    if (mode === null) return { value: "mixed", setpoint: "mixed" };
    return { value: mode === "value" || mode === "both" ? "on" : "off", setpoint: mode === "setpoint" || mode === "both" ? "on" : "off" };
  });

  let applies = $derived({
    identity: elementName !== null || elementNameSize !== undefined || !!fittings,
    geometry: !!plainElements || !!fittings || !!pipes || !!texts,
    display: !!(plainElements?.tanks || (plainElements?.bars && !pipes) || pipes || fittings?.measured || fittings?.meters || fittings?.sized || texts || plainElements?.branch),
    data: !!(elements?.device || elements?.wiring || onvariables),
    actions: !!(fittings?.flippable || fittings?.turnable || (fittings?.sized && fittings?.moved) || plainElements || pipes || texts?.alone || network)
  });
  let order = $derived(["identity", "geometry", "display", "data", "actions"].filter((id) => applies[id]));

  let barWidth = $state(0);
  let typeWidth = $state(0);
  let widths = $state({});
  let moreOpen = $state(false);
  let moreRoot = $state(null);

  let visible = $derived.by(() => {
    const room = barWidth - typeWidth - DELETE_WIDTH;
    const sizes = order.map((id) => (widths[id] ?? 0) + GROUP_GAP);
    if (sizes.reduce((sum, size) => sum + size, 0) <= room) return order.length;
    let used = MORE_WIDTH;
    let count = 0;
    for (const size of sizes) {
      if (used + size > room) break;
      used += size;
      count += 1;
    }
    return count;
  });
  let hidden = $derived(order.slice(visible));

  $effect(() => {
    if (!hidden.length) moreOpen = false;
  });

  function readNumber(event, min, max){
    const value = Number(event.currentTarget.value);
    if (event.currentTarget.value === "" || !Number.isFinite(value)) return null;
    return Math.min(max, Math.max(min, Math.round(value)));
  }

  function readLive(event, min, max){
    const value = Number(event.currentTarget.value);
    if (event.currentTarget.value === "" || !Number.isFinite(value) || value < min || value > max) return null;
    return Math.round(value);
  }

  function readSize(event){
    const value = Number(event.currentTarget.value);
    return event.currentTarget.value === "" || !Number.isFinite(value) ? null : Math.min(4000, Math.max(4, Math.round(value * 10) / 10));
  }

  function blurOnEnter(event){
    if (event.key === "Enter") event.currentTarget.blur();
  }

  function readoutMode(value, setpoint){
    return value && setpoint ? "both" : value ? "value" : setpoint ? "setpoint" : "none";
  }

  function toggleReadout(kind){
    const value = readout.value === "on";
    const setpoint = readout.setpoint === "on";
    if (readout.value === "mixed") onfittingreadout(kind);
    else onfittingreadout(kind === "value" ? readoutMode(!value, setpoint) : readoutMode(value, !setpoint));
  }

  function outside(event){
    if (moreOpen && !moreRoot?.contains(event.target)) moreOpen = false;
  }
</script>

<svelte:window onpointerdown={outside} onkeydown={(e) => e.key === "Escape" && (moreOpen = false)}/>

<style>
  .bar {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1 1 0;
    min-width: 0;
    height: 28px;
    white-space: nowrap;
  }

  .group {
    display: flex;
    align-items: center;
    flex: none;
    gap: 8px;
  }

  .slot {
    position: relative;
    display: flex;
    align-items: center;
    flex: none;
    margin-left: 12px;
    padding-left: 13px;
  }

  .slot::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    width: 1px;
    height: 18px;
    background: #e2e8f0;
    transform: translateY(-50%);
  }

  .slot.overflowed {
    position: absolute;
    left: 0;
    top: 0;
    visibility: hidden;
    pointer-events: none;
  }

  .type {
    font-family: 'Sora', 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
  }

  label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
  }

  input[type="number"],
  input[type="text"] {
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

  input.name {
    width: 160px;
  }

  input.name-size {
    width: 48px;
  }

  input.wide {
    width: 190px;
  }

  input.address {
    width: 120px;
  }

  input[type="range"] {
    width: 96px;
    accent-color: #2563eb;
  }

  input[type="color"] {
    width: 30px;
    height: 26px;
    padding: 1px 2px;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    background: #ffffff;
    cursor: pointer;
  }

  input:focus-visible {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .aa {
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
  }

  .percent {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .percent input {
    width: 56px;
    padding-right: 18px;
    text-align: right;
  }

  .percent span {
    position: absolute;
    right: 6px;
    font-size: 11px;
    color: #94a3b8;
    pointer-events: none;
  }

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    height: 26px;
    padding: 0 10px;
    line-height: 1;
    box-sizing: border-box;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    background: #ffffff;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
  }

  button:hover {
    background: #eff6ff;
    color: #1d4ed8;
  }

  button.active {
    background: #eff6ff;
    color: #1d4ed8;
    border-color: #93c5fd;
  }

  .chip {
    height: 24px;
    padding: 0 10px;
    border-radius: 999px;
    background: #ffffff;
    color: #475569;
  }

  .chip.on {
    border-color: #93c5fd;
    background: #dbeafe;
    color: #1d4ed8;
  }

  .chip.mixed {
    border-color: #93c5fd;
    background: repeating-linear-gradient(135deg, #dbeafe 0 4px, #ffffff 4px 8px);
    color: #1d4ed8;
  }

  .icon {
    width: 26px;
    height: 26px;
    padding: 0;
  }

  .icon svg {
    width: 14px;
    height: 14px;
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

  .link {
    width: 26px;
    min-width: 26px;
    height: 26px;
    padding: 0;
  }

  .link svg {
    flex: none;
    width: 14px;
    height: 14px;
  }

  .tail {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: none;
    margin-left: auto;
    padding-left: 12px;
  }

  .more {
    position: relative;
  }

  .more-menu {
    position: absolute;
    right: 0;
    top: calc(100% + 6px);
    z-index: 30;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 220px;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
  }

  .more-menu .group {
    flex-wrap: wrap;
  }

  .more-menu .group + .group {
    padding-top: 10px;
    border-top: 1px solid #e2e8f0;
  }

  .delete {
    width: 26px;
    height: 26px;
    padding: 0;
    border-color: transparent;
    background: none;
    color: #64748b;
  }

  .delete:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  .delete svg {
    width: 16px;
    height: 16px;
  }
</style>

{#snippet percentControl(label, value, shown, min, max, step, apply)}
  <label>
    {label}
    <input type="range" {min} {max} {step} value={shown} aria-label="{label} slider" oninput={(e) => apply(Number(e.currentTarget.value))}>
  </label>
  <span class="percent">
    <input type="number" {min} {max} step="1" value={value ?? ""} placeholder="–" aria-label="{label} in percent"
           onchange={(e) => { const next = readNumber(e, min, max); if (next !== null) { e.currentTarget.value = String(next); apply(next); } }}
           onkeydown={blurOnEnter}>
    <span aria-hidden="true">%</span>
  </span>
{/snippet}

{#snippet nameField(value, commit)}
  <input type="text" class="name" aria-label="Name" placeholder="Unnamed" {value}
         onchange={(e) => commit(e.currentTarget.value)} onkeydown={blurOnEnter}>
{/snippet}

{#snippet nameSizeField(value, commit)}
  <label title="Name size">
    <span class="aa" aria-hidden="true">Aa</span>
    <input type="number" class="name-size" aria-label="Name size" min="6" max="200" step="1" value={value ?? ""} placeholder="–"
           onchange={(e) => { const next = readNumber(e, 6, 200); if (next !== null) commit(next); }} onkeydown={blurOnEnter}>
  </label>
{/snippet}

{#snippet identityGroup()}
  {#if elementName !== null}
    {@render nameField(elementName, onbranchname)}
  {/if}
  {#if fittings?.count === 1}
    {@render nameField(fittings.name ?? "", onfittingname)}
  {/if}
  {#if elementNameSize !== undefined}
    {@render nameSizeField(elementNameSize, onnamesize)}
  {/if}
  {#if fittings}
    {@render nameSizeField(fittings.nameSize, onfittingnamesize)}
  {/if}
{/snippet}

{#snippet geometryGroup()}
  {#if plainElements?.scaled}
    {@const scaled = plainElements.scaled}
    {@render percentControl("Size", scaled.percent, scaled.shown, 20, 400, 5, (value) => onelementsize("width", Math.round(scaled.base * value) / 100, true))}
  {:else if plainElements}
    <label>
      W
      <input type="number" min="4" step="1" value={plainElements.width ?? ""} placeholder="–"
             onchange={(e) => { const next = readSize(e); if (next !== null) onelementsize("width", next, keepRatio); }} onkeydown={blurOnEnter}>
    </label>
    <button type="button" class="link" class:active={keepRatio} aria-pressed={keepRatio} aria-label="Keep proportions" title="Keep proportions · W and H change together"
            onclick={() => keepRatio = !keepRatio}>
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
        <path d="M6.5 9.5 L9.5 6.5"/>
        <path d="M7 4.5 L8.3 3.2 a2.5 2.5 0 0 1 3.5 3.5 L10.5 8"/>
        {#if keepRatio}
          <path d="M9 11.5 L7.7 12.8 a2.5 2.5 0 0 1 -3.5 -3.5 L5.5 8"/>
        {:else}
          <path d="M9 11.5 L7.7 12.8 a2.5 2.5 0 0 1 -3.5 -3.5" stroke-dasharray="1.5 1.5"/>
        {/if}
      </svg>
    </button>
    <label>
      H
      <input type="number" min="4" step="1" value={plainElements.height ?? ""} placeholder="–"
             onchange={(e) => { const next = readSize(e); if (next !== null) onelementsize("height", next, keepRatio); }} onkeydown={blurOnEnter}>
    </label>
  {/if}
  {#if fittings}
    {@render percentControl("Size", fittings.scale === null ? null : Math.round(fittings.scale * 100), Math.round(fittings.shownScale * 100), 10, 200, 5, (value) => onfittingscale(value / 100))}
  {/if}
  {#if pipes}
    <label>
      Width
      <input type="number" min="1" max="40" step="1" value={pipes.width ?? ""} placeholder="–"
             oninput={(e) => { const next = readLive(e, 1, 40); if (next !== null) onpipewidth(next); }}
             onchange={(e) => { const next = readNumber(e, 1, 40); if (next !== null) onpipewidth(next); }}>
    </label>
  {/if}
  {#if texts}
    <label>
      Size
      <input type="number" min="6" max="200" step="1" value={texts.fontSize ?? ""} placeholder="–"
             oninput={(e) => { const next = readLive(e, 6, 200); if (next !== null) ontextstyle("fontSize", next); }}
             onchange={(e) => { const next = readNumber(e, 6, 200); if (next !== null) ontextstyle("fontSize", next); }}>
    </label>
  {/if}
{/snippet}

{#snippet displayGroup()}
  {#if plainElements?.tanks}
    {#each TANK_PROBES as probe (probe.id)}
      {@const state = plainElements.tanks[probe.id]}
      <button type="button" class="chip" class:on={state === "all"} class:mixed={state === "mixed"}
              aria-pressed={state === "all" ? "true" : state === "mixed" ? "mixed" : "false"}
              onclick={() => ontankprobe(probe.id)}>{probe.label}</button>
    {/each}
  {/if}
  {#if pipes || (plainElements?.bars && !pipes)}
    <MediumPicker value={pipes ? pipes.medium : plainElements.barMedium} onchange={onmedium}/>
  {/if}
  {#if pipes}
    <div class="segmented" role="group" aria-label="Crossing order">
      <button type="button" onclick={() => onpipelayer(false)}>Below</button>
      <button type="button" onclick={() => onpipelayer(true)}>Above</button>
    </div>
  {/if}
  {#if readout}
    <button type="button" class="chip" class:on={readout.value === "on"} class:mixed={readout.value === "mixed"}
            aria-pressed={readout.value === "on"} onclick={() => toggleReadout("value")}>{fittings.measure ?? "Value"}</button>
    <button type="button" class="chip" class:on={readout.setpoint === "on"} class:mixed={readout.setpoint === "mixed"}
            aria-pressed={readout.setpoint === "on"} onclick={() => toggleReadout("setpoint")}>Setpoint</button>
  {/if}
  {#if fittings?.meters}
    <MeterReadouts options={fittings.meters} onchange={onmeterreadout}/>
  {/if}
  {#if fittings?.sized}
    {@render percentControl("Readout", fittings.readoutScale === null ? null : Math.round(fittings.readoutScale * 100), Math.round((fittings.readoutScale ?? 1) * 100), 40, 200, 5, (value) => onreadoutscale(value / 100))}
  {/if}
  {#if texts}
    <input type="color" aria-label="Text colour" title="Text colour" value={texts.color} oninput={(e) => ontextstyle("color", e.currentTarget.value.toUpperCase())}>
    <button type="button" class="icon" class:active={texts.bold} aria-pressed={texts.bold} aria-label="Bold" title="Bold"
            onclick={() => ontextstyle("bold", !texts.bold)}><b>B</b></button>
  {/if}
  {#if plainElements?.branch}
    <BranchOptions element={plainElements.branch} onchange={onbranchparam}/>
  {/if}
{/snippet}

{#snippet dataGroup()}
  {#if elements?.device}
    {@const device = elements.device}
    {@const kind = HYDRONIC_ELEMENTS[device.type].device}
    {#if kind === "ip" || kind === "gateway"}
      <label>
        IP
        <input type="text" class="address" value={device.params?.ip ?? ""} placeholder="10.0.0.1"
               onchange={(e) => ondeviceparam("ip", e.currentTarget.value.trim())} onkeydown={blurOnEnter}>
      </label>
      <label>
        Port
        <input type="number" min="1" max="65535" step="1" value={device.params?.port ?? 502}
               onchange={(e) => { const next = readNumber(e, 1, 65535); if (next !== null) ondeviceparam("port", next); }} onkeydown={blurOnEnter}>
      </label>
    {/if}
    {#if kind === "ip" || kind === "rtu"}
      <label>
        Slave ID
        <input type="number" min="0" max="255" step="1" value={device.params?.slave ?? 1}
               onchange={(e) => { const next = readNumber(e, 0, 255); if (next !== null) ondeviceparam("slave", next); }} onkeydown={blurOnEnter}>
      </label>
    {/if}
  {/if}
  {#if elements?.wiring}
    {@const part = elements.wiring}
    {#if part.type === "controller" || part.type === "fieldDevice"}
      <label>
        Model
        <input type="text" class="name" value={part.params?.model ?? ""}
               onchange={(e) => ondeviceparam("model", e.currentTarget.value.trim())} onkeydown={blurOnEnter}>
      </label>
    {/if}
    {#if part.type === "controller" || part.type === "fieldDevice" || part.type === "terminalStrip"}
      <label>
        Terminals
        <input type="text" class="wide" value={formatSlots(part.params?.terminals)}
               onchange={(e) => ondeviceparam("terminals", parseSlots(e.currentTarget.value))} onkeydown={blurOnEnter}>
      </label>
    {/if}
    {#if part.type === "cable"}
      <label>
        Type
        <input type="text" class="name" value={part.params?.cableType ?? ""}
               onchange={(e) => ondeviceparam("cableType", e.currentTarget.value.trim())} onkeydown={blurOnEnter}>
      </label>
      <label>
        Conductors
        <input type="text" class="wide" value={formatSlots(part.params?.conductors)}
               onchange={(e) => ondeviceparam("conductors", parseSlots(e.currentTarget.value))} onkeydown={blurOnEnter}>
      </label>
    {/if}
    {#if part.type === "fieldDevice"}
      <label>
        Description
        <input type="text" class="wide" value={part.params?.description ?? ""}
               onchange={(e) => ondeviceparam("description", e.currentTarget.value.trim())} onkeydown={blurOnEnter}>
      </label>
    {/if}
    {#if part.type === "relayCoil"}
      <label>
        Note
        <input type="text" class="wide" value={part.params?.note ?? ""}
               onchange={(e) => ondeviceparam("note", e.currentTarget.value.trim())} onkeydown={blurOnEnter}>
      </label>
    {/if}
  {/if}
  {#if onvariables}
    <button type="button" onclick={onvariables}>Variables…</button>
  {/if}
{/snippet}

{#snippet actionsGroup()}
  {#if fittings?.flippable}
    <button type="button" class="icon" aria-label="Flip" title="Flip · mirror the element on its pipe" onclick={onfittingflip}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M8 1.5 V14.5" stroke-dasharray="1.6 1.6"/><path d="M6 4 L2 12 H6 Z"/><path d="M10 4 L14 12 H10 Z" fill="currentColor"/>
      </svg>
    </button>
  {/if}
  {#if fittings?.turnable}
    <button type="button" class="icon" aria-label="Turn 90°" title="Turn 90° · swap which pipe runs straight through the valve" onclick={onfittingturn}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M13 8 A5 5 0 1 1 8 3 H11"/><path d="M9.5 1 L11.5 3 L9.5 5"/>
      </svg>
    </button>
  {/if}
  {#if fittings?.sized && fittings.moved}
    <button type="button" class="icon" aria-label="Auto position" title="Auto position · put the value boxes back in their default place" onclick={onreadoutreset}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="2" y="5" width="7" height="6" rx="1"/><path d="M12 2 V5 M10.5 3.5 H13.5 M13 9 V12 M11.5 10.5 H14.5"/>
      </svg>
    </button>
  {/if}
  {#if plainElements}
    <button type="button" class="icon" aria-label="Reset size" title="Reset size · back to the default size of this element" onclick={onresetsize}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M2 6 V2 H6 M14 10 V14 H10"/><path d="M2 2 L6.5 6.5 M14 14 L9.5 9.5"/>
      </svg>
    </button>
  {/if}
  {#if pipes}
    <button type="button" class="icon" aria-label="Reverse flow" title="Reverse flow (F)" onclick={onreverse}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M2 5 H13 M10 2 L13 5 L10 8"/><path d="M14 11 H3 M6 8 L3 11 L6 14"/>
      </svg>
    </button>
  {/if}
  {#if texts?.alone}
    <button type="button" class="icon" aria-label="Edit text" title="Edit text" onclick={onedittext}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M10.5 2.5 L13.5 5.5 L5.5 13.5 H2.5 V10.5 Z"/><path d="M9 4 L12 7"/>
      </svg>
    </button>
  {/if}
  {#if network}
    <NetworkActions {network} {onconnect} {onadddevices}/>
  {/if}
{/snippet}

{#snippet groupContent(id)}
  {#if id === "identity"}{@render identityGroup()}
  {:else if id === "geometry"}{@render geometryGroup()}
  {:else if id === "display"}{@render displayGroup()}
  {:else if id === "data"}{@render dataGroup()}
  {:else}{@render actionsGroup()}
  {/if}
{/snippet}

<div class="bar" bind:clientWidth={barWidth}>
  <div class="group type" bind:offsetWidth={typeWidth}>{typeName}</div>
  {#each order as id, index (id)}
    <div class="slot" class:overflowed={index >= visible} aria-hidden={index >= visible ? "true" : undefined}
         bind:offsetWidth={widths[id]} inert={index >= visible}>
      <div class="group">{@render groupContent(id)}</div>
    </div>
  {/each}
  <div class="tail">
    {#if hidden.length}
      <div class="more" bind:this={moreRoot}>
        <button type="button" class:active={moreOpen} aria-haspopup="true" aria-expanded={moreOpen} onclick={() => moreOpen = !moreOpen}>More ▾</button>
        {#if moreOpen}
          <div class="more-menu" role="group" aria-label="More properties">
            {#each hidden as id (id)}
              <div class="group">{@render groupContent(id)}</div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
    <button type="button" class="delete" aria-label="Delete" title="Delete (Del)" onclick={ondelete}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M2.5 4 H13.5 M6 4 V2.5 H10 V4 M4 4 L4.8 13.5 H11.2 L12 4 M6.8 6.5 V11 M9.2 6.5 V11"/>
      </svg>
    </button>
  </div>
</div>
