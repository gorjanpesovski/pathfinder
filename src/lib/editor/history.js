export function createHistory(ctx){
  function restore(state){
    if (state === null) return;
    ctx.shapes = JSON.parse(state);
    ctx.draft = null;
  }

  function redo(){
    restore(ctx.history.redo());
  }

  function undo(){
    restore(ctx.history.undo());
  }

  return { restore, redo, undo };
}
