import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Workout, WorkoutLog, WorkoutLogSet, WorkoutExercise, Exercise } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';

interface PreviousSetData {
  exercise_id: string;
  sets: Array<{ set_number: number; reps: number; weight: number }>;
  workout_date: string;
}

export const LogWorkout: React.FC = () => {
  const { user } = useAuth();
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [currentLog, setCurrentLog] = useState<WorkoutLog | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [logSets, setLogSets] = useState<WorkoutLogSet[]>([]);
  const [notes, setNotes] = useState('');
  const [previousData, setPreviousData] = useState<Map<string, PreviousSetData>>(new Map());

  const workouts = useLiveQuery(
    () => db.workouts.where('user_id').equals(user?.id || '').toArray(),
    [user?.id]
  );

  // Check for in-progress workout on mount
  useEffect(() => {
    const resumeInProgressWorkout = async () => {
      if (!user) return;

      // Find any workout logs that are not completed
      const inProgressLogs = await db.workout_logs
        .where('user_id')
        .equals(user.id)
        .filter(log => log.completed_at === null)
        .toArray();

      if (inProgressLogs.length > 0) {
        // Resume the most recent in-progress workout
        const mostRecent = inProgressLogs.sort(
          (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        )[0];

        setCurrentLog(mostRecent);

        // Load the workout
        const workout = await db.workouts.get(mostRecent.workout_id);
        if (workout) {
          setSelectedWorkout(workout);
        }

        // Load workout exercises
        const exercises = await db.workout_exercises
          .where('workout_id')
          .equals(mostRecent.workout_id)
          .toArray();
        setWorkoutExercises(exercises);

        // Load the sets
        const sets = await db.workout_log_sets
          .where('workout_log_id')
          .equals(mostRecent.id)
          .toArray();
        setLogSets(sets);

        // Load notes
        setNotes(mostRecent.notes || '');
      }
    };

    resumeInProgressWorkout();
  }, [user]);

  useEffect(() => {
    if (selectedWorkout && !currentLog) {
      db.workout_exercises
        .where('workout_id')
        .equals(selectedWorkout.id)
        .toArray()
        .then(setWorkoutExercises);
    }
  }, [selectedWorkout, currentLog]);

  useEffect(() => {
    if (workoutExercises.length > 0) {
      const exerciseIds = workoutExercises.map(we => we.exercise_id);
      db.exercises
        .where('id')
        .anyOf(exerciseIds)
        .toArray()
        .then(setExercises);
    }
  }, [workoutExercises]);

  // Fetch previous workout data for all exercises
  useEffect(() => {
    const fetchPreviousData = async () => {
      if (!selectedWorkout || workoutExercises.length === 0) return;

      const previousDataMap = new Map<string, PreviousSetData>();

      for (const we of workoutExercises) {
        // Get the most recent completed workout log for this exercise
        const allLogs = await db.workout_logs
          .where('user_id')
          .equals(user?.id || '')
          .toArray();

        // Filter to only completed logs and sort by completion date
        const completedLogs = allLogs
          .filter(log => log.completed_at)
          .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());

        // Find the most recent log that contains this exercise
        for (const log of completedLogs) {
          const sets = await db.workout_log_sets
            .where('workout_log_id')
            .equals(log.id)
            .toArray();

          const exerciseSets = sets.filter(s => s.exercise_id === we.exercise_id);

          if (exerciseSets.length > 0) {
            previousDataMap.set(we.exercise_id, {
              exercise_id: we.exercise_id,
              sets: exerciseSets.map(s => ({
                set_number: s.set_number,
                reps: s.reps,
                weight: s.weight,
              })),
              workout_date: log.completed_at!,
            });
            break; // Found the most recent, stop searching
          }
        }
      }

      setPreviousData(previousDataMap);
    };

    fetchPreviousData();
  }, [selectedWorkout, workoutExercises, user?.id]);

  const handleStartWorkout = async () => {
    if (!selectedWorkout) return;

    const logId = crypto.randomUUID();
    const now = new Date().toISOString();

    const log: WorkoutLog = {
      id: logId,
      user_id: user!.id,
      workout_id: selectedWorkout.id,
      started_at: now,
      completed_at: null,
      notes: '',
      created_at: now,
      updated_at: now,
      _synced: false,
    };

    await db.workout_logs.add(log);
    setCurrentLog(log);

    const initialSets: WorkoutLogSet[] = [];
    for (const we of workoutExercises) {
      for (let i = 1; i <= we.sets; i++) {
        // Use custom_reps if available, otherwise use default reps
        const reps = we.custom_reps && we.custom_reps[i - 1] !== undefined
          ? we.custom_reps[i - 1]
          : we.reps;

        initialSets.push({
          id: crypto.randomUUID(),
          workout_log_id: logId,
          exercise_id: we.exercise_id,
          set_number: i,
          reps: reps,
          weight: 0,
          completed: false,
          created_at: now,
          _synced: false,
        });
      }
    }

    await db.workout_log_sets.bulkAdd(initialSets);
    setLogSets(initialSets);
  };

  const handleUpdateSet = (setId: string, field: 'reps' | 'weight', value: number) => {
    setLogSets(prev =>
      prev.map(set =>
        set.id === setId ? { ...set, [field]: value } : set
      )
    );
  };

  const handleToggleSetComplete = async (setId: string) => {
    const set = logSets.find(s => s.id === setId);
    if (!set) return;

    const updated = { ...set, completed: !set.completed };
    await db.workout_log_sets.update(setId, { completed: updated.completed });
    setLogSets(prev => prev.map(s => s.id === setId ? updated : s));
  };

  const handleSaveSet = async (setId: string) => {
    const set = logSets.find(s => s.id === setId);
    if (!set) return;

    await db.workout_log_sets.update(setId, {
      reps: set.reps,
      weight: set.weight,
      _synced: false,
    });
  };

  const handleFinishWorkout = async () => {
    if (!currentLog) return;

    const now = new Date().toISOString();
    await db.workout_logs.update(currentLog.id, {
      completed_at: now,
      notes,
      updated_at: now,
      _synced: false,
    });

    // Add celebration effect
    const finishButton = document.querySelector('.finish-workout-btn');
    if (finishButton) {
      finishButton.classList.add('celebrate');
      setTimeout(() => finishButton.classList.remove('celebrate'), 600);
    }

    alert('Workout completed! Great job!');
    setSelectedWorkout(null);
    setCurrentLog(null);
    setLogSets([]);
    setNotes('');
  };

  const handleCancelWorkout = async () => {
    if (!currentLog) return;

    if (confirm('Are you sure you want to cancel this workout? All progress will be lost.')) {
      await db.workout_log_sets.where('workout_log_id').equals(currentLog.id).delete();
      await db.workout_logs.delete(currentLog.id);
      setSelectedWorkout(null);
      setCurrentLog(null);
      setLogSets([]);
      setNotes('');
    }
  };

  const handleUsePreviousWeights = async (exerciseId: string) => {
    const prevData = previousData.get(exerciseId);
    if (!prevData) return;

    const updatedSets = logSets.map(set => {
      if (set.exercise_id === exerciseId) {
        const prevSet = prevData.sets.find(s => s.set_number === set.set_number);
        if (prevSet) {
          return { ...set, weight: prevSet.weight, reps: prevSet.reps };
        }
      }
      return set;
    });

    setLogSets(updatedSets);

    // Save all updated sets to the database
    for (const set of updatedSets) {
      if (set.exercise_id === exerciseId) {
        await db.workout_log_sets.update(set.id, {
          weight: set.weight,
          reps: set.reps,
          _synced: false,
        });
      }
    }
  };

  const handleUseProgressiveOverload = async (exerciseId: string) => {
    const prevData = previousData.get(exerciseId);
    if (!prevData) return;

    const updatedSets = logSets.map(set => {
      if (set.exercise_id === exerciseId) {
        const prevSet = prevData.sets.find(s => s.set_number === set.set_number);
        if (prevSet) {
          // Progressive overload: add 5 lbs to weight
          return { ...set, weight: prevSet.weight + 5, reps: prevSet.reps };
        }
      }
      return set;
    });

    setLogSets(updatedSets);

    // Save all updated sets to the database
    for (const set of updatedSets) {
      if (set.exercise_id === exerciseId) {
        await db.workout_log_sets.update(set.id, {
          weight: set.weight,
          reps: set.reps,
          _synced: false,
        });
      }
    }
  };

  const handleNotesChange = async (value: string) => {
    setNotes(value);

    // Save notes to database immediately
    if (currentLog) {
      await db.workout_logs.update(currentLog.id, {
        notes: value,
        updated_at: new Date().toISOString(),
        _synced: false,
      });
    }
  };

  if (!currentLog && !selectedWorkout) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-6">Log Workout</h2>

        {workouts && workouts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                onClick={() => setSelectedWorkout(workout)}
                className="card cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <h3 className="text-xl font-semibold mb-2">{workout.name}</h3>
                {workout.description && (
                  <p className="text-gray-400 text-sm">{workout.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-400">No workouts available. Create a workout first.</p>
          </div>
        )}
      </div>
    );
  }

  if (selectedWorkout && !currentLog) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{selectedWorkout.name}</h2>
            <button onClick={() => setSelectedWorkout(null)} className="btn btn-secondary">
              Back
            </button>
          </div>

          <div className="card mb-6">
            <h3 className="text-lg font-semibold mb-4">Exercises in this workout:</h3>
            <div className="space-y-2">
              {workoutExercises.map((we, index) => {
                const exercise = exercises.find(e => e.id === we.exercise_id);
                return (
                  <div key={index} className="bg-gray-700 p-3 rounded-lg">
                    <div className="font-medium">{exercise?.name || 'Unknown'}</div>
                    <div className="text-sm text-gray-400">
                      {we.sets} sets × {we.reps} reps
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={handleStartWorkout} className="btn btn-primary w-full">
            Start Workout
          </button>
        </div>
      </div>
    );
  }

  const groupedSets = workoutExercises.map(we => {
    const exercise = exercises.find(e => e.id === we.exercise_id);
    const sets = logSets.filter(s => s.exercise_id === we.exercise_id);
    return { exercise, workoutExercise: we, sets };
  });

  const workoutDuration = currentLog
    ? Math.floor((new Date().getTime() - new Date(currentLog.started_at).getTime()) / 1000 / 60)
    : 0;

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">{selectedWorkout?.name}</h2>
            {currentLog && (
              <p className="text-sm text-gray-400 mt-1">
                Started {new Date(currentLog.started_at).toLocaleTimeString()} • {workoutDuration} min
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleCancelWorkout} className="btn btn-secondary text-sm ripple">
              Cancel
            </button>
            <button onClick={handleFinishWorkout} className="btn btn-primary text-sm ripple finish-workout-btn">
              Finish
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {groupedSets.map(({ exercise, workoutExercise, sets }, index) => {
            const prevData = previousData.get(workoutExercise.exercise_id);

            return (
              <div key={index} className="card">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{exercise?.name}</h3>
                    <p className="text-sm text-gray-400">
                      {workoutExercise.sets} sets × {workoutExercise.reps} reps | Rest: {workoutExercise.rest_seconds}s
                    </p>
                  </div>
                </div>

                {prevData && (
                  <div className="mb-3 p-2 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Last time ({new Date(prevData.workout_date).toLocaleDateString()}):
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUsePreviousWeights(workoutExercise.exercise_id)}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                        >
                          Use Same
                        </button>
                        <button
                          onClick={() => handleUseProgressiveOverload(workoutExercise.exercise_id)}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                        >
                          +5 lbs
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {prevData.sets.map((prevSet, idx) => (
                        <div key={idx} className="text-xs bg-gray-700/50 px-2 py-1 rounded">
                          {prevSet.reps} × {prevSet.weight} lbs
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {sets.map((set) => {
                    const prevSet = prevData?.sets.find(s => s.set_number === set.set_number);

                    return (
                      <div
                        key={set.id}
                        className={`p-3 rounded-lg transition-all ${
                          set.completed ? 'bg-green-900/30 border border-green-700 set-complete' : 'bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleSetComplete(set.id)}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                              set.completed
                                ? 'bg-green-600 border-green-600'
                                : 'border-gray-500'
                            }`}
                          >
                            {set.completed && '✓'}
                          </button>

                          <span className="font-medium w-16">Set {set.set_number}</span>

                          <div className="flex-1 flex gap-2">
                            <div className="flex-1">
                              <input
                                type="number"
                                value={set.reps}
                                onChange={(e) => handleUpdateSet(set.id, 'reps', parseInt(e.target.value) || 0)}
                                onFocus={(e) => e.target.select()}
                                onBlur={() => handleSaveSet(set.id)}
                                className="input text-sm w-full"
                                placeholder="Reps"
                              />
                              {prevSet && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  Last: {prevSet.reps}
                                </div>
                              )}
                            </div>
                            {!exercise?.is_bodyweight && (
                              <div className="flex-1">
                                <input
                                  type="number"
                                  value={set.weight}
                                  onChange={(e) => handleUpdateSet(set.id, 'weight', parseFloat(e.target.value) || 0)}
                                  onFocus={(e) => e.target.select()}
                                  onBlur={() => handleSaveSet(set.id)}
                                  className="input text-sm w-full"
                                  placeholder="Weight"
                                  step="0.5"
                                />
                                {prevSet && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    Last: {prevSet.weight} lbs
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="card">
            <label htmlFor="notes" className="label">Workout Notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="input"
              rows={4}
              placeholder="How did the workout feel? Any observations?"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
