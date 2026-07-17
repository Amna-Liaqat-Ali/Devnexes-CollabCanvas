import type { Shape } from '../../../../shared/types';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
