<script>
  import { portal } from "$lib/actions/portal.js";
  import { FILE_SUFFIX } from "$lib/document.js";

  let { right, top, name, anchor = null, onsave, oncancel } = $props();

  let input;
  let box = $state(null);

  $effect(() => {
    const timer = setTimeout(() => {
      input?.focus();
      input?.select();
    }, 0);
    return () => clearTimeout(timer);
  });

  function submit(event){
    event.preventDefault();
    onsave(input.value);
  }

  function outside(event){
    if (box?.contains(event.target) || anchor?.contains(event.target)) return;
    oncancel();
  }

  function handleKey(event){
    if (event.key === "Escape") {
      event.preventDefault();
      oncancel();
    } else if (event.key.toLowerCase() === "s" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      onsave(input.value);
    }
  }
</script>

<svelte:window onpointerdown={outside}/>

<style>
  .save-dialog {
    position: fixed;
    z-index: 60;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 340px;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
    font-family: 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    font-size: 12px;
    color: #334155;
    box-sizing: border-box;
  }

  label {
    font-weight: 600;
    color: #0f172a;
  }

  .row {
    display: flex;
    align-items: center;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    background: #ffffff;
  }

  .row:focus-within {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  input {
    flex: 1;
    min-width: 0;
    height: 28px;
    padding: 2px 8px;
    border: none;
    border-radius: 5px;
    outline: none;
    background: transparent;
    font-family: inherit;
    font-size: 13px;
    color: #0f172a;
  }

  .suffix {
    padding-right: 8px;
    color: #94a3b8;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  button {
    height: 28px;
    padding: 0 12px;
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

  button.primary {
    border-color: #2563eb;
    background: #2563eb;
    color: #ffffff;
  }

  button.primary:hover {
    background: #1d4ed8;
    color: #ffffff;
  }
</style>

<form class="save-dialog" aria-label="Save drawing" use:portal bind:this={box}
      style="right: {right}px; top: {top}px" onsubmit={submit}>
  <label for="save-name">File name</label>
  <div class="row">
    <input id="save-name" bind:this={input} type="text" value={name} spellcheck="false" autocomplete="off" onkeydown={handleKey}>
    <span class="suffix">{FILE_SUFFIX}</span>
  </div>
  <div class="actions">
    <button type="button" onclick={oncancel}>Cancel</button>
    <button type="submit" class="primary">Save</button>
  </div>
</form>
