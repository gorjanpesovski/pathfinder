<script>
  let { apps, current, onswitch, view = null, onview = () => {} } = $props();
</script>

<style>
  .app-switcher {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 3px;
    border-radius: 8px;
    background: #f1f5f9;
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 10px;
    border: none;
    border-radius: 6px;
    background: transparent;
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 600;
    color: #64748b;
    white-space: nowrap;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
  }

  button:hover {
    color: #1d4ed8;
  }

  .tab {
    display: inline-flex;
    align-items: center;
    border-radius: 6px;
  }

  .tab.current {
    background: #ffffff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
  }

  .tab.current > button {
    color: #1d4ed8;
  }

  .views {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-right: 3px;
    padding-left: 6px;
    border-left: 1px solid #e2e8f0;
  }

  .views button {
    height: 22px;
    padding: 0 8px;
    border-radius: 4px;
    font-size: 11.5px;
    color: #64748b;
  }

  .views button.on {
    background: #eff6ff;
    color: #1d4ed8;
  }

  button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  @media (max-width: 1100px) {
    .label {
      display: none;
    }
  }
</style>

<div class="app-switcher" role="tablist" aria-label="Drawing type">
  {#each apps as entry (entry.id)}
    <div class="tab" class:current={current === entry.id}>
      <button type="button" role="tab" aria-selected={current === entry.id}
              aria-label={entry.label} title="{entry.label} · {entry.description}" onclick={() => onswitch(entry.id)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          {#if entry.id === "floorplan"}
            <path d="M4 4 H20 V20 H4 Z"/>
            <path d="M12 4 V11 H20 M4 14 H9 V20"/>
          {:else if entry.id === "hydronic"}
            <circle cx="12" cy="12" r="5"/>
            <path d="M10 9.5 L15 12 L10 14.5 Z" fill="currentColor" stroke="none"/>
            <path d="M2 12 H7 M17 12 H22"/>
            <path d="M4 8 V16 M20 8 V16"/>
          {:else if entry.id === "electrical"}
            <rect x="3" y="3" width="18" height="6" rx="1"/>
            <path d="M7 9 V15 M12 9 V15 M17 9 V15"/>
            <circle cx="7" cy="17" r="2"/>
            <circle cx="12" cy="17" r="2"/>
            <circle cx="17" cy="17" r="2"/>
          {:else}
            <rect x="9" y="3" width="6" height="5" rx="1"/>
            <rect x="3" y="16" width="6" height="5" rx="1"/>
            <rect x="15" y="16" width="6" height="5" rx="1"/>
            <path d="M12 8 V12 M6 16 V12 H18 V16"/>
          {/if}
        </svg>
        <span class="label">{entry.label}</span>
      </button>
      {#if current === entry.id && entry.views}
        <div class="views" role="group" aria-label="{entry.label} views">
          {#each entry.views as option (option.id)}
            <button type="button" class:on={view === option.id} aria-pressed={view === option.id} onclick={() => onview(option.id)}>{option.label}</button>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>
