import React, { useState, useEffect } from 'react';
import { db, CardioLog as CardioLogType } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';

export const CardioLog: React.FC = () => {
  const { user } = useAuth();
  const [activityType, setActivityType] = useState<CardioLogType['activity_type']>('run');
  const [isActive, setIsActive] = useState(false);
  const [currentLog, setCurrentLog] = useState<CardioLogType | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distance, setDistance] = useState('');
  const [calories, setCalories] = useState('');
  const [avgHeartRate, setAvgHeartRate] = useState('');
  const [notes, setNotes] = useState('');

  const activityTypes: Array<{ value: CardioLogType['activity_type']; label: string; icon: string }> = [
    { value: 'run', label: 'Run', icon: '🏃' },
    { value: 'cycle', label: 'Cycle', icon: '🚴' },
    { value: 'swim', label: 'Swim', icon: '🏊' },
    { value: 'walk', label: 'Walk', icon: '🚶' },
    { value: 'hike', label: 'Hike', icon: '🥾' },
    { value: 'row', label: 'Row', icon: '🚣' },
    { value: 'elliptical', label: 'Elliptical', icon: '⭕' },
    { value: 'other', label: 'Other', icon: '💪' },
  ];

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && currentLog) {
      interval = setInterval(() => {
        const elapsed = Math.floor((new Date().getTime() - new Date(currentLog.started_at).getTime()) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, currentLog]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculatePace = (distanceMiles: number, durationSeconds: number): string => {
    if (!distanceMiles || distanceMiles === 0) return '-';
    const paceMinutesPerMile = durationSeconds / 60 / distanceMiles;
    const mins = Math.floor(paceMinutesPerMile);
    const secs = Math.round((paceMinutesPerMile - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}/mi`;
  };

  const handleStart = async () => {
    if (!user) return;

    const now = new Date().toISOString();
    const logId = crypto.randomUUID();

    const newLog: CardioLogType = {
      id: logId,
      user_id: user.id,
      activity_type: activityType,
      started_at: now,
      completed_at: null,
      duration_seconds: 0,
      created_at: now,
      updated_at: now,
      _synced: false,
    };

    await db.cardio_logs.add(newLog);
    setCurrentLog(newLog);
    setIsActive(true);
    setElapsedSeconds(0);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleResume = () => {
    setIsActive(true);
  };

  const handleFinish = async () => {
    if (!currentLog) return;

    const now = new Date().toISOString();
    const finalDuration = Math.floor((new Date().getTime() - new Date(currentLog.started_at).getTime()) / 1000);

    await db.cardio_logs.update(currentLog.id, {
      completed_at: now,
      duration_seconds: finalDuration,
      distance_miles: distance ? parseFloat(distance) : undefined,
      calories: calories ? parseInt(calories) : undefined,
      avg_heart_rate: avgHeartRate ? parseInt(avgHeartRate) : undefined,
      notes: notes || undefined,
      updated_at: now,
      _synced: false,
    });

    setIsActive(false);
    setCurrentLog(null);
    setElapsedSeconds(0);
    setDistance('');
    setCalories('');
    setAvgHeartRate('');
    setNotes('');

    alert('Cardio session completed! Great job!');
  };

  const handleCancel = async () => {
    if (!currentLog) return;

    if (confirm('Are you sure you want to cancel this cardio session?')) {
      await db.cardio_logs.delete(currentLog.id);
      setIsActive(false);
      setCurrentLog(null);
      setElapsedSeconds(0);
      setDistance('');
      setCalories('');
      setAvgHeartRate('');
      setNotes('');
    }
  };

  if (currentLog) {
    const selectedActivity = activityTypes.find(a => a.value === currentLog.activity_type);
    const currentDistance = distance ? parseFloat(distance) : 0;

    return (
      <div className="container mx-auto px-4 py-6 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                {selectedActivity?.icon} {selectedActivity?.label}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Started {new Date(currentLog.started_at).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCancel} className="btn btn-secondary text-sm">
                Cancel
              </button>
              <button onClick={handleFinish} className="btn btn-primary text-sm">
                Finish
              </button>
            </div>
          </div>

          {/* Timer Display */}
          <div className="card mb-6 text-center">
            <div className="text-6xl font-bold mb-2 font-mono">
              {formatTime(elapsedSeconds)}
            </div>
            <div className="flex gap-2 justify-center mt-4">
              {isActive ? (
                <button onClick={handlePause} className="btn btn-secondary px-8">
                  ⏸ Pause
                </button>
              ) : (
                <button onClick={handleResume} className="btn btn-primary px-8">
                  ▶ Resume
                </button>
              )}
            </div>
          </div>

          {/* Stats Input */}
          <div className="card space-y-4">
            <h3 className="text-lg font-semibold">Session Stats</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Distance (miles)</label>
                <input
                  type="number"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="input w-full"
                  placeholder="0.0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="label">Pace</label>
                <div className="input w-full bg-gray-700 text-gray-400">
                  {calculatePace(currentDistance, elapsedSeconds)}
                </div>
              </div>

              <div>
                <label className="label">Calories</label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="input w-full"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="label">Avg Heart Rate</label>
                <input
                  type="number"
                  value={avgHeartRate}
                  onChange={(e) => setAvgHeartRate(e.target.value)}
                  className="input w-full"
                  placeholder="bpm"
                />
              </div>
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input w-full"
                rows={3}
                placeholder="How did it feel?"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Log Cardio Activity</h2>

        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Select Activity Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {activityTypes.map((activity) => (
              <button
                key={activity.value}
                onClick={() => setActivityType(activity.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  activityType === activity.value
                    ? 'border-primary-600 bg-primary-900/30'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="text-3xl mb-2">{activity.icon}</div>
                <div className="text-sm font-medium">{activity.label}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleStart}
          className="btn btn-primary w-full text-lg py-4"
        >
          Start {activityTypes.find(a => a.value === activityType)?.label} Session
        </button>

        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <h4 className="font-semibold mb-2">💡 Tip</h4>
          <p className="text-sm text-gray-400">
            Start your activity, and you can add distance, calories, and heart rate data during or after your session.
          </p>
        </div>
      </div>
    </div>
  );
};
