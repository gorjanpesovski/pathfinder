const modules = import.meta.glob("./icons/*.svg", {
  query: "?raw",
  import: "default",
  eager: true
});

function buildSymbol(name, source){
  const rootTag = source.match(/<svg\b[^>]*>/)[0];
  const width = rootTag.match(/\swidth="([\d.]+)"/)[1];
  const height = rootTag.match(/\sheight="([\d.]+)"/)[1];

  const body = source
    .slice(source.indexOf(rootTag) + rootTag.length, source.lastIndexOf("</svg>"))
    .replace(/<script\b[^>]*\/>|<script\b[\s\S]*?<\/script>/g, "")
    .replace(/<metadata\b[^>]*\/>|<metadata\b[\s\S]*?<\/metadata>/g, "")
    .replace(/\sid="([^"]*)"/g, ` id="hyd-${name}__$1"`)
    .replace(/url\(#([^)]*)\)/g, `url(#hyd-${name}__$1)`);

  return `<symbol id="hyd-${name}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">${body}</symbol>`;
}

const symbols = Object.entries(modules)
  .map(([path, source]) => buildSymbol(path.match(/([^/]+)\.svg$/)[1], source))
  .join("");

export const HYDRONIC_SPRITE = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${symbols}</svg>`;

export const ICON_SIZES = Object.fromEntries(Object.entries(modules).map(([path, source]) => {
  const rootTag = source.match(/<svg\b[^>]*>/)[0];
  return [path.match(/([^/]+)\.svg$/)[1], {
    width: Number(rootTag.match(/\swidth="([\d.]+)"/)[1]),
    height: Number(rootTag.match(/\sheight="([\d.]+)"/)[1])
  }];
}));

export const ICON_SOURCES = Object.fromEntries(Object.entries(modules).map(([path, source]) => [path.match(/([^/]+)\.svg$/)[1], source]));
