```markdown
# EduConnect GH 🎓

**Education Process & Academic Management Portal for Ghanaian tertiary institutions.**

A production-ready full-stack web application (installable as a Progressive Web App / PWA) for tracking academic requests, course materials, fee billing statuses, and institutional announcements. Designed with strict role-based workflows for **Students**, **Lecturers**, and **Administrators**.

---

## 🚀 Live Demos

* **Web App (PWA):** Deployed on [Netlify](https://smefinancehub.netlify.app/)
* **Backend API:** Hosted on [Render](https://educonnect-gh.onrender.com)
* **Database:** MongoDB Atlas

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React (Vite), Tailwind CSS, Lucide React, React Router |
| **PWA Layer** | Web App Manifest, Custom Service Worker (`sw.js`), iOS Safari Meta Tags |
| **Backend API** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose ORM |
| **Auth & Security** | JWT (JSON Web Tokens), bcrypt password hashing, Express Rate Limit |
| **Deployment** | Netlify (Frontend) + Render (Backend) + MongoDB Atlas (Database) |

---

## 📂 Project Structure

```text
educonnect-gh/
├── backend/
│   ├── config/
│   │   └── db.js                    # MongoDB connection configuration
│   ├── models/                      # Mongoose schemas
│   │   ├── User.js                  # Students, Lecturers, Admins
│   │   ├── Process.js               # Academic process requests
│   │   ├── Announcement.js          # Broadcast notices
│   │   ├── CourseMaterial.js        # Resource links & documents
│   │   └── FeeStatus.js             # Per-semester billing (GHS)
│   ├── controllers/                 # Route handler logic
│   ├── routes/                      # Express routers per resource
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification (protect)
│   │   ├── roleMiddleware.js        # Role-based authorization
│   │   └── errorMiddleware.js       # Centralized error handler
│   ├── utils/
│   │   ├── generateToken.js         # JWT signing helper
│   │   └── seeder.js                # Initial admin account seeder
│   ├── .env.example
│   ├── server.js                    # Express app entry point
│   └── package.json
│
└── frontend/
    ├── public/
    │   ├── _redirects               # SPA routing rule for Netlify
    │   ├── manifest.json            # PWA Web App Manifest
    │   ├── sw.js                    # Custom Service Worker (offline caching)
    │   ├── offline.html             # Offline fallback page
    │   └── icons/                   # App icons (maskable & apple-touch)
    ├── src/
    │   ├── api/
    │   │   └── axios.js             # Configured Axios API client
    │   ├── context/
    │   │   └── AuthContext.jsx      # Persistent Auth state
    │   ├── components/
    │   │   ├── layout/              # Navbar, Sidebar, DashboardLayout
    │   │   ├── auth/                # LoginForm, SignupForm
    │   │   ├── student/             # StudentDashboard, FeeStatusCard, etc.
    │   │   ├── lecturer/            # LecturerDashboard, ManageStudents, etc.
    │   │   └── shared/              # AnnouncementsFeed, ProtectedRoute, etc.
    │   ├── pages/                   # Route-level view components
    │   ├── utils/
    │   │   └── constants.js         # Shared application constants
    │   ├── App.jsx                  # React Router definitions
    │   └── main.jsx                 # Entry point & SW registration
    ├── index.html                   # HTML shell with iOS PWA meta tags
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js

```

---

## ⚡ Getting Started Locally

### Prerequisites

* **Node.js** (v18 or higher)
* **MongoDB** instance — local (`127.0.0.1:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

---

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
npm install

```

Configure `.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5173

```

Seed the initial admin account:

```bash
npm run seed

```

Start the API in development mode:

```bash
npm run dev

```

> 🔒 **Role Guard Rule:** Public registration (`POST /api/auth/register`) is **student-only** by design. Lecturer and Admin accounts can only be provisioned by an existing Admin via `POST /api/users` or via the initial seed script (`npm run seed`).

---

### 2. Frontend Setup

In a new terminal:

```bash
cd frontend
cp .env.example .env
npm install

```

Configure `.env`:

```env
VITE_API_URL=http://localhost:5000/api

```

Start the Vite dev server:

```bash
npm run dev

```

Open `http://localhost:5173` in your browser.

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>` header.

| Method | Route | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Student self-registration |
| POST | `/auth/login` | Public | Authenticate user (any role) & receive JWT |
| GET | `/auth/me` | Private | Fetch active user profile |
| POST | `/process` | Student | Submit an academic process request |
| GET | `/process` | Private | List requests (own for students, all for staff) |
| PUT | `/process/:id` | Lecturer/Admin | Approve, reject, or add remarks to a request |
| GET | `/process/dashboard-summary` | Student | Fetch student summary metrics & fee status |
| POST | `/announcements` | Lecturer/Admin | Broadcast an institutional announcement |
| GET | `/announcements` | Private | List active announcements |
| POST | `/materials` | Lecturer/Admin | Upload/link a course learning resource |
| GET | `/materials` | Private | List & filter course materials |
| GET | `/users` | Lecturer/Admin | List/search student & staff directory |
| POST | `/users` | Admin | Create a Lecturer or Admin account |
| PUT | `/users/:id` | Admin | Update user record details |
| POST | `/users/:id/fees` | Admin | Issue/update fee bill for a student |
| POST | `/users/:id/fees/:feeId/payments` | Admin | Record a payment towards a fee bill |

---

## 🌐 Deployment Instructions

### Backend (Render)

1. Set the **Root Directory** to `backend`.
2. Build command: `npm install` · Start command: `npm start`.
3. Set environment variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and `CLIENT_URL` (your deployed Netlify frontend URL).
4. Run the admin seeder script via Render Shell: `npm run seed`.

### Frontend (Netlify)

1. Set the **Base directory** to `frontend`.
2. Build command: `npm run build` · Publish directory: `dist`.
3. Set environment variable: `VITE_API_URL` = `https://<your-render-api>.onrender.com/api`.
4. Ensure `public/_redirects` exists with `/*  /index.html  200` to handle SPA page refreshes.

---

## 📱 Progressive Web App (PWA) Features

* **iOS Safari Integration:** Configured with `apple-mobile-web-app-capable`, status bar style meta tags, and `apple-touch-icon` links in `index.html`.
* **Android & Desktop Chrome:** `manifest.json` provides standard installation metadata and triggers address bar install prompts.
* **Service Worker Caching (`sw.js`):**
* **App Shell & Assets:** Pre-cached for quick load times and cache-first static delivery.
* **Navigation Requests:** Network-first fallback to cached shell or custom `offline.html`.
* **API Requests:** Network-only handling with a JSON offline response to avoid rendering stale database data.



---

## 🔐 Production Security Measures

* Change the default seeded admin password immediately after first login.
* Use a long, cryptographically secure string for `JWT_SECRET`.
* Enforce `CLIENT_URL` CORS settings to whitelist only trusted frontend origins.
* Rate limiting is configured globally on `/api/*` with elevated protection on authentication routes.

---

## 👤 Author

**Winfred Manu**

* **GitHub:** [@badjuvi6](https://www.google.com/search?q=https://github.com/badjuvi6)
* **Institution:** Ghana Communication Technology University (GCTU)

```

```
