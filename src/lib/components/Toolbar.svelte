<script>
  let { tool, onpick, onimage, elementsOpen = false, ontoggleelements, showHints = true,
        tools = null, general = null, special = null, automations = false, canplacedoors = false, canfurnish = false, onplacedoors, onfurnish } = $props();

  const PRIMARY = [
    { id: "select", label: "Select", key: "S", ready: true,
      hint: "Click to select, Ctrl+click to add, drag on empty space to select an area. Drag to move. On a selected room or floor: drag a corner or an edge handle to reshape (Alt+drag an edge moves it freely), click a corner to round it, Alt+drag a corner to pull out curve handles. Double-click a room to rename it. Align and lock from the options bar." },
    { id: "pan", label: "Pan", key: "H", ready: true,
      hint: "Drag to move the view. Middle mouse or Space + drag also pans. The wheel zooms." },
    { id: "floor", label: "Floor outline", key: "F", ready: true, hidden: true, hint: "Click to place corners. Shift keeps edges straight. Enter or click the first corner to close. Backspace removes the last corner, Esc cancels." },
    { id: "room-rect", label: "Rectangle", key: "R", ready: true,
      hint: "Click two opposite corners. Esc cancels. Choose Floor, Room or Wall in the options bar." },
    { id: "room-poly", label: "Polygon", key: "P", ready: true, hint: "Click to place corners. Shift keeps edges straight. Enter or click the first corner to close. Backspace removes the last corner, Esc cancels. Choose Floor, Room or Wall in the options bar. A wall can stay open: press Enter or click the last corner again." },
    { id: "curve", label: "Curve", key: "C", ready: true,
      hint: "Works like the pen in Illustrator: click to place a corner, click and drag to place a smooth point with curve handles. Shift keeps edges straight and handles at 45°. Enter or click the first point to close. Backspace removes the last point, Esc cancels. Choose Floor, Room or Wall in the options bar. A wall can stay open: press Enter or click the last point again." }
  ];

  PRIMARY.push({ id: "pipe", label: "Pipe", key: "P", ready: true,
    hint: "Click an element to start a pipe; it snaps to the nearest connection point along the element. Hold Ctrl and click to add bend points on the grid that the trace has to pass through. Click another element to connect. Backspace removes the last bend point, Esc cancels. Choose Supply, Return or Other in the options bar." });

  PRIMARY.push({ id: "text", label: "Text", key: "T", ready: true,
    hint: "Click to place a text and type. Enter confirms, Shift+Enter adds a line, Esc cancels. Double-click a text to edit it; size, colour and bold are in the options bar." });

  const SHOW_LEGACY = false;

  const LEGACY = [
    { id: "line", label: "Line", key: "L", ready: true,
      hint: "Click two points for a Manhattan trace. R cycles the routing, Esc cancels." },
    { id: "rect", label: "Rectangle", key: "D", ready: true, hint: "Click two opposite corners. Esc cancels." }
  ];
</script>

