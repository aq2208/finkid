# Finkid 🐷

A family financial literacy app where parents assign chores to children, who earn points and save them toward **dreams** (items they want). Built to make money lessons fun.

**Live app:** [app.aq2208.site](https://app.aq2208.site)

---

## What it does

- **Parents** create chore tasks with point values, approve completed tasks, and manage the family
- **Children** pick up tasks, mark them complete, and save earned points toward a dream item
- Dreams have a status flow: pending approval → approved → in progress → fulfilled
- Installable as a PWA on iOS and Android (Add to Home Screen)

---

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite, hosted on Vercel |
| Backend | Python FastAPI, hosted on Render (Docker) |
| Database | Supabase (PostgreSQL + Auth) |
| Styling | Custom CSS design system ("Bubbly Arcade") |

---

## Project structure

```
finkid/
├── finkid-fe/          # React + Vite frontend
│   ├── src/
│   │   ├── pages/      # Login, Register, Home, Tasks, Dreams, Profile
│   │   ├── components/ # BottomNav, shared UI
│   │   ├── context/    # AuthContext (auth state)
│   │   ├── lib/        # api.js (all API calls)
│   │   └── styles/     # index.css (full design system)
│   └── public/         # PWA icons, manifest
└── finkid-be/          # FastAPI backend
    └── app/
        ├── routers/    # auth, families, tasks, dreams
        ├── models/     # Pydantic schemas
        └── auth/       # JWT validation via Supabase
```

---

## Running locally

**Backend** (`finkid-be/`):
```bash
cp .env.example .env        # add SUPABASE_URL and SUPABASE_KEY
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Frontend** (`finkid-fe/`):
```bash
cp .env.example .env        # add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev                 # http://localhost:5173
```

Both must run at the same time. Vite proxies `/api` requests to the backend.

Database schema: run `finkid-be/supabase_migration.sql` once in the Supabase SQL editor.

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full guide.

| Service | URL |
|---------|-----|
| Frontend (Vercel) | [app.aq2208.site](https://app.aq2208.site) |
| Backend (Render) | [finkid.onrender.com](https://finkid.onrender.com) |

Pushing to `main` auto-deploys both services.
