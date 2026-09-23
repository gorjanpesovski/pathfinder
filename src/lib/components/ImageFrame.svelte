<svelte:options namespace="svg"/>

<script>
  let { image, zoom } = $props();

  const COLOR = "#2563EB";
  const CORNERS = [
    { id: "nw", cursor: "nwse-resize" },
    { id: "ne", cursor: "nesw-resize" },
    { id: "se", cursor: "nwse-resize" },
    { id: "sw", cursor: "nesw-resize" }
  ];

  let size = $derived(10 / zoom);

  function cornerPoint(id){
    return {
      x: id.includes("w") ? image.x : image.x + image.width,
      y: id.includes("n") ? image.y : image.y + image.height
    };
  }
</script>

<style>
  .handle {
    transition: fill 0.1s ease;
  }

  .handle:hover {
    fill: #93c5fd;
    stroke: #1d4ed8;
  }
</style>

<g class="image-frame">
  <rect x={image.x} y={image.y} width={image.width} height={image.height} fill="none"
        stroke={COLOR} stroke-width="1.5" vector-effect="non-scaling-stroke" pointer-events="none"/>
  {#each CORNERS as corner}
    {@const point = cornerPoint(corner.id)}
    <rect class="handle" x={point.x - size / 2} y={point.y - size / 2} width={size} height={size}
          fill="#FFFFFF" stroke={COLOR} stroke-width="1.5" vector-effect="non-scaling-stroke"
          style="cursor: {corner.cursor}" data-shape-id={image.id} data-image-handle={corner.id} role="presentation"/>
  {/each}
</g>
