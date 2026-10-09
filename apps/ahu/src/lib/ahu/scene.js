import { ICONS } from "$lib/iconSprite.js";
import { ELEMENT_TYPES, INDICATORS, LINES, MEASURES, RECUPERATION_TYPES, setpointId } from "./elements.js";
import { registersOf } from "./registers.js";

export const READOUT = {
    labelWidth: 44,
    boxWidth: 100,
    rowHeight: 40,
    rowGap: 6,
    gap: 24,
    labelSize: 18
};

const DP = { reach: 30, rise: 34 };
const SPACING = { min: 64, end: 64 };
const LINE_LABEL_SIZE = 24;
const INK = "#414142";

export function readoutRows(element){
    const spec = ELEMENT_TYPES[element.type];
    const chosen = element.readouts ?? [];
    const rows = [];
    const setpoints = spec.setpoints.filter((id) => chosen.includes(setpointId(id))).length;
    for (const id of spec.measures) {
        const measure = MEASURES[id];
        if (chosen.includes(id)) rows.push({ kind: id, label: measure.label, unit: measure.unit, decimals: measure.decimals, setpoint: false });
        if (spec.setpoints.includes(id) && chosen.includes(setpointId(id))) {
            rows.push({ kind: setpointId(id), label: setpoints > 1 ? `S${measure.label}` : "S:", unit: measure.unit, decimals: measure.decimals, setpoint: true });
        }
    }
    return rows.length === 1 ? rows.map((row) => ({ ...row, label: "" })) : rows;
}

function readoutExtent(rows, scale){
    const labels = rows.some((row) => row.label) ? READOUT.labelWidth : 0;
    return {
        width: (READOUT.boxWidth + 2 * labels) * scale,
        height: (rows.length * READOUT.rowHeight + Math.max(0, rows.length - 1) * READOUT.rowGap) * scale
    };
}

function chosenIndicators(element){
    const allowed = ELEMENT_TYPES[element.type].indicators;
    return (element.indicators ?? []).filter((id) => allowed.includes(id));
}

function address(prefix, register){
    return register ? `${prefix}${register}` : null;
}

function indicatorIcon(id, element, cx, cy, scale, target){
    const indicator = INDICATORS[id];
    const k = indicator.scale * scale;
    return {
        kind: "icon", id: `${element.key}_${id}`, sprite: indicator.sprite, slot: id,
        x: cx - indicator.width * k / 2, y: cy - indicator.height * k / 2, k, width: indicator.width, height: indicator.height,
        args: target ? { base: target } : {}
    };
}

function measure(elements, scale){
    return elements
        .filter((element) => ELEMENT_TYPES[element.type])
        .map((element) => {
            const spec = ELEMENT_TYPES[element.type];
            const k = (spec.scale ?? 1) * scale;
            const rows = readoutRows(element);
            const readout = readoutExtent(rows, scale);
            const indicators = chosenIndicators(element);
            const icon = spec.width * k;
            const bracket = indicators.includes("dpSwitch") ? icon + 2 * DP.reach * scale : 0;
            return { element, spec, k, rows, readout, indicators, icon, slot: Math.max(icon, bracket, rows.length ? readout.width : 0) };
        });
}

function spread(columns, start, end, scale){
    const distance = end - start;
    const compact = columns.reduce((sum, column) => sum + column.slot, 0) > distance;
    const widths = columns.map((column) => compact ? column.icon : column.slot);
    const total = widths.reduce((sum, width) => sum + width, 0);
    const free = distance - total;
    const count = widths.length;
    const margin = count > 1 ? Math.max(0, Math.min(free / count / 2, SPACING.end * scale)) : 0;
    let gap = count > 1 ? (free - 2 * margin) / (count - 1) : 0;
    if (count > 1 && gap < SPACING.min * scale) gap = Math.min(free / (count - 1), SPACING.min * scale);
    let cursor = start + (distance - total - gap * (count - 1)) / 2;
    const centers = widths.map((width) => {
        const center = cursor + width / 2;
        cursor += width + gap;
        return center;
    });
    return { centers, compact };
}

function between(entries, first, last, compact){
    const widths = entries.map((entry) => compact ? entry.icon : entry.slot);
    const inner = widths.slice(1, -1).reduce((sum, width) => sum + width, 0);
    const gap = (last - first - widths[0] / 2 - widths.at(-1) / 2 - inner) / (entries.length - 1);
    let cursor = first + widths[0] / 2 + gap;
    return entries.map((_, index) => {
        if (index === 0) return first;
        if (index === entries.length - 1) return last;
        const center = cursor + widths[index] / 2;
        cursor += widths[index] + gap;
        return center;
    });
}

export function sideCenters(first, second, start, end, scale){
    const a = measure(first, scale);
    const b = measure(second, scale);
    const [long, short] = a.length >= b.length ? [a, b] : [b, a];
    const centers = new Map();
    if (!long.length) return centers;

    const columns = long.map((entry) => ({ icon: entry.icon, slot: entry.slot }));
    const merge = (column, entry) => {
        column.icon = Math.max(column.icon, entry.icon);
        column.slot = Math.max(column.slot, entry.slot);
    };
    if (short.length > 1) {
        merge(columns[0], short[0]);
        merge(columns.at(-1), short.at(-1));
    }

    const { centers: positions, compact } = spread(columns, start, end, scale);
    long.forEach((entry, index) => centers.set(entry.element.key, positions[index]));
    if (short.length === 1) {
        centers.set(short[0].element.key, (positions[0] + positions.at(-1)) / 2);
    } else if (short.length > 1) {
        between(short, positions[0], positions.at(-1), compact).forEach((center, index) => centers.set(short[index].element.key, center));
    }
    return centers;
}

