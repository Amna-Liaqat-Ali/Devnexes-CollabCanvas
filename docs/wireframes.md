# Wireframes

Low-fidelity layout reference for the two screens in the app. These match the current implementation ([JoinScreen](../client/src/App.tsx), [ToolPalette](../client/src/components/ToolPalette.tsx), [Canvas](../client/src/components/Canvas.tsx), [UserList](../client/src/components/UserList.tsx)).

## 1. Join screen

Shown before a user has joined a room (`isJoined === false`).

```
┌──────────────────────────────────────────┐
│                                            │
│              ┌──────────────┐             │
│              │  CollabCanvas              │
│              │  Real-time collaborative   │
│              │  whiteboard                │
│              │                            │
│              │  [ Room Code (e.g. ABC123)]│
│              │  [ Your Name              ]│
│              │                            │
│              │      [ Join Room ]         │
│              └──────────────┘             │
│                                            │
└──────────────────────────────────────────┘
```

- Room code input: uppercased, max 6 chars, autofocus.
- Join button disabled until both fields are non-empty.
- Later weeks: add "Create new room" affordance (generate + display a shareable code/link) and inline error state for `room_full` / invalid code.

## 2. Board screen

Shown after joining. Three-column layout: tool palette, canvas, user list.

```
┌───────────┬────────────────────────────────────┬───────────────┐
│  Tools    │                                    │  Room: ABC123 │
│  Pen      │                                    │  ------------ │
│  Eraser   │                                    │  You: amna    │
│  Line     │            CANVAS                  │  * alice      │
│  Rectangle│       (live cursors render here)   │  * bob        │
│  Circle   │                                    │               │
│  Text     │                                    │               │
│           │                                    │               │
│  Color: [ ]                                    │               │
│  Size: 4px│                                    │               │
│  ---------│                                    │               │
│  Undo     │                                    │               │
│  Redo     │                                    │               │
│  Clear    │                                    │               │
└───────────┴────────────────────────────────────┴───────────────┘
```

- **Tool palette** (left, fixed width): tool selection, color picker, stroke size, undo/redo/clear.
- **Canvas** (center, flex-grow): drawing surface; also where other users' live cursors and shapes are rendered.
- **User list** (right): current room code, own username, other connected participants — this is where presence (colored dot per user) and live-cursor labels attach.
- Responsive behavior: on narrow/tablet widths the layout stacks or collapses the side panels so the tool palette is never clipped (see `App.css` responsive rules).

