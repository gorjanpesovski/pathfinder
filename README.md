# Pathfinder

Grid-based drawing tool. Settings on the left, live preview on the right.

- **Grid** — spacing, canvas size and appearance are all adjustable; every tool snaps to it.
- **Line tool** — click two points, get a Manhattan (orthogonal) trace between them.
- **Rectangle tool** — click two opposite corners.

## Developing

```sh
npm install
npm run dev
```

## Building

```sh
npm run build
```

Static output lands in `build/`. The GitHub Pages workflow in `.github/workflows/deploy.yml`
builds with `BASE_PATH` set to the repo name.
