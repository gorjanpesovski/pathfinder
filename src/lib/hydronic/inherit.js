export function junctionMedium(from, to, byId){
  for (const end of [from, to]) {
    if (end?.pipe !== undefined) {
      const host = byId.get(end.pipe);
      if (host?.kind === "pipe" && host.medium) return host.medium;
    }
  }
  for (const end of [from, to]) {
    if (end?.id === undefined) continue;
    const element = byId.get(end.id);
    if (element?.kind === "equipment" && element.medium) return element.medium;
  }
  return null;
}
