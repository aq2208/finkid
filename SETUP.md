# 🐷 Finkid — Setup & Startup Guide

## Prerequisites

Before starting, make sure you have the following installed:

| Tool        | Version | Check Command       | Install                                         |
| ----------- | ------- | ------------------- | ----------------------------------------------- |
| **Python**  | 3.11+   | `python3 --version` | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 18+     | `node --version`    | [nodejs.org](https://nodejs.org/)               |
| **npm**     | 9+      | `npm --version`     | Comes with Node.js                              |
| **Git**     | Any     | `git --version`     | [git-scm.com](https://git-scm.com/)             |

You also need a **Supabase** account (free tier works):

- Sign up at [supabase.com](https://supabase.com)

---

## Step 1: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a name and set a database password
3. Wait for the project to be provisioned

### Run the database migration

4. In your Supabase Dashboard → **SQL Editor** → **New Query**
5. Copy and paste the entire contents of `finkid-be/supabase_migration.sql`
6. Click **Run** — this creates all tables (`profiles`, `families`, `dreams`, `tasks`)

### Get your API keys

7. Go to **Settings** → **API** and note down:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon / public key** (under "Project API keys")

---

## Step 2: Set Up the Backend

```bash
# Navigate to the backend folder
cd finkid-be

# Create a Python virtual environment
python3 -m venv venv

# Activate the virtual environment
# macOS / Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

### Configure environment variables

```bash
# Copy the example env file
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-public-key
```

### Start the backend server

```bash
uvicorn app.main:app --reload --port 8000
```

✅ Backend running at: **http://localhost:8000**  
📄 API Docs (Swagger): **http://localhost:8000/docs**

---

## Step 3: Set Up the Frontend

Open a **new terminal** (keep the backend running):

```bash
# Navigate to the frontend folder
cd finkid-fe

# Install Node.js dependencies
npm install

# Copy the example env file
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### Start the frontend dev server

```bash
npm run dev
```

✅ Frontend running at: **http://localhost:5173**

---

## Quick Start (After First Setup)

Once everything is installed, you just need two terminals:

**Terminal 1 — Backend:**

```bash
cd finkid-be
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**

```bash
cd finkid-fe
npm run dev
```

---

## Troubleshooting

| Problem                         | Solution                                                           |
| ------------------------------- | ------------------------------------------------------------------ |
| `ModuleNotFoundError` in Python | Make sure venv is activated: `source venv/bin/activate`            |
| `vite: command not found`       | Run `npm install` first, then use `npx vite` instead               |
| npm permission errors           | Try `npm install --cache /tmp/.npm-cache`                          |
| Backend auth errors / 401       | Check that `SUPABASE_URL` and `SUPABASE_KEY` are correct in `.env` |
| Frontend can't reach backend    | Ensure backend is running on port 8000 (Vite proxies `/api` to it) |
| SQL migration errors            | Make sure you run the full `supabase_migration.sql` in one go      |

---

## Project Structure

```
finkid/
├── finkid-be/                  # Python FastAPI backend
│   ├── app/
│   │   ├── auth/               # JWT auth middleware
│   │   ├── models/             # Pydantic schemas
│   │   ├── routers/            # API endpoints
│   │   ├── config.py           # Settings
│   │   ├── database.py         # Supabase client
│   │   └── main.py             # App entry point
│   ├── supabase_migration.sql  # Database schema
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Env template
│   └── .env                    # Your config (gitignored)
│
├── finkid-fe/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # Auth context
│   │   ├── lib/                # API client + Supabase
│   │   ├── pages/              # All page components
│   │   ├── styles/             # CSS design system
│   │   ├── App.jsx             # Router
│   │   └── main.jsx            # Entry point
│   ├── package.json            # Node dependencies
│   ├── vite.config.js          # Vite config (with API proxy)
│   ├── .env.example            # Env template
│   └── .env                    # Your config (gitignored)
│
└── SETUP.md                    # ← You are here
```
