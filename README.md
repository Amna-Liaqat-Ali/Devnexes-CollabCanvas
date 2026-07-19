# CollabCanvas

Real-time collaborative whiteboard. Multiple participants can draw, add shapes and text, see each other's live cursors, and collaborate in the same room.

## Stack

- **Client**: React + TypeScript + Vite, Zustand for state, HTML5 Canvas for rendering
- **Server**: Node.js + Express + Socket.IO
- **Shared**: TypeScript types shared between client and server ([shared/types.ts](shared/types.ts))

## Project layout

```
client/   React app (canvas rendering, tool palette, user list, board store)
server/   Socket.IO server (room state, event broadcast, validation)
shared/   Types shared by client and server (board model, socket event contracts)
```

## Getting started

```bash
# server
cd server && npm install && npm run dev   # http://localhost:3001

# client
cd client && npm install && npm run dev   # http://localhost:5173
```

## Wireframes

See [docs/wireframes.md](docs/wireframes.md) for the join screen and main board layout.

## Event protocol

See [docs/event-protocol.md](docs/event-protocol.md) for the full client/server socket event contract, backed by the types in [shared/types.ts](shared/types.ts).

## Board data model

A **Board** holds the room's authoritative state: its shapes, connected users, and timestamps. A **Shape** is a discriminated union over `pen | eraser | line | rect | circle | text`, each tagged with the `userId` that created it (needed for presence, undo attribution, and future per-user permissions). See [shared/types.ts](shared/types.ts) for the exact definitions.
