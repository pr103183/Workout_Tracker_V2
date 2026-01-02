import React, { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { ForgotPassword } from './components/Auth/ForgotPassword';
import { Header } from './components/Layout/Header';
import { Navigation } from './components/Layout/Navigation';
import { WorkoutList } from './components/Workouts/WorkoutList';
import { WorkoutForm } from './components/Workouts/WorkoutForm';
import { ExerciseList } from './components/Exercises/ExerciseList';
import { ExerciseForm } from './components/Exercises/ExerciseForm';
import { LogWorkout } from './components/WorkoutLog/LogWorkout';
import { WorkoutHistory } from './components/History/WorkoutHistory';
import { WorkoutPlanner } from './components/Planning/WorkoutPlanner';
import { Settings } from './components/Settings/Settings';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Workout, Exercise } from './lib/db';
import { useSwipe } from './hooks/useSwipe';

const TABS = ['workouts', 'exercises', 'log', 'history', 'plan', 'settings'];

const AuthenticatedApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('workouts');
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | undefined>(undefined);
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | undefined>(undefined);

  const handleCreateWorkout = useCallback(() => {
    setEditingWorkout(undefined);
    setShowWorkoutForm(true);
  }, []);

  const handleEditWorkout = useCallback((workout: Workout) => {
    setEditingWorkout(workout);
    setShowWorkoutForm(true);
  }, []);

  const handleSaveWorkout = useCallback(() => {
    setShowWorkoutForm(false);
    setEditingWorkout(undefined);
  }, []);

  const handleCancelWorkout = useCallback(() => {
    setShowWorkoutForm(false);
    setEditingWorkout(undefined);
  }, []);

  const handleCreateExercise = useCallback(() => {
    setEditingExercise(undefined);
    setShowExerciseForm(true);
  }, []);

  const handleEditExercise = useCallback((exercise: Exercise) => {
    setEditingExercise(exercise);
    setShowExerciseForm(true);
  }, []);

  const handleSaveExercise = useCallback(() => {
    setShowExerciseForm(false);
    setEditingExercise(undefined);
  }, []);

  const handleCancelExercise = useCallback(() => {
    setShowExerciseForm(false);
    setEditingExercise(undefined);
  }, []);

  // Swipe gesture handlers
  const handleSwipeLeft = useCallback(() => {
    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex < TABS.length - 1) {
      setActiveTab(TABS[currentIndex + 1]);
    }
  }, [activeTab]);

  const handleSwipeRight = useCallback(() => {
    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(TABS[currentIndex - 1]);
    }
  }, [activeTab]);

  const swipeHandlers = useSwipe({
    onSwipedLeft: handleSwipeLeft,
    onSwipedRight: handleSwipeRight,
  });

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Header />
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        <main
          role="main"
          aria-label="Main content"
          {...swipeHandlers}
        >
        {activeTab === 'workouts' && !showWorkoutForm && (
          <WorkoutList
            onSelectWorkout={handleEditWorkout}
            onCreateWorkout={handleCreateWorkout}
          />
        )}

        {activeTab === 'workouts' && showWorkoutForm && (
          <WorkoutForm
            workout={editingWorkout}
            onSave={handleSaveWorkout}
            onCancel={handleCancelWorkout}
          />
        )}

        {activeTab === 'exercises' && !showExerciseForm && (
          <ExerciseList
            onCreateExercise={handleCreateExercise}
            onEditExercise={handleEditExercise}
          />
        )}

        {activeTab === 'exercises' && showExerciseForm && (
          <ExerciseForm
            exercise={editingExercise}
            onSave={handleSaveExercise}
            onCancel={handleCancelExercise}
          />
        )}

        {activeTab === 'log' && <LogWorkout />}

        {activeTab === 'history' && <WorkoutHistory />}

        {activeTab === 'plan' && <WorkoutPlanner />}

          {activeTab === 'settings' && <Settings />}
        </main>
      </div>
    </ErrorBoundary>
  );
};

const UnauthenticatedApp: React.FC = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  return showRegister ? (
    <Register onToggleMode={() => setShowRegister(false)} />
  ) : (
    <Login
      onToggleMode={() => setShowRegister(true)}
      onForgotPassword={() => setShowForgotPassword(true)}
    />
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-2xl text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return user ? <AuthenticatedApp /> : <UnauthenticatedApp />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
