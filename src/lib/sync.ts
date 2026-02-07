import { supabase } from './supabase';
import { db } from './db';

export class SyncService {
  private syncInProgress = false;
  private lastSyncTime: number = 0;
  private syncErrors: string[] = [];

  async syncAll(userId: string): Promise<void> {
    if (this.syncInProgress) {
      console.log('[Sync] Already in progress, skipping');
      return;
    }

    // Prevent sync if offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('[Sync] Offline, skipping sync');
      return;
    }

    this.syncInProgress = true;
    this.syncErrors = [];
    console.log('[Sync] Starting sync for user:', userId);

    try {
      // Check if we have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[Sync] No active session, cannot sync');
        return;
      }
      console.log('[Sync] Session valid, user:', session.user.email);

      await this.syncExercises(userId);
      await this.syncWorkouts(userId);
      await this.syncWorkoutExercises(userId);
      await this.syncWorkoutLogs(userId);
      await this.syncWorkoutLogSets(userId);
      await this.syncPlannedWorkouts(userId);
      await this.syncCardioLogs(userId);

      this.lastSyncTime = Date.now();

      if (this.syncErrors.length > 0) {
        console.warn('[Sync] Completed with errors:', this.syncErrors);
      } else {
        console.log('[Sync] Completed successfully at', new Date().toISOString());
      }
    } catch (error) {
      console.error('[Sync] Fatal error:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Force sync immediately (call after completing a workout)
  async forceSyncNow(userId: string): Promise<boolean> {
    console.log('[Sync] Force sync requested');
    this.syncInProgress = false; // Reset to allow immediate sync
    try {
      await this.syncAll(userId);
      return this.syncErrors.length === 0;
    } catch (error) {
      console.error('[Sync] Force sync failed:', error);
      return false;
    }
  }

  // Get sync status for debugging
  getSyncStatus() {
    return {
      inProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      lastSyncDate: this.lastSyncTime ? new Date(this.lastSyncTime).toISOString() : null,
      errors: this.syncErrors,
    };
  }

  private async syncExercises(userId: string): Promise<void> {
    const unsyncedLocal = await db.exercises
      .filter(e => e._synced === false)
      .toArray();

    console.log('[Sync] Exercises to upload:', unsyncedLocal.length);

    for (const exercise of unsyncedLocal) {
      // Explicitly build upload object with ONLY Supabase-compatible columns
      // This prevents any extra/misnamed fields from causing errors
      const dataToUpload = {
        id: exercise.id,
        user_id: exercise.user_id,
        name: exercise.name,
        description: exercise.description || '',
        muscle_group: exercise.muscle_group,
        equipment: exercise.equipment || '',
        instructions: exercise.instructions || '',
        is_custom: exercise.is_custom,
        is_bodyweight: exercise.is_bodyweight ?? false,
        form_cues: exercise.form_cues || '',
        common_mistakes: exercise.common_mistakes || '',
        muscle_activation: exercise.muscle_activation || '',
        safety_tips: exercise.safety_tips || '',
        created_at: exercise.created_at,
        updated_at: exercise.updated_at,
      };

      const { error } = await supabase
        .from('exercises')
        .upsert(dataToUpload as any);

      if (error) {
        console.error('[Sync] Exercise upload error:', error.message, 'for:', exercise.name);
        this.syncErrors.push(`Exercise ${exercise.name}: ${error.message}`);
      } else {
        await db.exercises.update(exercise.id, { _synced: true });
        console.log('[Sync] Uploaded exercise:', exercise.name);
      }
    }

    const { data: remoteExercises, error: fetchError } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('[Sync] Exercise fetch error:', fetchError.message);
      this.syncErrors.push(`Fetch exercises: ${fetchError.message}`);
      return;
    }

    console.log('[Sync] Remote exercises found:', remoteExercises?.length ?? 0);

    if (remoteExercises) {
      for (const exercise of remoteExercises as any[]) {
        const existingLocal = await db.exercises.get(exercise.id);
        const mergedExercise = {
          ...exercise,
          is_bodyweight: existingLocal?.is_bodyweight ?? exercise.is_bodyweight ?? false,
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

    console.log('[Sync] Workouts to upload:', unsyncedLocal.length);

    for (const workout of unsyncedLocal) {
      // Explicitly build upload object with ONLY Supabase-compatible columns
      const dataToUpload = {
        id: workout.id,
        user_id: workout.user_id,
        name: workout.name,
        description: workout.description || '',
        created_at: workout.created_at,
        updated_at: workout.updated_at,
      };

      const { error } = await supabase
        .from('workouts')
        .upsert(dataToUpload as any);

      if (error) {
        console.error('[Sync] Workout upload error:', error.message, 'for:', workout.name);
        this.syncErrors.push(`Workout ${workout.name}: ${error.message}`);
      } else {
        await db.workouts.update(workout.id, { _synced: true });
        console.log('[Sync] Uploaded workout:', workout.name);
      }
    }

    const { data: remoteWorkouts, error: fetchError } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('[Sync] Workout fetch error:', fetchError.message);
      this.syncErrors.push(`Fetch workouts: ${fetchError.message}`);
      return;
    }

    console.log('[Sync] Remote workouts found:', remoteWorkouts?.length ?? 0);

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

    console.log('[Sync] Workout exercises to upload:', unsyncedLocal.length);

    for (const workoutExercise of unsyncedLocal) {
      // Explicitly build upload object with ONLY Supabase-compatible columns
      // custom_reps is local-only (not in Supabase schema)
      const dataToUpload = {
        id: workoutExercise.id,
        workout_id: workoutExercise.workout_id,
        exercise_id: workoutExercise.exercise_id,
        order_index: workoutExercise.order_index,
        sets: workoutExercise.sets,
        reps: workoutExercise.reps,
        rest_seconds: workoutExercise.rest_seconds,
        created_at: workoutExercise.created_at,
      };

      const { error } = await supabase
        .from('workout_exercises')
        .upsert(dataToUpload as any);

      if (error) {
        console.error('[Sync] Workout exercise upload error:', error.message);
        this.syncErrors.push(`Workout exercise: ${error.message}`);
      } else {
        await db.workout_exercises.update(workoutExercise.id, { _synced: true });
      }
    }

    const userWorkouts = await db.workouts
      .where('user_id')
      .equals(userId)
      .toArray();

    const workoutIds = userWorkouts.map(w => w.id);

    if (workoutIds.length > 0) {
      const { data: remoteData, error: fetchError } = await supabase
        .from('workout_exercises')
        .select('*')
        .in('workout_id', workoutIds);

      if (fetchError) {
        console.error('[Sync] Workout exercises fetch error:', fetchError.message);
        this.syncErrors.push(`Fetch workout exercises: ${fetchError.message}`);
        return;
      }

      console.log('[Sync] Remote workout exercises found:', remoteData?.length ?? 0);

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

    console.log('[Sync] Workout logs to upload:', unsyncedLocal.length);

    for (const log of unsyncedLocal) {
      // Explicitly build upload object with ONLY Supabase-compatible columns
      const dataToUpload = {
        id: log.id,
        user_id: log.user_id,
        workout_id: log.workout_id,
        started_at: log.started_at,
        completed_at: log.completed_at,
        notes: log.notes || '',
        created_at: log.created_at,
        updated_at: log.updated_at,
      };

      const { error } = await supabase
        .from('workout_logs')
        .upsert(dataToUpload as any);

      if (error) {
        console.error('[Sync] Workout log upload error:', error.message, 'for log:', log.id);
        this.syncErrors.push(`Workout log: ${error.message}`);
      } else {
        await db.workout_logs.update(log.id, { _synced: true });
        console.log('[Sync] Uploaded workout log:', log.id);
      }
    }

    const { data: remoteLogs, error: fetchError } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(100);

    if (fetchError) {
      console.error('[Sync] Workout logs fetch error:', fetchError.message);
      this.syncErrors.push(`Fetch workout logs: ${fetchError.message}`);
      return;
    }

    console.log('[Sync] Remote workout logs found:', remoteLogs?.length ?? 0);

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

    console.log('[Sync] Workout log sets to upload:', unsyncedLocal.length);

    for (const set of unsyncedLocal) {
      // Explicitly build upload object with ONLY Supabase-compatible columns
      const dataToUpload = {
        id: set.id,
        workout_log_id: set.workout_log_id,
        exercise_id: set.exercise_id,
        set_number: set.set_number,
        reps: set.reps,
        weight: set.weight,
        completed: set.completed,
        created_at: set.created_at,
      };

      const { error } = await supabase
        .from('workout_log_sets')
        .upsert(dataToUpload as any);

      if (error) {
        console.error('[Sync] Set upload error:', error.message);
        this.syncErrors.push(`Workout log set: ${error.message}`);
      } else {
        await db.workout_log_sets.update(set.id, { _synced: true });
      }
    }

    const userLogs = await db.workout_logs
      .where('user_id')
      .equals(userId)
      .toArray();

    const logIds = userLogs.map(l => l.id);

    if (logIds.length > 0) {
      const { data: remoteSets, error: fetchError } = await supabase
        .from('workout_log_sets')
        .select('*')
        .in('workout_log_id', logIds);

      if (fetchError) {
        console.error('[Sync] Workout log sets fetch error:', fetchError.message);
        this.syncErrors.push(`Fetch workout log sets: ${fetchError.message}`);
        return;
      }

      console.log('[Sync] Remote workout log sets found:', remoteSets?.length ?? 0);

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

    console.log('[Sync] Planned workouts to upload:', unsyncedLocal.length);

    for (const planned of unsyncedLocal) {
      // Explicitly build upload object with ONLY Supabase-compatible columns
      const dataToUpload = {
        id: planned.id,
        user_id: planned.user_id,
        workout_id: planned.workout_id,
        scheduled_date: planned.scheduled_date,
        completed: planned.completed,
        created_at: planned.created_at,
        updated_at: planned.updated_at,
      };

      const { error } = await supabase
        .from('planned_workouts')
        .upsert(dataToUpload as any);

      if (error) {
        console.error('[Sync] Planned workout upload error:', error.message);
        this.syncErrors.push(`Planned workout: ${error.message}`);
      } else {
        await db.planned_workouts.update(planned.id, { _synced: true });
      }
    }

    const { data: remotePlanned, error: fetchError } = await supabase
      .from('planned_workouts')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('[Sync] Planned workouts fetch error:', fetchError.message);
      this.syncErrors.push(`Fetch planned workouts: ${fetchError.message}`);
      return;
    }

    console.log('[Sync] Remote planned workouts found:', remotePlanned?.length ?? 0);

    if (remotePlanned) {
      for (const planned of remotePlanned) {
        await db.planned_workouts.put({ ...planned as any, _synced: true });
      }
    }
  }

  private async syncCardioLogs(_userId: string): Promise<void> {
    const unsyncedLocal = await db.cardio_logs
      .filter(c => c._synced === false)
      .toArray();

    console.log('[Sync] Cardio logs to upload:', unsyncedLocal.length);

    for (const cardio of unsyncedLocal) {
      // Explicitly build upload object with ONLY Supabase-compatible columns
      const dataToUpload = {
        id: cardio.id,
        user_id: cardio.user_id,
        activity_type: cardio.activity_type,
        started_at: cardio.started_at,
        completed_at: cardio.completed_at,
        duration_seconds: cardio.duration_seconds,
        distance_miles: cardio.distance_miles,
        calories: cardio.calories,
        avg_heart_rate: cardio.avg_heart_rate,
        notes: cardio.notes || '',
        created_at: cardio.created_at,
        updated_at: cardio.updated_at,
      };

      const { error } = await supabase
        .from('cardio_logs')
        .upsert(dataToUpload as any);

      if (error) {
        // Cardio logs table might not exist in Supabase yet - that's ok
        if (!error.message.includes('does not exist') && !error.message.includes('relation') ) {
          console.error('[Sync] Cardio log upload error:', error.message);
          this.syncErrors.push(`Cardio log: ${error.message}`);
        }
      } else {
        await db.cardio_logs.update(cardio.id, { _synced: true });
      }
    }
  }
}

export const syncService = new SyncService();
