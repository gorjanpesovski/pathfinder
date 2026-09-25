import { fittingPose, fittingSize } from "./export.js";
import { projectOnRoute } from "./route.js";

export function fittingBox(route, fitting){
  const pose = fittingPose(route, fitting);
  const size = fittingSize(fitting);
  const turned = pose.rotation % 180 !== 0;
  const width = turned ? size.height : size.width;
  const height = turned ? size.width : size.height;
  return { x: pose.x - width / 2, y: pose.y - height / 2, width, height, pose };
}

function pointAt(route, axis, value, near){
  const other = axis === "x" ? "y" : "x";
  let best = null;
  for (let index = 1; index < route.length; index += 1) {
    const a = route[index - 1];
    const b = route[index];
    let spot = null;
    if (a[other] === b[other] && value >= Math.min(a[axis], b[axis]) && value <= Math.max(a[axis], b[axis])) {
      spot = { [axis]: value, [other]: a[other] };
    } else if (a[axis] === b[axis] && Math.abs(a[axis] - value) < 0.01) {
      spot = { [axis]: value, [other]: Math.min(Math.max(a[other], b[other]), Math.max(Math.min(a[other], b[other]), near[other])) };
    }
    if (!spot) continue;
    const distance = Math.hypot(spot.x - near.x, spot.y - near.y);
    if (!best || distance < best.distance) best = { ...spot, distance };
  }
  return best;
}

export function fittingTargets(members, offsets){
  return members.map((member, index) => {
    const offset = offsets[index];
    const axis = Math.abs(offset.dx) > 1e-6 ? "x" : Math.abs(offset.dy) > 1e-6 ? "y" : null;
    if (!axis) return null;
    const pose = fittingPose(member.route, member.fitting);
    const spot = pointAt(member.route, axis, pose[axis] + (axis === "x" ? offset.dx : offset.dy), pose);
    if (!spot) return null;
    const hit = projectOnRoute(member.route, spot, fittingSize(member.fitting).width);
    return hit ? Math.round(hit.t * 10000) / 10000 : null;
  });
}
