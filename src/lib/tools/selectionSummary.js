import { HYDRONIC_ELEMENTS, mediumOf } from "../hydronic/elements.js";
import { TANK_PROBES, hasTankProbes } from "../hydronic/tank.js";
import { readoutSpec } from "../hydronic/readout.js";
import { hasNameLabel, nameSizeOf } from "../hydronic/label.js";

function common(list, read){
  if (!list.length) return null;
  const first = read(list[0]);
  return list.every((entry) => read(entry) === first) ? first : null;
}

function tenth(value){
  return Math.round(value * 10) / 10;
}

function state(list, test){
  const on = list.filter(test).length;
  return on === 0 ? "none" : on === list.length ? "all" : "mixed";
}

export function summarizeSelection(shapes, fittings = [], fallback = {}){
  const elements = shapes.filter((shape) => shape.kind === "equipment" && HYDRONIC_ELEMENTS[shape.type]);
  const pipes = shapes.filter((shape) => shape.kind === "pipe");
  const texts = shapes.filter((shape) => shape.kind === "text");
  if (!elements.length && !pipes.length && !texts.length && !fittings.length) return null;

  const tanks = elements.filter(hasTankProbes);
  const bars = elements.filter((element) => HYDRONIC_ELEMENTS[element.type].bar);
  const labelled = elements.filter(hasNameLabel);
  const measured = fittings.filter((entry) => readoutSpec(entry.fitting.type));
  const measures = [...new Set(measured.map((entry) => readoutSpec(entry.fitting.type).measure))];

  return {
    total: shapes.length + fittings.length,
    kinds: [elements, pipes, fittings, texts].filter((list) => list.length).length,
    elements: elements.length ? {
      count: elements.length,
      label: common(elements, (element) => HYDRONIC_ELEMENTS[element.type].label),
      width: common(elements, (element) => tenth(element.width)),
      height: common(elements, (element) => tenth(element.height)),
      labelled: labelled.length,
      nameSize: common(labelled, nameSizeOf),
      tanks: tanks.length ? Object.fromEntries(TANK_PROBES.map((probe) => [probe.id, state(tanks, (tank) => !!tank.probes?.[probe.id])])) : null,
      bars: bars.length,
      barMedium: common(bars, (bar) => mediumOf(bar.medium).id),
      branch: elements.find((element) => HYDRONIC_ELEMENTS[element.type].branch) ?? null
    } : null,
    pipes: pipes.length ? {
      count: pipes.length,
      medium: common([...pipes, ...bars], (entry) => mediumOf(entry.medium).id),
      width: common(pipes, (pipe) => pipe.width ?? fallback.pipeWidth)
    } : null,
    fittings: fittings.length ? {
      count: fittings.length,
      label: common(fittings, (entry) => HYDRONIC_ELEMENTS[entry.fitting.type]?.label ?? entry.fitting.type),
      scale: common(fittings, (entry) => entry.fitting.scale ?? 1),
      shownScale: fittings[0].fitting.scale ?? 1,
      measured: measured.length,
      measure: measures.length === 1 ? measures[0] : null,
      readout: common(measured, (entry) => entry.fitting.readout ?? "none"),
      moved: measured.some((entry) => entry.fitting.readoutOffset),
      nameSize: common(fittings, (entry) => nameSizeOf(entry.fitting)),
      flippable: fittings.length - measured.length
    } : null,
    texts: texts.length ? {
      count: texts.length,
      alone: texts.length === 1 && shapes.length === 1 && fittings.length === 0,
      fontSize: common(texts, (text) => text.fontSize),
      color: common(texts, (text) => text.color) ?? texts[0].color,
      bold: texts.every((text) => text.bold)
    } : null
  };
}
