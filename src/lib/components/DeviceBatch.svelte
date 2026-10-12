<script>
  import { HYDRONIC_ELEMENTS, mediaFor, DEFAULT_PROTOCOL } from "$lib/hydronic/elements.js";
  import { TOPOLOGIES, ipAt } from "$lib/hydronic/network.js";
  import { parseSymbols } from "$lib/hydronic/symbols.js";

  let { centreLabel = null, onsubmit } = $props();

  const PROTOCOLS = mediaFor("network");
  const TYPES = centreLabel ? ["rtuDevice", "ipDevice"] : ["ipDevice", "rtuDevice", "gateway", "networkSwitch", "router"];

  let values = $state({ type: TYPES[0], count: 10, name: "JOY {n}", slave: 1, ip: "", medium: TYPES[0] === "rtuDevice" ? "modbusRtu" : DEFAULT_PROTOCOL, topology: "daisy" });
  let registerText = $state("");
  let registers = $derived(parseSymbols(registerText));

  let kind = $derived(HYDRONIC_ELEMENTS[values.type].device);
  let count = $derived(Math.max(1, Math.min(64, Math.round(values.count) || 1)));
  let lastIp = $derived(values.ip.trim() ? ipAt(values.ip.trim(), count - 1) : null);

  function pickType(type){
    values.type = type;
    values.medium = type === "rtuDevice" ? "modbusRtu" : DEFAULT_PROTOCOL;
  }

  function submit(){
    onsubmit({ ...$state.snapshot(values), count, slave: Math.max(0, Math.round(values.slave) || 0), ip: values.ip.trim(), symbols: kind === "rtu" || kind === "ip" ? registers.list : [] });
  }
</script>

<style>
  .batch {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 12px;
    color: #334155;
  }

  p {
    margin: 0;
    color: #64748b;
  }

  .field {
    display: grid;
    grid-template-columns: 90px 1fr;
    align-items: center;
    gap: 8px;
    font-weight: 600;
  }

  .field input,
  .field select {
    height: 26px;
    min-width: 0;
    padding: 2px 6px;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    font-family: inherit;
    font-size: 12px;
    box-sizing: border-box;
  }

  .note {
    margin-left: 98px;
    font-size: 11px;
    font-weight: 400;
    color: #94a3b8;
  }

  .registers summary {
    font-weight: 600;
    cursor: pointer;
  }

  .registers textarea {
    width: 100%;
    height: 120px;
    margin-top: 6px;
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    resize: vertical;
    box-sizing: border-box;
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: 11px;
  }

  .hint {
    display: block;
    margin-top: 4px;
    font-size: 11px;
    color: #94a3b8;
  }

  .segmented {
    display: flex;
    gap: 2px;
    padding: 2px;
    border-radius: 6px;
    background: #f1f5f9;
  }

  .segmented button {
    flex: 1;
    height: 24px;
    border: none;
    border-radius: 4px;
    background: transparent;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
  }

  .segmented button.active {
    background: #ffffff;
    color: #1d4ed8;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
  }

  .go {
    height: 28px;
    border: 1px solid #2563eb;
    border-radius: 6px;
    background: #2563eb;
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
    color: #ffffff;
    cursor: pointer;
  }

  .go:hover {
    background: #1d4ed8;
  }
</style>

<div class="batch">
  {#if centreLabel}
    <p>Add devices under <strong>{centreLabel}</strong> and connect them.</p>
  {:else}
    <p>Placed in a grid in the middle of the view. Select a router, switch or gateway first to add and connect devices under it.</p>
  {/if}
  <label class="field">
    Type
    <select value={values.type} onchange={(event) => pickType(event.currentTarget.value)}>
      {#each TYPES as type (type)}
        <option value={type}>{HYDRONIC_ELEMENTS[type].label}</option>
      {/each}
    </select>
  </label>
  <label class="field">
    How many
    <input type="number" min="1" max="64" bind:value={values.count}>
  </label>
  <label class="field">
    Names
    <input type="text" bind:value={values.name} spellcheck="false">
  </label>
  <span class="note">{"{n}"} becomes 1, 2, 3 …</span>
  {#if kind === "rtu" || kind === "ip"}
    <label class="field">
      First slave ID
      <input type="number" min="0" max="255" bind:value={values.slave}>
    </label>
  {/if}
  {#if kind === "ip" || kind === "gateway"}
    <label class="field">
      First IP
      <input type="text" bind:value={values.ip} placeholder="10.0.0.11" spellcheck="false">
    </label>
    {#if lastIp}<span class="note">Up to {lastIp}</span>{/if}
  {/if}
  {#if kind === "rtu" || kind === "ip"}
    <details class="registers">
      <summary>Registers{registers.list.length ? ` · ${registers.list.length}` : " (optional)"}</summary>
      <textarea bind:value={registerText} spellcheck="false" placeholder="sym-Cmd_Basic_Setpoint=HR20,"></textarea>
      <span class="hint">Copied to every new device. Paste a connect .Symbol list.{registers.invalid.length ? ` ${registers.invalid.length} line(s) not understood.` : ""}</span>
    </details>
  {/if}
  {#if centreLabel}
    <label class="field">
      Protocol
      <select bind:value={values.medium}>
        {#each PROTOCOLS as entry (entry.id)}
          <option value={entry.id}>{entry.label}</option>
        {/each}
      </select>
    </label>
    <div class="segmented" role="group" aria-label="Topology">
      {#each TOPOLOGIES as entry (entry.id)}
        <button type="button" class:active={values.topology === entry.id} aria-pressed={values.topology === entry.id}
                onclick={() => values.topology = entry.id}>{entry.label}</button>
      {/each}
    </div>
  {/if}
  <button type="button" class="go" onclick={submit}>Add {count} device{count === 1 ? "" : "s"}</button>
</div>
