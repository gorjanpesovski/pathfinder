# Wiring diagram change log

## v1.0.3 · 2026-10-26 · e3461ed

Give each app its own version and change log

- version.json in each app folder sets the app's major.minor and the folders that count as that app; the patch is the number of commits that touched them, leaving change logs out
- The page tabs bar and the logo tooltip show the current app's version next to the Pathfinder version
- npm run changelog adds new commits to each app's CHANGELOG.md

## v1.0.2 · 2026-10-26 · 1353d8c

Give each app its own file

- Files are saved per app (format pathfinder-<app>, version 2) with only that app's pages, settings, images and data: the IO list and variables in the hydronic station, the power and control lists in the wiring diagram
- Each app keeps its own open file, name, saved state, linked file, autosave and settings; switching apps swaps them
- Opening a file switches to its app; an old combined file loads each part into its app as a new, unsaved file named after the project
- The browser autosave is split per app once; the old one is kept as pathfinder.autosave.v1
- Wiring "From IO list" reads the IO list from a chosen hydronic file
- "New file" and "Pages from another file" work on the current app only

## v1.0.1 · 2026-10-26 · 712a503

Split the editor into core, diagram, apps and editor modules

- core: canvas, history, documents, text and geometry helpers, shared components
- diagram: the pipe and scene engine shared by hydronic, network and wiring, with its pipe, fitting and element editing
- apps/floorplan, hydronic, network, wiring: each app's own modules, components and editor logic
- editor: selection, pointer, transform, clipboard, pages, project, keyboard and exports, moved out of +page.svelte
- +page.svelte keeps the state, markup and styles (6,691 -> 2,849 lines)

No change in behaviour.
