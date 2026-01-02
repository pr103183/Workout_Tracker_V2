import React from 'react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'workouts', label: 'Workouts', icon: '💪' },
    { id: 'exercises', label: 'Exercises', icon: '🏋️' },
    { id: 'log', label: 'Log Workout', icon: '📝' },
    { id: 'history', label: 'History', icon: '📊' },
    { id: 'progress', label: 'Progress', icon: '📈' },
    { id: 'plan', label: 'Plan', icon: '📅' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav
      className="sticky top-16 z-10"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)'
      }}
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4">
        <div className="flex overflow-x-auto gap-2 py-2" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                className="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: isActive ? '#2563eb' : 'var(--bg-tertiary)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                <span className="mr-2" aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
