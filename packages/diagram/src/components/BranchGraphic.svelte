<svelte:options namespace="svg"/>

<script>
  let { parts } = $props();

  const FONT = "Roboto, 'IBM Plex Sans', sans-serif";
</script>

{#each parts as part}
  {#if part.kind === "drain"}
    <circle cx={part.cx} cy={part.cy} r={part.outer} fill="#FFFFFF" stroke="#414142" stroke-width={part.stroke}/>
    <circle cx={part.cx} cy={part.cy} r={part.inner} fill="#FFFFFF" stroke="#414142" stroke-width={part.stroke}/>
  {:else}
    <text x={part.x} y={part.baseline} text-anchor="middle" font-family={FONT} font-size={part.size}
          font-weight={part.bold ? "bold" : undefined} fill={part.color}>{part.text}</text>
  {/if}
{/each}
