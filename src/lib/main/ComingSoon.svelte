<script>
  import { base } from "$app/paths";
  import { suiteEntry } from "./suite.js";

  let { id } = $props();

  let tool = $derived(suiteEntry(id));
</script>

<svelte:head>
  <title>{tool.name} — Pathfinder</title>
</svelte:head>

<div class="page">
  <a class="brand" href="{base}/" title="Back to Main">
    <img src="{base}/logo.svg" alt="Pathfinder">
  </a>
  <div class="card">
    <img class="icon" src={tool.icon} alt="">
    <h1>{tool.name}</h1>
    <p>{tool.tagline} is coming soon.</p>
    <a class="back" href="{base}/">Back to Main</a>
  </div>
</div>

<style>
  .page {
    box-sizing: border-box;
    position: fixed;
    inset: 0;
    padding: 24px 32px;
    background: #f1f5f9;
    font-family: 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
  }

  .brand img {
    width: 36px;
    height: 36px;
  }

  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 340px;
    margin: 120px auto 0;
    padding: 32px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    text-align: center;
  }

  .icon {
    width: 64px;
    height: 64px;
  }

  h1 {
    margin: 8px 0 0;
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
  }

  p {
    margin: 0 0 12px;
    font-size: 13px;
    color: #475569;
  }

  .back {
    height: 32px;
    padding: 0 14px;
    border: 1px solid #2563eb;
    border-radius: 6px;
    background: #2563eb;
    font-size: 13px;
    font-weight: 600;
    line-height: 32px;
    color: #ffffff;
    text-decoration: none;
  }

  .back:hover {
    background: #1d4ed8;
  }
</style>
