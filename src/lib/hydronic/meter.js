import { HYDRONIC_ELEMENTS, mediumOf } from "./elements.js";
import { projectOnRoute, routeLength, routePoint } from "./route.js";
import { fittingPose } from "./geometry.js";
import { fittingBox } from "./fittingAlign.js";

const SENSOR_DISTANCE = 70;
const SENSOR_RADIUS = 11;
const REACH = 600;
const WIRE_OUT = 14;

function round4(value){
  return Math.round(value * 10000) / 10000;
}

function isVertical(angle){
  return Math.abs(Math.abs(angle) - 90) < 1;
}

function axes(vertical){
  return vertical ? { u: "x", v: "y" } : { u: "y", v: "x" };
}

function at(vertical, across, along){
  return vertical ? { x: across, y: along } : { x: along, y: across };
}

export function barGaps(pipes, bars, style){
  const gaps = [];
  for (const { pipe, route } of pipes) {
    const size = (pipe.width ?? style.pipeWidth) + style.gapSize - style.pipeWidth;
    for (let index = 1; index < route.length; index += 1) {
      const a = route[index - 1];
      const b = route[index];
      for (const bar of bars) {
        const vertical = bar.height > bar.width;
        const { u, v } = axes(!vertical);
        const across = vertical ? { start: bar.x, size: bar.width } : { start: bar.y, size: bar.height };
        const along = vertical ? { start: bar.y, size: bar.height } : { start: bar.x, size: bar.width };
        if (Math.abs(a[u] - b[u]) > 0.5) continue;
        const position = a[u];
        if (position <= along.start || position >= along.start + along.size) continue;
        const low = Math.min(a[v], b[v]);
        const high = Math.max(a[v], b[v]);
        if (across.start <= low + 0.5 || across.start + across.size >= high - 0.5) continue;
        gaps.push({
          pipe,
          barId: bar.id,
          ...(vertical
            ? { x: bar.x, y: position - size / 2, width: bar.width, height: size }
            : { x: position - size / 2, y: bar.y, width: size, height: bar.height }),
          line: [at(!vertical, position, across.start - 1), at(!vertical, position, across.start + across.size + 1)]
        });
      }
    }
  }
  return gaps;
}

export function placeSensors(entries, hostId, fitting){
  const host = entries.find((entry) => entry.pipe.id === hostId);
  if (!host) return [];
  const spot = routePoint(host.route, fitting.t);
  const vertical = isVertical(spot.angle);
  const { u, v } = axes(vertical);
  const step = SENSOR_DISTANCE / Math.max(1, routeLength(host.route));
  const spots = [{ pipeId: hostId, t: round4(fitting.t + step <= 0.98 ? fitting.t + step : Math.max(0.02, fitting.t - step)) }];
  let best = null;
  for (const entry of entries) {
    if (entry.pipe.id === hostId || mediumOf(entry.pipe.medium).network || mediumOf(entry.pipe.medium).electric) continue;
    for (let index = 1; index < entry.route.length; index += 1) {
      const a = entry.route[index - 1];
      const b = entry.route[index];
      if (Math.abs(a[u] - b[u]) > 0.5 || spot[v] < Math.min(a[v], b[v]) || spot[v] > Math.max(a[v], b[v])) continue;
      const gap = Math.abs(a[u] - spot[u]);
      if (gap < 1 || gap > REACH || (best && gap >= best.gap)) continue;
      best = { entry, gap, point: at(vertical, a[u], spot[v]) };
    }
  }
  if (best) {
    const hit = projectOnRoute(best.entry.route, best.point, SENSOR_RADIUS * 2);
    if (hit) spots.push({ pipeId: best.entry.pipe.id, t: round4(hit.t) });
  }
  return spots;
}

export function calorimeterWires(shapes, routes){
  const placed = [];
  for (const pipe of shapes) {
    const route = pipe.kind === "pipe" ? routes.get(pipe.id) : null;
    if (route) for (const fitting of pipe.fittings ?? []) placed.push({ pipe, fitting, route });
  }
  const wires = [];
  for (const meter of placed) {
    if (!HYDRONIC_ELEMENTS[meter.fitting.type]?.sensors) continue;
    const sensors = placed.filter((entry) => entry.fitting.meterOf === meter.fitting.id);
    if (!sensors.length) continue;
    const box = fittingBox(meter.route, meter.fitting);
    const centre = box.pose;
    const vertical = isVertical(routePoint(meter.route, meter.fitting.t).angle);
    const { u, v } = axes(vertical);
    const half = (vertical ? box.width : box.height) / 2;
    const quarter = (vertical ? box.height : box.width) / 4;
    const poses = sensors.map((entry) => fittingPose(entry.route, entry.fitting));
    const across = poses.find((pose) => Math.abs(pose[u] - centre[u]) >= 1);
    const outward = (across ? Math.sign(across[u] - centre[u]) : 0) || 1;
    sensors.forEach((sensor, index) => {
      const pose = poses[index];
      const radius = SENSOR_RADIUS * (sensor.fitting.scale ?? 1);
      if (Math.abs(pose[u] - centre[u]) < 1) {
        const direction = Math.sign(pose[v] - centre[v]) || 1;
        const out = centre[u] + outward * (half + WIRE_OUT);
        const from = centre[v] + direction * quarter;
        wires.push([at(vertical, centre[u] + outward * half, from), at(vertical, out, from), at(vertical, out, pose[v]), at(vertical, pose[u] + outward * radius, pose[v])]);
        return;
      }
      const side = Math.sign(pose[u] - centre[u]);
      const start = centre[u] + side * half;
      const end = pose[u] - side * radius;
      if (Math.abs(pose[v] - centre[v]) < 0.5) {
        wires.push([at(vertical, start, centre[v]), at(vertical, end, pose[v])]);
        return;
      }
      const middle = (start + end) / 2;
      wires.push([at(vertical, start, centre[v]), at(vertical, middle, centre[v]), at(vertical, middle, pose[v]), at(vertical, end, pose[v])]);
    });
  }
  return wires;
}
