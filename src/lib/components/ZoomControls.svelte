<script>
  import { MIN_ZOOM, MAX_ZOOM } from "$lib/canvas/coords.js";

  let { viewport, onfit } = $props();

  const STEP = 1.25;

  let percent = $derived(Math.round(viewport.zoom * 100));
</script>

<style>
  .zoom-controls {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 1px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
  }

  button {
    height: 24px;
    min-width: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    border: none;
    border-radius: 6px;
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
    min-width: 44px;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: #0f172a;
    font-variant-numeric: tabular-nums;
  }

  .sep {
    width: 1px;
    height: 18px;
    margin: 0 4px;
    background: #e2e8f0;
  }

  svg {
    width: 16px;
    height: 16px;
  }
</style>

<div class="zoom-controls" role="toolbar" aria-label="Zoom">
  <button type="button" title="Zoom out" aria-label="Zoom out"
          disabled={viewport.zoom <= MIN_ZOOM} onclick={() => viewport.zoomBy(1 / STEP)}>
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
      <path d="M3 8 H13"/>
    </svg>
  </button>
  <span class="level" aria-live="polite">{percent}%</span>
  <button type="button" title="Zoom in" aria-label="Zoom in"
          disabled={viewport.zoom >= MAX_ZOOM} onclick={() => viewport.zoomBy(STEP)}>
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
      <path d="M3 8 H13 M8 3 V13"/>
    </svg>
  </button>
  <span class="sep" aria-hidden="true"></span>
  <button type="button" title="Reset to 100% (Shift+0)" onclick={() => viewport.resetZoom()}>100%</button>
  <button type="button" title="Fit to display (Shift+1)" aria-label="Fit to display" onclick={onfit}>
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M2 5.5 V2 H5.5 M10.5 2 H14 V5.5 M14 10.5 V14 H10.5 M5.5 14 H2 V10.5"/>
      <rect x="5.5" y="5.5" width="5" height="5" rx="0.5"/>
    </svg>
  </button>
</div>
