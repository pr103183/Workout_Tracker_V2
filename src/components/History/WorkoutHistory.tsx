import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, WorkoutLog, WorkoutLogSet } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';

export const WorkoutHistory: React.FC = () => {
  const { user } = useAuth();
  const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null);
  const [logSets, setLogSets] = useState<WorkoutLogSet[]>([]);

  const logs = useLiveQuery(
    () =>
      db.workout_logs
        .where('user_id')
        .equals(user?.id || '')
        .reverse()
        .sortBy('started_at'),
    [user?.id]
  );

  const workouts = useLiveQuery(
    () => db.workouts.where('user_id').equals(user?.id || '').toArray(),
    [user?.id]
  );
  const exercises = useLiveQuery(
    () => db.exercises.where('user_id').equals(user?.id || '').toArray(),
    [user?.id]
  );

  useEffect(() => {
    if (selectedLog) {
      db.workout_log_sets
        .where('workout_log_id')
        .equals(selectedLog.id)
        .toArray()
        .then(setLogSets);
    }
  }, [selectedLog]);

  const getWorkoutName = (workoutId: string) => {
    return workouts?.find(w => w.id === workoutId)?.name || 'Unknown Workout';
  };

  const getExerciseName = (exerciseId: string) => {
    return exercises?.find(e => e.id === exerciseId)?.name || 'Unknown Exercise';
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'In progress';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    return `${minutes} min`;
  };

  const getTotalVolume = (sets: WorkoutLogSet[]) => {
    return sets.reduce((total, set) => total + (set.reps * set.weight), 0);
  };

  const groupSetsByExercise = (sets: WorkoutLogSet[]) => {
    const grouped: { [key: string]: WorkoutLogSet[] } = {};
    sets.forEach(set => {
      if (!grouped[set.exercise_id]) {
        grouped[set.exercise_id] = [];
      }
      grouped[set.exercise_id].push(set);
    });
    return grouped;
  };

  if (!logs) {
    return <div className="text-center py-8">Loading history...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6">Workout History</h2>

      {logs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No workout history yet. Log your first workout!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className={`card cursor-pointer transition-colors ${
                  selectedLog?.id === log.id
                    ? 'bg-gray-700 border-primary-600'
                    : 'hover:bg-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">{getWorkoutName(log.workout_id)}</h3>
                  {!log.completed_at && (
                    <span className="text-xs bg-orange-900 text-orange-300 px-2 py-1 rounded">
                      In Progress
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(log.started_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Duration: {formatDuration(log.started_at, log.completed_at)}
                </div>
              </div>
            ))}
          </div>

          <div className="sticky top-32">
            {selectedLog ? (
              <div className="card">
                <h3 className="text-xl font-bold mb-2">{getWorkoutName(selectedLog.workout_id)}</h3>
                <div className="text-sm text-gray-400 mb-4">
                  {new Date(selectedLog.started_at).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="label">Duration</div>
                    <div className="text-white">
                      {formatDuration(selectedLog.started_at, selectedLog.completed_at)}
                    </div>
                  </div>

                  <div>
                    <div className="label">Total Volume</div>
                    <div className="text-white text-2xl font-bold">
                      {getTotalVolume(logSets).toLocaleString()} lbs
                    </div>
                  </div>

                  <div>
                    <div className="label">Exercises</div>
                    <div className="space-y-3 mt-2">
                      {Object.entries(groupSetsByExercise(logSets)).map(([exerciseId, sets]) => (
                        <div key={exerciseId} className="bg-gray-700 p-3 rounded-lg">
                          <h4 className="font-medium mb-2">{getExerciseName(exerciseId)}</h4>
                          <div className="space-y-1">
                            {sets.map((set, idx) => (
                              <div key={idx} className="text-sm text-gray-300 flex justify-between">
                                <span>Set {set.set_number}</span>
                                <span>
                                  {set.reps} reps × {set.weight} lbs
                                  {set.completed && <span className="text-green-500 ml-2">✓</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Volume: {sets.reduce((total, s) => total + (s.reps * s.weight), 0)} lbs
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedLog.notes && (
                    <div>
                      <div className="label">Notes</div>
                      <div className="bg-gray-900 p-3 rounded-lg text-gray-300 whitespace-pre-line">
                        {selectedLog.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card text-center py-12">
                <p className="text-gray-400">Select a workout to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
