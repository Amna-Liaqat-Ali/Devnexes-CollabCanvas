import { useState } from 'react';
import { Canvas } from './components/Canvas';
import { ToolPalette } from './components/ToolPalette';
import { UserList } from './components/UserList';
import { useRoomConnection } from './hooks/useRoomConnection';
import './App.css';

export function App() {
  const [isJoined, setIsJoined] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');

  const handleJoin = (code: string, name: string) => {
    setRoomCode(code.trim().toUpperCase());
    setUsername(name);
    setIsJoined(true);
  };

  if (!isJoined) {
    return <JoinScreen onJoin={handleJoin} />;
  }

  return <Room roomCode={roomCode} username={username} onLeave={() => setIsJoined(false)} />;
}

function Room({ roomCode, username, onLeave }: { roomCode: string; username: string; onLeave: () => void }) {
  const { status, errorMessage, users, selfId, cursors, latencyMs } = useRoomConnection(roomCode, username);

  if (status === 'room_full' || status === 'error') {
    return (
      <div className="join-screen">
        <div className="join-card">
          <h1>CollabCanvas</h1>
          <p className="join-subtitle">{errorMessage ?? 'Something went wrong.'}</p>
          <button onClick={onLeave}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {status === 'reconnecting' && (
        <div className="reconnect-banner">Connection lost — reconnecting...</div>
      )}
      <ToolPalette />
      <Canvas remoteCursors={cursors} users={users} selfId={selfId} />
      <UserList roomCode={roomCode} users={users} selfId={selfId} latencyMs={latencyMs} />
    </div>
  );
}

function JoinScreen({ onJoin }: { onJoin: (code: string, name: string) => void }) {
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim() && username.trim()) {
      onJoin(roomCode, username);
    }
  };

  return (
    <div className="join-screen">
      <div className="join-card">
        <h1>CollabCanvas</h1>
        <p className="join-subtitle">Draw and brainstorm together, in real time.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="room-code">Room code</label>
            <input
              id="room-code"
              placeholder="e.g. ABC123"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="username">Your name</label>
            <input
              id="username"
              placeholder="e.g. Amna"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <button type="submit" disabled={!roomCode || !username}>
            Join Room
          </button>
        </form>

        <p className="join-hint">Don't have a room code yet? Ask whoever's hosting to share theirs.</p>
      </div>
    </div>
  );
}