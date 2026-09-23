<script>
  import FurnitureShape from "./FurnitureShape.svelte";
  import { FURNITURE, ELEMENT_GROUPS, newFurniture } from "$lib/tools/furniture.js";

  let { active = null, onpick, onclose, groups = ELEMENT_GROUPS, empty = "" } = $props();

  let group = $state("office");
  let activeGroup = $derived(groups.find((entry) => entry.id === group)?.id ?? groups[0]?.id);

  let elements = $derived(((groups.find((entry) => entry.id === group) ?? groups[0])?.items ?? []).map((type) => type === "door"
    ? { type, label: "Door" }
    : { type, label: FURNITURE[type].label, item: newFurniture(type, 0, 0, 0) }));

  function viewBox(item){
    const size = Math.max(item.width, item.height) + 12;
    return `${-size / 2} ${-size / 2} ${size} ${size}`;
  }
</script>

<style>
  .element-panel {
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    border-top: 1px solid #e2e8f0;
    background: #ffffff;
  }

  .tabs {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px 8px 0;
    border-bottom: 1px solid #f1f5f9;
    overflow-x: auto;
  }

  .tabs button {
    padding: 6px 10px;
    border: none;
    border-bottom: 2px solid transparent;
    background: none;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    white-space: nowrap;
    cursor: pointer;
  }

  .tabs button:hover {
    color: #1d4ed8;
  }

  .tabs button.current {
    border-bottom-color: #2563eb;
    color: #1d4ed8;
  }

  .tabs .close {
    margin-left: auto;
    padding: 4px 8px;
    font-size: 16px;
    line-height: 1;
    color: #94a3b8;
  }

  .tiles {
    display: flex;
    align-items: stretch;
    gap: 4px;
    padding: 6px 8px 8px;
    overflow-x: auto;
  }

  .tiles button {
    flex: 0 0 auto;
    width: 72px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 6px 2px 5px;
    border: 1px solid #e2e8f0;
    border-radius: 7px;
    background: #ffffff;
    font-family: inherit;
    font-size: 10.5px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  .tiles button:hover {
    border-color: #93c5fd;
    background: #eff6ff;
    color: #1d4ed8;
  }

  .tiles button.active {
    border-color: #2563eb;
    background: #eff6ff;
    color: #1d4ed8;
  }

  button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  svg {
    width: 32px;
    height: 32px;
  }

  .empty {
    padding: 14px 12px 16px;
    font-size: 12px;
    color: #64748b;
  }

  .tiles span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>

<div class="element-panel" role="region" aria-label="Elements">
  <div class="tabs" role="tablist">
    {#each groups as entry (entry.id)}
      <button type="button" role="tab" class:current={activeGroup === entry.id} aria-selected={activeGroup === entry.id}
              onclick={() => group = entry.id}>{entry.label}</button>
    {/each}
    <button type="button" class="close" aria-label="Close elements" title="Close elements" onclick={onclose}>×</button>
  </div>
  {#if groups.length === 0}
    <div class="empty">{empty}</div>
  {/if}
  <div class="tiles" role="toolbar" aria-label="{group} elements">
    {#each elements as element (element.type)}
      <button type="button" class:active={active === element.type} aria-pressed={active === element.type}
              title="Place {element.label.toLowerCase()} · R rotates, Shift keeps placing, Esc stops"
              onclick={() => onpick(element.type)}>
        {#if element.item}
          <svg viewBox={viewBox(element.item)} aria-hidden="true">
            <FurnitureShape item={element.item} width={Math.max(element.item.width, element.item.height) / 30}/>
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
            <path d="M3 20 H8 M16 20 H21"/>
            <path d="M8 20 V5"/>
            <path d="M8 5 A15 15 0 0 1 21 18" stroke-dasharray="2 2"/>
          </svg>
        {/if}
        <span>{element.label}</span>
      </button>
    {/each}
  </div>
</div>
