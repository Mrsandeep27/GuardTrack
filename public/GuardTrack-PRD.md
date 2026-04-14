# GuardTrack — Product Requirements Document (PRD)

**Product Name:** GuardTrack — Mini Guard Tracking System
**Version:** 1.0
**Author:** Sandeep Pandey
**Date:** April 15, 2026
**Status:** Assignment — NammaRaksham AI
**Deadline:** April 16, 2026 — 8PM

---

## 1. Task Summary

Build a mini guard tracking system with:
- Check-in / Check-out (timestamp + location)
- Mobile-friendly interface (must work on phone)
- Admin dashboard (guard status + last check-in)
- Attendance logs (check-in/out + total hours)
- Basic APIs

**Bonus:** Real-time updates, offline support, smart insights

---

## 2. Tech Stack

| Layer | Tech | Why |
|-------|------|-----|
| Frontend | React 19 + Vite + Tailwind CSS + shadcn/ui | Fast to build, mobile-first |
| Backend | Supabase (PostgreSQL + Auth + Realtime) | Zero backend code, free, instant APIs |
| Auth | Supabase Auth (email/password) | Guard login + Admin login |
| Location | Browser Geolocation API | Get lat/lng on check-in |
| Maps | Leaflet.js (free, no API key) | Show guard location on admin dashboard |
| Realtime | Supabase Realtime | Live guard status updates (bonus) |
| Offline | Service Worker + IndexedDB | Offline check-in queue (bonus) |
| Deploy | Vercel | Free, instant deploy |
| PWA | manifest.json + service worker | Mobile install (bonus) |

**Total cost: ₹0**

---

## 3. User Roles

| Role | Can Do |
|------|--------|
| **Guard** | Check-in, check-out, view own attendance log |
| **Admin** | View all guards, live status, attendance logs, insights |

---

## 4. Database Schema

```sql
-- Users (guards + admins)
profiles (
  id          UUID PK REFERENCES auth.users(id),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) NOT NULL,
  phone       VARCHAR(15),
  role        VARCHAR(10) NOT NULL DEFAULT 'guard',  -- 'guard' | 'admin'
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW()
)

-- Check-in / Check-out records
attendance (
  id            UUID PK DEFAULT gen_random_uuid(),
  guard_id      UUID NOT NULL REFERENCES profiles(id),
  check_in      TIMESTAMP NOT NULL DEFAULT NOW(),
  check_out     TIMESTAMP,
  check_in_lat  DECIMAL(10,7),
  check_in_lng  DECIMAL(10,7),
  check_out_lat DECIMAL(10,7),
  check_out_lng DECIMAL(10,7),
  total_hours   DECIMAL(5,2),  -- auto-calculated on check-out
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
)

-- Indexes
CREATE INDEX idx_attendance_guard ON attendance(guard_id);
CREATE INDEX idx_attendance_checkin ON attendance(check_in);
```

---

## 5. API Endpoints

```
Auth:
  POST   /auth/signup          -- register guard/admin
  POST   /auth/login           -- email + password login
  POST   /auth/logout          -- logout

Guard APIs:
  POST   /api/check-in         -- guard checks in (lat, lng, timestamp)
  POST   /api/check-out        -- guard checks out (lat, lng, timestamp)
  GET    /api/my-status        -- current check-in status (active or not)
  GET    /api/my-attendance     -- guard's own attendance log

Admin APIs:
  GET    /api/guards            -- list all guards with current status
  GET    /api/guards/:id        -- single guard detail + attendance
  GET    /api/attendance        -- all attendance logs (filterable by date, guard)
  GET    /api/dashboard         -- summary stats (total guards, active now, avg hours)
  GET    /api/insights          -- smart insights (bonus)
```

All APIs are Supabase client calls — no separate backend server needed.

---

## 6. Pages & Screens

### Guard Side (Mobile-First)

