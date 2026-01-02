import React, { useState } from 'react';
import { ProgressDashboard } from './ProgressDashboard';
import { PersonalRecords } from './PersonalRecords';
import { StreaksAchievements } from './StreaksAchievements';

export const Progress: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'charts' | 'records' | 'achievements'>('charts');

  const subTabs = [
    { id: 'charts' as const, label: 'Charts', icon: '📊' },
    { id: 'records' as const, label: 'Personal Records', icon: '🏆' },
    { id: 'achievements' as const, label: 'Achievements', icon: '🎖️' },
  ];

  return (
    <div>
      {/* Sub-navigation */}
      <div
        className="sticky top-32 z-10 mb-4"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-2 py-2">
            {subTabs.map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors"
                  style={{
                    backgroundColor: isActive ? '#2563eb' : 'var(--bg-tertiary)',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeSubTab === 'charts' && <ProgressDashboard />}
        {activeSubTab === 'records' && <PersonalRecords />}
        {activeSubTab === 'achievements' && <StreaksAchievements />}
      </div>
    </div>
  );
};
