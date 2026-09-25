<script>
  import { BRANCH_LABELS, BRANCH_CONFIG, branchParams } from "$lib/hydronic/branch.js";
  import { portal } from "$lib/actions/portal.js";

  let { element, onchange } = $props();

  let menu = $state(null);
  let params = $derived(branchParams(element));

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

  .field input[type="text"],
  .field select {
    height: 26px;
    padding: 2px 6px;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    background: #ffffff;
    font-family: inherit;
    font-size: 12px;
    color: #0f172a;
  }

  .field input:focus-visible,
  .field select:focus-visible {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .field input[type="checkbox"] {
    width: 14px;
    height: 14px;
    margin: 0;
    accent-color: #2563eb;
  }

  .caret {
    font-size: 9px;
    color: #64748b;
  }

  .branch-menu {
    position: fixed;
    z-index: 50;
    width: 300px;
    max-height: min(560px, calc(100vh - 120px));
    overflow-y: auto;
    padding: 10px 12px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.14);
    white-space: normal;
    font-size: 12px;
    color: #334155;
  }

  h3 {
    margin: 8px 0 6px;
    font-family: 'Sora', 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: #0f172a;
  }

  h3:first-child {
    margin-top: 0;
  }

  .field {
    display: grid;
    grid-template-columns: 1fr 130px;
    align-items: center;
    gap: 8px;
    padding: 3px 0;
    font-weight: 500;
  }

  .field.check {
    grid-template-columns: 1fr auto;
    cursor: pointer;
  }

  .field.off {
    opacity: 0.45;
  }

  .field input[type="text"],
  .field select {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }
</style>

<button type="button" class="branch-toggle" aria-haspopup="dialog" aria-expanded={!!menu} onclick={toggle}>
  Branch settings <span class="caret" aria-hidden="true">▾</span>
</button>

{#if menu}
  <div class="branch-menu" role="dialog" aria-label="Branch settings" use:portal style="left: {menu.x}px; top: {menu.y}px">
    <h3>Labels</h3>
    {#each BRANCH_LABELS as field (field.name)}
      <label class="field">
        {field.label}
        <input type="text" value={params[field.name]} onchange={(e) => onchange(field.name, e.currentTarget.value)}
               onkeydown={(e) => e.key === "Enter" && e.currentTarget.blur()}>
      </label>
    {/each}

    <h3>Branch configuration</h3>
    {#each BRANCH_CONFIG as field (field.name)}
      {@const active = !field.when || field.when(params)}
      {#if field.type === "bool"}
        <label class="field check" class:off={!active}>
          {field.label}
          <input type="checkbox" checked={params[field.name]} disabled={!active}
                 onchange={(e) => onchange(field.name, e.currentTarget.checked)}>
        </label>
      {:else if field.type === "enum"}
        <label class="field" class:off={!active}>
          {field.label}
          <select value={params[field.name]} disabled={!active} onchange={(e) => onchange(field.name, e.currentTarget.value)}>
            {#each field.options as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        </label>
      {:else if active}
        <label class="field">
          {field.label}
          <input type="text" value={params[field.name]} placeholder="Node address"
                 onchange={(e) => onchange(field.name, e.currentTarget.value.trim())}
                 onkeydown={(e) => e.key === "Enter" && e.currentTarget.blur()}>
        </label>
      {/if}
    {/each}
  </div>
{/if}
