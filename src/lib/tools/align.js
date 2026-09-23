export const ALIGN_ACTIONS = [
  { id: "left", label: "Align left", shortcut: "Ctrl+Shift+4", code: "Digit4" },
  { id: "hcenter", label: "Align horizontally", shortcut: "Ctrl+Shift+1", code: "Digit1" },
  { id: "right", label: "Align right", shortcut: "Ctrl+Shift+6", code: "Digit6" },
  { id: "top", label: "Align top", shortcut: "Ctrl+Shift+8", code: "Digit8" },
  { id: "vcenter", label: "Align vertically", shortcut: "Ctrl+Shift+7", code: "Digit7" },
  { id: "bottom", label: "Align bottom", shortcut: "Ctrl+Shift+2", code: "Digit2" }
];

export const DISTRIBUTE_ACTIONS = [
  { axis: "x", label: "Distribute horizontally", shortcut: "Ctrl+Shift+3", code: "Digit3" },
  { axis: "y", label: "Distribute vertically", shortcut: "Ctrl+Shift+9", code: "Digit9" }
];

export function alignOffsets(boxes, mode, frame){
  return boxes.map((box) => {
    switch (mode) {
      case "left": return { dx: frame.x - box.x, dy: 0 };
      case "hcenter": return { dx: frame.x + frame.width / 2 - (box.x + box.width / 2), dy: 0 };
      case "right": return { dx: frame.x + frame.width - (box.x + box.width), dy: 0 };
      case "top": return { dx: 0, dy: frame.y - box.y };
      case "vcenter": return { dx: 0, dy: frame.y + frame.height / 2 - (box.y + box.height / 2) };
      case "bottom": return { dx: 0, dy: frame.y + frame.height - (box.y + box.height) };
      default: return { dx: 0, dy: 0 };
    }
  });
}

export function distributeOffsets(boxes, axis){
  const start = axis === "x" ? "x" : "y";
  const size = axis === "x" ? "width" : "height";
  const order = boxes.map((_, index) => index).sort((a, b) => boxes[a][start] - boxes[b][start]);
  const first = boxes[order[0]];
  const last = boxes[order[order.length - 1]];
  const span = last[start] + last[size] - first[start];
  const occupied = boxes.reduce((total, box) => total + box[size], 0);
  const gap = (span - occupied) / (boxes.length - 1);

  const offsets = boxes.map(() => ({ dx: 0, dy: 0 }));
  let position = first[start];
  for (const index of order) {
    const shift = position - boxes[index][start];
    offsets[index] = axis === "x" ? { dx: shift, dy: 0 } : { dx: 0, dy: shift };
    position += boxes[index][size] + gap;
  }
  return offsets;
}

export function contains(outer, inner){
  return inner.x >= outer.x
    && inner.y >= outer.y
    && inner.x + inner.width <= outer.x + outer.width
    && inner.y + inner.height <= outer.y + outer.height;
}
