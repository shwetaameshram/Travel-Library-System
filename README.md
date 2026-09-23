# Travel Library & Book Rental System 📚✈️🚆

A college mini project that allows passengers to borrow books at an origin railway station or airport library, read them during transit, and return them at a connected destination library.

---

## 📁 Project Structure

```
Travel-Library-System/
├── backend/            # Express Node.js Backend API
│   ├── src/
│   │   └── server.js   # Main Express server & /api/health endpoint
│   ├── .env.example    # Sample environment configuration
│   ├── .env            # Environment configuration
│   └── package.json    # Backend dependencies & npm scripts
│
├── frontend/           # React + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── App.jsx     # Main landing page & live API status widget
│   │   ├── index.css   # Tailwind CSS styles & typography
│   │   └── main.jsx    # React root entry point
│   ├── index.html      # HTML index template
│   ├── vite.config.js  # Vite build & backend API proxy config
│   └── package.json    # Frontend dependencies & npm scripts
│
├── database/           # Database Schemas & Scripts
│   └── schema.sql      # MySQL tables DDL (Users, Libraries, Books, Rentals)
│
└── README.md           # Project documentation and execution guide
```

---

## 🛠️ Tech Stack

* **Frontend:** React, Vite, Tailwind CSS, Lucide Icons
* **Backend:** Node.js, Express, CORS, Dotenv
* **Database:** MySQL
* **Tools:** NPM, Nodemon

---

## ⚡ Quick Start Guide

### 1. Running the Backend API

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend server:
   - **Development mode (with auto-reload):**
     ```bash
     npm run dev
     ```
   - **Production mode:**
     ```bash
     npm start
     ```
4. The backend will start at: `http://localhost:5000`

---

### 2. Running the React Frontend

1. Open a separate terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to: `http://localhost:3000`

---

## 🏥 Testing the Backend Health-Check API

You can test the health check endpoint using any of the following methods:

### Method 1: Web Browser
Open your browser and visit:
```text
http://localhost:5000/api/health
```

### Method 2: cURL Command
In your terminal, run:
```bash
curl http://localhost:5000/api/health
```

### Method 3: Live UI Widget
Launch the frontend application at `http://localhost:3000`. The homepage automatically queries `/api/health` and displays the status badge (**Backend Online** or **Backend Offline**) along with full payload details.

#### Expected JSON Response (`200 OK`):
```json
{
  "status": "OK",
  "message": "Travel Library & Book Rental System API is healthy and operational.",
  "timestamp": "2026-09-22T12:00:00.000Z",
  "service": "Travel-Library-Backend",
  "environment": "development",
  "version": "1.0.0"
}
```

---

## 🗄️ Database Setup (Initial MySQL Schema)

Import `database/schema.sql` into your MySQL instance:
```bash
mysql -u root -p < database/schema.sql
```

Tables included:
* `users` (Passengers & Admins)
* `libraries` (Station & Airport libraries)
* `books` (Catalog)
* `library_books` (Availability & Stock)
* `library_connections` (Route connections)
* `rentals` (Transactions & Rental Status tracking)
* `returns` (Book Return check-ins & condition audit)

---

## 🔐 Development Account Access

For local testing and demonstration:
* **Passenger Account**: `alex.passenger@example.com`
* **Admin Account**: `admin@travellib.com`

*Note: Use the seeded development account from the local database setup.*

