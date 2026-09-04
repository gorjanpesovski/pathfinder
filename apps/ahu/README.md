# Auto AHU — User Manual

Auto AHU helps you build an AHU (Air Handling Unit) display screen without drawing it by hand. Pick the components your unit has, arrange them, and export a ready-to-use display file.

## 1. Set up the display

- **Display Title** — the name shown at the top of the screen.
- **Width / Height** — the size of the display in pixels.

## 2. Choose the recuperation unit

Select **Plate Heat Exchanger** or **Rotary Heat Exchanger**. Use the slider below it to move the unit left or right.

## 3. Set the Modbus table and node path

- **Modbus Table** — select the controller type your unit uses (currently: Carel).
- **Node Path Prefix** — the base address for your project (e.g. `AGENT.OBJECTS.Klimat`). This is combined automatically with each component you add, so you only need to set it once.

## 4. Add components to each line

There are four lines: **Exhaust**, **Intake**, **Return**, and **Supply**. Tick the checkbox next to any component your unit has on that line — damper, filter, fan, sensors, coils, or electric heater. Some components show extra options once checked (for example, a damper's signal type, or a filter/fan's DP switch).

Components appear in the display in the order you check them. To change the order, drag a component up or down within its line.

## 5. Check the preview

The right-hand panel shows a live preview of your display, updating as you make changes.

## 6. Export

Click **Configure Selection**. The finished display is copied to your clipboard — paste it into atvise as a new SVG display.

## Tips

- If a component looks unbound or missing data after import, double-check the Node Path Prefix and Modbus Table selection.
- You can revisit and change any setting — the preview and export always reflect your latest choices.