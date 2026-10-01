<script>
  import { portal } from "$lib/actions/portal.js";

  let { title, subtitle = null, width = 640, onclose, children, footer = null } = $props();

  let panel = $state(null);

  $effect(() => {
    const previous = document.activeElement;
    panel?.focus();
    return () => previous?.focus?.();
  });

  function keydown(event){
    if (event.key === "Escape") {
      event.stopPropagation();
      onclose();
    }
  }
</script>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(15, 23, 42, 0.38);
    box-sizing: border-box;
    animation: fade 0.15s ease both;
  }

  .panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: calc(100dvh - 48px);
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 24px 64px rgba(15, 23, 42, 0.28);
    font-family: 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    color: #334155;
    outline: none;
    animation: lift 0.18s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px 18px 14px 22px;
    border-bottom: 1px solid #e2e8f0;
  }

  .heading {
    flex: 1;
    min-width: 0;
  }

  h2 {
    margin: 0;
    font-family: 'Sora', 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
  }

  .subtitle {
    margin: 4px 0 0;
    font-size: 12px;
    color: #64748b;
  }

  .close {
    flex: none;
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 6px;
    background: none;
    font-size: 18px;
    line-height: 1;
    color: #64748b;
    cursor: pointer;
  }

  .close:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  .body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 18px 22px 22px;
  }

  footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding: 12px 22px;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 0 0 12px 12px;
  }

  @keyframes fade {
    from {
      opacity: 0;
    }
  }

  @keyframes lift {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.99);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .backdrop,
    .panel {
      animation: none;
    }
  }
</style>

<div class="backdrop" use:portal role="presentation" onpointerdown={(e) => e.target === e.currentTarget && onclose()}>
  <div class="panel" role="dialog" aria-modal="true" aria-label={title} tabindex="-1" bind:this={panel}
       style="max-width: {width}px" onkeydown={keydown}>
    <header>
      <div class="heading">
        <h2>{title}</h2>
        {#if subtitle}
          <p class="subtitle">{subtitle}</p>
        {/if}
      </div>
      <button type="button" class="close" aria-label="Close" onclick={onclose}>×</button>
    </header>
    <div class="body">
      {@render children()}
    </div>
    {#if footer}
      <footer>
        {@render footer()}
      </footer>
    {/if}
  </div>
</div>
