export const LOAD_PRODUCTS = [
  {
    article: "2164580",
    manufacturer: "Wilo",
    series: "Stratos MAXO",
    model: "Stratos MAXO 32/0,5-12 PN6/10",
    description: "OBTOČNA ČRPALKA",
    load: "motor",
    poles: "1p",
    protection: "mcb",
    cable: "NHXMH-J 3x1,5mm2",
    supply: { voltage: 230, phases: 1, frequency: "50/60 Hz" },
    power: { min: 0.007, max: 0.32 },
    current: { min: 0.11, max: 1.42 },
    drive: "ec",
    inrush: 10,
    motorProtection: true,
    leakage: 3.5,
    rcd: { small: "A", large: "B", limit: 0.2 },
    contact: { current: 10, voltage: 250 },
    terminals: { min: 1.5, max: 2.5 },
    switching: "Mains ≤ 100/24 h · Ext. Off ≤ 20/h",
    signals: [
      { id: "SSM", label: "Fault signal", kind: "do", contact: "CO", rating: "1 A / 250 V AC · 1 A / 30 V DC" },
      { id: "SBM", label: "Run signal", kind: "do", contact: "NO", rating: "1 A / 250 V AC · 1 A / 30 V DC" },
      { id: "DI1", label: "Digital input 1 · Ext. Off", kind: "di" },
      { id: "DI2", label: "Digital input 2 · Ext. Min/Max", kind: "di" },
      { id: "AI1", label: "Analogue input 1 · 0–10 V, 4–20 mA, Pt1000", kind: "ai" },
      { id: "AI2", label: "Analogue input 2 · 0–10 V, 4–20 mA, Pt1000", kind: "ai" },
      { id: "24V", label: "24 V DC output", kind: "supply" },
      { id: "NET", label: "Wilo Net · Modbus / BACnet via CIF module", kind: "bus" }
    ],
    ip: "IPX4D",
    ambient: "-10…40 °C",
    link: "https://wilo.com/gb/en/Products/en/products/stratos-maxo_id171/2164580?tab=product_technical",
    source: "Wilo data sheet and installation manual Ed.04/2025-10"
  },
  {
    article: "2164579",
    manufacturer: "Wilo",
    series: "Stratos MAXO",
    model: "Stratos MAXO 32/0,5-10 PN6/10",
    description: "OBTOČNA ČRPALKA",
    load: "motor",
    poles: "1p",
    protection: "mcb",
    cable: "NHXMH-J 3x1,5mm2",
    supply: { voltage: 230, phases: 1, frequency: "50/60 Hz" },
    power: { min: 0.007, max: 0.25 },
    current: { min: 0.11, max: 1.09 },
    drive: "ec",
    inrush: 10,
    motorProtection: true,
    leakage: 3.5,
    rcd: { small: "A", large: "B", limit: 0.2 },
    contact: { current: 10, voltage: 250 },
    terminals: { min: 1.5, max: 2.5 },
    switching: "Mains ≤ 100/24 h · Ext. Off ≤ 20/h",
    signals: [
      { id: "SSM", label: "Fault signal", kind: "do", contact: "CO", rating: "1 A / 250 V AC · 1 A / 30 V DC" },
      { id: "SBM", label: "Run signal", kind: "do", contact: "NO", rating: "1 A / 250 V AC · 1 A / 30 V DC" },
      { id: "DI1", label: "Digital input 1 · Ext. Off", kind: "di" },
      { id: "DI2", label: "Digital input 2 · Ext. Min/Max", kind: "di" },
      { id: "AI1", label: "Analogue input 1 · 0–10 V, 4–20 mA, Pt1000", kind: "ai" },
      { id: "AI2", label: "Analogue input 2 · 0–10 V, 4–20 mA, Pt1000", kind: "ai" },
      { id: "24V", label: "24 V DC output", kind: "supply" },
      { id: "NET", label: "Wilo Net · Modbus / BACnet via CIF module", kind: "bus" }
    ],
    ip: "IPX4D",
    ambient: "-10…40 °C",
    link: "https://wilo.com/si/sl/Izdelki-in-kompetence/sl/izdelki/stratos-maxo_id171/2164579",
    source: "Wilo data sheet and installation manual Ed.04/2025-10"
  }
];

