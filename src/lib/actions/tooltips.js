const GAP = 8;
const DELAY = 450;
const WARM = 400;
const EDGE = 8;

function parse(text){
  const [head, ...rest] = String(text).split(" · ");
  const shortcut = /\s*\(([^()]+)\)\s*$/.exec(head);
  return {
    title: shortcut ? head.slice(0, shortcut.index) : head,
    keys: shortcut?.[1] ?? null,
    hint: rest.join(" · ")
  };
}

function build(){
  const tip = document.createElement("div");
  tip.setAttribute("role", "tooltip");
  Object.assign(tip.style, {
    position: "fixed",
    left: "0px",
    top: "0px",
    zIndex: "90",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "4px",
    width: "max-content",
    maxWidth: "260px",
    padding: "6px 10px",
    borderRadius: "6px",
    background: "#0f172a",
    color: "#f8fafc",
    fontFamily: "'IBM Plex Sans', 'Segoe UI', Arial, sans-serif",
    fontSize: "12px",
    fontWeight: "600",
    pointerEvents: "none",
    opacity: "0",
    transform: "translateY(-4px)",
    transition: matchMedia("(prefers-reduced-motion: reduce)").matches ? "none" : "opacity 0.12s ease, transform 0.12s ease"
  });
  return tip;
}

function fill(tip, text){
  const { title, keys, hint } = parse(text);
  tip.replaceChildren();
  const head = document.createElement("span");
  Object.assign(head.style, { display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" });
  head.append(title);
  if (keys) {
    const kbd = document.createElement("kbd");
    Object.assign(kbd.style, { padding: "0 5px", border: "1px solid #334155", borderRadius: "4px", fontFamily: "inherit", fontSize: "11px", color: "#94a3b8" });
    kbd.textContent = keys;
    head.append(kbd);
  }
  tip.append(head);
  if (hint) {
    const line = document.createElement("span");
    Object.assign(line.style, { fontSize: "11.5px", fontWeight: "400", lineHeight: "1.4", color: "#cbd5e1", whiteSpace: "normal" });
    line.textContent = hint;
    tip.append(line);
  }
}

export function tooltips(node){
  const tip = build();
  let current = null;
  let timer = null;
  let hiddenAt = 0;
  let shown = false;

  function targetOf(element){
    const found = element?.closest?.("[title], [data-tip]");
    return found && node.contains(found) ? found : null;
  }

  function show(target){
    if (target.hasAttribute("title")) {
      target.dataset.tip = target.getAttribute("title");
      target.removeAttribute("title");
    }
    if (!target.dataset.tip) return;
    current = target;
    shown = true;
    fill(tip, target.dataset.tip);
    if (!tip.isConnected) document.body.append(tip);
    const box = target.getBoundingClientRect();
    const width = tip.offsetWidth;
    const height = tip.offsetHeight;
    const below = box.bottom + GAP + height <= window.innerHeight - EDGE;
    const left = Math.min(window.innerWidth - width - EDGE, Math.max(EDGE, box.left + box.width / 2 - width / 2));
    tip.style.left = `${left}px`;
    tip.style.top = `${below ? box.bottom + GAP : box.top - GAP - height}px`;
    tip.style.transform = `translateY(${below ? -4 : 4}px)`;
    requestAnimationFrame(() => {
      if (current !== target) return;
      tip.style.opacity = "1";
      tip.style.transform = "translateY(0)";
    });
  }

  function hide(){
    clearTimeout(timer);
    if (shown) hiddenAt = Date.now();
    shown = false;
    current = null;
    tip.style.opacity = "0";
  }

  function later(target){
    clearTimeout(timer);
    current = target;
    if (target.hasAttribute("title")) {
      target.dataset.tip = target.getAttribute("title");
      target.removeAttribute("title");
    }
    timer = setTimeout(() => current === target && show(target), Date.now() - hiddenAt < WARM ? 0 : DELAY);
  }

  function over(event){
    const target = targetOf(event.target);
    if (target && target !== current) later(target);
  }

  function out(event){
    if (!current) return;
    const next = targetOf(event.relatedTarget);
    if (next !== current) hide();
  }

  function focus(event){
    const target = targetOf(event.target);
    if (target && event.target.matches?.(":focus-visible")) later(target);
  }

  node.addEventListener("pointerover", over);
  node.addEventListener("pointerout", out);
  node.addEventListener("pointerdown", hide);
  node.addEventListener("focusin", focus);
  node.addEventListener("focusout", hide);
  window.addEventListener("scroll", hide, true);

  return {
    destroy(){
      clearTimeout(timer);
      node.removeEventListener("pointerover", over);
      node.removeEventListener("pointerout", out);
      node.removeEventListener("pointerdown", hide);
      node.removeEventListener("focusin", focus);
      node.removeEventListener("focusout", hide);
      window.removeEventListener("scroll", hide, true);
      tip.remove();
    }
  };
}
