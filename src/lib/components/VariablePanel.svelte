<script>
  import { onDestroy, tick } from "svelte";

  let { names, usage, dragging = null, selected = [], onmanage, onclose, ondrag, onfocus = () => {} } = $props();

  const FILTERS = [
    { id: "all", label: "All" },
    { id: "free", label: "Unlinked" },
    { id: "linked", label: "Linked" }
  ];

  const MIN_WIDTH = 200;
  const MAX_WIDTH = 640;
  const DEFAULT_WIDTH = 260;
  const WIDTH_KEY = "pathfinder.variablePanelWidth";

  let width = $state(storedWidth());

  function storedWidth(){
    try {
      const value = Number(localStorage.getItem(WIDTH_KEY));
      return value >= MIN_WIDTH && value <= MAX_WIDTH ? value : DEFAULT_WIDTH;
    } catch {
      return DEFAULT_WIDTH;
    }
  }

  function setWidth(value){
    width = Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value)));
    try {
      localStorage.setItem(WIDTH_KEY, String(width));
    } catch {}
  }

  function startResize(event){
    event.preventDefault();
    const handle = event.currentTarget;
    const startX = event.clientX;
    const startWidth = width;
    try {
      handle.setPointerCapture(event.pointerId);
    } catch {}
    const move = (next) => setWidth(startWidth + next.clientX - startX);
    const end = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", end);
      handle.removeEventListener("pointercancel", end);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  }

  let search = $state("");
  let hovered = $state(null);
  let list = $state(null);
  let picked = $derived(new Set(selected));

  $effect(() => {
    onfocus({ query: search.trim().toLowerCase(), hover: hovered });
  });

  $effect(() => {
    if (!picked.size || !list) return;
    tick().then(() => list?.querySelector("li.selected")?.scrollIntoView({ block: "nearest" }));
  });

  onDestroy(() => onfocus({ query: "", hover: null }));
  let filter = $state("all");
  let linked = $derived(names.filter((name) => usage.has(name)).length);
  let shown = $derived(names.filter((name) => {
    if (filter === "free" && usage.has(name)) return false;
    if (filter === "linked" && !usage.has(name)) return false;
    return name.toLowerCase().includes(search.trim().toLowerCase());
  }));

  function start(event, name){
    event.dataTransfer.setData("application/x-pathfinder-variable", name);
    event.dataTransfer.setData("text/plain", name);
    event.dataTransfer.effectAllowed = "link";
    ondrag(name);
  }
</script>

<style>
  .variable-panel {
    position: relative;
    grid-area: vars;
    width: 260px;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 12px 12px;
    background: #ffffff;
    border-right: 1px solid #e2e8f0;
    box-sizing: border-box;
    min-height: 0;
    font-size: 12px;
  }

  .resize {
    position: absolute;
    top: 0;
    right: -4px;
    bottom: 0;
    z-index: 2;
    width: 8px;
    cursor: col-resize;
    touch-action: none;
  }

  .resize::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 3px;
    width: 2px;
    background: transparent;
    transition: background-color 0.15s ease;
  }

  .resize:hover::after,
  .resize:focus-visible::after,
  .resize:active::after {
    background: #93c5fd;
  }

  .resize:focus-visible {
    outline: none;
  }

  .head {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  h2 {
    flex: 1;
    margin: 0;
    font-family: 'Sora', 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
  }

  .count {
    font-size: 11px;
    color: #64748b;
  }

  .icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    border-radius: 5px;
    background: none;
    color: #64748b;
    cursor: pointer;
  }

  .icon:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  .icon svg {
    width: 14px;
    height: 14px;
  }

  input[type="search"] {
    height: 30px;
    padding: 2px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font: inherit;
    font-size: 12px;
  }

  input[type="search"]:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .filters {
    display: flex;
    gap: 2px;
    padding: 2px;
    border-radius: 6px;
    background: #f1f5f9;
  }

  .filters button {
    flex: 1;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: none;
    font: inherit;
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
  }

  .filters button.active {
    background: #ffffff;
    color: #0f172a;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
  }

  ul {
    flex: 1;
    min-height: 0;
    margin: 0;
    padding: 0;
    overflow: auto;
    list-style: none;
  }

  li {
    display: grid;
    grid-template-columns: 7px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    padding: 5px 6px;
    border-radius: 5px;
    cursor: grab;
    user-select: none;
  }

  li:hover {
    background: #eff6ff;
  }

  li.dragging {
    background: #dbeafe;
  }

  li.selected {
    background: #dbeafe;
    box-shadow: inset 2px 0 0 #2563eb;
  }

  li.selected .name {
    color: #1d4ed8;
    font-weight: 600;
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: 11px;
    color: #0f172a;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #cbd5e1;
  }

  .dot.used {
    background: #16a34a;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 28px 8px;
    text-align: center;
    color: #94a3b8;
    cursor: default;
  }

  .empty:hover {
    background: none;
  }

  .hint {
    margin: 0;
    font-size: 11px;
    line-height: 1.4;
    color: #64748b;
  }

  button.plain {
    height: 30px;
    padding: 0 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
  }

  button.plain:hover {
    background: #f1f5f9;
  }
</style>

<aside class="variable-panel" aria-label="Variables" style:width="{width}px">
  <div class="head">
    <h2>Variables</h2>
    {#if names.length}<span class="count">{linked}/{names.length} linked</span>{/if}
    <button type="button" class="icon" title="Add names, node path" aria-label="Manage variables" onclick={onmanage}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
        <path d="M8 3 V13 M3 8 H13"/>
      </svg>
    </button>
    <button type="button" class="icon" title="Hide variables" aria-label="Hide variables" onclick={onclose}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
        <path d="M4 4 L12 12 M12 4 L4 12"/>
      </svg>
    </button>
  </div>

  {#if names.length}
    <input type="search" placeholder="Search" bind:value={search}>
    <div class="filters" role="group" aria-label="Show">
      {#each FILTERS as entry (entry.id)}
        <button type="button" class:active={filter === entry.id} aria-pressed={filter === entry.id} onclick={() => filter = entry.id}>{entry.label}</button>
      {/each}
    </div>
  {/if}

  <ul bind:this={list}>
    {#each shown as name (name)}
      <li draggable="true" class:dragging={dragging === name} class:selected={picked.has(name)}
          onpointerenter={() => hovered = name} onpointerleave={() => hovered === name && (hovered = null)}
          ondragstart={(e) => start(e, name)} ondragend={() => ondrag(null)}>
        <span class="dot" class:used={usage.has(name)} aria-hidden="true"></span>
        <span class="name">{name}</span>
      </li>
    {:else}
      <li class="empty">
        {#if names.length}
          No match
        {:else}
          <p class="hint">No variable names yet. Paste them from the c.strategy ModbusSlave table.</p>
          <button type="button" class="plain" onclick={onmanage}>Add names…</button>
        {/if}
      </li>
    {/each}
  </ul>

  <div class="resize" role="separator" aria-orientation="vertical" aria-label="Resize variables panel" aria-valuenow={width}
       aria-valuemin={MIN_WIDTH} aria-valuemax={MAX_WIDTH} tabindex="0"
       onpointerdown={startResize} ondblclick={() => setWidth(DEFAULT_WIDTH)}
       onkeydown={(e) => { if (e.key === "ArrowLeft") setWidth(width - 20); if (e.key === "ArrowRight") setWidth(width + 20); }}></div>
</aside>
