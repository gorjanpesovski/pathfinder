<script>
  import Modal from "../../../core/components/Modal.svelte";
  import { WIRING_DEFAULTS, missingPoints } from "$lib/apps/wiring/generate.js";

  let { source, shapes, onpick, ongenerate, onclose } = $props();

  const OPTIONS_KEY = "pathfinder.wiringOptions";

  let options = $state(read());
  let points = $derived(source?.points ?? []);
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

  .source {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #f8fafc;
  }

  .source span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .source strong {
    color: #0f172a;
  }

  .pick {
    flex: none;
    height: 30px;
    padding: 0 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
  }

  .pick:hover {
    background: #f1f5f9;
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
    <div class="source">
      <span>{#if source}IO list from <strong>{source.name}</strong>{:else}No Hydronic station file chosen{/if}</span>
      <button type="button" class="pick" onclick={onpick}>{source ? "Choose another…" : "Choose hydronic file…"}</button>
    </div>
    {#if !source}
      <p>Choose the Hydronic station file whose IO list should be drawn.</p>
    {:else if !points.length}
      <p>The IO list in {source.name} is empty. Add points in Hydronic station → IO list first.</p>
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
