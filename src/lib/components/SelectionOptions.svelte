<script>
  import { READOUT_MODES } from "$lib/hydronic/elements.js";
  import { TANK_PROBES } from "$lib/hydronic/tank.js";
  import MediumPicker from "./MediumPicker.svelte";
  import BranchOptions from "./BranchOptions.svelte";

  let {
    groups,
    keepRatio = $bindable(true),
    onelementsize,
    onelementrotate,
    onresetsize,
    onnamesize,
    ontankprobe,
    onbranchparam,
    onmedium,
    onpipewidth,
    onreverse,
    onpipelayer,
    onfittingreadout,
    onreadoutreset,
    onfittingflip,
    onfittingscale,
    onfittingremove,
    onfittingnamesize,
    onedittext,
    ontextstyle
  } = $props();

  let elements = $derived(groups.elements);
  let pipes = $derived(groups.pipes);
  let fittings = $derived(groups.fittings);
  let texts = $derived(groups.texts);

  function readNumber(event, min, max){
    const value = Number(event.currentTarget.value);
    if (event.currentTarget.value === "" || !Number.isFinite(value)) return null;
    return Math.min(max, Math.max(min, Math.round(value)));
  }

  function readSize(event){
    const value = Number(event.currentTarget.value);
    return event.currentTarget.value === "" || !Number.isFinite(value) ? null : Math.min(4000, Math.max(4, Math.round(value * 10) / 10));
  }

  function blurOnEnter(event){
    if (event.key === "Enter") event.currentTarget.blur();
  }

  function probeState(value){
    return value === "all" ? "true" : value === "mixed" ? "mixed" : "false";
  }
</script>

