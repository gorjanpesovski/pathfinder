<script>
  let { x, y, value, oncommit, oncancel } = $props();

  let input;
  let ready = false;
  let done = false;

  $effect(() => {
    const timer = setTimeout(() => {
      input?.focus();
      input?.select();
      ready = true;
    }, 0);
    return () => clearTimeout(timer);
  });

  function commit(){
    if (done || !ready) return;
    done = true;
    oncommit(input.value);
  }

  function cancel(){
    done = true;
    oncancel();
  }

  function handleKey(event){
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    }
  }
</script>

<style>
  input {
    position: absolute;
    z-index: 6;
    width: 180px;
    height: 30px;
    padding: 4px 10px;
    border: 2px solid #2563eb;
    border-radius: 6px;
    background: #ffffff;
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.18);
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
    text-align: center;
    transform: translate(-50%, -50%);
    box-sizing: border-box;
    outline: none;
  }
</style>

<input bind:this={input} type="text" {value} aria-label="Room name"
       style="left: {x}px; top: {y}px"
       onkeydown={handleKey} onblur={commit}
       onpointerdown={(event) => event.stopPropagation()}>
