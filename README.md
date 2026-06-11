# UniLab — University Laboratory Management System

A full-stack web application for managing university labs, built with **React**, **Node.js/Express**, and **MongoDB**.

---

## 🏗️ Project Structure

```
unilab/
├── backend/               # Node.js + Express API
│   ├── models/            # Mongoose schemas
│   │   ├── User.js
│   │   ├── Lab.js
│   │   ├── StudentBatch.js
│   │   └── Booking.js
│   ├── routes/            # Express route handlers
│   │   ├── auth.js
│   │   ├── admin.js
│   │   ├── lecturer.js
│   │   ├── labAssistant.js
│   │   └── student.js
│   ├── middleware/
│   │   └── auth.js        # JWT + role middleware
│   ├── server.js          # Entry point
│   └── .env               # Environment config
│
└── frontend/              # React app
    └── src/
        ├── components/common/   # UI primitives + Layout/Sidebar
        ├── context/             # Auth + Toast context
        ├── pages/               # AdminPages, LecturerPages, etc.
        ├── utils/api.js         # Axios instance
        └── App.js               # Router + protected routes
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js >= 16
- MongoDB (local) **or** MongoDB Atlas account

---

### 1. Backend Setup

```bash
cd backend
npm install
```

Edit `.env` to match your setup:

```env
PORT=5000

# LOCAL MongoDB:
MONGODB_URI=mongodb://localhost:27017/unilab

# OR MongoDB Atlas:
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/unilab?retryWrites=true&w=majority

JWT_SECRET=unilab_super_secret_jwt_key_2024

# Admin bootstrap credentials
ADMIN_EMAIL=tharakarusiru6@gmail.com
ADMIN_PASSWORD=12345678
```

Start the backend:
```bash
npm run dev    # development (nodemon)
# or
npm start      # production
```

The admin account is **automatically created** on first startup.

---

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Edit `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm start
```

Open **http://localhost:3000**

---

## 🔑 System Roles

| Role | Access | Registration |
|------|--------|-------------|
| **Admin** | Full system control | Auto-seeded (email above) |
| **Lecturer** | Book labs, view requests | Register → Admin approval required |
| **Lab Assistant** | Approve/reject requests | Register → Admin approval required |
| **Student** | View assigned sessions | Register (auto-approved) |

---

## 📋 Feature Summary

### Admin (`/admin`)
- **Dashboard** — Stats, recent bookings
- **User Management** — Approve/reject lecturer & lab assistant accounts, activate/deactivate any user
- **Lab Management** — Create labs with location, capacity, equipment; assign one or multiple lab assistants
- **Student Batches** — Create batches by academic year + focus area (students auto-assigned)
- **Settings** — Change admin password

### Lecturer (`/lecturer`)
- **Dashboard** — Booking stats, upcoming sessions
- **Book a Lab** — Select lab, batch, date; live slot availability shown; submit request
- **My Requests** — Filter by status (pending/approved/rejected); see rejection reasons

### Lab Assistant (`/assistant`)
- **Dashboard** — Pending request count
- **Lab Requests** — Approve or reject with optional reason; filtered view
- **My Labs** — View assigned labs

### Student (`/student`)
- **Dashboard** — Profile, batch info, upcoming sessions
- **Lab Sessions** — Full list of approved sessions (upcoming + past)

---

## ⏰ Time Slots

All lab sessions are in 2-hour blocks:
- **08:00 – 10:00 AM**
- **10:00 – 12:00 PM**
- **12:00 – 2:00 PM**
- **2:00 – 4:00 PM**

The system prevents double-booking the same lab at the same time slot on the same day.

---

## 🔧 MongoDB Atlas Setup (if not using local)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster
3. Under **Database Access**, create a user with read/write permissions
4. Under **Network Access**, add your IP (or `0.0.0.0/0` for dev)
5. Click **Connect → Connect your application** and copy the URI
6. Paste into `MONGODB_URI` in backend `.env`

---

## 🛠 Tech Stack

- **Frontend**: React 18, React Router v6, Axios
- **Backend**: Node.js, Express 4, Mongoose 7
- **Database**: MongoDB (local or Atlas)
- **Auth**: JWT (7-day expiry), bcryptjs for password hashing
- **Fonts**: Syne (headings) + DM Sans (body)

---

## 📝 API Endpoints Summary

```
POST   /api/auth/register         — Register new user
POST   /api/auth/login            — Login
GET    /api/auth/me               — Get current user
PATCH  /api/auth/change-password  — Change password

GET    /api/admin/stats           — Dashboard stats
GET    /api/admin/users           — All users (filter by role)
GET    /api/admin/pending-users   — Awaiting approval
PATCH  /api/admin/users/:id/approve — Approve/reject user
PATCH  /api/admin/users/:id/toggle  — Activate/deactivate
GET    /api/admin/labs            — All labs
POST   /api/admin/labs            — Create lab
PATCH  /api/admin/labs/:id        — Update lab
DELETE /api/admin/labs/:id        — Delete lab
GET    /api/admin/batches         — All batches
POST   /api/admin/batches         — Create batch (auto-assign students)
DELETE /api/admin/batches/:id     — Delete batch

GET    /api/lecturer/labs         — Available labs
GET    /api/lecturer/batches      — All batches
GET    /api/lecturer/bookings     — My booking requests
POST   /api/lecturer/bookings     — Create booking request
GET    /api/lecturer/availability — Check slot availability

GET    /api/assistant/bookings    — Bookings for my labs
GET    /api/assistant/my-labs     — Assigned labs
PATCH  /api/assistant/bookings/:id — Approve/reject booking

GET    /api/student/sessions      — Approved sessions for my batches
GET    /api/student/batches       — My batches
```
