import { useState } from 'react';
import { Canvas } from './components/Canvas';
import { ToolPalette } from './components/ToolPalette';
import { UserList } from './components/UserList';
import './App.css';

export function App() {
  const [isJoined, setIsJoined] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');

  const handleJoin = (code: string, name: string) => {
    setRoomCode(code);
    setUsername(name);
    setIsJoined(true);
  };

  if (!isJoined) {
    return <JoinScreen onJoin={handleJoin} />;
  }

  return (
    <div className="app-container">
      <ToolPalette />
      <Canvas />
      <UserList username={username} roomCode={roomCode} />
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