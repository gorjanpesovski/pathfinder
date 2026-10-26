<script>
  import Modal from "./Modal.svelte";
  import { CONTROLLERS } from "$lib/ahu/registers.js";

  let { controller, prefix, onconfirm, onclose } = $props();

  let chosenController = $state(controller in CONTROLLERS ? controller : "carel");
  let chosenPrefix = $state(prefix);

  function confirm(event){
    event?.preventDefault();
    onconfirm({ controller: chosenController, prefix: chosenPrefix.trim() });
  }

  function focusFirst(node){
    node.focus();
    node.select?.();
  }
</script>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #0f172a;
  }

  small {
    font-size: 12px;
    font-weight: 400;
    color: #64748b;
  }

  select,
  input {
    height: 34px;
    padding: 0 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font-family: inherit;
    font-size: 13px;
    color: #0f172a;
    box-sizing: border-box;
  }

  input {
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: 12.5px;
  }

  select:focus,
  input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    width: 100%;
  }

  .actions button {
    height: 32px;
    padding: 0 14px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
  }

  .actions button:hover {
    background: #f1f5f9;
  }

  .actions button.go {
    border-color: #2563eb;
    background: #2563eb;
    color: #ffffff;
  }

  .actions button.go:hover {
    border-color: #1d4ed8;
    background: #1d4ed8;
  }
</style>

<Modal title="Copy to atvise" subtitle="Where this page's readouts and indicators read from" width={460} {onclose}>
  <form id="target-form" onsubmit={confirm}>
    <label>
      Modbus table
      <select bind:value={chosenController} use:focusFirst>
        {#each Object.entries(CONTROLLERS) as [id, entry] (id)}
          <option value={id}>{entry.name}</option>
        {/each}
      </select>
      <small>Register names written into readouts, setpoints and indicators.</small>
    </label>
    <label>
      Node path prefix
      <input type="text" bind:value={chosenPrefix} spellcheck="false" placeholder="AGENT.OBJECTS.Klimat">
      <small>Written in front of every register, for example AGENT.OBJECTS.Klimatske_Naprave.KN2</small>
    </label>
  </form>
  {#snippet footer()}
    <div class="actions">
      <button type="button" onclick={onclose}>Cancel</button>
      <button type="submit" class="go" form="target-form">Copy to atvise</button>
    </div>
  {/snippet}
</Modal>
