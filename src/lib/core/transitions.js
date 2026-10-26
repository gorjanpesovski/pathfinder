import { prefersReducedMotion } from "svelte/motion";
import { cubicOut } from "svelte/easing";

export function appear(node, { duration = 240, dy = 6 } = {}) {
  if (prefersReducedMotion.current) return { duration: 0 };
  return {
    duration,
    easing: cubicOut,
    css: (t, u) => `opacity: ${t}; transform: translate(0, ${u * dy}px);`
  };
}

export function addRow(node, { duration = 220 } = {}) {
  if (prefersReducedMotion.current) return { duration: 0 };
  const height = parseFloat(getComputedStyle(node).height);
  return {
    duration,
    easing: cubicOut,
    css: (t, u) => `
      opacity: ${t};
      height: ${t * height}px;
      margin-top: ${u * -8}px;
      align-items: flex-start;
      overflow: hidden;
    `
  };
}
