import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Workout, WorkoutLog, WorkoutLogSet, WorkoutExercise, Exercise } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';

export const LogWorkout: React.FC = () => {
  const { user } = useAuth();
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [currentLog, setCurrentLog] = useState<WorkoutLog | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [logSets, setLogSets] = useState<WorkoutLogSet[]>([]);
  const [notes, setNotes] = useState('');

  const workouts = useLiveQuery(
    () => db.workouts.where('user_id').equals(user?.id || '').toArray(),
    [user?.id]
  );

  useEffect(() => {
    if (selectedWorkout) {
      db.workout_exercises
        .where('workout_id')
        .equals(selectedWorkout.id)
        .toArray()
        .then(setWorkoutExercises);
    }
  }, [selectedWorkout]);

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
        initialSets.push({
          id: crypto.randomUUID(),
          workout_log_id: logId,
          exercise_id: we.exercise_id,
          set_number: i,
          reps: we.reps,
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

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{selectedWorkout?.name}</h2>
          <div className="flex gap-2">
            <button onClick={handleCancelWorkout} className="btn btn-secondary text-sm">
              Cancel
            </button>
            <button onClick={handleFinishWorkout} className="btn btn-primary text-sm">
              Finish
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {groupedSets.map(({ exercise, workoutExercise, sets }, index) => (
            <div key={index} className="card">
              <h3 className="text-lg font-semibold mb-1">{exercise?.name}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {workoutExercise.sets} sets × {workoutExercise.reps} reps | Rest: {workoutExercise.rest_seconds}s
              </p>

              <div className="space-y-2">
                {sets.map((set) => (
                  <div
                    key={set.id}
                    className={`p-3 rounded-lg ${
                      set.completed ? 'bg-green-900/30 border border-green-700' : 'bg-gray-700'
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
                            onBlur={() => handleSaveSet(set.id)}
                            className="input text-sm w-full"
                            placeholder="Reps"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="number"
                            value={set.weight}
                            onChange={(e) => handleUpdateSet(set.id, 'weight', parseFloat(e.target.value) || 0)}
                            onBlur={() => handleSaveSet(set.id)}
                            className="input text-sm w-full"
                            placeholder="Weight"
                            step="0.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="card">
            <label htmlFor="notes" className="label">Workout Notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
