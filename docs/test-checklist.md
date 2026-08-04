# Manual Test Checklist — Multi-user, Mobile, Failure

Run against a deployed or local build with the server running and two+ separate browser sessions (or two devices) joining the same room code. Check off each item and note the result/date.

## 1. Room join & multi-user sync

- [ ] User A creates a room by joining with a new code; board loads empty.
- [ ] User B joins the same code; sees the same (empty or current) board state via `board_update`.
- [ ] User A draws a pen stroke; User B sees it appear without refreshing.
- [ ] User B draws a shape (rect/circle/line); User A sees it.
- [ ] User A adds text; User B sees the same text, position, and content.
- [ ] User A erases part of a stroke; change is reflected for User B.
- [ ] A third user (User C) joins mid-session and receives the full current board state (not just events from that point on).
- [ ] `user_joined` / `user_left` update the participant list live for all connected users.
- [ ] Live cursors: moving the pointer on User A's screen shows a labeled cursor on User B's screen, and vice versa.

## 2. Selection, delete, undo (multi-user)

- [ ] User A selects a shape User B drew and deletes it; deletion propagates to User B.
- [ ] User A undoes their own last action; only their action is reverted (not User B's).
- [ ] Undo after another user's intervening action still resolves to a correct, consistent board on both clients (no divergence).
- [ ] `clear_board` from one user empties the canvas for everyone in the room.

## 3. Reconnect & late join

- [ ] User A closes their laptop lid / kills network mid-session, then reconnects — reconnecting banner shows during the gap.
- [ ] On reconnect, User A's board matches the authoritative server state (including changes made while they were offline).
- [ ] User B sees User A marked as disconnected (`user_left`) during the outage and reappearing on reconnect.
- [ ] A brand-new user joining after several rounds of edits gets the correct final board, not a stale or partial one.

## 4. Server-side validation (failure cases)

- [ ] Manually emit a malformed `draw` payload (e.g. missing required shape fields) via devtools/socket client — server responds with `error` and does not corrupt the shared board.
- [ ] Emit `delete_shape` with a non-existent `shapeId` — server returns `error`, no crash, other clients unaffected.
- [ ] Join a room that's already at capacity — client receives `room_full` and is not added to the participant list.
- [ ] Emit rapid-fire `cursor_move` events — server/client throttling prevents flooding (check network tab / latency ping stays reasonable).

## 5. Mobile / touch

- [ ] Open the app on a phone-sized viewport (or real device); toolbar is not clipped and remains usable.
- [ ] Drawing with a finger (pen tool) produces a smooth stroke, not disconnected dots.
- [ ] Pinch/scroll gestures don't accidentally trigger drawing or vice versa (touch drawing vs. page scroll conflict).
- [ ] Text tool is usable on mobile (keyboard doesn't cover the input, text lands in the right place).
- [ ] Rotating the device (portrait ↔ landscape) doesn't break canvas layout or lose board state.

## 6. Performance / latency

- [ ] Latency ping (round-trip time) stays low and stable during normal use; note the observed value.
- [ ] With 3+ simultaneous users drawing continuously, UI stays responsive (no dropped frames or event backlog).

---

**How to run**: two people (or two browser windows/incognito + a phone) join the same room code and step through sections 1–3 and 5 together; sections 4 and 6 can be done solo with devtools/socket debugging.
