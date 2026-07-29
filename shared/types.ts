// User
export type User = {
  id: string;
  name: string;
  color: string;
  cursorX: number;   //left-right
  cursorY: number;   //up-down
};

// Drawing elements 
export type Shape = 
  | { 
      id: string;
      type: 'pen'; 
      points: [number, number][]; 
      color: string; 
      width: number;
      userId: string;
    }
  | { 
      id: string;
      type: 'eraser'; 
      points: [number, number][]; 
      width: number;
      userId: string;
    }
  | { 
      id: string;
      type: 'line'; 
      x1: number; 
      y1: number; 
      x2: number; 
      y2: number; 
      color: string; 
      width: number;
      userId: string;
    }
  | { 
      id: string;
      type: 'rect'; 
      x: number; 
      y: number; 
      width: number; 
      height: number; 
      color: string; 
      fill?: boolean;
      userId: string;
    }
  | { 
      id: string;
      type: 'circle'; 
      cx: number; 
      cy: number; 
      r: number; 
      color: string; 
      fill?: boolean;
      userId: string;
    }
  | { 
      id: string;
      type: 'text'; 
      x: number; 
      y: number; 
      text: string; 
      fontSize: number; 
      color: string;
      userId: string;
    };

// Board state
export type Board = {
  id: string;
  roomCode: string;
  shapes: Shape[];
  users: Record<string, User>;
  createdAt: Date;
  lastModified: Date;
};

// Socket events - client to server
export type ClientToServerEvents = {
  'join_room': (data: { roomCode: string; username: string }) => void;
  'draw': (shape: Shape) => void;
  'delete_shape': (shapeId: string) => void;
  'cursor_move': (data: { x: number; y: number }) => void;
  'undo': () => void;
  'redo': () => void;
  'clear_board': () => void;
  'ping': (callback: (serverTime: number) => void) => void;
};

// Socket events - server to client
export type ServerToClientEvents = {
  'board_update': (board: Board) => void;
  'user_joined': (user: User) => void;
  'user_left': (userId: string) => void;
  'cursor_update': (data: { userId: string; x: number; y: number }) => void;
  'error': (message: string) => void;
  'room_full': (message: string) => void;
};