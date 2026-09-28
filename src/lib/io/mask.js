import { pointBase, cleanName, cleanChannel } from "./patterns.js";

export const MASK_COLUMNS = 22;
const PREFIX = "PF_";
const NL = "\r\n";

function attr(value){
  return String(value ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function panelText(value){
  return String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/°/g, "ß");
}

export function displayLabel(point){
  const label = String(point.label ?? "").trim();
  return label || String(point.name ?? "").replace(/_+/g, " ").trim();
}

export function channelText(point){
  return [cleanChannel(point.board), cleanChannel(point.channel)].filter(Boolean).join(" ");
}

export function pouName(branch){
  return cleanName(branch.label);
}

function fit(text, width){
  return text.length <= width ? text : text.slice(0, width);
}

function wrap(text, first, second){
  if (text.length <= first) return [text];
  const cut = text.lastIndexOf(" ", first);
  const head = cut > 0 ? text.slice(0, cut) : text.slice(0, first);
  return [head, fit(text.slice(head.length).trim(), second)];
}

class MaskBuilder {
  constructor(name, x, y, title, code){
    this.head = `    <Mask Name="${name}" Type="Normal" X="${x}" Y="${y}">`;
    this.fields = [];
    this.counts = { Text: 0, Variable: 0, Image: 0 };
    this.image(0, 0, "BLACK_ROWS_132X8.BMP");
    this.variable(0, 0, "dummy", "CL_Move", "ib", 0, 1);
    this.text(0, 0, fit(title, MASK_COLUMNS - code.length - 1));
    this.text(0, MASK_COLUMNS - code.length, code);
  }

  next(type){
    this.counts[type] += 1;
    return `${type}_${this.counts[type]}`;
  }

  image(row, column, content){
    this.fields.push(`<Field Type="Image" Name="${this.next("Image")}" Row="${row}" Column="${column}" Content="${attr(content)}" />`);
  }

  text(row, column, content){
    this.fields.push(`<Field Type="Text" Name="${this.next("Text")}" Row="${row}" Column="${column}" Content="${attr(panelText(content))}" />`);
  }

  variable(row, column, content, cls, format, min, max){
    this.fields.push(`<Field Type="Variable" Name="${this.next("Variable")}" Row="${row}" Column="${column}" Content="${attr(content)}" Class="${cls}" Format="${format}" Min="${min}" Max="${max}" />`);
  }

  xml(){
    return [this.head, "      <Fields>", ...this.fields.map((field) => `        ${field}`), "      </Fields>", "    </Mask>"].join(NL);
  }
}

function chunks(list, size){
  const out = [];
  for (let index = 0; index < list.length; index += size) out.push(list.slice(index, index + size));
  return out;
}

function inputMasks(points, start){
  const masks = [];
  const order = (point) => [cleanChannel(point.board), Number(cleanChannel(point.channel).replace(/^[A-Z]+/, "")) || 0];
  const sorted = (kind) => points.filter((point) => point.kind === kind).sort((a, b) => {
    const [ba, na] = order(a);
    const [bb, nb] = order(b);
    return ba.localeCompare(bb) || na - nb;
  });
  const add = (title) => {
    const index = start + masks.length;
    const mask = new MaskBuilder(`${PREFIX}A${index}`, 0, 0, title, `A${index}`);
    masks.push(mask);
    return mask;
  };

  let mask = null;
  let row = 8;
  for (const point of sorted("DI")) {
    const tail = ` ${channelText(point)}:`;
    const room = MASK_COLUMNS - 3 - tail.length;
    const lines = wrap(displayLabel(point), MASK_COLUMNS, room);
    if (row + lines.length > 8) {
      mask = add("Digitalni Vhodi");
      row = 1;
    }
    if (lines.length > 1) mask.text(row++, 0, lines[0]);
    const text = `${fit(lines[lines.length - 1], room)}${tail}`;
    mask.text(row, 0, text);
    mask.variable(row, text.length + 1, `LG_DI_${pointBase(point)}`, "NC_NO", "iob", 0, 1);
    row += 1;
  }

  for (const group of chunks(sorted("DO"), 3)) {
    mask = add("Digitalni Izhodi");
    group.forEach((point, slot) => {
      const base = pointBase(point);
      const tag = `${channelText(point)}:`;
      mask.text(1 + slot * 2, 0, fit(displayLabel(point), MASK_COLUMNS));
      mask.text(2 + slot * 2, 0, tag);
      mask.variable(2 + slot * 2, tag.length, `${base}_AR`, "AVT_ROC", "iob", 0, 1);
      mask.text(2 + slot * 2, tag.length + 6, "Rocno:");
      mask.variable(2 + slot * 2, tag.length + 12, `${base}_R`, "IZK_VKL", "iob", 0, 1);
    });
  }

  for (const group of chunks(sorted("AO"), 2)) {
    mask = add("Analogni Izhodi");
    group.forEach((point, slot) => {
      const base = pointBase(point);
      const tag = `${channelText(point)}:`;
      mask.text(1 + slot * 3, 0, fit(displayLabel(point), MASK_COLUMNS));
      mask.text(2 + slot * 3, 0, tag);
      mask.variable(2 + slot * 3, tag.length, `${base}_AR`, "AVT_ROC", "iob", 0, 1);
      mask.text(2 + slot * 3, tag.length + 6, "Rocno:");
      mask.variable(2 + slot * 3, tag.length + 12, `${base}_R`, "CL_REAL_1", "io+3.1", "0.0", "100.0");
      if (tag.length + 18 < MASK_COLUMNS) mask.text(2 + slot * 3, tag.length + 18, "%");
    });
  }
  return masks;
}

function branchMasks(branches, start){
  const masks = [];
  for (const branch of branches) {
    const pou = pouName(branch);
    const title = branch.label;
    const code = () => `B${start + masks.length}`;
    const add = () => {
      const mask = new MaskBuilder(`${PREFIX}${code()}`, 1, 0, title, code());
      masks.push(mask);
      return mask;
    };

    let mask = add();
    mask.text(1, 0, "Vklop ogrevanja pri");
    mask.text(2, 0, "zunanji temperaturi");
    mask.text(3, 0, "mansji od:");
    mask.variable(3, 10, `${pou}.Setpoint_Vklop_Na_Tzunanjo_OGR`, "CL_REAL_1", "io+3.1", "-999.9", "999.9");
    mask.text(3, 16, "°C");
    mask.text(4, 0, "Zakasnitev vkl/izkl:");
    mask.variable(5, 0, `${pou}.Zakasnitev_Vklop_Na_Tzunanjo`, "CL_INT", "io4", 0, 5000);
    mask.text(5, 5, "min");
    mask.text(6, 0, "Diferenca vklopa brez");
    mask.text(7, 0, "zakasnitev:");
    mask.variable(7, 11, `${pou}.Diferenca_Vklopa_Na_Tzun_Brez_Zakasnitve`, "CL_REAL_1", "io+2.1", "0.0", "90.0");
    mask.text(7, 16, "°C");

    mask = add();
    mask.image(1, 0, "BLACK_ROWS_132X8.BMP");
    mask.text(1, 0, "Pri Tzun Min=Tmax Vode");
    mask.text(2, 7, "Max:");
    mask.text(2, 17, "Min:");
    mask.text(3, 0, "Tvode:");
    mask.variable(3, 6, `${pou}.Ogr_Max_Tvode`, "CL_REAL_1", "io+2.1", "0.0", "90.0");
    mask.text(3, 12, "-->");
    mask.variable(3, 16, `${pou}.Ogr_Min_Tvode`, "CL_REAL_1", "io+2.1", "0.0", "90.0");
    mask.text(4, 7, "Min:");
    mask.text(4, 17, "Max:");
    mask.text(5, 0, "Tzun:");
    mask.variable(5, 6, `${pou}.Ogr_Min_Tzun`, "CL_REAL_1", "io+2.1", "-50.0", "50.0");
    mask.text(5, 12, "-->");
    mask.variable(5, 16, `${pou}.Ogr_Max_Tzun`, "CL_REAL_1", "io+2.1", "-50.0", "50.0");
    mask.text(6, 0, "EKO diferenca:");
    mask.variable(6, 15, `${pou}.Ogr_Diferenca_EKO`, "CL_REAL_1", "io+2.1", "0.0", "50.0");
    mask.text(6, 20, "°C");
    mask.image(7, 0, "BLACK_ROWS_132X8.BMP");
    mask.text(7, 0, "EKO=Tvode komf - diff");

    mask = add();
    mask.text(1, 0, "P:");
    mask.variable(1, 5, `${pou}.P_PID`, "CL_REAL_1", "io+4.1", "0.0", "3000.0");
    mask.text(2, 0, "I:");
    mask.variable(2, 5, `${pou}.I_PID`, "CL_INT", "io4", 0, 5000);
    mask.text(3, 0, "Min:");
    mask.variable(3, 5, `${pou}.Low_Lim_PID`, "CL_REAL_1", "io+3.1", "0.0", "100.0");
    mask.text(3, 12, "%");
    mask.text(4, 0, "Max:");
    mask.variable(4, 5, `${pou}.High_Lim_PID`, "CL_REAL_1", "io+3.1", "0.0", "100.0");
    mask.text(4, 12, "%");
  }
  return masks;
}

function loopRange(text, name){
  const open = new RegExp(`<Loop Name="${name}"[^>]*>`).exec(text);
  if (!open) return null;
  const close = text.indexOf("</Loop>", open.index);
  if (close < 0) return null;
  return { start: open.index + open[0].length, end: close };
}

function withoutOwnMasks(body){
  return body.replace(new RegExp(`[ \\t]*<Mask Name="${PREFIX}[^"]*"[\\s\\S]*?</Mask>\\r?\\n`, "g"), "");
}

function fillLoop(text, name, build){
  const range = loopRange(text, name);
  if (!range) throw new Error(`The worksheet has no ${name} loop`);
  const body = withoutOwnMasks(text.slice(range.start, range.end));
  const ys = [...body.matchAll(/<Mask Name="[^"]*"[^>]*\bY="(\d+)"/g)].map((match) => Number(match[1]));
  const kept = ys.length;
  const masks = build(kept + 1);
  let y = ys.length ? Math.max(...ys) : 2;
  const xml = masks.map((mask) => mask.xml().replace(/ Y="0">/, () => ` Y="${++y}">`));
  const indent = body.match(/([ \t]*)$/)[1];
  const trimmed = body.slice(0, body.length - indent.length);
  const next = trimmed + xml.map((entry) => entry + NL).join("") + indent;
  return { text: text.slice(0, range.start) + next + text.slice(range.end), added: masks.length };
}

export function updateWorksheet(text, points, branches){
  const inputs = fillLoop(text, "InputOutput", (start) => inputMasks(points, start));
  const controls = fillLoop(inputs.text, "CONTROLLA", (start) => branchMasks(branches, start));
  return { text: controls.text, io: inputs.added, branches: controls.added };
}
