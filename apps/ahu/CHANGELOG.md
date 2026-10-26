# Auto AHU change log

## v1.1.17 · 2026-10-22 · 70129ca

Draw units without heat recovery, version 1.1.0

- Heat recovery can be set to None: one Zajem to Dovod duct across the middle, no exchanger, Izpuh or Odvod; elements on the hidden lines are kept for when recovery is switched back on
- Recovery switch in the Unit panel and the heat exchanger popup; a dashed placeholder on hover brings the exchanger back
- Export centres the title on the display instead of a fixed x
- Status indicators 8 px smaller, on elements and in the unit status row
- Humidifier gets a status indicator (Carel Status_Humidifier)
- Humidifier readout renamed to Output, electric heater readout to Power
- New electric heater icon with a lightning bolt, drawn into the display by default
- Version 1.1.0; the patch number now counts commits since the last version change

## v0.2.16 · 2026-10-21 · fe39b61

Add pages, project files and an export prompt; remove auto-fill

- Multiple pages per project with a tab bar, like Pathfinder: add, rename, duplicate, delete, and reorder by dragging or Move left/right
- File menu with New, Open, Save, Save as, Save a copy, Download and autosave to file; projects are saved as .ahu.json and kept in the browser between reloads
- Project name and save status in the header, version in the tab bar
- Copy to atvise now asks for the Modbus table and node path prefix, remembered per page; both removed from Settings
- Resources and Settings moved into the File menu, header buttons removed
- Remove auto-fill
- Resources now only offer the Modbus tables; object display elements removed
- Carel Modbus table addresses shifted down by one
- Readouts use in_out_value_custom with forced decimal fraction position
- Title positioned at y 33.5 in atvise
- Carel operating mode script uses the full list of 20 unit states
- Unit status indicators evenly spaced using Roboto character widths

## v0.2.15 · 2026-10-10 · d5aa084

Add Systemair Access 5 table, auto-fill and more AHU elements

- Add Systemair Access 5 Modbus table next to Carel, with the map file in Resources (spelling fixes, English names, heating/cooling pumps, fan starts, freeze temperature, efficiency, room temperature, sum alarms)
- Add Auto-fill button that switches on every readout, setpoint, indicator and coil fitting the selected table has a register for, on line elements, heat exchanger and unit panel
- Show operating mode as live text under the title (webMI script in export)
- New elements: air flow, VOC and after-recovery sensors, DX coil, silencer
- Coil pumps and three-way valves, fan status indicator, filter alarm
- Heat exchanger bypass and mixing dampers at full size, wheel speed and efficiency readouts, defrost and dirty indicators
- Unit panel with room sensors and status row (global, serious, fire alarms)
- Junction circles where pipes, ducts and ΔP lines meet
- Mixing damper aligned as first column, fans mirrored by flow direction
- Hover + Delete removes an element, pointer cursor on elements
- Element names in the catalogue without line-specific words

## v0.2.14 · 2026-10-09 · b44c934

Build AHU displays directly in the preview with generic icons

Replace the Carel element library with generic icons from 6. Ikone, with names editable in Settings
Draw readouts, setpoints, dP switch and alarm indicators per element
Add a Settings dialog in Pathfinder style for display size, Modbus table, node path prefix, icon library and icon names
Add pipe labels Dovod, Odvod, Zajem and Izpuh next to the arrows
Port the Pathfinder fonts, make the header compact and move the version to the bottom right corner
Swap the Odvod and Izpuh line colours
Remove the left panel: add elements with + markers and a searchable menu on the pipes, edit them by clicking, remove them with x or Delete
Allow the same element to be added more than once
Move elements and the heat exchanger by press-and-hold dragging with live reflow, drop slot and settle animation
Edit the title in place and choose the heat exchanger type from the preview; double-click centres it
Line up the elements on both lines of a side and spread them evenly along the pipe
Animate elements when they are placed and removed
Move export to a Copy to atvise button in the header
Update the README for the new workflow

## v0.2.13 · 2026-09-09 · 886e266

Fix: Chrome slider issue

## v0.2.12 · 2026-09-09 · 8b63238

Added website tracking

## v0.2.11 · 2026-09-07 · 432db73

Patches, version control, resouce map update

## v0.0.10 · 2026-09-07 · 09fedf3

Resolved merge conflicts by accepting remote changes

## v0.0.9 · 2026-09-05 · 2a38c43

Resources Tab

## v0.0.8 · 2026-09-05 · c9a2cb1

Website

## v0.0.7 · 2026-09-04 · b87aa64

Updates

## v0.0.6 · 2026-09-04 · 697e7cc

Added additional elements, fixed icon loading issue

## v0.0.5 · 2026-09-04 · 21cdae7

Added aditional elements, added recuperation unit x position slider, added position switch for the intake and exhaust line based on recuperation unit

## v0.0.4 · 2026-08-31 · f83b15a

Icon updates

## v0.0.3 · 2026-08-31 · 77289c2

Updates

## v0.0.2 · 2026-08-24 · f25f085

Updates

## v0.0.1 · 2026-08-24 · dba96c2

Initial commit
