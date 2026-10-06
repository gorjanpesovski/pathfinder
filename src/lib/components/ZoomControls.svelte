<script>
  import { MIN_ZOOM, MAX_ZOOM } from "$lib/canvas/coords.js";

  let { viewport, onfit, onselection = null } = $props();

  const STEP = 1.25;

  let percent = $derived(Math.round(viewport.zoom * 100));
  let menuOpen = $state(false);
  let root = $state(null);

  function outside(event){
    if (menuOpen && !root?.contains(event.target)) menuOpen = false;
  }

  function run(action){
    menuOpen = false;
    action();
  }
</script>

<svelte:window onpointerdown={outside} onkeydown={(e) => e.key === "Escape" && (menuOpen = false)}/>

<style>
  .zoom-controls {
    position: absolute;
    right: 12px;
    bottom: 12px;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 1px;
    padding: 2px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 7px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
  }

  button {
    height: 26px;
    min-width: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 0 6px;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: #475569;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  button:hover:not(:disabled) {
    background: #eff6ff;
    color: #1d4ed8;
  }

  button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  button:disabled {
    color: #cbd5e1;
    cursor: not-allowed;
  }

  .level {
    min-width: 58px;
    color: #0f172a;
    font-variant-numeric: tabular-nums;
  }

  .level.active {
    background: #eff6ff;
    color: #1d4ed8;
  }

  svg {
    width: 16px;
    height: 16px;
  }

  .level svg {
    width: 10px;
    height: 10px;
    color: #94a3b8;
  }

  .menu {
    position: absolute;
    right: 0;
    bottom: calc(100% + 6px);
    display: flex;
    flex-direction: column;
    min-width: 180px;
    padding: 4px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
  }

  .menu button {
    justify-content: space-between;
    height: 30px;
    padding: 0 10px;
    color: #334155;
  }

  .menu button:hover:not(:disabled) {
    background: #f1f5f9;
    color: #0f172a;
  }

  kbd {
    font-family: inherit;
    font-size: 11px;
    font-weight: 500;
    color: #94a3b8;
  }
</style>

<div class="zoom-controls" role="toolbar" aria-label="Zoom" bind:this={root}>
  <button type="button" title="Zoom out" aria-label="Zoom out"
          disabled={viewport.zoom <= MIN_ZOOM} onclick={() => viewport.zoomBy(1 / STEP)}>
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
      <path d="M3 8 H13"/>
    </svg>
  </button>
  <button type="button" class="level" class:active={menuOpen} aria-haspopup="menu" aria-expanded={menuOpen}
          title="Zoom options" onclick={() => menuOpen = !menuOpen}>
    <span aria-live="polite">{percent}%</span>
    <svg viewBox="0 0 10 10" fill="currentColor" aria-hidden="true"><path d="M2 3.5 H8 L5 7 Z"/></svg>
  </button>
  <button type="button" title="Zoom in" aria-label="Zoom in"
          disabled={viewport.zoom >= MAX_ZOOM} onclick={() => viewport.zoomBy(STEP)}>
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
      <path d="M3 8 H13 M8 3 V13"/>
    </svg>
  </button>
  <button type="button" title="Fit to page (Shift+1)" aria-label="Fit to page" onclick={onfit}>
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M2 5.5 V2 H5.5 M10.5 2 H14 V5.5 M14 10.5 V14 H10.5 M5.5 14 H2 V10.5"/>
      <rect x="5.5" y="5.5" width="5" height="5" rx="0.5"/>
    </svg>
  </button>

  {#if menuOpen}
    <div class="menu" role="menu" aria-label="Zoom">
      <button type="button" role="menuitem" onclick={() => run(() => viewport.resetZoom())}>100%<kbd>Shift+0</kbd></button>
      <button type="button" role="menuitem" onclick={() => run(onfit)}>Fit to page<kbd>Shift+1</kbd></button>
      <button type="button" role="menuitem" disabled={!onselection} onclick={() => run(onselection)}>Zoom to selection<kbd>Shift+2</kbd></button>
    </div>
  {/if}
</div>
