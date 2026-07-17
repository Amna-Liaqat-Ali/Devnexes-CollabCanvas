import { useBoardStore, type Tool } from './store/boardStore';

export function ToolPalette() {
  const tool = useBoardStore(state => state.tool);
  const color = useBoardStore(state => state.color);
  const size = useBoardStore(state => state.size);
  const setTool = useBoardStore(state => state.setTool);
  const setColor = useBoardStore(state => state.setColor);
  const setSize = useBoardStore(state => state.setSize);
  const undo = useBoardStore(state => state.undo);
  const redo = useBoardStore(state => state.redo);
  const clearBoard = useBoardStore(state => state.clearBoard);

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
          {tools.map(t => (
            <button
              key={t.id}
              className={`tool-btn ${tool === t.id ? 'active' : ''}`}
              onClick={() => setTool(t.id)}
              title={t.label}
            >
              {t.emoji}
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
        <button className="action-btn" onClick={undo}>↶ Undo</button>
        <button className="action-btn" onClick={redo}>↷ Redo</button>
        <button className="action-btn" onClick={clearBoard}>🗑️ Clear</button>
      </div>
    </div>
  );
}
