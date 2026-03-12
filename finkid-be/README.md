# 🐷 Finkid

**Finkid** is a children's financial education app that teaches kids about saving, patience, and goal-setting through a gamified dream-and-task system.

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `finkid-be/supabase_migration.sql`
3. Go to **Project Settings > API** and copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon / public key** (under "Project API keys")

### 2. Backend Setup

```bash
cd finkid-be

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run the server
uvicorn app.main:app --reload --port 8000
```

The API docs will be at: http://localhost:8000/docs

### 3. Frontend Setup

```bash
cd finkid-fe

# Install dependencies (already done if you ran npm install)
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# Run the dev server
npm run dev
```

The app will be at: http://localhost:5173

## Project Structure

```
finkid/
├── finkid-be/              # Python FastAPI backend
│   ├── app/
│   │   ├── auth/            # Auth middleware & dependencies
│   │   ├── models/          # Pydantic schemas
│   │   ├── routers/         # API route handlers
│   │   ├── config.py        # Settings management
│   │   ├── database.py      # Supabase client
│   │   └── main.py          # FastAPI app entry
│   ├── supabase_migration.sql
│   └── requirements.txt
│
├── finkid-fe/              # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── context/         # Auth context provider
│   │   ├── lib/             # API client & Supabase
│   │   ├── pages/           # Page components
│   │   ├── styles/          # CSS design system
│   │   ├── App.jsx          # Router & app shell
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   └── vite.config.js
```

## Tech Stack

| Layer      | Technology            |
| ---------- | --------------------- |
| Frontend   | React 18 + Vite       |
| Backend    | Python FastAPI        |
| Database   | Supabase (PostgreSQL) |
| Auth       | Supabase Auth         |
| Styling    | Vanilla CSS           |
| Animations | Framer Motion         |
