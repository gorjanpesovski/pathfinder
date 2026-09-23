<svelte:options namespace="svg"/>

<script>
  import { ROOM_STYLE, THERMOSTAT, thermostatRect, thermostatText, thermostatGlobalScale } from "$lib/tools/rooms.js";

  let { shapes, style = ROOM_STYLE, interactive } = $props();

  let regulated = $derived(shapes.filter((shape) => shape.kind === "room" && shape.regulated));
  let cardScale = $derived(thermostatGlobalScale(shapes, style));
</script>

<style>
  .thermostat-box {
    cursor: move;
    transition: stroke 0.1s ease;
  }

  .thermostat-box:hover {
    stroke: #2563eb;
  }

  text {
    pointer-events: none;
    user-select: none;
  }
</style>

<g class="thermostat-layer">
  {#each regulated as shape (shape.id)}
    {@const card = thermostatRect(shape, style, cardScale)}
    {@const text = thermostatText(card)}
    <g class="thermostat">
      <rect x={card.x} y={card.y + 3 * card.scale} width={card.width} height={card.height} rx={THERMOSTAT.radius * card.scale}
            fill={THERMOSTAT.shadow} fill-opacity="0.08" pointer-events="none"/>
      <rect class="thermostat-box" x={card.x} y={card.y} width={card.width} height={card.height} rx={THERMOSTAT.radius * card.scale}
            fill={THERMOSTAT.fill} stroke={THERMOSTAT.border} stroke-width="1" vector-effect="non-scaling-stroke"
            data-shape-id={shape.id} data-thermostat="" pointer-events={interactive && !shape.locked ? "all" : "none"}
            role="presentation"/>
      <text x={text.name.x} y={text.name.y} text-anchor="middle" font-family={style.labelFont} font-size={text.name.size}
            font-weight="bold" fill={THERMOSTAT.nameColor}>{shape.name}</text>
      <text x={text.value.x} y={text.value.y} text-anchor="middle" font-family={style.labelFont} font-size={text.value.size}
            font-weight="bold" fill={THERMOSTAT.valueColor}>{THERMOSTAT.placeholder}</text>
      <text x={text.status.x} y={text.status.y} text-anchor="middle" font-family={style.labelFont} font-size={text.status.size}
            fill={THERMOSTAT.statusColor}>{THERMOSTAT.placeholder}</text>
    </g>
  {/each}
</g>
