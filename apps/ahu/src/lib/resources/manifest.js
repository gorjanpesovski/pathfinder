// Everything listed in the header's Resources popup.
//
// To add a resource:
//   1. Drop the file into ./elements (offered as a download) or ./maps
//      (offered as copy-to-clipboard, with a download as a fallback).
//   2. Add an entry below. `file` is relative to this folder, `group` has to
//      match one of the RESOURCE_GROUPS ids.
//
// An entry whose file is missing is skipped, so a half-finished line never
// breaks the page — check the console for the warning.

export const RESOURCE_GROUPS = [{
        id: "elements",
        title: "Object Display Elements",
        description: "The element displays the generator places on the lines.",
        folder: "src/lib/resources/elements/"
    },
    {
        id: "maps",
        title: "Modbus Tables",
        description: "Modbus tables per controller family used in the code.",
        folder: "src/lib/resources/maps/"
    }
];

export const RESOURCES = [
    {
        id: "carel-modbus-map",
        group: "maps",
        title: "Carel Modbus Table",
        description: "",
        file: "./maps/carel-modbus-map.txt"
    }
];
