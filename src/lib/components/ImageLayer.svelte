<svelte:options namespace="svg"/>

<script>
  let { shapes, sources, interactive } = $props();

  let images = $derived(shapes.filter((shape) => shape.kind === "image"));
</script>

<style>
  .hit {
    cursor: move;
  }
</style>

<g class="image-layer">
  {#each images as image (image.id)}
    {#if sources[image.imageId]}
      <image href={sources[image.imageId]} x={image.x} y={image.y} width={image.width} height={image.height}
             opacity={image.opacity} preserveAspectRatio="none" data-shape-id={image.id}
             class:hit={interactive && !image.locked}
             pointer-events={interactive && !image.locked ? "all" : "none"} role="presentation"/>
    {/if}
  {/each}
</g>
