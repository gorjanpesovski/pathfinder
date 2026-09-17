<script>
  import { base } from "$app/paths";

  // The preview canvas coordinate system. Everything the page draws is
  // expressed in these units, so the SVG scales with the pane rather than
  // with the window.
  let displayWidth = $state(1280);
  let displayHeight = $state(720);
</script>

<style>
  :global(body) {
    height: 100dvh;
    width: 100vw;
    font-family: 'Segoe UI', Arial, sans-serif;
    margin: 0;
    padding: 24px;
    background-color: #f1f5f9;
    color: #0f172a;
    box-sizing: border-box;
    overflow: hidden;
  }

  .header{
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1800px;
    margin: 0 auto 20px auto;
  }

  .logo-section {
    display: flex;
    align-items: center;
    font-size: 20px;
    color: #1E293B;

    .subtitle{
        font-size: 12px;
        color: #475569;
        font-weight: 500;
    }
  }

  .logo{
    height: 50px;
    margin-right: 10px;
  }

  h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 16px 0;
    color: #334155;
  }

  /* Preview on the left, settings on the right. */
  .app-layout {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 24px;
    align-items: stretch;
    max-width: 1800px;
    height: calc(100dvh - 110px);
    margin: 0 auto;
  }

  .viewer-section {
    height: 100%;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    min-height: 0;
  }

  .svg-container {
    width: 100%;
    max-width: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    overflow: hidden;
  }

  svg.preview-svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  .selection-section {
    display: flex;
    height: 100%;
    flex-direction: column;
    gap: 16px;
    background: #ffffff;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    max-height: 100%;
    overflow-y: auto;
    box-sizing: border-box;
    min-height: 0;
  }

  fieldset {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #f8fafc;
    margin: 0;
  }

  legend {
    font-weight: 600;
    font-size: 13px;
    color: #334155;
    padding: 0 6px;
  }

  label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #334155;
    cursor: pointer;
  }

  label.sub-element {
    padding-left: 28px;
    color: #94a3b8;
    font-size: 12px;
  }

  label.sub-element select {
    padding: 4px 8px;
    height: 28px;
    font-size: 12px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    background-color: #f8fafc;
    color: #94a3b8;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    text-align: left;
    gap: 6px;
    font-weight: 600;
    font-size: 13px;
    color: #475569;
  }

  .input-group:has(input[type="range"]) {
    gap: 0;
  }

  .field-hint {
    font-weight: 400;
    font-size: 12px;
    color: #94a3b8;
  }

  .input-group input,
  .input-group select {
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 14px;
    background-color: #f8fafc;
    color: #0f172a;
  }

  .selection-section input[type="text"],
  .selection-section select {
    width: 100%;
    height: 38px;
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 14px;
    background-color: #FFFFFF;
    color: #0f172a;
    box-sizing: border-box;
    text-align: left;
  }

  input[type="range"] {
    /* Track and thumb sizes live here so the thumb offset below can be derived
       from them instead of being a hand-tuned magic number. No box-sizing is
       set on the pseudo-elements, so borders add to these values. */
    --track-height: 6px;
    --track-border: 1px;
    --thumb-size: 12px;
    --thumb-border: 2px;

    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 20px;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
  }

  /* Track — filled portion driven by --fill, set inline from the bound value */
  input[type="range"]::-webkit-slider-runnable-track {
    height: var(--track-height);
    border-radius: 999px;
    border: var(--track-border) solid #cbd5e1;
    background:
      linear-gradient(#2563eb, #2563eb) 0 / var(--fill, 50%) 100% no-repeat,
      #e2e8f0;
  }

  input[type="range"]::-moz-range-track {
    height: 6px;
    border-radius: 999px;
    border: 1px solid #cbd5e1;
    background: #e2e8f0;
  }

  input[type="range"]::-moz-range-progress {
    height: 6px;
    border-radius: 999px;
    background-color: #2563eb;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: var(--thumb-size);
    height: var(--thumb-size);
    /* Chrome offsets the thumb from the top of the track's border box, so centre
       it by half the difference between the two outer heights. Firefox centres
       ::-moz-range-thumb on its own and ignores this. */
    margin-top: calc(
      (var(--track-height) + 2 * var(--track-border)
        - var(--thumb-size) - 2 * var(--thumb-border)) / 2
    );
    border-radius: 50%;
    background-color: #ffffff;
    border: 2px solid #2563eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }

  input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #ffffff;
    border: 2px solid #2563eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }

  input[type="range"]:hover::-webkit-slider-thumb {
    background-color: #eff6ff;
    border-color: #1d4ed8;
  }

  input[type="range"]:hover::-moz-range-thumb {
    background-color: #eff6ff;
    border-color: #1d4ed8;
  }

  input[type="range"]:active::-webkit-slider-thumb {
    background-color: #2563eb;
    transform: scale(1.1);
  }

  input[type="range"]:active::-moz-range-thumb {
    background-color: #2563eb;
    transform: scale(1.1);
  }

  input[type="range"]:focus {
    outline: none;
  }

  input[type="range"]:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  input[type="range"]:focus-visible::-moz-range-thumb {
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #2563eb;
    cursor: pointer;
  }

  button.configure {
    padding: 12px 16px;
    background-color: #2563eb;
    color: #ffffff;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    margin-top: 8px;
    transition: background-color 0.15s ease;
  }

  button.configure:hover {
    background-color: #1d4ed8;
  }

  button.configure.copied {
    background-color: #16a34a;
  }
</style>

<title>Auto Settings</title>

<div class="header">
  <div class="logo-section">
    <img class="logo" src="{base}/logo.svg" alt="Auto Settings logo">
    <div class="title">
      <div class="title">Auto Settings</div>
      <div class="subtitle">Automatic Settings Generator</div>
    </div>
  </div>
</div>

<div class="app-layout">
  <div class="viewer-section">
    <h2>Live Preview</h2>
    <div class="svg-container">
      <svg class="preview-svg" viewBox="0 0 {displayWidth} {displayHeight}"></svg>
    </div>
  </div>

  <div class="selection-section"></div>
</div>
