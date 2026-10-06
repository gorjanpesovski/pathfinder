<script>
  import Modal from "./Modal.svelte";
  import { nodePath, parseVariableNames } from "$lib/hydronic/variables.js";

  let { names, usage, onadd, onremove, onclear, onclose, prefix = "", onprefix } = $props();

  let example = $derived(nodePath(prefix, names[0] ?? "AI_U1_Tipalo_Zunanje_Temperature"));

  let pasted = $state("");
  let search = $state("");
  let fileInput = $state(null);
  let found = $derived(parseVariableNames(pasted));
  let fresh = $derived(found.filter((name) => !names.includes(name)));
  let shown = $derived(names.filter((name) => name.toLowerCase().includes(search.trim().toLowerCase())));
  let linked = $derived(names.filter((name) => usage.has(name)).length);

  function add(){
    onadd(found);
    pasted = "";
  }

  async function load(file){
    if (!file) return;
    pasted = await file.text();
  }
</script>

<style>
  .prefix {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 18px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 13px;
  }

  .prefix input {
    height: 32px;
    padding: 2px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: 12px;
    color: #0f172a;
  }

  .prefix input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .prefix code {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: 11px;
    color: #475569;
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr);
    gap: 18px;
    font-size: 13px;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  h3 {
    margin: 0;
    font-family: 'Sora', 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    font-size: 12px;
    font-weight: 600;
    color: #0f172a;
  }

  p {
    margin: 0;
    font-size: 12px;
    color: #64748b;
  }

  textarea {
    height: 260px;
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    resize: vertical;
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: 11px;
    color: #0f172a;
  }

  textarea:focus,
  input[type="search"]:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .row .grow {
    flex: 1;
  }

  input[type="search"] {
    height: 30px;
    padding: 2px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font: inherit;
    font-size: 12px;
  }

  ul {
    height: 290px;
    margin: 0;
    padding: 4px;
    overflow: auto;
    list-style: none;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
  }

  li {
    display: grid;
    grid-template-columns: 8px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    padding: 4px 6px;
    border-radius: 5px;
  }

  li:hover {
    background: #ffffff;
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: 11.5px;
    color: #0f172a;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #cbd5e1;
  }

  .dot.used {
    background: #16a34a;
  }

  .remove {
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: none;
    color: #94a3b8;
    cursor: pointer;
  }

  .remove:hover {
    background: #fee2e2;
    color: #b91c1c;
  }

  .empty {
    padding: 24px 10px;
    text-align: center;
    color: #94a3b8;
  }

  button.plain {
    height: 30px;
    padding: 0 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
  }

  button.plain:hover:not(:disabled) {
    background: #f1f5f9;
  }

  button.primary {
    border-color: #2563eb;
    background: #2563eb;
    color: #ffffff;
  }

  button.primary:hover:not(:disabled) {
    background: #1d4ed8;
  }

  button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .file {
    display: none;
  }
</style>

<Modal title="Variables" subtitle="Names to link to elements and value boxes in the Hydronic station" width={940} {onclose}>
  <label class="prefix">
    <h3>atvise node path</h3>
    <input type="text" value={prefix} spellcheck="false" placeholder="AGENT.OBJECTS.Toplotne_Postaje.Celica_1"
           onchange={(e) => onprefix(e.currentTarget.value)} onkeydown={(e) => e.key === "Enter" && e.currentTarget.blur()}>
    <p>Written in front of each linked name, into the base parameter of the exported element or value box. Example: <code>{example}</code></p>
  </label>

  <div class="layout">
    <section>
      <h3>Add names</h3>
      <p>Paste the c.strategy ModbusSlave table or any list with one name per line. Headers and settings rows are skipped.</p>
      <textarea bind:value={pasted} spellcheck="false" placeholder={"Coil\t0\tNO1_Vklop_NETC11_AR\nNO1_Vklop_NETC11_R\n…"}></textarea>
      <div class="row">
        <button type="button" class="plain" onclick={() => fileInput?.click()}>Load file…</button>
        <span class="grow"></span>
        <button type="button" class="plain primary" disabled={!fresh.length} onclick={add}>
          {fresh.length ? `Add ${fresh.length} name${fresh.length === 1 ? "" : "s"}` : found.length ? "All already in the list" : "Add names"}
        </button>
      </div>
      <input class="file" type="file" accept=".txt,.csv,.tsv,text/plain" bind:this={fileInput}
             onchange={(e) => { load(e.currentTarget.files?.[0]); e.currentTarget.value = ""; }}>
    </section>

    <section>
      <h3>{names.length} name{names.length === 1 ? "" : "s"} · {linked} linked</h3>
      <div class="row">
        <input type="search" class="grow" placeholder="Search" bind:value={search}>
        <button type="button" class="plain" disabled={!names.length}
                onclick={() => window.confirm(`Remove all ${names.length} names? Links on elements stay until you change them.`) && onclear()}>Clear list</button>
      </div>
      <ul>
        {#each shown as name (name)}
          <li title={usage.has(name) ? `Linked to ${usage.get(name).join(", ")}` : "Not linked yet"}>
            <span class="dot" class:used={usage.has(name)} aria-hidden="true"></span>
            <span class="name">{name}</span>
            <button type="button" class="remove" aria-label="Remove {name}" onclick={() => onremove(name)}>×</button>
          </li>
        {:else}
          <li class="empty">{names.length ? "No match" : "No names yet"}</li>
        {/each}
      </ul>
    </section>
  </div>
</Modal>
