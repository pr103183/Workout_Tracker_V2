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
  const [formCues, setFormCues] = useState(exercise?.form_cues || '');
  const [commonMistakes, setCommonMistakes] = useState(exercise?.common_mistakes || '');
  const [muscleActivation, setMuscleActivation] = useState(exercise?.muscle_activation || '');
  const [safetyTips, setSafetyTips] = useState(exercise?.safety_tips || '');

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
      form_cues: formCues,
      common_mistakes: commonMistakes,
      muscle_activation: muscleActivation,
      safety_tips: safetyTips,
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

          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-lg font-semibold mb-3">Form Guide (Optional)</h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="formCues" className="label">Form Cues</label>
                <textarea
                  id="formCues"
                  value={formCues}
                  onChange={(e) => setFormCues(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="e.g., Keep chest up, squeeze shoulder blades together, control the descent"
                />
                <p className="text-sm text-gray-400 mt-1">Quick reminders for proper form</p>
              </div>

              <div>
                <label htmlFor="commonMistakes" className="label">Common Mistakes</label>
                <textarea
                  id="commonMistakes"
                  value={commonMistakes}
                  onChange={(e) => setCommonMistakes(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="e.g., Arching lower back, using momentum, not going full range of motion"
                />
                <p className="text-sm text-gray-400 mt-1">What to avoid during the exercise</p>
              </div>

              <div>
                <label htmlFor="muscleActivation" className="label">Muscle Activation Cues</label>
                <textarea
                  id="muscleActivation"
                  value={muscleActivation}
                  onChange={(e) => setMuscleActivation(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="e.g., Feel the stretch in your chest, focus on squeezing pecs at the top"
                />
                <p className="text-sm text-gray-400 mt-1">How to engage the target muscles</p>
              </div>

              <div>
                <label htmlFor="safetyTips" className="label">Safety Tips</label>
                <textarea
                  id="safetyTips"
                  value={safetyTips}
                  onChange={(e) => setSafetyTips(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="e.g., Use a spotter for heavy weights, warm up properly, stop if you feel joint pain"
                />
                <p className="text-sm text-gray-400 mt-1">Safety considerations and precautions</p>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full">
            {exercise ? 'Update Exercise' : 'Add Exercise'}
          </button>
        </form>
      </div>
    </div>
  );
};
