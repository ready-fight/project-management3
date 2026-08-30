# Timeline / Iqube view update

This update is based on the `src.zip` build supplied on 2026-08-30.

## What changed

### `src/features/tasks/components/data-timeline.tsx`
- Reworked the timeline to look closer to the supplied reference:
  - fixed time rail on the left
  - 09:00–18:00 hourly grid
  - assignee/store column headers
  - assignee avatars / store avatars
  - previous/next date controls
  - assignee/store axis toggle
  - compact status legend
  - task cards positioned from their actual start/end times
  - status-tinted cards and important-task badge
- Replaced the old cell-based drag behavior with pointer-based 2D drag behavior.
  - vertical drag changes start time (30-minute snap)
  - horizontal drag changes assignee or store depending on the selected axis
  - original task duration is preserved
  - tap/click without dragging still opens the edit modal
  - Pointer Events are used, so no additional drag package is required for this view
- Timeline now respects the selected store/assignee/status filters locally in addition to the server query.
- When the store filter is selected and the timeline axis is `店舗`, only the selected store column is shown.

### `src/features/tasks/components/data-schedule.tsx`
- Reworked the Iqube schedule into one grouped table similar to the supplied reference.
- Added columns for:
  - date / task count
  - store
  - task name / memo
  - category
  - assignee
  - status
  - priority (derived from the existing `isImportant` field)
  - due/start time
- Added status-colored badges and assignee avatars.
- Added drag-to-change-date:
  - drag using the grip handle next to the task name
  - move onto another visible date group
  - dropping updates `dueDate`
  - a floating preview and highlighted target date provide visual feedback
- Status remains directly editable from the table.
- Row click still opens full task editing.

### `src/features/tasks/components/task-view-switcher.tsx`
- Added a local filtered-task layer before data is sent to Kanban / Timeline / Iqube.
- This makes the selected store filter authoritative even during React Query refetches and prevents stale all-store data from appearing temporarily.
- Also applies selected assignee, status, and date locally.

## Packages

No new packages were added.

- Kanban continues to use `@hello-pangea/dnd`.
- Timeline and Iqube date dragging use browser Pointer Events to avoid adding another dependency.

## Important behavior notes

- Timeline is a one-day view. If the common date filter is set, that date is used. If no date is selected, the earliest date currently present in the loaded task data is shown (or today when there are no tasks).
- Timeline drag snaps to 30-minute increments, while the edit form can still hold the finer time values already supported by the app.
- Iqube drag can move a task to another date group that is currently visible in the table. If a common date filter limits the table to one date, use the edit modal (or clear the date filter) to move to a different date.
- `優先度` does not add a new database field. Existing `isImportant=true` displays as `高`; other tasks display as `通常`.

## Database / Vercel

No new Appwrite attributes, environment variables, or Vercel settings are required for this update.

## Validation performed here

- Parsed all TypeScript / TSX source files with TypeScript 5.8: 0 syntax errors.
- A complete `next build` could not be run in the sandbox because npm dependencies are not cached and outbound package installation is unavailable.
- The supplied source already uses `date-fns@3.6.0`, so this update does not reintroduce the earlier Vercel `react-day-picker` / `date-fns` peer conflict.

## Recommended check after copying the update

```bash
bun run build
```

Then verify:
1. Select one store in the common filter and open Timeline.
2. Confirm only that store's tasks appear; when axis=`店舗`, only that store column is shown.
3. Drag a Timeline task vertically and confirm start/end time changes while duration stays the same.
4. Drag a Timeline task horizontally and confirm assignee/store changes based on the active axis.
5. In Iqube, drag a row by its grip handle onto another visible date and confirm the date changes.
6. Change status in Iqube and verify Kanban/Timeline reflect the same task after query refresh.
