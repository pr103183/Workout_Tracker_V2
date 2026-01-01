import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-500">Workout Tracker</h1>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            {navigator.onLine ? (
              <span className="text-green-500">● Online</span>
            ) : (
              <span className="text-orange-500">● Offline</span>
            )}
          </div>

          <span className="text-sm text-gray-400">{user?.email}</span>

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
