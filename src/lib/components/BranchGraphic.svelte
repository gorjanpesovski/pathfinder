<svelte:options namespace="svg"/>

<script>
  import { HYDRONIC_ELEMENTS } from "$lib/hydronic/elements.js";
  import { BRANCH_GEOMETRY as G, branchParams, branchColors } from "$lib/hydronic/branch.js";
  import { rotationOf, uprightSize } from "$lib/hydronic/frame.js";

  let { element } = $props();

  const INK = "#414142";
  const FONT = "Roboto, 'IBM Plex Sans', sans-serif";
  const VALVE_Y = 561;

  let spec = $derived(HYDRONIC_ELEMENTS[element.type]);
  let params = $derived(branchParams(element));
  let colors = $derived(branchColors(params));
  let pumpSide = $derived(params.pump_config === "Return Side" ? "return" : params.pump_config === "Supply Side" ? "supply" : null);
  let valveSide = $derived(params.energy_valve_config === "Return Side" ? "return" : params.energy_valve_config === "Supply Side" ? "supply" : null);
  let threeWay = $derived(params.valve_type === "3-way");
  let metering = $derived(!!valveSide && params.energy_metering);
  let upright = $derived(uprightSize(element));

  function pipeX(side){
    return side === "return" ? G.returnX : G.supplyX;
  }

  const METERING = {
    return: {
      sensors: [[154.23, 541.49], [216.8, 489.67]],
      links: ["215.7,520.6 171.3,520.6 171.3,490.2 209.4,490.2", "204.2,541.5 157.3,541.5"],
      value: [284.04, 538.8]
    },
    supply: {
      sensors: [[156.64, 489.94], [217.1, 541.1]],
      links: ["165.7,520.1 210.1,520.1 210.1,489.6 164.3,489.6", "213.9,541 166.9,541"],
      value: [81.94, 538.8]
    }
  };
</script>

{#snippet icon(type, cx, cy, width, height, rotation = 0)}
  <g transform="translate({cx} {cy}) rotate({rotation})">
    <use href="#hyd-{type}" x={-width / 2} y={-height / 2} {width} {height}/>
  </g>
{/snippet}

{#snippet readout(cx, cy, text)}
  <rect x={cx - 40} y={cy - 20} width="80" height="40" rx="2" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.5"/>
  <text x={cx} y={cy + 5.5} text-anchor="middle" font-family={FONT} font-size="16" fill={INK}>{text}</text>
{/snippet}

<!-- <g transform="translate({element.x} {element.y}) scale({element.width / spec.width} {element.height / spec.height})"> -->
<g transform="translate({element.x + element.width / 2} {element.y + element.height / 2}) rotate({rotationOf(element)}) translate({-upright.width / 2} {-upright.height / 2}) scale({upright.width / spec.width} {upright.height / spec.height})">
  {#if params.bypass}
    <line x1={G.supplyX} y1="442.787" x2={G.returnX} y2="442.787" stroke={colors.supply} stroke-width="4"/>
  {/if}
  <line x1={G.supplyX} y1={G.supplyTop} x2={G.supplyX} y2={G.supplyBottom} stroke={colors.supply} stroke-width="7"/>
  <line x1={G.returnX} y1={G.returnTop} x2={G.returnX} y2={G.returnBottom} stroke={colors.return} stroke-width="7"/>
  {#if valveSide && threeWay}
    <line x1={G.supplyX} y1={VALVE_Y} x2={G.returnX} y2={VALVE_Y} stroke={colors.return} stroke-width="7"/>
  {/if}

  {#if pumpSide}
    {@render icon("pump", pipeX(pumpSide), 387.855, 55, 55, pumpSide === "return" ? 90 : -90)}
  {/if}

  {#if params.supply_side_temperature_sensor}
    {@render icon("tempProbe", 154.14, 295.46, 28.4, 28.4)}
    {@render readout(87.814, 274.649, "--.- °C")}
    {@render readout(87.814, 317.399, "--.- °C")}
    <text x="20.46" y="280.64" font-family={FONT} font-size="18" fill={INK}>S:</text>
    <text x="21.96" y="323.456" font-family={FONT} font-size="18" fill={INK}>T:</text>
  {/if}
  {#if params.return_side_temperature_sensor}
    {@render icon("tempProbe", 216.83, 295.46, 28.4, 28.4)}
    {@render readout(277.598, 296.049, "--.- °C")}
  {/if}

  {#if valveSide}
    {#if metering}
      {@const layout = METERING[valveSide]}
      {#each layout.links as points}
        <polyline {points} fill="none" stroke={INK} stroke-width="2" stroke-dasharray="3,3"/>
      {/each}
      {#each layout.sensors as [cx, cy]}
        <circle {cx} {cy} r="10" fill="#FFFFFF" stroke={INK} stroke-width="2"/>
        <text x={cx} y={cy + 3.5} text-anchor="middle" font-family="Arial" font-size="10" font-weight="bold" fill={INK}>T</text>
      {/each}
      {@render readout(layout.value[0], layout.value[1], "-- %")}
    {/if}
    {@render icon(threeWay ? "threeWayValve" : "controlValve", pipeX(valveSide), VALVE_Y, 34, 56, valveSide === "return" ? 90 : -90)}
  {/if}

  {#if params.bypass}
    {@render icon("checkValve", 184.6, 442.53, 37.09, 19.22, 180)}
  {/if}

  <circle cx="185.332" cy="209.159" r="30.839" fill="#FFFFFF" stroke={INK} stroke-width="6"/>
  <circle cx="185.332" cy="209.159" r="17.622" fill="#FFFFFF" stroke={INK} stroke-width="6"/>

  <g font-family={FONT} font-size="22" text-anchor="middle" fill={INK}>
    <text x="185.333" y="40.748" font-weight="bold">{element.name ?? ""}</text>
    <text x="185.333" y="77.7" fill-opacity="0.6">{params.temperature_range}</text>
    <text x="185.333" y="114.653" fill-opacity="0.6">{params.power}</text>
    <text x="185.333" y="151.605" fill-opacity="0.6">{params.flow}</text>
  </g>
</g>
