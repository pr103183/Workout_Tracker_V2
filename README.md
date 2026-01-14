# Workout Tracker V2

A Progressive Web App (PWA) for tracking workouts with offline-first architecture, built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Multi-user support** with Supabase authentication (email/password)
- **Offline-first architecture** with IndexedDB local storage
- **Automatic sync** to Supabase when online
- **Create custom workouts** with exercises, sets, reps, and rest times
- **Log workout sessions** with real-time tracking of sets, reps, and weight
- **Edit workouts in progress** - add/remove exercises, add/remove sets, reorder exercises
- **Exercise library** with 12+ common exercises and custom exercise support
- **Custom reps per set** - configure different rep targets for each set
- **Exercise reordering** - drag exercises to customize workout order
- **Start from previous workout** - use weights and reps from your last session
- **Progressive overload** - automatically increase weights by 5 lbs
- **Cardio workout tracking** - log cardio sessions with duration and notes
- **Search and filter** - find workouts and exercises quickly
- **Workout history** with detailed statistics and progress tracking
- **Workout planning** with a 7-day calendar view
- **Mobile-responsive** design optimized for all devices
- **Installable as PWA** with offline functionality

## Tech Stack

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Build Tool:** Vite
- **Backend/Auth/Database:** Supabase
- **Local Storage:** Dexie.js (IndexedDB wrapper)
- **PWA:** Vite PWA Plugin

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/Workout_Tracker_V2.git
cd Workout_Tracker_V2
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. In the Supabase dashboard, go to the SQL Editor
3. Copy the contents of `supabase-schema.sql` and run it in the SQL Editor
4. This will create all necessary tables, indexes, RLS policies, and triggers

### 4. Configure Environment

The Supabase configuration is already set in `src/lib/supabase.ts`:

```typescript
const supabaseUrl = 'https://iqavqgnbviuzmvzwiiqg.supabase.co';
const supabaseAnonKey = 'sb_publishable_ney6_XwpKYYfSylz20oGSg_WFtZK-pJ';
```

If you're using your own Supabase project, update these values with your project's URL and anon key.

### 5. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 6. Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

### 7. Preview Production Build

```bash
npm run preview
```

## Usage Guide

### First Time Setup

1. **Register an Account**
   - Open the app and click "Sign Up"
   - Enter your email and password
   - Check your email for verification (if enabled in Supabase)

2. **Login**
   - Use your email and password to log in
   - The app will automatically sync with Supabase

### Creating Workouts

1. Go to the **Workouts** tab
2. Click "Create Workout"
3. Enter workout name and description
4. Add exercises from your library
5. Set sets, reps, and rest time for each exercise
6. Click "Create Workout"

### Exercise Library

The app comes with 12 default exercises:
- Barbell Bench Press
- Barbell Squat
- Deadlift
- Pull-ups
- Overhead Press
- Barbell Row
- Dumbbell Bicep Curl
- Tricep Dips
- Lunges
- Plank
- Leg Press
- Lat Pulldown

You can also create custom exercises in the **Exercises** tab.

### Logging Workouts

1. Go to the **Log Workout** tab
2. Select a workout to perform
3. Optionally choose "Start from Previous Workout" to load weights from your last session
4. Click "Start Workout"
5. For each set:
   - Enter the reps performed
   - Enter the weight used (for weighted exercises)
   - Check the box when the set is complete
   - All changes save automatically in real-time
6. **During the workout, you can:**
   - Add or remove sets using the "+ Add Set" button or "✕" on each set
   - Remove entire exercises with the "Remove" button
   - Reorder exercises using the up/down arrows (↑ ↓)
   - Use "Use Same" to copy weights from your previous workout
   - Use "+5 lbs" for progressive overload
7. Add optional notes
8. Click "Finish" to complete the workout or "Cancel" to discard

### Viewing History

1. Go to the **History** tab
2. Browse your completed workouts
3. Click on any workout to see detailed information:
   - Duration
   - Total volume
   - All exercises and sets performed
   - Notes

### Planning Workouts

1. Go to the **Plan** tab
2. Select a date from the next 7 days
3. Click "Plan Workout"
4. Choose a workout to schedule
5. Mark workouts as completed as you finish them

## Offline Functionality

The app works fully offline:

- All data is stored locally in IndexedDB
- Create workouts, exercises, and log sessions while offline
- Data automatically syncs to Supabase when you reconnect
- Background sync runs every 60 seconds when online
- Green/orange indicator in header shows online/offline status

## PWA Installation

### On Mobile (iOS/Android)

1. Open the app in your mobile browser
2. Look for "Add to Home Screen" or "Install App" prompt
3. Tap "Install" or "Add"
4. The app will appear on your home screen like a native app

### On Desktop (Chrome/Edge)

1. Open the app in your browser
2. Look for the install icon in the address bar
3. Click "Install"
4. The app will open in its own window

## Database Schema

The app uses the following Supabase tables:

- `profiles` - User profile information
- `exercises` - Exercise library (default + custom exercises)
- `workouts` - User's workout templates
- `workout_exercises` - Exercises within each workout
- `workout_logs` - Logged workout sessions
- `workout_log_sets` - Individual sets logged during workouts
- `planned_workouts` - Scheduled future workouts

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## Development

### Project Structure

```
src/
├── components/
│   ├── Auth/           # Login and registration
│   ├── Exercises/      # Exercise library
│   ├── History/        # Workout history
│   ├── Layout/         # Header and navigation
│   ├── Planning/       # Workout planner
│   ├── WorkoutLog/     # Workout logging
│   └── Workouts/       # Workout management
├── contexts/
│   └── AuthContext.tsx # Authentication context
├── lib/
│   ├── db.ts           # IndexedDB schema (Dexie)
│   ├── supabase.ts     # Supabase client
│   ├── sync.ts         # Sync service
│   └── defaultExercises.ts
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions, please open an issue on GitHub.

---

Built with React, TypeScript, Tailwind CSS, Vite, and Supabase
