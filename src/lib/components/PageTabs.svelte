<script>
  import { portal } from "$lib/actions/portal.js";

  let { pages, active, onselect, onadd, onrename, ondelete } = $props();

  let editing = $state(null);
  let menu = $state(null);

  function openMenu(event, page){
    event.preventDefault();
    menu = { page, x: event.clientX, y: event.clientY };
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
    position: absolute;
    left: 12px;
    bottom: 12px;
    z-index: 4;
    display: flex;
    align-items: center;
    gap: 4px;
    max-width: calc(100% - 24px);
    padding: 4px;
    overflow-x: auto;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
  }

  .tab {
    display: inline-flex;
    align-items: center;
    flex: none;
    height: 26px;
    border-radius: 5px;
    color: #475569;
  }

  .tab.active {
    background: #eff6ff;
    color: #1d4ed8;
    box-shadow: inset 0 0 0 1px #93c5fd;
  }

  .tab:not(.active):hover {
    background: #f1f5f9;
  }

  .name {
    height: 26px;
    padding: 0 10px;
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

  .add {
    flex: none;
    width: 26px;
    height: 26px;
    padding: 0;
    border: none;
    border-radius: 5px;
    background: none;
    font-size: 16px;
    color: #475569;
    cursor: pointer;
  }

  .add:hover {
    background: #eff6ff;
    color: #1d4ed8;
  }
</style>

<div class="page-tabs" role="tablist" aria-label="Pages">
  {#each pages as page (page.id)}
    <div class="tab" class:active={page.id === active}>
      {#if editing === page.id}
        <input type="text" value={page.name} aria-label="Page name" use:focus
               onkeydown={(e) => editKey(e, page)} onblur={(e) => commit(page, e.currentTarget.value)}>
      {:else}
        <button type="button" class="name" role="tab" aria-selected={page.id === active} title="Double-click to rename · right-click for more"
                onclick={() => onselect(page.id)} ondblclick={() => editing = page.id} oncontextmenu={(e) => openMenu(e, page)}>{page.name}</button>
      {/if}
    </div>
  {/each}
  <button type="button" class="add" aria-label="Add page" title="Add page" onclick={onadd}>+</button>
</div>

{#if menu}
  <div class="page-menu" role="menu" aria-label="{menu.page.name} options" use:portal style="left: {menu.x}px; top: {menu.y - 4}px">
    <button type="button" role="menuitem" onclick={rename}>Rename</button>
    <button type="button" role="menuitem" class="danger" disabled={pages.length < 2} title={pages.length < 2 ? "The only page can't be deleted" : undefined} onclick={remove}>Delete</button>
  </div>
{/if}
