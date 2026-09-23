const LIMIT = 200;
const MERGE_MS = 1000;

export class History {
  undoStack = $state.raw([]);
  redoStack = $state.raw([]);
  present = null;
  gestureStart = null;
  lastKey = null;
  lastTime = 0;

  get canUndo(){
    return this.undoStack.length > 0;
  }

  get canRedo(){
    return this.redoStack.length > 0;
  }

  observe(current, key = null){
    if (this.present === null) {
      this.present = current;
      return;
    }
    if (current === this.present) return;

    const now = Date.now();
    const merge = this.gestureStart !== null
      || (key !== null && key === this.lastKey && now - this.lastTime < MERGE_MS);
    if (!merge) this.push(this.present);
    this.present = current;
    this.lastKey = key;
    this.lastTime = now;
  }

  push(state){
    this.undoStack = [...this.undoStack.slice(1 - LIMIT), state];
    this.redoStack = [];
  }

  beginGesture(){
    this.gestureStart = this.present;
  }

  endGesture(){
    if (this.gestureStart !== null && this.gestureStart !== this.present) this.push(this.gestureStart);
    this.gestureStart = null;
  }

  undo(){
    if (this.undoStack.length === 0) return null;
    this.redoStack = [...this.redoStack, this.present];
    this.present = this.undoStack[this.undoStack.length - 1];
    this.undoStack = this.undoStack.slice(0, -1);
    this.lastKey = null;
    return this.present;
  }

  save(){
    return { undoStack: this.undoStack, redoStack: this.redoStack, present: this.present };
  }

  load(saved){
    this.undoStack = saved?.undoStack ?? [];
    this.redoStack = saved?.redoStack ?? [];
    this.present = saved?.present ?? null;
    this.gestureStart = null;
    this.lastKey = null;
  }

  redo(){
    if (this.redoStack.length === 0) return null;
    this.undoStack = [...this.undoStack, this.present];
    this.present = this.redoStack[this.redoStack.length - 1];
    this.redoStack = this.redoStack.slice(0, -1);
    this.lastKey = null;
    return this.present;
  }
}
