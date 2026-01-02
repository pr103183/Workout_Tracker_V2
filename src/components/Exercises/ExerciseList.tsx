import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Exercise } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';
import { defaultExercises } from '../../lib/defaultExercises';

interface ExerciseListProps {
  onCreateExercise: () => void;
  onEditExercise: (exercise: Exercise) => void;
}

export const ExerciseList: React.FC<ExerciseListProps> = ({ onCreateExercise, onEditExercise }) => {
  const { user } = useAuth();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [filter, setFilter] = useState('All');

  const exercises = useLiveQuery(
    () => db.exercises.where('user_id').equals(user?.id || '').toArray(),
    [user?.id]
  );

  useEffect(() => {
    const initializeDefaultExercises = async () => {
      if (!user) return;

      const existingCount = await db.exercises
        .where('user_id')
        .equals(user.id)
        .count();

      if (existingCount === 0) {
        const exercisesToAdd = defaultExercises.map((ex) => ({
          id: crypto.randomUUID(),
          user_id: user.id,
          ...ex,
          description: ex.description || '',
          equipment: ex.equipment || '',
          instructions: ex.instructions || '',
          form_cues: ex.form_cues || '',
          common_mistakes: ex.common_mistakes || '',
          muscle_activation: ex.muscle_activation || '',
          safety_tips: ex.safety_tips || '',
          is_bodyweight: ex.is_bodyweight || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          _synced: false,
        }));

        await db.exercises.bulkAdd(exercisesToAdd);
      }
    };

    const migrateArmsCategory = async () => {
      if (!user) return;

      // Find all exercises with muscle_group 'Arms'
      const armsExercises = await db.exercises
        .where('user_id')
        .equals(user.id)
        .filter(ex => ex.muscle_group === 'Arms')
        .toArray();

      // Update each exercise to either Biceps or Triceps based on name
      for (const exercise of armsExercises) {
        const nameLower = exercise.name.toLowerCase();
        let newMuscleGroup = 'Biceps'; // Default to Biceps

        // Check if the exercise is tricep-focused
        if (nameLower.includes('tricep') || nameLower.includes('dip') ||
            nameLower.includes('pushdown') || nameLower.includes('extension') ||
            nameLower.includes('overhead press') && nameLower.includes('tricep')) {
          newMuscleGroup = 'Triceps';
        }

        await db.exercises.update(exercise.id, {
          muscle_group: newMuscleGroup,
          updated_at: new Date().toISOString(),
          _synced: false,
        });
      }
    };

    initializeDefaultExercises();
    migrateArmsCategory();
  }, [user]);

  const muscleGroups = useMemo(
    () => ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Core'],
    []
  );

  const filteredExercises = useMemo(
    () => exercises?.filter((ex) => filter === 'All' || ex.muscle_group === filter),
    [exercises, filter]
  );

  const handleDeleteExercise = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this exercise?')) {
      await db.exercises.delete(id);
      setSelectedExercise(null);
    }
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Exercise Library</h2>
        <button onClick={onCreateExercise} className="btn btn-primary">
          + Add Custom Exercise
        </button>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {muscleGroups.map((group) => (
          <button
            key={group}
            onClick={() => setFilter(group)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === group
                ? 'bg-primary-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          {filteredExercises && filteredExercises.length > 0 ? (
            filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                onClick={() => setSelectedExercise(exercise)}
                className={`card cursor-pointer transition-colors ${
                  selectedExercise?.id === exercise.id
                    ? 'bg-gray-700 border-primary-600'
                    : 'hover:bg-gray-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{exercise.name}</h3>
                    <p className="text-sm text-gray-400">{exercise.muscle_group}</p>
                    {exercise.equipment && (
                      <p className="text-xs text-gray-500 mt-1">{exercise.equipment}</p>
                    )}
                  </div>
                  {exercise.is_custom && (
                    <span className="text-xs bg-primary-900 text-primary-300 px-2 py-1 rounded">
                      Custom
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-400">No exercises found</p>
            </div>
          )}
        </div>

        <div className="sticky top-32">
          {selectedExercise ? (
            <div className="card">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{selectedExercise.name}</h3>
                {selectedExercise.is_custom && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditExercise(selectedExercise)}
                      className="btn btn-primary text-sm px-4 py-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteExercise(selectedExercise.id)}
                      className="btn bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {selectedExercise.description && (
                <p className="text-gray-300 mb-4">{selectedExercise.description}</p>
              )}

              <div className="space-y-3">
                <div>
                  <h4 className="label">Muscle Group</h4>
                  <p className="text-white">{selectedExercise.muscle_group}</p>
                </div>

                {selectedExercise.equipment && (
                  <div>
                    <h4 className="label">Equipment</h4>
                    <p className="text-white">{selectedExercise.equipment}</p>
                  </div>
                )}

                {selectedExercise.instructions && (
                  <div>
                    <h4 className="label">Instructions</h4>
                    <div className="text-white whitespace-pre-line bg-gray-900 p-4 rounded-lg">
                      {selectedExercise.instructions}
                    </div>
                  </div>
                )}

                {(selectedExercise.form_cues ||
                  selectedExercise.common_mistakes ||
                  selectedExercise.muscle_activation ||
                  selectedExercise.safety_tips) && (
                  <div className="border-t border-gray-700 pt-4 mt-4">
                    <h4 className="text-lg font-semibold mb-3 text-primary-400">Form Guide</h4>
                    <div className="space-y-3">
                      {selectedExercise.form_cues && (
                        <div className="bg-blue-900/20 border border-blue-700/30 p-4 rounded-lg">
                          <h5 className="label text-blue-400 flex items-center gap-2 mb-2">
                            <span>✓</span> Form Cues
                          </h5>
                          <p className="text-white whitespace-pre-line text-sm">
                            {selectedExercise.form_cues}
                          </p>
                        </div>
                      )}

                      {selectedExercise.common_mistakes && (
                        <div className="bg-yellow-900/20 border border-yellow-700/30 p-4 rounded-lg">
                          <h5 className="label text-yellow-400 flex items-center gap-2 mb-2">
                            <span>⚠</span> Common Mistakes
                          </h5>
                          <p className="text-white whitespace-pre-line text-sm">
                            {selectedExercise.common_mistakes}
                          </p>
                        </div>
                      )}

                      {selectedExercise.muscle_activation && (
                        <div className="bg-purple-900/20 border border-purple-700/30 p-4 rounded-lg">
                          <h5 className="label text-purple-400 flex items-center gap-2 mb-2">
                            <span>💪</span> Muscle Activation
                          </h5>
                          <p className="text-white whitespace-pre-line text-sm">
                            {selectedExercise.muscle_activation}
                          </p>
                        </div>
                      )}

                      {selectedExercise.safety_tips && (
                        <div className="bg-red-900/20 border border-red-700/30 p-4 rounded-lg">
                          <h5 className="label text-red-400 flex items-center gap-2 mb-2">
                            <span>🛡️</span> Safety Tips
                          </h5>
                          <p className="text-white whitespace-pre-line text-sm">
                            {selectedExercise.safety_tips}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-gray-400">Select an exercise to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