export function lineItems({ elements, y, outward, scale, controller, prefix, centers }){
    const placed = measure(elements, scale);
    if (!placed.length) return [];

    const items = [];
    for (const { element, spec, k, rows, readout, indicators } of placed) {
        const first = items.length;
        const registers = registersOf(controller, element);
        const cx = centers.get(element.key);
        const iconWidth = spec.width * k;
        const iconHeight = spec.height * k;
        const iconX = cx - iconWidth / 2;
        const iconY = y - (spec.axis ?? spec.height / 2) * k;
        const base = spec.baseMeasure ? address(prefix, registers[spec.baseMeasure]) : null;

        items.push({ kind: "icon", id: element.key, center: cx, sprite: spec.sprite, slot: element.type, x: iconX, y: iconY, k, width: spec.width, height: spec.height, args: base ? { base } : {} });

        let ceiling = iconY;
        if (indicators.includes("dpSwitch")) {
            const size = INDICATORS.dpSwitch.height * INDICATORS.dpSwitch.scale * scale;
            const py = iconY - DP.rise * scale - size / 2;
            ceiling = py - size / 2;
            const left = iconX - DP.reach * scale;
            const right = iconX + iconWidth + DP.reach * scale;
            const half = size / 2;
            items.push({ kind: "polyline", id: `${element.key}_dp_left`, points: `${left},${y} ${left},${py} ${cx - half},${py}`, color: INK, width: 1.5, dash: "6 4" });
            items.push({ kind: "polyline", id: `${element.key}_dp_right`, points: `${cx + half},${py} ${right},${py} ${right},${y}`, color: INK, width: 1.5, dash: "6 4" });
            items.push(indicatorIcon("dpSwitch", element, cx, py, scale, address(prefix, registers.dpSwitch)));
        }

        if (rows.length) {
            const top = outward < 0 ? ceiling - READOUT.gap * scale - readout.height : iconY + iconHeight + READOUT.gap * scale;
            const boxX = cx - READOUT.boxWidth * scale / 2;
            rows.forEach((row, index) => {
                const rowY = top + index * (READOUT.rowHeight + READOUT.rowGap) * scale;
                const id = `${element.key}_${row.kind.replace(":", "_")}`;
                const register = registers[row.kind];
                if (row.label) {
                    items.push({ kind: "text", id: `${id}_label`, text: row.label, x: boxX - 8 * scale, y: rowY + (READOUT.rowHeight / 2 + 6.5) * scale, size: READOUT.labelSize * scale, anchor: "end", color: INK });
                }
                items.push({
                    kind: "field", id,
                    x: boxX, y: rowY, width: READOUT.boxWidth * scale, height: READOUT.rowHeight * scale,
                    unit: row.unit, decimals: row.decimals,
                    address: address(prefix, register),
                    editable: row.setpoint && !!register?.startsWith(".CMD_")
                });
            });
        }

        if (indicators.includes("alarm")) {
            items.push(indicatorIcon("alarm", element, cx, iconY + iconHeight / 2, scale, address(prefix, registers.alarm)));
        }

        for (let index = first; index < items.length; index += 1) items[index].owner = element.key;
    }
    return items;
}

function chevron(tipX, y, direction){
    const back = tipX - direction * 20;
    return `${back},${y - 10} ${tipX},${y} ${back},${y + 10}`;
}

export function frameItems({ xLeft, xRight, xCenter, exhaustY, intakeY, returnY, supplyY, topY, displayWidth, displayHeight, recuperation, recuperationWidth, recuperationHeight }){
    const ends = [
        { line: "exhaust", y: exhaustY, side: "left", direction: -1 },
        { line: "intake", y: intakeY, side: "left", direction: 1 },
        { line: "return", y: returnY, side: "right", direction: -1 },
        { line: "supply", y: supplyY, side: "right", direction: 1 }
    ];

    const under = ends.map(({ line, y, side }) => ({
        kind: "polyline", id: `${line}_line`, points: `${side === "left" ? xLeft : xRight},${y} ${xCenter},${y}`, color: LINES[line].color, width: 10
    }));

    const icon = ICONS[RECUPERATION_TYPES[recuperation].sprite];
    const over = [{
        kind: "icon", id: "recuperation_unit", owner: "recuperation", center: xCenter, sprite: RECUPERATION_TYPES[recuperation].sprite, slot: recuperation,
        x: xCenter - recuperationWidth / 2, y: displayHeight / 2 - recuperationHeight / 2,
        k: recuperationWidth / icon.width, width: icon.width, height: icon.height, args: {}
    }];

    for (const { line, y, side, direction } of ends) {
        const tip = side === "left"
            ? (direction < 0 ? xLeft - 30 : xLeft - 10)
            : (direction < 0 ? xRight + 10 : xRight + 30);
        const below = y === topY;
        over.push({ kind: "polyline", id: `${line}_arrow`, points: chevron(tip, y, direction), color: LINES[line].color, width: 6, round: true });
        over.push({
            kind: "text", id: `${line}_label`, text: LINES[line].label,
            x: side === "left" ? 24 : displayWidth - 24, y: below ? y + 44 + LINE_LABEL_SIZE * 0.75 : y - 44,
            size: LINE_LABEL_SIZE, anchor: side === "left" ? "start" : "end", color: INK
        });
    }

    return { under, over };
}
