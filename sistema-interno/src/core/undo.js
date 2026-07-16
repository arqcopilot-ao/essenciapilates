class UndoManager {
  constructor(maxHistory = 50) {
    this._history = [];
    this._currentIndex = -1;
    this._maxHistory = maxHistory;
    this._listeners = [];
  }

  execute(action) {
    this._history = this._history.slice(0, this._currentIndex + 1);
    action.execute();
    this._history.push(action);
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    } else {
      this._currentIndex++;
    }
    this._notify();
  }

  undo() {
    if (!this.canUndo) return false;
    this._history[this._currentIndex].undo();
    this._currentIndex--;
    this._notify();
    return true;
  }

  redo() {
    if (!this.canRedo) return false;
    this._currentIndex++;
    this._history[this._currentIndex].execute();
    this._notify();
    return true;
  }

  get canUndo() { return this._currentIndex >= 0; }
  get canRedo() { return this._currentIndex < this._history.length - 1; }
  get lastDescription() { return this.canUndo ? this._history[this._currentIndex]?.description : null; }
  get nextDescription() { return this.canRedo ? this._history[this._currentIndex + 1]?.description : null; }

  onChange(callback) {
    this._listeners.push(callback);
    return () => { this._listeners = this._listeners.filter(l => l !== callback); };
  }

  _notify() {
    this._listeners.forEach(cb => cb({
      canUndo: this.canUndo, canRedo: this.canRedo,
      lastDescription: this.lastDescription, nextDescription: this.nextDescription,
    }));
  }

  clear() {
    this._history = [];
    this._currentIndex = -1;
    this._notify();
  }
}

export { UndoManager };
export const undoManager = new UndoManager();
