# Workout Tracker V2 — Claude Context File

## Project Identity

- **Name:** Workout Tracker V2
- **Type:** Progressive Web App (PWA), offline-first
- **URL:** https://workout-tracker-v2.vercel.app
- **Repo:** https://github.com/pr103183/Workout_Tracker_V2
- **Hosting:** Vercel (auto-deploys on push to main)
- **Backend:** Supabase (auth + PostgreSQL). Credentials live in `src/lib/supabase.ts` — not in env vars yet.
- **Version:** 2.0.2 (as of Feb 2026)

---

## Tech Stack (exact versions in package.json)

| Layer | What | Why |
|---|---|---|
| UI | React 18 + TypeScript | Component-based, type-safe |
| Styling | Tailwind CSS 3 | Utility-first, dark/light theming via CSS variables |
| Build | Vite 5 | Fast dev server, PWA plugin |
| Local DB | Dexie.js 3 (IndexedDB wrapper) | Offline-first storage; `dexie-react-hooks` for reactive `useLiveQuery` |
| Cloud DB | Supabase (PostgreSQL) | Auth, RLS-protected tables, REST API |
| Charts | Recharts 3 | Progress dashboard visualisations |
| PWA | vite-plugin-pwa + Workbox | Service worker, installability, offline caching |

---

## Directory Layout

```
src/
├── App.tsx                   # Root: wraps ThemeProvider > AuthProvider > tab router
├── main.tsx                  # ReactDOM entry; registers service worker
├── index.css                 # Tailwind directives + CSS-variable theme tokens
├── styles/
│   └── animations.css        # Keyframe animations (stagger, ripple, celebrate)
├── contexts/
│   ├── AuthContext.tsx        # Supabase session, sign-in/up/out, periodic sync trigger
│   └── ThemeContext.tsx       # light|dark|auto theme + text-size (persisted to localStorage)
├── hooks/
│   └── useSwipe.ts           # Touch-gesture tab navigation (left/right swipe)
├── lib/
│   ├── db.ts                 # Dexie schema: all interfaces + WorkoutTrackerDB class
│   ├── sync.ts               # SyncService: bidirectional upsert for every table
│   ├── supabase.ts           # createClient (URL + anon key)
│   ├── defaultExercises.ts   # 12 seed exercises (3 are is_bodyweight: true)
│   └── database.types.ts     # Generated Supabase types (not actively used at runtime)
└── components/
    ├── Auth/                 # Login, Register, ForgotPassword
    ├── Layout/               # Header (online indicator, sign-out), Navigation (tab bar)
    ├── Workouts/             # WorkoutList (search/sort/delete), WorkoutForm (CRUD + custom reps)
    ├── Exercises/            # ExerciseList (filter by muscle group, detail pane), ExerciseForm
    ├── WorkoutLog/
    │   └── LogWorkout.tsx    # ★ Most complex component — see dedicated section below
    ├── History/              # WorkoutHistory (strength list + detail + inline edit; links CardioHistory)
    ├── Cardio/               # CardioLog (start/stop timer), CardioHistory (list + detail)
    ├── Planning/             # WorkoutPlanner (7-day calendar, schedule/complete)
    ├── Progress/             # Progress (sub-tab shell), ProgressDashboard (Recharts), PersonalRecords, StreaksAchievements
    ├── Settings/             # Settings (password change, theme toggle, text size)
    └── ErrorBoundary.tsx     # Catches render errors, shows fallback UI
```

---

## Database Schema (Dexie — `src/lib/db.ts`)

Every table has a `_synced?: boolean` flag. `false` means pending upload; the sync service flips it to `true` after a successful upsert.

| Table | Key fields | Notes |
|---|---|---|
| `profiles` | id, email | Mirrors Supabase `auth.users` |
| `exercises` | id, user_id, name, muscle_group, is_bodyweight, is_custom | 12 defaults seeded on first login; `is_bodyweight` controls weight-input visibility |
| `workouts` | id, user_id, name, description | Template workouts |
| `workout_exercises` | id, workout_id, exercise_id, order_index, sets, reps, custom_reps[], rest_seconds | Junction table. `order_index` drives display order. `custom_reps` overrides per-set reps |
| `workout_logs` | id, user_id, workout_id, started_at, completed_at, notes | `completed_at === null` → in-progress; resume logic queries this |
| `workout_log_sets` | id, workout_log_id, exercise_id, set_number, reps, weight, completed | Leaf-level data. Every mutation saves immediately with `_synced: false` |
| `planned_workouts` | id, user_id, workout_id, scheduled_date, completed | Calendar entries |
| `cardio_logs` | id, user_id, activity_type, duration_seconds, distance_miles, calories | Cardio sessions |

Dexie indexes (from the `stores()` call) are listed in `db.ts`. Notably missing compound indexes — flagged in ARCHITECTURE.md as a future optimisation.

---

## Sync Architecture (`src/lib/sync.ts`)

