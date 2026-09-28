<script>
  import { portal } from "$lib/actions/portal.js";
  import { WIRING_DEFAULTS, missingPoints } from "$lib/electric/generate.js";

  let { points, shapes, ongenerate, onprint } = $props();

  const OPTIONS_KEY = "pathfinder.wiringOptions";

  let menu = $state(null);
  let options = $state(read());
  let missing = $derived(menu ? missingPoints(points, shapes) : []);
  let pages = $derived(shapes.some((shape) => shape.kind === "equipment"));

  function read(){
    try {
      return { ...WIRING_DEFAULTS, ...JSON.parse(localStorage.getItem(OPTIONS_KEY) ?? "{}") };
    } catch {
      return { ...WIRING_DEFAULTS };
    }
  }

  function remember(){
    try {
      localStorage.setItem(OPTIONS_KEY, JSON.stringify($state.snapshot(options)));
    } catch {}
  }

  function toggle(event){
    const box = event.currentTarget.getBoundingClientRect();
    menu = menu ? null : { x: Math.max(8, box.right - 320), y: box.bottom + 6 };
  }

  function close(event){
    if (menu && !event.target.closest?.(".wiring-menu, .wiring-toggle")) menu = null;
  }

  function generate(){
    remember();
    ongenerate($state.snapshot(options));
    menu = null;
  }
</script>

<svelte:window onpointerdown={close} onkeydown={(event) => menu && event.key === "Escape" && (menu = null)}/>

<style>
  .wiring-toggle,
  .print {
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

  .wiring-toggle:hover:not(:disabled),
  .print:hover:not(:disabled) {
    background: #eff6ff;
  }

  .print:disabled {
    background: #cbd5e1;
    border-color: #cbd5e1;
    color: #ffffff;
    cursor: not-allowed;
  }

  .wiring-menu {
    position: fixed;
    z-index: 60;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 320px;
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

  label.check {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  input[type="text"] {
    height: 28px;
    padding: 2px 8px;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    font: inherit;
    font-size: 12px;
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

<button class="wiring-toggle" type="button" onclick={toggle}
        title="Draw the controller terminals of IO points that are not in the drawing yet">From IO list</button>
<button class="print" type="button" onclick={onprint} disabled={!pages}
        title="Print the pages, choose Save as PDF in the print dialog">PDF</button>

{#if menu}
  <div class="wiring-menu" role="dialog" aria-label="Wiring from the IO list" use:portal style="left: {menu.x}px; top: {menu.y}px">
    <h3>Wiring from the IO list</h3>
    {#if !points.length}
      <p>The IO list is empty. Add points in Hydronic station → IO list first.</p>
    {:else if !missing.length}
      <p>All {points.length} IO points are already in the drawing.</p>
    {:else}
      <p>{missing.length} of {points.length} IO points are not in the drawing yet. They are added on new pages in IO list order; nothing already drawn is changed.</p>
    {/if}
    <label class="check">
      <input type="checkbox" bind:checked={options.relay}>
      Digital outputs through a relay
    </label>
    <label>
      Cable type
      <input type="text" bind:value={options.cable}>
    </label>
    <p>{"{pairs}"} is replaced by the number of pairs.</p>
    <label>
      Terminal strip
      <input type="text" bind:value={options.strip}>
    </label>
    <button type="button" class="go" disabled={!missing.length} onclick={generate}>Add {missing.length || ""} point{missing.length === 1 ? "" : "s"}</button>
  </div>
{/if}
