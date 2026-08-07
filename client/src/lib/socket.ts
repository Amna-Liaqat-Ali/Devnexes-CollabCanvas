import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';
const SOCKET_PATH = import.meta.env.VITE_SOCKET_PATH ?? '/socket.io';

export type CollabSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: CollabSocket | null = null;

export function getSocket(): CollabSocket {
  if (!socket) {
    socket = io(SERVER_URL, {
      path: SOCKET_PATH,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}
