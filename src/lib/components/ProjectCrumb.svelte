<script>
  let { name, view, fileName = null, status, onrename, onresume } = $props();

  const DETAILS = {
    saving: "Writing to the file",
    paused: "Autosave paused · click to allow Pathfinder to write to the file again",
    pending: "Autosaving to the file",
    unsaved: "Unsaved changes",
    unlinked: "Not saved to a file yet",
    autosaved: "Autosaved",
    saved: "All changes saved"
  };

  let editing = $state(false);
  let state = $derived(status === "saving" || status === "pending" ? "busy" : status === "saved" || status === "autosaved" ? "saved" : "unsaved");
  let label = $derived(status === "paused" ? "Autosave paused" : state === "busy" ? "Saving…" : state === "saved" ? "Saved" : "Unsaved");
  let detail = $derived(`${DETAILS[status]}${fileName ? ` · ${fileName}` : ""}`);

  function focus(node){
    node.focus();
    node.select();
  }

  function finish(input, keep){
    if (!editing) return;
    editing = false;
    const next = input.value.trim();
    if (keep && next && next !== name) onrename(next);
  }
</script>

<style>
  .crumb {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    font-size: 13px;
  }

  .name {
    min-width: 0;
    max-width: 260px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 3px 6px;
    border: 1px solid transparent;
    border-radius: 5px;
    background: none;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    color: #0f172a;
    cursor: text;
  }

  .name:hover {
    border-color: #e2e8f0;
    background: #f8fafc;
  }

  input {
    width: 220px;
    height: 26px;
    padding: 0 6px;
    border: 1px solid #2563eb;
    border-radius: 5px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    color: #0f172a;
    outline: none;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .slash {
    color: #cbd5e1;
  }

  .view {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #94a3b8;
  }

  .state {
    display: inline-flex;
    align-items: center;
    flex: none;
    gap: 5px;
    margin-left: 8px;
    padding: 2px 4px;
    border: none;
    border-radius: 4px;
    background: none;
    font-family: inherit;
    font-size: 11.5px;
    color: #94a3b8;
    white-space: nowrap;
  }

  button.state {
    cursor: pointer;
  }

  button.state:hover {
    background: #fffbeb;
    color: #92400e;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .unsaved .dot {
    background: #f59e0b;
  }

  .saved .dot {
    background: #16a34a;
  }
</style>

<div class="crumb">
  {#if editing}
    <input type="text" value={name} aria-label="Project name" spellcheck="false" use:focus
           onkeydown={(e) => { if (e.key === "Enter") finish(e.currentTarget, true); if (e.key === "Escape") { e.stopPropagation(); finish(e.currentTarget, false); } }}
           onblur={(e) => finish(e.currentTarget, true)}>
  {:else}
    <button type="button" class="name" title="Rename project" onclick={() => editing = true}>{name}</button>
  {/if}
  <span class="slash" aria-hidden="true">/</span>
  <span class="view">{view}</span>
  {#if status === "paused"}
    <button type="button" class="state unsaved" title={detail} onclick={onresume}><span class="dot" aria-hidden="true"></span>{label}</button>
  {:else}
    <span class="state {state}" title={detail} role="status">{#if state !== "busy"}<span class="dot" aria-hidden="true"></span>{/if}{label}</span>
  {/if}
</div>
