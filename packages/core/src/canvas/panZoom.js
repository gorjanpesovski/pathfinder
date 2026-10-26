const WHEEL_SPEED = 0.0015;
const PINCH_SPEED = 0.01;

function claimsSpace(target){
  return target instanceof HTMLInputElement
    || target instanceof HTMLSelectElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLButtonElement
    || (target instanceof HTMLElement && target.isContentEditable);
}

export function panZoom(node, params){
  let viewport = params.viewport;
  let panTool = params.panTool;
  let spaceHeld = false;
  let drag = null;
  let swallowClick = false;

  function localPoint(event){
    const box = node.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  function paint(){
    if (drag) node.dataset.pan = "active";
    else if (spaceHeld || panTool) node.dataset.pan = "ready";
    else delete node.dataset.pan;
  }

  function onWheel(event){
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? node.clientHeight : 1;
    const speed = event.ctrlKey ? PINCH_SPEED : WHEEL_SPEED;
    const factor = Math.exp(-event.deltaY * unit * speed);
    viewport.zoomAt(localPoint(event), viewport.zoom * factor);
  }

  function onPointerDown(event){
    swallowClick = false;
    const wantsPan = event.button === 1 || (event.button === 0 && (spaceHeld || panTool));
    if (!wantsPan) return;

    event.preventDefault();
    event.stopPropagation();
    node.setPointerCapture(event.pointerId);
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    swallowClick = event.button === 0;
    paint();
  }

  function onPointerMove(event){
    if (!drag || event.pointerId !== drag.id) return;
    viewport.panBy(event.clientX - drag.x, event.clientY - drag.y);
    drag.x = event.clientX;
    drag.y = event.clientY;
  }

  function onPointerUp(event){
    if (!drag || event.pointerId !== drag.id) return;
    if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
    drag = null;
    paint();
  }

  function onClick(event){
    if (!swallowClick) return;
    swallowClick = false;
    event.preventDefault();
    event.stopPropagation();
  }

  function onMouseDown(event){
    if (event.button === 1) event.preventDefault();
  }

  function onKeyDown(event){
    if (event.code !== "Space" || claimsSpace(event.target)) return;
    event.preventDefault();
    if (spaceHeld) return;
    spaceHeld = true;
    paint();
  }

  function onKeyUp(event){
    if (event.code !== "Space" || !spaceHeld) return;
    event.preventDefault();
    spaceHeld = false;
    paint();
  }

  function onBlur(){
    spaceHeld = false;
    paint();
  }

  node.addEventListener("wheel", onWheel, { passive: false });
  node.addEventListener("pointerdown", onPointerDown, { capture: true });
  node.addEventListener("pointermove", onPointerMove);
  node.addEventListener("pointerup", onPointerUp);
  node.addEventListener("pointercancel", onPointerUp);
  node.addEventListener("click", onClick, { capture: true });
  node.addEventListener("mousedown", onMouseDown);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  paint();

  return {
    update(next){
      viewport = next.viewport;
      panTool = next.panTool;
      paint();
    },
    destroy(){
      node.removeEventListener("wheel", onWheel);
      node.removeEventListener("pointerdown", onPointerDown, { capture: true });
      node.removeEventListener("pointermove", onPointerMove);
      node.removeEventListener("pointerup", onPointerUp);
      node.removeEventListener("pointercancel", onPointerUp);
      node.removeEventListener("click", onClick, { capture: true });
      node.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    }
  };
}
