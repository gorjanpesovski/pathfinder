<svelte:options namespace="svg"/>

<script>
  let { item } = $props();

  const W = 240;
  const HUB_NODES = [0.1507, 0.3243, 0.4979, 0.6715, 0.8451];
  const H = 80;
  const INK = "#414142";
  const FONT = "Roboto, 'IBM Plex Sans', sans-serif";

  let detailed = $derived(item.device === "ip" || item.device === "rtu");
  let transform = $derived([
    item.rotation ? `rotate(${item.rotation} ${item.cx} ${item.cy})` : "",
    `translate(${item.cx - item.width / 2} ${item.cy - item.height / 2})`,
    `scale(${item.width / W} ${item.height / H})`
  ].join(" "));

  function fit(text, limit){
    return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
  }
</script>

<g {transform}>
  <rect x="0" y="0" width={W} height={H} rx="2.4" fill="#E0E0E1" stroke={INK} stroke-width="3"/>
  {#each item.device === "hub" ? HUB_NODES : [0.5] as fraction}
    <rect x={W * fraction - 15} y="-4" width="30" height="5" rx="2.5" fill={INK}/>
    <rect x={W * fraction - 15} y={H - 1} width="30" height="5" rx="2.5" fill={INK}/>
  {/each}
  <rect x="-4" y={H / 2 - 15} width="5" height="30" rx="2.5" fill={INK}/>
  <rect x={W - 1} y={H / 2 - 15} width="5" height="30" rx="2.5" fill={INK}/>
  {#if detailed}
    <text x="10" y="22" font-family={FONT} font-size="18" font-weight="bold" fill={INK}>{fit(item.name, 20)}</text>
    <text x="10" y="46" font-family={FONT} font-size="18" fill={INK}>{fit(item.address, 15)}</text>
    <text x="10" y="70" font-family={FONT} font-size="18" font-weight="bold" fill="#2A7A53">GOOD</text>
    <text x="196" y="46" font-family={FONT} font-size="18" fill={INK}>S</text>
    <text x="196" y="70" font-family={FONT} font-size="18" fill={INK}>R</text>
    <circle cx="222" cy="40" r="8" fill="#6B7280" stroke={INK} stroke-width="1.5"/>
    <circle cx="222" cy="64" r="8" fill="#6B7280" stroke={INK} stroke-width="1.5"/>
  {:else if item.device === "gateway"}
    <text x={W / 2} y="36" text-anchor="middle" font-family={FONT} font-size="18" font-weight="bold" fill={INK}>{fit(item.name, 22)}</text>
    <text x={W / 2} y="60" text-anchor="middle" font-family={FONT} font-size="18" fill={INK}>{fit(item.address, 22)}</text>
  {:else}
    <text x={W / 2} y={H / 2 + 6} text-anchor="middle" font-family={FONT} font-size="18" font-weight="bold" fill={INK}>{fit(item.name, 22)}</text>
  {/if}
</g>
