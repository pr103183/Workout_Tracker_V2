import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Workout, PlannedWorkout } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';

export const WorkoutPlanner: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);

  const workouts = useLiveQuery(
    () => db.workouts.where('user_id').equals(user?.id || '').toArray(),
    [user?.id]
  );

  const plannedWorkouts = useLiveQuery(
    () => db.planned_workouts.where('user_id').equals(user?.id || '').toArray(),
    [user?.id]
  );

  const getWorkoutName = (workoutId: string) => {
    return workouts?.find(w => w.id === workoutId)?.name || 'Unknown Workout';
  };

  const getPlannedWorkoutsForDate = (date: string) => {
    return plannedWorkouts?.filter(pw => pw.scheduled_date === date) || [];
  };

  const handleAddPlannedWorkout = async (workout: Workout) => {
    const planned: PlannedWorkout = {
      id: crypto.randomUUID(),
      user_id: user!.id,
      workout_id: workout.id,
      scheduled_date: selectedDate,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _synced: false,
    };

    await db.planned_workouts.add(planned);
    setShowWorkoutPicker(false);
  };

  const handleToggleComplete = async (plannedId: string, completed: boolean) => {
    await db.planned_workouts.update(plannedId, {
      completed: !completed,
      updated_at: new Date().toISOString(),
      _synced: false,
    });
  };

  const handleDeletePlanned = async (plannedId: string) => {
    if (confirm('Remove this planned workout?')) {
      await db.planned_workouts.delete(plannedId);
    }
  };

  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const isToday = (dateStr: string) => {
    return dateStr === new Date().toISOString().split('T')[0];
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6">Workout Planner</h2>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {getNext7Days().map((date) => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            className={`px-4 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedDate === date
                ? 'bg-primary-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            } ${isToday(date) ? 'ring-2 ring-green-500' : ''}`}
          >
            <div className="text-sm">{formatDate(date)}</div>
            {isToday(date) && <div className="text-xs text-green-300">Today</div>}
          </button>
        ))}
      </div>

      <div className="max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">
            {formatDate(selectedDate)}
          </h3>
          <button
            onClick={() => setShowWorkoutPicker(true)}
            className="btn btn-primary text-sm"
          >
            + Plan Workout
          </button>
        </div>

        {getPlannedWorkoutsForDate(selectedDate).length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400 mb-4">No workouts planned for this day</p>
            <button
              onClick={() => setShowWorkoutPicker(true)}
              className="btn btn-primary"
            >
              Plan a Workout
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {getPlannedWorkoutsForDate(selectedDate).map((planned) => (
              <div
                key={planned.id}
                className={`card ${
                  planned.completed ? 'bg-green-900/20 border-green-700' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => handleToggleComplete(planned.id, planned.completed)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                        planned.completed
                          ? 'bg-green-600 border-green-600'
                          : 'border-gray-500'
                      }`}
                    >
                      {planned.completed && '✓'}
                    </button>

                    <div>
                      <h4 className={`font-medium ${planned.completed ? 'line-through text-gray-500' : ''}`}>
                        {getWorkoutName(planned.workout_id)}
                      </h4>
                      {planned.completed && (
                        <p className="text-xs text-green-500">Completed</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeletePlanned(planned.id)}
                    className="text-red-500 hover:text-red-400 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showWorkoutPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Select Workout</h3>
              <button
                onClick={() => setShowWorkoutPicker(false)}
                className="text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              {workouts && workouts.length > 0 ? (
                <div className="space-y-2">
                  {workouts.map((workout) => (
                    <button
                      key={workout.id}
                      onClick={() => handleAddPlannedWorkout(workout)}
                      className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <div className="font-medium">{workout.name}</div>
                      {workout.description && (
                        <div className="text-sm text-gray-400">{workout.description}</div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  No workouts available. Create a workout first.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
