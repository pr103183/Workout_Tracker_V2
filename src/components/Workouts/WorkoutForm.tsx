import React, { useState, useEffect } from 'react';
import { db, Workout, Exercise, WorkoutExercise } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';

interface WorkoutFormProps {
  workout?: Workout;
  onSave: () => void;
  onCancel: () => void;
}

export const WorkoutForm: React.FC<WorkoutFormProps> = ({ workout, onSave, onCancel }) => {
  const { user } = useAuth();
  const [name, setName] = useState(workout?.name || '');
  const [description, setDescription] = useState(workout?.description || '');
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);

  const exercises = useLiveQuery(
    () => db.exercises.where('user_id').equals(user?.id || '').toArray(),
    [user?.id]
  );

  useEffect(() => {
    if (workout) {
      db.workout_exercises
        .where('workout_id')
        .equals(workout.id)
        .toArray()
        .then(setSelectedExercises);
    }
  }, [workout]);

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: WorkoutExercise = {
      id: crypto.randomUUID(),
      workout_id: workout?.id || '',
      exercise_id: exercise.id,
      order_index: selectedExercises.length,
      sets: 3,
      reps: 10,
      rest_seconds: 60,
      created_at: new Date().toISOString(),
      _synced: false,
    };
    setSelectedExercises([...selectedExercises, newExercise]);
    setShowExercisePicker(false);
  };

  const handleRemoveExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const handleUpdateExercise = (index: number, field: keyof WorkoutExercise, value: number) => {
    const updated = [...selectedExercises];
    updated[index] = { ...updated[index], [field]: value };

    // If sets changed, update custom_reps array size
    if (field === 'sets') {
      const currentCustomReps = updated[index].custom_reps || [];
      const newCustomReps = Array.from({ length: value }, (_, i) =>
        currentCustomReps[i] || updated[index].reps
      );
      updated[index] = { ...updated[index], custom_reps: newCustomReps };
    }

    setSelectedExercises(updated);
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedExercises.length) return;

    const updated = [...selectedExercises];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    // Update order_index for both exercises
    updated.forEach((ex, i) => {
      ex.order_index = i;
    });

    setSelectedExercises(updated);
  };

  const handleUpdateCustomReps = (exerciseIndex: number, setIndex: number, reps: number) => {
    const updated = [...selectedExercises];
    const customReps = updated[exerciseIndex].custom_reps || Array(updated[exerciseIndex].sets).fill(updated[exerciseIndex].reps);
    customReps[setIndex] = reps;
    updated[exerciseIndex] = { ...updated[exerciseIndex], custom_reps: customReps };
    setSelectedExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const workoutId = workout?.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const workoutData: Workout = {
      id: workoutId,
      user_id: user!.id,
      name,
      description,
      created_at: workout?.created_at || now,
      updated_at: now,
      _synced: false,
    };

    await db.workouts.put(workoutData);

    await db.workout_exercises.where('workout_id').equals(workoutId).delete();

    for (const exercise of selectedExercises) {
      await db.workout_exercises.put({
        ...exercise,
        workout_id: workoutId,
      });
    }

    onSave();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {workout ? 'Edit Workout' : 'Create Workout'}
          </h2>
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="label">Workout Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  required
                  placeholder="e.g., Upper Body Day"
                />
              </div>

              <div>
                <label htmlFor="description" className="label">Description (Optional)</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Add notes about this workout..."
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Exercises</h3>
              <button
                type="button"
                onClick={() => setShowExercisePicker(true)}
                className="btn btn-primary text-sm"
              >
                + Add Exercise
              </button>
            </div>

            {selectedExercises.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No exercises added yet</p>
            ) : (
              <div className="space-y-3">
                {selectedExercises.map((workoutExercise, index) => {
                  const exercise = exercises?.find(e => e.id === workoutExercise.exercise_id);
                  return (
                    <div key={index} className="bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveExercise(index, 'up')}
                              disabled={index === 0}
                              className={`text-xs ${index === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveExercise(index, 'down')}
                              disabled={index === selectedExercises.length - 1}
                              className={`text-xs ${index === selectedExercises.length - 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
                            >
                              ▼
                            </button>
                          </div>
                          <h4 className="font-medium">{exercise?.name || 'Unknown'}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExercise(index)}
                          className="text-red-500 hover:text-red-400"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="label text-xs">Sets</label>
                          <input
                            type="number"
                            value={workoutExercise.sets}
                            onChange={(e) => handleUpdateExercise(index, 'sets', parseInt(e.target.value))}
                            className="input text-sm"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="label text-xs">Reps</label>
                          <input
                            type="number"
                            value={workoutExercise.reps}
                            onChange={(e) => handleUpdateExercise(index, 'reps', parseInt(e.target.value))}
                            className="input text-sm"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="label text-xs">Rest (sec)</label>
                          <input
                            type="number"
                            value={workoutExercise.rest_seconds}
                            onChange={(e) => handleUpdateExercise(index, 'rest_seconds', parseInt(e.target.value))}
                            className="input text-sm"
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => setExpandedExercise(expandedExercise === index ? null : index)}
                          className="text-sm text-primary-400 hover:text-primary-300"
                        >
                          {expandedExercise === index ? '− Collapse Custom Reps' : '+ Customize Reps Per Set'}
                        </button>

                        {expandedExercise === index && (
                          <div className="mt-3 space-y-2 bg-gray-800 p-3 rounded-lg">
                            <p className="text-xs text-gray-400 mb-2">Set custom reps for each set:</p>
                            {Array.from({ length: workoutExercise.sets }).map((_, setIndex) => (
                              <div key={setIndex} className="flex items-center gap-2">
                                <label className="text-xs text-gray-400 w-12">Set {setIndex + 1}:</label>
                                <input
                                  type="number"
                                  value={workoutExercise.custom_reps?.[setIndex] || workoutExercise.reps}
                                  onChange={(e) => handleUpdateCustomReps(index, setIndex, parseInt(e.target.value) || 0)}
                                  className="input text-sm flex-1"
                                  min="1"
                                  placeholder="Reps"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary w-full">
            {workout ? 'Update Workout' : 'Create Workout'}
          </button>
        </form>

        {showExercisePicker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
              <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Select Exercise</h3>
                <button
                  onClick={() => setShowExercisePicker(false)}
                  className="text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>
              <div className="p-4">
                {exercises && exercises.length > 0 ? (
                  <div className="space-y-2">
                    {exercises.map((exercise) => (
                      <button
                        key={exercise.id}
                        onClick={() => handleAddExercise(exercise)}
                        className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        <div className="font-medium">{exercise.name}</div>
                        <div className="text-sm text-gray-400">{exercise.muscle_group}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">
                    No exercises available. Create some exercises first.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
