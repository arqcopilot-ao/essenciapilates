import { describe, it, expect } from 'vitest';
import { UndoManager } from '../src/core/undo.js';

function makeAction(label) {
  let executed = false;
  return {
    description: label,
    execute() { executed = true; },
    undo() { executed = false; },
    get wasExecuted() { return executed; },
  };
}

describe('UndoManager', () => {
  it('starts with no undo/redo available', () => {
    const um = new UndoManager();
    expect(um.canUndo).toBe(false);
    expect(um.canRedo).toBe(false);
  });

  it('executes actions', () => {
    const um = new UndoManager();
    const a = makeAction('test');
    um.execute(a);
    expect(a.wasExecuted).toBe(true);
    expect(um.canUndo).toBe(true);
    expect(um.canRedo).toBe(false);
  });

  it('undoes the last action', () => {
    const um = new UndoManager();
    const a = makeAction('test');
    um.execute(a);
    um.undo();
    expect(a.wasExecuted).toBe(false);
    expect(um.canUndo).toBe(false);
    expect(um.canRedo).toBe(true);
  });

  it('redoes after undo', () => {
    const um = new UndoManager();
    const a = makeAction('test');
    um.execute(a);
    um.undo();
    um.redo();
    expect(a.wasExecuted).toBe(true);
  });

  it('clears redo stack on new execute', () => {
    const um = new UndoManager();
    const a1 = makeAction('first');
    const a2 = makeAction('second');
    um.execute(a1);
    um.undo();
    um.execute(a2);
    expect(um.canRedo).toBe(false);
    expect(um.canUndo).toBe(true);
  });

  it('respects maxHistory', () => {
    const um = new UndoManager(3);
    for (let i = 0; i < 5; i++) {
      um.execute(makeAction('action ' + i));
    }
    // Only last 3 should be in history
    expect(um.canUndo).toBe(true);
    um.undo(); um.undo(); um.undo();
    expect(um.canUndo).toBe(false);
  });

  it('reports lastDescription and nextDescription', () => {
    const um = new UndoManager();
    const a = makeAction('my action');
    um.execute(a);
    expect(um.lastDescription).toBe('my action');
    um.undo();
    expect(um.lastDescription).toBeNull();
    expect(um.nextDescription).toBe('my action');
  });

  it('notifies onChange listeners', () => {
    const um = new UndoManager();
    const states = [];
    um.onChange((s) => states.push(s));
    const a = makeAction('test');
    um.execute(a);
    um.undo();
    expect(states.length).toBe(2);
    expect(states[0].canUndo).toBe(true);
    expect(states[1].canUndo).toBe(false);
  });

  it('clear resets state', () => {
    const um = new UndoManager();
    um.execute(makeAction('test'));
    um.clear();
    expect(um.canUndo).toBe(false);
    expect(um.canRedo).toBe(false);
  });

  it('undo returns false when nothing to undo', () => {
    const um = new UndoManager();
    expect(um.undo()).toBe(false);
  });

  it('redo returns false when nothing to redo', () => {
    const um = new UndoManager();
    expect(um.redo()).toBe(false);
  });
});
