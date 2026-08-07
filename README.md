# CollabCanvas

Real-time collaborative whiteboard. Multiple participants join a room by code and draw together — shapes, text, and freehand strokes sync live, with visible cursors, presence, undo/redo, and export.

## Problem statement

Remote teams and classrooms often need a lightweight shared space to sketch ideas together in real time, without the overhead of a full design tool or a paid product. Most free whiteboard tools either require accounts, lose state on refresh, or don't handle multiple simultaneous editors cleanly (conflicting undo/redo, stale state on reconnect, no indication of who's doing what). CollabCanvas addresses this with a minimal, no-signup, room-code-based whiteboard where the server is the single source of truth, so every participant always converges on the same board — even after a dropped connection.

## Objectives

- Let multiple users draw on the same board in real time with no perceptible lag or state divergence.
- Make each user's presence visible (live cursor, name, color) and their actions individually undoable without affecting others' work.
- Survive real-world network conditions: reconnect gracefully, resync fully, never silently lose or corrupt board state.
- Keep the client honest — validate input, surface errors as readable messages, and never expose raw technical failures to the user.
- Ship with enough automated and manual test coverage that a regression in core sync/undo logic gets caught before it reaches users.

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

## Architecture

See [docs/architecture.md](docs/architecture.md) for a component diagram plus sequence diagrams for the draw-event flow and reconnect flow.

In short: the server holds authoritative room state in memory (debounce-persisted to disk) and broadcasts the full `Board` on every accepted mutation. Clients don't diff or merge locally — they reconcile against whatever the server sends, which keeps the sync model simple and immune to client-side drift.

## Technology stack

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

## Environment variables

Both `client/.env.example` and `server/.env.example` document the environment variables used to point the two at each other — copy them to `.env` and adjust for anything other than the local defaults above.

| Variable | Where | Purpose | Default |
|---|---|---|---|
| `VITE_SERVER_URL` | `client/.env` | URL the client connects Socket.IO to | `http://localhost:3001` |
| `PORT` | `server/.env` | Port the server listens on | `3001` |
| `CLIENT_ORIGIN` | `server/.env` | Comma-separated allowed CORS origin(s) for the client | `http://localhost:5173` |

## Input validation, error handling, and recovery

- **Join form**: room code and username are required and trimmed before submit; the join button stays disabled until both are non-empty. Room code is auto-uppercased and capped at 6 characters.
- **Server-side validation**: every incoming shape payload is checked against its expected shape (`isValidShape` in [server/src/index.ts](server/src/index.ts)) before being applied — malformed payloads are rejected with an `error` event rather than corrupting the shared board.
- **User-facing errors**: `error` and `room_full` events from the server are caught on the client and rendered as plain, readable messages with a way back to the join screen — never a raw error object, stack trace, or socket payload dump.
- **Loading state**: a spinner and "Joining room…" message show while the client is connecting, before the board is available.
- **Empty state**: a new or cleared board shows a placeholder hint ("Draw something to get started…") instead of a blank, ambiguous canvas.
- **Recovery**: the client auto-reconnects on drop (Socket.IO reconnection with backoff) and shows a reconnecting banner; on reconnect, the client discards any local assumptions and fully resyncs to the server's board state.

## Testing

Testing is treated as mandatory, not optional, covering both automated and manual layers:

```bash
cd client && npm run test   # vitest: board store (undo/redo, selection)
```

- **Automated**: [client/src/components/store/boardStore.test.ts](client/src/components/store/boardStore.test.ts) covers the client board store (undo/redo, selection) via vitest.
- **Manual**: [docs/test-checklist.md](docs/test-checklist.md) is a checklist for critical multi-user flows — room join/sync, selection/delete/undo across users, reconnect/late-join, server-side payload validation failure cases, mobile/touch, and performance under concurrent drawing. Server has no automated test suite yet — see [docs/report.md](docs/report.md#known-limitations) for why and what's left.

## Screenshots

_Add screenshots here (join screen, active board with multiple cursors, mobile view, export)._

<!-- ![Join screen](docs/screenshots/join.png) -->
<!-- ![Board with live cursors](docs/screenshots/board.png) -->
<!-- ![Mobile view](docs/screenshots/mobile.png) -->

## Wireframes

See [docs/wireframes.md](docs/wireframes.md) for the join screen and main board layout.

## Event protocol

See [docs/event-protocol.md](docs/event-protocol.md) for the full client/server socket event contract, backed by the types in [shared/types.ts](shared/types.ts).

## Report

See [docs/report.md](docs/report.md) for a project retrospective: what's built, key architectural decisions and trade-offs, testing status, known limitations, and notable bugs found and fixed.

## Board data model

A **Board** holds the room's authoritative state: its shapes, connected users, and timestamps. A **Shape** is a discriminated union over `pen | eraser | line | rect | circle | text`, each tagged with the `userId` that created it (needed for presence, undo attribution, and future per-user permissions). See [shared/types.ts](shared/types.ts) for the exact definitions.
