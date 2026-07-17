import { useRef, useEffect, useState } from 'react';
import type { Shape } from '../../../shared/types';
import { drawShape, generateId } from '../components/utils/drawing';
import { useBoardStore } from '../components/store/boardStore';

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
}

export function useCanvasDrawing(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const shapes = useBoardStore(state => state.shapes);
  const addShape = useBoardStore(state => state.addShape);
  const tool = useBoardStore(state => state.tool);
  const color = useBoardStore(state => state.color);
  const size = useBoardStore(state => state.size);

  const [state, setState] = useState<DrawingState>({
    isDrawing: false,
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
  }, [shapes, canvasRef]);

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

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    shapes.forEach(shape => drawShape(ctx, shape));
    if (currentShapeRef.current) {
      drawShape(ctx, currentShapeRef.current);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!state.isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
    if (!state.isDrawing || !currentShapeRef.current) {
      setState(prev => ({ ...prev, isDrawing: false }));
      return;
    }

    setState(prev => ({ ...prev, isDrawing: false }));

    addShape(currentShapeRef.current);
    currentShapeRef.current = null;
  };

  return {
    handlers: {
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
    },
  };
}
