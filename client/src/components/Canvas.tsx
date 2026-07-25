import { useEffect, useRef, useState } from 'react';
import { useCanvasDrawing } from '../hooks/useCanvasDrawing';
import { useBoardStore } from './store/boardStore';
import { generateId } from './utils/drawing';

export function Canvas() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addShape = useBoardStore(state => state.addShape);
  const color = useBoardStore(state => state.color);
  const size = useBoardStore(state => state.size);

  const [textEditor, setTextEditor] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState('');

  const { handlers, redraw } = useCanvasDrawing(canvasRef, (x, y) => {
    setTextValue('');
    setTextEditor({ x, y });
  });

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const resize = () => {
      const { width, height } = wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      redraw();
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [redraw]);

  useEffect(() => {
    if (textEditor) {
      inputRef.current?.focus();
    }
  }, [textEditor]);

  const commitText = () => {
    if (!textEditor) return;
    const text = textValue.trim();
    if (text) {
      addShape({
        id: generateId(),
        type: 'text',
        x: textEditor.x,
        y: textEditor.y,
        text,
        fontSize: size * 4,
        color,
        userId: 'local-user',
      });
    }
    setTextEditor(null);
  };

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
      {textEditor && (
        <input
          ref={inputRef}
          className="text-editor-input"
          style={{
            left: textEditor.x,
            top: textEditor.y - size * 4,
            color,
            fontSize: size * 4,
          }}
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitText();
            if (e.key === 'Escape') setTextEditor(null);
          }}
          onBlur={commitText}
        />
      )}
    </div>
  );
}
