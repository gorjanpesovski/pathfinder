const LINE = /^\s*(?:sym-)?([^=\t;]+?)\s*(?:=|\t|;)\s*([^,\s;]+)\s*,?\s*$/;

export function parseSymbols(text){
  const list = [];
  const invalid = [];
  const seen = new Map();
  const duplicates = new Set();
  for (const raw of String(text ?? "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line === "[]") continue;
    const match = LINE.exec(line);
    if (!match) {
      invalid.push(line);
      continue;
    }
    const entry = { name: match[1].trim(), address: match[2].trim() };
    if (seen.has(entry.name)) {
      duplicates.add(entry.name);
      list[seen.get(entry.name)] = entry;
    }
    else {
      seen.set(entry.name, list.length);
      list.push(entry);
    }
  }
  return { list, invalid, duplicates: [...duplicates] };
}

export function symbolLines(list){
  return (list ?? []).map((entry) => `sym-${entry.name}=${entry.address},`).sort();
}

export function formatSymbols(list){
  return symbolLines(list).join("\n");
}

export function symbolFile(list){
  return ["[]", ...symbolLines(list), ""].join("\n");
}
