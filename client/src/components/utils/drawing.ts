import { create } from 'zustand';
import { Shape, Board } from '../../../shared/types';

interface BoardState {
  shapes: Shape[];
  history: Shape[][];
  historyIndex: number;
  
  addShape: (shape: Shape) => void;
  deleteShape: (shapeId: string) => void;
  clearBoard: () => void;
  undo: () => void;
  redo: () => void;
  getBoard: () => Board;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  shapes: [],
  history: [[]],
  historyIndex: 0,

  addShape: (shape: Shape) => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      const updatedShapes = [...state.shapes, shape];
      newHistory.push(updatedShapes);

      return {
        shapes: updatedShapes,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  deleteShape: (shapeId: string) => {
    set((state) => {
      const updatedShapes = state.shapes.filter(s => s.id !== shapeId);
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(updatedShapes);

      return {
        shapes: updatedShapes,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  clearBoard: () => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push([]);

      return {
        shapes: [],
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return {
          historyIndex: newIndex,
          shapes: state.history[newIndex],
        };
      }
      return state;
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return {
          historyIndex: newIndex,
          shapes: state.history[newIndex],
        };
      }
      return state;
    });
  },

  getBoard: () => {
    const state = get();
    return {
      id: 'local-board',
      roomCode: 'LOCAL',
      shapes: state.shapes,
      users: {},
      createdAt: new Date(),
      lastModified: new Date(),
    };
  },
}));