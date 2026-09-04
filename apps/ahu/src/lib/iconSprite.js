// Builds a single inline <symbol> sprite from the atvise icon exports so the
// preview never hits the network. The raw files carry markup that is inert
// inside an <image> but not once inlined into the page:
//   - a webMI <script> that would actually run (and throw) in the document
//   - atv: metadata the browser has no use for
//   - ids (linear_0, alarm, dp_switch, id_0...) reused across every file
// They also have no viewBox, so the symbol takes one from the root width/height.
const modules = import.meta.glob("./icons/*.svg", {
    query: "?raw",
    import: "default",
    eager: true
});

function buildSymbol(name, source) {
    const rootTag = source.match(/<svg\b[^>]*>/)[0];
    const width = rootTag.match(/\swidth="([\d.]+)"/)[1];
    const height = rootTag.match(/\sheight="([\d.]+)"/)[1];

    const body = source
        .slice(source.indexOf(rootTag) + rootTag.length, source.lastIndexOf("</svg>"))
        .replace(/<script\b[^>]*\/>|<script\b[\s\S]*?<\/script>/g, "")
        .replace(/<metadata\b[^>]*\/>|<metadata\b[\s\S]*?<\/metadata>/g, "")
        .replace(/\sid="([^"]*)"/g, ` id="${name}__$1"`);

    return `<symbol id="icon-${name}" viewBox="0 0 ${width} ${height}">${body}</symbol>`;
}

const symbols = Object.entries(modules)
    .map(([path, source]) => buildSymbol(path.match(/([^/]+)\.svg$/)[1], source))
    .join("");

// width/height 0 rather than display:none — a hidden sprite still has to be
// rendered for <use> to resolve against it.
export const ICON_SPRITE = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">${symbols}</svg>`;
