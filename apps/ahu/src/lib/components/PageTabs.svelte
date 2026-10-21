<script>
  import { tick } from "svelte";
  import { flip } from "svelte/animate";
  import { portal } from "$lib/actions/portal.js";

  let { pages, active, onselect, onadd, onrename, ondelete, onmove, onduplicate, version = "", build = "" } = $props();

  const DRAG_THRESHOLD = 5;

  let editing = $state(null);
  let menu = $state(null);
  let press = null;
  let dragging = $state(null);
  let shift = $state(0);
  let tabNodes = $state({});
  let strip;

  function pressTab(event, page){
    if (event.button !== 0 || editing) return;
    const node = tabNodes[page.id];
    press = { id: page.id, startX: event.clientX, startLeft: node.offsetLeft, pointer: event.pointerId, target: event.currentTarget };
  }

  async function dragTab(event){
    if (!press || event.pointerId !== press.pointer) return;
    const delta = event.clientX - press.startX;
    if (!dragging) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      dragging = press.id;
      menu = null;
      try { press.target.setPointerCapture(event.pointerId); } catch {}
    }
    const index = pages.findIndex((page) => page.id === dragging);
    const target = targetIndex(event.clientX, index);
    if (target !== index) {
      onmove(dragging, target);
      await tick();
    }
    const node = tabNodes[dragging];
    if (node) shift = delta - (node.offsetLeft - press.startLeft);
  }

  function targetIndex(clientX, index){
    const x = clientX - strip.getBoundingClientRect().left + strip.scrollLeft;
    let target = index;
    pages.forEach((page, position) => {
      if (page.id === dragging) return;
      const node = tabNodes[page.id];
      if (!node) return;
      const middle = node.offsetLeft + node.offsetWidth / 2;
      if (position < index && x < middle) target = Math.min(target, position);
      if (position > index && x > middle) target = Math.max(target, position);
    });
    return target;
  }

  function releaseTab(event){
    if (!press || event.pointerId !== press.pointer) return;
    press = null;
    dragging = null;
    shift = 0;
  }

  function indexOf(page){
    return pages.findIndex((entry) => entry.id === page.id);
  }

  function move(step){
    const page = menu.page;
    menu = null;
    onmove(page.id, indexOf(page) + step);
  }

  function duplicate(){
    const id = menu.page.id;
    menu = null;
    onduplicate(id);
  }

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
    position: relative;
    display: flex;
    align-items: stretch;
    flex: none;
    gap: 2px;
    height: 40px;
    padding: 0 8px;
    overflow-x: auto;
    border-top: 1px solid #e2e8f0;
    background: #ffffff;
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
    background: #ffffff;
    font-size: 11px;
    font-weight: 500;
    color: #94a3b8;
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

  .tab.dragging {
    position: relative;
    z-index: 2;
    border-radius: 6px;
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.18);
    cursor: grabbing;
  }

  .tab.dragging:not(.active) {
    background: #ffffff;
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
    margin: 0 8px 0 -10px;
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
    padding: 0 16px;
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

<div class="page-tabs" role="tablist" aria-label="Pages" bind:this={strip}>
  <div class="tools">
    <button type="button" class="icon" aria-label="Add page" title="Add page" onclick={onadd}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M8 3 V13 M3 8 H13"/></svg>
    </button>
  </div>
  {#each pages as page (page.id)}
    <div class="tab" class:active={page.id === active} class:dragging={dragging === page.id} bind:this={tabNodes[page.id]}
         style={dragging === page.id ? `transform: translateX(${shift}px)` : undefined}
         animate:flip={{ duration: dragging === page.id ? 0 : 160 }}>
      {#if editing === page.id}
        <input type="text" value={page.name} aria-label="Page name" use:focus
               onkeydown={(e) => editKey(e, page)} onblur={(e) => commit(page, e.currentTarget.value)}>
      {:else}
        <button type="button" class="name" role="tab" aria-selected={page.id === active} title="Double-click to rename · drag to reorder · right-click for more"
                onpointerdown={(e) => pressTab(e, page)} onpointermove={dragTab} onpointerup={releaseTab} onpointercancel={releaseTab}
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
    {#if version}<span title="Auto AHU {version}{build ? ` · commit ${build}` : ""}">{version}</span>{/if}
  </div>
</div>

{#if menu}
  <div class="page-menu" role="menu" aria-label="{menu.page.name} options" use:portal style="left: {menu.x}px; top: {menu.y - 4}px">
    <button type="button" role="menuitem" onclick={rename}>Rename</button>
    <button type="button" role="menuitem" onclick={duplicate}>Duplicate</button>
    <button type="button" role="menuitem" disabled={indexOf(menu.page) === 0} onclick={() => move(-1)}>Move left</button>
    <button type="button" role="menuitem" disabled={indexOf(menu.page) === pages.length - 1} onclick={() => move(1)}>Move right</button>
    <button type="button" role="menuitem" class="danger" disabled={pages.length < 2} title={pages.length < 2 ? "The only page can't be deleted" : undefined} onclick={remove}>Delete</button>
  </div>
{/if}
