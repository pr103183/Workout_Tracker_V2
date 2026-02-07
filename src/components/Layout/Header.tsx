import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { syncService } from '../../lib/sync';

export const Header: React.FC = () => {
  const { signOut } = useAuth();
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);

  useEffect(() => {
    const updateSyncStatus = () => {
      const status = syncService.getSyncStatus();
      setLastSync(status.lastSyncDate);
      setSyncInProgress(status.inProgress);
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const formatLastSync = (isoDate: string | null) => {
    if (!isoDate) return 'Never';
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <header
      className="sticky top-0 z-10"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)'
      }}
    >
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary-500">Workout Tracker</h1>

        <div className="flex items-center gap-3">
          {/* Sync Status */}
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {syncInProgress ? (
              <span className="text-blue-400">⟳ Syncing...</span>
            ) : navigator.onLine ? (
              <span className="text-green-500" title={lastSync ? `Last sync: ${new Date(lastSync).toLocaleString()}` : 'Never synced'}>
                ● Synced {formatLastSync(lastSync)}
              </span>
            ) : (
              <span className="text-orange-500">● Offline</span>
            )}
          </div>

          <button
            onClick={signOut}
            className="btn btn-secondary text-sm py-1 px-3"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};
