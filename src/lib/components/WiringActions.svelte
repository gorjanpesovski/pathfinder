<script>
  import Modal from "./Modal.svelte";
  import { WIRING_DEFAULTS, missingPoints } from "$lib/electric/generate.js";

  let { points, shapes, ongenerate, onclose } = $props();

  const OPTIONS_KEY = "pathfinder.wiringOptions";

  let options = $state(read());
  let missing = $derived(missingPoints(points, shapes));

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

  function generate(){
    remember();
    ongenerate($state.snapshot(options));
    onclose();
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

  label.check {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  input[type="text"] {
    height: 32px;
    padding: 2px 8px;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    font: inherit;
    font-size: 12px;
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

<Modal title="Wiring from the IO list" subtitle="Draw the controller terminals of IO points that are not in the drawing yet" width={520} {onclose}>
  <div class="content">
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
  </div>
  {#snippet footer()}
    <button type="button" class="go" disabled={!missing.length} onclick={generate}>{missing.length ? `Add ${missing.length} point${missing.length === 1 ? "" : "s"}` : "Nothing to add"}</button>
  {/snippet}
</Modal>
