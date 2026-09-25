<script>
  import { TEXT_FONT, TEXT_LINE } from "$lib/tools/text.js";

  let { x, y, zoom = 1, shape, oncommit, oncancel } = $props();

  let area;
  let ready = false;
  let done = false;
  let rows = $state(Math.max(1, String(shape.text ?? "").split("\n").length));

  $effect(() => {
    const timer = setTimeout(() => {
      area?.focus();
      area?.select();
      ready = true;
    }, 0);
    return () => clearTimeout(timer);
  });

  function commit(){
    if (done || !ready) return;
    done = true;
    oncommit(area.value);
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
</script>

<style>
  textarea {
    position: absolute;
    z-index: 6;
    min-width: 60px;
    margin: 0;
    padding: 0 2px;
    border: none;
    outline: 2px solid #2563eb;
    outline-offset: 2px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.92);
    resize: none;
    overflow: hidden;
    white-space: pre;
    box-sizing: content-box;
  }
</style>

<textarea bind:this={area} value={shape.text} aria-label="Text" {rows} spellcheck="false"
          style="left: {x - 2}px; top: {y}px; font-family: {TEXT_FONT}; font-size: {shape.fontSize * zoom}px; line-height: {TEXT_LINE}; font-weight: {shape.bold ? 700 : 400}; color: {shape.color}; width: {Math.max(60, shape.width * zoom + 24)}px"
          oninput={(event) => rows = Math.max(1, event.currentTarget.value.split('\n').length)}
          onkeydown={handleKey} onblur={commit}
          onpointerdown={(event) => event.stopPropagation()}></textarea>
