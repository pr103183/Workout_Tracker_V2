# Workout Tracker V2 - Architecture Documentation

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Architecture Diagram](#architecture-diagram)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Data Flow](#data-flow)
- [Third-Party Integrations](#third-party-integrations)
- [Key Features Explained](#key-features-explained)
- [How Everything Works Together](#how-everything-works-together)

---

## 🎯 Project Overview

**Workout Tracker V2** is a Progressive Web App (PWA) that helps users track their workouts with offline-first capabilities. Users can create custom workouts, log exercise sessions, track progress, and plan future workouts - all while maintaining full functionality even when offline.

**Key Capabilities:**
- ✅ Works offline (stores data locally)
- ✅ Automatically syncs when back online
- ✅ Installable on phones like a native app
- ✅ Multi-user support with secure authentication
- ✅ Real-time progress tracking with charts and analytics
- ✅ Personal records tracking and achievements
- ✅ Custom reps per set and exercise reordering
- ✅ Start workouts from previous sessions
- ✅ Search and filter across workouts and history
- ✅ Dark/Light theme with customizable text size
- ✅ Comprehensive animations and micro-interactions
- ✅ Form guides and exercise cues

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S DEVICE                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    REACT APPLICATION                      │  │
│  │                                                            │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │   Login/   │  │   Workouts   │  │    Exercise     │  │  │
│  │  │  Register  │  │   Manager    │  │     Library     │  │  │
│  │  └────────────┘  └──────────────┘  └─────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │  Workout   │  │   History    │  │    Planner      │  │  │
│  │  │   Logger   │  │   Viewer     │  │   (Calendar)    │  │  │
│  │  └────────────┘  └──────────────┘  └─────────────────┘  │  │
│  │                                                            │  │
│  │                    ⬇️  Data Flow  ⬇️                       │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │            LOCAL DATABASE (IndexedDB)             │    │  │
│  │  │  • Stores all data locally in browser             │    │  │
│  │  │  • Works 100% offline                             │    │  │
│  │  │  • Powered by Dexie.js                            │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  │                                                            │  │
│  │                    ⬇️  Sync Service  ⬇️                    │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │              SYNC MANAGER                         │    │  │
│  │  │  • Runs every 60 seconds when online              │    │  │
│  │  │  • Uploads local changes to cloud                 │    │  │
│  │  │  • Downloads cloud updates to device              │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ Internet Connection
                               │ (HTTPS/REST API)
                               ⬇️
┌─────────────────────────────────────────────────────────────────┐
│                          CLOUD SERVICES                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    SUPABASE (Backend)                     │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │ Auth Service │  │  PostgreSQL  │  │  Row Level   │   │  │
│  │  │  • Login     │  │   Database   │  │   Security   │   │  │
│  │  │  • Register  │  │  • Users     │  │  (Privacy)   │   │  │
│  │  │  • Password  │  │  • Workouts  │  │              │   │  │
│  │  │    Reset     │  │  • Exercises │  │              │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    VERCEL (Hosting)                       │  │
│  │  • Hosts the website/app                                  │  │
│  │  • Provides HTTPS                                         │  │
│  │  • Global CDN (fast worldwide)                            │  │
│  │  • Auto-deploys from GitHub                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    GITHUB (Code Storage)                  │  │
│  │  • Stores all source code                                 │  │
│  │  • Version control                                        │  │
│  │  • Triggers auto-deployment                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend (What Users See)
| Technology | Purpose | Why We Use It |
|-----------|---------|---------------|
| **React 18** | UI Framework | Creates interactive user interface |
| **TypeScript** | Programming Language | Adds type safety, catches errors early |
| **Tailwind CSS** | Styling | Makes the app look good, mobile-responsive |
| **Vite** | Build Tool | Fast development, optimizes for production |

### Data Storage (Local Device)
| Technology | Purpose | Why We Use It |
|-----------|---------|---------------|
| **IndexedDB** | Browser Database | Stores data locally, works offline |
| **Dexie.js** | IndexedDB Wrapper | Makes IndexedDB easier to use |

### Backend (Cloud Services)
| Technology | Purpose | Why We Use It |
|-----------|---------|---------------|
| **Supabase** | Backend-as-a-Service | Authentication, database, API in one |
| **PostgreSQL** | Cloud Database | Stores data in the cloud |

### Deployment & Hosting
| Technology | Purpose | Why We Use It |
|-----------|---------|---------------|
| **Vercel** | Web Hosting | Hosts the app, provides HTTPS, global CDN |
| **GitHub** | Code Repository | Version control, triggers auto-deployment |

### PWA (Progressive Web App)
| Technology | Purpose | Why We Use It |
|-----------|---------|---------------|
| **Service Worker** | Offline Support | Caches files, enables offline mode |
| **Web App Manifest** | Installability | Makes app installable on phone |

---

## 📁 Project Structure

```
Workout_Tracker_V2/
│
├── src/                          # Source code
│   ├── components/               # UI Components
│   │   ├── Auth/                 # Login, Register, Password Reset
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── ForgotPassword.tsx
│   │   │
│   │   ├── Workouts/             # Workout Management
│   │   │   ├── WorkoutList.tsx   # View all workouts
│   │   │   └── WorkoutForm.tsx   # Create/Edit workouts
│   │   │
│   │   ├── Exercises/            # Exercise Library
│   │   │   ├── ExerciseList.tsx  # Browse exercises
│   │   │   └── ExerciseForm.tsx  # Add custom exercises
│   │   │
│   │   ├── WorkoutLog/           # Logging Workouts
│   │   │   └── LogWorkout.tsx    # Track sets/reps/weight
│   │   │
│   │   ├── History/              # Past Workouts
│   │   │   └── WorkoutHistory.tsx # View progress over time
│   │   │
│   │   ├── Planning/             # Workout Planner
│   │   │   └── WorkoutPlanner.tsx # Schedule future workouts
│   │   │
│   │   ├── Settings/             # User Settings
│   │   │   └── Settings.tsx      # Change password, account info
│   │   │
│   │   └── Layout/               # App Layout
│   │       ├── Header.tsx        # Top bar with sign out
│   │       └── Navigation.tsx    # Bottom navigation tabs
│   │
│   ├── contexts/                 # React Contexts
│   │   └── AuthContext.tsx       # Authentication state management
│   │
│   ├── lib/                      # Core Libraries
│   │   ├── supabase.ts           # Supabase client setup
│   │   ├── db.ts                 # IndexedDB schema (Dexie)
│   │   ├── sync.ts               # Sync service (Local ↔ Cloud)
│   │   ├── database.types.ts     # TypeScript types for DB
│   │   └── defaultExercises.ts   # Pre-loaded exercise library
│   │
│   ├── App.tsx                   # Main app component
│   ├── main.tsx                  # App entry point
│   └── index.css                 # Global styles
│
├── public/                       # Static files
│   └── vite.svg                  # App icon
│
├── supabase-schema.sql           # Database setup SQL
├── supabase-schema-clean.sql     # Clean install SQL
│
├── package.json                  # Dependencies list
├── tsconfig.json                 # TypeScript config
├── tailwind.config.js            # Tailwind CSS config
├── vite.config.ts                # Vite + PWA config
│
└── README.md                     # Project documentation
```

---

## 🔄 Data Flow

### When User Creates a Workout (Offline Mode)

```
1. User fills out workout form
        ⬇️
2. React component validates data
        ⬇️
3. Data saved to IndexedDB (local browser database)
        ⬇️
4. Marked as "unsynced" (_synced: false)
        ⬇️
5. User can immediately use the workout (no internet needed!)
```

### When User Comes Back Online

```
1. Sync service detects internet connection
        ⬇️
2. Finds all "unsynced" data in IndexedDB
        ⬇️
3. Uploads to Supabase via REST API
        ⬇️
4. Marks local data as "synced" (_synced: true)
        ⬇️
5. Downloads any changes from other devices
        ⬇️
6. Updates local IndexedDB with cloud data
```

### Authentication Flow

```
1. User enters email/password
        ⬇️
2. Sent to Supabase Auth API
        ⬇️
3. Supabase verifies credentials
        ⬇️
4. Returns JWT token (secure session token)
        ⬇️
5. Token stored in browser
        ⬇️
6. All future API calls include this token
        ⬇️
7. Supabase uses Row Level Security to ensure users
   only see their own data
```

---

## 🌐 Third-Party Integrations

### 1. GitHub (https://github.com/pr103183/Workout_Tracker_V2)

**What it does:**
- Stores all source code
- Tracks every change (version control)
- Enables collaboration
- Triggers automatic deployments

**How it connects:**
```
Your Computer  →  git push  →  GitHub Repository
                                    ⬇️
                              Webhook notification
                                    ⬇️
                                  Vercel
                            (auto-deployment)
```

**Key commands used:**
```bash
git add .                    # Stage changes
git commit -m "message"      # Save changes
git push                     # Upload to GitHub
```

---

### 2. Supabase (https://iqavqgnbviuzmvzwiiqg.supabase.co)

**What it does:**
- User authentication (login/register/password reset)
- PostgreSQL database (stores all workout data)
- REST API (app talks to database)
- Row Level Security (users only see their own data)

**Database Tables:**

| Table | What It Stores |
|-------|----------------|
| `profiles` | User account information |
| `exercises` | Exercise library (default + custom) |
| `workouts` | Workout templates |
| `workout_exercises` | Exercises within each workout |
| `workout_logs` | Logged workout sessions |
| `workout_log_sets` | Individual sets (reps/weight) |
| `planned_workouts` | Scheduled future workouts |

**How it connects:**
```javascript
// In src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iqavqgnbviuzmvzwiiqg.supabase.co';
const supabaseAnonKey = 'sb_publishable_ney6_...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Security:**
- Each table has Row Level Security (RLS) policies
- Users can only access their own data
- Authentication required for all operations
- Example policy: `auth.uid() = user_id` (user can only see rows where user_id matches their ID)

---

### 3. Vercel (Hosting Platform)

**What it does:**
- Hosts the compiled React application
- Provides HTTPS (secure connection)
- Global CDN (fast loading worldwide)
- Automatic deployments from GitHub

**Deployment Flow:**
```
1. You push code to GitHub
        ⬇️
2. GitHub notifies Vercel via webhook
        ⬇️
3. Vercel automatically:
   - Pulls latest code
   - Runs: npm install
   - Runs: npm run build
   - Deploys to global CDN
        ⬇️
4. App is live at:
   https://workout-tracker-v2-[id].vercel.app
```

**What Vercel builds:**
```bash
npm run build
  → TypeScript compilation (tsc)
  → Vite bundles React app
  → Creates optimized static files
  → Generates service worker (PWA)
  → Output: dist/ folder
  → Deploys dist/ to CDN
```

---

## 🔑 Key Features Explained

### 1. Offline-First Architecture

**The Problem:** Mobile internet is unreliable. Users shouldn't lose data.

**The Solution:** Store everything locally first, sync to cloud later.

```
┌─────────────────────────────────────────────┐
│         USER ACTIONS (Always Work!)          │
├─────────────────────────────────────────────┤
│  ✓ Create workouts                           │
│  ✓ Log exercises                             │
│  ✓ View history                              │
│  ✓ Plan workouts                             │
└─────────────────────────────────────────────┘
         ⬇️                    ⬇️
┌──────────────────┐   ┌──────────────────┐
│   IndexedDB      │   │   Sync Queue     │
│  (Local Storage) │   │  (Pending Syncs) │
└──────────────────┘   └──────────────────┘
         ⬆️                    ⬇️
         │              When Online
         │                    ⬇️
         │            ┌──────────────────┐
         └────────────│    Supabase      │
           Pulls      │  (Cloud Backup)  │
           Updates    └──────────────────┘
```

**Implementation:**
- `src/lib/db.ts` - Defines IndexedDB schema
- `src/lib/sync.ts` - Handles bidirectional sync
- Every record has `_synced` flag (true/false)

---

### 2. Progressive Web App (PWA)

**What makes it a PWA:**

| Feature | How It Works |
|---------|--------------|
| **Installable** | `manifest.json` tells phone how to install |
| **Offline** | Service Worker caches files |
| **Fast** | Files cached = instant loading |
| **App-like** | Full screen, no browser UI |

**Configuration:**
```typescript
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Workout Tracker V2',
    short_name: 'Workout Tracker',
    icons: [...],
    display: 'standalone'  // Opens like native app
  },
  workbox: {
    // Caches all JS, CSS, HTML, images
    globPatterns: ['**/*.{js,css,html,ico,png,svg}']
  }
})
```

---

### 3. Multi-User Authentication

**Flow:**
```
┌──────────────┐
│ User enters  │
│ credentials  │
└──────┬───────┘
       │
       ⬇️
┌──────────────────────┐
│ Supabase Auth API    │
│ • Verifies password  │
│ • Creates session    │
│ • Returns JWT token  │
└──────┬───────────────┘
       │
       ⬇️
┌──────────────────────┐
│ AuthContext stores   │
│ user session in      │
│ React state          │
└──────┬───────────────┘
       │
       ⬇️
┌──────────────────────┐
│ All API calls        │
│ include JWT token    │
│ in Authorization     │
│ header               │
└──────────────────────┘
```

**Code:**
```typescript
// src/contexts/AuthContext.tsx
const signIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  // Supabase automatically stores session
};
```

---

### 4. Automatic Background Sync

**How it works:**
```typescript
// src/contexts/AuthContext.tsx
useEffect(() => {
  if (!user) return;

  // Run sync every 60 seconds
  const interval = setInterval(() => {
    if (navigator.onLine) {  // Check if online
      syncService.syncAll(user.id).catch(console.error);
    }
  }, 60000);  // 60,000ms = 60 seconds

  return () => clearInterval(interval);
}, [user]);
```

**Sync Process:**
```typescript
// src/lib/sync.ts
class SyncService {
  async syncAll(userId: string) {
    // 1. Upload unsynced local data
    await this.syncExercises(userId);
    await this.syncWorkouts(userId);
    await this.syncWorkoutLogs(userId);
    // ... etc

    // 2. Download new data from cloud
    // 3. Update local database
  }

