# Floor plan change log

## v1.0.3 · 2026-10-26 · c635b03

Split the code into npm workspace packages

- packages/core and packages/diagram, and apps/floorplan, hydronic, network and wiring, each with its own package.json, version and declared dependencies
- Imports across packages use @pathfinder/<package>/...; only the shell in src (routes and lib/editor) uses $lib
- The app list moves to src/lib/editor/apps.js and the wiring diagram reads hydronic files through ctx, so no package imports the shell
- App versions and change logs read apps/*/package.json; the version count includes the old folder paths so the numbers continue

No change in behaviour.

## v1.0.2 · 2026-10-26 · e3461ed

Give each app its own version and change log

- version.json in each app folder sets the app's major.minor and the folders that count as that app; the patch is the number of commits that touched them, leaving change logs out
- The page tabs bar and the logo tooltip show the current app's version next to the Pathfinder version
- npm run changelog adds new commits to each app's CHANGELOG.md

## v1.0.1 · 2026-10-26 · 712a503

Split the editor into core, diagram, apps and editor modules

- core: canvas, history, documents, text and geometry helpers, shared components
- diagram: the pipe and scene engine shared by hydronic, network and wiring, with its pipe, fitting and element editing
- apps/floorplan, hydronic, network, wiring: each app's own modules, components and editor logic
- editor: selection, pointer, transform, clipboard, pages, project, keyboard and exports, moved out of +page.svelte
- +page.svelte keeps the state, markup and styles (6,691 -> 2,849 lines)

No change in behaviour.
