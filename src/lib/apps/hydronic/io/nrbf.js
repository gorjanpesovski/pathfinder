const PRIMITIVE_SIZE = { 1: 1, 2: 1, 6: 8, 7: 2, 8: 4, 9: 8, 10: 1, 11: 4, 12: 8, 13: 8, 14: 2, 15: 4, 16: 8 };

class Reader {
  constructor(bytes, offset){
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.pos = offset;
    this.decoder = new TextDecoder();
  }

  u8(){
    return this.bytes[this.pos++];
  }

  i32(){
    const value = this.view.getInt32(this.pos, true);
    this.pos += 4;
    return value;
  }

  take(length){
    const slice = this.bytes.slice(this.pos, this.pos + length);
    this.pos += length;
    return slice;
  }

  string(){
    let length = 0;
    let shift = 0;
    for (;;) {
      const byte = this.u8();
      length |= (byte & 0x7f) << shift;
      shift += 7;
      if (!(byte & 0x80)) break;
    }
    return this.decoder.decode(this.take(length));
  }

  primitive(type){
    if (type === 1) return this.u8() !== 0;
    if (type === 8) return this.i32();
    if (type === 6) {
      const value = this.view.getFloat64(this.pos, true);
      this.pos += 8;
      return value;
    }
    if (type === 5 || type === 18) return this.string();
    if (!PRIMITIVE_SIZE[type]) throw new Error(`Unsupported primitive type ${type}`);
    return { raw: this.take(PRIMITIVE_SIZE[type]) };
  }
}

class Writer {
  constructor(){
    this.chunks = [];
    this.encoder = new TextEncoder();
  }

  push(bytes){
    this.chunks.push(bytes);
  }

  u8(value){
    this.push(Uint8Array.of(value));
  }

  i32(value){
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setInt32(0, value, true);
    this.push(bytes);
  }

  string(value){
    const encoded = this.encoder.encode(value);
    const prefix = [];
    let length = encoded.length;
    do {
      let byte = length & 0x7f;
      length >>>= 7;
      if (length) byte |= 0x80;
      prefix.push(byte);
    } while (length);
    this.push(Uint8Array.from(prefix));
    this.push(encoded);
  }

  primitive(type, value){
    if (type === 1) return this.u8(value ? 1 : 0);
    if (type === 8) return this.i32(value);
    if (type === 6) {
      const bytes = new Uint8Array(8);
      new DataView(bytes.buffer).setFloat64(0, value, true);
      return this.push(bytes);
    }
    if (type === 5 || type === 18) return this.string(value);
    this.push(value.raw);
  }

