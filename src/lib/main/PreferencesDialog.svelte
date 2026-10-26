<script>
  import Modal from "@pathfinder/core/components/Modal.svelte";
  import { PAPERS } from "@pathfinder/diagram/electric/sheet.js";
  import { preferences, setPreference, resetPreferences, titleLogo } from "./preferences.svelte.js";

  let { onclose } = $props();

  const SECTIONS = [
    { id: "title", label: "Title block" },
    { id: "files", label: "New files" },
    { id: "interface", label: "Interface" }
  ];
  const LOGO_LIMIT = 400 * 1024;

  let section = $state("title");
  let logoInput;
  let logoNote = $state("");

  function readLogo(event){
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (file.size > LOGO_LIMIT) {
      logoNote = "That logo is larger than 400 kB. Use a smaller file, an SVG ideally.";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const href = String(reader.result);
      const probe = new Image();
      probe.onload = () => {
        setPreference("logo", { href, width: probe.naturalWidth || 272, height: probe.naturalHeight || 102 });
        logoNote = href.startsWith("data:image/svg+xml") ? "" : "PNG and JPG logos show on screen and in print, but not in the DXF export. Use an SVG to have it there too.";
      };
      probe.onerror = () => logoNote = "That file could not be read as an image.";
      probe.src = href;
    };
    reader.readAsDataURL(file);
  }

  function resetAll(){
    if (window.confirm("Reset all preferences to their defaults?")) resetPreferences();
  }
</script>

