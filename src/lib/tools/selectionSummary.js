import { HYDRONIC_ELEMENTS, METER_MEASURES, mediumOf } from "../hydronic/elements.js";
import { TANK_PROBES, hasTankProbes } from "../hydronic/tank.js";
import { meterOptions, meterReadouts, readoutSpec, readoutScaleOf } from "../hydronic/readout.js";
import { hasNameLabel, nameSizeOf } from "../hydronic/label.js";

function common(list, read){
  if (!list.length) return null;
  const first = read(list[0]);
  return list.every((entry) => read(entry) === first) ? first : null;
}

function commonView(list){
  const keys = new Set(list.flatMap((entry) => Object.keys(entry.params ?? {})));
  const params = {};
  for (const key of keys) {
    const first = JSON.stringify(list[0].params?.[key]);
    if (list.every((entry) => JSON.stringify(entry.params?.[key]) === first)) params[key] = list[0].params?.[key];
  }
  return { id: list[0].id, type: list[0].type, name: list.length === 1 ? list[0].name : null, params, count: list.length };
}

function sameKind(list, read){
  return list.length > 0 && list.every((entry) => read(entry) && read(entry) === read(list[0]));
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
  const generics = elements.filter((element) => HYDRONIC_ELEMENTS[element.type].generic);
  const measured = fittings.filter((entry) => readoutSpec(entry.fitting.type));
  const meters = measured.filter((entry) => meterOptions(entry.fitting.type).length);
  const plain = measured.filter((entry) => !meterOptions(entry.fitting.type).length);
  const measures = [...new Set(plain.map((entry) => readoutSpec(entry.fitting.type).measure))];
  const offered = new Set(meters.flatMap((entry) => meterOptions(entry.fitting.type).map((measure) => measure.id)));

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
      generics: generics.length,
      fontSize: common(generics, (element) => element.fontSize > 0 ? element.fontSize : HYDRONIC_ELEMENTS[element.type].fontSize),
      tanks: tanks.length ? Object.fromEntries(TANK_PROBES.map((probe) => [probe.id, state(tanks, (tank) => !!tank.probes?.[probe.id])])) : null,
      bars: bars.length,
      barMedium: common(bars, (bar) => mediumOf(bar.medium).id),
      branch: elements.find((element) => HYDRONIC_ELEMENTS[element.type].branch) ?? null,
      single: elements.length === 1 ? elements[0] : null,
      device: sameKind(elements, (element) => HYDRONIC_ELEMENTS[element.type].device) ? commonView(elements) : null,
      electric: elements.every((element) => HYDRONIC_ELEMENTS[element.type].electric),
      wiring: sameKind(elements, (element) => HYDRONIC_ELEMENTS[element.type].electric && element.type) ? commonView(elements) : null
    } : null,
    pipes: pipes.length ? {
      count: pipes.length,
      medium: common([...pipes, ...bars], (entry) => mediumOf(entry.medium).id),
      width: common(pipes, (pipe) => pipe.width ?? fallback.pipeWidth)
    } : null,
    fittings: fittings.length ? {
      count: fittings.length,
      name: fittings.length === 1 ? fittings[0].fitting.name ?? "" : null,
      label: common(fittings, (entry) => HYDRONIC_ELEMENTS[entry.fitting.type]?.label ?? entry.fitting.type),
      scale: common(fittings, (entry) => entry.fitting.scale ?? 1),
      shownScale: fittings[0].fitting.scale ?? 1,
      measured: plain.length,
      measure: measures.length === 1 ? measures[0] : null,
      readout: common(plain, (entry) => entry.fitting.readout ?? "none"),
      meters: meters.length ? METER_MEASURES.filter((measure) => offered.has(measure.id)).map((measure) => {
        const able = meters.filter((entry) => meterOptions(entry.fitting.type).some((option) => option.id === measure.id));
        return { id: measure.id, name: measure.name, unit: measure.unit, state: state(able, (entry) => meterReadouts(entry.fitting).includes(measure.id)) };
      }) : null,
      sized: measured.length,
      readoutScale: common(measured, (entry) => readoutScaleOf(entry.fitting)),
      moved: measured.some((entry) => entry.fitting.readoutOffset),
      nameSize: common(fittings, (entry) => nameSizeOf(entry.fitting)),
      turnable: fallback.turnable ?? 0,
      flippable: fittings.filter((entry) => HYDRONIC_ELEMENTS[entry.fitting.type]?.orient !== "upright").length
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
