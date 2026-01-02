import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header
      className="sticky top-0 z-10"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)'
      }}
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-500">Workout Tracker</h1>

        <div className="flex items-center gap-4">
          <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {navigator.onLine ? (
              <span className="text-green-500">● Online</span>
            ) : (
              <span className="text-orange-500">● Offline</span>
            )}
          </div>

          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{user?.email}</span>

          <button
            onClick={signOut}
            className="btn btn-secondary text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};
