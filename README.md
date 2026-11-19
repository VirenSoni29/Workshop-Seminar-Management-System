# Workshop/Seminar Management System

> An automated verification, certificate issuance, and institutional management system with cryptographic QR validation.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation & Local Setup](#installation--local-setup)
- [Database Schema Outline](#database-schema-outline)
- [API Documentation](#api-documentation)
- [Key Workflows & Viva Demonstration](#key-workflows--viva-demonstration)

---

## Project Overview

This application fulfills all components specified in the submission guidelines, featuring a distinct client-server architecture, end-to-end tokenized authentication, persistent MongoDB data models, and an interactive role-based dashboard interface. It manages the full lifecycle of institutional workshops, seminars and FDPs: faculty propose events, admins approve them, students register (with automatic waitlisting), attendees are checked in by scanning a QR code, and verifiable PDF certificates are issued afterwards.

- **Frontend:** React.js 19, React Router v7, Axios, Tailwind CSS 4 (Vite), Recharts, html5-qrcode, Yup
- **Backend:** Node.js, Express.js 5
- **Database:** MongoDB via Mongoose ODM
- **Security:** JSON Web Tokens (JWT), bcrypt password hashing (bcryptjs), express-validator input validation, Helmet, CORS, rate limiting on auth and verification endpoints
- **Certificates & QR:** Puppeteer (PDF rendering), `qrcode` (QR generation), UUID-based QR tokens and unique certificate IDs

### User Roles
| Role | Capabilities |
| :--- | :--- |
| **Student** | Browse approved workshops, register / join waitlist, cancel registration, view personal QR, download certificates |
| **Faculty** | Create & submit workshops for approval, manage own workshops, view attendee lists, scan QR codes / manual check-in, mark workshops complete, generate certificates |
| **Admin** | Approve / reject workshops, manage users (role & active status), view reports and platform stats, audit activity log |

---

## Repository Structure

The project maintains a clean separation of concerns with two distinct root directories:

```text
├── client/                     # React frontend application (Vite)
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI (common, forms, layout, workshop)
│   │   ├── pages/              # View pages (public, student, faculty, admin)
│   │   ├── context/            # AuthContext & ThemeContext providers
│   │   ├── hooks/              # useAuth, useFetch, useForm, useDebounce, usePagination
│   │   ├── api/                # Axios API client handlers (auth, workshops, ...)
│   │   ├── routes/             # AppRoutes, ProtectedRoute, RoleRoute, GuestRoute
│   │   ├── utils/              # Constants, formatters, validation schemas
│   │   ├── styles/             # Design tokens & global styles
│   │   ├── App.jsx             # Root component
│   │   └── main.jsx            # Frontend entrypoint
│   ├── index.html
│   ├── vite.config.js
│   ├── .env.example            # Sample client environment file
│   └── package.json            # Frontend dependencies
│
├── server/                     # Express & Node.js backend application
│   ├── config/                 # Env config (config.js) & DB connection (db.js)
│   ├── controllers/            # Route handler functions & business logic
│   ├── middleware/             # Auth/role guards, validation, rate limiter, error handler
│   ├── models/                 # Mongoose schemas (User, Workshop, Registration, Certificate, Activity)
│   ├── routes/                 # Express API endpoints
│   ├── services/               # Certificate PDF generation (Puppeteer + QR)
│   ├── validators/             # express-validator rule sets
│   ├── seed/                   # Demo data (seed.js) & admin creation (createAdmin.js)
│   ├── utils/                  # asyncHandler, response helpers, JWT generator
│   ├── app.js                  # Express app & route mounting
│   ├── server.js               # Server entry point
│   ├── .env.example            # Sample server environment file
│   └── package.json            # Backend dependencies
│
├── postman/                    # Postman collections for every API group
├── .gitignore                  # Excludes node_modules, .env, and build files
└── README.md                   # Comprehensive project documentation
```

### .gitignore Configuration
Sensitive keys and heavy build targets are excluded from version control:
```text
**/node_modules
**/*.env
.postman/
```

---

## Prerequisites

Before running the application locally, ensure you have:
- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- [npm](https://www.npmjs.com/) (v9.x or later)
- [MongoDB](https://www.mongodb.com/) (Local installation on port 27017 or a MongoDB Atlas connection string)
- A system able to run Chromium (installed automatically by Puppeteer on `npm install`), required for PDF certificate generation

---

## Environment Variables

### 1. Server Configuration (`server/.env`)
Create a `.env` file in the `server` directory. `MONGO_URI` and `JWT_SECRET` are mandatory; the server refuses to start without them.

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/workshop_db
JWT_SECRET=super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

> `CLIENT_URL` is used for CORS and also to build the verification link embedded in every certificate QR code.

### 2. Client Configuration (`client/.env`)
Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Installation & Local Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/<your-username>/Workshop-Seminar-Management-System.git
cd Workshop-Seminar-Management-System
```

### Step 2: Install and Start the Backend
```bash
cd server
npm install
npm run seed        # optional: loads demo users, workshops, registrations, certificates
npm run dev
```
*The server will start on `http://localhost:5000` and connect to MongoDB. Health check: `GET /api/health`.*

> `npm run seed` wipes existing data (and refuses to run when `NODE_ENV=production`). To create only an admin account without wiping anything, run `npm run seed:admin` (`admin@college.edu` / `admin1234`).

### Step 3: Install and Start the Frontend
Open a separate terminal window:
```bash
cd client
npm install
npm run dev
```
*The client will launch on `http://localhost:5173`.*

### Demo Logins (after `npm run seed`)
| Role | Email | Password |
| :--- | :--- | :--- |
| Admin | `admin@college.edu` | `admin123` |
| Faculty | `faculty1@college.edu`, `faculty2@college.edu` | `faculty123` |
| Student | `student1@college.edu` ... `student10@college.edu` | `pass1234` |

---

## Database Schema Outline

The application utilizes Mongoose to define strictly validated document models with relational references.

### 1. User Schema (`server/models/user.js`)
Stores registered platform accounts, role-based access, and hashed credentials:

```javascript
const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true,
                match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'] },
  password:   { type: String, required: true, minlength: 6,
                select: false }, // Excluded from query results by default; bcrypt-hashed (12 rounds) on save
  role:       { type: String, enum: ['admin', 'faculty', 'student'], default: 'student' },
  department: { type: String, trim: true },
  identifier: { type: String, trim: true }, // roll number (student) / employee ID (faculty)
  isActive:   { type: Boolean, default: true }
}, { timestamps: true });
```

### 2. Workshop Schema (`server/models/workshop.js`)
Manages the primary domain resource, its approval workflow, and seat capacity:

```javascript
const workshopSchema = new mongoose.Schema({
  title:       { type: String, required: true, minlength: 5, maxlength: 120 },
  description: { type: String, required: true, maxlength: 3000 },
  type:        { type: String, enum: ['Workshop', 'Seminar', 'FDP'], default: 'Workshop' },
  department:  String,
  speaker:     String,
  mode:        { type: String, enum: ['online', 'offline'], default: 'offline' },
  venue:       String,        // required when mode === 'offline'
  meetingLink: String,        // required when mode === 'online'
  startDate:            { type: Date, required: true },
  endDate:              { type: Date, required: true },  // must be >= startDate
  registrationDeadline: { type: Date, required: true },  // must be <= startDate
  capacity:        { type: Number, required: true, min: 1, max: 5000 },
  registeredCount: { type: Number, default: 0 },         // confirmed seats, updated atomically
  createdBy:   { type: ObjectId, ref: 'User', required: true },
  status:      { type: String, enum: ['draft', 'pending', 'approved', 'rejected', 'completed', 'cancelled'],
                 default: 'draft' },
  adminRemarks: String,
  bannerImage:  String
}, { timestamps: true });
```

Status lifecycle enforced by the API:
`draft → pending → approved → completed`, with `pending → rejected → pending` (resubmit) and `cancelled` reachable from `draft`, `rejected` and `approved`.

### 3. Registration Schema (`server/models/registration.js`)
Links a user to a workshop and holds the QR token used for check-in:

```javascript
const registrationSchema = new mongoose.Schema({
  workshop: { type: ObjectId, ref: 'Workshop', required: true },
  user:     { type: ObjectId, ref: 'User', required: true },
  status:   { type: String, enum: ['registered', 'waitlisted', 'cancelled', 'attended'], default: 'registered' },
  qrToken:  { type: String, unique: true, default: uuidv4 }, // QR encodes this token, never raw user data
  registeredAt: Date, waitlistedAt: Date, cancelledAt: Date, checkedInAt: Date,
  checkedInBy:  { type: ObjectId, ref: 'User' }
}, { timestamps: true });

// One registration per user per workshop
registrationSchema.index({ workshop: 1, user: 1 }, { unique: true });
```

### 4. Certificate Schema (`server/models/certificate.js`)
One certificate per attended registration, publicly verifiable by its ID:

```javascript
const certificateSchema = new mongoose.Schema({
  registration:  { type: ObjectId, ref: 'Registration', required: true, unique: true },
  workshop:      { type: ObjectId, ref: 'Workshop', required: true },
  user:          { type: ObjectId, ref: 'User', required: true },
  certificateId: { type: String, unique: true, default: () => `CERT-${/* 10 char uuid */}` },
  issuedAt:      { type: Date, default: Date.now }
}, { timestamps: true });
```

### 5. Activity Schema (`server/models/activity.js`)
Admin audit trail of important actions (`workshop.submitted`, `workshop.approved`, `workshop.rejected`, `workshop.completed`, `workshop.cancelled`, `workshop.deleted`, `user.role_changed`, `user.activated`, `user.deactivated`):

```javascript
const activitySchema = new mongoose.Schema({
  actor:       { type: ObjectId, ref: 'User', required: true },
  action:      { type: String, enum: ACTIVITY_ACTIONS, required: true },
  entityType:  { type: String, enum: ['workshop', 'user'], required: true },
  entityId:    ObjectId,
  entityLabel: String,
  details:     String
}, { timestamps: { createdAt: true, updatedAt: false } });
```

### Entity Relationship
- **One-to-Many**: One `User` (faculty) can create multiple `Workshops` &rarr; `Workshop.createdBy` &rarr; `User._id`.
- **Many-to-Many (via Registration)**: Users and Workshops are linked through `Registration` (`user`, `workshop`), unique per pair.
- **One-to-One**: Each attended `Registration` has at most one `Certificate` &rarr; `Certificate.registration`.
- **One-to-Many**: One `User` can hold multiple `Certificates` and perform multiple logged `Activities`.

---

## API Documentation

**Base API URL:** `http://localhost:5000/api`

All responses follow the shape `{ "success": true, "message": "...", "data": ..., "meta": {...} }`. Errors return `{ "success": false, "message": "...", "errors": [...] }`.

### 1. Authentication Endpoints

| Method | Endpoint | Headers | Request Body | Success Response | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | `Content-Type: application/json` | `{ "name": "Aarav", "email": "aarav@test.com", "password": "password123", "role": "student", "department": "CSE", "identifier": "21CS001" }` | `{ "success": true, "message": "Account created successfully", "data": { "user": { ... } } }` | `201 Created` |
| `POST` | `/auth/login` | `Content-Type: application/json` | `{ "email": "aarav@test.com", "password": "password123" }` | `{ "success": true, "data": { "user": { ... }, "token": "JWT_TOKEN" } }` | `200 OK` |
| `GET` | `/auth/me` | `Authorization: Bearer <token>` | *None* | `{ "success": true, "data": { "user": { "_id": "...", "name": "Aarav", "role": "student" } } }` | `200 OK` |

> Public signup can only create `student` or `faculty` accounts (password minimum 8 characters). Admins are created via the seed scripts or promoted by an existing admin. Auth routes are rate-limited (20 requests / 15 min).

### 2. Workshops Endpoints

| Method | Endpoint | Access | Request Body / Query | Success Response | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/workshops` | Any logged-in user | Query: `page`, `limit`, `q`, `type`, `mode`, `department`, `upcoming=true`, `status` (admin only) | `{ "success": true, "data": [ ... ], "meta": { "page": 1, "total": 9, "totalPages": 1 } }` | `200 OK` |
| `GET` | `/workshops/my` | Faculty, Admin | Query: `status` | `{ "success": true, "data": [ ... ] }` | `200 OK` |
| `GET` | `/workshops/:id` | Any logged-in user | *None* | `{ "success": true, "data": { "_id": "...", "title": "..." } }` | `200 OK` |
| `POST` | `/workshops` | Faculty, Admin | `{ "title": "Full Stack with MERN", "description": "...", "type": "Workshop", "mode": "offline", "venue": "Seminar Hall A", "startDate": "...", "endDate": "...", "registrationDeadline": "...", "capacity": 30 }` | `{ "success": true, "message": "Workshop created as draft", "data": { ... } }` | `201 Created` |
| `PUT` | `/workshops/:id` | Owner / Admin (draft or rejected only) | Any editable workshop fields | `{ "success": true, "data": { ... } }` | `200 OK` |
| `DELETE` | `/workshops/:id` | Owner / Admin | *None* | `{ "success": true, "message": "..." }` | `200 OK` |
| `PATCH` | `/workshops/:id/submit` | Faculty, Admin | *None* | Moves status to `pending` | `200 OK` |
| `PATCH` | `/workshops/:id/approve` | Admin | *None* | Moves status to `approved` | `200 OK` |
| `PATCH` | `/workshops/:id/reject` | Admin | `{ "remarks": "Please add a day-wise agenda" }` | Moves status to `rejected` | `200 OK` |
| `PATCH` | `/workshops/:id/complete` | Faculty, Admin | *None* | Moves status to `completed` | `200 OK` |
| `PATCH` | `/workshops/:id/cancel` | Faculty, Admin | *None* | Moves status to `cancelled` | `200 OK` |

> Non-admin users only see `approved` and `completed` workshops; unapproved ones return `404` to avoid revealing their existence.

### 3. Registrations Endpoints

| Method | Endpoint | Access | Request Body | Success Response | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/registrations/workshops/:workshopId/register` | Student, Faculty | *None* | `{ "success": true, "message": "Registered successfully", "data": { ...registration } }` (or waitlisted message when full) | `201 Created` |
| `GET` | `/registrations/my` | Any logged-in user | *None* | `{ "success": true, "data": [ ... ] }` | `200 OK` |
| `GET` | `/registrations/workshops/:workshopId` | Workshop owner / Admin | Query: `status` | `{ "success": true, "data": [ ... ], "meta": { "total": 7, "capacity": 30, "registeredCount": 7 } }` | `200 OK` |
| `DELETE` | `/registrations/:id` | Registration owner / Admin | *None* | `{ "success": true, "message": "Registration cancelled. The first waitlisted person was promoted." }` | `200 OK` |

### 4. Check-in Endpoints

| Method | Endpoint | Access | Request Body | Success Response | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/checkin/scan` | Faculty (own workshops), Admin | `{ "qrToken": "<uuid from QR>" }` | `{ "success": true, "message": "<name> checked in", "data": { "registrationId": "...", "status": "attended", "checkedInAt": "..." } }` | `200 OK` |
| `PATCH` | `/checkin/manual/:registrationId` | Faculty (own workshops), Admin | *None* | `{ "success": true, "message": "<name> checked in manually" }` | `200 OK` |

### 5. Certificates Endpoints

| Method | Endpoint | Access | Request Body | Success Response | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/certificates/workshops/:workshopId/generate` | Workshop owner / Admin | *None* | `{ "success": true, "message": "6 certificate(s) issued", "data": { "newlyIssued": 6, "totalAttendees": 6 } }` | `201 Created` |
| `GET` | `/certificates/my` | Any logged-in user | *None* | `{ "success": true, "data": [ ... ] }` | `200 OK` |
| `GET` | `/certificates/:id/download` | Holder, Workshop owner, Admin | *None* | PDF file (`application/pdf`) | `200 OK` |
| `GET` | `/certificates/verify/:certificateId` | **Public** (no token, rate-limited) | *None* | `{ "success": true, "message": "Certificate is valid", "data": { "valid": true, "certificateId": "CERT-...", "name": "...", "workshop": { ... }, "issuedAt": "..." } }` | `200 OK` |

### 6. Admin Endpoints

| Method | Endpoint | Headers | Request Body | Success Response | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/users` | `Authorization: Bearer <admin token>` | Query: `page`, `limit`, `q`, `role`, `isActive` | `{ "success": true, "data": [ ... ], "meta": { ... } }` | `200 OK` |
| `PATCH` | `/users/:id/role` | `Authorization: Bearer <admin token>` | `{ "role": "faculty" }` | `{ "success": true, "data": { ... } }` | `200 OK` |
| `PATCH` | `/users/:id/status` | `Authorization: Bearer <admin token>` | `{ "isActive": false }` | `{ "success": true, "data": { ... } }` | `200 OK` |
| `GET` | `/stats` | `Authorization: Bearer <admin token>` | *None* | Counts by role / workshop status / registration status, certificates issued, monthly registrations | `200 OK` |
| `GET` | `/activity` | `Authorization: Bearer <admin token>` | Query: `page`, `limit`, `action`, `entityType` | `{ "success": true, "data": [ ... ], "meta": { ... } }` | `200 OK` |

A ready-to-use Postman collection for all of the above lives in the `/postman` directory.

---

## Key Workflows & Viva Demonstration

During the live viva/demonstration, the application exhibits the following verified end-to-end lifecycle (run `npm run seed` first to have demo data):

1. **User Authentication & Session Handling:**
   - Open `http://localhost:5173/signup` and create a new student account.
   - Show password encryption verified via bcrypt hash inside MongoDB Compass.
   - Log in via `/login`; inspect browser DevTools (Application &rarr; Local Storage) to showcase the stored `token`.
   - Each role is redirected to its own dashboard (`/student/dashboard`, `/faculty/dashboard`, `/admin/dashboard`).

2. **Dashboard Navigation & Route Guards:**
   - Demonstrate that navigating directly to `/student/dashboard` while logged out automatically redirects the user back to `/login`.
   - Log in as a student and try opening `/admin/users`; the role guard redirects back to the student home.
   - Access the dashboard in an authenticated state; verify that user identity and role are displayed in the navigation bar.

3. **Workshop Approval Workflow (Faculty &rarr; Admin):**
   - **Create:** As faculty (`faculty1@college.edu`), create a workshop; it starts as `draft`.
   - **Submit:** Submit it for approval; status becomes `pending`.
   - **Approve / Reject:** As admin, open *Pending Approvals* and approve it, or reject it with mandatory remarks; the faculty can fix and resubmit a rejected workshop.
   - **Update / Delete:** Edit or delete a draft/rejected workshop; observe real-time updates in the UI. Approved workshops can no longer be edited.

4. **Registration, Capacity & Waitlist:**
   - As a student, browse and search approved workshops, then register.
   - On the full *AI & Prompt Engineering Seminar* (3 of 3 seats), register as another student and observe automatic **waitlisting**.
   - Cancel a confirmed registration and show that the **first waitlisted student is promoted automatically**.
   - Open *My Registrations* and display the personal entry QR code.

5. **QR Check-in:**
   - As faculty, open *Scan QR* for the *Cybersecurity Essentials Workshop* and scan a student's QR (or use manual check-in from the attendee list).
   - Re-scan the same QR to show the duplicate protection ("Already checked in on ...") and scan an invalid code to show rejection.

6. **Certificate Issuance & Public Verification:**
   - As faculty/admin, mark a workshop as `completed` and click *Generate Certificates* (e.g., the *Technical Paper Writing Seminar*, which is seeded with attendees but no certificates yet).
   - As a student, open *My Certificates* and download the PDF.
   - Scan the QR on the PDF (or open `/verify/<certificateId>` while logged out) to show the public verification page confirming the holder, workshop, and issue date. Try a fake ID to show the "invalid" result.

7. **Admin Oversight:**
   - Show *Manage Users* (change role, deactivate an account; a deactivated user can no longer log in), *Reports* (charts from `/api/stats`), and the *Activity Log* audit trail.

8. **Database Persistence Verification:**
   - Hard refresh the page (`Ctrl + F5` / `Cmd + Shift + R`) to demonstrate that state is cleanly fetched from MongoDB via Express.
   - Open MongoDB Compass or Atlas web interface to confirm document insertion, update timestamps, and deletions across the `users`, `workshops`, `registrations`, `certificates` and `activities` collections.