# Hospital Management System

A full-stack hospital management system built with **MERN** (MongoDB, Express, React, Node.js), **Vite**, and **MongoDB Atlas**. The backend follows **MVC architecture** with a clean, modern UI/UX.

## 🌐 Live Demo

👉 https://hospital-management-system-theta-silk.vercel.app

---

## Features (5 modules + Auth)

1. **Patients** – Add, edit, delete, and search patients (contact, DOB, blood group, status).
2. **Doctors** – Manage doctors with specializations, departments, consultation fee, and availability.
3. **Appointments** – Schedule and manage appointments (patient, doctor, date, time, type, status).
4. **Departments** – Manage hospital departments with head of department and contact info.
5. **Medical Records** – Store diagnosis, prescriptions, vitals, and follow-up dates.

**Auth:** Login and Signup (JWT) with protected routes.

---

## Tech Stack

- **Frontend:** React 18, Vite, React Router, Axios, React Hot Toast
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB Atlas
- **Architecture:** Backend MVC (Models, Controllers, Routes); Frontend component-based with context for auth

---

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier works)

---

## Setup

### 1. MongoDB Atlas

1. Create a cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Get your connection string: **Database → Connect → Connect your application**.
3. Replace `<username>`, `<password>`, and optionally the cluster host in the URI.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set:
# MONGODB_URI=your_atlas_connection_string
# JWT_SECRET=your_secret_key
# PORT=5000

npm install
npm run dev
```

Server runs at **http://localhost:5000**.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:5173**. The Vite proxy forwards `/api` to the backend.

### 4. First user

Open **http://localhost:5173/signup** and create an account. Then log in and use the dashboard.

---

## Project Structure

```
hospital-management system/
├── backend/                 # Express API (MVC)
│   ├── src/
│   │   ├── config/          # DB connection
│   │   ├── controllers/    # auth, patient, doctor, appointment, department, medicalRecord
│   │   ├── middleware/     # auth, errorHandler
│   │   ├── models/         # User, Patient, Doctor, Appointment, Department, MedicalRecord
│   │   ├── routes/         # API routes
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── components/     # Layout (sidebar)
│   │   ├── context/       # AuthContext
│   │   ├── pages/         # Dashboard, Login, Signup, Patients, Doctors, Appointments, Departments, MedicalRecords
│   │   ├── services/      # api (axios)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /api/auth/register | Register user |
| POST   | /api/auth/login    | Login (returns JWT) |
| GET    | /api/auth/me       | Current user (Bearer token) |
| GET/POST | /api/patients   | List / Create patients |
| GET/PUT/DELETE | /api/patients/:id | Get / Update / Delete patient |
| GET/POST | /api/doctors   | List / Create doctors |
| GET/PUT/DELETE | /api/doctors/:id | Get / Update / Delete doctor |
| GET/POST | /api/appointments | List / Create appointments |
| GET/PUT/DELETE | /api/appointments/:id | Get / Update / Delete appointment |
| GET/POST | /api/departments | List / Create departments |
| GET/PUT/DELETE | /api/departments/:id | Get / Update / Delete department |
| GET/POST | /api/medical-records | List / Create medical records |
| GET/PUT/DELETE | /api/medical-records/:id | Get / Update / Delete record |

All feature routes require `Authorization: Bearer <token>`.

---

## License

MIT.
