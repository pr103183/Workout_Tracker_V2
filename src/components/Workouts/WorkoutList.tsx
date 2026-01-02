import React, { useCallback, useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Workout } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';

interface WorkoutListProps {
  onSelectWorkout: (workout: Workout) => void;
  onCreateWorkout: () => void;
}

export const WorkoutList: React.FC<WorkoutListProps> = ({ onSelectWorkout, onCreateWorkout }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');

  const workouts = useLiveQuery(
    () => db.workouts.where('user_id').equals(user?.id || '').toArray(),
    [user?.id]
  );

  const filteredAndSortedWorkouts = useMemo(() => {
    if (!workouts) return [];

    let filtered = workouts;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(workout =>
        workout.name.toLowerCase().includes(query) ||
        workout.description?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [workouts, searchQuery, sortBy]);

  const handleDeleteWorkout = useCallback(async (workoutId: string, workoutName: string) => {
    if (confirm(`Are you sure you want to delete "${workoutName}"? This will also delete all associated workout logs.`)) {
      // Delete workout exercises
      await db.workout_exercises.where('workout_id').equals(workoutId).delete();

      // Delete planned workouts
      await db.planned_workouts.where('workout_id').equals(workoutId).delete();

      // Delete workout logs and their sets
      const logs = await db.workout_logs.where('workout_id').equals(workoutId).toArray();
      for (const log of logs) {
        await db.workout_log_sets.where('workout_log_id').equals(log.id).delete();
      }
      await db.workout_logs.where('workout_id').equals(workoutId).delete();

      // Finally delete the workout itself
      await db.workouts.delete(workoutId);
    }
  }, []);

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

      {workouts && workouts.length > 0 && (
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workouts by name or description..."
                className="input w-full"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('name')}
                className={`btn text-sm ${sortBy === 'name' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Sort by Name
              </button>
              <button
                onClick={() => setSortBy('date')}
                className={`btn text-sm ${sortBy === 'date' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Sort by Date
              </button>
            </div>
          </div>
        </div>
      )}

      {!workouts || workouts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">No workouts yet</p>
          <button onClick={onCreateWorkout} className="btn btn-primary">
            Create Your First Workout
          </button>
        </div>
      ) : filteredAndSortedWorkouts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">No workouts match your search</p>
          <button onClick={() => setSearchQuery('')} className="btn btn-secondary">
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedWorkouts.map((workout, index) => (
            <div
              key={workout.id}
              className="card card-hover stagger-item"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <h3 className="text-xl font-semibold mb-2">{workout.name}</h3>
              {workout.description && (
                <p className="text-gray-400 text-sm mb-3">{workout.description}</p>
              )}
              <div className="flex justify-between items-center mt-4">
                <div className="text-xs text-gray-500">
                  Created {new Date(workout.created_at).toLocaleDateString()}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSelectWorkout(workout)}
                    className="btn btn-primary text-sm px-4 py-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteWorkout(workout.id, workout.name);
                    }}
                    className="btn bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
