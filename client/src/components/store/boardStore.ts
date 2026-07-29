import { create } from 'zustand';
import type { Shape, Board } from '../../../../shared/types';
import { translateShape } from '../utils/drawing';

export type Tool = 'pen' | 'eraser' | 'line' | 'rect' | 'circle' | 'text' | 'select';

interface BoardState {
  shapes: Shape[];
  history: Shape[][];
  historyIndex: number;
  tool: Tool;
  color: string;
  size: number;
  selectedId: string | null;

  addShape: (shape: Shape) => void;
  deleteShape: (shapeId: string) => void;
  clearBoard: () => void;
  setShapes: (shapes: Shape[]) => void;
  undo: () => void;
  redo: () => void;
  getBoard: () => Board;
  setTool: (tool: Tool) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  selectShape: (shapeId: string | null) => void;
  moveShapePreview: (shapeId: string, dx: number, dy: number) => void;
  commitMove: () => void;
  deleteSelected: () => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  shapes: [],
  history: [[]],
  historyIndex: 0,
  tool: 'pen',
  color: '#000000',
  size: 3,
  selectedId: null,

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

  setTool: (tool: Tool) => set((state) => ({ tool, selectedId: tool === 'select' ? state.selectedId : null })),
  setColor: (color: string) => set({ color }),
  setSize: (size: number) => set({ size }),

  selectShape: (shapeId: string | null) => set({ selectedId: shapeId }),

  moveShapePreview: (shapeId: string, dx: number, dy: number) => {
    set((state) => ({
      shapes: state.shapes.map(s => s.id === shapeId ? translateShape(s, dx, dy) : s),
    }));
  },

  commitMove: () => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(state.shapes);
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  deleteSelected: () => {
    const { selectedId, deleteShape } = get();
    if (selectedId) {
      deleteShape(selectedId);
      set({ selectedId: null });
    }
  },

  setShapes: (shapes: Shape[]) => set({ shapes, history: [shapes], historyIndex: 0 }),
}));