{#snippet row(title, description, control)}
  <div class="setting">
    <div class="setting-text">
      <div class="setting-title">{title}</div>
      {#if description}<div class="setting-desc">{description}</div>{/if}
    </div>
    <div class="setting-control">{@render control()}</div>
  </div>
{/snippet}

{#snippet textRow(title, description, key, placeholder = "")}
  {#snippet control()}
    <input type="text" class="wide" aria-label={title} value={preferences[key]} {placeholder} spellcheck="false"
           onchange={(e) => setPreference(key, e.currentTarget.value.trim())}>
  {/snippet}
  {@render row(title, description, control)}
{/snippet}

{#snippet numberRow(title, description, key, min, max, unit = "")}
  {#snippet control()}
    <div class="number-input">
      <input type="number" aria-label={title} {min} {max} value={preferences[key]}
             onchange={(e) => { const next = e.currentTarget.valueAsNumber; if (Number.isFinite(next)) setPreference(key, Math.min(max, Math.max(min, next))); }}>
      {#if unit}<span>{unit}</span>{/if}
    </div>
  {/snippet}
  {@render row(title, description, control)}
{/snippet}

{#snippet toggleRow(title, description, key)}
  {#snippet control()}
    <label class="switch">
      <input type="checkbox" role="switch" aria-label={title} checked={preferences[key]} onchange={(e) => setPreference(key, e.currentTarget.checked)}>
      <span aria-hidden="true"></span>
    </label>
  {/snippet}
  {@render row(title, description, control)}
{/snippet}

{#snippet logoControl()}
  <div class="logo-control">
    <img src={titleLogo().href} alt="Title block logo">
    <div class="logo-buttons">
      <button type="button" class="settings-button" onclick={() => logoInput.click()}>Choose…</button>
      {#if preferences.logo}<button type="button" class="settings-button" onclick={() => { setPreference("logo", null); logoNote = ""; }}>Use T3 logo</button>{/if}
    </div>
    <input class="hidden" type="file" accept="image/svg+xml,image/png,image/jpeg" bind:this={logoInput} onchange={readLogo}>
  </div>
{/snippet}

{#snippet paperControl()}
  <select class="settings-select" aria-label="Paper size" value={preferences.paper} onchange={(e) => setPreference("paper", e.currentTarget.value)}>
    {#each Object.keys(PAPERS) as id (id)}<option value={id}>{id}</option>{/each}
  </select>
{/snippet}

<Modal title="Preferences" width={900} flush {onclose}>
  <div class="settings">
    <nav class="settings-nav" aria-label="Preference sections">
      {#each SECTIONS as entry (entry.id)}
        <button type="button" class:active={section === entry.id} aria-current={section === entry.id ? "page" : undefined}
                onclick={() => section = entry.id}>{entry.label}</button>
      {/each}
      <div class="spacer"></div>
      <button type="button" class="reset" onclick={resetAll}>Reset to defaults</button>
    </nav>

    <div class="settings-content">
      {#if section === "title"}
        <h3>Title block</h3>
        <p class="settings-note">Printed in the title block of every wiring diagram sheet, in the PDF and the DXF export.</p>
        <div class="settings-card">
          {@render textRow("Company", "Shown under the logo.", "company")}
          {@render row("Logo", logoNote || "SVG is best: it stays sharp and also appears in the DXF export.", logoControl)}
          {@render textRow("Drawing content", "The \"Vsebina načrta\" field.", "content")}
        </div>
      {:else if section === "files"}
        <h3>New files</h3>
        <p class="settings-note">What a new file starts with. Each file keeps its own settings once it exists, so changing these does not touch files you already have.</p>
        <div class="settings-card">
          {@render numberRow("Canvas width", "", "canvasWidth", 100, 7680, "px")}
          {@render numberRow("Canvas height", "", "canvasHeight", 100, 4320, "px")}
          {@render numberRow("Grid size", "Spacing of the grid that tools snap to.", "gridSize", 2, 200, "px")}
          {@render toggleRow("Snap to grid", "", "snapToGrid")}
          {@render row("Wiring paper size", "Sheet size of new wiring diagrams.", paperControl)}
        </div>
        <h4>Hydronic station and network exports</h4>
        <div class="settings-card">
          {@render textRow("atvise object folder", "Library path of the object displays that elements reference in the atvise export.", "library")}
          {@render textRow("Variable node path", "Written in front of each linked variable name.", "nodePrefix", "AGENT.OBJECTS.Toplotne_Postaje.Celica_1")}
          {@render textRow("pGD tag prefix", "Written in front of each variable name in the pGD export.", "pgdPrefix")}
          {@render textRow("pGD analog tag type", "Data type of the value fields in the pGD export.", "pgdFloat")}
        </div>
      {:else}
        <h3>Interface</h3>
        <p class="settings-note">Saved in this browser, for every app.</p>
        <div class="settings-card">
          {@render toggleRow("Tool hints", "Explain each tool and its shortcuts in the toolbar tooltips.", "toolHints")}
          {@render toggleRow("View bar on hover", "Keep the view bar hidden at the left edge until you hover it. Turn off to always show the icon rail.", "viewsOnHover")}
        </div>
      {/if}
    </div>
  </div>
</Modal>

<style>
  .settings {
    display: grid;
    grid-template-columns: 190px minmax(0, 1fr);
    width: 100%;
    height: min(600px, calc(100dvh - 140px));
  }

  .settings-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 14px 10px;
    border-right: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 0 0 0 12px;
  }

  .settings-nav button {
    height: 32px;
    padding: 0 10px;
    border: none;
    border-radius: 6px;
    background: none;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    text-align: left;
    color: #334155;
    cursor: pointer;
  }

  .settings-nav button:hover {
    background: #eef2f7;
  }

  .settings-nav button.active {
    background: #e2eaf6;
    color: #1d4ed8;
    font-weight: 600;
  }

  .settings-nav .reset {
    color: #64748b;
    font-size: 12px;
  }

  .spacer {
    flex: 1;
  }

  .settings-content {
    overflow-y: auto;
    padding: 22px 32px 32px;
  }

  h3 {
    margin: 0;
    font-family: 'Sora', 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    font-size: 17px;
    font-weight: 600;
    color: #0f172a;
  }

  h4 {
    margin: 26px 0 10px;
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
  }

  .settings-note {
    margin: 4px 0 16px;
    font-size: 12px;
    color: #94a3b8;
  }

  .settings-card {
    padding: 0 20px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #ffffff;
  }

  .setting {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 16px 0;
  }

  .setting + .setting {
    border-top: 1px solid #eef2f7;
  }

  .setting-text {
    flex: 1;
    min-width: 0;
  }

  .setting-title {
    font-size: 13.5px;
    font-weight: 500;
    color: #0f172a;
  }

  .setting-desc {
    margin-top: 3px;
    font-size: 12.5px;
    line-height: 1.45;
    color: #64748b;
  }

  .setting-control {
    display: flex;
    align-items: center;
    flex: none;
  }

  .setting-control input[type="text"],
  .setting-control input[type="number"] {
    height: 32px;
    padding: 0 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font-family: inherit;
    font-size: 13px;
    color: #0f172a;
    box-sizing: border-box;
  }

  .setting-control input:focus,
  .settings-select:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .setting-control input.wide {
    width: 280px;
  }

  .number-input {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    color: #64748b;
  }

  .number-input input {
    width: 88px;
  }

  .settings-select {
    height: 32px;
    padding: 0 8px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font-family: inherit;
    font-size: 13px;
    color: #334155;
  }

  .settings-button {
    height: 32px;
    padding: 0 14px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    color: #334155;
    cursor: pointer;
  }

  .settings-button:hover {
    background: #f1f5f9;
  }

  .logo-control {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .logo-control img {
    width: 110px;
    height: 42px;
    object-fit: contain;
    padding: 4px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #ffffff;
  }

  .logo-buttons {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .hidden {
    display: none;
  }

  .switch {
    position: relative;
    display: inline-flex;
    width: 40px;
    height: 22px;
    cursor: pointer;
  }

  .switch input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }

  .switch span {
    width: 100%;
    height: 100%;
    border-radius: 999px;
    background: #cbd5e1;
    transition: background-color 0.15s ease;
  }

  .switch span::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.25);
    transition: transform 0.15s ease;
  }

  .switch input:checked + span {
    background: #2563eb;
  }

  .switch input:checked + span::after {
    transform: translateX(18px);
  }

  .switch input:focus-visible + span {
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }
</style>
