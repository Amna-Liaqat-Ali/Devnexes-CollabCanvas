# CollabCanvas

Real-time collaborative whiteboard. Multiple participants can draw, add shapes and text, see each other's live cursors, and collaborate in the same room.

## Features

- Pen, eraser, line, rectangle, circle, and text tools, plus select/move/delete
- Real-time sync across every participant in a room via Socket.IO
- Live remote cursors with per-user color and name labels
- Per-user undo/redo (each user's undo only reverts their own last action)
- Board persistence to disk, restored on server restart or reconnect
- PNG and JSON export
- Reconnect handling with a visible status banner and automatic board resync
- Round-trip latency display
- Touch support and a responsive layout for mobile

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

Both `client/.env.example` and `server/.env.example` document the environment variables used to point the two at each other (`VITE_SERVER_URL` on the client, `CLIENT_ORIGIN`/`PORT` on the server) — copy them to `.env` and adjust for anything other than the local defaults above.

## Testing

```bash
cd client && npm run test   # vitest: board store (undo/redo, selection)
```

See [docs/test-checklist.md](docs/test-checklist.md) for the manual multi-user, mobile, and failure-case checklist (server has no automated test suite yet — see [docs/report.md](docs/report.md#known-limitations)).

## Wireframes

See [docs/wireframes.md](docs/wireframes.md) for the join screen and main board layout.

## Event protocol

See [docs/event-protocol.md](docs/event-protocol.md) for the full client/server socket event contract, backed by the types in [shared/types.ts](shared/types.ts).

## Architecture

See [docs/architecture.md](docs/architecture.md) for a component diagram plus sequence diagrams for the draw-event flow and reconnect flow.

## Report

See [docs/report.md](docs/report.md) for a project retrospective: what's built, key architectural decisions and trade-offs, testing status, known limitations, and notable bugs found and fixed.

## Board data model

A **Board** holds the room's authoritative state: its shapes, connected users, and timestamps. A **Shape** is a discriminated union over `pen | eraser | line | rect | circle | text`, each tagged with the `userId` that created it (needed for presence, undo attribution, and future per-user permissions). See [shared/types.ts](shared/types.ts) for the exact definitions.
