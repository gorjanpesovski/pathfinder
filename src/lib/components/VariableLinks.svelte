<script>
  import Modal from "./Modal.svelte";

  let { title, slots, names, usage, onchange, onmanage, onclose } = $props();

  const LIST_ID = "pathfinder-variable-names";

  function commit(slot, value){
    if (value.trim() !== slot.value) onchange(slot.key, value);
  }

  function elsewhere(slot){
    const where = usage.get(slot.value) ?? [];
    return where.length > 1 ? where.length - 1 : 0;
  }
</script>

<style>
  .slots {
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-size: 13px;
  }

  label {
    display: grid;
    grid-template-columns: 150px minmax(0, 1fr);
    align-items: center;
    gap: 12px;
  }

  label > span {
    font-weight: 600;
    color: #334155;
  }

  input {
    height: 34px;
    padding: 2px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: 12px;
    color: #0f172a;
  }

  input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .hint {
    grid-column: 2;
    margin: -6px 0 0;
    font-size: 11px;
    color: #64748b;
  }

  .hint.warn {
    color: #b45309;
  }

  .empty {
    margin: 0;
    padding: 12px 14px;
    border-radius: 8px;
    background: #fffbeb;
    font-size: 12px;
    color: #92400e;
  }

  button {
    height: 32px;
    padding: 0 14px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
  }

  button:hover {
    background: #f1f5f9;
  }

  button.primary {
    border-color: #2563eb;
    background: #2563eb;
    color: #ffffff;
  }

  button.primary:hover {
    background: #1d4ed8;
  }
</style>

<Modal {title} subtitle="Pick a variable for each part. Leave a field empty to unlink it." width={620} {onclose}>
  <div class="slots">
    {#if !names.length}
      <p class="empty">The variable list is empty. Add names with Import → Variable names…, or type a name directly.</p>
    {/if}
    {#each slots as slot (slot.key)}
      <label>
        <span>{slot.label}</span>
        <input type="text" value={slot.value} list={LIST_ID} spellcheck="false" autocomplete="off" placeholder="Not linked"
               onchange={(e) => commit(slot, e.currentTarget.value)} onkeydown={(e) => e.key === "Enter" && e.currentTarget.blur()}>
      </label>
      {#if slot.value && names.length && !names.includes(slot.value)}
        <p class="hint warn">Not in the variable list</p>
      {:else if slot.value && elsewhere(slot)}
        <p class="hint">Also linked to {elsewhere(slot)} other part{elsewhere(slot) === 1 ? "" : "s"}</p>
      {/if}
    {/each}
  </div>
  <datalist id={LIST_ID}>
    {#each names as name (name)}
      <option value={name}></option>
    {/each}
  </datalist>
  {#snippet footer()}
    <button type="button" onclick={onmanage}>Variable list…</button>
    <button type="button" class="primary" onclick={onclose}>Done</button>
  {/snippet}
</Modal>
