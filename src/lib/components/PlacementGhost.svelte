<svelte:options namespace="svg"/>

<script>
  import FurnitureShape from "./FurnitureShape.svelte";
  import { furnitureTransform } from "$lib/tools/furniture.js";
  import { doorGeometry } from "$lib/tools/doors.js";

  let { placement } = $props();

  let color = $derived(placement.valid ? "#2563EB" : "#DC2626");
  let geometry = $derived(placement.kind === "door" && placement.room ? doorGeometry(placement.room, placement.door) : null);
</script>

<g class="placement-ghost" pointer-events="none" opacity="0.85">
  {#if placement.kind === "furniture"}
    <g transform={furnitureTransform(placement.item)}>
      <FurnitureShape item={placement.item} stroke={color}/>
    </g>
  {:else if geometry}
    <line x1={geometry.p0.x} y1={geometry.p0.y} x2={geometry.p1.x} y2={geometry.p1.y}
          stroke={color} stroke-width="6" stroke-linecap="round" opacity="0.35"/>
    <path d={geometry.wedge} fill={color} fill-opacity="0.12" stroke="none"/>
    <path d={geometry.swing} fill="none" stroke={color} stroke-width="1.5" vector-effect="non-scaling-stroke"/>
    <line x1={geometry.hinge.x} y1={geometry.hinge.y} x2={geometry.leaf.x} y2={geometry.leaf.y}
          stroke={color} stroke-width="4" stroke-linecap="round"/>
  {/if}
</g>
