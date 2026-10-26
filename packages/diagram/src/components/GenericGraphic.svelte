<svelte:options namespace="svg"/>

<script>
  let { item } = $props();

  const FONT = "Roboto, 'IBM Plex Sans', sans-serif";

  let transform = $derived(item.rotation ? `rotate(${item.rotation} ${item.cx} ${item.cy})` : undefined);
</script>

<g {transform}>
  <rect x={item.cx - item.width / 2} y={item.cy - item.height / 2} width={item.width} height={item.height} rx="10" ry="10"
        fill="#FFFFFF" stroke="#9CA9BF" stroke-width="1" style="filter: drop-shadow(0 5px 5px rgba(0, 0, 0, 0.3))"/>
  <text x={item.cx} y={item.cy + item.fontSize * 0.35} text-anchor="middle" font-family={FONT} font-size={item.fontSize} fill="#475569">{item.name}</text>
</g>