  bytes(){
    const total = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of this.chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
}

export function parseNrbf(bytes, offset = 0){
  const reader = new Reader(bytes, offset);
  const objects = new Map();
  const libraries = new Map();
  const classes = new Map();
  const fixups = [];
  let rootId = null;

  function typeInfos(count){
    const kinds = Array.from({ length: count }, () => reader.u8());
    return kinds.map((bt) => {
      if (bt === 0 || bt === 7) return { bt, primitive: reader.u8() };
      if (bt === 3) return { bt, name: reader.string() };
      if (bt === 4) return { bt, name: reader.string(), lib: libraries.get(reader.i32()) };
      return { bt };
    });
  }

  function classInfo(){
    const id = reader.i32();
    const name = reader.string();
    const count = reader.i32();
    const members = Array.from({ length: count }, () => reader.string());
    return { id, name, members };
  }

  function register(id, node){
    if (id !== 0) objects.set(id, node);
    if (id < 0) node.valueType = true;
    return node;
  }

  function slot(holder, key, record){
    if (record && record.ref !== undefined) {
      fixups.push([holder, key, record.ref]);
      holder[key] = null;
    } else {
      holder[key] = record ?? null;
    }
  }

  function readValues(cls, node){
    node.values = [];
    cls.types.forEach((info, index) => {
      if (info.bt === 0) node.values[index] = reader.primitive(info.primitive);
      else slot(node.values, index, record());
    });
  }

  function readItems(node, total, info){
    node.values = [];
    let index = 0;
    while (index < total) {
      if (info && (info.bt === 0 || info.bt === 7)) {
        node.values[index++] = reader.primitive(info.primitive);
        continue;
      }
      const item = record();
      if (item?.nulls) {
        for (let n = 0; n < item.nulls; n += 1) node.values[index++] = null;
        continue;
      }
      slot(node.values, index++, item);
    }
  }

  function record(){
    const type = reader.u8();
    if (type === 12) {
      const id = reader.i32();
      libraries.set(id, reader.string());
      return record();
    }
    if (type === 5 || type === 4) {
      const info = classInfo();
      const types = typeInfos(info.members.length);
      const lib = type === 5 ? libraries.get(reader.i32()) : null;
      const cls = { name: info.name, members: info.members, types, lib };
      classes.set(info.id, cls);
      const node = register(info.id, { kind: "object", cls });
      readValues(cls, node);
      return node;
    }
    if (type === 1) {
      const id = reader.i32();
      const cls = classes.get(reader.i32());
      classes.set(id, cls);
      const node = register(id, { kind: "object", cls });
      readValues(cls, node);
      return node;
    }
    if (type === 6) {
      const id = reader.i32();
      return register(id, { kind: "string", value: reader.string() });
    }
    if (type === 9) return { ref: reader.i32() };
    if (type === 10) return null;
    if (type === 13) return { nulls: reader.u8() };
    if (type === 14) return { nulls: reader.i32() };
    if (type === 8) {
      const primitive = reader.u8();
      return { kind: "boxed", primitive, value: reader.primitive(primitive) };
    }
    if (type === 7) {
      const id = reader.i32();
      const arrayType = reader.u8();
      const rank = reader.i32();
      const lengths = Array.from({ length: rank }, () => reader.i32());
      const lowerBounds = arrayType >= 3 && arrayType <= 5 ? Array.from({ length: rank }, () => reader.i32()) : null;
      const [item] = typeInfos(1);
      const node = register(id, { kind: "array", arrayType, lengths, lowerBounds, item });
      readItems(node, lengths.reduce((a, b) => a * b, 1), item);
      return node;
    }
    if (type === 16 || type === 17) {
      const id = reader.i32();
      const node = register(id, { kind: type === 16 ? "objectArray" : "stringArray" });
      readItems(node, reader.i32(), null);
      return node;
    }
    if (type === 15) {
      const id = reader.i32();
      const length = reader.i32();
      const primitive = reader.u8();
      const node = register(id, { kind: "primitiveArray", primitive });
      if (primitive === 2) node.bytes = reader.take(length);
      else readItems(node, length, { bt: 0, primitive });
      return node;
    }
    if (type === 0) {
      rootId = reader.i32();
      reader.take(12);
      return { header: true };
    }
    if (type === 11) return { end: true };
    throw new Error(`Unsupported record type ${type} at ${reader.pos - 1}`);
  }

  for (;;) {
    const next = record();
    if (next?.end) break;
  }
  for (const [holder, key, id] of fixups) {
    if (!objects.has(id)) throw new Error(`Missing object ${id}`);
    holder[key] = objects.get(id);
  }
  return objects.get(rootId);
}

export function writeNrbf(root){
  const out = new Writer();
  const ids = new Map();
  const written = new Set();
  const libraryIds = new Map();
  const classIds = new Map();
  const queue = [];
  let counter = 0;

  function referenceId(node){
    if (!ids.has(node)) {
      ids.set(node, ++counter);
      queue.push(node);
    }
    return ids.get(node);
  }

  function ownLibraries(node, found){
    if (node?.kind === "object" && node.cls.lib) found.add(node.cls.lib);
    if (node?.kind === "array" && node.item.bt === 4 && node.item.lib) found.add(node.item.lib);
  }

  function neededLibraries(node, found){
    if (!node || typeof node !== "object") return;
    ownLibraries(node, found);
    if (node.kind === "object") {
      node.cls.types.forEach((info, index) => {
        if (info.bt === 4 && info.lib) found.add(info.lib);
        if (info.bt === 0) return;
        const item = node.values[index];
        if (item?.valueType) neededLibraries(item, found);
        else if (!written.has(item)) ownLibraries(item, found);
      });
    } else if (node.kind === "array") {
      for (const item of node.values) if (item?.valueType) neededLibraries(item, found);
    }
  }

  function emitLibraries(node){
    const found = new Set();
    neededLibraries(node, found);
    for (const name of found) {
      if (libraryIds.has(name)) continue;
      const id = ++counter;
      libraryIds.set(name, id);
      out.u8(12);
      out.i32(id);
      out.string(name);
    }
  }

  function typeInfo(info){
    if (info.bt === 0 || info.bt === 7) out.u8(info.primitive);
    else if (info.bt === 3) out.string(info.name);
    else if (info.bt === 4) {
      out.string(info.name);
      out.i32(libraryIds.get(info.lib));
    }
  }

  function value(item){
    if (item === null || item === undefined) return out.u8(10);
    if (item.kind === "boxed") {
      out.u8(8);
      out.u8(item.primitive);
      return out.primitive(item.primitive, item.value);
    }
    if (item.kind === "string") {
      if (written.has(item)) {
        out.u8(9);
        return out.i32(ids.get(item));
      }
      const id = ++counter;
      ids.set(item, id);
      written.add(item);
      out.u8(6);
      out.i32(id);
      return out.string(item.value);
    }
    if (item.valueType) return body(item, -(++counter));
    out.u8(9);
    out.i32(referenceId(item));
  }

  function items(node){
    const info = node.item ?? (node.kind === "primitiveArray" ? { bt: 0, primitive: node.primitive } : null);
    let index = 0;
    while (index < node.values.length) {
      const item = node.values[index];
      if (info && (info.bt === 0 || info.bt === 7)) {
        out.primitive(info.primitive, item);
        index += 1;
        continue;
      }
      if (item === null || item === undefined) {
        let run = 0;
        while (index + run < node.values.length && (node.values[index + run] ?? null) === null) run += 1;
        if (run === 1) out.u8(10);
        else if (run < 256) {
          out.u8(13);
          out.u8(run);
        } else {
          out.u8(14);
          out.i32(run);
        }
        index += run;
        continue;
      }
      value(item);
      index += 1;
    }
  }

  function body(node, id){
    written.add(node);
    if (node.kind === "object") {
      const key = `${node.cls.name}|${node.cls.lib ?? ""}`;
      if (classIds.has(key)) {
        out.u8(1);
        out.i32(id);
        out.i32(classIds.get(key));
      } else {
        classIds.set(key, id);
        out.u8(node.cls.lib ? 5 : 4);
        out.i32(id);
        out.string(node.cls.name);
        out.i32(node.cls.members.length);
        node.cls.members.forEach((member) => out.string(member));
        node.cls.types.forEach((info) => out.u8(info.bt));
        node.cls.types.forEach(typeInfo);
        if (node.cls.lib) out.i32(libraryIds.get(node.cls.lib));
      }
      node.cls.types.forEach((info, index) => {
        if (info.bt === 0) out.primitive(info.primitive, node.values[index]);
        else value(node.values[index]);
      });
      return;
    }
    if (node.kind === "array") {
      out.u8(7);
      out.i32(id);
      out.u8(node.arrayType);
      out.i32(node.lengths.length);
      node.lengths.forEach((length) => out.i32(length));
      node.lowerBounds?.forEach((bound) => out.i32(bound));
      out.u8(node.item.bt);
      typeInfo(node.item);
      return items(node);
    }
    if (node.kind === "primitiveArray") {
      out.u8(15);
      out.i32(id);
      out.i32(node.bytes ? node.bytes.length : node.values.length);
      out.u8(node.primitive);
      if (node.bytes) return out.push(node.bytes);
      return items(node);
    }
    out.u8(node.kind === "objectArray" ? 16 : 17);
    out.i32(id);
    out.i32(node.values.length);
    items(node);
  }

  out.u8(0);
  out.i32(1);
  out.i32(-1);
  out.i32(1);
  out.i32(0);
  referenceId(root);
  while (queue.length) {
    const node = queue.shift();
    if (written.has(node)) continue;
    emitLibraries(node);
    body(node, ids.get(node));
  }
  out.u8(11);
  return out.bytes();
}

export function member(node, name){
  const index = node.cls.members.findIndex((entry) => entry === name || entry.endsWith(`+${name}`));
  return index < 0 ? undefined : node.values[index];
}

export function setMember(node, name, next){
  node.cls.members.forEach((entry, index) => {
    if (entry === name || entry.endsWith(`+${name}`)) node.values[index] = next;
  });
}

export function cloneGraph(node, copies = new Map()){
  if (!node || typeof node !== "object" || node.raw) return node;
  if (copies.has(node)) return copies.get(node);
  if (node.kind === "boxed") return { ...node };
  const copy = { ...node };
  copies.set(node, copy);
  if (node.values) copy.values = node.values.map((item) => cloneGraph(item, copies));
  if (node.bytes) copy.bytes = node.bytes.slice();
  if (node.lengths) copy.lengths = [...node.lengths];
  return copy;
}

export function walkGraph(node, visit, seen = new Set()){
  if (!node || typeof node !== "object" || node.raw || seen.has(node)) return;
  seen.add(node);
  visit(node);
  node.values?.forEach((item) => walkGraph(item, visit, seen));
}
