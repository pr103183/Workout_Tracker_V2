import { supabase } from './supabase';
import { db } from './db';

export class SyncService {
  private syncInProgress = false;

  async syncAll(userId: string): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    this.syncInProgress = true;
    try {
      await this.syncExercises(userId);
      await this.syncWorkouts(userId);
      await this.syncWorkoutExercises(userId);
      await this.syncWorkoutLogs(userId);
      await this.syncWorkoutLogSets(userId);
      await this.syncPlannedWorkouts(userId);
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncExercises(userId: string): Promise<void> {
    const unsyncedLocal = await db.exercises
      .filter(e => e._synced === false)
      .toArray();

    for (const exercise of unsyncedLocal) {
      const { _synced, ...exerciseData } = exercise;
      const { error } = await supabase
        .from('exercises')
        .upsert(exerciseData as any);

      if (!error) {
        await db.exercises.update(exercise.id, { _synced: true });
      }
    }

    const { data: remoteExercises } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', userId);

    if (remoteExercises) {
      for (const exercise of remoteExercises as any[]) {
        // Get existing local record to preserve local-only fields (like is_bodyweight)
        const existingLocal = await db.exercises.get(exercise.id);
        const mergedExercise = {
          ...(existingLocal || {}), // Preserve existing local fields
          ...exercise,              // Apply remote data
          _synced: true,
        };
        await db.exercises.put(mergedExercise);
      }
    }
  }

  private async syncWorkouts(userId: string): Promise<void> {
    const unsyncedLocal = await db.workouts
      .filter(w => w._synced === false)
      .toArray();

    for (const workout of unsyncedLocal) {
      const { _synced, ...workoutData } = workout;
      const { error } = await supabase
        .from('workouts')
        .upsert(workoutData as any);

      if (!error) {
        await db.workouts.update(workout.id, { _synced: true });
      }
    }

    const { data: remoteWorkouts } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId);

    if (remoteWorkouts) {
      for (const workout of remoteWorkouts) {
        await db.workouts.put({ ...workout as any, _synced: true });
      }
    }
  }

  private async syncWorkoutExercises(userId: string): Promise<void> {
    const unsyncedLocal = await db.workout_exercises
      .filter(we => we._synced === false)
      .toArray();

    for (const workoutExercise of unsyncedLocal) {
      const { _synced, ...data } = workoutExercise;
      const { error } = await supabase
        .from('workout_exercises')
        .upsert(data as any);

      if (!error) {
        await db.workout_exercises.update(workoutExercise.id, { _synced: true });
      }
    }

    const userWorkouts = await db.workouts
      .where('user_id')
      .equals(userId)
      .toArray();

    const workoutIds = userWorkouts.map(w => w.id);

    if (workoutIds.length > 0) {
      const { data: remoteData } = await supabase
        .from('workout_exercises')
        .select('*')
        .in('workout_id', workoutIds);

      if (remoteData) {
        for (const item of remoteData) {
          await db.workout_exercises.put({ ...item as any, _synced: true });
        }
      }
    }
  }

  private async syncWorkoutLogs(userId: string): Promise<void> {
    const unsyncedLocal = await db.workout_logs
      .filter(l => l._synced === false)
      .toArray();

    for (const log of unsyncedLocal) {
      const { _synced, ...logData } = log;
      const { error } = await supabase
        .from('workout_logs')
        .upsert(logData as any);

      if (!error) {
        await db.workout_logs.update(log.id, { _synced: true });
      }
    }

    const { data: remoteLogs } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(100);

    if (remoteLogs) {
      for (const log of remoteLogs) {
        await db.workout_logs.put({ ...log as any, _synced: true });
      }
    }
  }

  private async syncWorkoutLogSets(userId: string): Promise<void> {
    const unsyncedLocal = await db.workout_log_sets
      .filter(s => s._synced === false)
      .toArray();

    for (const set of unsyncedLocal) {
      const { _synced, ...setData } = set;
      const { error } = await supabase
        .from('workout_log_sets')
        .upsert(setData as any);

      if (!error) {
        await db.workout_log_sets.update(set.id, { _synced: true });
      }
    }

    const userLogs = await db.workout_logs
      .where('user_id')
      .equals(userId)
      .toArray();

    const logIds = userLogs.map(l => l.id);

    if (logIds.length > 0) {
      const { data: remoteSets } = await supabase
        .from('workout_log_sets')
        .select('*')
        .in('workout_log_id', logIds);

      if (remoteSets) {
        for (const set of remoteSets) {
          await db.workout_log_sets.put({ ...set as any, _synced: true });
        }
      }
    }
  }

  private async syncPlannedWorkouts(userId: string): Promise<void> {
    const unsyncedLocal = await db.planned_workouts
      .filter(p => p._synced === false)
      .toArray();

    for (const planned of unsyncedLocal) {
      const { _synced, ...plannedData } = planned;
      const { error } = await supabase
        .from('planned_workouts')
        .upsert(plannedData as any);

      if (!error) {
        await db.planned_workouts.update(planned.id, { _synced: true });
      }
    }

    const { data: remotePlanned } = await supabase
      .from('planned_workouts')
      .select('*')
      .eq('user_id', userId);

    if (remotePlanned) {
      for (const planned of remotePlanned) {
        await db.planned_workouts.put({ ...planned as any, _synced: true });
      }
    }
  }
}

export const syncService = new SyncService();
