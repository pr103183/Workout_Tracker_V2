export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          muscle_group: string
          equipment: string
          instructions: string
          is_custom: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string
          muscle_group: string
          equipment?: string
          instructions?: string
          is_custom?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string
          muscle_group?: string
          equipment?: string
          instructions?: string
          is_custom?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      workout_exercises: {
        Row: {
          id: string
          workout_id: string
          exercise_id: string
          order_index: number
          sets: number
          reps: number
          rest_seconds: number
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          exercise_id: string
          order_index: number
          sets?: number
          reps?: number
          rest_seconds?: number
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          exercise_id?: string
          order_index?: number
          sets?: number
          reps?: number
          rest_seconds?: number
          created_at?: string
        }
      }
      workout_logs: {
        Row: {
          id: string
          user_id: string
          workout_id: string
          started_at: string
          completed_at: string | null
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workout_id: string
          started_at?: string
          completed_at?: string | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workout_id?: string
          started_at?: string
          completed_at?: string | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      workout_log_sets: {
        Row: {
          id: string
          workout_log_id: string
          exercise_id: string
          set_number: number
          reps: number
          weight: number
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          workout_log_id: string
          exercise_id: string
          set_number: number
          reps: number
          weight: number
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          workout_log_id?: string
          exercise_id?: string
          set_number?: number
          reps?: number
          weight?: number
          completed?: boolean
          created_at?: string
        }
      }
      planned_workouts: {
        Row: {
          id: string
          user_id: string
          workout_id: string
          scheduled_date: string
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workout_id: string
          scheduled_date: string
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workout_id?: string
          scheduled_date?: string
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