  private async syncExercises(userId: string) {
    // Find all unsynced exercises
    const unsynced = await db.exercises
      .filter(e => e._synced === false)
      .toArray();

    // Upload to Supabase
    for (const exercise of unsynced) {
      const { _synced, ...data } = exercise;
      await supabase.from('exercises').upsert(data);
      await db.exercises.update(exercise.id, { _synced: true });
    }

    // Download from Supabase
    const { data: remote } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', userId);

    // Update local database
    for (const exercise of remote) {
      await db.exercises.put({ ...exercise, _synced: true });
    }
  }
}
```

---

## 🔗 How Everything Works Together

### Complete User Journey: Creating & Logging a Workout

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER OPENS APP (First Time)                              │
├─────────────────────────────────────────────────────────────┤
│ • Vercel serves index.html + JavaScript                     │
│ • Service Worker installed (PWA)                            │
│ • Shows Login screen                                         │
└─────────────────────────────────────────────────────────────┘
                        ⬇️
┌─────────────────────────────────────────────────────────────┐
│ 2. USER REGISTERS                                           │
├─────────────────────────────────────────────────────────────┤
│ • Enters email/password                                      │
│ • Supabase creates account                                   │
│ • Trigger creates profile row                               │
│ • Email verification sent                                    │
└─────────────────────────────────────────────────────────────┘
                        ⬇️
┌─────────────────────────────────────────────────────────────┐
│ 3. USER LOGS IN                                             │
├─────────────────────────────────────────────────────────────┤
│ • Supabase verifies credentials                             │
│ • Returns JWT token                                          │
│ • AuthContext stores session                                │
│ • Sync service runs (downloads 12 default exercises)        │
│ • Shows main app                                             │
└─────────────────────────────────────────────────────────────┘
                        ⬇️
┌─────────────────────────────────────────────────────────────┐
│ 4. USER CREATES WORKOUT                                     │
├─────────────────────────────────────────────────────────────┤
│ • Clicks "Workouts" tab → "Create Workout"                  │
│ • Names workout: "Upper Body Day"                           │
│ • Adds exercises:                                            │
│   - Bench Press (3 sets × 10 reps, 60s rest)               │
│   - Pull-ups (3 sets × 8 reps, 90s rest)                   │
│ • Clicks "Create Workout"                                    │
│                                                              │
│ WHAT HAPPENS:                                                │
│ → Data saved to IndexedDB (works offline!)                  │
│ → workout: { id: "abc", name: "Upper Body", _synced: false }│
│ → workout_exercises: [bench_press, pullups]                 │
│ → UI updates immediately                                     │
└─────────────────────────────────────────────────────────────┘
                        ⬇️
┌─────────────────────────────────────────────────────────────┐
│ 5. SYNC HAPPENS (60 seconds later, if online)              │
├─────────────────────────────────────────────────────────────┤
│ • Sync service detects unsynced data                        │
│ • Uploads to Supabase:                                       │
│   POST /workouts → { name: "Upper Body", user_id: "..." }  │
│   POST /workout_exercises → [...bench, ...pullups]          │
│ • Updates local IndexedDB: _synced: true                    │
│ • Downloads any changes from other devices                   │
└─────────────────────────────────────────────────────────────┘
                        ⬇️
┌─────────────────────────────────────────────────────────────┐
│ 6. USER LOGS WORKOUT (Next Day)                            │
├─────────────────────────────────────────────────────────────┤
│ • Goes to "Log Workout" tab                                  │
│ • Selects "Upper Body Day"                                   │
│ • Clicks "Start Workout"                                     │
│                                                              │
│ WHAT HAPPENS:                                                │
│ → Creates workout_log: { id: "xyz", started_at: now }      │
│ → Creates sets: workout_log_sets (6 total, 3 per exercise) │
│ → All in IndexedDB, _synced: false                         │
└─────────────────────────────────────────────────────────────┘
                        ⬇️
┌─────────────────────────────────────────────────────────────┐
│ 7. USER COMPLETES SETS                                      │
├─────────────────────────────────────────────────────────────┤
│ Bench Press Set 1: 135 lbs × 10 reps ✓                     │
│ Bench Press Set 2: 135 lbs × 9 reps ✓                      │
│ Bench Press Set 3: 135 lbs × 8 reps ✓                      │
│                                                              │
│ Pull-ups Set 1: 0 lbs × 10 reps ✓                          │
│ Pull-ups Set 2: 0 lbs × 9 reps ✓                           │
│ Pull-ups Set 3: 0 lbs × 8 reps ✓                           │
│                                                              │
│ EACH UPDATE:                                                 │
│ → Updates workout_log_sets in IndexedDB                     │
│ → Marks _synced: false                                      │
│ → UI updates in real-time                                   │
└─────────────────────────────────────────────────────────────┘
                        ⬇️
┌─────────────────────────────────────────────────────────────┐
│ 8. USER FINISHES WORKOUT                                    │
├─────────────────────────────────────────────────────────────┤
│ • Adds notes: "Felt strong today!"                          │
│ • Clicks "Finish"                                            │
│ • workout_log.completed_at = now                            │
│ • All data still local, will sync next interval             │
└─────────────────────────────────────────────────────────────┘
                        ⬇️
┌─────────────────────────────────────────────────────────────┐
│ 9. VIEW HISTORY                                             │
├─────────────────────────────────────────────────────────────┤
│ • Goes to "History" tab                                      │
│ • Sees workout log with stats:                              │
│   - Duration: 32 minutes                                     │
│   - Total Volume: 810 lbs                                    │
│   - All exercises and sets                                   │
│ • All from local IndexedDB (instant!)                       │
└─────────────────────────────────────────────────────────────┘
                        ⬇️
┌─────────────────────────────────────────────────────────────┐
│ 10. BACKGROUND SYNC UPLOADS EVERYTHING                     │
├─────────────────────────────────────────────────────────────┤
│ • Sync runs every 60 seconds                                │
│ • Uploads all unsynced data to Supabase                     │
│ • Now accessible from any device!                           │
│ • Data safe in cloud (backup)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### Visual Representation

```
┌─────────────┐
│  profiles   │
├─────────────┤
│ id (PK)     │─────┐
│ email       │     │
│ created_at  │     │
└─────────────┘     │
                     │
    ┌────────────────┴────────────────┐
    │                                  │
    ⬇️                                 ⬇️
