<script>
  import { connectFiles } from "$lib/hydronic/connect.js";
  import { zipFiles } from "$lib/export/zip.js";
  import { portal } from "$lib/actions/portal.js";

  let { shapes, name = null, onnotice } = $props();

  const ADAPTER_KEY = "pathfinder.connectAdapter";

  let menu = $state(null);
  let adapter = $state(read());
  let preview = $derived(menu ? connectFiles(shapes, { adapter: adapter.trim() }) : null);
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

  function toggle(event){
    const box = event.currentTarget.getBoundingClientRect();
    menu = menu ? null : { x: Math.max(8, box.right - 340), y: box.bottom + 6 };
  }

  function close(event){
    if (menu && !event.target.closest?.(".connect-menu, .connect-toggle")) menu = null;
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
    menu = null;
    onnotice?.(`Saved atvise connect config with ${result.connections.length} connection${result.connections.length === 1 ? "" : "s"}${result.skipped.length ? ` · ${result.skipped.length} skipped` : ""}`);
  }
</script>

<svelte:window onpointerdown={close} onkeydown={(event) => menu && event.key === "Escape" && (menu = null)}/>

<style>
  .connect-toggle {
    padding: 6px 14px;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    background: #ffffff;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    color: #1d4ed8;
    cursor: pointer;
  }

  .connect-toggle:hover:not(:disabled) {
    background: #eff6ff;
  }

  .connect-toggle:disabled {
    background: #cbd5e1;
    border-color: #cbd5e1;
    color: #ffffff;
    cursor: not-allowed;
  }

  .connect-menu {
    position: fixed;
    z-index: 60;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 340px;
    padding: 14px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18);
    font-size: 12px;
    color: #334155;
  }

  h3 {
    margin: 0;
    font-size: 13px;
    color: #0f172a;
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
    height: 28px;
    padding: 2px 8px;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    font-family: 'IBM Plex Mono', Consolas, monospace;
    font-size: 11px;
  }

  ul {
    margin: 0;
    padding-left: 16px;
    max-height: 120px;
    overflow: auto;
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
    height: 30px;
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

<button class="connect-toggle" type="button" onclick={toggle} disabled={!shapes.length}
        title="Download an atvise connect configuration for the devices in this topology">atvise connect</button>

{#if menu && preview}
  <div class="connect-menu" role="dialog" aria-label="atvise connect configuration" use:portal style="left: {menu.x}px; top: {menu.y}px">
    <h3>atvise connect configuration</h3>
    <p>{preview.connections.length} Modbus TCP connection{preview.connections.length === 1 ? "" : "s"}. RTU devices use the IP of the gateway they are wired to and their own slave ID.</p>
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
    <button type="button" class="go" disabled={!preview.connections.length} onclick={download}>Download config (.zip)</button>
  </div>
{/if}
