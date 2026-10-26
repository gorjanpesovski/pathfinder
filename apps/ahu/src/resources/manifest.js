// Everything listed in the Resources popup.
//
// To add a Modbus table:
//   1. Drop the file into ./maps (offered as copy-to-clipboard and download).
//   2. Add an entry below. `file` is relative to this folder.
//
// An entry whose file is missing is skipped, so a half-finished line never
// breaks the page — check the console for the warning.

export const RESOURCE_GROUPS = [
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
    },
    {
        id: "access5-modbus-map",
        group: "maps",
        title: "Systemair Access 5 Modbus Table",
        description: "",
        file: "./maps/access5-modbus-map.txt"
    }
];
