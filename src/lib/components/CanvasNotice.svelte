<script>
  import { fade } from "svelte/transition";

  let { message } = $props();
</script>

<style>
  .canvas-notice {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 5;
    padding: 7px 14px;
    border-radius: 999px;
    background: #0f172a;
    color: #f8fafc;
    font-size: 12.5px;
    font-weight: 600;
    white-space: nowrap;
    pointer-events: none;
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.18);
  }
</style>

{#if message}
  <div class="canvas-notice" role="status" transition:fade={{ duration: 150 }}>{message}</div>
{/if}
