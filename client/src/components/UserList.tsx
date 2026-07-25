import type { User } from '../../../shared/types';

interface UserListProps {
  roomCode: string;
  users: Record<string, User>;
  selfId: string | null;
}

export function UserList({ roomCode, users, selfId }: UserListProps) {
  const userList = Object.values(users);

  return (
    <div className="user-list">
      <div className="user-list-header">
        <h3>Room: {roomCode}</h3>
      </div>

      <div className="user-list-body">
        {userList.length === 0 && (
          <div className="user-item">
            <span className="user-name">Waiting for others...</span>
          </div>
        )}
        {userList.map(user => (
          <div key={user.id} className="user-item">
            <div
              className="user-color"
              style={{ backgroundColor: user.color }}
            ></div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              {user.id === selfId && <span className="badge">You</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="user-list-footer">
        <small>Users: {userList.length}/10</small>
      </div>
    </div>
  );
}