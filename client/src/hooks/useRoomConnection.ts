import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../lib/socket';
import type { User } from '../../../shared/types';

type ConnectionStatus = 'connecting' | 'connected' | 'room_full' | 'error';

interface RoomConnectionResult {
  status: ConnectionStatus;
  errorMessage: string | null;
  users: Record<string, User>;
  selfId: string | null;
}

export function useRoomConnection(roomCode: string, username: string) {
  const [result, setResult] = useState<RoomConnectionResult>({
    status: 'connecting',
    errorMessage: null,
    users: {},
    selfId: null,
  });
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!roomCode || !username) return;

    const socket = getSocket();
    joinedRef.current = false;

    const handleConnect = () => {
      socket.emit('join_room', { roomCode, username });
    };

    const handleBoardUpdate = (board: { users: Record<string, User> }) => {
      joinedRef.current = true;
      setResult({ status: 'connected', errorMessage: null, users: board.users, selfId: socket.id ?? null });
    };

    const handleUserJoined = (user: User) => {
      setResult(prev => ({ ...prev, users: { ...prev.users, [user.id]: user } }));
    };

    const handleUserLeft = (userId: string) => {
      setResult(prev => {
        const users = { ...prev.users };
        delete users[userId];
        return { ...prev, users };
      });
    };

    const handleRoomFull = (message: string) => {
      setResult(prev => ({ ...prev, status: 'room_full', errorMessage: message }));
    };

    const handleError = (message: string) => {
      setResult(prev => ({ ...prev, status: 'error', errorMessage: message }));
    };

    socket.on('connect', handleConnect);
    socket.on('board_update', handleBoardUpdate);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('room_full', handleRoomFull);
    socket.on('error', handleError);

    socket.connect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('board_update', handleBoardUpdate);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('room_full', handleRoomFull);
      socket.off('error', handleError);
      socket.disconnect();
    };
  }, [roomCode, username]);

  return result;
}
