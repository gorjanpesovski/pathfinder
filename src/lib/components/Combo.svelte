<script>
  import { portal } from "$lib/actions/portal.js";

  let { value = $bindable(""), options = [], placeholder = "", label = "", disabled = false, onchange = null } = $props();

  let root = $state(null);
  let input = $state(null);
  let open = $state(false);
  let place = $state({ left: 0, top: 0, width: 0 });
  let active = $state(-1);
  let filtered = $derived.by(() => {
    const query = String(value ?? "").trim().toLowerCase();
    const matches = options.filter((option) => option.toLowerCase().includes(query));
    return query && matches.length && !options.includes(value) ? matches : options;
  });

  function show(){
    if (disabled) return;
    const rect = root.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    place = { left: rect.left, width: Math.max(rect.width, 200), top: below < 220 ? null : rect.bottom + 2, bottom: below < 220 ? window.innerHeight - rect.top + 2 : null };
    open = true;
    active = filtered.indexOf(value);
  }

  function pick(option){
    value = option;
    open = false;
    onchange?.(option);
    input?.focus();
  }

  function keydown(event){
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return show();
      const step = event.key === "ArrowDown" ? 1 : -1;
      active = (active + step + filtered.length) % filtered.length;
    } else if (event.key === "Enter" && open && active >= 0) {
      event.preventDefault();
      pick(filtered[active]);
    } else if (event.key === "Escape" && open) {
      event.stopPropagation();
      open = false;
    }
  }

  function leave(event){
    if (open && !root?.contains(event.relatedTarget)) setTimeout(() => open = false, 120);
  }
</script>

<style>
  .combo {
    display: flex;
    width: 100%;
    min-width: 0;
  }

  .combo input {
    flex: 1;
    min-width: 0;
    height: 30px;
    padding: 4px 6px;
    border: 1px solid #e2e8f0;
    border-radius: 5px 0 0 5px;
    background: #ffffff;
    font-family: inherit;
    font-size: 12px;
    color: #0f172a;
    box-sizing: border-box;
  }

  .combo input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .combo input:disabled {
    background: #f8fafc;
    color: #94a3b8;
  }

  .toggle {
    flex: none;
    width: 22px;
    padding: 0;
    border: 1px solid #e2e8f0;
    border-left: none;
    border-radius: 0 5px 5px 0;
    background: #f8fafc;
    color: #64748b;
    font-size: 10px;
    cursor: pointer;
  }

  .toggle:disabled {
    cursor: default;
    opacity: 0.5;
  }

  .list {
    position: fixed;
    z-index: 90;
    max-height: 220px;
    overflow-y: auto;
    margin: 0;
    padding: 4px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
    list-style: none;
    font-size: 12px;
    box-sizing: border-box;
  }

  .list li {
    padding: 4px 8px;
    border-radius: 4px;
    color: #334155;
    white-space: nowrap;
    cursor: pointer;
  }

  .list li.active,
  .list li:hover {
    background: #eff6ff;
    color: #1d4ed8;
  }

  .list li.current {
    font-weight: 600;
  }
</style>

<div class="combo" bind:this={root} onfocusout={leave}>
  <input type="text" bind:this={input} bind:value aria-label={label} {placeholder} {disabled} spellcheck="false"
         onkeydown={keydown} onchange={() => onchange?.(value)} oninput={() => { if (!open) show(); }}>
  <button type="button" class="toggle" tabindex="-1" aria-label="Show the list" {disabled} onclick={() => open ? open = false : show()}>▾</button>
  {#if open && filtered.length}
    <ul class="list" use:portal role="listbox" style:left="{place.left}px" style:width="{place.width}px"
        style:top={place.top === null ? null : `${place.top}px`} style:bottom={place.bottom === null ? null : `${place.bottom}px`}>
      {#each filtered as option, index (option)}
        <li role="option" aria-selected={option === value} class:active={index === active} class:current={option === value}
            onpointerdown={(event) => { event.preventDefault(); pick(option); }}>{option}</li>
      {/each}
    </ul>
  {/if}
</div>
