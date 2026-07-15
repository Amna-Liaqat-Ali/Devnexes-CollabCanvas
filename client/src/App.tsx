import { useState } from 'react';
import { Canvas } from './components/Canvas';
import { ToolPalette} from './components/ToolPalette.tsx';
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
        <h1>🎨 CollabCanvas</h1>
        <p>Real-time collaborative whiteboard</p>
        
        <form onSubmit={handleSubmit}>
          <input 
            placeholder="Room Code (e.g. ABC123)" 
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            autoFocus
          />
          <input 
            placeholder="Your Name" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button type="submit" disabled={!roomCode || !username}>
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}