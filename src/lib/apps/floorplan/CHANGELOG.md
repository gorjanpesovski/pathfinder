# Floor plan change log

## v1.0.1 · 2026-10-26 · 712a503

Split the editor into core, diagram, apps and editor modules

- core: canvas, history, documents, text and geometry helpers, shared components
- diagram: the pipe and scene engine shared by hydronic, network and wiring, with its pipe, fitting and element editing
- apps/floorplan, hydronic, network, wiring: each app's own modules, components and editor logic
- editor: selection, pointer, transform, clipboard, pages, project, keyboard and exports, moved out of +page.svelte
- +page.svelte keeps the state, markup and styles (6,691 -> 2,849 lines)

No change in behaviour.
