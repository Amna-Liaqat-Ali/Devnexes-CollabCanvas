import { useRef } from 'react';
import { useCanvasDrawing } from '../hooks/useCanvasDrawing';

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { handlers } = useCanvasDrawing(canvasRef);

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={600}
      className="canvas"
      onMouseDown={handlers.handleMouseDown}
      onMouseMove={handlers.handleMouseMove}
      onMouseUp={handlers.handleMouseUp}
      onMouseLeave={handlers.handleMouseUp}
    />
  );
}
