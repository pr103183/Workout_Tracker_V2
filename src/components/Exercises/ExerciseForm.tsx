import React, { useState } from 'react';
import { db, Exercise } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';

interface ExerciseFormProps {
  exercise?: Exercise;
  onSave: () => void;
  onCancel: () => void;
}

export const ExerciseForm: React.FC<ExerciseFormProps> = ({ exercise, onSave, onCancel }) => {
  const { user } = useAuth();
  const [name, setName] = useState(exercise?.name || '');
  const [description, setDescription] = useState(exercise?.description || '');
  const [muscleGroup, setMuscleGroup] = useState(exercise?.muscle_group || 'Chest');
  const [equipment, setEquipment] = useState(exercise?.equipment || '');
  const [instructions, setInstructions] = useState(exercise?.instructions || '');

  const muscleGroups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const exerciseData: Exercise = {
      id: exercise?.id || crypto.randomUUID(),
      user_id: user!.id,
      name,
      description,
      muscle_group: muscleGroup,
      equipment,
      instructions,
      is_custom: true,
      created_at: exercise?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _synced: false,
    };

    await db.exercises.put(exerciseData);
    onSave();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {exercise ? 'Edit Exercise' : 'Add Custom Exercise'}
          </h2>
          <button onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label htmlFor="name" className="label">Exercise Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
              placeholder="e.g., Cable Flyes"
            />
          </div>

          <div>
            <label htmlFor="muscleGroup" className="label">Muscle Group</label>
            <select
              id="muscleGroup"
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              className="input"
              required
            >
              {muscleGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="equipment" className="label">Equipment (Optional)</label>
            <input
              id="equipment"
              type="text"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className="input"
              placeholder="e.g., Cable Machine"
            />
          </div>

          <div>
            <label htmlFor="description" className="label">Description (Optional)</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              placeholder="Brief description"
            />
          </div>

          <div>
            <label htmlFor="instructions" className="label">Instructions (Optional)</label>
            <textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="input"
              rows={6}
              placeholder="Step-by-step instructions..."
            />
          </div>

          <button type="submit" className="btn btn-primary w-full">
            {exercise ? 'Update Exercise' : 'Add Exercise'}
          </button>
        </form>
      </div>
    </div>
  );
};
