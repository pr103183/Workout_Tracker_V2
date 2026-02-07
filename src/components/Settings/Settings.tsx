import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { syncService } from '../../lib/sync';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme, textSize, setTextSize } = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    // Update sync status periodically
    const updateSyncStatus = () => {
      const status = syncService.getSyncStatus();
      setLastSync(status.lastSyncDate);
      setSyncError(status.errors.length > 0 ? status.errors.join(', ') : null);
    };
    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (!user) return;
    setSyncing(true);
    setSyncError(null);
    try {
      const success = await syncService.forceSyncNow(user.id);
      if (success) {
        setLastSync(new Date().toISOString());
      } else {
        const status = syncService.getSyncStatus();
        setSyncError(status.errors.join(', '));
      }
    } catch (err: any) {
      setSyncError(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Settings</h2>

        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Appearance</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="theme" className="label">Theme</label>
              <select
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')}
                className="input"
              >
                <option value="auto">Auto (System Preference)</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Auto mode switches based on your device settings
              </p>
            </div>

            <div>
              <label htmlFor="textSize" className="label">Text Size</label>
              <select
                id="textSize"
                value={textSize}
                onChange={(e) => setTextSize(e.target.value as 'small' | 'medium' | 'large' | 'xl')}
                className="input"
              >
                <option value="small">Small</option>
                <option value="medium">Medium (Default)</option>
                <option value="large">Large</option>
                <option value="xl">Extra Large</option>
              </select>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Adjust text size for better readability
              </p>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Account Information</h3>
          <div className="space-y-2">
            <div>
              <span className="label">Email</span>
              <p style={{ color: 'var(--text-primary)' }}>{user?.email}</p>
            </div>
            <div>
              <span className="label">User ID</span>
              <p className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{user?.id}</p>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Cloud Sync</h3>
          <div className="space-y-4">
            <div>
              <span className="label">Last Sync</span>
              <p style={{ color: 'var(--text-primary)' }}>
                {lastSync ? new Date(lastSync).toLocaleString() : 'Never synced'}
              </p>
            </div>
            <div>
              <span className="label">Status</span>
              <p style={{ color: navigator.onLine ? 'var(--success)' : 'var(--text-muted)' }}>
                {navigator.onLine ? '🟢 Online' : '🔴 Offline'}
              </p>
            </div>
            {syncError && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded text-sm">
                <strong>Sync Error:</strong> {syncError}
              </div>
            )}
            <button
              onClick={handleManualSync}
              disabled={syncing || !navigator.onLine}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Data syncs automatically every 60 seconds and after completing workouts.
              Use this button to force an immediate sync.
            </p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Change Password</h3>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900/50 border border-green-700 text-green-200 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="label">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
