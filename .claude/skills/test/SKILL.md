---
name: test
description: Test the Workout Tracker app for bugs and edge cases
disable-model-invocation: true
---

# Workout Tracker Bug & Edge Case Tester

When invoked, thoroughly test the Workout Tracker app for known issues and potential edge cases. Focus on the areas that have historically been buggy.

## Test Categories

### 1. Workout Log Resume Tests
- [ ] Verify in-progress workouts resume correctly after app reload
- [ ] Verify cancelled workouts don't reappear after app reload
- [ ] Verify cancelled workouts are deleted from both local DB and Supabase
- [ ] Verify orphaned workout logs (with missing parent workout) are cleaned up
- [ ] Verify exercises state is properly loaded on resume (including is_bodyweight flag)

### 2. Bodyweight Exercise Tests
- [ ] Verify bodyweight exercises (Pull-ups, Tricep Dips, Plank) don't show weight input
- [ ] Verify non-bodyweight exercises show weight input
- [ ] Verify custom bodyweight exercises respect the is_bodyweight flag
- [ ] Verify is_bodyweight flag is preserved after sync with Supabase
- [ ] Verify newly added bodyweight exercises during a workout don't show weight input

### 3. Duplicate Exercise Tests
- [ ] Verify exercises don't appear twice in workout log view
- [ ] Verify workout_exercises table doesn't have duplicates for same exercise_id
- [ ] Verify deduplication cleanup runs on workout load
- [ ] Verify adding an already-present exercise shows proper error message

### 4. Set Management Tests
- [ ] Verify sets are ordered numerically (not lexicographically)
- [ ] Verify adding/removing sets works correctly
- [ ] Verify set completion persists (_synced: false flag is set)
- [ ] Verify weight/reps changes persist immediately

### 5. Exercise Reordering Tests
- [ ] Verify move up/down buttons work correctly
- [ ] Verify boundary checks (first item can't move up, last can't move down)
- [ ] Verify order_index is updated in database after reorder
- [ ] Verify deduplication happens before reorder calculations

### 6. Sync Tests
- [ ] Verify local changes sync to Supabase
- [ ] Verify is_bodyweight and other local-only fields are preserved during sync
- [ ] Verify deleted items don't reappear from remote
- [ ] Verify sync doesn't create duplicate workout_exercises

## How to Test

1. **Read relevant source files** to understand current implementation
2. **Identify test scenarios** based on the checklist above
3. **Check the code** for each test case to verify the fix is in place
4. **Report findings** with specific file:line references
5. **Suggest additional tests** if new edge cases are discovered

## Files to Inspect

- `src/components/WorkoutLog/LogWorkout.tsx` - Main workout logging component
- `src/lib/sync.ts` - Sync service
- `src/lib/db.ts` - Database schema
- `src/lib/defaultExercises.ts` - Default exercise data

## Output Format

Report results as:

```
## Test Results

### Passing Tests
- [x] Test name - Brief explanation

### Failing Tests
- [ ] Test name - Issue description (file:line)

### New Edge Cases Found
- Description of new potential issue
```
