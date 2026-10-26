import { copyPageShapes, pageCopyName } from "@pathfinder/core/pageCopy.js";

export function createPages(ctx){
  function newPageId(){
    return `page-${crypto.randomUUID().slice(0, 8)}`;
  }

  function ensurePages(appId){
    if (!ctx.PAGED_APPS.includes(appId) || ctx.pageSets[appId]) return;
    const id = newPageId();
    ctx.pageSets[appId] = { active: id, list: [{ id, name: "Page 1" }] };
  }

  function stashKey(appId){
    const set = ctx.pageSets[appId];
    return ctx.PAGED_APPS.includes(appId) && set ? `${appId}:${set.active}` : appId;
  }

  function storedShapes(appId, pageId){
    const set = ctx.pageSets[appId];
    if (appId === ctx.app && (!set || set.active === pageId)) return $state.snapshot(ctx.shapes);
    return ctx.documents[set ? `${appId}:${pageId}` : appId]?.shapes ?? [];
  }

  function pageShapes(appId){
    const set = ctx.pageSets[appId];
    if (!set) return appId === ctx.app ? ctx.shapes : ctx.documents[appId]?.shapes ?? [];
    return set.list.flatMap((page) => appId === ctx.app && page.id === set.active ? ctx.shapes : ctx.documents[`${appId}:${page.id}`]?.shapes ?? []);
  }

  function resetInteraction(){
    ctx.pickTool("select");
    ctx.selectedId = null;
    ctx.selectedIds = [];
    ctx.clearSubSelection();
    ctx.placing = null;
    ctx.renamingId = null;
    ctx.renamingElementId = null;
    ctx.renamingFitting = null;
    ctx.editingTextId = null;
    ctx.targetChoice = null;
    ctx.branchEditing = false;
  }

  function stashCurrent(){
    ctx.documents[stashKey(ctx.app)] = { shapes: $state.snapshot(ctx.shapes), history: ctx.history.save() };
  }

  function loadStashed(key){
    const next = ctx.documents[key];
    delete ctx.documents[key];
    resetInteraction();
    ctx.history.load(next?.history ?? null);
    ctx.shapes = next?.shapes ?? [];
  }

  function selectPage(pageId){
    const set = ctx.pageSets[ctx.app];
    if (!set || set.active === pageId) return;
    stashCurrent();
    set.active = pageId;
    loadStashed(stashKey(ctx.app));
  }

  function addPage(){
    const set = ctx.pageSets[ctx.app];
    if (!set) return;
    const taken = new Set(set.list.map((page) => page.name));
    let index = set.list.length + 1;
    while (taken.has(`Page ${index}`)) index += 1;
    const id = newPageId();
    stashCurrent();
    set.list.push({ id, name: `Page ${index}` });
    set.active = id;
    loadStashed(stashKey(ctx.app));
  }

  function movePage(pageId, index){
    const list = ctx.pageSets[ctx.app]?.list;
    if (!list) return;
    const from = list.findIndex((page) => page.id === pageId);
    if (from < 0 || index < 0 || index >= list.length || index === from) return;
    const [page] = list.splice(from, 1);
    list.splice(index, 0, page);
  }

  function duplicatePage(pageId){
    const set = ctx.pageSets[ctx.app];
    if (!set) return;
    const index = set.list.findIndex((page) => page.id === pageId);
    const source = set.list[index];
    if (!source) return;
    const copied = copyPageShapes(storedShapes(ctx.app, pageId), () => ctx.nextId++);
    const id = newPageId();
    stashCurrent();
    set.list.splice(index + 1, 0, { id, name: pageCopyName(source.name, set.list) });
    set.active = id;
    ctx.documents[`${ctx.app}:${id}`] = { shapes: copied, history: null };
    loadStashed(stashKey(ctx.app));
  }

  function renamePage(pageId, name){
    const page = ctx.pageSets[ctx.app]?.list.find((entry) => entry.id === pageId);
    if (page) page.name = name;
  }

  function deletePage(pageId){
    const set = ctx.pageSets[ctx.app];
    if (!set || set.list.length < 2) return;
    const index = set.list.findIndex((page) => page.id === pageId);
    const page = set.list[index];
    if (!page) return;
    const filled = storedShapes(ctx.app, pageId).length > 0;
    if (filled && !window.confirm(`Delete "${page.name}" and everything on it?`)) return;
    const wasActive = set.active === pageId;
    set.list.splice(index, 1);
    delete ctx.documents[`${ctx.app}:${pageId}`];
    if (!wasActive) return;
    set.active = set.list[Math.min(index, set.list.length - 1)].id;
    loadStashed(stashKey(ctx.app));
  }

  function switchApp(id){
    if (id === ctx.app) return;
    ctx.leaveApp();
    ctx.app = id;
    ctx.enterApp(id);
  }

  return { newPageId, ensurePages, stashKey, storedShapes, pageShapes, resetInteraction, stashCurrent, loadStashed, selectPage, addPage, movePage, duplicatePage, renamePage, deletePage, switchApp };
}
