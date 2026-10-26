<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { base } from "$app/paths";
  import { cleanDocumentName } from "@pathfinder/core/document.js";
  import { readDocument } from "$lib/editor/documents.js";
  import { appById } from "$lib/editor/apps.js";
  import { SUITE, suiteEntry } from "./suite.js";
  import { recentFiles, removeRecent, queueOpen } from "./recent.js";
  import { resumeRoute } from "./session.js";
  import PreferencesDialog from "./PreferencesDialog.svelte";

  const versions = __APP_VERSIONS__;
  const FILE_TYPES = [{ description: "Pathfinder drawing", accept: { "application/json": [".json"] } }];

  let ready = $state(false);
  let recent = $state.raw([]);
  let notice = $state("");
  let preferencesOpen = $state(false);

  onMount(() => {
    const route = resumeRoute();
    if (route) {
      goto(`${base}${route}`, { replaceState: true });
      return;
    }
    ready = true;
    refresh();
  });

  async function refresh(){
    recent = await recentFiles();
  }

  function launch(file){
    let doc;
    try {
      doc = readDocument(file.text, cleanDocumentName(file.name));
    } catch (error) {
      notice = `Could not open ${file.name}: ${error.message}`;
      return;
    }
    const app = doc.legacy ? (doc.parts[doc.app] ? doc.app : Object.keys(doc.parts)[0]) : doc.app;
    if (!app) {
      notice = `${file.name} has no drawings to open`;
      return;
    }
    queueOpen(file);
    goto(`${base}/${appById(app).route}`);
  }

  async function openRecent(entry){
    notice = "";
    try {
      if ((await entry.handle.queryPermission({ mode: "readwrite" })) !== "granted") await entry.handle.requestPermission({ mode: "readwrite" });
      const file = await entry.handle.getFile();
      launch({ text: await file.text(), name: entry.handle.name, handle: entry.handle });
    } catch (error) {
      if (error?.name === "NotFoundError") {
        await removeRecent(entry.handle);
        await refresh();
        notice = `${entry.name} was moved or deleted, so it was taken off the list`;
        return;
      }
      if (error?.name !== "AbortError") notice = `Could not open ${entry.name}: ${error.message}`;
    }
  }

  async function forget(entry){
    await removeRecent(entry.handle);
    await refresh();
  }

  async function openFile(){
    notice = "";
    try {
      if (typeof window.showOpenFilePicker === "function") {
        const [handle] = await window.showOpenFilePicker({ types: FILE_TYPES, id: "pathfinder-project" });
        const file = await handle.getFile();
        launch({ text: await file.text(), name: handle.name, handle });
        return;
      }
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,application/json";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (file) launch({ text: await file.text(), name: file.name, handle: null });
      };
      input.click();
    } catch (error) {
      if (error?.name !== "AbortError") notice = `Could not open the file: ${error.message}`;
    }
  }

  function when(time){
    const date = new Date(time);
    const today = new Date();
    const sameDay = date.toDateString() === today.toDateString();
    return sameDay
      ? `Today ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : date.toLocaleDateString([], { day: "numeric", month: "short", year: date.getFullYear() === today.getFullYear() ? undefined : "numeric" });
  }
</script>

<svelte:head>
  <title>Pathfinder</title>
</svelte:head>

{#if ready}
  <div class="main">
    <header>
      <a class="brand" href="{base}/">
        <img src="{base}/logo.svg" alt="">
        <span class="brand-text">
          <span class="brand-name">Pathfinder</span>
          <span class="brand-tagline">atvise Engineering Tools {__APP_VERSION__}</span>
        </span>
      </a>
      <button type="button" class="preferences" onclick={() => preferencesOpen = true}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 2.6h3.4l.5 2.6c.6.2 1.2.6 1.7 1l2.5-.9 1.7 2.9-2 1.7c.1.6.1 1.3 0 1.9l2 1.7-1.7 2.9-2.5-.9c-.5.4-1.1.8-1.7 1l-.5 2.6h-3.4l-.5-2.6c-.6-.2-1.2-.6-1.7-1l-2.5.9-1.7-2.9 2-1.7c-.1-.6-.1-1.3 0-1.9l-2-1.7 1.7-2.9 2.5.9c.5-.4 1.1-.8 1.7-1z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
        Preferences
      </button>
    </header>

    <section class="tools" aria-label="Apps">
      {#each SUITE as tool, index (tool.id)}
        {#if tool.soon}
          <div class="tool soon" style="--delay: {index * 0.04}s">
            <img class="tool-icon" src={tool.icon} alt="">
            <span class="tool-text">
              <span class="tool-name">{tool.name}</span>
              <span class="tool-tagline">{tool.tagline}</span>
            </span>
            <span class="badge">Coming soon</span>
          </div>
        {:else}
          <a class="tool" href="{base}/{tool.route}" style="--delay: {index * 0.04}s">
            <img class="tool-icon" src={tool.icon} alt="">
            <span class="tool-text">
              <span class="tool-name">{tool.name}</span>
              <span class="tool-tagline">{tool.tagline}</span>
            </span>
            {#if versions[tool.id]}<span class="version">{versions[tool.id]}</span>{/if}
          </a>
        {/if}
      {/each}
    </section>

    <section class="recent" aria-label="Recent files">
      <div class="recent-head">
        <h2>Recent files</h2>
        <button type="button" class="open" onclick={openFile}>Open file…</button>
      </div>
      {#if recent.length}
        <ul>
          {#each recent as entry (entry.time + entry.name)}
            {@const tool = suiteEntry(entry.app)}
            <li>
              <button type="button" class="file" onclick={() => openRecent(entry)} title="Open {entry.name}">
                {#if tool}<img src={tool.icon} alt="">{/if}
                <span class="file-name">{entry.name.replace(/\.pathfinder\.json$/i, "")}</span>
                <span class="file-app">{tool?.name ?? ""}</span>
                <span class="file-time">{when(entry.time)}</span>
              </button>
              <button type="button" class="forget" aria-label="Remove {entry.name} from the list" title="Remove from the list" onclick={() => forget(entry)}>×</button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="empty">Files you open or save in the drawing apps show up here.</p>
      {/if}
      {#if notice}<p class="notice" role="status">{notice}</p>{/if}
    </section>
  </div>
{/if}

{#if preferencesOpen}
  <PreferencesDialog onclose={() => preferencesOpen = false}/>
{/if}

<style>
  .main {
    box-sizing: border-box;
    position: fixed;
    inset: 0;
    overflow: auto;
    padding: 24px 32px 48px;
    background: #f1f5f9;
    font-family: 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif;
    color: #0f172a;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1100px;
    margin: 0 auto;
  }

  .preferences {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: #ffffff;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
  }

  .preferences:hover {
    background: #f8fafc;
  }

  .preferences svg {
    width: 16px;
    height: 16px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    color: inherit;
    text-decoration: none;
  }

  .brand img {
    width: 36px;
    height: 36px;
  }

  .brand-text {
    display: flex;
    flex-direction: column;
  }

  .brand-name {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
  }

  .brand-tagline {
    font-size: 11px;
    color: #475569;
  }

  .tools {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    max-width: 1100px;
    margin: 72px auto 0;
  }

  .tool {
    position: relative;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 22px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    color: inherit;
    text-decoration: none;
    animation: rise 0.32s ease-out both;
    animation-delay: var(--delay);
    transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
  }

  a.tool:hover {
    border-color: #93c5fd;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
    transform: translateY(-1px);
  }

  a.tool:focus-visible {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  .tool.soon {
    opacity: 0.6;
  }

  .tool-icon {
    flex: none;
    width: 52px;
    height: 52px;
  }

  .tool-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .tool-name {
    font-size: 17px;
    font-weight: 600;
    color: #1e293b;
  }

  .tool-tagline {
    font-size: 12px;
    color: #475569;
  }

  .version,
  .badge {
    position: absolute;
    top: 10px;
    right: 12px;
    font-size: 11px;
    color: #94a3b8;
  }

  .badge {
    padding: 2px 8px;
    border-radius: 999px;
    background: #f1f5f9;
    color: #64748b;
    font-weight: 500;
  }

  .recent {
    max-width: 1100px;
    margin: 48px auto 0;
  }

  .recent-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  h2 {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #64748b;
  }

  .open {
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

  .open:hover {
    background: #f8fafc;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    overflow: hidden;
  }

  li {
    display: flex;
    align-items: center;
  }

  li + li {
    border-top: 1px solid #e2e8f0;
  }

  .file {
    flex: 1;
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr) 160px 110px;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border: none;
    background: none;
    font-family: inherit;
    font-size: 13px;
    color: #0f172a;
    text-align: left;
    cursor: pointer;
  }

  .file:hover {
    background: #f8fafc;
  }

  .file img {
    width: 24px;
    height: 24px;
  }

  .file-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }

  .file-app,
  .file-time {
    font-size: 12px;
    color: #64748b;
  }

  .file-time {
    text-align: right;
  }

  .forget {
    width: 32px;
    height: 32px;
    margin-right: 8px;
    border: none;
    border-radius: 6px;
    background: none;
    font-size: 16px;
    color: #94a3b8;
    cursor: pointer;
  }

  .forget:hover {
    background: #f1f5f9;
    color: #475569;
  }

  .empty,
  .notice {
    margin: 0;
    font-size: 13px;
    color: #64748b;
  }

  .notice {
    margin-top: 10px;
    color: #b45309;
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tool {
      animation: none;
      transition: none;
    }
  }
</style>