┌─────────────┐                ┌──────────────┐
│  exercises  │                │   workouts   │
├─────────────┤                ├──────────────┤
│ id (PK)     │──┐             │ id (PK)      │──┐
│ user_id (FK)│  │             │ user_id (FK) │  │
│ name        │  │             │ name         │  │
│ muscle_group│  │             │ description  │  │
│ instructions│  │             └──────────────┘  │
└─────────────┘  │                               │
                  │              ┌────────────────┘
                  │              │
                  │              ⬇️
                  │      ┌────────────────────┐
                  │      │ workout_exercises  │
                  │      ├────────────────────┤
                  │      │ id (PK)            │
                  ├─────→│ exercise_id (FK)   │
                  │      │ workout_id (FK)    │
                  │      │ sets, reps, rest   │
                  │      └────────────────────┘
                  │
                  │      ┌────────────────────┐
                  │      │  workout_logs      │
                  │      ├────────────────────┤
                  │      │ id (PK)            │
                  │      │ user_id (FK)       │
                  │      │ workout_id (FK)    │
                  │      │ started_at         │
                  │      │ completed_at       │
                  │      └─────────┬──────────┘
                  │                │
                  │                ⬇️
                  │      ┌────────────────────┐
                  │      │ workout_log_sets   │
                  │      ├────────────────────┤
                  │      │ id (PK)            │
                  └─────→│ exercise_id (FK)   │
                         │ workout_log_id (FK)│
                         │ set_number         │
                         │ reps, weight       │
                         │ completed          │
                         └────────────────────┘

