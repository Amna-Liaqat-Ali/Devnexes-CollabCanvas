import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import type { ClientToServerEvents, ServerToClientEvents, Board, User } from '../../shared/types';

const app = express();
const httpServer = createServer(app);
const io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: 'http://localhost:5173', // Vite dev server
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('CollabCanvas Server Running');
});

const MAX_USERS_PER_ROOM = 10;
const USER_COLORS = ['#FF6B6B', '#95E1D3', '#F6D55C', '#3D9970', '#A28BFB', '#FF9F43', '#38BDF8', '#F472B6'];

const boards = new Map<string, Board>();

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

// Socket.IO connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  let joinedRoomCode: string | null = null;

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

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    if (joinedRoomCode) {
      const board = boards.get(joinedRoomCode);
      if (board && board.users[socket.id]) {
        delete board.users[socket.id];
        socket.to(joinedRoomCode).emit('user_left', socket.id);

        if (Object.keys(board.users).length === 0) {
          boards.delete(joinedRoomCode);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});