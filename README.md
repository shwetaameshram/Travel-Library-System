# Travel Library & Book Rental System 📚✈️🚆

A college mini project that allows passengers to borrow books at an origin railway station or airport library, read them during transit, and return them at a connected destination library.

---

## Project Structure

- `backend/` — Express.js and Node.js backend API
- `frontend/` — React, Vite, and Tailwind CSS frontend
- `database/` — MySQL database schema and scripts
- `README.md` — Project documentation and setup instructions

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express.js, CORS, Dotenv
- **Database:** MySQL
- **Tools:** NPM, Nodemon

## Quick Start

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
```

The backend is expected to run at `http://localhost:5000`.

### 2. Start the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed in the Vite terminal.

### 3. Test the Backend

Visit `http://localhost:5000/api/health` in your browser to check the backend health endpoint.

### 4. Set Up the Database

Import the SQL schema into your local MySQL instance:

```bash
mysql -u root -p < database/schema.sql
```

The schema includes tables for users, libraries, books, library inventory, library connections, rentals, and returns.

## Development Accounts

- **Passenger:** `alex.passenger@example.com`
- **Admin:** `admin@travellib.com`

Use the corresponding seeded development accounts and credentials configured in your local database.

## Note

Configure your local environment variables using the project's `.env.example` file. Do not commit real passwords, API keys, or database credentials to GitHub.
