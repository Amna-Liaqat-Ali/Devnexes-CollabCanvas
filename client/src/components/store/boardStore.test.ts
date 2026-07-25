import { beforeEach, describe, expect, it } from 'vitest';
import { useBoardStore } from './boardStore';
import type { Shape } from '../../../../shared/types';

function makeRect(id: string, x = 0, y = 0): Shape {
  return { id, type: 'rect', x, y, width: 10, height: 10, color: '#000000', userId: 'local-user' };
}

const initialState = useBoardStore.getState();

beforeEach(() => {
  useBoardStore.setState(initialState, true);
});

describe('boardStore shape actions', () => {
  it('adds shapes and records history', () => {
    useBoardStore.getState().addShape(makeRect('a'));
    const state = useBoardStore.getState();
    expect(state.shapes).toHaveLength(1);
    expect(state.history).toHaveLength(2);
    expect(state.historyIndex).toBe(1);
  });

  it('deletes a shape by id', () => {
    useBoardStore.getState().addShape(makeRect('a'));
    useBoardStore.getState().addShape(makeRect('b'));
    useBoardStore.getState().deleteShape('a');
    expect(useBoardStore.getState().shapes.map(s => s.id)).toEqual(['b']);
  });

  it('clears the board', () => {
    useBoardStore.getState().addShape(makeRect('a'));
    useBoardStore.getState().clearBoard();
    expect(useBoardStore.getState().shapes).toHaveLength(0);
  });
});

describe('boardStore undo/redo', () => {
  it('undoes the last add', () => {
    useBoardStore.getState().addShape(makeRect('a'));
    useBoardStore.getState().addShape(makeRect('b'));
    useBoardStore.getState().undo();
    expect(useBoardStore.getState().shapes.map(s => s.id)).toEqual(['a']);
  });

  it('redoes after an undo', () => {
    useBoardStore.getState().addShape(makeRect('a'));
    useBoardStore.getState().addShape(makeRect('b'));
    useBoardStore.getState().undo();
    useBoardStore.getState().redo();
    expect(useBoardStore.getState().shapes.map(s => s.id)).toEqual(['a', 'b']);
  });

  it('is a no-op when undoing past the beginning of history', () => {
    useBoardStore.getState().undo();
    expect(useBoardStore.getState().shapes).toHaveLength(0);
    expect(useBoardStore.getState().historyIndex).toBe(0);
  });

  it('is a no-op when redoing past the end of history', () => {
    useBoardStore.getState().addShape(makeRect('a'));
    useBoardStore.getState().redo();
    expect(useBoardStore.getState().shapes.map(s => s.id)).toEqual(['a']);
  });

  it('discards redo branch once a new action is taken after undo', () => {
    useBoardStore.getState().addShape(makeRect('a'));
    useBoardStore.getState().addShape(makeRect('b'));
    useBoardStore.getState().undo();
    useBoardStore.getState().addShape(makeRect('c'));
    expect(useBoardStore.getState().shapes.map(s => s.id)).toEqual(['a', 'c']);
    useBoardStore.getState().redo();
    expect(useBoardStore.getState().shapes.map(s => s.id)).toEqual(['a', 'c']);
  });
});

describe('boardStore selection', () => {
  it('selects and clears selection when switching away from the select tool', () => {
    useBoardStore.getState().addShape(makeRect('a'));
    useBoardStore.getState().setTool('select');
    useBoardStore.getState().selectShape('a');
    expect(useBoardStore.getState().selectedId).toBe('a');

    useBoardStore.getState().setTool('pen');
    expect(useBoardStore.getState().selectedId).toBeNull();
  });

  it('moves a shape via preview and commits it to history', () => {
    useBoardStore.getState().addShape(makeRect('a', 0, 0));
    useBoardStore.getState().moveShapePreview('a', 5, 7);
    const moved = useBoardStore.getState().shapes[0];
    expect(moved.type === 'rect' && moved.x).toBe(5);
    expect(moved.type === 'rect' && moved.y).toBe(7);

    const historyLengthBeforeCommit = useBoardStore.getState().history.length;
    useBoardStore.getState().commitMove();
    expect(useBoardStore.getState().history.length).toBe(historyLengthBeforeCommit + 1);

    useBoardStore.getState().undo();
    const reverted = useBoardStore.getState().shapes[0];
    expect(reverted.type === 'rect' && reverted.x).toBe(0);
  });

  it('deletes the selected shape and clears selection', () => {
    useBoardStore.getState().addShape(makeRect('a'));
    useBoardStore.getState().selectShape('a');
    useBoardStore.getState().deleteSelected();
    expect(useBoardStore.getState().shapes).toHaveLength(0);
    expect(useBoardStore.getState().selectedId).toBeNull();
  });
});
