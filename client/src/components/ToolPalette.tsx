import { useState } from 'react';
import { useBoardStore } from '../store/boardStore';


type Tool = 'pen' | 'eraser' | 'line' | 'rect' | 'circle' | 'text';

export function ToolPalette() {
  const [activeTool, setActiveTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(3);

  const tools: { id: Tool; label: string; emoji: string }[] = [
    { id: 'pen', label: 'Pen', emoji: '✏️' },
    { id: 'eraser', label: 'Eraser', emoji: '🗑️' },
    { id: 'line', label: 'Line', emoji: '📏' },
    { id: 'rect', label: 'Rectangle', emoji: '▭' },
    { id: 'circle', label: 'Circle', emoji: '●' },
    { id: 'text', label: 'Text', emoji: 'T' },
  ];

  return (
    <div className="tool-palette">
      <div className="palette-section">
        <h3>Tools</h3>
        <div className="tool-buttons">
          {tools.map(tool => (
            <button
              key={tool.id}
              className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => setActiveTool(tool.id)}
              title={tool.label}
            >
              {tool.emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="palette-divider"></div>

      <div className="palette-section">
        <label>
          Color:
          <input 
            type="color" 
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>
      </div>

      <div className="palette-section">
        <label>
          Size: <span>{size}px</span>
          <input 
            type="range" 
            min="1" 
            max="20" 
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="palette-divider"></div>

      <div className="palette-actions">
        <button className="action-btn">↶ Undo</button>
        <button className="action-btn">↷ Redo</button>
        <button className="action-btn">🗑️ Clear</button>
        <button className="action-btn">💾 Export</button>
      </div>
    </div>
  );
}