- `SyncService` is a singleton (`export const syncService`).
- `syncAll(userId)` is called (a) on auth state change and (b) every 60 seconds via `setInterval` in `AuthContext`.
- Each table has its own private method: upload unsynced locals via `supabase.upsert`, then pull all remote rows via `select` and merge with locals.
- **Important:** The `syncExercises` method merges remote data with existing local records to preserve local-only fields like `is_bodyweight` that don't exist in the Supabase schema.
- **Known limitation:** no conflict resolution — last-write-wins. No delete sync (deletes are local-only unless explicitly deleted from remote first).

---

## LogWorkout.tsx — Detailed Reference

This is the largest, most-maintained component. Key design decisions and recurring pitfalls are documented here to avoid re-introducing old bugs.

### State variables

```
selectedWorkout   – the Workout template being logged
currentLog        – the active WorkoutLog row (null until "Start" is clicked)
workoutExercises  – WorkoutExercise[] for the current workout (mutated during in-progress editing)
exercises         – Exercise[] (the detail objects — needed for is_bodyweight, name, etc.)
logSets           – WorkoutLogSet[] for the current log
previousData      – Map<exercise_id, {sets, workout_date}> for "Use Same" / "+5 lbs"
showExercisePicker – toggles the add-exercise UI
allExercises      – useLiveQuery of every Exercise for the picker (separate from `exercises`)
```

### Resume flow (on mount)

1. Query `workout_logs` for rows where `completed_at === null`.
2. Pick the most recent one.
3. Load associated `workout_exercises`, **and also load the `exercises` table rows** (critical — the `is_bodyweight` field lives there).
4. Load `workout_log_sets` for that log.

**Past bug:** step 3 originally used a local variable named `exercises` that shadowed the state setter. The variable was renamed to `workoutExs`. Also, the Exercise detail objects were never loaded during resume, causing `is_bodyweight` to always be undefined → weight inputs showed for bodyweight exercises. Fixed by adding an explicit `db.exercises.where('id').anyOf(exerciseIds)` call inside the resume effect.

### Cancel flow

`handleCancelWorkout` must clear **all** state: `selectedWorkout`, `currentLog`, `workoutExercises`, `exercises`, `logSets`, `notes`, `previousData`. It also deletes the `workout_log` and all its `workout_log_sets` from **both** the local database AND Supabase remote. This is critical — if only local is deleted, the sync service will re-pull the cancelled workout from remote, causing it to reappear.

**Past bug (Feb 2026):** Cancelled workouts kept reappearing because they were only deleted locally. The fix required adding Supabase delete calls before local deletes:
```ts
await supabase.from('workout_log_sets').delete().eq('workout_log_id', currentLog.id);
await supabase.from('workout_logs').delete().eq('id', currentLog.id);
```

### Bodyweight exercise guard

Weight input is rendered conditionally:

```tsx
{exercise && !exercise.is_bodyweight && ( <input ... /> )}
```

Both checks are required. If `exercise` is undefined (not yet loaded), the weight input must NOT render — this is the opposite of a typical optional-chaining pattern.

### Set ordering

Sets are sorted with explicit `Number()` conversion:

```tsx
.sort((a, b) => Number(a.set_number) - Number(b.set_number))
```

IndexedDB can return `set_number` as a string in some edge cases. Without `Number()`, `"9" > "10"` lexicographically, breaking order.

### Exercise deduplication

`workoutExercises` state can contain duplicate `exercise_id` entries (e.g. after sync pulls). Before rendering or reordering, duplicates are removed:

```tsx
const uniqueWorkoutExercises = Array.from(
  new Map(workoutExercises.map(we => [we.exercise_id, we])).values()
).sort((a, b) => a.order_index - b.order_index);
```

The same deduplication is performed inside `handleMoveExercise` before computing indexes — the handler must operate on the same list the UI shows, or moves will appear random.

### Reorder (↑ ↓)

Disabled states are computed from `displayIndex` (the `.map` callback index), NOT from `workoutExercise.order_index`. The `order_index` field is only updated *after* the swap; using it for boundary checks before the update produces off-by-one errors.

### Remove exercise

`handleRemoveExercise` must delete from **three** places:
1. `workout_log_sets` rows matching the exercise (the logged set data).
2. `workout_exercises` rows matching the exercise (the template linkage) — **in the database**, not just state. This was a recurring bug: state was cleared but the DB row persisted, so the exercise reappeared on resume.
3. Both `logSets` and `workoutExercises` state arrays.

### Add exercise (in-progress)

`handleAddExerciseToWorkout`:
- Checks for duplicates against current `workoutExercises`.
- Creates a `WorkoutExercise` row (persisted to DB).
- Creates 3 initial `WorkoutLogSet` rows (persisted via `bulkAdd`).
- Pushes the new Exercise into the local `exercises` state so the weight-input guard works immediately.
- The picker filters using `allExercises` (a `useLiveQuery` of the full exercise table), not the subset `exercises` state.

### Sync / persistence pattern

Every handler that mutates a `workout_log_sets` row follows this pattern:
1. Update React state immediately (optimistic UI).
2. Call `db.workout_log_sets.update(id, { ...fields, _synced: false })`.

