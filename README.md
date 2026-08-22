# EduConnect GH

**Education Process & Academic Management Portal for Ghanaian tertiary institutions.**

A production-ready full-stack web app (installable as a PWA) for tracking academic processes, course materials, fee status, and announcements. Built for two roles: **Students** and **Lecturers/Admins**.

---

## Stack

| Layer      | Tech                                                              |
| ---------- | ------------------------------------------------------------------ |
| Frontend   | React (Vite), Tailwind CSS, Lucide React, React Router             |
| PWA        | Web App Manifest, custom Service Worker, iOS Safari meta tags      |
| Backend    | Node.js, Express.js                                                 |
| Database   | MongoDB + Mongoose                                                  |
| Auth       | JWT (JSON Web Tokens), bcrypt password hashing                      |
| Deployment | Netlify (frontend) + Render (backend) + MongoDB Atlas (database)    |

---

## Project Structure

```
educonnect-gh/
├── backend/
│   ├── config/db.js                 # MongoDB connection
│   ├── models/                      # Mongoose schemas
│   │   ├── User.js                  # students, lecturers, admins
│   │   ├── Process.js               # academic process requests
│   │   ├── Announcement.js          # broadcast notices
│   │   ├── CourseMaterial.js        # lecturer-uploaded resources
│   │   └── FeeStatus.js             # per-semester billing (GHS)
│   ├── controllers/                 # business logic
│   ├── routes/                      # express.Router() per resource
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification (protect)
│   │   ├── roleMiddleware.js        # role-based access (authorize)
│   │   └── errorMiddleware.js       # centralized error handling
│   ├── utils/
│   │   ├── generateToken.js
│   │   └── seeder.js                # creates the first admin account
│   ├── server.js                    # app entry point
│   └── package.json
│
└── frontend/
    ├── public/
    │   ├── manifest.json            # PWA manifest
    │   ├── sw.js                    # service worker (offline support)
    │   ├── offline.html             # offline fallback page
    │   └── icons/                   # app icons (incl. maskable + apple-touch)
    ├── src/
    │   ├── api/axios.js             # configured API client
    │   ├── context/AuthContext.jsx  # persistent JWT auth state
    │   ├── components/
    │   │   ├── layout/              # Navbar, Sidebar, DashboardLayout
    │   │   ├── auth/                # LoginForm, SignupForm
    │   │   ├── student/             # StudentDashboard, FeeStatusCard, ...
    │   │   ├── lecturer/            # LecturerDashboard, ManageStudents, ...
    │   │   └── shared/              # AnnouncementsFeed, ProtectedRoute, ...
    │   ├── pages/                   # route-level pages
    │   ├── utils/constants.js
    │   ├── App.jsx                  # route definitions
    │   └── main.jsx                 # entry point + SW registration
    ├── index.html                   # iOS PWA meta tags live here
    └── package.json
```

---

## Local Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGO_URI (MongoDB Atlas connection string) and JWT_SECRET
npm install
npm run dev          # starts on http://localhost:5000
```

Create the first admin account (needed to log in as staff and create lecturer accounts):

```bash
# Optionally set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD env vars first
npm run seed
```

> **Note on roles:** `POST /api/auth/register` is intentionally **student-only** — anyone who signs up publicly becomes a student. Lecturer and admin accounts can only be created by an existing admin via `POST /api/users`, or by the seeder script above. This prevents a public signup form from being used to self-grant staff access.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env: set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev           # starts on http://localhost:5173
```

---

## API Overview

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Method | Route                                | Access            | Description                          |
| ------ | ------------------------------------- | ------------------ | ------------------------------------- |
| POST   | `/auth/register`                      | Public              | Student self-registration             |
| POST   | `/auth/login`                         | Public              | Login (any role)                      |
| GET    | `/auth/me`                            | Private             | Current user profile                  |
| POST   | `/process`                            | Student             | Submit a process request              |
| GET    | `/process`                            | Private             | List requests (own, or all for staff) |
| PUT    | `/process/:id`                        | Lecturer/Admin      | Approve / reject / update remarks     |
| GET    | `/process/dashboard-summary`          | Student             | Dashboard summary (counts + fees)     |
| POST   | `/announcements`                      | Lecturer/Admin      | Broadcast a notice                    |
| GET    | `/announcements`                      | Private             | List announcements                    |
| POST   | `/materials`                          | Lecturer/Admin      | Add a course resource (link-based)    |
| GET    | `/materials`                          | Private             | List/filter course materials          |
| GET    | `/users`                              | Lecturer/Admin      | List/search student & staff records   |
| POST   | `/users`                              | Admin               | Create a lecturer/admin account       |
| PUT    | `/users/:id`                          | Admin               | Update a user record                  |
| POST   | `/users/:id/fees`                     | Admin               | Set/update a fee bill for a student   |
| POST   | `/users/:id/fees/:feeId/payments`     | Admin               | Record a payment                      |

---

## Deployment

### Backend → Render

1. Push `backend/` to a GitHub repo (or the whole monorepo, setting Render's **Root Directory** to `backend`).
2. Create a new **Web Service** on Render, connect the repo.
3. Build command: `npm install` · Start command: `npm start`.
4. Add environment variables from `.env.example` (`MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL` — set this to your Netlify URL once you have it, comma-separated if you need more than one origin).
5. Deploy. Note the resulting URL, e.g. `https://educonnect-gh-api.onrender.com`.
6. Run the seeder once via Render's Shell tab: `npm run seed`.

### Frontend → Netlify

1. Push `frontend/` to a repo (or set **Base directory** to `frontend` in a monorepo).
2. Build command: `npm run build` · Publish directory: `dist`.
3. Add environment variable `VITE_API_URL` = `https://<your-render-service>.onrender.com/api`.
4. Add a `_redirects` file behavior for SPA routing — Netlify needs all paths to fall back to `index.html`. Create `frontend/public/_redirects` containing:
   ```
   /*  /index.html  200
   ```
5. Deploy. Once you have the Netlify URL, go back to Render and update `CLIENT_URL` to match (exact origin, no trailing slash), then redeploy the backend so CORS allows it.

### MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a database user and allow network access from `0.0.0.0/0` (or Render's static IPs if you upgrade).
3. Copy the connection string into `MONGO_URI`.

---

## PWA Notes

- **iOS Safari:** Uses `apple-mobile-web-app-capable`, `apple-touch-icon`, and status bar meta tags in `index.html`. On iOS, users install via Share → "Add to Home Screen" (iOS does not support the `beforeinstallprompt` auto-prompt).
- **Desktop Chrome / Android:** `manifest.json` + service worker satisfy installability criteria; Chrome will offer an install icon in the address bar automatically.
- **Offline:** `sw.js` pre-caches the app shell, uses network-first for page navigations (falling back to the cached shell or `offline.html`), cache-first for static assets, and network-only for `/api/*` calls (with a graceful offline JSON response rather than stale data).

---

## Security Notes for Production

- Change the seeded admin password immediately after first login.
- Rotate `JWT_SECRET` to a long, random value before going live.
- `CLIENT_URL` should list only real, trusted origins — the CORS middleware rejects anything not on that list.
- Rate limiting is enabled globally (`/api/*`) and more strictly on `/api/auth/login` and `/api/auth/register`.
