# Project Report — CollabCanvas

## Summary

CollabCanvas is a real-time collaborative whiteboard: multiple participants join a room by code and draw together, with live cursors, presence, undo/redo, persistence, and export. Client is React + TypeScript + Vite with Zustand for local state; server is Node + Express + Socket.IO holding authoritative room state in memory, debounce-persisted to disk. The full event contract is in [event-protocol.md](event-protocol.md) and the component/sequence diagrams are in [architecture.md](architecture.md).

## What's built

- Drawing tools: pen, eraser, line, rectangle, circle, text; select/move/delete
- Multi-user real-time sync via Socket.IO, with the server as the single source of truth clients reconcile against
- Presence: participant list, live labeled remote cursors, join/leave events
- Per-user undo/redo — tracked per socket connection (`ownedShapeIds`/`redoStack`), so one user's undo can't touch another user's shapes
- Reconnect handling: visible banner, automatic rejoin, full board resync on reconnect
- Board persistence to disk (debounced), reloaded on server boot
- PNG and JSON export
- Round-trip latency measurement (5s ping)
- Touch support and responsive layout for mobile

## Key decisions

- **Server-authoritative, full-state sync.** Rather than diffing/patching, every accepted mutation broadcasts the complete `Board`. Simpler to reason about and immune to client drift, at the cost of more bytes over the wire per event — acceptable at this scale (small rooms, modest shape counts).
- **Undo/redo scoped per connection, not per board.** Keeps the mental model simple ("undo reverts what I just drew") without needing a global operation log or conflict resolution. Trade-off: undo history doesn't survive a reconnect, since it lives only in the closure of that socket's connection handler — a new connection starts with an empty stack. This is called out explicitly in [architecture.md](architecture.md#reconnect-flow) rather than left as a surprise.
- **Full board resync on reconnect** rather than event replay. Guarantees consistency without needing to persist/replay an event log, at the cost of the undo-history reset above.

## Testing status

- **Automated**: [client/src/components/store/boardStore.test.ts](../client/src/components/store/boardStore.test.ts) covers the client board store (undo/redo, selection) via vitest.
- **Manual**: [test-checklist.md](test-checklist.md) covers multi-user sync, reconnect/late-join, server-side payload validation, mobile/touch, and latency — intended to be run with two-plus real browser sessions.

## Known limitations

- **No automated server-side tests.** `isValidShape`, room join/capacity handling, and the undo/redo event handlers have no test coverage. This is the highest-value gap: two real bugs were found this cycle in exactly this untested code (see below), and a test asserting "each user's undo only removes their own shape" would have caught the regression immediately.
- **Not yet deployed.** The app currently only runs locally; there is no live URL.
- **`server/*.json` files are untracked in git** in this environment, due to a global `*.json` gitignore rule catching `package.json`/`package-lock.json`/`tsconfig.json` before they were ever committed. A completely fresh clone can't `npm install` in `server/` until this is fixed.
- **Shape `userId` is a hardcoded placeholder** (`'local-user'`) on the client rather than the real connected user's id — it doesn't currently break anything (server-side undo tracks ownership by socket connection, not by this field), but it means shape attribution shown in the data itself is not meaningful yet.

## Notable bugs found and fixed this cycle

1. **Dev-only server restart loop.** `nodemon` was configured to watch the entire `server/` directory, including `server/data/`, which the app itself writes to on every draw/undo/delete. Each write triggered a restart, silently dropping all socket connections and resetting per-user undo state mid-session — presenting as "undo/redo doesn't work." Fixed by scoping nodemon's watch to `src/**/*` only ([server/nodemon.json](../server/nodemon.json)).
2. **Text tool silently failing.** Opening the text input on `mousedown` didn't call `preventDefault()`, so the browser's default focus-stealing behavior yanked focus back to the canvas immediately after the input was focused, firing `onBlur` → `commitText()` before any keystroke landed. The text box appeared and vanished within the same click. Fixed with a one-line `e.preventDefault()` in the text-tool mousedown branch.
3. **Production start script pointed at the wrong path.** `server/package.json`'s `start` script ran `node dist/index.js`, but `tsc` actually emits to `dist/server/src/index.js` (since `shared/types.ts` is compiled alongside the server, TypeScript preserves the directory structure from the shared root). This would have crash-looped on first deploy; caught and fixed before deployment was attempted.
