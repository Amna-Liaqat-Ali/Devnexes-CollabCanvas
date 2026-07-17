import { useEffect, useRef } from 'react';
import { useCanvasDrawing } from '../hooks/useCanvasDrawing';

export function Canvas() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { handlers, redraw } = useCanvasDrawing(canvasRef);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const resize = () => {
      const { width, height } = wrapper.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      redraw();
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [redraw]);

  return (
    <div ref={wrapperRef} className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="canvas"
        onMouseDown={handlers.handleMouseDown}
        onMouseMove={handlers.handleMouseMove}
        onMouseUp={handlers.handleMouseUp}
        onMouseLeave={handlers.handleMouseUp}
      />
    </div>
  );
}
