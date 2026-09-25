export function junctionMedium(from, to, byId){
  for (const end of [from, to]) {
    if (end?.pipe === undefined) continue;
    const host = byId.get(end.pipe);
    if (host?.kind === "pipe" && host.medium) return host.medium;
  }
  return null;
}
