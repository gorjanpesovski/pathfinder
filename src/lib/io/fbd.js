import { parseNrbf, writeNrbf, member, setMember, cloneGraph, walkGraph } from "./nrbf.js";
import { CLIPBOARD_PREFIX, DO_TEMPLATE, IO_TEMPLATE } from "./fbd-templates.js";
import { IO_KINDS, pointBase, diUse, statusName } from "./patterns.js";

export const FBD_FORMATS = ["ISaGRAF.ISaGRAF5.Core.Shell.Isa5EncryptedObject", "WindowsForms10PersistentObject"];

const SAMPLES = [
  { kind: "DO", template: DO_TEMPLATE, base: "NO1_Vklop_NETC11" },
  { kind: "AO", template: IO_TEMPLATE, base: "Y1_Pogon_Mesalni_Ventil_Talno_Ogrevanje" },
  { kind: "DI", template: IO_TEMPLATE, base: "ID1_Alarm_Drycooler", instance: "TON_1" },
  { kind: "AI", template: IO_TEMPLATE, base: "U1_Zunanje_Tipalo_Osvetljenost" }
];

const GAP = 36;

let parsed = null;

function fromBase64(text){
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function toBase64(bytes){
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(binary);
}

function isConnection(node){
  return node.cls.name.endsWith(".WbDiagramConnection");
}

function isVariable(node){
  return node.cls.name.endsWith(".WbDiagramVariable");
}

function isPouCall(node){
  return node.cls.name.endsWith(".WbDiagramPouCall");
}

function ends(connection){
  return [member(member(connection, "_startConnector"), "_item"), member(member(connection, "_endConnector"), "_item")];
}

function groups(elements){
  const parent = new Map(elements.map((element) => [element, element]));
  const find = (element) => parent.get(element) === element ? element : find(parent.get(element));
  for (const connection of elements.filter(isConnection)) {
    for (const end of ends(connection)) if (parent.has(end)) parent.set(find(end), find(connection));
  }
  const byRoot = new Map();
  for (const element of elements) {
    const root = find(element);
    if (!byRoot.has(root)) byRoot.set(root, []);
    byRoot.get(root).push(element);
  }
  return [...byRoot.values()];
}

function nameOf(element){
  return member(member(element, "_info"), "_name")?.value ?? "";
}

function load(){
  if (parsed) return parsed;
  const roots = new Map();
  const samples = new Map();
  for (const sample of SAMPLES) {
    if (!roots.has(sample.template)) roots.set(sample.template, parseNrbf(fromBase64(sample.template)));
    const root = roots.get(sample.template);
    const elements = member(root, "_object").values;
    const group = groups(elements).find((list) => list.some((element) => isVariable(element) && nameOf(element).includes(sample.base)));
    if (!group) throw new Error(`The ${sample.kind} block template is missing`);
    samples.set(sample.kind, { ...sample, elements: group });
  }
  parsed = { root: roots.get(IO_TEMPLATE), samples };
  return parsed;
}

function styleOf(element){
  return member(member(element, "_style"), "Element");
}

function setAttribute(element, key, value){
  const style = styleOf(element);
  if (style) style.value = style.value.replace(new RegExp(` ${key}="[^"]*"`), ` ${key}="${value}"`);
}

function attribute(element, key){
  return styleOf(element)?.value.match(new RegExp(` ${key}="([^"]*)"`))?.[1];
}

function renumber(group, next){
  const keys = new Map();
  for (const element of group.elements) {
    if (isConnection(element)) continue;
    keys.set(element, String(next()));
    setAttribute(element, "Key", keys.get(element));
  }
  for (const connection of group.elements.filter(isConnection)) {
    const pins = [...(attribute(connection, "Key") ?? "").matchAll(/\(\d+,(\d+)\)/g)].map((match) => match[1]);
    const [start, end] = ends(connection);
    setAttribute(connection, "Key", `(${keys.get(start)},${pins[0] ?? 0})(${keys.get(end)},${pins[1] ?? 0})`);
  }
}

function renameStrings(nodes, from, to){
  for (const node of nodes) {
    if (node?.kind === "string") node.value = node.value.split(`${from}.Trigger`).join(to).split(from).join(to);
  }
}

function reachable(elements){
  const nodes = [];
  for (const element of elements) walkGraph(element, (node) => nodes.push(node));
  return nodes;
}

function addStatus(elements, point){
  const alarm = `ALM_DI_${pointBase(point)}`;
  const status = statusName(point);
  const output = elements.find((element) => isVariable(element) && nameOf(element).startsWith(alarm));
  const wire = elements.find((element) => isConnection(element) && ends(element)[1] === output);
  if (!output || !wire) return elements;
  if (diUse(point) === "status") {
    renameStrings(reachable([output, wire]).filter((node) => node.kind === "string"), alarm, status);
    return elements;
  }
  const pin = member(wire, "_startConnector");
  const copies = new Map([[pin, pin], [member(pin, "_item"), member(pin, "_item")]]);
  const extra = cloneGraph(output, copies);
  const extraWire = cloneGraph(wire, copies);
  renameStrings([...copies.values()].filter((node) => node !== pin && node !== member(pin, "_item")), alarm, status);
  const route = points(wire);
  const [startX, startY] = route[0];
  const [endX] = route[route.length - 1];
  setBox(extra, { top: box(output).top + 24 });
  setPoints(extraWire, [[startX, startY], [startX + 8, startY], [startX + 8, startY + 24], [endX, startY + 24]]);
  return [...elements, extra, extraWire];
}

function box(element){
  const info = member(element, "_info");
  return { top: member(info, "_top"), left: member(info, "_left"), width: member(info, "_width"), height: member(info, "_height") };
}

function setBox(element, next){
  const info = member(element, "_info");
  for (const key of ["top", "left", "width", "height"]) {
    if (next[key] === undefined) continue;
    setMember(info, `_${key}`, next[key]);
    setAttribute(element, key[0].toUpperCase() + key.slice(1), next[key]);
  }
}

function points(connection){
  return member(member(connection, "_info"), "_points").values.map((point) => [member(point, "_x"), member(point, "_y")]);
}

function setPoints(connection, list){
  const nodes = member(member(connection, "_info"), "_points").values;
  list.forEach(([x, y], index) => {
    setMember(nodes[index], "_x", x);
    setMember(nodes[index], "_y", y);
  });
  setAttribute(connection, "Points", list.map(([x, y]) => `${x},${y}`).join(" "));
}

export function variableWidth(name){
  return Math.max(64, Math.ceil((name.length * 9 + 16) / 16) * 16);
}

function replaceWord(text, word, next){
  return text.replace(new RegExp(`(^|[^A-Za-z0-9_])${word}(?![A-Za-z0-9_])`, "g"), `$1${next}`);
}

function build(sample, point){
  const base = pointBase(point);
  const copies = new Map();
  let elements = sample.elements.map((element) => cloneGraph(element, copies));
  const instance = `TON_${point.kind}_${base}`;
  for (const element of elements) {
    walkGraph(element, (node) => {
      if (node.kind !== "string") return;
      let value = node.value.split(sample.base).join(base);
      if (sample.instance) value = replaceWord(value, sample.instance, instance);
      node.value = value;
    });
  }
  if (point.kind === "DI" && diUse(point) !== "alarm") elements = addStatus(elements, point);
  const connections = elements.filter(isConnection);
  for (const variable of elements.filter(isVariable)) {
    const name = nameOf(variable);
    if (!name.includes(base)) continue;
    const width = variableWidth(name);
    const input = connections.find((connection) => ends(connection)[0] === variable);
    if (input) {
      const route = points(input);
      const [endX, y] = route[route.length - 1];
      const right = endX - 16;
      setBox(variable, { left: right - width, width });
      setPoints(input, [[right, y], [right, y], [endX - 16, y], [endX, y]]);
    } else {
      setBox(variable, { width });
    }
  }
  const shapes = elements.filter((element) => !isConnection(element)).map(box);
  const anchor = Math.min(...elements.filter(isPouCall).map((element) => box(element).left));
  return {
    elements,
    anchor,
    left: Math.min(...shapes.map((shape) => shape.left)),
    top: Math.min(...shapes.map((shape) => shape.top)),
    bottom: Math.max(...shapes.map((shape) => shape.top + shape.height))
  };
}

function move(group, dx, dy){
  for (const element of group.elements) {
    if (isConnection(element)) {
      setPoints(element, points(element).map(([x, y]) => [x + dx, y + dy]));
    } else {
      const current = box(element);
      setBox(element, { left: current.left + dx, top: current.top + dy });
    }
  }
}

function kindOrder(point){
  return IO_KINDS.findIndex((kind) => kind.id === point.kind);
}

export function fbdBlocks(list){
  const { root, samples } = load();
  const ordered = [...list].sort((a, b) => kindOrder(a) - kindOrder(b));
  const built = ordered.map((point) => build(samples.get(point.kind), point));
  const column = Math.ceil(Math.max(...built.map((group) => group.anchor - group.left)) / 16) * 16 + 16;
  let cursor = 24;
  let unique = 1;
  let key = 1;
  for (const group of built) {
    move(group, column - group.anchor, cursor - group.top);
    cursor += Math.ceil((group.bottom - group.top + GAP) / 12) * 12;
    for (const element of group.elements) setMember(element, "_itemUniqueId", unique++);
    renumber(group, () => key++);
  }
  const elements = [
    ...built.flatMap((group) => group.elements.filter((element) => !isConnection(element))),
    ...built.flatMap((group) => group.elements.filter(isConnection))
  ];
  return pack(root, elements);
}

function pack(root, elements){
  const array = member(root, "_object");
  const payload = cloneGraph(root, new Map([[array, { ...array, lengths: [elements.length], values: elements }]]));
  const bytes = writeNrbf(payload);
  const prefix = Uint8Array.from(CLIPBOARD_PREFIX.match(/../g).map((pair) => parseInt(pair, 16)));
  const out = new Uint8Array(prefix.length + bytes.length);
  out.set(prefix);
  out.set(bytes, prefix.length);
  return out;
}

const BRANCH_TEMPLATES = {
  heating: {
    source: () => import("./branch-templates.js").then((module) => module.HEATING_BRANCH),
    names: {
      pump: "NO17_Vklop_P41_Crpalka_Talno_Ogrevanje_A",
      valve: "Y1_Pogon_Mesalni_Ventil_Talno_Ogrevanje_A",
      supply: "AI_N2_U2_Temperatura_Dovod_Talno_Ogrevanje",
      thermostat: "ALM_DI_ID8_Varnostni_Termostat_Talno_Ogrevanje",
      outdoor: "AI_U2_Zunanje_Tipalo_Temperature",
      outdoorAlarm: "ALM_ERR_AI_U2_Zunanje_Tipalo_Temperature"
    }
  }
};

const branchRoots = new Map();

export async function branchBlocks(type, names){
  const template = BRANCH_TEMPLATES[type];
  if (!template) throw new Error(`There is no ${type} branch template yet`);
  if (!branchRoots.has(type)) branchRoots.set(type, parseNrbf(fromBase64(await template.source())));
  const root = branchRoots.get(type);
  const copies = new Map();
  const elements = member(root, "_object").values.map((element) => cloneGraph(element, copies));
  const swaps = Object.entries(template.names)
    .map(([role, from]) => ({ pattern: new RegExp(`${from}(\\.Active)?(?![A-Za-z0-9_])`, "g"), to: names[role] }))
    .sort((a, b) => b.pattern.source.length - a.pattern.source.length);
  for (const element of elements) {
    walkGraph(element, (node) => {
      if (node.kind !== "string") return;
      for (const { pattern, to } of swaps) node.value = node.value.replace(pattern, (match, active) => active ? to.active : to.plain);
    });
  }
  const targets = new Set(Object.values(names).flatMap((name) => [name.plain, name.active]));
  const connections = elements.filter(isConnection);
  for (const variable of elements.filter(isVariable)) {
    const name = nameOf(variable);
    if (!targets.has(name)) continue;
    const width = variableWidth(name);
    const current = box(variable);
    const input = connections.some((connection) => ends(connection)[0] === variable);
    setBox(variable, input ? { left: current.left + current.width - width, width } : { width });
  }
  const left = Math.min(...elements.filter((element) => !isConnection(element)).map((element) => box(element).left));
  if (left < 16) move({ elements }, Math.ceil((16 - left) / 16) * 16, 0);
  return pack(root, elements);
}

export function clipboardPackage(formats, bytes){
  return ["PATHFINDER-CLIPBOARD 1", `${formats.join("|")}\t${toBase64(bytes)}`, ""].join("\r\n");
}
