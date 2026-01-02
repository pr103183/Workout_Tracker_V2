import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';

export const PersonalRecords: React.FC = () => {
  const { user } = useAuth();

  const workoutLogs = useLiveQuery(
    () => db.workout_logs.where('user_id').equals(user?.id || '').toArray(),
    [user?.id]
  );

  const exercises = useLiveQuery(
    () => db.exercises.where('user_id').equals(user?.id || '').toArray(),
    [user?.id]
  );

  const workoutLogSets = useLiveQuery(async () => {
    if (!workoutLogs) return [];
    const allSets = [];
    for (const log of workoutLogs) {
      if (!log.completed_at) continue;
      const sets = await db.workout_log_sets.where('workout_log_id').equals(log.id).toArray();
      for (const set of sets) {
        allSets.push({
          ...set,
          completed_at: log.completed_at,
        });
      }
    }
    return allSets;
  }, [workoutLogs]);

  // Calculate PRs for each exercise
  const personalRecords = useMemo(() => {
    if (!workoutLogSets || !exercises) return [];

    const prsByExercise: Record<string, {
      exerciseId: string;
      exerciseName: string;
      maxWeight: number;
      maxWeightDate: string;
      maxReps: number;
      maxRepsDate: string;
      maxVolume: number;
      maxVolumeDate: string;
      estimated1RM: number;
      estimated1RMDate: string;
    }> = {};

    workoutLogSets.forEach(set => {
      if (!set.completed_at) return;

      const exercise = exercises.find(ex => ex.id === set.exercise_id);
      if (!exercise) return;

      const weight = set.weight || 0;
      const reps = set.reps || 0;
      const volume = weight * reps;
      // Epley formula for estimated 1RM
      const estimated1RM = weight > 0 && reps > 0 ? weight * (1 + reps / 30) : 0;

      if (!prsByExercise[set.exercise_id]) {
        prsByExercise[set.exercise_id] = {
          exerciseId: set.exercise_id,
          exerciseName: exercise.name,
          maxWeight: weight,
          maxWeightDate: set.completed_at,
          maxReps: reps,
          maxRepsDate: set.completed_at,
          maxVolume: volume,
          maxVolumeDate: set.completed_at,
          estimated1RM: estimated1RM,
          estimated1RMDate: set.completed_at,
        };
      } else {
        const pr = prsByExercise[set.exercise_id];

        if (weight > pr.maxWeight) {
          pr.maxWeight = weight;
          pr.maxWeightDate = set.completed_at;
        }

        if (reps > pr.maxReps) {
          pr.maxReps = reps;
          pr.maxRepsDate = set.completed_at;
        }

        if (volume > pr.maxVolume) {
          pr.maxVolume = volume;
          pr.maxVolumeDate = set.completed_at;
        }

        if (estimated1RM > pr.estimated1RM) {
          pr.estimated1RM = estimated1RM;
          pr.estimated1RMDate = set.completed_at;
        }
      }
    });

    return Object.values(prsByExercise).sort((a, b) =>
      a.exerciseName.localeCompare(b.exerciseName)
    );
  }, [workoutLogSets, exercises]);

  // Recent PRs (last 30 days)
  const recentPRs = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return personalRecords.filter(pr => {
      const maxWeightRecent = new Date(pr.maxWeightDate) >= thirtyDaysAgo;
      const maxRepsRecent = new Date(pr.maxRepsDate) >= thirtyDaysAgo;
      const maxVolumeRecent = new Date(pr.maxVolumeDate) >= thirtyDaysAgo;
      const max1RMRecent = new Date(pr.estimated1RMDate) >= thirtyDaysAgo;

      return maxWeightRecent || maxRepsRecent || maxVolumeRecent || max1RMRecent;
    });
  }, [personalRecords]);

  if (!workoutLogSets || !exercises) {
    return <div className="text-center py-8">Loading personal records...</div>;
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6">Personal Records</h2>

      {/* Recent PRs Section */}
      {recentPRs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Recent PRs (Last 30 Days)</h3>
          <div className="grid gap-4">
            {recentPRs.map(pr => (
              <div key={pr.exerciseId} className="card">
                <h4 className="font-semibold text-lg mb-3" style={{ color: 'var(--text-primary)' }}>
                  {pr.exerciseName}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Max Weight</div>
                    <div className="text-xl font-bold text-primary-500">{pr.maxWeight} lbs</div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatDate(pr.maxWeightDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Max Reps</div>
                    <div className="text-xl font-bold text-primary-500">{pr.maxReps}</div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatDate(pr.maxRepsDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Max Volume</div>
                    <div className="text-xl font-bold text-primary-500">
                      {pr.maxVolume.toLocaleString()} lbs
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatDate(pr.maxVolumeDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Est. 1RM</div>
                    <div className="text-xl font-bold text-primary-500">
                      {pr.estimated1RM.toFixed(1)} lbs
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatDate(pr.estimated1RMDate)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All-Time PRs Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4">All-Time Personal Records</h3>
        {personalRecords.length > 0 ? (
          <div className="grid gap-4">
            {personalRecords.map(pr => (
              <div key={pr.exerciseId} className="card">
                <h4 className="font-semibold text-lg mb-3" style={{ color: 'var(--text-primary)' }}>
                  {pr.exerciseName}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Max Weight</div>
                    <div className="text-xl font-bold text-primary-500">{pr.maxWeight} lbs</div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatDate(pr.maxWeightDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Max Reps</div>
                    <div className="text-xl font-bold text-primary-500">{pr.maxReps}</div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatDate(pr.maxRepsDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Max Volume</div>
                    <div className="text-xl font-bold text-primary-500">
                      {pr.maxVolume.toLocaleString()} lbs
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatDate(pr.maxVolumeDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Est. 1RM</div>
                    <div className="text-xl font-bold text-primary-500">
                      {pr.estimated1RM.toFixed(1)} lbs
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatDate(pr.estimated1RMDate)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-8">
            <p style={{ color: 'var(--text-tertiary)' }}>
              No personal records yet. Complete some workouts to start tracking your progress!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