```
/login
  Email + Password login
  Role auto-detected from profile

/guard/dashboard
  +---------------------------+
  | Good morning, Rajesh      |
  | Status: NOT CHECKED IN    |
  |                           |
  | [  CHECK IN  ]  (big btn) |
  |                           |
  | Today: --                 |
  | This week: 32.5 hrs       |
  +---------------------------+

  After check-in:
  +---------------------------+
  | Status: CHECKED IN        |
  | Since: 9:02 AM            |
  | Duration: 3h 15m (live)   |
  | Location: 12.97°N 77.59°E|
  |                           |
  | [  CHECK OUT  ] (big btn) |
  +---------------------------+

/guard/attendance
  +---------------------------+
  | My Attendance             |
  | April 2026                |
  |                           |
  | 15 Apr  9:02AM - 6:15PM  |
  |         9h 13m            |
  | 14 Apr  8:45AM - 5:30PM  |
  |         8h 45m            |
  | 13 Apr  9:10AM - 6:00PM  |
  |         8h 50m            |
  | ...                       |
  |                           |
  | Total this month: 142.5h  |
  +---------------------------+
```

### Admin Side

```
/admin/dashboard
  +------------------------------------------+
  | GuardTrack Admin                         |
  |                                          |
  | [12] Total Guards  [8] Active Now        |
  | [4] Not Checked In [7.8h] Avg Today      |
  |                                          |
  | Live Guard Status:                       |
  | +--------------------------------------+ |
  | | [green] Rajesh   IN  since 9:02 AM   | |
  | | [green] Amit     IN  since 8:45 AM   | |
  | | [green] Priya    IN  since 9:15 AM   | |
  | | [red]   Suresh   OUT last: yesterday | |
  | | [red]   Mohan    OUT last: 2 days ago| |
  | +--------------------------------------+ |
  |                                          |
  | [View Map] [View Logs] [Insights]        |
  +------------------------------------------+

/admin/guards
  All guards list with:
  - Name, phone, current status
  - Last check-in time + location
  - Total hours this week/month

/admin/attendance
  Full attendance logs table:
  - Filter by guard, date range
  - Export to CSV
  - Check-in time, check-out time, total hours, location

/admin/map (bonus)
  Leaflet map showing:
  - Green pin = currently checked in (with name)
  - Red pin = last known location (checked out)

/admin/insights (bonus)
  - Guard with most hours this week
  - Guard with least hours
  - Average check-in time
  - Late arrivals (after 9 AM)
  - Overtime guards (> 10 hours)
```

---

## 7. Core Logic

### Check-In Flow
```
Guard taps "CHECK IN"
  → Browser requests geolocation (lat, lng)
  → If location denied → still allow check-in (lat/lng = null)
  → Insert into attendance: guard_id, check_in = NOW(), lat, lng
  → UI updates: "CHECKED IN since 9:02 AM"
  → Supabase Realtime: admin dashboard updates live (bonus)
```

### Check-Out Flow
```
Guard taps "CHECK OUT"
  → Browser requests geolocation
  → Update attendance row: check_out = NOW(), lat, lng
  → Calculate total_hours = (check_out - check_in) in hours
  → UI updates: "CHECKED OUT — 8h 45m today"
  → Supabase Realtime: admin sees guard go offline (bonus)
```

### Total Hours Calculation
```sql
total_hours = EXTRACT(EPOCH FROM (check_out - check_in)) / 3600
-- Rounded to 2 decimal places
-- Example: 9:00 AM to 5:30 PM = 8.50 hours
```

### Guard Status Logic
```
Guard has attendance row WHERE:
  check_in IS NOT NULL AND check_out IS NULL AND DATE(check_in) = TODAY
  → Status: ACTIVE (green)

Otherwise:
  → Status: INACTIVE (red)
  → Show last check-out time
```

---

## 8. Bonus Features

### 8.1 Real-Time Updates (Supabase Realtime)
```javascript
// Admin subscribes to attendance changes
supabase
  .channel('attendance')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' },
    (payload) => {
      // Update guard status in real-time on admin dashboard
      updateGuardStatus(payload.new);
    }
  )
  .subscribe();
```

