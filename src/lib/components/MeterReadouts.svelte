<script>
  import { portal } from "$lib/actions/portal.js";

  let { options, onchange } = $props();

  let menu = $state(null);
  let chosen = $derived(options.filter((option) => option.state !== "none").length);

  function toggle(event){
    const box = event.currentTarget.getBoundingClientRect();
    menu = menu ? null : { x: box.left, y: box.bottom + 4 };
  }

  function close(event){
    if (menu && !event.target.closest?.(".meter-menu, .meter-toggle")) menu = null;
  }

  function closeOnEscape(event){
    if (menu && event.key === "Escape") menu = null;
  }

  function mixed(node, value){
    node.indeterminate = value;
    return { update: (next) => node.indeterminate = next };
  }
</script>

<svelte:window onpointerdown={close} onkeydown={closeOnEscape}/>

<style>
  .meter-toggle {
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

  .meter-toggle:hover,
  .meter-toggle[aria-expanded="true"] {
    background: #eff6ff;
    color: #1d4ed8;
  }

  .count {
    min-width: 16px;
    padding: 0 4px;
    border-radius: 8px;
    background: #e2e8f0;
    font-size: 10px;
    line-height: 16px;
    text-align: center;
    color: #334155;
  }

  .caret {
    font-size: 9px;
    color: #64748b;
  }

  .meter-menu {
    position: fixed;
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 250px;
    padding: 10px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #ffffff;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.16);
    box-sizing: border-box;
    white-space: normal;
    font-size: 12px;
    color: #334155;
  }

  h3 {
    margin: 0 0 6px;
    font-family: 'Sora', 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #64748b;
  }

  label {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 28px;
    padding: 0 6px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
  }

  label:hover {
    background: #f8fafc;
  }

  label input {
    width: 15px;
    height: 15px;
    margin: 0;
    accent-color: #2563eb;
  }

  .unit {
    margin-left: auto;
    font-weight: 400;
    color: #94a3b8;
  }
</style>

<button type="button" class="meter-toggle" aria-haspopup="dialog" aria-expanded={!!menu} onclick={toggle}>
  Readouts <span class="count">{chosen}</span> <span class="caret" aria-hidden="true">▾</span>
</button>

{#if menu}
  <div class="meter-menu" role="dialog" aria-label="Meter readouts" use:portal style="left: {menu.x}px; top: {menu.y}px">
    <h3>Shown values</h3>
    {#each options as option (option.id)}
      <label>
        <input type="checkbox" checked={option.state === "all"} use:mixed={option.state === "mixed"} onchange={() => onchange(option.id)}>
        {option.name}
        <span class="unit">{option.unit}</span>
      </label>
    {/each}
  </div>
{/if}
