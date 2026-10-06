<script>
  import { portal } from "$lib/actions/portal.js";

  let { pages, active, onselect, onadd, onrename, ondelete, version = "", build = "", position = "" } = $props();

  let editing = $state(null);
  let menu = $state(null);

  function openMenu(event, page){
    event.preventDefault();
    menu = { page, x: event.clientX, y: event.clientY };
  }

  function menuAt(event, extra){
    const box = event.currentTarget.getBoundingClientRect();
    menu = { x: box.left, y: box.top, ...extra };
  }

  function closeMenu(event){
    if (menu && !event.target.closest?.(".page-menu")) menu = null;
  }

  function closeOnEscape(event){
    if (menu && event.key === "Escape") menu = null;
  }

  function rename(){
    editing = menu.page.id;
    menu = null;
  }

  function remove(){
    const id = menu.page.id;
    menu = null;
    ondelete(id);
  }

  function focus(node){
    node.focus();
    node.select();
  }

  function commit(page, value){
    editing = null;
    const name = value.trim();
    if (name && name !== page.name) onrename(page.id, name);
  }

  function editKey(event, page){
    if (event.key === "Enter") commit(page, event.currentTarget.value);
    if (event.key === "Escape") editing = null;
  }
</script>

<svelte:window onpointerdown={closeMenu} onkeydown={closeOnEscape}/>

<style>
  .page-tabs {
    display: flex;
    align-items: stretch;
    flex: none;
    gap: 2px;
    height: 40px;
    padding: 0 8px;
    overflow-x: auto;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .meta {
    position: sticky;
    right: 0;
    display: flex;
    align-items: center;
    gap: 14px;
    flex: none;
    margin-left: auto;
    padding: 0 6px 0 12px;
    background: #f8fafc;
    font-size: 11px;
    font-weight: 500;
    color: #94a3b8;
  }

  .position {
    font-variant-numeric: tabular-nums;
    color: #64748b;
  }

  .tools {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-right: 10px;
  }

  .tab {
    display: inline-flex;
    align-items: center;
    flex: none;
    color: #475569;
  }

  .tab.active {
    background: #e2eaf6;
    color: #1d4ed8;
  }

  .tab:not(.active):hover {
    background: #eef2f7;
  }

  .caret {
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 6px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: none;
    color: inherit;
    cursor: pointer;
  }

  .caret:hover {
    background: rgba(37, 99, 235, 0.12);
  }

  .caret svg,
  .icon svg {
    width: 14px;
    height: 14px;
  }

  .name {
    height: 100%;
    padding: 0 14px;
    border: none;
    background: none;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: inherit;
    white-space: nowrap;
    cursor: pointer;
  }

  .page-menu {
    position: fixed;
    z-index: 60;
    display: flex;
    flex-direction: column;
    min-width: 140px;
    padding: 4px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
    transform: translateY(-100%);
  }

  .page-menu button {
    height: 28px;
    padding: 0 10px;
    border: none;
    border-radius: 5px;
    background: none;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    text-align: left;
    color: #334155;
    cursor: pointer;
  }

  .page-menu button:hover:not(:disabled) {
    background: #f1f5f9;
  }

  .page-menu button.danger {
    color: #b91c1c;
  }

  .page-menu button.danger:hover:not(:disabled) {
    background: #fee2e2;
  }

  .page-menu button:disabled {
    color: #cbd5e1;
    cursor: default;
  }

  input {
    width: 110px;
    height: 24px;
    margin: 0 2px;
    padding: 0 6px;
    border: 1px solid #2563eb;
    border-radius: 4px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: #0f172a;
    outline: none;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    border-radius: 5px;
    background: none;
    color: #475569;
    cursor: pointer;
  }

  .icon:hover {
    background: #e2e8f0;
    color: #0f172a;
  }
</style>

<div class="page-tabs" role="tablist" aria-label="Pages">
  <div class="tools">
    <button type="button" class="icon" aria-label="Add page" title="Add page" onclick={onadd}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M8 3 V13 M3 8 H13"/></svg>
    </button>
  </div>
  {#each pages as page (page.id)}
    <div class="tab" class:active={page.id === active}>
      {#if editing === page.id}
        <input type="text" value={page.name} aria-label="Page name" use:focus
               onkeydown={(e) => editKey(e, page)} onblur={(e) => commit(page, e.currentTarget.value)}>
      {:else}
        <button type="button" class="name" role="tab" aria-selected={page.id === active} title="Double-click to rename · right-click for more"
                onclick={() => onselect(page.id)} ondblclick={() => editing = page.id} oncontextmenu={(e) => openMenu(e, page)}>{page.name}</button>
        {#if page.id === active}
          <button type="button" class="caret" aria-label="{page.name} options" title="Page options" onclick={(e) => menuAt(e, { page })}>
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 6 L12 6 L8 11 Z"/></svg>
          </button>
        {/if}
      {/if}
    </div>
  {/each}
  <div class="meta">
    {#if position}<span class="position" title="Cursor position">{position}</span>{/if}
    {#if version}<span title="Pathfinder {version}{build ? ` · commit ${build}` : ""}">{version}</span>{/if}
  </div>
</div>

{#if menu}
  <div class="page-menu" role="menu" aria-label="{menu.page.name} options" use:portal style="left: {menu.x}px; top: {menu.y - 4}px">
    <button type="button" role="menuitem" onclick={rename}>Rename</button>
    <button type="button" role="menuitem" class="danger" disabled={pages.length < 2} title={pages.length < 2 ? "The only page can't be deleted" : undefined} onclick={remove}>Delete</button>
  </div>
{/if}
