<script>
  import { portal } from "$lib/actions/portal.js";
  import { ALIGN_ACTIONS, DISTRIBUTE_ACTIONS } from "$lib/tools/align.js";

  let { x, y, context, onorder, onalign, ondistribute, onrotate, onflip, ongroup, onungroup, onlock, onclose } = $props();

  const ORDER = [
    { id: "forward", label: "Bring forward", keys: "Ctrl+F" },
    { id: "backward", label: "Send backward", keys: "Ctrl+B" },
    { id: "front", label: "Bring to front", keys: "Ctrl+Shift+F" },
    { id: "back", label: "Send to back", keys: "Ctrl+Shift+B" }
  ];

  let menu = $state(null);
  let left = $derived(menu ? Math.max(8, Math.min(x, window.innerWidth - menu.offsetWidth - 8)) : x);
  let top = $derived(menu ? Math.max(8, Math.min(y, window.innerHeight - menu.offsetHeight - 8)) : y);
  let shapes = $derived(context.mode === "shapes");
  let movable = $derived(context.mode !== "fittings");

  function outside(event){
    if (!menu?.contains(event.target)) onclose();
  }

  function run(action){
    action();
    onclose();
  }
</script>

<svelte:window onpointerdown={outside} onkeydown={(e) => e.key === "Escape" && onclose()} onblur={onclose}/>

