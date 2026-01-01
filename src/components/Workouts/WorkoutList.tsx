import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Workout } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';

interface WorkoutListProps {
  onSelectWorkout: (workout: Workout) => void;
  onCreateWorkout: () => void;
}

export const WorkoutList: React.FC<WorkoutListProps> = ({ onSelectWorkout, onCreateWorkout }) => {
  const { user } = useAuth();

  const workouts = useLiveQuery(
    () => db.workouts.where('user_id').equals(user?.id || '').toArray(),
    [user?.id]
  );

  if (!workouts) {
    return <div className="text-center py-8">Loading workouts...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Workouts</h2>
        <button onClick={onCreateWorkout} className="btn btn-primary">
          + Create Workout
        </button>
      </div>

      {workouts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">No workouts yet</p>
          <button onClick={onCreateWorkout} className="btn btn-primary">
            Create Your First Workout
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workouts.map((workout) => (
            <div
              key={workout.id}
              onClick={() => onSelectWorkout(workout)}
              className="card cursor-pointer hover:bg-gray-700 transition-colors"
            >
              <h3 className="text-xl font-semibold mb-2">{workout.name}</h3>
              {workout.description && (
                <p className="text-gray-400 text-sm mb-3">{workout.description}</p>
              )}
              <div className="text-xs text-gray-500">
                Created {new Date(workout.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
