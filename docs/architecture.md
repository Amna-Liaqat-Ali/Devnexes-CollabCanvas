# Architecture

## Components

```mermaid
flowchart LR
    subgraph Client["Client (React + Vite)"]
        UI["Canvas / ToolPalette / UserList"]
        Store["boardStore (Zustand)\nlocal shapes, tool, selection"]
        SocketClient["Socket.IO client"]
        UI <--> Store
        Store <--> SocketClient
    end

    subgraph Server["Server (Node + Express + Socket.IO)"]
        IO["Socket.IO connection handler\nper-socket: ownedShapeIds, redoStack"]
        Validate["Payload validation\n(isValidShape, isFiniteNumber, ...)"]
        Rooms["In-memory boards: Map<roomCode, Board>"]
        Persist["Debounced disk persistence"]
        IO --> Validate --> Rooms
        Rooms --> Persist
    end

    Disk[("server/data/<ROOM>.json")]

    SocketClient <-->|"WebSocket\n(join_room, draw, undo, redo,\ndelete_shape, cursor_move, ...)"| IO
    Persist --> Disk
    Disk -.->|"loaded on server boot"| Rooms
```

- **Server is authoritative.** Every client optimistically renders its own actions locally, but the server's `board_update` is the single source of truth all clients converge on — this is what makes multi-user sync and reconnect recovery possible (see [event-protocol.md](event-protocol.md)).
- **Room state lives in server memory**, keyed by room code, and is debounce-persisted to disk so a server restart doesn't lose boards.
- **Undo/redo state is per-socket**, not per-board — each connection tracks only the shape ids *it* drew (`ownedShapeIds`) and its own `redoStack`, so one user's undo never touches another user's shapes.

## Draw event flow

```mermaid
sequenceDiagram
    participant A as Client A
    participant S as Server
    participant B as Client B

    A->>A: addShape() (optimistic local render)
    A->>S: emit "draw" (Shape)
    S->>S: isValidShape(shape)?
    alt valid
        S->>S: board.shapes.push(shape)\nownedShapeIds.push(shape.id)\npersistBoard() (debounced)
        S-->>A: "board_update" (full Board)
        S-->>B: "board_update" (full Board)
    else invalid
        S-->>A: "error" (message)
    end
```

## Reconnect flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server

    Note over C,S: Connection drops (network blip, server restart, etc.)
    C->>C: status = "reconnecting" (banner shown)
    C->>S: socket.io auto-reconnect
    S-->>C: "connect"
    C->>S: emit "join_room" (roomCode, username)
    S->>S: getOrCreateBoard(roomCode)\n(fresh per-socket ownedShapeIds/redoStack)
    S-->>C: "board_update" (current authoritative Board)
    C->>C: setShapes(board.shapes) — client converges to server state
```

Reconnect always re-fetches the full board rather than diffing, so the client can't drift from the server after a gap — at the cost of per-connection undo/redo history resetting on reconnect (there is no cross-reconnect undo stack by design).
