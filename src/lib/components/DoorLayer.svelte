<svelte:options namespace="svg"/>

<script>
  import { doorGeometry, partWidth } from "$lib/tools/doors.js";
  import { ROOM_STYLE } from "$lib/tools/rooms.js";

  let { shapes, style = ROOM_STYLE, background, selectedDoors = [], interactive } = $props();

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
        {@const selected = selectedDoors.some((entry) => entry.roomId === room.id && entry.id === door.id)}
        <line x1={geometry.p0.x} y1={geometry.p0.y} x2={geometry.p1.x} y2={geometry.p1.y}
              stroke={background} stroke-width={gap} pointer-events="none"/>
        <path class="door-hit" class:selected d={geometry.wedge} stroke="none"
              pointer-events={interactive && !room.locked ? "all" : "none"}
              data-shape-id={room.id} data-door-id={door.id} role="presentation"/>
        {#each geometry.parts as part}
          {#if part.kind === "arc"}
            <path d={part.d} fill="none" stroke={style.doorColor} stroke-width="1.5" pointer-events="none"/>
          {:else}
            <line x1={part.from.x} y1={part.from.y} x2={part.to.x} y2={part.to.y} stroke={style.doorColor}
                  stroke-width={partWidth(part)} stroke-linecap={part.kind === "leaf" || part.kind === "panel" ? "round" : "butt"} pointer-events="none"/>
          {/if}
        {/each}
        {#if selected}
          <path d={geometry.wedge} fill="none" stroke={HIGHLIGHT} stroke-width="2"
                vector-effect="non-scaling-stroke" pointer-events="none"/>
        {/if}
      {/if}
    {/each}
  {/each}
</g>
