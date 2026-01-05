import Dexie, { Table } from 'dexie';

export interface Profile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  _synced?: boolean;
}

export interface Exercise {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  muscle_group: string;
  equipment?: string;
  instructions?: string;
  form_cues?: string;
  common_mistakes?: string;
  muscle_activation?: string;
  safety_tips?: string;
  is_bodyweight?: boolean;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
  _synced?: boolean;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  _synced?: boolean;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_index: number;
  sets: number;
  reps: number;
  custom_reps?: number[]; // Array of reps for each set (e.g., [16, 12, 8])
  rest_seconds: number;
  created_at: string;
  _synced?: boolean;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  workout_id: string;
  started_at: string;
  completed_at: string | null;
  notes?: string;
  created_at: string;
  updated_at: string;
  _synced?: boolean;
}

export interface WorkoutLogSet {
  id: string;
  workout_log_id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight: number;
  completed: boolean;
  created_at: string;
  _synced?: boolean;
}

export interface PlannedWorkout {
  id: string;
  user_id: string;
  workout_id: string;
  scheduled_date: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  _synced?: boolean;
}

export interface CardioLog {
  id: string;
  user_id: string;
  activity_type: 'run' | 'cycle' | 'swim' | 'walk' | 'hike' | 'row' | 'elliptical' | 'other';
  started_at: string;
  completed_at: string | null;
  duration_seconds: number; // Total duration in seconds
  distance_miles?: number; // Optional distance
  calories?: number; // Optional calories burned
  avg_heart_rate?: number; // Optional average heart rate
  notes?: string;
  created_at: string;
  updated_at: string;
  _synced?: boolean;
}

export class WorkoutTrackerDB extends Dexie {
  profiles!: Table<Profile>;
  exercises!: Table<Exercise>;
  workouts!: Table<Workout>;
  workout_exercises!: Table<WorkoutExercise>;
  workout_logs!: Table<WorkoutLog>;
  workout_log_sets!: Table<WorkoutLogSet>;
  planned_workouts!: Table<PlannedWorkout>;
  cardio_logs!: Table<CardioLog>;

  constructor() {
    super('WorkoutTrackerDB');
    this.version(1).stores({
      profiles: 'id, email',
      exercises: 'id, user_id, name, muscle_group, is_custom',
      workouts: 'id, user_id, name',
      workout_exercises: 'id, workout_id, exercise_id, order_index',
      workout_logs: 'id, user_id, workout_id, started_at, completed_at',
      workout_log_sets: 'id, workout_log_id, exercise_id, set_number',
      planned_workouts: 'id, user_id, workout_id, scheduled_date, completed',
      cardio_logs: 'id, user_id, activity_type, started_at, completed_at',
    });
  }
}

export const db = new WorkoutTrackerDB();
