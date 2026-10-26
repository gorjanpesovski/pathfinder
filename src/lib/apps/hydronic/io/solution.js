import { parseNrbf, writeNrbf, walkGraph } from "./nrbf.js";

export const SOLUTION_FORMATS = ["WindowsForms10PersistentObject"];

const SOLUTIONS = {
  heating: {
    load: () => import("./solution-templates.js").then((module) => ({ packed: module.HEATING_SOLUTION, variables: module.HEATING_VARIABLES })),
    pou: "Talno_Ogrevanje",
    libraries: ["PID_Adv_2 v3.0.1", "Scheduler v1.1.9"],
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

const cache = new Map();

export function solutionLibraries(type){
  return SOLUTIONS[type]?.libraries ?? [];
}

async function unpack(base64){
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function template(type){
  const solution = SOLUTIONS[type];
  if (!solution) throw new Error(`There is no ${type} branch solution yet`);
  if (!cache.has(type)) {
    const { packed, variables } = await solution.load();
    cache.set(type, { bytes: await unpack(packed), variables });
  }
  return { ...solution, ...cache.get(type) };
}

function renamer(solution, pou, names){
  const swaps = Object.entries(solution.names)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([role, from]) => ({ pattern: new RegExp(`(?<![A-Za-z0-9_])${from}(\\.Active)?(?![A-Za-z0-9_])`, "g"), to: names[role] }));
  const header = new RegExp(`^PROGRAM ${solution.pou}(\\r?\\n)`);
  return (text) => {
    let value = text;
    for (const { pattern, to } of swaps) value = value.replace(pattern, (match, active) => active ? to.active : to.plain);
    if (value === solution.pou) return pou;
    if (value === `${solution.pou}.AcfMlge`) return `${pou}.AcfMlge`;
    return value.replace(header, `PROGRAM ${pou}$1`);
  };
}

export async function branchSolution(type, pou, names){
  const solution = await template(type);
  const prefix = solution.bytes.slice(0, 16);
  const root = parseNrbf(solution.bytes, 16);
  const rename = renamer(solution, pou, names);
  const decoder = new TextDecoder("utf-8", { ignoreBOM: true });
  const encoder = new TextEncoder();
  walkGraph(root, (node) => {
    if (node.kind === "string") node.value = rename(node.value);
    else if (node.bytes) {
      const text = decoder.decode(node.bytes);
      const next = rename(text);
      if (next !== text) node.bytes = encoder.encode(next);
    }
  });
  const body = writeNrbf(root);
  const out = new Uint8Array(prefix.length + body.length);
  out.set(prefix);
  out.set(body, prefix.length);
  return out;
}

export async function branchVariables(type){
  const { variables } = await template(type);
  return variables.map((entry) => ({
    name: entry.name,
    dataType: entry.dataType,
    io: false,
    protocol: !!entry.protocol,
    ui: !!entry.ui,
    dev: !!entry.dev,
    log: false,
    retain: !!entry.retain,
    decimals: entry.decimals,
    min: entry.min ?? "",
    max: entry.max ?? "",
    initial: entry.initial,
    comment: ""
  }));
}
