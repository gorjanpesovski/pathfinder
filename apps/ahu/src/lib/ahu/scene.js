import { ICONS } from "$lib/iconSprite.js";
import { ELEMENT_TYPES, FITTINGS, INDICATORS, LINES, MEASURES, RECUPERATION_OPTIONS, RECUPERATION_TYPES, UNIT_OPTIONS, setpointId } from "./elements.js";
import { CONTROLLERS, groupRegisters, registersOf } from "./registers.js";

const MODE_PREFIX = "Način: ";

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

function round(value){
    return Math.abs(value) < 1e-9 ? 0 : value;
}

export function iconItem({ id, sprite, slot, cx, cy, k, width, height, axis = null, rotation = 0, flip = false, args = {} }){
    const turn = rotation * Math.PI / 180;
    const cos = round(Math.cos(turn));
    const sin = round(Math.sin(turn));
    const sx = flip ? -k : k;
    const a = cos * sx;
    const b = sin * sx;
    const c = -sin * k;
    const d = cos * k;
    const lift = axis === null ? 0 : (axis - height / 2) * k;
    const ox = cx + sin * lift;
    const oy = cy - cos * lift;
    const e = ox - (a * width / 2 + c * height / 2);
    const f = oy - (b * width / 2 + d * height / 2);
    const boxWidth = Math.abs(cos) * width * k + Math.abs(sin) * height * k;
    const boxHeight = Math.abs(sin) * width * k + Math.abs(cos) * height * k;
    return {
        kind: "icon", id, sprite, slot, args, k, width, height,
        matrix: [a, b, c, d, e, f],
        x: ox - boxWidth / 2, y: oy - boxHeight / 2, boxWidth, boxHeight
    };
}

function indicatorIcon(id, element, cx, cy, scale, target){
    const indicator = INDICATORS[id];
    return iconItem({
        id: `${element.key}_${id}`, sprite: indicator.sprite, slot: id, cx, cy, k: indicator.scale * scale,
        width: indicator.width, height: indicator.height, args: target ? { base: target } : {}
    });
}

