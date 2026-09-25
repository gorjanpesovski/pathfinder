<script>
  import { PIPE_MEDIA, mediumOf } from "$lib/hydronic/elements.js";
  import { portal } from "$lib/actions/portal.js";

  let { value = null, onchange } = $props();

  let menu = $state(null);
  let button;
  let list = $state(null);
  let current = $derived(value === null || value === undefined ? null : mediumOf(value));

  function toggle(){
    const box = button.getBoundingClientRect();
    menu = menu ? null : { x: box.left, y: box.bottom + 4 };
  }

  function cycle(event){
    const step = event.deltaY > 0 ? 1 : event.deltaY < 0 ? -1 : 0;
    if (step === 0) return;
    const index = current ? PIPE_MEDIA.findIndex((entry) => entry.id === current.id) : -1;
    onchange(PIPE_MEDIA[(index + step + PIPE_MEDIA.length) % PIPE_MEDIA.length].id);
  }

  function close(event){
    if (!menu) return;
    if (button?.contains(event.target) || list?.contains(event.target)) return;
    menu = null;
  }

  function pick(id){
    onchange(id);
    menu = null;
  }
</script>

<svelte:window onpointerdown={close} onkeydown={(event) => event.key === "Escape" && (menu = null)} onresize={() => menu = null}/>

<style>
  button {
    height: 26px;
    padding: 0 10px;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    background: #ffffff;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
  }

  button:hover {
    background: #eff6ff;
    color: #1d4ed8;
  }

  .medium-current {
    display: inline-flex;
    align-items: center;
    min-width: 170px;
  }

  .caret {
    margin-left: auto;
    padding-left: 8px;
    font-size: 10px;
    color: #94a3b8;
  }

  .swatch {
    display: inline-block;
    flex: none;
    width: 8px;
    height: 8px;
    margin-right: 5px;
    border-radius: 2px;
  }

  .swatch.mixed {
    background: linear-gradient(135deg, #dc2626 0 50%, #2563eb 50% 100%);
  }

  .medium-menu {
    position: fixed;
    z-index: 60;
    display: flex;
    flex-direction: column;
    min-width: 190px;
    padding: 4px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
    font-family: 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
  }

  .medium-menu button {
    display: flex;
    align-items: center;
    height: 28px;
    border: none;
    border-radius: 5px;
    text-align: left;
    white-space: nowrap;
  }

  .medium-menu button.active {
    background: #eff6ff;
    color: #1d4ed8;
  }
</style>

<button type="button" class="medium-current" bind:this={button} aria-haspopup="listbox" aria-expanded={!!menu}
        onclick={toggle} onwheel={cycle}>
  {#if current}
    <span class="swatch" style="background: {current.color}"></span>{current.label}
  {:else}
    <span class="swatch mixed"></span>Mixed
  {/if}
  <span class="caret" aria-hidden="true">▾</span>
</button>

{#if menu}
  <div class="medium-menu" role="listbox" aria-label="Pipe type" bind:this={list} use:portal
       style="left: {menu.x}px; top: {menu.y}px">
    {#each PIPE_MEDIA as entry (entry.id)}
      <button type="button" role="option" class:active={current?.id === entry.id} aria-selected={current?.id === entry.id}
              onclick={() => pick(entry.id)}>
        <span class="swatch" style="background: {entry.color}"></span>{entry.label}
      </button>
    {/each}
  </div>
{/if}
