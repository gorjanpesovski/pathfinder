<script>
  import { connectFiles } from "$lib/hydronic/connect.js";
  import { zipFiles } from "$lib/export/zip.js";
  import Modal from "./Modal.svelte";

  let { shapes, name = null, onnotice, onclose } = $props();

  const ADAPTER_KEY = "pathfinder.connectAdapter";

  let adapter = $state(read());
  let preview = $derived(connectFiles(shapes, { adapter: adapter.trim() }));
  let groups = $derived.by(() => {
    const map = new Map();
    for (const connection of preview?.connections ?? []) {
      const dot = connection.indexOf(".");
      const group = dot < 0 ? "" : connection.slice(0, dot);
      if (!map.has(group)) map.set(group, []);
      map.get(group).push(dot < 0 ? connection : connection.slice(dot + 1));
    }
    return [...map];
  });

  function read(){
    try {
      return localStorage.getItem(ADAPTER_KEY) ?? "";
    } catch {
      return "";
    }
  }

  function remember(){
    try {
      localStorage.setItem(ADAPTER_KEY, adapter.trim());
    } catch {}
  }

  function download(){
    const result = connectFiles(shapes, { adapter: adapter.trim() });
    remember();
    const url = URL.createObjectURL(zipFiles(result.files));
    const link = Object.assign(document.createElement("a"), { href: url, download: `${name ? name.replace(/[^\w.-]+/g, "_") : "Pathfinder"}.config.zip` });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onclose();
    onnotice?.(`Saved atvise connect config with ${result.connections.length} connection${result.connections.length === 1 ? "" : "s"}${result.skipped.length ? ` · ${result.skipped.length} skipped` : ""}`);
  }
</script>

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-size: 13px;
    color: #334155;
  }

  p {
    margin: 0;
    color: #64748b;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-weight: 600;
  }

  input {
    height: 32px;
    padding: 2px 8px;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: 11px;
  }

  ul {
    margin: 0;
    padding: 8px 10px 8px 26px;
    max-height: 260px;
    overflow: auto;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
  }

  ul ul {
    max-height: none;
    font-weight: 400;
  }

  .group {
    font-weight: 600;
  }

  .skipped li {
    color: #b45309;
  }

  .go {
    height: 32px;
    padding: 0 16px;
    border: 1px solid #2563eb;
    border-radius: 6px;
    background: #2563eb;
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
    color: #ffffff;
    cursor: pointer;
  }

  .go:disabled {
    border-color: #cbd5e1;
    background: #e2e8f0;
    color: #94a3b8;
    cursor: not-allowed;
  }
</style>

<Modal title="atvise connect configuration" subtitle="{preview.connections.length} Modbus TCP connection{preview.connections.length === 1 ? '' : 's'} from the devices in this topology" width={620} {onclose}>
  <div class="content">
    <p>RTU devices use the IP of the gateway they are wired to and their own slave ID.</p>
    {#if preview.connections.length}
      <ul>
        {#each groups as [group, members]}
          {#if group}
            <li class="group">{group}
              <ul>
                {#each members as member}
                  <li>{member}</li>
                {/each}
              </ul>
            </li>
          {:else}
            {#each members as member}
              <li>{member}</li>
            {/each}
          {/if}
        {/each}
      </ul>
    {/if}
    {#if preview.skipped.length}
      <p>Skipped:</p>
      <ul class="skipped">
        {#each preview.skipped as reason}
          <li>{reason}</li>
        {/each}
      </ul>
    {/if}
    <label>
      Network adapter (optional)
      <input type="text" bind:value={adapter} placeholder="<B7 68 00 62 EB AE 9D 41 …>">
    </label>
    <p>Copy the Adapter_1 value from a connection in the DeviceConfig.netparameter of the atvise connect PC. Leave it empty to let atvise connect choose.</p>
  </div>
  {#snippet footer()}
    <button type="button" class="go" disabled={!preview.connections.length} onclick={download}>Download config (.zip)</button>
  {/snippet}
</Modal>
