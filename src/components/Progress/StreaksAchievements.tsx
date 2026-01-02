import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
}

export const StreaksAchievements: React.FC = () => {
  const { user } = useAuth();

  const workoutLogs = useLiveQuery(
    () => db.workout_logs.where('user_id').equals(user?.id || '').toArray(),
    [user?.id]
  );

  const workoutLogSets = useLiveQuery(async () => {
    if (!workoutLogs) return [];
    const allSets = [];
    for (const log of workoutLogs) {
      if (!log.completed_at) continue;
      const sets = await db.workout_log_sets.where('workout_log_id').equals(log.id).toArray();
      allSets.push(...sets);
    }
    return allSets;
  }, [workoutLogs]);

  // Calculate streaks
  const streakData = useMemo(() => {
    if (!workoutLogs) return { currentStreak: 0, longestStreak: 0, totalWorkouts: 0 };

    // Filter to only completed workouts and sort by date
    const completedLogs = workoutLogs
      .filter(log => log.completed_at)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());

    if (completedLogs.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalWorkouts: 0 };
    }

    // Get unique workout dates (ignore time)
    const workoutDates = Array.from(
      new Set(
        completedLogs.map(log => {
          const date = new Date(log.completed_at!);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        })
      )
    ).sort().reverse();

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const latestWorkoutDate = new Date(workoutDates[0]);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    // Only count streak if workout was today or yesterday
    if (workoutDates[0] === todayStr || workoutDates[0] === yesterdayStr) {
      let checkDate = new Date(latestWorkoutDate);
      for (let i = 0; i < workoutDates.length; i++) {
        const currentDateStr = workoutDates[i];
        const expectedDateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

        if (currentDateStr === expectedDateStr) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;
    for (let i = 1; i < workoutDates.length; i++) {
      const prevDate = new Date(workoutDates[i - 1]);
      const currDate = new Date(workoutDates[i]);
      const dayDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      totalWorkouts: completedLogs.length,
    };
  }, [workoutLogs]);

  // Calculate achievements
  const achievements = useMemo((): Achievement[] => {
    if (!workoutLogs || !workoutLogSets) return [];

    const completedWorkouts = workoutLogs.filter(log => log.completed_at);
    const totalSets = workoutLogSets.length;
    const totalVolume = workoutLogSets.reduce((sum, set) => sum + (set.weight || 0) * (set.reps || 0), 0);

    const getFirstWorkoutDate = () => {
      if (completedWorkouts.length === 0) return undefined;
      const sorted = [...completedWorkouts].sort((a, b) =>
        new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime()
      );
      return sorted[0].completed_at!;
    };

    const getWorkoutMilestoneDate = (count: number): string | undefined => {
      if (completedWorkouts.length < count) return undefined;
      const sorted = [...completedWorkouts]
        .filter(log => log.completed_at)
        .sort((a, b) => new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime());
      const date = sorted[count - 1]?.completed_at;
      return date || undefined;
    };

    return [
      {
        id: 'first-workout',
        title: 'First Step',
        description: 'Complete your first workout',
        icon: '🎯',
        unlocked: streakData.totalWorkouts >= 1,
        unlockedDate: getFirstWorkoutDate(),
      },
      {
        id: '5-workouts',
        title: 'Getting Started',
        description: 'Complete 5 workouts',
        icon: '🔥',
        unlocked: streakData.totalWorkouts >= 5,
        unlockedDate: getWorkoutMilestoneDate(5),
      },
      {
        id: '10-workouts',
        title: 'Committed',
        description: 'Complete 10 workouts',
        icon: '💪',
        unlocked: streakData.totalWorkouts >= 10,
        unlockedDate: getWorkoutMilestoneDate(10),
      },
      {
        id: '25-workouts',
        title: 'Dedicated',
        description: 'Complete 25 workouts',
        icon: '⭐',
        unlocked: streakData.totalWorkouts >= 25,
        unlockedDate: getWorkoutMilestoneDate(25),
      },
      {
        id: '50-workouts',
        title: 'Warrior',
        description: 'Complete 50 workouts',
        icon: '🏆',
        unlocked: streakData.totalWorkouts >= 50,
        unlockedDate: getWorkoutMilestoneDate(50),
      },
      {
        id: '100-workouts',
        title: 'Century',
        description: 'Complete 100 workouts',
        icon: '💯',
        unlocked: streakData.totalWorkouts >= 100,
        unlockedDate: getWorkoutMilestoneDate(100),
      },
      {
        id: '3-day-streak',
        title: '3 Day Streak',
        description: 'Work out for 3 consecutive days',
        icon: '🔥',
        unlocked: streakData.longestStreak >= 3,
      },
      {
        id: '7-day-streak',
        title: 'Week Warrior',
        description: 'Work out for 7 consecutive days',
        icon: '🌟',
        unlocked: streakData.longestStreak >= 7,
      },
      {
        id: '30-day-streak',
        title: 'Month Master',
        description: 'Work out for 30 consecutive days',
        icon: '🎖️',
        unlocked: streakData.longestStreak >= 30,
      },
      {
        id: '100-sets',
        title: 'Volume Beast',
        description: 'Complete 100 sets',
        icon: '🦾',
        unlocked: totalSets >= 100,
      },
      {
        id: '100k-volume',
        title: 'Iron Mover',
        description: 'Move 100,000 lbs total volume',
        icon: '🏋️',
        unlocked: totalVolume >= 100000,
      },
    ];
  }, [workoutLogs, workoutLogSets, streakData]);

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  if (!workoutLogs) {
    return <div className="text-center py-8">Loading achievements...</div>;
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold mb-6">Streaks & Achievements</h2>

      {/* Streak Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Current Streak</div>
          <div className="text-4xl font-bold text-primary-500 my-2">
            {streakData.currentStreak}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>days</div>
        </div>
        <div className="card text-center">
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Longest Streak</div>
          <div className="text-4xl font-bold text-primary-500 my-2">
            {streakData.longestStreak}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>days</div>
        </div>
        <div className="card text-center">
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Workouts</div>
          <div className="text-4xl font-bold text-primary-500 my-2">
            {streakData.totalWorkouts}
          </div>
          <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>completed</div>
        </div>
      </div>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">
            Unlocked Achievements ({unlockedAchievements.length}/{achievements.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedAchievements.map(achievement => (
              <div key={achievement.id} className="card bg-gradient-to-br from-primary-500/10 to-primary-600/10">
                <div className="flex items-start gap-3">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                      {achievement.title}
                    </h4>
                    <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                      {achievement.description}
                    </p>
                    {achievement.unlockedDate && (
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        Unlocked: {formatDate(achievement.unlockedDate)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Locked Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedAchievements.map(achievement => (
              <div key={achievement.id} className="card opacity-60">
                <div className="flex items-start gap-3">
                  <div className="text-4xl grayscale">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                      {achievement.title}
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {achievement.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {streakData.totalWorkouts === 0 && (
        <div className="card text-center py-8">
          <p style={{ color: 'var(--text-tertiary)' }}>
            Complete your first workout to start earning achievements!
          </p>
        </div>
      )}
    </div>
  );
};
