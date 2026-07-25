import type { Shape } from '../../../../shared/types';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getShapeBounds(shape: Shape): { x: number; y: number; width: number; height: number } {
  switch (shape.type) {
    case 'pen':
    case 'eraser': {
      const xs = shape.points.map(p => p[0]);
      const ys = shape.points.map(p => p[1]);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      return { x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
    }
    case 'line': {
      const minX = Math.min(shape.x1, shape.x2);
      const minY = Math.min(shape.y1, shape.y2);
      return { x: minX, y: minY, width: Math.abs(shape.x2 - shape.x1), height: Math.abs(shape.y2 - shape.y1) };
    }
    case 'rect':
      return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
    case 'circle':
      return { x: shape.cx - shape.r, y: shape.cy - shape.r, width: shape.r * 2, height: shape.r * 2 };
    case 'text':
      return { x: shape.x, y: shape.y - shape.fontSize, width: shape.fontSize * shape.text.length * 0.6, height: shape.fontSize };
  }
}

export function hitTestShape(shape: Shape, x: number, y: number): boolean {
  const bounds = getShapeBounds(shape);
  const pad = 6;
  return (
    x >= bounds.x - pad &&
    x <= bounds.x + bounds.width + pad &&
    y >= bounds.y - pad &&
    y <= bounds.y + bounds.height + pad
  );
}

export function translateShape(shape: Shape, dx: number, dy: number): Shape {
  switch (shape.type) {
    case 'pen':
    case 'eraser':
      return { ...shape, points: shape.points.map(([x, y]) => [x + dx, y + dy]) };
    case 'line':
      return { ...shape, x1: shape.x1 + dx, y1: shape.y1 + dy, x2: shape.x2 + dx, y2: shape.y2 + dy };
    case 'rect':
      return { ...shape, x: shape.x + dx, y: shape.y + dy };
    case 'circle':
      return { ...shape, cx: shape.cx + dx, cy: shape.cy + dy };
    case 'text':
      return { ...shape, x: shape.x + dx, y: shape.y + dy };
  }
}

export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape) {
  ctx.save();

  switch (shape.type) {
    case 'pen': {
      if (shape.points.length < 2) break;
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(shape.points[0][0], shape.points[0][1]);
      for (const [x, y] of shape.points.slice(1)) {
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      break;
    }
    case 'eraser': {
      if (shape.points.length < 2) break;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = shape.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(shape.points[0][0], shape.points[0][1]);
      for (const [x, y] of shape.points.slice(1)) {
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      break;
    }
    case 'line': {
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(shape.x1, shape.y1);
      ctx.lineTo(shape.x2, shape.y2);
      ctx.stroke();
      break;
    }
    case 'rect': {
      ctx.strokeStyle = shape.color;
      ctx.fillStyle = shape.color;
      ctx.lineWidth = 2;
      if (shape.fill) {
        ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
      } else {
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      }
      break;
    }
    case 'circle': {
      ctx.strokeStyle = shape.color;
      ctx.fillStyle = shape.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2);
      if (shape.fill) {
        ctx.fill();
      } else {
        ctx.stroke();
      }
      break;
    }
    case 'text': {
      ctx.fillStyle = shape.color;
      ctx.font = `${shape.fontSize}px sans-serif`;
      ctx.fillText(shape.text, shape.x, shape.y);
      break;
    }
  }

  ctx.restore();
}

export function drawSelectionOutline(ctx: CanvasRenderingContext2D, shape: Shape) {
  const bounds = getShapeBounds(shape);
  ctx.save();
  ctx.strokeStyle = '#667eea';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  const pad = 6;
  ctx.strokeRect(bounds.x - pad, bounds.y - pad, bounds.width + pad * 2, bounds.height + pad * 2);
  ctx.restore();
}
