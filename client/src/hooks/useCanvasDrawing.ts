import { useRef, useEffect, useState, useCallback } from 'react';
import type { Shape } from '../../../shared/types';
import { drawShape, drawSelectionOutline, generateId, hitTestShape } from '../components/utils/drawing';
import { useBoardStore } from '../components/store/boardStore';
import { getSocket } from '../lib/socket';

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
}

export function useCanvasDrawing(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onTextClick?: (x: number, y: number) => void
) {
  const shapes = useBoardStore(state => state.shapes);
  const addShape = useBoardStore(state => state.addShape);
  const tool = useBoardStore(state => state.tool);
  const color = useBoardStore(state => state.color);
  const size = useBoardStore(state => state.size);
  const selectedId = useBoardStore(state => state.selectedId);
  const selectShape = useBoardStore(state => state.selectShape);
  const moveShapePreview = useBoardStore(state => state.moveShapePreview);
  const commitMove = useBoardStore(state => state.commitMove);

  const [state, setState] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
  });

  const currentShapeRef = useRef<Shape | null>(null);
  const isDraggingRef = useRef(false);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    shapes.forEach(shape => drawShape(ctx, shape));
    if (currentShapeRef.current) {
      drawShape(ctx, currentShapeRef.current);
    }
    const selected = shapes.find(s => s.id === selectedId);
    if (selected) {
      drawSelectionOutline(ctx, selected);
    }
  }, [canvasRef, shapes, selectedId]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const createShapePreview = (x: number, y: number): Shape | null => {
    const { startX, startY } = state;

    switch (tool) {
      case 'line':
        return {
          id: generateId(),
          type: 'line',
          x1: startX,
          y1: startY,
          x2: x,
          y2: y,
          color,
          width: size,
          userId: 'local-user',
        };
      case 'rect':
        return {
          id: generateId(),
          type: 'rect',
          x: Math.min(startX, x),
          y: Math.min(startY, y),
          width: Math.abs(x - startX),
          height: Math.abs(y - startY),
          color,
          userId: 'local-user',
        };
      case 'circle': {
        const radius = Math.sqrt((x - startX) ** 2 + (y - startY) ** 2);
        return {
          id: generateId(),
          type: 'circle',
          cx: startX,
          cy: startY,
          r: radius,
          color,
          userId: 'local-user',
        };
      }
      default:
        return null;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'text') {
      e.preventDefault();
      onTextClick?.(x, y);
      return;
    }

    if (tool === 'select') {
      const hit = [...shapes].reverse().find(s => hitTestShape(s, x, y));
      selectShape(hit ? hit.id : null);
      isDraggingRef.current = !!hit;
      setState({ isDrawing: !!hit, startX: x, startY: y });
      return;
    }

    setState({
      isDrawing: true,
      startX: x,
      startY: y,
    });

    if (tool === 'pen' || tool === 'eraser') {
      currentShapeRef.current = {
        id: generateId(),
        type: tool,
        points: [[x, y]],
        color,
        width: size,
        userId: 'local-user',
      };
    } else {
      currentShapeRef.current = null;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state.isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'select') {
      if (isDraggingRef.current && selectedId) {
        const dx = x - state.startX;
        const dy = y - state.startY;
        moveShapePreview(selectedId, dx, dy);
        setState(prev => ({ ...prev, startX: x, startY: y }));
      }
      return;
    }

    if (tool === 'pen' || tool === 'eraser') {
      if (currentShapeRef.current && 'points' in currentShapeRef.current) {
        currentShapeRef.current.points.push([x, y]);
      }
    } else {
      currentShapeRef.current = createShapePreview(x, y);
    }

    redraw();
  };

  const handleMouseUp = () => {
    if (tool === 'select') {
      if (isDraggingRef.current) {
        commitMove();
      }
      isDraggingRef.current = false;
      setState(prev => ({ ...prev, isDrawing: false }));
      return;
    }

    if (!state.isDrawing || !currentShapeRef.current) {
      setState(prev => ({ ...prev, isDrawing: false }));
      return;
    }

    setState(prev => ({ ...prev, isDrawing: false }));

    addShape(currentShapeRef.current);
    const socket = getSocket();
    if (socket.connected) {
      socket.emit('draw', currentShapeRef.current);
    }
    currentShapeRef.current = null;
  };

  return {
    handlers: {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
    },
    redraw,
  };
}
