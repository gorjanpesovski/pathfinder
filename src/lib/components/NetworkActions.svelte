<script>
  import { HYDRONIC_ELEMENTS, mediaFor, DEFAULT_PROTOCOL } from "$lib/hydronic/elements.js";
  import { TOPOLOGIES } from "$lib/hydronic/network.js";
  import { portal } from "$lib/actions/portal.js";

  let { network, onconnect, onadddevices } = $props();

  const PROTOCOLS = mediaFor("network");
  const DEVICE_TYPES = ["rtuDevice", "ipDevice"];

  let menu = $state(null);
  let topology = $state("bus");
  let medium = $state(DEFAULT_PROTOCOL);
  let adding = $state({ type: "rtuDevice", count: 10, name: "JOY {n}", slave: 1, medium: "modbusRtu", topology: "daisy" });

  let centreLabel = $derived(network.centre ? network.centre.name || HYDRONIC_ELEMENTS[network.centre.type].label : "");

  function open(kind, event){
    const box = event.currentTarget.getBoundingClientRect();
    menu = menu?.kind === kind ? null : { kind, x: box.left, y: box.bottom + 4 };
  }

  function close(event){
    if (menu && !event.target.closest?.(".network-menu, .network-toggle")) menu = null;
  }

  function connect(){
    onconnect({ topology, medium });
    menu = null;
  }

  function add(){
    onadddevices({ ...adding, count: Math.max(1, Math.min(64, Math.round(adding.count) || 1)), slave: Math.max(0, Math.round(adding.slave) || 0) });
    menu = null;
  }

  function pickType(type){
    adding.type = type;
    adding.medium = type === "rtuDevice" ? "modbusRtu" : DEFAULT_PROTOCOL;
  }
</script>

<svelte:window onpointerdown={close} onkeydown={(event) => menu && event.key === "Escape" && (menu = null)}/>

<style>
  .network-toggle {
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

  .network-toggle:hover:not(:disabled) {
    background: #eff6ff;
    color: #1d4ed8;
  }

  .network-toggle:disabled {
    color: #cbd5e1;
    cursor: not-allowed;
  }

  .network-menu {
    position: fixed;
    z-index: 60;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 260px;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18);
    font-size: 12px;
    color: #334155;
  }

  .network-menu p {
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
</style>

{#snippet topologyPicker(value, onpick)}
  <div class="segmented" role="group" aria-label="Topology">
    {#each TOPOLOGIES as entry (entry.id)}
      <button type="button" class:active={value === entry.id} aria-pressed={value === entry.id} onclick={() => onpick(entry.id)}>{entry.label}</button>
    {/each}
  </div>
{/snippet}

<button type="button" class="network-toggle" disabled={!network.centre || !network.devices.length} onclick={(event) => open("connect", event)}
        title={network.centre ? `Connect the selected devices to ${centreLabel}` : "Select a router, switch or gateway and the devices to connect"}>Connect…</button>
{#if network.centre && !network.devices.length}
  <button type="button" class="network-toggle" onclick={(event) => open("add", event)}>Add devices…</button>
{/if}

{#if menu?.kind === "connect"}
  <div class="network-menu" role="dialog" aria-label="Connect devices" use:portal style="left: {menu.x}px; top: {menu.y}px">
    <p>Connect {network.devices.length} device{network.devices.length === 1 ? "" : "s"} to <strong>{centreLabel}</strong></p>
    {@render topologyPicker(topology, (id) => topology = id)}
    <label class="field">
      Protocol
      <select bind:value={medium}>
        {#each PROTOCOLS as entry (entry.id)}
          <option value={entry.id}>{entry.label}</option>
        {/each}
      </select>
    </label>
    <button type="button" class="go" onclick={connect}>Connect</button>
  </div>
{:else if menu?.kind === "add"}
  <div class="network-menu" role="dialog" aria-label="Add devices" use:portal style="left: {menu.x}px; top: {menu.y}px">
    <p>Add devices under <strong>{centreLabel}</strong></p>
    <label class="field">
      Type
      <select value={adding.type} onchange={(event) => pickType(event.currentTarget.value)}>
        {#each DEVICE_TYPES as type (type)}
          <option value={type}>{HYDRONIC_ELEMENTS[type].label}</option>
        {/each}
      </select>
    </label>
    <label class="field">
      How many
      <input type="number" min="1" max="64" bind:value={adding.count}>
    </label>
    <label class="field" title="{'{n}'} becomes 1, 2, 3 …">
      Names
      <input type="text" bind:value={adding.name}>
    </label>
    <label class="field">
      First slave ID
      <input type="number" min="0" max="255" bind:value={adding.slave}>
    </label>
    <label class="field">
      Protocol
      <select bind:value={adding.medium}>
        {#each PROTOCOLS as entry (entry.id)}
          <option value={entry.id}>{entry.label}</option>
        {/each}
      </select>
    </label>
    {@render topologyPicker(adding.topology, (id) => adding.topology = id)}
    <button type="button" class="go" onclick={add}>Add {Math.max(1, Math.round(adding.count) || 1)} devices</button>
  </div>
{/if}
