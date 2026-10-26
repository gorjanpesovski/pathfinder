// Resolves the resource manifest against the files that actually sit in
// ./resources/maps, so the popup only ever renders tables it can hand over.
// The tables are inlined as text so they can go straight to the clipboard.
import { RESOURCE_GROUPS, RESOURCES } from "./resources/manifest.js";

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

    if (text === undefined) {
        console.warn(`[resources] "${entry.id}" points at ${entry.file}, which does not exist`);
        return null;
    }

    return {
        id: entry.id,
        title: entry.title,
        description: entry.description ?? "",
        filename: path.split("/").pop(),
        text,
        size: formatBytes(text)
    };
}

export const RESOURCE_SECTIONS = RESOURCE_GROUPS.map((group) => ({
    ...group,
    resources: RESOURCES
        .filter((entry) => entry.group === group.id)
        .map(resolveResource)
        .filter(Boolean)
}));