### 8.2 Offline Support
```
Guard is offline → taps CHECK IN
  → Save to IndexedDB: { action: 'check-in', timestamp: NOW(), lat, lng }
  → Show: "Checked in (offline — will sync)"

When back online:
  → Push all queued actions to Supabase
  → Clear IndexedDB queue
  → Show: "Synced ✓"
```

### 8.3 Smart Insights
```
Insights for admin:
  1. "Rajesh has averaged 9.2 hours/day this week — highest performer"
  2. "Suresh has not checked in for 2 days"
  3. "3 guards checked in late (after 9:30 AM) today"
  4. "Average shift duration: 8.1 hours"
  5. "Total man-hours this week: 285 hours"
```

---

## 9. Project Structure

```
GuardTrack/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── public/
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── lib/
│   │   ├── supabase.ts          -- Supabase client
│   │   ├── auth.ts              -- Auth helpers
│   │   └── utils.ts             -- cn(), formatTime(), etc.
│   ├── stores/
│   │   └── auth-store.ts        -- Zustand auth state
│   ├── components/
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── bottom-nav.tsx   -- Guard mobile nav
│   │   │   └── sidebar.tsx      -- Admin sidebar
│   │   ├── guard/
│   │   │   ├── check-in-button.tsx
│   │   │   ├── status-card.tsx
│   │   │   └── attendance-list.tsx
│   │   ├── admin/
│   │   │   ├── stats-cards.tsx
│   │   │   ├── guard-list.tsx
│   │   │   ├── guard-map.tsx
│   │   │   ├── attendance-table.tsx
│   │   │   └── insights-panel.tsx
│   │   └── ui/                  -- shadcn components
│   ├── pages/
│   │   ├── login.tsx
│   │   ├── guard/
│   │   │   ├── dashboard.tsx
│   │   │   └── attendance.tsx
│   │   └── admin/
│   │       ├── dashboard.tsx
│   │       ├── guards.tsx
│   │       ├── attendance.tsx
│   │       ├── map.tsx
│   │       └── insights.tsx
│   └── hooks/
│       ├── use-auth.ts
│       ├── use-attendance.ts
│       ├── use-guards.ts
│       ├── use-location.ts
│       └── use-realtime.ts
└── supabase/
    ├── schema.sql               -- Database schema
    └── seed.sql                 -- Demo data (12 guards)
```

---

## 10. Seed Data (For Demo)

```sql
-- Admin user
INSERT INTO profiles (id, name, email, role) VALUES
  ('admin-uuid', 'Admin', 'admin@guardtrack.com', 'admin');

-- 12 Guards
INSERT INTO profiles (id, name, email, phone, role) VALUES
  ('g1', 'Rajesh Kumar',    'rajesh@demo.com',    '9876543210', 'guard'),
  ('g2', 'Amit Singh',      'amit@demo.com',      '9876543211', 'guard'),
  ('g3', 'Priya Sharma',    'priya@demo.com',     '9876543212', 'guard'),
  ('g4', 'Suresh Reddy',    'suresh@demo.com',    '9876543213', 'guard'),
  ('g5', 'Mohan Patel',     'mohan@demo.com',     '9876543214', 'guard'),
  ('g6', 'Deepa Nair',      'deepa@demo.com',     '9876543215', 'guard'),
  ('g7', 'Vikram Joshi',    'vikram@demo.com',    '9876543216', 'guard'),
  ('g8', 'Anita Gupta',     'anita@demo.com',     '9876543217', 'guard'),
  ('g9', 'Ravi Prasad',     'ravi@demo.com',      '9876543218', 'guard'),
  ('g10', 'Kavita Devi',    'kavita@demo.com',    '9876543219', 'guard'),
  ('g11', 'Manoj Tiwari',   'manoj@demo.com',     '9876543220', 'guard'),
  ('g12', 'Sunita Rao',     'sunita@demo.com',    '9876543221', 'guard');

-- Sample attendance data (last 7 days)
-- 8 guards checked in today, 4 not checked in
INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) VALUES
  ('g1', NOW() - INTERVAL '3 hours', NULL, 12.9716, 77.5946, NULL),  -- currently active
  ('g2', NOW() - INTERVAL '4 hours', NULL, 12.9352, 77.6245, NULL),  -- currently active
  ('g3', NOW() - INTERVAL '2 hours', NULL, 12.9698, 77.7500, NULL),  -- currently active
  ('g5', NOW() - INTERVAL '5 hours', NULL, 13.0358, 77.5970, NULL),  -- currently active
  ('g6', NOW() - INTERVAL '1 hour',  NULL, 12.8438, 77.6630, NULL),  -- currently active
  ('g7', NOW() - INTERVAL '6 hours', NULL, 13.1986, 77.7066, NULL),  -- currently active
  ('g9', NOW() - INTERVAL '3 hours', NULL, 12.9141, 77.6411, NULL),  -- currently active
  ('g10', NOW() - INTERVAL '2 hours', NULL, 12.9784, 77.5712, NULL); -- currently active

-- Yesterday's completed shifts
INSERT INTO attendance (guard_id, check_in, check_out, check_in_lat, check_in_lng, total_hours) VALUES
  ('g1', NOW() - INTERVAL '1 day 9 hours', NOW() - INTERVAL '1 day 0.5 hours', 12.9716, 77.5946, 8.50),
  ('g2', NOW() - INTERVAL '1 day 9.5 hours', NOW() - INTERVAL '1 day 1 hour', 12.9352, 77.6245, 8.50),
  ('g3', NOW() - INTERVAL '1 day 8 hours', NOW() - INTERVAL '1 day 0 hours', 12.9698, 77.7500, 8.00),
  ('g4', NOW() - INTERVAL '1 day 9 hours', NOW() - INTERVAL '1 day 0.25 hours', 13.0827, 77.5877, 8.75),
  ('g5', NOW() - INTERVAL '1 day 10 hours', NOW() - INTERVAL '1 day 1 hour', 13.0358, 77.5970, 9.00);
```

