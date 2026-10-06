<script>
  import { onDestroy } from "svelte";

  let { apps, current, onswitch, view = null, onview = () => {}, autohide = false } = $props();

  const OPEN_DELAY = 250;

  let open = $state(false);
  let timer = null;

  function enter(){
    clearTimeout(timer);
    if (!open) timer = setTimeout(() => open = true, OPEN_DELAY);
  }

  function leave(){
    clearTimeout(timer);
    open = false;
  }

  function escape(event){
    if (event.key === "Escape" && open) leave();
  }

  function pick(id){
    onswitch(id);
  }

  onDestroy(() => clearTimeout(timer));
</script>

<svelte:window onkeydown={escape}/>

<style>
  .activity-dock {
    grid-area: activity;
    position: relative;
    z-index: 11;
    min-height: 0;
  }

  .activity-bar {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 40px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    padding: 8px 4px;
    overflow: hidden;
    background: #f1f5f9;
    border-right: 1px solid #e2e8f0;
    box-sizing: border-box;
    transition: width 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease;
  }

  .autohide .activity-bar {
    transform: translateX(-34px);
  }

  .autohide .activity-bar > * {
    opacity: 0;
    transition: opacity 0.1s ease;
  }

  .open .activity-bar {
    width: 210px;
    transform: none;
    box-shadow: 6px 0 18px rgba(15, 23, 42, 0.12);
  }

  .open .activity-bar > * {
    opacity: 1;
  }

  button {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    flex: none;
    height: 32px;
    padding: 0 7px;
    border: none;
    border-radius: 7px;
    background: transparent;
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 600;
    color: #64748b;
    white-space: nowrap;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  button:hover {
    background: #e2e8f0;
    color: #0f172a;
  }

  button.current {
    background: #ffffff;
    color: #1d4ed8;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
  }

  button.current::before {
    content: "";
    position: absolute;
    left: -4px;
    top: 7px;
    bottom: 7px;
    width: 3px;
    border-radius: 0 2px 2px 0;
    background: #2563eb;
  }

  button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  svg {
    flex: none;
    width: 18px;
    height: 18px;
  }

  .label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  kbd {
    font-family: inherit;
    font-size: 10.5px;
    font-weight: 500;
    color: #94a3b8;
  }

  .views {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0 0 4px;
  }

  .views button {
    height: 26px;
    padding-left: 9px;
    font-size: 12px;
    font-weight: 500;
  }

  .open .views button {
    padding-left: 35px;
  }

  .views button.on {
    background: #e2e8f0;
    color: #1d4ed8;
  }

  .views svg {
    width: 14px;
    height: 14px;
  }
</style>

<div class="activity-dock" class:autohide class:open role="presentation"
     onpointerenter={enter} onpointerleave={leave} onfocusin={() => open = true}
     onfocusout={(e) => !e.currentTarget.contains(e.relatedTarget) && leave()}>
  <nav class="activity-bar" aria-label="Views">
    {#each apps as entry, index (entry.id)}
      <button type="button" class:current={current === entry.id} aria-current={current === entry.id ? "page" : undefined}
              aria-label={entry.label} title="{entry.label} (Ctrl+{index + 1})" onclick={() => pick(entry.id)}>
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
        <kbd>Ctrl+{index + 1}</kbd>
      </button>
      {#if current === entry.id && entry.views}
        <div class="views" role="group" aria-label="{entry.label} views">
          {#each entry.views as option (option.id)}
            <button type="button" class:on={view === option.id} aria-pressed={view === option.id} aria-label={option.label}
                    title={option.label} onclick={() => onview(option.id)}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                {#if option.id === "io"}
                  <path d="M6 4 H14 M6 8 H14 M6 12 H14"/><circle cx="2.75" cy="4" r="0.9" fill="currentColor"/><circle cx="2.75" cy="8" r="0.9" fill="currentColor"/><circle cx="2.75" cy="12" r="0.9" fill="currentColor"/>
                {:else}
                  <path d="M10.5 2.5 L13.5 5.5 L5.5 13.5 H2.5 V10.5 Z"/><path d="M9 4 L12 7"/>
                {/if}
              </svg>
              <span class="label">{option.label}</span>
            </button>
          {/each}
        </div>
      {/if}
    {/each}
  </nav>
</div>
