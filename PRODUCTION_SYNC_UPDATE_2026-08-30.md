# Production sync / Appwrite efficiency update

Date: 2026-08-30

This pass replaces the task screen's constant 3-second polling with Appwrite Realtime and reduces unnecessary task refetches. The existing Next.js/Hono server API remains the source of truth for reads and writes.

## What changed

### 1. Removed 3-second task polling

`src/features/tasks/api/use-get-tasks.ts`

Normal task screens now use:

- Appwrite Realtime for changes made by other users.
- React Query `staleTime` of 30 seconds.
- Refetch when the browser window regains focus.
- Refetch after network reconnect.
- No interval polling while Realtime is available.
- A 30-minute foreground-only safety refresh if Realtime is unavailable.
- A manual refresh button in the task header.

The 30-minute fallback is intentionally slow so a Realtime configuration problem does not burn through the Appwrite Free database-read allowance.

### 2. Added Appwrite Web SDK for Realtime

New dependency:

```json
"appwrite": "22.3.0"
```

The project already uses `node-appwrite` server-side. The new `appwrite` package is the browser SDK and is used only for the browser session and WebSocket subscription.

After receiving this source, run:

```bash
bun install
bun run build
```

Commit the updated `bun.lockb` after Bun updates it.

### 3. Added a browser Appwrite session

New file:

`src/lib/appwrite-browser.ts`

The existing HttpOnly session cookie is still used by the Next/Hono API and remains the primary application session.

Appwrite Realtime runs in the browser and requires an authenticated client session. Login/register now also creates a browser Appwrite session. Logout removes it.

Important: users who were already logged in before this deployment should log out and log back in once. Until then the task screen will show the fallback sync state.

### 4. Added workspace-filtered Realtime subscription

New file:

`src/features/tasks/hooks/use-task-realtime.ts`

The task screen subscribes only while it is mounted. The subscription listens for task document changes and passes a Realtime query for the current `workspaceId`, so Appwrite filters events server-side before delivering them to this browser.

When a task event arrives, React Query invalidates the matching task cache after a short debounce. Kanban, Timeline, and Iqube therefore continue sharing the same task data.

### 5. Added optimistic task updates

Changed:

- `src/features/tasks/api/use-update-task.ts`
- `src/features/tasks/api/use-delete-task.ts`
- `src/features/tasks/api/use-bulk-update-tasks.ts`
- new `src/features/tasks/api/task-cache.ts`

Task edits, Timeline/Iqube moves, deletes, and Kanban moves now update the visible React Query cache immediately. The network write happens once. If the write fails, the previous cache is restored.

A background refetch after the write keeps populated store/assignee data exact.

### 6. Reduced relationship-query waste

`src/features/tasks/server/route.ts`

- Task list explicitly allows up to 100 documents instead of Appwrite's default 25.
- Duplicate project/store IDs are removed before related records are loaded.
- Duplicate assignee IDs are removed before related records are loaded.
- Related project/member queries run in parallel.
- Related queries are skipped completely when there are zero tasks.
- Exact `$id` matching uses `Query.equal(..., [ids])`.

This is still a bounded working set. If a workspace regularly needs more than 100 tasks in one unfiltered view, add cursor pagination or a default date window instead of simply increasing the limit indefinitely.

### 7. Fixed 25-item member/store truncation

Changed:

- `src/features/members/server/route.ts`
- `src/features/projects/server/route.ts`

Both now request up to 100 items. This matters because the target deployment can have around 50 employees; Appwrite list requests otherwise default to only 25 results.

### 8. Removed stale browser API host dependency

`src/lib/rpc.ts`

Browser API calls now use `window.location.origin`. This prevents a new Vercel deployment from calling an old `*.vercel.app` hostname because `NEXT_PUBLIC_APP_URL` was baked into the frontend.

Server-side calls can still use `NEXT_PUBLIC_APP_URL` where needed.

## Appwrite Console steps required

### Add the Web platforms

Because the browser now talks directly to Appwrite for its session and Realtime socket, Appwrite must recognize the browser hostname as a Web platform.

In Appwrite Console, add the relevant Web platform hostnames for this project, for example:

- `localhost` for local development.
- Your current production Vercel hostname.
- Your final custom production domain when you add one.

Avoid leaving obsolete deployment domains around indefinitely.

### Check task permissions before production

Realtime respects Appwrite read permissions. This is important: the React `workspaceId` check is not a security boundary.

If the Tasks collection currently grants every authenticated Appwrite user read permission to every document, a user may have broader direct Appwrite access than the Hono API intends. Before production with multiple workspaces, review collection/document permissions and make sure users can only read the task documents they are allowed to see.

Do **not** make the Tasks collection readable by `Any` merely to make Realtime work.

The same principle applies to Projects/Stores and Members where appropriate.

## Recommended Appwrite indexes

Check the Tasks collection and create/retain indexes that match the filters actually used by the app. At minimum, review indexes for:

- `workspaceId`
- `projectId`
- `assigneeId`
- `status`
- `dueDate`
- `position`
- `name` as a full-text index if task search is enabled

Common compound-query candidates for this application are:

- `workspaceId + dueDate`
- `workspaceId + projectId + dueDate`
- `workspaceId + assigneeId + dueDate`
- `workspaceId + status + position`

Create compound indexes based on the actual query errors/usage shown by Appwrite rather than blindly creating every possible combination.

## How to verify Realtime after deployment

1. Run `bun install` and `bun run build` locally.
2. Deploy.
3. Log out and log back in once.
4. Open the task screen.
5. Confirm the sync indicator says `リアルタイム同期`.
6. Open the same workspace in a second browser/account.
7. Change a task in browser A.
8. Browser B should update without waiting for a polling timer.
9. Test a Timeline drag, an Iqube date move, and a Kanban move.
10. Check Appwrite usage after several days.

If the indicator says `30分同期`, check:

- whether the current hostname is registered as an Appwrite Web platform;
- browser console CORS/origin errors;
- whether the user logged in again after deploying this update;
- task read permissions;
- WebSocket/network blocking.

The manual refresh button and focus/reconnect refetch remain available even in fallback mode.

## Session note

The current architecture creates an Appwrite server session and a browser session for the same login. Appwrite limits the number of active user sessions, so this is something to keep in mind for users who sign in from many devices/browsers.

This is a pragmatic way to add Realtime without rewriting the existing SSR authentication architecture. A future auth refactor could consolidate session handling if needed.

## Files added

- `src/lib/appwrite-browser.ts`
- `src/features/tasks/hooks/use-task-realtime.ts`
- `src/features/tasks/api/task-cache.ts`
- `PRODUCTION_SYNC_UPDATE_2026-08-30.md`

## Files changed

- `package.json`
- `src/lib/rpc.ts`
- `src/features/auth/api/use-login.ts`
- `src/features/auth/api/use-register.ts`
- `src/features/auth/api/use-logout.ts`
- `src/features/tasks/api/use-get-tasks.ts`
- `src/features/tasks/api/use-update-task.ts`
- `src/features/tasks/api/use-delete-task.ts`
- `src/features/tasks/api/use-bulk-update-tasks.ts`
- `src/features/tasks/components/task-view-switcher.tsx`
- `src/features/tasks/server/route.ts`
- `src/features/members/server/route.ts`
- `src/features/projects/server/route.ts`

## Validation performed here

All `src/` and `scripts/` TypeScript/TSX files were parsed with TypeScript successfully with zero syntax errors.

A complete `next build` could not be run in this environment because the project's npm dependencies are not installed here and external package installation is unavailable. Run the real build after `bun install` on your machine before deploying.
