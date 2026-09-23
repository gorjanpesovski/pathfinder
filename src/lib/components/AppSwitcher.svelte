<script>
  let { apps, current, onswitch } = $props();
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

  button.current {
    background: #ffffff;
    color: #1d4ed8;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
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
    span {
      display: none;
    }
  }
</style>

<div class="app-switcher" role="tablist" aria-label="Drawing type">
  {#each apps as entry (entry.id)}
    <button type="button" role="tab" class:current={current === entry.id} aria-selected={current === entry.id}
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
        {:else}
          <rect x="9" y="3" width="6" height="5" rx="1"/>
          <rect x="3" y="16" width="6" height="5" rx="1"/>
          <rect x="15" y="16" width="6" height="5" rx="1"/>
          <path d="M12 8 V12 M6 16 V12 H18 V16"/>
        {/if}
      </svg>
      <span>{entry.label}</span>
    </button>
  {/each}
</div>