┌──────────────────┐
│ planned_workouts │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ workout_id (FK)  │
│ scheduled_date   │
│ completed        │
└──────────────────┘
```

---

## 🔐 Security Features

### 1. Row Level Security (RLS)

Every table in Supabase has policies that ensure users can only access their own data:

```sql
-- Example: Users can only see their own workouts
CREATE POLICY "Users can view own workouts" ON workouts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert workouts for themselves
CREATE POLICY "Users can insert own workouts" ON workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 2. JWT Authentication

```
User Login
    ⬇️
Supabase generates JWT token
    ⬇️
Token contains: { user_id, email, exp: expiration }
    ⬇️
Stored in browser (secure httpOnly cookie)
    ⬇️
Every API request includes:
  Authorization: Bearer <jwt_token>
    ⬇️
Supabase validates token before allowing access
```

### 3. Password Security

- Passwords hashed with bcrypt (never stored in plain text)
- Password reset via email token
- Minimum 6 characters enforced

---

## 🚀 Deployment Process

### Automatic Deployment (Continuous Deployment)

```
1. Developer writes code
        ⬇️
2. git add . && git commit && git push
        ⬇️
3. GitHub receives new code
        ⬇️
4. GitHub webhook notifies Vercel
        ⬇️
5. Vercel automatically:
   • Clones repository
   • npm install (installs dependencies)
   • npm run build (compiles TypeScript, bundles React)
   • Deploys to CDN
        ⬇️
6. Live in ~60 seconds!
   https://workout-tracker-v2.vercel.app
```

