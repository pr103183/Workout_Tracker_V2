# Sync Testing Checklist

This document tracks all known sync issues and tests to verify sync is working properly.

## Schema Comparison: Local (Dexie) vs Remote (Supabase)

### exercises table

| Local Field (Dexie) | Supabase Column | Status | Notes |
|---------------------|-----------------|--------|-------|
| id | id | OK | |
| user_id | user_id | OK | |
| name | name | OK | |
| description | description | OK | |
| muscle_group | muscle_group | OK | |
| equipment | equipment | OK | |
| instructions | instructions | OK | |
| form_cues | form_cues | OK | |
| common_mistakes | common_mistakes | OK | |
| muscle_activation | muscle_activation | OK | |
| safety_tips | safety_tips | OK | |
| is_bodyweight | is_bodyweight | OK | Added in schema |
| is_custom | is_custom | OK | |
| created_at | created_at | OK | |
| updated_at | updated_at | OK | |
| _synced | N/A | LOCAL ONLY | Must exclude from upload |

### workouts table

| Local Field (Dexie) | Supabase Column | Status | Notes |
|---------------------|-----------------|--------|-------|
| id | id | OK | |
| user_id | user_id | OK | |
| name | name | OK | |
| description | description | OK | |
| created_at | created_at | OK | |
| updated_at | updated_at | OK | |
| _synced | N/A | LOCAL ONLY | Must exclude from upload |

### workout_exercises table

| Local Field (Dexie) | Supabase Column | Status | Notes |
|---------------------|-----------------|--------|-------|
| id | id | OK | |
| workout_id | workout_id | OK | |
| exercise_id | exercise_id | OK | |
| order_index | order_index | OK | |
| sets | sets | OK | |
| reps | reps | OK | |
| custom_reps | N/A | LOCAL ONLY | Must exclude from upload |
| rest_seconds | rest_seconds | OK | |
| created_at | created_at | OK | |
| _synced | N/A | LOCAL ONLY | Must exclude from upload |

### workout_logs table

| Local Field (Dexie) | Supabase Column | Status | Notes |
|---------------------|-----------------|--------|-------|
| id | id | OK | |
| user_id | user_id | OK | |
| workout_id | workout_id | OK | |
| started_at | started_at | OK | |
| completed_at | completed_at | OK | |
| notes | notes | OK | |
| created_at | created_at | OK | |
| updated_at | updated_at | OK | |
| _synced | N/A | LOCAL ONLY | Must exclude from upload |

### workout_log_sets table

| Local Field (Dexie) | Supabase Column | Status | Notes |
|---------------------|-----------------|--------|-------|
| id | id | OK | |
| workout_log_id | workout_log_id | OK | |
| exercise_id | exercise_id | OK | |
| set_number | set_number | OK | |
| reps | reps | OK | |
| weight | weight | OK | |
| completed | completed | OK | |
| created_at | created_at | OK | |
| _synced | N/A | LOCAL ONLY | Must exclude from upload |

### planned_workouts table

| Local Field (Dexie) | Supabase Column | Status | Notes |
|---------------------|-----------------|--------|-------|
| id | id | OK | |
| user_id | user_id | OK | |
| workout_id | workout_id | OK | |
| scheduled_date | scheduled_date | OK | |
| completed | completed | OK | |
| created_at | created_at | OK | |
| updated_at | updated_at | OK | |
| _synced | N/A | LOCAL ONLY | Must exclude from upload |

### cardio_logs table

| Local Field (Dexie) | Supabase Column | Status | Notes |
|---------------------|-----------------|--------|-------|
| id | id | MISSING | Table may not exist in Supabase |
| user_id | user_id | MISSING | |
| activity_type | activity_type | MISSING | |
| started_at | started_at | MISSING | |
| completed_at | completed_at | MISSING | |
| duration_seconds | duration_seconds | MISSING | |
| distance_miles | distance_miles | MISSING | |
| calories | calories | MISSING | |
| avg_heart_rate | avg_heart_rate | MISSING | |
| notes | notes | MISSING | |
| created_at | created_at | MISSING | |
| updated_at | updated_at | MISSING | |
| _synced | N/A | LOCAL ONLY | Must exclude from upload |

