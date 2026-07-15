import { useRef, useEffect, useState } from 'react';
import { Shape } from '../../../shared/types';
import { drawShape, generateId } from '../utils/drawing';
import { useBoardStore } from '../store/boardStore';

interface DrawingState {
  isDrawing: boolean;
  tool: 'pen' | 'line' | 'rect' | 'circle' | 'text' | 'eraser';
  color: string;
  size: number;
  startX: number;
  startY: number;
}

export function useCanvasDrawing(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const shapes = useBoardStore(state => state.shapes);
  const addShape = useBoardStore(state => state.addShape);
  
  const [state, setState] = useState<DrawingState>({
    isDrawing: false,
    tool: 'pen',
    color: '#000000',
    size: 3,
    startX: 0,
    startY: 0,
  });

  const currentShapeRef = useRef<Shape | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw all shapes
    shapes.forEach(shape => {
      drawShape(ctx, shape);
    });

    // Draw current shape if drawing
    if (currentShapeRef.current) {
      drawShape(ctx, currentShapeRef.current);
    }
  }, [shapes]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setState(prev => ({
      ...prev,
      isDrawing: true,
      startX: x,
      startY: y,
    }));

    if (state.tool === 'pen' || state.tool === 'eraser') {
      currentShapeRef.current = {
        id: generateId(),
        type: state.tool,
        points: [[x, y]],
        color: state.color,
        width: state.size,
        userId: 'local-user',
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state.isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (state.tool === 'pen' || state.tool === 'eraser') {
      if (currentShapeRef.current && 'points' in currentShapeRef.current) {
        currentShapeRef.current.points.push([x, y]);
      }
    } else {
      currentShapeRef.current = createShapePreview(x, y);
    }
  };

  const handleMouseUp = () => {
    if (!state.isDrawing || !currentShapeRef.current) return;

    setState(prev => ({ ...prev, isDrawing: false }));

    addShape(currentShapeRef.current);
    currentShapeRef.current = null;
  };

  const createShapePreview = (x: number, y: number): Shape | null => {
    const { tool, color, size, startX, startY } = state;

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
      case 'circle':
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
      default:
        return null;
    }
  };

  const setTool = (tool: DrawingState['tool']) => {
    setState(prev => ({ ...prev, tool }));
  };

  const setColor = (color: string) => {
    setState(prev => ({ ...prev, color }));
  };

  const setSize = (size: number) => {
    setState(prev => ({ ...prev, size }));
  };

  return {
    state,
    handlers: {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
    },
    actions: {
      setTool,
      setColor,
      setSize,
    },
  };
}