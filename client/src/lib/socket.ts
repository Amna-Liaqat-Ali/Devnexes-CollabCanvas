import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types';

// In local dev there's no env var set at all, so we default to the
// standalone server on :3001. In the single-deployment Vercel setup,
// VITE_SERVER_URL is intentionally left blank ("") to mean same-origin —
// io() with no url connects to window.location, which is what we want,
// so we only pass a url when one is actually configured.
const SERVER_URL = import.meta.env.VITE_SERVER_URL
  || (import.meta.env.DEV ? 'http://localhost:3001' : undefined);
const SOCKET_PATH = import.meta.env.VITE_SOCKET_PATH || '/socket.io';

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