---

## Sync Test Checklist

Run these tests after any sync-related changes:

### Pre-Test Setup
- [ ] Clear browser console
- [ ] Open Settings tab to view Cloud Sync section
- [ ] Note current "Last Sync" time

### Basic Sync Tests

- [ ] **Manual Sync Button**: Click "Sync Now" in Settings
  - Expected: Button shows "Syncing...", then reverts to "Sync Now"
  - Expected: No error message appears
  - Expected: "Last Sync" time updates to current time
  - Expected: Header sync indicator shows "Synced Just now"

- [ ] **Auto Sync on Login**: Sign out and sign back in
  - Expected: Sync runs automatically within a few seconds
  - Expected: Header shows "Syncing..." briefly, then "Synced Just now"

- [ ] **Periodic Auto Sync**: Wait 60+ seconds on any tab
  - Expected: Sync runs automatically
  - Expected: Header sync indicator updates

### Data Sync Tests

- [ ] **New Exercise Syncs**: Create a custom exercise
  - Expected: Exercise appears in Supabase `exercises` table
  - Expected: No sync errors

- [ ] **New Workout Syncs**: Create a new workout template
  - Expected: Workout appears in Supabase `workouts` table
  - Expected: Workout exercises appear in `workout_exercises` table
  - Expected: No sync errors

- [ ] **Workout Log Syncs**: Complete a workout
  - Expected: Log appears in Supabase `workout_logs` table
  - Expected: Sets appear in `workout_log_sets` table
  - Expected: Sync runs immediately after "Finish Workout"
  - Expected: No sync errors

- [ ] **Planned Workout Syncs**: Schedule a workout
  - Expected: Entry appears in Supabase `planned_workouts` table
  - Expected: No sync errors

### Error Handling Tests

- [ ] **Offline Mode**: Disconnect from internet
  - Expected: Header shows "Offline" indicator
  - Expected: "Sync Now" button is disabled
  - Expected: Local data still saves correctly

- [ ] **Reconnect After Offline**: Reconnect to internet
  - Expected: Header shows "Synced" status
  - Expected: Pending data syncs automatically

### Known Issues to Watch For

- [ ] **No "schema cache" errors**: Check console for column mismatch errors
- [ ] **No duplicate exercises**: Same exercise shouldn't appear multiple times
- [ ] **Bodyweight exercises preserved**: `is_bodyweight` flag shouldn't be lost after sync
- [ ] **Custom reps preserved**: Local `custom_reps` array shouldn't cause sync errors

---

## Console Log Patterns

When sync is working correctly, you should see logs like:
```
[Sync] Starting sync for user: <user-id>
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

When there are errors, you'll see:
```
[Sync] Exercise upload error: <error message> for: <exercise name>
[Sync] Completed with errors: [<error list>]
```

---

## Fixes Applied

### 2026-02-07: Exercise fields sync error
- **Issue**: Sync error "Could not find the 'common_mistakes' column" (with space instead of underscore)
- **Root Cause**: Unknown - need to verify actual Supabase schema vs what app is sending
- **Fix**: TBD - need to strip local-only fields before upload

### 2026-02-07: custom_reps sync error
- **Issue**: Sync error for `custom_reps` column not in Supabase
- **Root Cause**: `custom_reps` field exists locally but not in Supabase
- **Fix**: Excluded `custom_reps` from upload in `syncWorkoutExercises()`

---

## SQL to Verify Supabase Schema

Run in Supabase SQL Editor to check column names:

```sql
-- Check exercises table columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'exercises'
ORDER BY ordinal_position;

-- Check if cardio_logs table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'cardio_logs'
);
```
