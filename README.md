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

This application fulfills all components specified in the submission guidelines, featuring a distinct client-server architecture, end-to-end tokenized authentication, persistent MongoDB data models, and an interactive dashboard interface.

- **Frontend:** React.js, React Router v6, Axios, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB via Mongoose ODM
- **Security:** JSON Web Tokens (JWT), bcrypt password hashing, input sanitization

---

## Repository Structure

The project maintains a clean separation of concerns with two distinct root directories:

```text
├── client/                     # React frontend application
│   ├── public/                 # Static assets & index.html
│   ├── src/
│   │   ├── components/         # Modular, reusable UI components
│   │   ├── pages/              # View pages (Login, Dashboard, Form, View)
│   │   ├── context/            # AuthContext & global state providers
│   │   ├── services/           # Axios API client handlers
│   │   ├── App.js              # Route configurations
│   │   └── index.js            # Frontend entrypoint
│   ├── .env.example            # Sample client environment file
│   └── package.json            # Frontend dependencies
│
├── server/                     # Express & Node.js backend application
│   ├── src/
│   │   ├── config/             # Database connection (db.js)
│   │   ├── controllers/        # Route handler functions & business logic
│   │   ├── middleware/         # Auth verification & error handling
│   │   ├── models/             # Mongoose schemas (User, Certificate)
│   │   ├── routes/             # Express API endpoints
│   │   └── server.js           # Server entry point
│   ├── .env.example            # Sample server environment file
│   └── package.json            # Backend dependencies
│
├── .gitignore                  # Excludes node_modules, .env, and build files
└── README.md                   # Comprehensive project documentation
```

### .gitignore Configuration
Both `/client` and `/server` exclude sensitive keys and heavy build targets:
```text
node_modules/
.env
.env.local
build/
dist/
npm-debug.log*
.DS_Store
```

---

## Prerequisites

Before running the application locally, ensure you have:
- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- [npm](https://www.npmjs.com/) (v9.x or later)
- [MongoDB](https://www.mongodb.com/) (Local installation on port 27017 or a MongoDB Atlas connection string)

---

## Environment Variables

### 1. Server Configuration (`server/.env`)
Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/certificate_db
JWT_SECRET=super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:3000
```

### 2. Client Configuration (`client/.env`)
Create a `.env` file in the `client` directory:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

---

## Installation & Local Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/aarav-sharma/certiflow-mern.git
cd certiflow-mern
```

### Step 2: Install and Start the Backend
```bash
cd server
npm install
npm run dev
```
*The server will start on `http://localhost:5000` and connect to MongoDB.*

### Step 3: Install and Start the Frontend
Open a separate terminal window:
```bash
cd client
npm install
npm start
```
*The client will launch automatically on `http://localhost:3000`.*

---

## Database Schema Outline

The application utilizes Mongoose to define strictly validated document models with relational references.

### 1. User Schema (`server/src/models/User.js`)
Stores registered platform accounts, role-based access, and hashed credentials:

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email address']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false // Excluded from query results by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
```

### 2. Certificate Schema (`server/src/models/Certificate.js`)
Manages primary domain resources with a direct reference to the owning user:

```javascript
const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Certificate title is required'],
    trim: true
  },
  type: {
    type: String,
    required: true,
    default: 'Standard'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active'
  },
  details: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issuedOn: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Certificate', certificateSchema);
```

### Entity Relationship
- **One-to-Many**: One `User` can author or own multiple `Certificates`.
- Referenced via `certificateSchema.owner` &rarr; `User._id`.

---

## API Documentation

**Base API URL:** `http://localhost:5000/api`

### 1. Authentication Endpoints

| Method | Endpoint | Headers | Request Body | Success Response | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | `Content-Type: application/json` | `{ "name": "Aarav", "email": "aarav@test.com", "password": "password123" }` | `{ "success": true, "token": "JWT_TOKEN", "user": { "id": "...", "name": "Aarav" } }` | `201 Created` |
| `POST` | `/auth/login` | `Content-Type: application/json` | `{ "email": "aarav@test.com", "password": "password123" }` | `{ "success": true, "token": "JWT_TOKEN", "user": { "id": "...", "name": "Aarav" } }` | `200 OK` |
| `GET` | `/auth/me` | `Authorization: Bearer <token>` | *None* | `{ "success": true, "user": { "_id": "...", "name": "Aarav", "role": "user" } }` | `200 OK` |

### 2. Certificates CRUD Endpoints

| Method | Endpoint | Headers | Request Body | Success Response | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/certificates` | `Authorization: Bearer <token>` | *None* | `{ "success": true, "count": 2, "data": [ { ... } ] }` | `200 OK` |
| `POST` | `/certificates` | `Authorization: Bearer <token>`<br>`Content-Type: application/json` | `{ "title": "Web Dev Workshop", "type": "Seminar" }` | `{ "success": true, "data": { "_id": "...", "title": "Web Dev Workshop" } }` | `201 Created` |
| `GET` | `/certificates/:id` | `Authorization: Bearer <token>` | *None* | `{ "success": true, "data": { "_id": "...", "title": "Web Dev Workshop" } }` | `200 OK` |
| `PUT` | `/certificates/:id` | `Authorization: Bearer <token>`<br>`Content-Type: application/json` | `{ "status": "archived" }` | `{ "success": true, "data": { "_id": "...", "status": "archived" } }` | `200 OK` |
| `DELETE` | `/certificates/:id` | `Authorization: Bearer <token>` | *None* | `{ "success": true, "message": "Certificate removed successfully" }` | `200 OK` |

---

## Key Workflows & Viva Demonstration

During the live viva/demonstration, the application exhibits the following verified end-to-end lifecycle:

1. **User Authentication & Session Handling:**
   - Open `http://localhost:3000/register` and create a new account.
   - Show password encryption verified via bcrypt inside MongoDB Compass.
   - Log in via `/login`; inspect browser DevTools (Application &rarr; Local Storage) to showcase the stored `jwt_token`.
   
2. **Dashboard Navigation & Route Guards:**
   - Demonstrate that navigating directly to `/dashboard` while logged out automatically redirects the user back to `/login`.
   - Access the dashboard in an authenticated state; verify that user identity is displayed in the navigation bar.

3. **Complete CRUD Operations:**
   - **Create:** Fill out the creation form to generate a new `Certificate`.
   - **Read:** Verify the new record immediately reflects in the dashboard data table.
   - **Update:** Edit the entry's title or status via the modal/edit page and submit changes.
   - **Delete:** Remove the item; observe real-time removal from UI.

4. **Database Persistence Verification:**
   - Hard refresh the page (`Ctrl + F5` / `Cmd + Shift + R`) to demonstrate that state is cleanly fetched from MongoDB via Express.
   - Open MongoDB Compass or Atlas web interface to confirm document insertion, update timestamps, and deletions.
