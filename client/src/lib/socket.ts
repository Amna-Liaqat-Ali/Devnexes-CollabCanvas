import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types';

const SERVER_URL = 'http://localhost:3001';

export type CollabSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: CollabSocket | null = null;

export function getSocket(): CollabSocket {
  if (!socket) {
    socket = io(SERVER_URL, { autoConnect: false });
  }
  return socket;
}