function chosenFittings(element){
    const allowed = ELEMENT_TYPES[element.type].fittings ?? [];
    return (element.fittings ?? []).filter((id) => allowed.includes(id));
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
            return { element, spec, k, rows, readout, indicators, icon, slot: Math.max(icon, bracket) };
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

export function sideCenters(first, second, start, end, scale, lead = null){
    const leading = lead ? [{ element: { key: lead.key }, icon: lead.width, slot: lead.width }] : [];
    const a = [...leading, ...measure(first, scale)];
    const b = [...leading, ...measure(second, scale)];
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
    if (lead) centers.set(lead.key, positions[0]);
    return centers;
}

export function lineItems({ elements, y, outward, direction = 1, scale, controller, prefix, centers }){
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

        items.push({
            ...iconItem({
                id: element.key, sprite: spec.sprite, slot: element.type, cx, cy: iconY + iconHeight / 2, k,
                width: spec.width, height: spec.height, flip: !!spec.directional && direction < 0, args: base ? { base } : {}
            }),
            center: cx
        });

        const fittings = chosenFittings(element);
        let floor = iconY + iconHeight;
        let valveRow = null;
        if (fittings.length) {
            const bottom = iconY + iconHeight;
            const length = 150 * scale;
            const leftX = cx - iconWidth * 0.28;
            const rightX = cx + iconWidth * 0.28;
            floor = bottom + length;
            items.push({ kind: "polyline", id: `${element.key}_water_supply`, points: `${leftX},${bottom} ${leftX},${floor}`, color: spec.water.supply, width: 3 });
            items.push({ kind: "polyline", id: `${element.key}_water_return`, points: `${rightX},${bottom} ${rightX},${floor}`, color: spec.water.return, width: 3 });
            if (fittings.includes("valve")) {
                const valveY = bottom + length * 0.7;
                items.push({ kind: "polyline", id: `${element.key}_water_bypass`, points: `${leftX},${valveY} ${rightX},${valveY}`, color: spec.water.return, width: 3 });
                items.push(junction(`${element.key}_water_junction`, leftX, valveY, 5 * scale, 2 * scale));
                const valve = FITTINGS.valve;
                items.push(iconItem({
                    id: `${element.key}_valve`, sprite: valve.sprite, slot: "valve", cx: rightX, cy: valveY, k: valve.scale * scale,
                    width: valve.width, height: valve.height, axis: valve.axis, rotation: 90
                }));
                valveRow = { x: rightX + 46 * scale, y: valveY };
            }
            if (fittings.includes("pump")) {
                const pump = FITTINGS.pump;
                const target = address(prefix, registers.pump);
                const fault = address(prefix, registers.pumpFault);
                items.push(iconItem({
                    id: `${element.key}_pump`, sprite: pump.sprite, slot: "pump", cx: leftX, cy: bottom + length * 0.38, k: pump.scale * scale,
                    width: pump.width, height: pump.height, rotation: 270,
                    args: { ...(target ? { base: target } : {}), ...(fault ? { fault_base: fault } : {}) }
                }));
            }
        }

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
            items.push(junction(`${element.key}_dp_left_junction`, left, y, 5 * scale, 2 * scale));
            items.push(junction(`${element.key}_dp_right_junction`, right, y, 5 * scale, 2 * scale));
            items.push(indicatorIcon("dpSwitch", element, cx, py, scale, address(prefix, registers.dpSwitch)));
        }

        const stacked = valveRow ? rows.filter((row) => row.kind !== "position") : rows;
        if (valveRow && stacked.length !== rows.length) {
            const register = registers.position;
            items.push({
                kind: "field", id: `${element.key}_position`,
                x: valveRow.x, y: valveRow.y - READOUT.rowHeight * scale / 2, width: READOUT.boxWidth * scale, height: READOUT.rowHeight * scale,
                unit: MEASURES.position.unit, decimals: MEASURES.position.decimals, address: address(prefix, register), editable: false
            });
        }

        if (stacked.length) {
            const extent = readoutExtent(stacked, scale);
            const top = outward < 0 ? ceiling - READOUT.gap * scale - extent.height : floor + READOUT.gap * scale;
            const boxX = cx - READOUT.boxWidth * scale / 2;
            const shown = stacked.length === 1 ? stacked.map((row) => ({ ...row, label: "" })) : stacked;
            shown.forEach((row, index) => {
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

        const middle = iconY + iconHeight / 2;
        if (indicators.includes("status")) {
            items.push(indicatorIcon("status", element, cx, middle, scale, address(prefix, registers.status)));
        }
        if (indicators.includes("alarm")) {
            const corner = indicators.includes("status");
            items.push(indicatorIcon("alarm", element, corner ? iconX + iconWidth : cx, corner ? iconY : middle, scale, address(prefix, registers.alarm)));
        }

        for (let index = first; index < items.length; index += 1) items[index].owner = element.key;
    }
    return items;
}

const DUCT = "#94A3B8";

function junction(id, cx, cy, radius, stroke){
    return { kind: "junction", id, cx, cy, radius, stroke, color: INK };
}
const DAMPER = { width: 103, height: 241.49, axis: 139.73 };

function readoutStack(rows, cx, top, scale, prefix, registers, idBase){
    const items = [];
    const labelled = rows.length > 1;
    rows.forEach((row, index) => {
        const rowY = top + index * (READOUT.rowHeight + READOUT.rowGap) * scale;
        const boxX = cx - READOUT.boxWidth * scale / 2;
        const id = `${idBase}_${row.id}`;
        if (labelled) {
            items.push({ kind: "text", id: `${id}_label`, text: MEASURES[row.measure].label, x: boxX - 8 * scale, y: rowY + (READOUT.rowHeight / 2 + 6.5) * scale, size: READOUT.labelSize * scale, anchor: "end", color: INK });
        }
        items.push({
            kind: "field", id, x: boxX, y: rowY, width: READOUT.boxWidth * scale, height: READOUT.rowHeight * scale,
            unit: MEASURES[row.measure].unit, decimals: MEASURES[row.measure].decimals, address: address(prefix, registers[row.id]), editable: false
        });
    });
    return items;
}

function sideField(id, x, y, measure, scale, target){
    return {
        kind: "field", id, x, y: y - READOUT.rowHeight * scale / 2, width: READOUT.boxWidth * scale, height: READOUT.rowHeight * scale,
        unit: MEASURES[measure].unit, decimals: MEASURES[measure].decimals, address: target, editable: false
    };
}

export const MIXING_KEY = "mixing";

export function mixingLead(scale){
    return { key: MIXING_KEY, width: DAMPER.height * scale };
}

function ductFromCenter(center, scale){
    return center - (DAMPER.axis - (DAMPER.height - DAMPER.axis)) / 2 * scale;
}

export function recuperationItems({ cx, width, height, displayHeight, recuperation, options, intakeY, supplyY, returnY, controller, prefix, scale = 1, mixingCenter = null }){
    const registers = groupRegisters(controller, "recuperation");
    const top = displayHeight / 2 - height / 2;
    const bottom = displayHeight / 2 + height / 2;
    const left = cx - width / 2;
    const right = cx + width / 2;
    const under = [];
    const over = [];
    let floor = bottom;

    if (options.bypass) {
        const lx = left - 30;
        const rx = right + 30;
        const dy = bottom + (DAMPER.axis + 20) * scale;
        under.push({ kind: "polyline", id: "bypass_duct", points: `${lx},${intakeY} ${lx},${dy} ${rx},${dy} ${rx},${supplyY}`, color: DUCT, width: 8 });
        over.push(junction("bypass_junction_in", lx, intakeY, 9, 3), junction("bypass_junction_out", rx, supplyY, 9, 3));
        over.push(iconItem({ id: "bypass_damper", sprite: "damper", slot: "damper", cx, cy: dy, k: scale, width: DAMPER.width, height: DAMPER.height, axis: DAMPER.axis, args: registers.bypass ? { base: address(prefix, registers.bypass) } : {} }));
        over.push(sideField("bypass_position", cx + (DAMPER.width / 2 + 16) * scale, dy, "position", scale, address(prefix, registers.bypass)));
        floor = dy + (DAMPER.height - DAMPER.axis) * scale;
    }

    if (options.mixing && mixingCenter !== null) {
        const mx = ductFromCenter(mixingCenter, scale);
        const my = (returnY + supplyY) / 2;
        under.push({ kind: "polyline", id: "mixing_duct", points: `${mx},${returnY} ${mx},${supplyY}`, color: DUCT, width: 8 });
        over.push(junction("mixing_junction_return", mx, returnY, 9, 3), junction("mixing_junction_supply", mx, supplyY, 9, 3));
        over.push(iconItem({ id: "mixing_damper", sprite: "damper", slot: "damper", cx: mx, cy: my, k: scale, width: DAMPER.width, height: DAMPER.height, axis: DAMPER.axis, rotation: 90, args: registers.mixing ? { base: address(prefix, registers.mixing) } : {} }));
        over.push(sideField("mixing_position", mx + 14 * scale, my + (DAMPER.width / 2 + 12 + READOUT.rowHeight / 2) * scale, "position", scale, address(prefix, registers.mixing)));
    }

    const rows = RECUPERATION_OPTIONS.readouts
        .filter((entry) => options.readouts.includes(entry.id) && (!entry.rotaryOnly || recuperation === "rotary-heat-exchanger"))
        .map((entry) => ({ id: entry.id, measure: entry.measure }));
    over.push(...readoutStack(rows, cx, floor + READOUT.gap * scale, scale, prefix, registers, "recuperation"));

    if (options.indicators.includes("defrost")) {
        over.push(indicatorIcon("status", { key: "recuperation_defrost" }, left + 22, top + 22, scale, address(prefix, registers.defrost)));
    }
    if (options.indicators.includes("dirty")) {
        over.push(indicatorIcon("alarm", { key: "recuperation_dirty" }, right, top, scale, address(prefix, registers.dirty)));
    }
    return { under, over };
}

const ROBOTO_WIDTHS = {
    a: 0.54, b: 0.56, c: 0.52, d: 0.56, e: 0.53, f: 0.35, g: 0.56, h: 0.55, i: 0.24, j: 0.24, k: 0.51, l: 0.24, m: 0.88,
    n: 0.55, o: 0.57, p: 0.56, q: 0.57, r: 0.34, s: 0.52, t: 0.33, u: 0.55, v: 0.48, w: 0.75, x: 0.5, y: 0.47, z: 0.5,
    A: 0.65, B: 0.62, C: 0.65, D: 0.66, E: 0.57, F: 0.55, G: 0.68, H: 0.71, I: 0.27, J: 0.55, K: 0.63, L: 0.54, M: 0.87,
    N: 0.71, O: 0.69, P: 0.63, Q: 0.69, R: 0.62, S: 0.59, T: 0.6, U: 0.65, V: 0.64, W: 0.89, X: 0.63, Y: 0.6, Z: 0.6,
    " ": 0.25, "/": 0.41, "-": 0.28, ".": 0.26, ",": 0.2, ":": 0.24, "(": 0.34, ")": 0.35
};

function textWidth(text, size){
    return [...text.normalize("NFD").replace(/[̀-ͯ]/g, "")]
        .reduce((sum, char) => sum + (ROBOTO_WIDTHS[char] ?? (/\d/.test(char) ? 0.56 : 0.55)), 0) * size;
}

export function unitItems({ displayWidth, options, controller, prefix, scale = 1 }){
    const registers = groupRegisters(controller, "unit");
    const extraArgs = groupRegisters(controller, "unitArgs");
    const items = [];

    const mode = CONTROLLERS[controller]?.unitMode;
    const showMode = options.status.includes("mode") && !!mode;
    if (showMode) {
        items.push({
            kind: "text", id: "unit_mode", text: `${MODE_PREFIX}--`, x: displayWidth / 2, y: 128, size: 22, anchor: "middle", color: "#64748B",
            live: { address: address(prefix, mode.register), prefix: MODE_PREFIX, states: mode.states }
        });
    }

    const statuses = UNIT_OPTIONS.status.filter((entry) => !entry.text && options.status.includes(entry.id));
    if (statuses.length) {
        const size = 18;
        const dot = INDICATORS.status.width * 0.9;
        const widths = statuses.map((entry) => dot + 10 + textWidth(entry.label, size));
        const gap = 40;
        let x = displayWidth / 2 - (widths.reduce((sum, width) => sum + width, 0) + gap * (statuses.length - 1)) / 2;
        const y = showMode ? 172 : 140;
        statuses.forEach((entry, index) => {
            const target = address(prefix, registers[entry.id]);
            items.push(iconItem({
                id: `unit_${entry.id}`, sprite: "statusIndicator", slot: "status", cx: x + dot / 2, cy: y, k: 0.9,
                width: INDICATORS.status.width, height: INDICATORS.status.height, args: { ...(target ? { base: target } : {}), trueColor: entry.color, ...(extraArgs[entry.id] ?? {}) }
            }));
            items.push({ kind: "text", id: `unit_${entry.id}_label`, text: entry.label, x: x + dot + 10, y: y + size * 0.35, size, anchor: "start", color: INK });
            x += widths[index] + gap;
        });
    }

    const room = UNIT_OPTIONS.room.filter((entry) => options.room.includes(entry.id));
    if (room.length) {
        items.push({ kind: "text", id: "room_label", text: "Prostor", x: 60, y: 200, size: 22, anchor: "start", color: INK });
        room.forEach((entry, index) => {
            const spec = ELEMENT_TYPES[entry.slot];
            const cy = 245 + index * 56;
            items.push(iconItem({ id: `room_${entry.id}`, sprite: entry.sprite, slot: entry.slot, cx: 80, cy, k: (spec.scale ?? 1) * scale, width: spec.width, height: spec.height }));
            items.push(sideField(`room_${entry.id}_value`, 112, cy, entry.measure, scale, address(prefix, registers[entry.id])));
        });
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
        ...iconItem({
            id: "recuperation_unit", sprite: RECUPERATION_TYPES[recuperation].sprite, slot: recuperation,
            cx: xCenter, cy: displayHeight / 2, k: recuperationWidth / icon.width, width: icon.width, height: icon.height
        }),
        owner: "recuperation", center: xCenter
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
