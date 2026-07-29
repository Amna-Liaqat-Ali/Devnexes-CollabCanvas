import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../lib/socket';
import { useBoardStore } from '../components/store/boardStore';
import type { Board, User } from '../../../shared/types';

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'room_full' | 'error';

interface RoomConnectionResult {
  status: ConnectionStatus;
  errorMessage: string | null;
  users: Record<string, User>;
  selfId: string | null;
  cursors: Record<string, { x: number; y: number }>;
  latencyMs: number | null;
}

const LATENCY_PING_INTERVAL_MS = 5000;

export function useRoomConnection(roomCode: string, username: string) {
  const [result, setResult] = useState<RoomConnectionResult>({
    status: 'connecting',
    errorMessage: null,
    users: {},
    selfId: null,
    cursors: {},
    latencyMs: null,
  });
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!roomCode || !username) return;

    const socket = getSocket();
    joinedRef.current = false;

    const handleConnect = () => {
      socket.emit('join_room', { roomCode, username });
    };

    const handleBoardUpdate = (board: Board) => {
      joinedRef.current = true;
      setResult(prev => ({
        status: 'connected',
        errorMessage: null,
        users: board.users,
        selfId: socket.id ?? null,
        cursors: prev.cursors,
        latencyMs: prev.latencyMs,
      }));
      useBoardStore.getState().setShapes(board.shapes);
    };

    const handleUserJoined = (user: User) => {
      setResult(prev => ({ ...prev, users: { ...prev.users, [user.id]: user } }));
    };

    const handleUserLeft = (userId: string) => {
      setResult(prev => {
        const users = { ...prev.users };
        delete users[userId];
        const cursors = { ...prev.cursors };
        delete cursors[userId];
        return { ...prev, users, cursors };
      });
    };

    const handleCursorUpdate = ({ userId, x, y }: { userId: string; x: number; y: number }) => {
      setResult(prev => ({ ...prev, cursors: { ...prev.cursors, [userId]: { x, y } } }));
    };

    const handleRoomFull = (message: string) => {
      setResult(prev => ({ ...prev, status: 'room_full', errorMessage: message }));
    };

    const handleError = (message: string) => {
      setResult(prev => ({ ...prev, status: 'error', errorMessage: message }));
    };

    const handleDisconnect = (reason: string) => {
      joinedRef.current = false;
      if (reason === 'io client disconnect') return;
      setResult(prev => ({ ...prev, status: 'reconnecting', users: {}, cursors: {} }));
    };

    const handleConnectError = () => {
      if (joinedRef.current) return;
      setResult(prev => ({ ...prev, status: 'reconnecting' }));
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('board_update', handleBoardUpdate);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('room_full', handleRoomFull);
    socket.on('error', handleError);
    socket.on('cursor_update', handleCursorUpdate);
    socket.on('disconnect', handleDisconnect);

    socket.connect();

    const pingInterval = setInterval(() => {
      if (!socket.connected) return;
      const sentAt = Date.now();
      socket.emit('ping', () => {
        setResult(prev => ({ ...prev, latencyMs: Date.now() - sentAt }));
      });
    }, LATENCY_PING_INTERVAL_MS);

    return () => {
      clearInterval(pingInterval);
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('board_update', handleBoardUpdate);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('room_full', handleRoomFull);
      socket.off('error', handleError);
      socket.off('cursor_update', handleCursorUpdate);
      socket.off('disconnect', handleDisconnect);
      socket.disconnect();
      useBoardStore.getState().setShapes([]);
    };
  }, [roomCode, username]);

  return result;
}
