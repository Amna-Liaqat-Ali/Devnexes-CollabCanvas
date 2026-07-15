interface UserListProps {
  username: string;
  roomCode: string;
}

export function UserList({ username, roomCode }: UserListProps) {
  const users = [
    { id: '1', name: username, color: '#FF6B6B', isYou: true },
    { id: '2', name: 'Waiting for others...', color: '#95E1D3', isYou: false },
  ];

  return (
    <div className="user-list">
      <div className="user-list-header">
        <h3>Room: {roomCode}</h3>
      </div>

      <div className="user-list-body">
        {users.map(user => (
          <div key={user.id} className="user-item">
            <div 
              className="user-color" 
              style={{ backgroundColor: user.color }}
            ></div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              {user.isYou && <span className="badge">You</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="user-list-footer">
        <small>Users: 1/10</small>
      </div>
    </div>
  );
}