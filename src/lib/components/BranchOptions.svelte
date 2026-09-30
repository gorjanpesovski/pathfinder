<script>
  import { BRANCH_LABELS, branchParams } from "$lib/hydronic/branch.js";
  import { portal } from "$lib/actions/portal.js";

  let { element, onchange } = $props();

  const SIDES = [
    { value: null, label: "None" },
    { value: "Supply Side", label: "Supply" },
    { value: "Return Side", label: "Return" }
  ];
  const TYPES = ["Heating", "Cooling", "Combined"];
  const VALVES = ["2-way", "3-way"];

  let menu = $state(null);
  let params = $derived(branchParams(element));
  let hasValve = $derived(params.energy_valve_config !== "No Valve");

  function toggle(event){
    const box = event.currentTarget.getBoundingClientRect();
    menu = menu ? null : { x: box.left, y: box.bottom + 4 };
  }

  function close(event){
    if (menu && !event.target.closest?.(".branch-menu, .branch-toggle")) menu = null;
  }

  function closeOnEscape(event){
    if (menu && event.key === "Escape") menu = null;
  }

  function sideValue(name, value){
    if (value !== null) return value;
    return name === "pump_config" ? "No Pump" : "No Valve";
  }

  function sideActive(name, option){
    const current = params[name];
    return option.value === null ? current === "No Pump" || current === "No Valve" : current === option.value;
  }
</script>

<svelte:window onpointerdown={close} onkeydown={closeOnEscape}/>

<style>
  .branch-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
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

  .branch-toggle:hover,
  .branch-toggle[aria-expanded="true"] {
    background: #eff6ff;
    color: #1d4ed8;
  }

  .caret {
    font-size: 9px;
    color: #64748b;
  }

  .branch-menu {
    position: fixed;
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 14px;
    width: 340px;
    max-height: min(620px, calc(100vh - 120px));
    overflow-y: auto;
    padding: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #ffffff;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.16);
    box-sizing: border-box;
    white-space: normal;
    font-size: 12px;
    color: #334155;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  section + section {
    padding-top: 14px;
    border-top: 1px solid #f1f5f9;
  }

  h3 {
    margin: 0;
    font-family: 'Sora', 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #64748b;
  }

  .row {
    display: grid;
    grid-template-columns: 118px 1fr;
    align-items: center;
    gap: 10px;
    min-height: 28px;
  }

  .row > span {
    font-weight: 600;
    color: #334155;
  }

  .nested {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-left: 12px;
    padding-left: 10px;
    border-left: 2px solid #e2e8f0;
  }

  .nested .row {
    grid-template-columns: 94px 1fr;
  }

  input[type="text"] {
    width: 100%;
    height: 28px;
    padding: 2px 8px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font-family: inherit;
    font-size: 12px;
    color: #0f172a;
    box-sizing: border-box;
  }

  input[type="text"]:focus-visible {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .segmented {
    display: flex;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    overflow: hidden;
  }

  .segmented button {
    flex: 1 1 0;
    height: 26px;
    padding: 0 6px;
    border: none;
    background: #ffffff;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
  }

  .segmented button + button {
    border-left: 1px solid #cbd5e1;
  }

  .segmented button:hover {
    background: #f8fafc;
  }

  .segmented button.active {
    background: #eff6ff;
    color: #1d4ed8;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 24px;
    font-weight: 600;
    cursor: pointer;
  }

  .check input {
    width: 15px;
    height: 15px;
    margin: 0;
    accent-color: #2563eb;
  }

  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
</style>

<button type="button" class="branch-toggle" aria-haspopup="dialog" aria-expanded={!!menu} onclick={toggle}>
  Branch settings <span class="caret" aria-hidden="true">▾</span>
</button>

{#if menu}
  <div class="branch-menu" role="dialog" aria-label="Branch settings" use:portal style="left: {menu.x}px; top: {menu.y}px">
    <section>
      <h3>Labels</h3>
      {#each BRANCH_LABELS as field (field.name)}
        <label class="row">
          <span>{field.label}</span>
          <input type="text" value={params[field.name]} onchange={(e) => onchange(field.name, e.currentTarget.value)}
                 onkeydown={(e) => e.key === "Enter" && e.currentTarget.blur()}>
        </label>
      {/each}
    </section>

    <section>
      <h3>Type</h3>
      <div class="segmented" role="group" aria-label="Branch type">
        {#each TYPES as type}
          <button type="button" class:active={params.branch_type === type} aria-pressed={params.branch_type === type}
                  onclick={() => onchange("branch_type", type)}>{type}</button>
        {/each}
      </div>
      {#if params.branch_type === "Combined"}
        <label class="row">
          <span>Mode node</span>
          <input type="text" value={params.cooling_heating_mode} placeholder="Node address"
                 onchange={(e) => onchange("cooling_heating_mode", e.currentTarget.value.trim())}
                 onkeydown={(e) => e.key === "Enter" && e.currentTarget.blur()}>
        </label>
      {/if}
    </section>

    <section>
      <h3>Temperature sensors</h3>
      <div class="pair">
        <label class="check">
          <input type="checkbox" checked={params.supply_side_temperature_sensor}
                 onchange={(e) => onchange("supply_side_temperature_sensor", e.currentTarget.checked)}>
          Supply
        </label>
        <label class="check">
          <input type="checkbox" checked={params.return_side_temperature_sensor}
                 onchange={(e) => onchange("return_side_temperature_sensor", e.currentTarget.checked)}>
          Return
        </label>
      </div>
    </section>

    <section>
      <h3>Equipment</h3>
      <div class="row">
        <span>Pump</span>
        <div class="segmented" role="group" aria-label="Pump">
          {#each SIDES as option}
            <button type="button" class:active={sideActive("pump_config", option)} aria-pressed={sideActive("pump_config", option)}
                    onclick={() => onchange("pump_config", sideValue("pump_config", option.value))}>{option.label}</button>
          {/each}
        </div>
      </div>
      <div class="row">
        <span>Valve</span>
        <div class="segmented" role="group" aria-label="Valve">
          {#each SIDES as option}
            <button type="button" class:active={sideActive("energy_valve_config", option)} aria-pressed={sideActive("energy_valve_config", option)}
                    onclick={() => onchange("energy_valve_config", sideValue("energy_valve_config", option.value))}>{option.label}</button>
          {/each}
        </div>
      </div>
      {#if hasValve}
        <div class="nested">
          <div class="row">
            <span>Valve type</span>
            <div class="segmented" role="group" aria-label="Valve type">
              {#each VALVES as type}
                <button type="button" class:active={params.valve_type === type} aria-pressed={params.valve_type === type}
                        onclick={() => onchange("valve_type", type)}>{type}</button>
              {/each}
            </div>
          </div>
          <label class="check">
            <input type="checkbox" checked={params.energy_metering} onchange={(e) => onchange("energy_metering", e.currentTarget.checked)}>
            Energy metering
          </label>
        </div>
      {/if}
      <label class="check">
        <input type="checkbox" checked={params.bypass} onchange={(e) => onchange("bypass", e.currentTarget.checked)}>
        Bypass with check valve
      </label>
    </section>
  </div>
{/if}
