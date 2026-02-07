# Sync Testing Checklist

This document tracks all known sync issues and tests to verify sync is working properly.

**IMPORTANT**: The Supabase database schema may differ from what's defined in `supabase-schema.sql`. The schema file shows the *intended* structure, but the actual database may have been created with fewer columns. Always sync ONLY the columns that exist in the actual database.

---

## ACTUAL Supabase Schema (Verified Working)

These are the columns that actually exist in the Supabase database:

### exercises table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key |
| name | TEXT | Required |
| description | TEXT | Optional |
| muscle_group | TEXT | Required |
| equipment | TEXT | Optional |
| instructions | TEXT | Optional |
| is_custom | BOOLEAN | Required |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |

**NOT in Supabase (local-only):**
- `form_cues`
- `common_mistakes`
- `muscle_activation`
- `safety_tips`
- `is_bodyweight`
- `_synced`

### workouts table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key |
| name | TEXT | Required |
| description | TEXT | Optional |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |

**NOT in Supabase (local-only):**
- `_synced`

### workout_exercises table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| workout_id | UUID | Foreign key |
| exercise_id | UUID | Foreign key |
| order_index | INTEGER | Required |
| sets | INTEGER | Default 3 |
| reps | INTEGER | Default 10 |
| rest_seconds | INTEGER | Default 60 |
| created_at | TIMESTAMPTZ | Auto |

**NOT in Supabase (local-only):**
- `custom_reps`
- `_synced`

### workout_logs table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key |
| workout_id | UUID | Foreign key (nullable) |
| started_at | TIMESTAMPTZ | Required |
| completed_at | TIMESTAMPTZ | Nullable |
| notes | TEXT | Optional |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |

**NOT in Supabase (local-only):**
- `_synced`

### workout_log_sets table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| workout_log_id | UUID | Foreign key |
| exercise_id | UUID | Foreign key (nullable) |
| set_number | INTEGER | Required |
| reps | INTEGER | Required |
| weight | DECIMAL | Required |
| completed | BOOLEAN | Default false |
| created_at | TIMESTAMPTZ | Auto |

**NOT in Supabase (local-only):**
- `_synced`

### planned_workouts table
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key |
| workout_id | UUID | Foreign key |
| scheduled_date | DATE | Required |
| completed | BOOLEAN | Default false |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |

**NOT in Supabase (local-only):**
- `_synced`

### cardio_logs table
**Status: MAY NOT EXIST in Supabase**

If it exists:
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key |
| activity_type | TEXT | Required |
| started_at | TIMESTAMPTZ | Required |
| completed_at | TIMESTAMPTZ | Nullable |
| duration_seconds | INTEGER | Required |
| distance_miles | DECIMAL | Optional |
| calories | INTEGER | Optional |
| avg_heart_rate | INTEGER | Optional |
| notes | TEXT | Optional |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |

---

## Pre-Deployment Verification

Before deploying any sync changes, verify:

1. [ ] **Check sync.ts upload objects**: Each sync method should ONLY include columns that exist in Supabase
2. [ ] **Run build**: `npm run build` must complete without errors
3. [ ] **Check for TypeScript errors**: No type mismatches in upsert calls

---

## Sync Test Checklist

### Pre-Test Setup
- [ ] Open browser developer tools (Console tab)
- [ ] Clear console
- [ ] Navigate to Settings tab
- [ ] Note current "Last Sync" time and any errors

### Test 1: Manual Sync (No Errors)
1. [ ] Click "Sync Now" button in Settings
2. [ ] Verify: Button shows "Syncing..." then returns to "Sync Now"
3. [ ] Verify: **NO red error box appears**
4. [ ] Verify: "Last Sync" time updates
5. [ ] Verify: Header shows "Synced Just now"
6. [ ] Verify: Console shows `[Sync] Completed successfully`

**If errors appear:**
- Note the exact error message
- Check which column is missing from Supabase
- Update sync.ts to exclude that column

### Test 2: Exercise Sync
1. [ ] Create a new custom exercise
2. [ ] Click "Sync Now"
3. [ ] Verify: No errors about exercise columns
4. [ ] Verify: Console shows `[Sync] Uploaded exercise: <name>`

### Test 3: Workout Sync
1. [ ] Create a new workout template
2. [ ] Add exercises to it
3. [ ] Click "Sync Now"
4. [ ] Verify: No errors about workout or workout_exercises columns
5. [ ] Verify: Console shows uploaded messages

