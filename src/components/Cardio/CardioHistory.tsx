import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, CardioLog } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';

export const CardioHistory: React.FC = () => {
  const { user } = useAuth();
  const [selectedLog, setSelectedLog] = useState<CardioLog | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');

  const cardioLogs = useLiveQuery(
    async () => {
      if (!user) return [];

      const logs = await db.cardio_logs
        .where('user_id')
        .equals(user.id)
        .toArray();

      return logs
        .filter(log => log.completed_at !== null)
        .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());
    },
    [user?.id]
  );

  const filteredLogs = useMemo(() => {
    if (!cardioLogs) return [];

    let filtered = cardioLogs;

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      switch (dateFilter) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(log =>
        new Date(log.completed_at!) >= cutoffDate
      );
    }

    return filtered;
  }, [cardioLogs, dateFilter]);

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatPace = (distanceMiles: number | undefined, durationSeconds: number): string => {
    if (!distanceMiles || distanceMiles === 0) return '-';
    const paceMinutesPerMile = durationSeconds / 60 / distanceMiles;
    const mins = Math.floor(paceMinutesPerMile);
    const secs = Math.round((paceMinutesPerMile - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}/mi`;
  };

  const getActivityIcon = (type: CardioLog['activity_type']): string => {
    const icons: Record<CardioLog['activity_type'], string> = {
      run: '🏃',
      cycle: '🚴',
      swim: '🏊',
      walk: '🚶',
      hike: '🥾',
      row: '🚣',
      elliptical: '⭕',
      other: '💪',
    };
    return icons[type];
  };

  const handleDelete = async (log: CardioLog) => {
    if (confirm(`Delete this ${log.activity_type} session?`)) {
      await db.cardio_logs.delete(log.id);
      setSelectedLog(null);
    }
  };

  if (!cardioLogs || cardioLogs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-6">Cardio History</h2>
        <div className="card text-center py-12">
          <p className="text-gray-400">No cardio sessions yet. Start logging cardio activities!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6">Cardio History</h2>

      {/* Filter Controls */}
      <div className="card mb-6">
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-400">Filter:</span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
            className="input text-sm"
          >
            <option value="all">All Time</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="year">Past Year</option>
          </select>
          <span className="text-sm text-gray-400 ml-auto">
            {filteredLogs.length} session{filteredLogs.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400 mb-4">No cardio sessions in this time range</p>
          <button onClick={() => setDateFilter('all')} className="btn btn-secondary">
            Show All
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {/* List of cardio logs */}
          <div className="space-y-3">
            {filteredLogs.map((log, index) => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className={`card cursor-pointer transition-all stagger-item ${
                  selectedLog?.id === log.id ? 'border-2 border-primary-600' : ''
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center flex-1">
                    <div className="text-3xl">{getActivityIcon(log.activity_type)}</div>
                    <div className="flex-1">
                      <div className="font-semibold capitalize">{log.activity_type}</div>
                      <div className="text-sm text-gray-400">
                        {new Date(log.completed_at!).toLocaleDateString()} at{' '}
                        {new Date(log.completed_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-sm mt-1">
                        {formatDuration(log.duration_seconds)}
                        {log.distance_miles && ` • ${log.distance_miles.toFixed(2)} mi`}
                        {log.calories && ` • ${log.calories} cal`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected log details */}
          <div className="sticky top-24">
            {selectedLog ? (
              <div className="card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 items-center">
                    <div className="text-4xl">{getActivityIcon(selectedLog.activity_type)}</div>
                    <div>
                      <h3 className="text-xl font-bold capitalize">{selectedLog.activity_type}</h3>
                      <p className="text-sm text-gray-400">
                        {new Date(selectedLog.completed_at!).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(selectedLog)}
                    className="text-red-500 hover:text-red-400 text-sm"
                  >
                    Delete
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">Duration</div>
                      <div className="text-lg font-semibold">{formatDuration(selectedLog.duration_seconds)}</div>
                    </div>

                    <div className="bg-gray-700 p-3 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">Distance</div>
                      <div className="text-lg font-semibold">
                        {selectedLog.distance_miles ? `${selectedLog.distance_miles.toFixed(2)} mi` : '-'}
                      </div>
                    </div>

                    <div className="bg-gray-700 p-3 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">Avg Pace</div>
                      <div className="text-lg font-semibold">
                        {formatPace(selectedLog.distance_miles, selectedLog.duration_seconds)}
                      </div>
                    </div>

                    <div className="bg-gray-700 p-3 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">Calories</div>
                      <div className="text-lg font-semibold">
                        {selectedLog.calories || '-'}
                      </div>
                    </div>

                    {selectedLog.avg_heart_rate && (
                      <div className="bg-gray-700 p-3 rounded-lg col-span-2">
                        <div className="text-xs text-gray-400 mb-1">Avg Heart Rate</div>
                        <div className="text-lg font-semibold">{selectedLog.avg_heart_rate} bpm</div>
                      </div>
                    )}
                  </div>

                  {selectedLog.notes && (
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <div className="text-xs text-gray-400 mb-2">Notes</div>
                      <p className="text-sm">{selectedLog.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card text-center py-12">
                <p className="text-gray-400">Select a cardio session to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
