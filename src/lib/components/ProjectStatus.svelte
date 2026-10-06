<script>
  let { name, fileName = null, status, onresume } = $props();

  const LABELS = {
    saving: "Saving…",
    paused: "Autosave paused · click to resume",
    pending: "Autosaving…",
    unsaved: "Unsaved changes",
    unlinked: "Not saved to a file",
    autosaved: "Autosaved",
    saved: "All changes saved"
  };

  let tone = $derived(status === "paused" || status === "unsaved" || status === "unlinked" ? "warn" : status === "saving" || status === "pending" ? "busy" : "ok");
</script>

<style>
  .project {
    display: inline-flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    max-width: 240px;
    padding: 3px 10px;
    border: 1px solid #e2e8f0;
    border-radius: 7px;
    background: #f8fafc;
    font-family: 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    text-align: left;
    line-height: 1.25;
  }

  button.project {
    cursor: pointer;
  }

  button.project:hover {
    border-color: #fcd34d;
    background: #fffbeb;
  }

  .name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 600;
    color: #0f172a;
  }

  .state {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    overflow: hidden;
    white-space: nowrap;
    font-size: 10.5px;
    color: #64748b;
  }

  .dot {
    flex: none;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #16a34a;
  }

  .warn .dot {
    background: #f59e0b;
  }

  .busy .dot {
    background: #2563eb;
  }

  .warn .state {
    color: #92400e;
  }

  .compact {
    display: none;
    margin-right: 5px;
    vertical-align: 1px;
  }

  @media (max-width: 1100px) {
    .project {
      max-width: 170px;
    }

    .state {
      display: none;
    }

    .compact {
      display: inline-block;
    }
  }
</style>

{#if status === "paused"}
  <button type="button" class="project {tone}" title="{LABELS[status]} · allow Pathfinder to write to {fileName ?? name}" onclick={onresume}>
    <span class="name"><span class="dot compact" aria-hidden="true"></span>{name}</span>
    <span class="state"><span class="dot" aria-hidden="true"></span>{LABELS[status]}</span>
  </button>
{:else}
  <div class="project {tone}" title="{LABELS[status]} · {fileName ? `saving to ${fileName}` : "not saved to a file yet"}" role="status">
    <span class="name"><span class="dot compact" aria-hidden="true"></span>{name}</span>
    <span class="state"><span class="dot" aria-hidden="true"></span>{LABELS[status]}</span>
  </div>
{/if}
