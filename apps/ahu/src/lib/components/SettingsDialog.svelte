<script>
  import Modal from "./Modal.svelte";
  import { DEFAULT_ICON_LIBRARY, DEFAULT_ICON_NAMES, ICON_SLOTS } from "$lib/ahu/elements.js";

  let {
    iconLibrary = $bindable(),
    iconNames = $bindable(),
    displayWidth = $bindable(),
    displayHeight = $bindable(),
    onclose
  } = $props();

  let section = $state("general");

  const SECTIONS = [
    { label: "Options", items: [{ id: "general", label: "General" }] },
    { label: "atvise", items: [{ id: "icons", label: "Icons" }] }
  ];
</script>

<style>
  .settings {
    display: grid;
    grid-template-columns: 210px minmax(0, 1fr);
    width: 100%;
    height: min(640px, calc(100dvh - 140px));
  }

  .settings-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 14px 10px;
    overflow-y: auto;
    border-right: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 0 0 0 12px;
  }

  .settings-group {
    padding: 12px 10px 6px;
    font-size: 11.5px;
    font-weight: 600;
    color: #94a3b8;
  }

  .settings-group:first-child {
    padding-top: 2px;
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

  .settings-content {
    overflow-y: auto;
    padding: 22px 32px 32px;
  }

  .settings-content h3 {
    font-family: 'Sora', 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    color: #0f172a;
  }

  .settings-content h4 {
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

  .setting-control input[type="text"] {
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

  .setting-control input[type="text"]:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .setting-control input[type="number"],
  .setting-control select {
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

  .setting-control input[type="number"]:focus,
  .setting-control select:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .setting-control select {
    min-width: 160px;
  }

  .size-input {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    color: #64748b;
  }

  .size-input input {
    width: 88px;
  }

  input.text-input {
    width: 300px;
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: 12px;
  }

  input.text-input.short {
    width: 220px;
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
</style>

{#snippet settingRow(title, description, control)}
  <div class="setting">
    <div class="setting-text">
      <div class="setting-title">{title}</div>
      {#if description}<div class="setting-desc">{description}</div>{/if}
    </div>
    <div class="setting-control">{@render control()}</div>
  </div>
{/snippet}

{#snippet textRow(title, description, value, set, placeholder = "", short = false)}
  {#snippet control()}
    <input class="text-input" class:short type="text" aria-label={title} {value} {placeholder} spellcheck="false"
           onchange={(e) => set(e.currentTarget.value.trim())}>
  {/snippet}
  {@render settingRow(title, description, control)}
{/snippet}

<Modal title="Settings" width={980} flush {onclose}>
  <div class="settings">
    <nav class="settings-nav" aria-label="Settings sections">
      {#each SECTIONS as group (group.label)}
        <span class="settings-group">{group.label}</span>
        {#each group.items as item (item.id)}
          <button type="button" class:active={section === item.id} aria-current={section === item.id ? "page" : undefined}
                  onclick={() => section = item.id}>{item.label}</button>
        {/each}
      {/each}
    </nav>

    <div class="settings-content">
      {#if section === "general"}
        <h3>General</h3>
        <p class="settings-note">Saved in this browser.</p>
        <div class="settings-card">
          {#snippet sizeControl()}
            <div class="size-input">
              <input type="number" aria-label="Display width" min="400" step="10" value={displayWidth}
                     onchange={(e) => { const next = e.currentTarget.valueAsNumber; if (Number.isFinite(next) && next >= 400) displayWidth = next; }}>
              <span>×</span>
              <input type="number" aria-label="Display height" min="300" step="10" value={displayHeight}
                     onchange={(e) => { const next = e.currentTarget.valueAsNumber; if (Number.isFinite(next) && next >= 300) displayHeight = next; }}>
              <span>px</span>
            </div>
          {/snippet}
          {@render settingRow("Display size", "Width and height of the atvise display. The preview and the export use this size.", sizeControl)}
        </div>
        <h4>atvise paths</h4>
        <div class="settings-card">
          {@render textRow("Icon library", "atvise folder that holds the object displays the export references. The icon name is appended to it.", iconLibrary, (value) => iconLibrary = value || DEFAULT_ICON_LIBRARY, DEFAULT_ICON_LIBRARY)}
        </div>
      {:else if section === "icons"}
        <h3>Icons</h3>
        <p class="settings-note">Object display name inside the icon library. Leave a name empty to draw the icon straight into the display instead.</p>
        <div class="settings-card">
          {#each ICON_SLOTS as slot (slot.id)}
            {@render textRow(slot.name, "", iconNames[slot.id], (value) => iconNames = { ...iconNames, [slot.id]: value }, "drawn in the display", true)}
          {/each}
        </div>
        <h4>Defaults</h4>
        <div class="settings-card">
          {#snippet resetControl()}
            <button type="button" class="settings-button" onclick={() => iconNames = { ...DEFAULT_ICON_NAMES }}>Reset</button>
          {/snippet}
          {@render settingRow("Reset icon names", "Go back to the names in the 6. Ikone library.", resetControl)}
        </div>
      {/if}
    </div>
  </div>
</Modal>
