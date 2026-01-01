import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import { Workout } from './lib/db';

const AuthenticatedApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('workouts');
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | undefined>(undefined);
  const [showExerciseForm, setShowExerciseForm] = useState(false);

  const handleCreateWorkout = () => {
    setEditingWorkout(undefined);
    setShowWorkoutForm(true);
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setShowWorkoutForm(true);
  };

  const handleSaveWorkout = () => {
    setShowWorkoutForm(false);
    setEditingWorkout(undefined);
  };

  const handleCancelWorkout = () => {
    setShowWorkoutForm(false);
    setEditingWorkout(undefined);
  };

  const handleCreateExercise = () => {
    setShowExerciseForm(true);
  };

  const handleSaveExercise = () => {
    setShowExerciseForm(false);
  };

  const handleCancelExercise = () => {
    setShowExerciseForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main>
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
          <ExerciseList onCreateExercise={handleCreateExercise} />
        )}

        {activeTab === 'exercises' && showExerciseForm && (
          <ExerciseForm onSave={handleSaveExercise} onCancel={handleCancelExercise} />
        )}

        {activeTab === 'log' && <LogWorkout />}

        {activeTab === 'history' && <WorkoutHistory />}

        {activeTab === 'plan' && <WorkoutPlanner />}

        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
