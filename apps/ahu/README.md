# Auto AHU — User Manual

Auto AHU helps you build an AHU (Air Handling Unit) display screen without drawing it by hand. Build the unit directly in the preview, then export a ready-to-use display.

## 1. Settings

Open **Settings** (top right). Everything there is saved in your browser:

- **Display size** — width and height of the atvise display in pixels.
- **Modbus table** — the controller type your unit uses (currently: Carel).
- **Node path prefix** — the base address for your project (e.g. `AGENT.OBJECTS.Klimat`). It is put in front of every register, so you only set it once.
- **Icon library** — the atvise folder holding the icons (default `SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS.6.%20Ikone`).
- **Icons** — the object display name used for each component. Leave a name empty and the icon is drawn straight into the display instead.

## 2. Title and heat exchanger

- **Title** — click the title in the preview to rename it. Press Enter when done.
- **Heat exchanger** — click it to choose **Plate** or **Rotary**, or to centre it. Drag it left or right to move it; double-click it to centre it again.

## 3. Add components to each line

There are four lines: **Exhaust** (Izpuh), **Intake** (Zajem), **Return** (Odvod) and **Supply** (Dovod).

- **Add** — hover a pipe and click one of the **+** markers. Type to search, then pick a component (or press Enter for the first match); it is placed exactly at that spot. The list shows the components that belong on that line, and the same component can be added more than once.
- **Edit** — click a component to open its options:
  - **Signal** — continuous or discrete (dampers, humidifier).
  - **Readout** — value boxes next to the icon (temperature, humidity, CO₂, pressure, flow, position, speed).
  - **Setpoint** — a setpoint box for the measured value.
  - **Indicator** — a ΔP switch or alarm icon on the component.
- **Move** — drag a component along its pipe.
- **Remove** — click the × that appears on hover, press Delete while it is selected, or use **Remove** in its options.

Use **Element size** in the bottom-right corner of the preview to make all components smaller or larger.

## 4. Export

Click **Copy to atvise** (top right). The finished display is copied to your clipboard — paste it into atvise as a new SVG display.

## Tips

- If a component looks unbound or missing data after import, double-check the node path prefix, icon library and Modbus table in Settings.
- You can revisit and change anything — the preview and export always reflect your latest choices.
