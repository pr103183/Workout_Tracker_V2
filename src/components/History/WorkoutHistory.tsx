import React, { useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, WorkoutLog, WorkoutLogSet } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';

export const WorkoutHistory: React.FC = () => {
  const { user } = useAuth();
  const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null);
  const [editingSet, setEditingSet] = useState<WorkoutLogSet | null>(null);
  const [editWeight, setEditWeight] = useState<number>(0);
  const [editReps, setEditReps] = useState<number>(0);

  const logs = useLiveQuery(
    async () => {
      const allLogs = await db.workout_logs
        .where('user_id')
        .equals(user?.id || '')
        .toArray();

      // Filter to only completed workouts and sort by completion date (most recent first)
      return allLogs
        .filter(log => log.completed_at !== null)
        .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());
    },
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

  // Use useLiveQuery for logSets to get reactive updates
  const logSets = useLiveQuery(
    () => {
      if (!selectedLog) return [];
      return db.workout_log_sets
        .where('workout_log_id')
        .equals(selectedLog.id)
        .toArray();
    },
    [selectedLog?.id]
  );

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

    // Sort sets within each exercise group by set_number
    Object.keys(grouped).forEach(exerciseId => {
      grouped[exerciseId].sort((a, b) => a.set_number - b.set_number);
    });

    return grouped;
  };

  const handleDeleteWorkout = useCallback(async (log: WorkoutLog) => {
    const workoutName = getWorkoutName(log.workout_id);
    if (confirm(`Are you sure you want to delete this workout "${workoutName}" from ${new Date(log.started_at).toLocaleDateString()}?`)) {
      // Delete all sets for this workout log
      await db.workout_log_sets.where('workout_log_id').equals(log.id).delete();
      // Delete the workout log
      await db.workout_logs.delete(log.id);
      // Clear selection if this was the selected log
      if (selectedLog?.id === log.id) {
        setSelectedLog(null);
      }
    }
  }, [selectedLog, workouts]);

  const handleEditSet = useCallback((set: WorkoutLogSet) => {
    setEditingSet(set);
    setEditWeight(set.weight);
    setEditReps(set.reps);
  }, []);

  const handleSaveSet = useCallback(async () => {
    if (!editingSet) return;

    await db.workout_log_sets.update(editingSet.id, {
      weight: editWeight,
      reps: editReps,
      updated_at: new Date().toISOString(),
      _synced: false,
    });

    // useLiveQuery will automatically refresh the sets
    setEditingSet(null);
  }, [editingSet, editWeight, editReps]);

  const handleCancelEdit = useCallback(() => {
    setEditingSet(null);
    setEditWeight(0);
    setEditReps(0);
  }, []);

  const handleDeleteSet = useCallback(async (set: WorkoutLogSet) => {
    if (confirm(`Delete this set (${set.reps} reps × ${set.weight} lbs)?`)) {
      await db.workout_log_sets.delete(set.id);
      // useLiveQuery will automatically refresh the sets
    }
  }, []);

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
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{getWorkoutName(selectedLog.workout_id)}</h3>
                    <div className="text-sm text-gray-400">
                      {new Date(selectedLog.started_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteWorkout(selectedLog)}
                    className="btn bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2"
                  >
                    Delete Workout
                  </button>
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
                      {getTotalVolume(logSets || []).toLocaleString()} lbs
                    </div>
                  </div>

                  <div>
                    <div className="label">Exercises</div>
                    <div className="space-y-3 mt-2">
                      {Object.entries(groupSetsByExercise(logSets || [])).map(([exerciseId, sets]) => (
                        <div key={exerciseId} className="bg-gray-700 p-3 rounded-lg">
                          <h4 className="font-medium mb-2">{getExerciseName(exerciseId)}</h4>
                          <div className="space-y-2">
                            {sets.map((set) => (
                              <div key={set.id}>
                                {editingSet?.id === set.id ? (
                                  <div className="bg-gray-800 p-2 rounded space-y-2">
                                    <div className="text-sm font-medium text-gray-300">
                                      Editing Set {set.set_number}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                      <div className="flex-1">
                                        <input
                                          type="number"
                                          value={editReps}
                                          onChange={(e) => setEditReps(Number(e.target.value))}
                                          className="input w-full text-sm"
                                          placeholder="Reps"
                                          min="0"
                                        />
                                      </div>
                                      <span className="text-gray-400">×</span>
                                      <div className="flex-1">
                                        <input
                                          type="number"
                                          value={editWeight}
                                          onChange={(e) => setEditWeight(Number(e.target.value))}
                                          className="input w-full text-sm"
                                          placeholder="Weight"
                                          min="0"
                                          step="5"
                                        />
                                      </div>
                                      <span className="text-gray-400 text-sm">lbs</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={handleSaveSet}
                                        className="btn btn-primary text-xs px-3 py-1 flex-1"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        className="btn btn-secondary text-xs px-3 py-1 flex-1"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex justify-between items-center group">
                                    <div className="text-sm text-gray-300 flex-1">
                                      <span>Set {set.set_number}</span>
                                      <span className="ml-4">
                                        {set.reps} reps × {set.weight} lbs
                                        {set.completed && <span className="text-green-500 ml-2">✓</span>}
                                      </span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleEditSet(set)}
                                        className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSet(set)}
                                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                )}
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