<style>
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

  input[type="number"] {
    width: 58px;
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

  input[type="range"] {
    width: 120px;
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

  .unit {
    font-weight: 400;
    color: #94a3b8;
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

  button:hover {
    background: #eff6ff;
    color: #1d4ed8;
  }

  button.active {
    background: #eff6ff;
    color: #1d4ed8;
    border-color: #93c5fd;
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

  .segmented button.active {
    background: #eff6ff;
    color: #1d4ed8;
  }

  .segmented button.mixed {
    background: repeating-linear-gradient(135deg, #eff6ff 0 4px, #ffffff 4px 8px);
    color: #1d4ed8;
  }

  .link {
    width: 26px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
</style>

{#if elements}
  <span>{elements.count === 1 ? elements.label : `${elements.count} elements`}</span>
  <label>
    W
    <input type="number" min="4" step="1" value={elements.width ?? ""} placeholder="–"
           onchange={(e) => { const next = readSize(e); if (next !== null) onelementsize("width", next, keepRatio); }}
           onkeydown={blurOnEnter}>
  </label>
  <button type="button" class="link" class:active={keepRatio} aria-pressed={keepRatio} aria-label="Keep proportions"
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
    <input type="number" min="4" step="1" value={elements.height ?? ""} placeholder="–"
           onchange={(e) => { const next = readSize(e); if (next !== null) onelementsize("height", next, keepRatio); }}
           onkeydown={blurOnEnter}>
  </label>
  {#if elements.labelled}
    <label>
      Name size
      <input type="number" min="6" max="72" step="1" value={elements.nameSize ?? ""} placeholder="–"
             onchange={(e) => { const next = readNumber(e, 6, 72); if (next !== null) onnamesize(next); }}
             onkeydown={blurOnEnter}>
    </label>
  {/if}
  {#if elements.tanks}
    <span>Probes</span>
    <div class="segmented" role="group" aria-label="Temperature probes in the tank">
      {#each TANK_PROBES as probe (probe.id)}
        <button type="button" class:active={elements.tanks[probe.id] === "all"} class:mixed={elements.tanks[probe.id] === "mixed"}
                aria-pressed={probeState(elements.tanks[probe.id])} onclick={() => ontankprobe(probe.id)}>{probe.label}</button>
      {/each}
    </div>
  {/if}
  {#if elements.bars && !pipes}
    <MediumPicker value={elements.barMedium} onchange={onmedium}/>
  {/if}
  {#if elements.branch}
    <BranchOptions element={elements.branch} onchange={onbranchparam}/>
  {/if}
  <button type="button" onclick={onelementrotate}>Rotate 90°</button>
  <button type="button" onclick={onresetsize}>Reset size</button>
{/if}

{#if pipes}
  {#if elements}
    <span class="sep" aria-hidden="true"></span>
  {/if}
  <span>{pipes.count === 1 ? "Pipe" : `${pipes.count} pipes`}</span>
  <MediumPicker value={pipes.medium} onchange={onmedium}/>
  <label>
    Width
    <input type="number" min="1" max="40" step="1" value={pipes.width ?? ""} placeholder="–"
           oninput={(e) => { const next = readNumber(e, 1, 40); if (next !== null) onpipewidth(next); }}>
  </label>
  <button type="button" onclick={onreverse}>Reverse flow</button>
  <div class="segmented" role="group" aria-label="Crossing order">
    <button type="button" onclick={() => onpipelayer(false)}>Below</button>
    <button type="button" onclick={() => onpipelayer(true)}>Above</button>
  </div>
{/if}

{#if fittings}
  {#if elements || pipes}
    <span class="sep" aria-hidden="true"></span>
  {/if}
  <span>{fittings.count === 1 ? fittings.label : `${fittings.count} on pipes`}</span>
  {#if fittings.measured}
    <div class="segmented" role="group" aria-label="Readout">
      {#each READOUT_MODES as mode (mode.id)}
        <button type="button" class:active={fittings.readout === mode.id} aria-pressed={fittings.readout === mode.id}
                onclick={() => onfittingreadout(mode.id)}>{mode.id === "value" ? fittings.measure ?? mode.label : mode.label}</button>
      {/each}
    </div>
    {#if fittings.moved}
      <button type="button" onclick={onreadoutreset}>Auto position</button>
    {/if}
  {/if}
  {#if fittings.flippable}
    <button type="button" onclick={onfittingflip}>Flip</button>
  {/if}
  <label>
    Size
    <input type="range" min="10" max="200" step="5" value={Math.round(fittings.shownScale * 100)}
           oninput={(e) => onfittingscale(Number(e.currentTarget.value) / 100)}>
    <span class="unit">{fittings.scale === null ? "mixed" : `${Math.round(fittings.scale * 100)}%`}</span>
  </label>
  <label>
    Name size
    <input type="number" min="6" max="72" step="1" value={fittings.nameSize ?? ""} placeholder="–"
           onchange={(e) => { const next = readNumber(e, 6, 72); if (next !== null) onfittingnamesize(next); }}
           onkeydown={blurOnEnter}>
  </label>
  <button type="button" onclick={onfittingremove}>Remove</button>
{/if}

{#if texts}
  {#if elements || pipes || fittings}
    <span class="sep" aria-hidden="true"></span>
  {/if}
  <span>{texts.count === 1 ? "Text" : `${texts.count} texts`}</span>
  {#if texts.alone}
    <button type="button" onclick={onedittext}>Edit text</button>
  {/if}
  <label>
    Size
    <input type="number" min="6" max="200" step="1" value={texts.fontSize ?? ""} placeholder="–"
           oninput={(e) => { const next = readNumber(e, 6, 200); if (next !== null) ontextstyle("fontSize", next); }}>
  </label>
  <label>
    Color
    <input type="color" value={texts.color} oninput={(e) => ontextstyle("color", e.currentTarget.value.toUpperCase())}>
  </label>
  <button type="button" class:active={texts.bold} aria-pressed={texts.bold} aria-label="Bold"
          onclick={() => ontextstyle("bold", !texts.bold)}><b>B</b></button>
{/if}
