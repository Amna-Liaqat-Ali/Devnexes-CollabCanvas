import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import type { ClientToServerEvents, ServerToClientEvents, Board, User, Shape } from '../../shared/types';

const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim());

const app = express();
const httpServer = createServer(app);
const io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('CollabCanvas Server Running');
});

const MAX_USERS_PER_ROOM = 10;
const USER_COLORS = ['#FF6B6B', '#95E1D3', '#F6D55C', '#3D9970', '#A28BFB', '#FF9F43', '#38BDF8', '#F472B6'];

const boards = new Map<string, Board>();

const DATA_DIR = path.join(__dirname, '..', 'data');
const persistTimers = new Map<string, ReturnType<typeof setTimeout>>();
const PERSIST_DEBOUNCE_MS = 300;

function boardFilePath(roomCode: string): string {
  return path.join(DATA_DIR, `${roomCode}.json`);
}

function loadPersistedBoards(): void {
  if (!fs.existsSync(DATA_DIR)) return;
  for (const file of fs.readdirSync(DATA_DIR)) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
      const saved = JSON.parse(raw) as Board;
      boards.set(saved.roomCode, {
        ...saved,
        users: {},
        createdAt: new Date(saved.createdAt),
        lastModified: new Date(saved.lastModified),
      });
    } catch {
      // skip corrupt/unreadable save file
    }
  }
}

function persistBoard(board: Board): void {
  const existing = persistTimers.get(board.roomCode);
  if (existing) clearTimeout(existing);

  persistTimers.set(board.roomCode, setTimeout(() => {
    persistTimers.delete(board.roomCode);
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const { users, ...persisted } = board;
    void users;
    fs.writeFileSync(boardFilePath(board.roomCode), JSON.stringify(persisted, null, 2));
  }, PERSIST_DEBOUNCE_MS));
}

loadPersistedBoards();

function getOrCreateBoard(roomCode: string): Board {
  let board = boards.get(roomCode);
  if (!board) {
    board = {
      id: roomCode,
      roomCode,
      shapes: [],
      users: {},
      createdAt: new Date(),
      lastModified: new Date(),
    };
    boards.set(roomCode, board);
  }
  return board;
}

