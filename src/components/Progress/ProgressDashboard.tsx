import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const ProgressDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const workoutLogs = useLiveQuery(
    () => db.workout_logs.where('user_id').equals(user?.id || '').toArray(),
    [user?.id]
  );

  const exercises = useLiveQuery(
    () => db.exercises.where('user_id').equals(user?.id || '').toArray(),
    [user?.id]
  );

  const workoutLogSets = useLiveQuery(async () => {
    if (!workoutLogs) return [];
    const allSets = [];
    for (const log of workoutLogs) {
      if (!log.completed_at) continue; // Skip logs without completion date
      const sets = await db.workout_log_sets.where('workout_log_id').equals(log.id).toArray();
      for (const set of sets) {
        allSets.push({
          ...set,
          workout_log_id: log.id,
          completed_at: log.completed_at,
        });
      }
    }
    return allSets;
  }, [workoutLogs]);

  // Calculate date range
  const startDate = useMemo(() => {
    const now = new Date();
    if (timeRange === '7d') {
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '30d') {
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '90d') {
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }
    return new Date(0);
  }, [timeRange]);

  // Filter logs by date range (only completed logs)
  const filteredLogs = useMemo(() => {
    if (!workoutLogs) return [];
    return workoutLogs.filter(log => log.completed_at && new Date(log.completed_at) >= startDate);
  }, [workoutLogs, startDate]);

  // Progress over time for selected exercise
  const exerciseProgressData = useMemo(() => {
    if (!selectedExerciseId || !workoutLogSets || !exercises) return [];

    const exerciseSets = workoutLogSets.filter(
      set => set.exercise_id === selectedExerciseId && set.completed_at && new Date(set.completed_at) >= startDate
    );

    const groupedByDate = exerciseSets.reduce((acc, set) => {
      const date = new Date(set.completed_at!).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, maxWeight: 0, totalVolume: 0, sets: 0 };
      }
      const weight = set.weight || 0;
      const reps = set.reps || 0;
      acc[date].maxWeight = Math.max(acc[date].maxWeight, weight);
      acc[date].totalVolume += weight * reps;
      acc[date].sets += 1;
      return acc;
    }, {} as Record<string, { date: string; maxWeight: number; totalVolume: number; sets: number }>);

    return Object.values(groupedByDate).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [selectedExerciseId, workoutLogSets, exercises, startDate]);

  // Workout frequency by day
  const workoutFrequencyData = useMemo(() => {
    if (!filteredLogs) return [];

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    filteredLogs.forEach(log => {
      if (log.completed_at) {
        const day = new Date(log.completed_at).getDay();
        counts[day]++;
      }
    });

    return daysOfWeek.map((day, idx) => ({
      day,
      workouts: counts[idx],
    }));
  }, [filteredLogs]);

  // Muscle group distribution
  const muscleGroupData = useMemo(() => {
    if (!workoutLogSets || !exercises) return [];

    const distribution: Record<string, number> = {};

    workoutLogSets
      .filter(set => set.completed_at && new Date(set.completed_at) >= startDate)
      .forEach(set => {
        const exercise = exercises.find(ex => ex.id === set.exercise_id);
        if (exercise) {
          distribution[exercise.muscle_group] = (distribution[exercise.muscle_group] || 0) + 1;
        }
      });

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
    }));
  }, [workoutLogSets, exercises, startDate]);

  // Total volume over time
  const volumeOverTimeData = useMemo(() => {
    if (!workoutLogSets) return [];

    const groupedByDate = workoutLogSets
      .filter(set => set.completed_at && new Date(set.completed_at) >= startDate)
      .reduce((acc, set) => {
        const date = new Date(set.completed_at!).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { date, volume: 0 };
        }
        acc[date].volume += (set.weight || 0) * (set.reps || 0);
        return acc;
      }, {} as Record<string, { date: string; volume: number }>);

    return Object.values(groupedByDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 data points
  }, [workoutLogSets, startDate]);

  const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#ca8a04', '#16a34a'];

  if (!workoutLogs || !exercises) {
    return <div className="text-center py-8">Loading progress data...</div>;
  }

  const filteredSets = workoutLogSets?.filter(s => s.completed_at && new Date(s.completed_at) >= startDate) || [];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Progress & Analytics</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
          className="input w-auto"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Workouts</div>
          <div className="text-3xl font-bold text-primary-500">{filteredLogs.length}</div>
        </div>
        <div className="card">
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Sets</div>
          <div className="text-3xl font-bold text-primary-500">{filteredSets.length}</div>
        </div>
        <div className="card">
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Volume</div>
          <div className="text-3xl font-bold text-primary-500">
            {filteredSets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0).toLocaleString()} lbs
          </div>
        </div>
        <div className="card">
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Exercises Tracked</div>
          <div className="text-3xl font-bold text-primary-500">
            {new Set(filteredSets.map(s => s.exercise_id)).size}
          </div>
        </div>
      </div>

      {/* Volume Over Time */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">Total Volume Over Time</h3>
        {volumeOverTimeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={volumeOverTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <Legend />
              <Line type="monotone" dataKey="volume" stroke="#2563eb" strokeWidth={2} name="Volume (lbs)" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>No data available for selected time range</p>
        )}
      </div>

      {/* Exercise Progress */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">Exercise Progress</h3>
        <select
          value={selectedExerciseId}
          onChange={(e) => setSelectedExerciseId(e.target.value)}
          className="input mb-4"
        >
          <option value="">Select an exercise</option>
          {exercises?.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>

        {selectedExerciseId && exerciseProgressData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={exerciseProgressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis yAxisId="left" stroke="#9ca3af" />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#e5e7eb' }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="maxWeight" stroke="#2563eb" strokeWidth={2} name="Max Weight (lbs)" />
              <Line yAxisId="right" type="monotone" dataKey="totalVolume" stroke="#7c3aed" strokeWidth={2} name="Total Volume (lbs)" />
            </LineChart>
          </ResponsiveContainer>
        ) : selectedExerciseId ? (
          <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>No data for this exercise in selected time range</p>
        ) : null}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Workout Frequency */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Workout Frequency by Day</h3>
          {workoutFrequencyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={workoutFrequencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#e5e7eb' }}
                />
                <Bar dataKey="workouts" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>No workouts logged yet</p>
          )}
        </div>

        {/* Muscle Group Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Muscle Group Distribution</h3>
          {muscleGroupData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={muscleGroupData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {muscleGroupData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#e5e7eb' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>No exercise data yet</p>
          )}
        </div>
      </div>
    </div>
  );
};
