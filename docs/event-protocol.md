# Event Protocol

Socket.IO event contract between client and server. Types are the source of truth in [shared/types.ts](../shared/types.ts) — this doc explains intent, direction, and payload shape for each event.

## Client → Server (`ClientToServerEvents`)

| Event | Payload | Purpose |
|---|---|---|
| `join_room` | `{ roomCode: string; username: string }` | Join (or implicitly create) a room by code. Server registers the user, adds them to the room, and replies with the current `board_update` plus a `user_joined` broadcast to others. |
| `draw` | `Shape` | A completed drawing action (pen stroke, eraser stroke, line, rect, circle, or text). Server validates, appends to board state, and rebroadcasts to the room. |
| `delete_shape` | `shapeId: string` | Remove a shape by id (selection + delete). Server validates the shape exists and rebroadcasts the removal. |
| `cursor_move` | `{ x: number; y: number }` | Live pointer position. Throttled/batched client-side before emit — this is the highest-frequency event and must not be sent on every raw `pointermove`. |
| `undo` | — | Revert the sender's last action. Server resolves against authoritative history and rebroadcasts the resulting board. |
| `clear_board` | — | Clear all shapes in the room. |

## Server → Client (`ServerToClientEvents`)

| Event | Payload | Purpose |
|---|---|---|
| `board_update` | `Board` | Full authoritative board state. Sent on join, and after any accepted mutation (draw/delete/undo/clear), so all clients converge on the same state. |
| `user_joined` | `User` | A new participant joined the room. |
| `user_left` | `userId: string` | A participant disconnected or left. |
| `cursor_update` | `{ userId: string; x: number; y: number }` | Broadcast of another user's live cursor position. |
| `error` | `message: string` | A submitted event was rejected (invalid payload, unknown room, etc). |
| `room_full` | `message: string` | Join rejected because the room is at capacity. |

## Design notes

- **Server is authoritative.** Clients optimistically render their own actions locally, but the server's `board_update` is the source of truth all clients reconcile against — this is what makes reconnect/state-recovery possible.
- **Validation happens server-side.** Every incoming event (`draw`, `delete_shape`, `cursor_move`, etc.) must be validated against the `shared/types.ts` shapes before being applied or rebroadcast, since a malformed or malicious payload from one client must not corrupt the shared board for everyone else.
- **`cursor_move` is not `draw`.** Cursor events are ephemeral presence data (not part of board history), which is why they get their own throttled event/channel instead of going through the board-state path.
- **Room code is the join key.** `join_room` doesn't distinguish "create" from "join" — the first user to use a code creates the room implicitly; this keeps the protocol small (see Functional Requirements: "create or join a room using a unique code").