<style>
  .arrange-menu {
    position: fixed;
    z-index: 60;
    display: flex;
    flex-direction: column;
    min-width: 230px;
    padding: 4px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
  }

  .heading {
    padding: 6px 10px 4px;
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
  }

  .icons {
    display: flex;
    gap: 1px;
    padding: 0 6px 4px;
  }

  .icons button {
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    border-radius: 5px;
    background: none;
    color: #475569;
    cursor: pointer;
  }

  .icons .gap {
    width: 1px;
    margin: 4px 4px;
    background: #e2e8f0;
  }

  .item {
    display: grid;
    grid-template-columns: 18px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    height: 30px;
    padding: 0 10px;
    border: none;
    border-radius: 5px;
    background: none;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    text-align: left;
    color: #334155;
    cursor: pointer;
  }

  .item svg,
  .icons svg {
    width: 16px;
    height: 16px;
    color: #475569;
  }

  .item:hover:not(:disabled),
  .icons button:hover:not(:disabled) {
    background: #f1f5f9;
  }

  button:disabled {
    color: #cbd5e1;
    cursor: default;
  }

  button:disabled svg {
    color: #cbd5e1;
  }

  kbd {
    font-family: inherit;
    font-size: 11px;
    font-weight: 500;
    color: #94a3b8;
  }

  .sep {
    height: 1px;
    margin: 4px 6px;
    background: #e2e8f0;
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
    {:else if id === "bottom"}
      <path d="M1.5 14 H14.5"/><rect x="3.5" y="3" width="3" height="9" rx="0.6"/><rect x="9.5" y="6.5" width="3" height="5.5" rx="0.6"/>
    {:else if id === "x"}
      <path d="M1.5 2 V14 M14.5 2 V14"/><rect x="6" y="4" width="4" height="8" rx="0.6"/>
    {:else}
      <path d="M2 1.5 H14 M2 14.5 H14"/><rect x="4" y="6" width="8" height="4" rx="0.6"/>
    {/if}
  </svg>
{/snippet}

{#snippet menuIcon(id)}
  {#if id === "forward" || id === "front" || id === "backward" || id === "back"}
    <svg viewBox="0 0 18 18" aria-hidden="true">
      {#if id === "forward" || id === "front"}
        <rect x="1.5" y="1.5" width="10" height="10" rx="1.5" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2"/>
        {#if id === "front"}<rect x="4" y="4" width="10" height="10" rx="1.5" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2"/>{/if}
        <rect x="6.5" y="6.5" width="10" height="10" rx="1.5" fill="#2563eb" stroke="#1d4ed8" stroke-width="1.2"/>
      {:else}
        <rect x="1.5" y="1.5" width="10" height="10" rx="1.5" fill="#2563eb" stroke="#1d4ed8" stroke-width="1.2"/>
        {#if id === "back"}<rect x="4" y="4" width="10" height="10" rx="1.5" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2"/>{/if}
        <rect x="6.5" y="6.5" width="10" height="10" rx="1.5" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2"/>
      {/if}
    </svg>
  {:else}
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      {#if id === "rotate"}
        <path d="M13 8 A5 5 0 1 1 8 3 H11"/><path d="M9.5 1 L11.5 3 L9.5 5"/>
      {:else if id === "flipX"}
        <path d="M8 1.5 V14.5" stroke-dasharray="1.6 1.6"/><path d="M6 4 L2 12 H6 Z"/><path d="M10 4 L14 12 H10 Z" fill="currentColor"/>
      {:else if id === "flipY"}
        <path d="M1.5 8 H14.5" stroke-dasharray="1.6 1.6"/><path d="M4 6 L12 2 V6 Z"/><path d="M4 10 L12 14 V10 Z" fill="currentColor"/>
      {:else if id === "group"}
        <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" stroke-dasharray="2 2"/>
        <rect x="4" y="4" width="4" height="4" rx="0.6"/><rect x="8.5" y="8.5" width="3.5" height="3.5" rx="0.6"/>
      {:else if id === "ungroup"}
        <rect x="1.5" y="1.5" width="6" height="6" rx="1"/><rect x="8.5" y="8.5" width="6" height="6" rx="1"/>
      {:else}
        <rect x="3" y="7" width="10" height="7" rx="1.2"/><path d="M5.5 7 V5 a2.5 2.5 0 0 1 5 0 V7"/>
      {/if}
    </svg>
  {/if}
{/snippet}

{#snippet item(label, keys, action, disabled, icon)}
  <button type="button" class="item" role="menuitem" {disabled} onclick={() => run(action)}>
    {@render menuIcon(icon)}
    <span>{label}</span>
    <kbd>{keys}</kbd>
  </button>
{/snippet}

<div class="arrange-menu" role="menu" aria-label="Arrange" bind:this={menu} use:portal style="left: {left}px; top: {top}px"
     oncontextmenu={(e) => e.preventDefault()}>
  <div class="heading">Align{context.alignTarget ? ` to ${context.alignTarget}` : ""}</div>
  <div class="icons" role="group" aria-label="Align and distribute">
    {#each ALIGN_ACTIONS as action (action.id)}
      <button type="button" role="menuitem" disabled={!context.canAlign} aria-label={action.label}
              title="{action.label} ({action.shortcut})" onclick={() => run(() => onalign(action.id))}>
        {@render alignIcon(action.id)}
      </button>
    {/each}
    <span class="gap" aria-hidden="true"></span>
    {#each DISTRIBUTE_ACTIONS as action (action.axis)}
      <button type="button" role="menuitem" disabled={!context.canDistribute} aria-label={action.label}
              title="{action.label} ({action.shortcut})" onclick={() => run(() => ondistribute(action.axis))}>
        {@render alignIcon(action.axis)}
      </button>
    {/each}
  </div>

  {#if movable}
    <div class="sep" role="separator"></div>
    {@render item("Rotate 90°", "", onrotate, false, "rotate")}
    {@render item("Flip horizontally", "Ctrl+Shift+M", () => onflip("x"), false, "flipX")}
    {@render item("Flip vertically", "Ctrl+M", () => onflip("y"), false, "flipY")}
  {/if}

  {#if shapes}
    <div class="sep" role="separator"></div>
    {@render item("Group", "Ctrl+G", ongroup, !context.canGroup, "group")}
    {@render item("Ungroup", "Ctrl+Shift+G", onungroup, !context.canUngroup, "ungroup")}
    {@render item("Lock", "Ctrl+Shift+L", onlock, false, "lock")}
  {/if}

  {#if movable}
    <div class="sep" role="separator"></div>
    {#each ORDER as entry (entry.id)}
      {@render item(entry.label, entry.keys, () => onorder(entry.id), false, entry.id)}
    {/each}
  {/if}
</div>
