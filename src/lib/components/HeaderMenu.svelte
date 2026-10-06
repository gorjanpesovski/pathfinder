<script>
  import { portal } from "$lib/actions/portal.js";

  let { label, items, status = null, width = 270 } = $props();

  let trigger = $state(null);
  let menu = $state(null);

  function toggle(){
    const box = trigger.getBoundingClientRect();
    menu = menu ? null : { left: Math.min(box.left, window.innerWidth - width - 8), top: box.bottom + 6 };
  }

  function close(event){
    if (menu && !trigger.contains(event.target) && !event.target.closest?.(".header-menu")) menu = null;
  }

  function closeOnEscape(event){
    if (menu && event.key === "Escape") menu = null;
  }

  function run(item){
    menu = null;
    item.onclick();
  }
</script>

<svelte:window onpointerdown={close} onkeydown={closeOnEscape}/>

<style>
  .trigger {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 26px;
    padding: 0 8px;
    border: none;
    border-radius: 5px;
    background: none;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
  }

  .trigger:hover,
  .trigger[aria-expanded="true"] {
    background: #f1f5f9;
    color: #0f172a;
  }

  .trigger:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: -2px;
  }

  .caret {
    font-size: 9px;
    color: #94a3b8;
  }

  .header-menu {
    position: fixed;
    z-index: 70;
    display: flex;
    flex-direction: column;
    padding: 6px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #ffffff;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.16);
    font-family: 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    font-size: 12px;
    color: #334155;
    box-sizing: border-box;
  }

  .status {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 4px;
    padding: 6px 10px 8px;
    border-bottom: 1px solid #f1f5f9;
  }

  .status span {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #94a3b8;
  }

  .status strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
    color: #0f172a;
  }

  .status em {
    font-style: normal;
    color: #64748b;
  }

  .item,
  .toggle {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 1px 12px;
    padding: 7px 10px;
    border: none;
    border-radius: 6px;
    background: none;
    font-family: inherit;
    text-align: left;
    color: inherit;
    cursor: pointer;
  }

  .item:hover:not(:disabled),
  .toggle:hover {
    background: #f1f5f9;
  }

  .item:disabled {
    cursor: default;
    opacity: 0.45;
  }

  b {
    font-size: 12.5px;
    font-weight: 600;
    color: #0f172a;
  }

  kbd {
    font-family: inherit;
    font-size: 11px;
    color: #94a3b8;
  }

  small {
    grid-column: 1 / -1;
    font-size: 11px;
    color: #64748b;
  }

  hr {
    width: 100%;
    margin: 4px 0;
    border: none;
    border-top: 1px solid #f1f5f9;
  }

  .note {
    margin: 4px 4px 2px;
    padding: 8px 10px;
    border-radius: 6px;
    background: #fffbeb;
    font-size: 11px;
    line-height: 1.4;
    color: #92400e;
  }

  .switch {
    position: relative;
    width: 30px;
    height: 17px;
    margin: 0;
    border-radius: 999px;
    background: #cbd5e1;
    appearance: none;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .switch::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.25);
    transition: transform 0.15s ease;
  }

  .switch:checked {
    background: #2563eb;
  }

  .switch:checked::after {
    transform: translateX(13px);
  }
</style>

<button type="button" class="trigger" bind:this={trigger} aria-haspopup="menu" aria-expanded={!!menu} onclick={toggle}>
  {label}<span class="caret" aria-hidden="true">▾</span>
</button>

{#if menu}
  <div class="header-menu" role="menu" aria-label={label} use:portal style="left: {menu.left}px; top: {menu.top}px; width: {width}px">
    {#if status}
      <div class="status">
        <span>{status.label}</span>
        {#if status.value}
          <strong title={status.value}>{status.value}</strong>
        {:else}
          <em>{status.empty}</em>
        {/if}
      </div>
    {/if}
    {#each items.filter(Boolean) as item, index (index)}
      {#if item.separator}
        <hr>
      {:else if item.note}
        <p class="note">{item.note}</p>
      {:else if item.toggle}
        <label class="toggle">
          <b>{item.label}</b>
          <input type="checkbox" class="switch" role="switch" checked={item.checked} onchange={(e) => item.onchange(e.currentTarget.checked)}>
          {#if item.hint}<small>{item.hint}</small>{/if}
        </label>
      {:else}
        <button type="button" class="item" role="menuitem" disabled={item.disabled} title={item.title} onclick={() => run(item)}>
          <b>{item.label}</b>
          {#if item.shortcut}<kbd>{item.shortcut}</kbd>{/if}
          {#if item.hint}<small>{item.hint}</small>{/if}
        </button>
      {/if}
    {/each}
  </div>
{/if}