---

## 11. Build Plan (8-10 Hours)

| Phase | Time | Tasks |
|-------|------|-------|
| **1. Setup** | 30 min | Vite + React + Tailwind + Supabase project. Create DB schema. |
| **2. Auth** | 1 hr | Login page, Supabase auth, role-based routing (guard vs admin). |
| **3. Guard Check-In/Out** | 2 hr | Check-in button, geolocation, check-out, status display, live timer. |
| **4. Guard Attendance** | 1 hr | Guard's own attendance log list with dates and hours. |
| **5. Admin Dashboard** | 2 hr | Stats cards, guard list with live status, last check-in. |
| **6. Admin Attendance** | 1 hr | Full attendance table, filter by guard/date, total hours. |
| **7. Bonus: Realtime** | 30 min | Supabase Realtime subscription on admin dashboard. |
| **8. Bonus: Map** | 30 min | Leaflet map with guard pins on admin. |
| **9. Bonus: Insights** | 30 min | Top performer, late arrivals, avg hours, no-shows. |
| **10. Deploy + Seed** | 30 min | Vercel deploy, seed demo data, test on phone. |
| **Total** | **~10 hrs** | |

---

## 12. What Makes This Stand Out

| Feature | Why It Impresses |
|---------|-----------------|
| **Supabase Realtime** | Admin sees guards check in/out LIVE — no refresh needed |
| **Leaflet Map** | Visual proof of where guards are — not just timestamps |
| **Offline queue** | Guard in basement with no signal? Check-in saved, syncs later |
| **Smart insights** | "3 guards were late today" — shows analytical thinking |
| **PWA installable** | Guard adds to phone home screen — feels like native app |
| **Seed data** | Demo has 12 guards with realistic data — evaluator sees a working system immediately |
| **Mobile-first** | Designed for phone FIRST — exactly what they asked |
| **Clean code** | TypeScript, proper folder structure, reusable hooks — shows engineering maturity |

---

## 13. Demo Credentials (For Walkthrough Video)

```
Admin:
  Email: admin@guardtrack.com
  Password: admin123

Guard:
  Email: rajesh@demo.com
  Password: guard123
```

---

*Assignment by NammaRaksham AI Private Limited*
*Built by Sandeep Pandey*
*Deadline: April 16, 2026 — 8PM*