<style>
  .toolbar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 0;
    background: #ffffff;
    border-right: 1px solid #e2e8f0;
    box-sizing: border-box;
    position: relative;
    z-index: 10;
  }

  .divider {
    width: 28px;
    height: 1px;
    margin: 6px 0;
    background: #e2e8f0;
  }

  button {
    position: relative;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: #475569;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  button:hover {
    background: #eff6ff;
    color: #1d4ed8;
  }

  button.active {
    border-color: #2563eb;
    background: #eff6ff;
    color: #1d4ed8;
    box-shadow: inset 0 0 0 1px #2563eb;
  }

  button:focus-visible {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  button[aria-disabled="true"] {
    color: #cbd5e1;
    cursor: not-allowed;
  }

  button[aria-disabled="true"]:hover {
    background: #f8fafc;
  }

  svg {
    width: 22px;
    height: 22px;
  }

  .tooltip {
    position: absolute;
    left: calc(100% + 10px);
    top: 50%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    width: max-content;
    max-width: 260px;
    padding: 6px 10px;
    border-radius: 6px;
    background: #0f172a;
    color: #f8fafc;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transform: translate(-4px, -50%);
    transition: opacity 0.12s ease, transform 0.12s ease;
  }

  button:hover .tooltip,
  button:focus-visible .tooltip {
    opacity: 1;
    transform: translate(0, -50%);
  }

  kbd {
    padding: 0 5px;
    border: 1px solid #334155;
    border-radius: 4px;
    font-family: inherit;
    font-size: 11px;
    color: #94a3b8;
  }

  .soon {
    font-weight: 400;
    color: #94a3b8;
  }

  .tooltip-title {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }

  .tooltip-hint {
    font-size: 11.5px;
    font-weight: 400;
    line-height: 1.4;
    color: #cbd5e1;
    white-space: normal;
  }

  @media (prefers-reduced-motion: reduce) {
    button,
    .tooltip {
      transition: none;
    }
  }
</style>

{#snippet toolButton(entry)}
  <button type="button" class:active={tool === entry.id}
          aria-label={entry.label} aria-pressed={tool === entry.id} aria-disabled={!entry.ready}
          onclick={() => entry.ready && onpick(entry.id)}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      {#if entry.id === "select"}
        <path d="M6 3 L6 18 L10 14 L13 21 L15.5 20 L12.5 13 L18 13 Z" fill="currentColor" stroke="none"/>
      {:else if entry.id === "pan"}
        <path d="M12 3 V21 M3 12 H21"/>
        <path d="M9 6 L12 3 L15 6 M9 18 L12 21 L15 18 M6 9 L3 12 L6 15 M18 9 L21 12 L18 15"/>
      {:else if entry.id === "floor"}
        <path d="M4 4 H14 V10 H20 V20 H4 Z" stroke-width="2.4"/>
      {:else if entry.id === "room-rect"}
        <rect x="3.5" y="5" width="17" height="14" rx="1"/>
      {:else if entry.id === "room-poly"}
        <path d="M5 9 L12 3.5 L20 7.5 L18 20 L6.5 18.5 Z"/>
        <circle cx="5" cy="9" r="1.6" fill="currentColor" stroke="none"/>
        <circle cx="12" cy="3.5" r="1.6" fill="currentColor" stroke="none"/>
        <circle cx="20" cy="7.5" r="1.6" fill="currentColor" stroke="none"/>
        <circle cx="18" cy="20" r="1.6" fill="currentColor" stroke="none"/>
        <circle cx="6.5" cy="18.5" r="1.6" fill="currentColor" stroke="none"/>
      {:else if entry.id === "curve"}
        <path d="M4 18 Q 12 0 20 18"/>
        <circle cx="4" cy="18" r="2" fill="currentColor" stroke="none"/>
        <circle cx="20" cy="18" r="2" fill="currentColor" stroke="none"/>
      {:else if entry.id === "pipe"}
        <path d="M4 6 H11 V18 H20" stroke-width="2.6"/>
        <rect x="2" y="3.5" width="4" height="5" rx="1" fill="currentColor" stroke="none"/>
        <rect x="18" y="15.5" width="4" height="5" rx="1" fill="currentColor" stroke="none"/>
      {:else if entry.id === "text"}
        <path d="M5 7 V4.5 H19 V7"/>
        <path d="M12 4.5 V19.5"/>
        <path d="M9 19.5 H15"/>
      {:else if entry.id === "line"}
        <path d="M5 7 L14 7 L14 17 L19 17"/>
        <circle cx="5" cy="7" r="2" fill="currentColor" stroke="none"/>
        <circle cx="19" cy="17" r="2" fill="currentColor" stroke="none"/>
      {:else}
        <rect x="4" y="6" width="16" height="12" rx="1"/>
      {/if}
    </svg>
    <span class="tooltip" role="tooltip">
      <span class="tooltip-title">
        {entry.label}
        {#if entry.key}<kbd>{entry.key}</kbd>{/if}
        {#if !entry.ready}<span class="soon">coming soon</span>{/if}
      </span>
      {#if entry.hint && showHints}<span class="tooltip-hint">{entry.hint}</span>{/if}
    </span>
  </button>
{/snippet}

<nav class="toolbar" aria-label="Tools">
  <!-- {#each PRIMARY.filter((entry) => !entry.hidden) as entry (entry.id)} -->
  <!--
  {#each PRIMARY.filter((entry) => !entry.hidden && (!tools || tools.includes(entry.id))) as entry (entry.id)}
    {@render toolButton(entry)}
  {/each}
  -->
  {#if general}
    {#each general.map((id) => PRIMARY.find((entry) => entry.id === id)).filter((entry) => entry && !entry.hidden) as entry (entry.id)}
      {@render toolButton(entry)}
    {/each}
    {#if special?.length}
      <div class="divider" role="separator"></div>
      {#each special.map((id) => PRIMARY.find((entry) => entry.id === id)).filter((entry) => entry && !entry.hidden) as entry (entry.id)}
        {@render toolButton(entry)}
      {/each}
    {/if}
  {:else}
    {#each PRIMARY.filter((entry) => !entry.hidden && (!tools || tools.includes(entry.id))) as entry (entry.id)}
      {@render toolButton(entry)}
    {/each}
  {/if}
  <div class="divider" role="separator"></div>
  <button type="button" aria-label="Reference image" onclick={onimage}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/>
      <circle cx="9" cy="10" r="1.6"/>
      <path d="M4 17 L9.5 12.5 L13 15.5 L16 13 L20 16.5"/>
    </svg>
    <span class="tooltip" role="tooltip">
      <span class="tooltip-title">Reference image</span>
      {#if showHints}<span class="tooltip-hint">Open an image to trace over. You can also paste a screenshot anywhere with Ctrl+V. It can be moved, scaled, locked and faded, and is not exported.</span>{/if}
    </span>
  </button>
  <button type="button" class:active={elementsOpen} aria-label="Elements" aria-pressed={elementsOpen} onclick={ontoggleelements}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1.5"/>
      <rect x="13" y="4" width="7" height="7" rx="1.5"/>
      <rect x="4" y="13" width="7" height="7" rx="1.5"/>
      <circle cx="16.5" cy="16.5" r="3.5"/>
    </svg>
    <span class="tooltip" role="tooltip">
      <span class="tooltip-title">Elements</span>
      {#if showHints}<span class="tooltip-hint">Open the element library: doors and furniture by category. Click one, then click inside a room to place it.</span>{/if}
    </span>
  </button>
  {#if automations}
    <div class="divider" role="separator"></div>
    <button type="button" aria-label="Place doors" aria-disabled={!canplacedoors}
            onclick={() => canplacedoors && onplacedoors()}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 21 H21"/>
        <path d="M6 21 V5 H13"/>
        <path d="M6 5 L14 8 V21"/>
        <circle cx="11.5" cy="13.5" r="0.9" fill="currentColor" stroke="none"/>
      </svg>
      <span class="tooltip" role="tooltip">
        <span class="tooltip-title">Place doors</span>
        {#if showHints}<span class="tooltip-hint">Put a door on every room that has none yet. Doors go on a wall facing the corridor where possible.</span>{/if}
      </span>
    </button>
    <button type="button" aria-label="Furnish rooms" aria-disabled={!canfurnish}
            onclick={() => canfurnish && onfurnish()}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="5" width="12" height="7" rx="1"/>
        <rect x="16" y="5" width="5" height="7" rx="1"/>
        <rect x="6.5" y="14.5" width="5" height="5" rx="1.5"/>
      </svg>
      <span class="tooltip" role="tooltip">
        <span class="tooltip-title">Furnish rooms</span>
        {#if showHints}<span class="tooltip-hint">Lay out furniture in every room that has a category and no furniture yet. Place doors first so they stay clear.</span>{/if}
      </span>
    </button>
  {/if}
  {#if SHOW_LEGACY}
    <div class="divider" role="separator"></div>
    {#each LEGACY as entry (entry.id)}
      {@render toolButton(entry)}
    {/each}
  {/if}
</nav>
