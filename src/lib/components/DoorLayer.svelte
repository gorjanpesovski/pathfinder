<svelte:options namespace="svg"/>

<script>
  import { doorGeometry } from "$lib/tools/doors.js";
  import { ROOM_STYLE } from "$lib/tools/rooms.js";

  let { shapes, style = ROOM_STYLE, background, selectedDoor = null, interactive } = $props();

  const HIGHLIGHT = "#F59E0B";

  let rooms = $derived(shapes.filter((shape) => shape.kind === "room" && shape.doors?.length));
  let gap = $derived(Math.max(style.floorWidth, style.roomWidth) + 2);
</script>

<style>
  .door-hit {
    cursor: move;
    fill: transparent;
    transition: fill 0.1s ease;
  }

  .door-hit:hover {
    fill: rgba(147, 197, 253, 0.45);
  }

  .door-hit.selected {
    fill: rgba(37, 99, 235, 0.15);
  }
</style>

<g class="door-layer">
  {#each rooms as room (room.id)}
    {#each room.doors as door (door.id)}
      {@const geometry = doorGeometry(room, door)}
      {#if geometry}
        {@const selected = selectedDoor?.roomId === room.id && selectedDoor?.doorId === door.id}
        <line x1={geometry.p0.x} y1={geometry.p0.y} x2={geometry.p1.x} y2={geometry.p1.y}
              stroke={background} stroke-width={gap} pointer-events="none"/>
        <path class="door-hit" class:selected d={geometry.wedge} stroke="none"
              pointer-events={interactive && !room.locked ? "all" : "none"}
              data-shape-id={room.id} data-door-id={door.id} role="presentation"/>
        <path d={geometry.swing} fill="none" stroke={style.doorColor} stroke-width="1.5" pointer-events="none"/>
        <line x1={geometry.hinge.x} y1={geometry.hinge.y} x2={geometry.leaf.x} y2={geometry.leaf.y}
              stroke={style.doorColor} stroke-width="4" stroke-linecap="round" pointer-events="none"/>
        {#if selected}
          <path d={geometry.wedge} fill="none" stroke={HIGHLIGHT} stroke-width="2"
                vector-effect="non-scaling-stroke" pointer-events="none"/>
        {/if}
      {/if}
    {/each}
  {/each}
</g>
