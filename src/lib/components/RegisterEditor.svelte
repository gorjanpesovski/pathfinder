<script>
  import Modal from "./Modal.svelte";
  import { parseSymbols, formatSymbols } from "$lib/hydronic/symbols.js";

  let { devices, onsave, onclose } = $props();

  const lists = devices.map((device) => formatSymbols(device.params?.symbols ?? []));
  const mixed = lists.some((text) => text !== lists[0]);

  let text = $state(mixed ? "" : lists[0]);
  let fileInput = $state(null);
  let parsed = $derived(parseSymbols(text));
  let title = $derived(devices.length === 1 ? devices[0].name || "Device" : `${devices.length} devices`);

  async function load(file){
    if (!file) return;
    text = await file.text();
  }

  function save(){
    onsave(parsed.list);
    onclose();
  }
</script>

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 13px;
    color: #334155;
  }

  p {
    margin: 0;
    font-size: 12px;
    color: #64748b;
  }

  textarea {
    height: 340px;
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    resize: vertical;
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: 11.5px;
    line-height: 1.5;
    color: #0f172a;
  }

  textarea:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .status {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    font-size: 12px;
  }

  .ok {
    color: #15803d;
  }

  .warn {
    color: #b45309;
  }

  .mixed {
    padding: 8px 10px;
    border-radius: 6px;
    background: #fffbeb;
    color: #92400e;
  }

  button {
    height: 30px;
    padding: 0 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
  }

  button:hover {
    background: #f1f5f9;
  }

  button.go {
    border-color: #2563eb;
    background: #2563eb;
    color: #ffffff;
  }

  button.go:hover {
    background: #1d4ed8;
  }

  .file {
    display: none;
  }
</style>

<Modal title="Registers · {title}" subtitle="Written to Conn-<connection>.Symbol in the atvise connect export" width={620} {onclose}>
  <div class="content">
    <p>One variable per line, as in a connect .Symbol file: <code>sym-Name=HR20,</code>. Lines like <code>Name=HR20</code> or a name and address pasted from Excel work too.</p>
    {#if mixed}
      <p class="mixed">The selected devices have different lists. Saving replaces the list on all {devices.length} of them.</p>
    {/if}
    <textarea bind:value={text} spellcheck="false" placeholder={"[]\nsym-Frekvenca=HRD50526,\nsym-I1=HRD50528,\n…"}></textarea>
    <div class="status">
      <span class="ok">{parsed.list.length} variable{parsed.list.length === 1 ? "" : "s"}</span>
      {#if parsed.duplicates.length}<span class="warn">{parsed.duplicates.length} duplicate name{parsed.duplicates.length === 1 ? "" : "s"}, the last one is kept: {parsed.duplicates.slice(0, 3).join(", ")}{parsed.duplicates.length > 3 ? " …" : ""}</span>{/if}
      {#if parsed.invalid.length}<span class="warn">{parsed.invalid.length} line{parsed.invalid.length === 1 ? "" : "s"} not understood and left out: {parsed.invalid[0]}</span>{/if}
    </div>
    <input class="file" type="file" accept=".Symbol,.symbol,.txt,.csv" bind:this={fileInput}
           onchange={(e) => { load(e.currentTarget.files?.[0]); e.currentTarget.value = ""; }}>
  </div>
  {#snippet footer()}
    <button type="button" onclick={() => fileInput?.click()}>Load .Symbol file…</button>
    <span style="flex: 1"></span>
    <button type="button" onclick={onclose}>Cancel</button>
    <button type="button" class="go" onclick={save}>Save to {devices.length === 1 ? "device" : `${devices.length} devices`}</button>
  {/snippet}
</Modal>