const TRIP = { B: 3, C: 5, D: 10, K: 8, Z: 2 };
const KEY = "pathfinder.loadLibrary";

let saved = null;

function stored(){
  if (saved) return saved;
  try {
    const list = JSON.parse(globalThis.localStorage?.getItem(KEY) ?? "[]");
    saved = Array.isArray(list) ? list.filter((entry) => entry && entry.article && entry.model) : [];
  } catch {
    saved = [];
  }
  return saved;
}

function keep(list){
  saved = list;
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function allProducts(){
  const own = stored();
  return [...LOAD_PRODUCTS.filter((product) => !own.some((entry) => entry.article === product.article)), ...own];
}

export function builtInOf(article){
  return LOAD_PRODUCTS.find((product) => product.article === article) ?? null;
}

export function isBuiltIn(article){
  return LOAD_PRODUCTS.some((product) => product.article === article) && !stored().some((entry) => entry.article === article);
}

export function saveProduct(product, previous = product.article){
  const list = stored().filter((entry) => entry.article !== previous && entry.article !== product.article);
  return keep([...list, { ...JSON.parse(JSON.stringify(product)), user: true }]);
}

export function removeProduct(article){
  return keep(stored().filter((entry) => entry.article !== article));
}

function plain(text){
  return String(text ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function productLabel(product){
  return `${product.manufacturer} ${product.model}`;
}

export function productOf(text){
  const value = plain(text);
  if (!value) return null;
  const products = allProducts();
  return products.find((product) => value === product.article || value === plain(product.model) || value === plain(productLabel(product)))
    ?? products.find((product) => value.includes(product.article) || value.includes(plain(product.model)))
    ?? null;
}

export function productRcd(product){
  if (!product?.rcd) return "";
  if (typeof product.rcd === "string") return product.rcd;
  return product.power.max > product.rcd.limit ? product.rcd.large : product.rcd.small;
}

export function inrushFloor(product, curve = "C"){
  if (!product?.inrush) return 0;
  return product.inrush / (TRIP[String(curve).toUpperCase()] ?? TRIP.C);
}

function number(value){
  return String(value).replace(".", ",");
}

function crossSection(cable){
  const match = String(cable ?? "").replace(/,/g, ".").match(/\d+\s*x\s*(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : 0;
}

export function productChecks(row, product, rating, fallback, guarded){
  const notes = [];
  const amps = Number(String(rating ?? "").replace(/,/g, ".").match(/(\d+(?:\.\d+)?)/)?.[1] ?? 0);
  const curve = String(rating ?? "").trim().match(/^([BCDKZ])\s*\d/i)?.[1]?.toUpperCase() ?? fallback;
  const floor = inrushFloor(product, curve);
  if (amps && floor && amps < floor) notes.push({ level: "warn", text: `${rating} trips on the ${product.inrush} A switch-on peak · use at least ${curve}${Math.ceil(floor)}` });
  const section = crossSection(row.cable);
  if (section && product.terminals && (section < product.terminals.min || section > product.terminals.max)) notes.push({ level: "warn", text: `Cable ${row.cable} does not fit the mains terminals (${number(product.terminals.min)}–${number(product.terminals.max)} mm²)` });
  if (row.switchedBy && product.contact) notes.push({ level: "info", text: `${row.switchedBy} must be rated ≥ ${product.contact.current} A / ${product.contact.voltage} V AC` });
  const rcd = productRcd(product);
  if (rcd && guarded) notes.push({ level: "info", text: `RCD type ${rcd} · leakage ${number(product.leakage)} mA` });
  return notes;
}