### Test 4: Workout Log Sync
1. [ ] Start a workout
2. [ ] Complete at least one set
3. [ ] Finish the workout
4. [ ] Verify: Sync runs automatically after finish
5. [ ] Verify: No errors in Settings
6. [ ] Verify: Console shows workout log and sets uploaded

### Test 5: Offline/Online Transition
1. [ ] Disconnect from internet (airplane mode)
2. [ ] Verify: Header shows "Offline"
3. [ ] Verify: "Sync Now" button is disabled
4. [ ] Make some changes (add exercise, update workout)
5. [ ] Reconnect to internet
6. [ ] Verify: Header shows "Synced" status
7. [ ] Click "Sync Now"
8. [ ] Verify: Pending changes sync without errors

### Test 6: Data Persistence
1. [ ] Complete a full workout
2. [ ] Wait for sync to complete (check header)
3. [ ] Sign out
4. [ ] Clear browser data / use incognito
5. [ ] Sign back in
6. [ ] Verify: Workout history shows the completed workout
7. [ ] Verify: All exercises are present

---

## Console Log Patterns

### Success Pattern
```
[Sync] Starting sync for user: <uuid>
[Sync] Session valid, user: <email>
[Sync] Exercises to upload: 0
[Sync] Remote exercises found: 12
[Sync] Workouts to upload: 0
[Sync] Remote workouts found: 3
[Sync] Workout exercises to upload: 0
[Sync] Remote workout exercises found: 15
[Sync] Workout logs to upload: 0
[Sync] Remote workout logs found: 10
[Sync] Workout log sets to upload: 0
[Sync] Remote workout log sets found: 45
[Sync] Planned workouts to upload: 0
[Sync] Remote planned workouts found: 2
[Sync] Cardio logs to upload: 0
[Sync] Completed successfully at <timestamp>
```

### Error Pattern (Column Missing)
```
[Sync] Exercise upload error: Could not find the 'column_name' column of 'table_name' in the schema cache
```

**Fix**: Remove that column from the dataToUpload object in sync.ts

---

## Known Issues History

### 2026-02-07: common_mistakes column error
- **Error**: `Could not find the 'common_mistakes' column of 'exercises'`
- **Root Cause**: Supabase database doesn't have form_cues, common_mistakes, muscle_activation, safety_tips, is_bodyweight columns
- **Fix**: Removed these columns from exercise sync upload object

### 2026-02-07: custom_reps column error
- **Error**: `Could not find the 'custom_reps' column`
- **Root Cause**: custom_reps is local-only
- **Fix**: Excluded from workout_exercises sync

### 2026-02-07: Data loss incident
- **Issue**: User lost all workout data when clearing browser storage
- **Root Cause**: Sync was not working - data never uploaded to Supabase
- **Fix**: Added comprehensive logging, session validation, and manual sync button

---

## SQL Commands for Supabase Verification

Run these in Supabase SQL Editor to verify schema:

```sql
-- List all columns in exercises table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'exercises'
ORDER BY ordinal_position;

-- List all columns in workouts table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'workouts'
ORDER BY ordinal_position;

-- List all columns in workout_exercises table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'workout_exercises'
ORDER BY ordinal_position;

-- Check if cardio_logs table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'cardio_logs'
);

-- Count records in each table (verify data exists)
SELECT 'exercises' as table_name, count(*) FROM exercises
UNION ALL
SELECT 'workouts', count(*) FROM workouts
UNION ALL
SELECT 'workout_exercises', count(*) FROM workout_exercises
UNION ALL
SELECT 'workout_logs', count(*) FROM workout_logs
UNION ALL
SELECT 'workout_log_sets', count(*) FROM workout_log_sets
UNION ALL
SELECT 'planned_workouts', count(*) FROM planned_workouts;
```

---

## Adding New Sync Fields

When adding a new field to sync:

1. **Check Supabase first**: Run SQL to verify the column exists
2. **Add to local schema**: Update `src/lib/db.ts` interface
3. **Add to sync upload**: Update the dataToUpload object in sync.ts
4. **Test**: Run sync and verify no errors
5. **Update this doc**: Add column to the schema tables above

**Never assume a column exists just because it's in supabase-schema.sql!**