`_synced: false` is mandatory on every write — it's how the sync service discovers pending changes. The checkbox toggle (`handleToggleSetComplete`) previously omitted `_synced: false`; that was the root cause of the "checkbox doesn't stick" bug.

---

## Tab Navigation

Tabs are defined as a static array in `App.tsx`:

```
TABS = ['workouts', 'exercises', 'log', 'cardio', 'history', 'progress', 'plan', 'settings']
```

Swipe left/right on mobile cycles through this array via `useSwipe`. The `Navigation` component renders the same array as buttons.

---

## Theming

- Three CSS class tokens on `<html>`: `.dark` / `.light` (resolved from the `auto|dark|light` preference).
- CSS custom properties (`--bg-primary`, `--text-primary`, `--card-bg`, etc.) are defined per theme in `index.css`.
- Text size is set via `data-text-size` attribute on `<html>` and a `--text-size-multiplier` CSS variable.
- Both theme and text size are persisted to `localStorage` and restored in `ThemeContext` initial state.

---

## Bodyweight Exercises (seed data)

Three of the 12 default exercises have `is_bodyweight: true`:
- Pull-ups
- Tricep Dips
- Plank

Any custom exercise can also be marked bodyweight via the checkbox in `ExerciseForm`. The flag gates the weight input in `LogWorkout` and should gate any volume calculations that assume weight > 0.

---

## Known Limitations / Future Work

(From ARCHITECTURE.md performance section)

1. **Bundle size** ~877 KB — Recharts is the main contributor. Code-splitting not yet implemented.
2. **O(n²) queries** in `fetchPreviousData` inside LogWorkout — loads all logs, then all sets for each, in a loop.
3. **Partial delete sync** — `handleCancelWorkout` now deletes from both local and remote, but general deletions elsewhere still lack sync. If a row is deleted locally without explicit remote deletion, the next sync will re-pull it.
4. **No conflict resolution** — last-write-wins on upsert.
5. **Missing DB indexes** — `[user_id, completed_at]` and `[workout_log_id, exercise_id]` would speed up common queries.
6. **Supabase credentials in source** — should move to `.env` for production.
7. **browser `alert()`/`confirm()`** used for confirmations — should be replaced with themed modals.
8. **Supabase schema mismatch** — `is_bodyweight` field exists in local Dexie but not in Supabase. Sync service now merges to preserve it, but ideally the Supabase schema should be updated to include it.

---

## Deployment

Push to `main` on GitHub → Vercel auto-builds (`npm run build` = `tsc && vite build`) and deploys. No CI/CD config file needed — Vercel detects Vite automatically.

Build command: `npm run build`
Output dir: `dist/`

---

## Common Pitfalls (lessons learned this project)

1. **Never shadow state variable names** in async effects. `exercises` was shadowed by a local in the resume effect — rename locals to something distinct.
2. **Always set `_synced: false`** on every DB write. Forgetting it on even one path (e.g. the checkbox toggle) breaks cloud persistence for that field.
3. **Deduplicate before indexing.** If you use `.findIndex()` on `workoutExercises` for reordering, deduplicate first — or the index will be wrong when duplicates exist.
4. **Use `displayIndex` for boundary checks, not `order_index`.** `order_index` is the persisted value and may be stale until after the swap completes.
5. **Delete from DB, not just state**, when removing exercises during a workout. State is ephemeral; the resume effect re-fetches from DB on every app open.
6. **Load Exercise detail objects explicitly on resume.** The `workoutExercises` table only has `exercise_id`; the `is_bodyweight` flag (and name, etc.) lives on the `exercises` table and must be fetched separately.
7. **`Number()` wrap numeric sorts from IndexedDB.** `set_number` can arrive as a string; `"9" > "10"` lexicographically.
8. **Delete from remote before local** when cancelling workouts. If only local is deleted, sync will re-pull the remote record.
9. **Merge, don't overwrite** when syncing exercises. The Supabase `exercises` table doesn't have `is_bodyweight`, so overwriting local with remote data would lose that field.
10. **Clean up duplicates proactively.** The resume flow and workout load effects now deduplicate `workout_exercises` and delete the extras from the database.
11. **Clean up orphaned workout logs.** If a workout log references a workout that no longer exists, delete it from both local and remote during resume.

---

## Testing Skill

A `/test` skill is available at `.claude/skills/test/SKILL.md` that provides a comprehensive checklist for testing the app for known bugs and edge cases. **Run this skill after making changes to catch regressions.**

### Using the Tester

Invoke with `/test` to get a structured testing checklist covering:
- Workout log resume behavior
- Bodyweight exercise handling
- Duplicate exercise prevention
- Set management
- Exercise reordering
- Sync behavior

### Adding to the Tester

**IMPORTANT:** When fixing a bug, always add a corresponding test case to the tester skill. This ensures the bug doesn't regress in future changes.

To add a test case:
1. Open `.claude/skills/test/SKILL.md`
2. Add a checkbox item under the appropriate category
3. Include what to verify and what the expected behavior should be

Example:
```markdown
- [ ] Verify [specific behavior] works correctly after [scenario]
```
