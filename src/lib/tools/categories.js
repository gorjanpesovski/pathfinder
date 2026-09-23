export const ROOM_CATEGORIES = [
  { id: "office", label: "Office", fill: "#E0E7FF", stroke: "#4F46E5" },
  { id: "meeting", label: "Meeting room", fill: "#EDE9FE", stroke: "#7C3AED" },
  { id: "wc", label: "WC", fill: "#CFFAFE", stroke: "#0891B2" },
  { id: "kitchen", label: "Kitchen", fill: "#FFEDD5", stroke: "#EA580C" },
  { id: "storage", label: "Storage room", fill: "#FEF3C7", stroke: "#D97706" },
  { id: "corridor", label: "Corridor", fill: "#F1F5F9", stroke: "#64748B" },
  { id: "technical", label: "Technical room", fill: "#FEE2E2", stroke: "#DC2626" },
  { id: "server", label: "Server room", fill: "#DCFCE7", stroke: "#16A34A" },
  { id: "stairs", label: "Stairs", fill: "#F5F5F4", stroke: "#57534E" }
];

export function defaultCategoryColors(){
  return Object.fromEntries(ROOM_CATEGORIES.map((category) => [category.id, { fill: category.fill, stroke: category.stroke }]));
}

export function categoryLabel(id){
  return ROOM_CATEGORIES.find((category) => category.id === id)?.label ?? "";
}