function colorForUser(board: Board): string {
  const usedCount = Object.keys(board.users).length;
  return USER_COLORS[usedCount % USER_COLORS.length];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPointArray(value: unknown): value is [number, number][] {
  return Array.isArray(value) && value.every(
    p => Array.isArray(p) && p.length === 2 && isFiniteNumber(p[0]) && isFiniteNumber(p[1])
  );
}

function isValidShape(value: unknown): value is Shape {
  if (typeof value !== 'object' || value === null) return false;
  const shape = value as Record<string, unknown>;
  if (typeof shape.id !== 'string' || !shape.id) return false;
  if (typeof shape.userId !== 'string' || !shape.userId) return false;

  switch (shape.type) {
    case 'pen':
    case 'eraser':
      return isPointArray(shape.points) && isFiniteNumber(shape.width);
    case 'line':
      return ['x1', 'y1', 'x2', 'y2'].every(k => isFiniteNumber(shape[k])) && isFiniteNumber(shape.width);
    case 'rect':
      return ['x', 'y', 'width', 'height'].every(k => isFiniteNumber(shape[k]));
    case 'circle':
      return ['cx', 'cy', 'r'].every(k => isFiniteNumber(shape[k]));
    case 'text':
      return isFiniteNumber(shape.x) && isFiniteNumber(shape.y) && typeof shape.text === 'string' && isFiniteNumber(shape.fontSize);
    default:
      return false;
  }
}

// Socket.IO connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  let joinedRoomCode: string | null = null;
  const ownedShapeIds: string[] = [];
  const redoStack: Shape[] = [];

  socket.on('join_room', ({ roomCode, username }) => {
    if (typeof roomCode !== 'string' || !roomCode.trim() || typeof username !== 'string' || !username.trim()) {
      socket.emit('error', 'roomCode and username are required');
      return;
    }

    const normalizedRoomCode = roomCode.trim().toUpperCase();
    const board = getOrCreateBoard(normalizedRoomCode);

    if (Object.keys(board.users).length >= MAX_USERS_PER_ROOM) {
      socket.emit('room_full', `Room ${normalizedRoomCode} is full`);
      return;
    }

    const user: User = {
      id: socket.id,
      name: username.trim(),
      color: colorForUser(board),
      cursorX: 0,
      cursorY: 0,
    };

    board.users[user.id] = user;
    joinedRoomCode = normalizedRoomCode;
    socket.join(normalizedRoomCode);

    socket.emit('board_update', board);
    socket.to(normalizedRoomCode).emit('user_joined', user);
  });

  socket.on('draw', (shape) => {
    if (!joinedRoomCode) return;
    const board = boards.get(joinedRoomCode);
    if (!board) return;
    if (!isValidShape(shape)) {
      socket.emit('error', 'Invalid shape payload');
      return;
    }

    board.shapes.push(shape);
    board.lastModified = new Date();
    ownedShapeIds.push(shape.id);
    redoStack.length = 0;
    persistBoard(board);
    io.to(joinedRoomCode).emit('board_update', board);
  });

  socket.on('delete_shape', (shapeId) => {
    if (!joinedRoomCode) return;
    const board = boards.get(joinedRoomCode);
    if (!board) return;
    if (typeof shapeId !== 'string' || !shapeId) {
      socket.emit('error', 'Invalid shapeId payload');
      return;
    }

    board.shapes = board.shapes.filter(s => s.id !== shapeId);
    board.lastModified = new Date();
    redoStack.length = 0;
    persistBoard(board);
    io.to(joinedRoomCode).emit('board_update', board);
  });

  socket.on('undo', () => {
    if (!joinedRoomCode) return;
    const board = boards.get(joinedRoomCode);
    if (!board) return;

    const lastOwnedId = ownedShapeIds.pop();
    if (!lastOwnedId) return;

    const undoneShape = board.shapes.find(s => s.id === lastOwnedId);
    board.shapes = board.shapes.filter(s => s.id !== lastOwnedId);
    board.lastModified = new Date();
    if (undoneShape) redoStack.push(undoneShape);
    persistBoard(board);
    io.to(joinedRoomCode).emit('board_update', board);
  });

  socket.on('redo', () => {
    if (!joinedRoomCode) return;
    const board = boards.get(joinedRoomCode);
    if (!board) return;

    const shape = redoStack.pop();
    if (!shape) return;

    board.shapes.push(shape);
    board.lastModified = new Date();
    ownedShapeIds.push(shape.id);
    persistBoard(board);
    io.to(joinedRoomCode).emit('board_update', board);
  });

  socket.on('clear_board', () => {
    if (!joinedRoomCode) return;
    const board = boards.get(joinedRoomCode);
    if (!board) return;

    board.shapes = [];
    board.lastModified = new Date();
    ownedShapeIds.length = 0;
    redoStack.length = 0;
    persistBoard(board);
    io.to(joinedRoomCode).emit('board_update', board);
  });

  socket.on('ping', (callback) => {
    if (typeof callback === 'function') callback(Date.now());
  });

  socket.on('cursor_move', ({ x, y }) => {
    if (!joinedRoomCode) return;
    const board = boards.get(joinedRoomCode);
    if (!board || !board.users[socket.id]) return;
    if (!isFiniteNumber(x) || !isFiniteNumber(y)) return;

    board.users[socket.id].cursorX = x;
    board.users[socket.id].cursorY = y;
    socket.to(joinedRoomCode).emit('cursor_update', { userId: socket.id, x, y });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    if (joinedRoomCode) {
      const board = boards.get(joinedRoomCode);
      if (board && board.users[socket.id]) {
        delete board.users[socket.id];
        socket.to(joinedRoomCode).emit('user_left', socket.id);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});