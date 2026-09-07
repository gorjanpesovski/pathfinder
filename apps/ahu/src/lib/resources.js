// Resolves the resource manifest against the files that actually sit in
// ./resources, so the popup only ever renders resources it can hand over.
//
// The folder decides how a resource is delivered: files under elements/ are
// pulled in as asset URLs (any file type, downloaded as-is), files under maps/
// are inlined as text so they can go straight to the clipboard.
import { RESOURCE_GROUPS, RESOURCES } from "./resources/manifest.js";

const assetUrls = import.meta.glob("./resources/elements/**/*", {
    query: "?url",
    import: "default",
    eager: true
});

const textSources = import.meta.glob("./resources/maps/**/*", {
    query: "?raw",
    import: "default",
    eager: true
});

function formatBytes(text) {
    const bytes = new TextEncoder().encode(text).length;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function resolveResource(entry) {
    const path = `./resources/${entry.file.replace(/^\.\//, "")}`;
    const text = textSources[path];
    const url = assetUrls[path];

    if (text === undefined && url === undefined) {
        console.warn(`[resources] "${entry.id}" points at ${entry.file}, which does not exist`);
        return null;
    }

    return {
        id: entry.id,
        title: entry.title,
        description: entry.description ?? "",
        filename: path.split("/").pop(),
        text,
        url,
        size: text === undefined ? "" : formatBytes(text)
    };
}

export const RESOURCE_SECTIONS = RESOURCE_GROUPS.map((group) => ({
    ...group,
    resources: RESOURCES
        .filter((entry) => entry.group === group.id)
        .map(resolveResource)
        .filter(Boolean)
}));