### Build Process Details

```bash
npm run build
  │
  ├─→ tsc (TypeScript Compiler)
  │   • Checks for type errors
  │   • Compiles .ts/.tsx to .js
  │
  └─→ vite build
      • Bundles all JavaScript
      • Minifies code
      • Optimizes images
      • Generates service worker
      • Creates dist/ folder
          ├── index.html
          ├── assets/
          │   ├── index-abc123.js (main app)
          │   ├── index-def456.css (styles)
          │   └── ...
          └── sw.js (service worker)
```

---

## 📱 Progressive Web App (PWA) Features

### What Happens When User Installs

```
1. User visits https://workout-tracker-v2.vercel.app
        ⬇️
2. Browser reads manifest.json
   {
     "name": "Workout Tracker V2",
     "display": "standalone",  ← Opens full-screen
     "icons": [...],
     "start_url": "/"
   }
        ⬇️
3. Browser shows "Install App" prompt
        ⬇️
4. User clicks "Install"
        ⬇️
5. App icon added to home screen
        ⬇️
6. When opened:
   • Full screen (no browser UI)
   • Loads instantly (cached)
   • Works offline
   • Feels like native app
```

### Service Worker Caching

```javascript
// Generated by Vite PWA plugin
self.addEventListener('install', (event) => {
  // Cache all app files
  caches.open('workout-tracker-v1').then((cache) => {
    cache.addAll([
      '/',
      '/index.html',
      '/assets/index-abc123.js',
      '/assets/index-def456.css',
      // ... all files
    ]);
  });
});

self.addEventListener('fetch', (event) => {
  // Try cache first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

---

## 🎓 Learning Resources

### Understanding the Technologies

- **React**: Component-based UI framework
  - Components are reusable pieces of UI
  - State management (data that changes)
  - Example: `WorkoutList` component displays list of workouts

- **TypeScript**: JavaScript with types
  - Catches errors before runtime
  - Example: `user_id: string` ensures it's always text

- **IndexedDB**: Browser database
  - Like SQLite in the browser
  - Stores structured data locally
  - Works offline

- **Supabase**: Backend-as-a-Service
  - Like Firebase but open-source
  - PostgreSQL database + Auth + API
  - Instant API for database tables

---

## 🏁 Summary

This Workout Tracker app demonstrates modern web development best practices:

✅ **Offline-First**: Works without internet, syncs when connected
✅ **Progressive**: Installable, app-like experience
✅ **Type-Safe**: TypeScript catches errors early
✅ **Secure**: Row-level security, JWT authentication
✅ **Scalable**: Cloud database, global CDN
✅ **Maintainable**: Well-organized code structure
✅ **Automated**: CI/CD with GitHub → Vercel

The architecture ensures users can track workouts anywhere, anytime, with their data safely stored both locally and in the cloud.

---

## 🚀 Recent Feature Additions (December 2025 - January 2026)

### Progress Tracking & Analytics
- **Charts & Visualizations**: Volume over time, workout frequency, muscle group distribution
- **Personal Records**: Automatic PR detection with estimated 1RM calculations
- **Streaks & Achievements**: 11 unlockable achievements, current/longest streak tracking
- Multi-tab progress dashboard with comprehensive statistics

### Workout Experience Enhancements
- **Custom Reps Per Set**: Different rep targets for each set (e.g., 16, 12, 8)
- **Exercise Reordering**: Drag-and-drop style reordering with up/down arrows during workout logging
- **In-Progress Workout Editing**: Add/remove exercises, add/remove sets, reorder exercises during active workouts
- **Start from Previous**: Pre-populate new workouts with previous weights/reps
- **Auto-Fill Weights**: Shows last workout data with "Use Same" and "+5 lbs" buttons
- **Bodyweight Exercises**: Hide weight input for bodyweight movements (Pull-ups, Dips, etc.)
- **Exercise Form Guides**: Form cues, common mistakes, muscle activation, safety tips
- **Real-time Saving**: All workout changes save immediately to prevent data loss

### User Interface Improvements
- **Search & Filter**: Search workouts/history, filter by date range and workout type
- **Dark/Light Themes**: Three theme modes (Auto/Light/Dark) with system preference detection
- **Text Size Controls**: Four size options (Small/Medium/Large/XL) for accessibility
- **Swipe Navigation**: Swipe left/right to navigate between tabs on mobile
- **Comprehensive Animations**: Stagger animations, card hovers, ripple effects, celebration animations
- **Input UX**: Auto-select on focus for number inputs, one-tap editing

### Workout Planning
- **Calendar View**: Visual workout planner with drag-and-drop scheduling
- **Resume In-Progress**: Automatically resumes incomplete workouts on app open
- **Workout History Editing**: Edit and delete historical workout data

---

## ⚡ Performance Considerations & Known Optimizations Needed

### Current Performance Characteristics
- **Bundle Size**: ~856KB (gzipped: ~249KB) - larger than ideal due to Recharts library
- **Database Queries**: 31+ useLiveQuery calls across components
- **Offline Performance**: Excellent - all data cached locally in IndexedDB
- **Sync Performance**: Runs every 60 seconds, sequential uploads per entity type

### Identified Optimization Opportunities

#### High Priority
1. **Code Splitting**: Implement lazy loading for routes and heavy components (Progress charts)
   - Expected Impact: 40-60% reduction in initial bundle size
   - Strategy: React.lazy() for dashboard, history, and chart components

2. **Database Query Optimization**: Use bulk queries instead of nested loops
   - Current Issue: O(n²) queries in ProgressDashboard and PersonalRecords
   - Expected Impact: 10-100x faster on large datasets
   - Strategy: Use `.anyOf()` for batch queries, create lookup maps

3. **Batch Sync Operations**: Upload multiple records in single API calls
   - Current Issue: Sequential upserts, one per record
   - Expected Impact: 5-10x faster sync, 90% fewer network calls
   - Strategy: Use Supabase batch upsert API

4. **Database Indexes**: Add compound indexes for common query patterns
   - Missing: `[user_id+completed_at]`, `[workout_log_id+exercise_id]`
   - Expected Impact: Dramatically faster history queries and filtering

#### Medium Priority
5. **Memoization**: Add React.memo() to list items and heavy computation results
6. **Search Debouncing**: Prevent re-renders on every keystroke (300ms delay)
7. **Optimistic UI Updates**: Update UI immediately, rollback on error
8. **Shared Data Hooks**: Consolidate duplicate useLiveQuery calls into custom hooks

#### Low Priority (Polish)
9. **Skeleton Screens**: Replace "Loading..." with animated skeletons
10. **Custom Modals**: Replace browser alert()/confirm() with themed modals
11. **Progressive Image Loading**: Blur-up effect for exercise images
12. **Service Worker Optimization**: Improve cache strategy and versioning

### Security Note
⚠️ **Action Required**: Supabase credentials currently in source code should be moved to environment variables (.env file) for production deployments.

---

## 📞 Need Help?

- **Issues/Bugs**: https://github.com/pr103183/Workout_Tracker_V2/issues
- **Supabase Dashboard**: https://iqavqgnbviuzmvzwiiqg.supabase.co
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Live App**: https://workout-tracker-v2.vercel.app

---

**Last Updated**: February 5, 2026
**Version**: 2.0.2
**Author**: Built with Claude Code

---

## 🐛 Recent Bug Fixes (February 5, 2026)

### Critical Fixes (v2.0.2)

1. **Persistent In-Progress Workout Bug - Complete Fix**
   - **Issue**: Cancelled workouts would reappear on every app open because they were only deleted from local IndexedDB but still existed in Supabase. The sync service would re-pull them from remote.
   - **Root Cause**: `handleCancelWorkout()` only deleted from local DB; sync would restore from remote
   - **Fix**: Added Supabase delete calls before local deletes to remove from both local AND remote databases
   - **Additional Fix**: Added orphan cleanup in resume flow - if a workout log references a deleted workout, clean it up from both local and remote
   - **File**: src/components/WorkoutLog/LogWorkout.tsx:309-334

2. **Bodyweight Exercises Showing Weight Input - Complete Fix**
   - **Issue**: Weight input would appear for bodyweight exercises after sync because the `is_bodyweight` field was being overwritten
   - **Root Cause**: The Supabase `exercises` table doesn't have an `is_bodyweight` column. When sync pulled remote data and did `db.exercises.put()`, it overwrote local records, losing the `is_bodyweight` field
   - **Fix**: Updated `syncExercises()` to merge remote data with existing local records instead of overwriting, preserving local-only fields like `is_bodyweight`
   - **File**: src/lib/sync.ts:46-57

3. **Duplicate Exercises in Workout Log - Complete Fix**
   - **Issue**: Same exercise would appear multiple times in workout log
   - **Root Cause**: `workout_exercises` table could contain duplicate entries for the same `exercise_id` after sync
   - **Fix**: Added proactive deduplication during workout load and resume - detects duplicates, deletes extras from DB, and keeps only unique entries
   - **Files**: src/components/WorkoutLog/LogWorkout.tsx:81-102, 148-169

### Previous Fixes (January 12, 2026)

4. **Persistent In-Progress Workout Bug (Partial)**
   - **Issue**: Workouts would reappear after pressing "Cancel" due to incomplete state cleanup
   - **Fix**: Added `setWorkoutExercises([])` to `handleCancelWorkout()` to clear all state
   - **Note**: This was later discovered to be incomplete - see fix #1 above
   - **File**: src/components/WorkoutLog/LogWorkout.tsx:295

2. **Set Ordering Issues**
   - **Issue**: Sets displayed in random order (3,2,1 or 1,3,2) due to missing numeric sort
   - **Fix**: Changed `.sort((a, b) => a.set_number - b.set_number)` to `Number(a.set_number) - Number(b.set_number)` to ensure numeric comparison
   - **File**: src/components/WorkoutLog/LogWorkout.tsx:546

3. **Duplicate Exercises in Workout Log**
   - **Issue**: Same exercise appeared multiple times due to duplicate workout_exercises entries
   - **Fix**: Added deduplication using Map and changed React key from `index` to `exercise_id`
   - **Files**: src/components/WorkoutLog/LogWorkout.tsx:537-540, 581

4. **Bodyweight Exercises Showing Weight Input**
   - **Issue**: Weight input appeared for bodyweight exercises (Pull-ups, Dips) when exercise object wasn't loaded
   - **Fix**: Improved conditional check from `!exercise?.is_bodyweight` to `exercise && !exercise.is_bodyweight`
   - **File**: src/components/WorkoutLog/LogWorkout.tsx:724

### Feature Additions
5. **Exercise Reordering During Workouts**
   - **Added**: Up/Down arrow buttons to reorder exercises during active workout logging
   - **Implementation**: `handleMoveExercise()` function updates order_index and persists to database
   - **Files**: src/components/WorkoutLog/LogWorkout.tsx:415-441, 618-632

6. **Real-time Set Editing**
   - **Enhancement**: `handleUpdateSet()` now saves changes immediately to database instead of only on blur
   - **Benefit**: Prevents data loss if user navigates away before field loses focus
   - **File**: src/components/WorkoutLog/LogWorkout.tsx:227-240
