import { useEffect, useRef, useState } from 'react';
import { useCanvasDrawing } from '../hooks/useCanvasDrawing';
import { useBoardStore } from './store/boardStore';
import { generateId } from './utils/drawing';
import { getSocket } from '../lib/socket';
import type { User } from '../../../shared/types';

const CURSOR_THROTTLE_MS = 50;

interface CanvasProps {
  remoteCursors?: Record<string, { x: number; y: number }>;
  users?: Record<string, User>;
  selfId?: string | null;
}

export function Canvas({ remoteCursors = {}, users = {}, selfId = null }: CanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addShape = useBoardStore(state => state.addShape);
  const color = useBoardStore(state => state.color);
  const size = useBoardStore(state => state.size);
  const setCanvasElement = useBoardStore(state => state.setCanvasElement);
  const shapeCount = useBoardStore(state => state.shapes.length);

  const [textEditor, setTextEditor] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState('');

  const { handlers, redraw } = useCanvasDrawing(canvasRef, (x, y) => {
    setTextValue('');
    setTextEditor({ x, y });
  });

  const lastCursorSentRef = useRef(0);
  const handleCursorMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handlers.handleMouseMove(e);

    const now = Date.now();
    if (now - lastCursorSentRef.current < CURSOR_THROTTLE_MS) return;
    lastCursorSentRef.current = now;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const socket = getSocket();
    if (socket.connected) {
      socket.emit('cursor_move', { x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const toMouseEvent = (e: React.TouchEvent<HTMLCanvasElement>): React.MouseEvent<HTMLCanvasElement> | null => {
    const touch = e.touches[0] ?? e.changedTouches[0];
    if (!touch) return null;
    return { ...e, clientX: touch.clientX, clientY: touch.clientY } as unknown as React.MouseEvent<HTMLCanvasElement>;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const mouseEvent = toMouseEvent(e);
    if (mouseEvent) handlers.handleMouseDown(mouseEvent);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const mouseEvent = toMouseEvent(e);
    if (mouseEvent) handleCursorMove(mouseEvent);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handlers.handleMouseUp();
  };

  useEffect(() => {
    setCanvasElement(canvasRef.current);
    return () => setCanvasElement(null);
  }, [setCanvasElement]);

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
      const shape = {
        id: generateId(),
        type: 'text' as const,
        x: textEditor.x,
        y: textEditor.y,
        text,
        fontSize: size * 4,
        color,
        userId: 'local-user',
      };
      addShape(shape);
      const socket = getSocket();
      if (socket.connected) {
        socket.emit('draw', shape);
      }
    }
    setTextEditor(null);
  };

  return (
    <div ref={wrapperRef} className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="canvas"
        onMouseDown={handlers.handleMouseDown}
        onMouseMove={handleCursorMove}
        onMouseUp={handlers.handleMouseUp}
        onMouseLeave={handlers.handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />
      {shapeCount === 0 && !textEditor && (
        <div className="canvas-empty-hint">Draw something to get started — pick a tool from the palette</div>
      )}
      {Object.entries(remoteCursors).map(([userId, pos]) => {
        if (userId === selfId) return null;
        const user = users[userId];
        if (!user) return null;
        return (
          <div
            key={userId}
            className="remote-cursor"
            style={{ left: pos.x, top: pos.y }}
          >
            <div className="remote-cursor-dot" style={{ backgroundColor: user.color }} />
            <span className="remote-cursor-label" style={{ backgroundColor: user.color }}>
              {user.name}
            </span>
          </div>
        );
      })}
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
