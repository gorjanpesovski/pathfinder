import { ICONS } from "$lib/iconSprite.js";

const IN_OUT_VALUE = "SYSTEM.LIBRARY.ATVISE.OBJECTDISPLAYS.Advanced.in_out_value";
const IN_OUT_NATIVE = { width: 100, height: 40 };
const IN_OUT_FONT = 20;
const FONT = "Roboto";

function round(value){
    return Math.round(value * 1000) / 1000;
}

export function escapeXml(value){
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function element(tag, attributes, children = null){
    const attrs = Object.entries(attributes)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([name, value]) => `${name}="${escapeXml(value)}"`)
        .join(" ");
    return children === null ? `<${tag} ${attrs}/>` : `<${tag} ${attrs}>${children}</${tag}>`;
}

function argumentsOf(args){
    return Object.entries(args).map(([name, value]) => element("atv:argument", { name, value })).join("");
}

function icon(item, library, names){
    const name = names[item.slot]?.trim();
    const transform = `matrix(${round(item.k)},0,0,${round(item.k)},${round(item.x)},${round(item.y)})`;
    const refpx = round(item.x + item.width * item.k / 2);
    const refpy = round(item.y + item.height * item.k / 2);
    if (!name) {
        const body = ICONS[item.sprite].body.replace(/\sid="/g, ` id="${item.id}__`);
        return `<g atv:refpx="${refpx}" atv:refpy="${refpy}" id="${escapeXml(item.id)}" transform="${transform}">${body}</g>`;
    }
    return element("svg", {
        "atv:refpx": refpx,
        "atv:refpy": refpy,
        height: item.height,
        id: item.id,
        transform,
        width: item.width,
        x: 0,
        y: 0,
        "xlink:href": `${library}.${name}`
    }, argumentsOf(item.args));
}

function field(item){
    const args = {
        ...(item.address ? { base: item.address } : {}),
        postDecimal: item.decimals,
        decimalFraction: 0,
        unit: `T{${item.unit}}`,
        editable: item.editable ? "Yes" : "No",
        fillNotEditable: "#ffffff",
        fontSize: Math.max(8, Math.round(IN_OUT_FONT * item.height / IN_OUT_NATIVE.height))
    };
    return element("svg", {
        "atv:refpx": round(item.x + item.width / 2),
        "atv:refpy": round(item.y + item.height / 2),
        height: IN_OUT_NATIVE.height,
        id: item.id,
        transform: `matrix(${round(item.width / IN_OUT_NATIVE.width)},0,0,${round(item.height / IN_OUT_NATIVE.height)},${round(item.x)},${round(item.y)})`,
        width: IN_OUT_NATIVE.width,
        x: 0,
        y: 0,
        "xlink:href": IN_OUT_VALUE
    }, argumentsOf(args));
}

function polyline(item){
    const coords = item.points.split(" ").map((pair) => pair.split(",").map(Number));
    const xs = coords.map(([x]) => x);
    const ys = coords.map(([, y]) => y);
    return element("polyline", {
        "atv:refpx": round((Math.min(...xs) + Math.max(...xs)) / 2),
        "atv:refpy": round((Math.min(...ys) + Math.max(...ys)) / 2),
        fill: "none",
        id: item.id,
        points: item.points,
        stroke: item.color,
        "stroke-dasharray": item.dash,
        "stroke-linecap": item.round ? "round" : undefined,
        "stroke-linejoin": item.round ? "round" : undefined,
        "stroke-width": item.width
    });
}

function text(item){
    return element("text", {
        "atv:refpx": round(item.x),
        "atv:refpy": round(item.y),
        fill: item.color,
        "font-family": FONT,
        "font-size": round(item.size),
        "font-weight": item.bold ? "bold" : undefined,
        id: item.id,
        "text-anchor": item.anchor === "start" ? undefined : item.anchor,
        x: round(item.x),
        y: round(item.y)
    }, escapeXml(item.text));
}

export function itemsToAtvise(items, library, names){
    return items.map((item) => {
        if (item.kind === "icon") return icon(item, library, names);
        if (item.kind === "field") return field(item);
        if (item.kind === "polyline") return polyline(item);
        return text(item);
    }).join("\n");
}
