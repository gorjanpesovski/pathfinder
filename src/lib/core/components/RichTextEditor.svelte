<script>
  import { TEXT_FONT, TEXT_ALIGNS, lineOf, textParagraphs, runStyle, baseStyle, richFrom } from "$lib/core/tools/text.js";

  let { x, y, zoom = 1, shape, oncommit, oncancel } = $props();

  const SWATCHES = ["#1E293B", "#DC2626", "#2563EB", "#16A34A", "#EA580C", "#64748B"];

  let wrapper;
  let editable;
  let saved = null;
  let ready = false;
  let done = false;
  let align = $state(TEXT_ALIGNS.includes(shape.align) ? shape.align : "left");
  let active = $state({ bold: false, italic: false, underline: false });
  let sizeValue = $state(shape.fontSize ?? 16);
  let colorValue = $state(shape.color ?? "#1E293B");

  const base = baseStyle(shape);

  function escapeHtml(value){
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function runCss(style){
    return [
      `font-size:${style.size * zoom}px`,
      `font-weight:${style.bold ? 700 : 400}`,
      `font-style:${style.italic ? "italic" : "normal"}`,
      `text-decoration-line:${style.underline ? "underline" : "none"}`,
      `color:${style.color}`
    ].join(";");
  }

  function initialHtml(){
    return textParagraphs(shape).map((paragraph) => {
      const runs = (paragraph.runs ?? []).filter((run) => run.text);
      if (!runs.length) return "<div><br></div>";
      return `<div>${runs.map((run) => `<span style="${runCss(runStyle(shape, run))}">${escapeHtml(run.text)}</span>`).join("")}</div>`;
    }).join("");
  }

  $effect(() => {
    editable.innerHTML = initialHtml();
    const timer = setTimeout(() => {
      editable.focus();
      const range = document.createRange();
      range.selectNodeContents(editable);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      saved = range.cloneRange();
      ready = true;
    }, 0);
    document.addEventListener("selectionchange", track);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("selectionchange", track);
    };
  });

  function track(){
    const selection = window.getSelection();
    if (!selection?.rangeCount || !editable?.contains(selection.anchorNode)) return;
    saved = selection.getRangeAt(0).cloneRange();
    active = {
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline")
    };
    const node = selection.anchorNode?.nodeType === 3 ? selection.anchorNode.parentElement : selection.anchorNode;
    if (node instanceof Element) {
      const computed = getComputedStyle(node);
      sizeValue = Math.round(parseFloat(computed.fontSize) / zoom * 2) / 2;
      colorValue = hex(computed.color);
    }
  }

  function restore(){
    editable.focus();
    if (!saved) return;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(saved);
  }

  function command(name, value = null){
    restore();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(name, false, value);
    track();
  }

  function setSize(value){
    const size = Number(value);
    if (!(size >= 4 && size <= 200)) return;
    restore();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand("fontSize", false, "7");
    for (const element of editable.querySelectorAll("[style], font")) {
      if (element.style.fontSize === "xxx-large" || element.getAttribute("size") === "7") {
        element.removeAttribute("size");
        element.style.fontSize = `${size * zoom}px`;
      }
    }
    track();
  }

  function hex(value){
    const match = String(value).match(/\d+(\.\d+)?/g);
    if (!match || match.length < 3) return base.color;
    return `#${match.slice(0, 3).map((part) => Math.round(Number(part)).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
  }

  function isBlock(node){
    return node === editable || (node.nodeType === 1 && (node.tagName === "DIV" || node.tagName === "P"));
  }

  function underlined(element){
    for (let node = element; node && node !== editable.parentElement; node = node.parentElement) {
      if (node.tagName === "U" || getComputedStyle(node).textDecorationLine.includes("underline")) return true;
    }
    return false;
  }

  function styleOf(element){
    const computed = getComputedStyle(element);
    return {
      bold: Number(computed.fontWeight) >= 600,
      italic: computed.fontStyle === "italic",
      underline: underlined(element),
      size: Math.round(parseFloat(computed.fontSize) / zoom * 2) / 2,
      color: hex(computed.color)
    };
  }

  function read(){
    const lines = [[]];
    const walk = (node) => {
      for (const child of node.childNodes) {
        if (child.nodeType === 3) {
          if (child.previousSibling && isBlock(child.previousSibling)) lines.push([]);
          const style = styleOf(child.parentElement);
          String(child.nodeValue ?? "").replace(/ /g, " ").split("\n").forEach((part, index) => {
            if (index) lines.push([]);
            if (part) lines[lines.length - 1].push({ text: part, ...style });
          });
        } else if (child.nodeType === 1) {
          if (child.tagName === "BR") {
            if (child.nextSibling || !isBlock(child.parentNode)) lines.push([]);
          } else if (isBlock(child)) {
            if (child.previousSibling) lines.push([]);
            walk(child);
          } else walk(child);
        }
      }
    };
    walk(editable);
    return lines;
  }

  function commit(){
    if (done || !ready) return;
    done = true;
    const result = richFrom(shape, read());
    oncommit({ ...result, align });
  }

  function cancel(){
    done = true;
    oncancel();
  }

  function handleKey(event){
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    }
    event.stopPropagation();
  }

  function handlePaste(event){
    event.preventDefault();
    const text = event.clipboardData?.getData("text/plain") ?? "";
    document.execCommand("insertText", false, text);
  }

  function handleFocusOut(){
    setTimeout(() => {
      if (!wrapper?.contains(document.activeElement)) commit();
    }, 0);
  }

  function keep(event){
    if (event.target.tagName !== "INPUT") event.preventDefault();
  }
</script>

<style>
  .rich {
    position: absolute;
    z-index: 6;
  }

  .bar {
    position: absolute;
    bottom: calc(100% + 8px);
    left: -4px;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 3px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.15);
    white-space: nowrap;
    font: 12px system-ui, sans-serif;
    color: #1e293b;
  }

  .bar button {
    min-width: 24px;
    height: 24px;
    padding: 0 5px;
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .bar button:hover {
    background: #f1f5f9;
  }

  .bar button.on {
    border-color: #93c5fd;
    background: #dbeafe;
  }

  .bar .sep {
    width: 1px;
    height: 18px;
    margin: 0 3px;
    background: #e2e8f0;
  }

  .bar input[type="number"] {
    width: 44px;
    height: 22px;
    padding: 0 3px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    font: inherit;
  }

  .bar .swatch {
    min-width: 16px;
    width: 16px;
    height: 16px;
    padding: 0;
    border: 1px solid #cbd5e1;
    border-radius: 50%;
  }

  .bar input[type="color"] {
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    background: none;
  }

  .edit {
    min-width: 60px;
    padding: 0 2px;
    outline: 2px solid #2563eb;
    outline-offset: 2px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.92);
    box-sizing: content-box;
    overflow-wrap: break-word;
  }

  .edit :global(div) {
    min-height: 1em;
  }
</style>

<div class="rich" bind:this={wrapper} style="left: {x - 2}px; top: {y}px" role="presentation"
     onpointerdown={(event) => event.stopPropagation()} onfocusout={handleFocusOut}>
  <div class="bar" role="toolbar" aria-label="Text formatting" tabindex="-1" onmousedown={keep}>
    <button type="button" class:on={active.bold} aria-pressed={active.bold} title="Bold (Ctrl+B)" onclick={() => command("bold")}><b>B</b></button>
    <button type="button" class:on={active.italic} aria-pressed={active.italic} title="Italic (Ctrl+I)" onclick={() => command("italic")}><i>I</i></button>
    <button type="button" class:on={active.underline} aria-pressed={active.underline} title="Underline (Ctrl+U)" onclick={() => command("underline")}><u>U</u></button>
    <span class="sep"></span>
    <input type="number" min="4" max="200" step="1" value={sizeValue} title="Size of the selected text" aria-label="Size"
           onchange={(event) => setSize(event.currentTarget.value)}
           onkeydown={(event) => { event.stopPropagation(); if (event.key === "Enter") { event.preventDefault(); setSize(event.currentTarget.value); } }}>
    <span class="sep"></span>
    {#each SWATCHES as swatch (swatch)}
      <button type="button" class="swatch" style="background: {swatch}" title={swatch} aria-label="Colour {swatch}" onclick={() => command("foreColor", swatch)}></button>
    {/each}
    <input type="color" value={colorValue} title="Colour of the selected text" aria-label="Colour" onchange={(event) => command("foreColor", event.currentTarget.value)}>
    <span class="sep"></span>
    {#each TEXT_ALIGNS as option (option)}
      <button type="button" class:on={align === option} aria-pressed={align === option} title="Align {option}" onclick={() => { align = option; restore(); }}>
        <svg width="14" height="12" viewBox="0 0 14 12" aria-hidden="true">
          {#each [[0, 14], [1, 9], [2, 12], [3, 8]] as [row, length] (row)}
            {@const left = option === "left" ? 0 : option === "right" ? 14 - length : (14 - length) / 2}
            <line x1={left} x2={left + length} y1={row * 3 + 1.5} y2={row * 3 + 1.5} stroke="currentColor" stroke-width="1.5"/>
          {/each}
        </svg>
      </button>
    {/each}
  </div>
  <div class="edit" bind:this={editable} contenteditable="true" role="textbox" aria-multiline="true" aria-label="Text" tabindex="0" spellcheck="false"
       style="font-family: {TEXT_FONT}; font-size: {base.size * zoom}px; line-height: {lineOf(shape)}; font-weight: {base.bold ? 700 : 400}; font-style: {base.italic ? 'italic' : 'normal'}; text-decoration-line: {base.underline ? 'underline' : 'none'}; color: {base.color}; text-align: {align}; white-space: {shape.wrap ? 'pre-wrap' : 'pre'}; {shape.wrap ? `width: ${shape.wrap * zoom}px` : `min-width: ${Math.max(60, shape.width * zoom)}px`}"
       onkeydown={handleKey} onpaste={handlePaste}></div>
</div>
