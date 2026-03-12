# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Finkid** is a family financial literacy app where parents assign chore tasks to children, who earn points and save them toward "dreams" (desired items). It has three sub-projects:

- `finkid-be/` — Python FastAPI backend
- `finkid-fe/` — React + Vite frontend (web)
- `finkid-app/` — Mobile app (currently placeholder)

## Development Commands

### Backend (`finkid-be/`)

```bash
# Activate venv (required before any Python command)
source venv/bin/activate

# Start dev server (auto-reload)
uvicorn app.main:app --reload --port 8000

# API docs available at http://localhost:8000/docs
```

### Frontend (`finkid-fe/`)

```bash
npm run dev      # Dev server at http://localhost:5173
npm run build    # Production build
npm run preview  # Preview production build
```

Both must run simultaneously. Vite proxies all `/api` requests to `http://localhost:8000`.

## Environment Setup

- `finkid-be/.env` requires `SUPABASE_URL` and `SUPABASE_KEY`
- `finkid-fe/.env` requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Copy from `.env.example` in each directory
- Database schema is in `finkid-be/supabase_migration.sql` — run once in Supabase SQL Editor

## Architecture

### Auth Flow

The backend uses **Supabase Auth** for identity but manages its own JWT validation. On login, Supabase issues a JWT which the frontend stores in `localStorage` as `access_token`. Every API request sends it as `Authorization: Bearer <token>`. The backend (`app/auth/dependencies.py`) validates the token via `supabase.auth.get_user(token)` and fetches the user's profile from the `profiles` table.

The frontend `AuthContext` (`src/context/AuthContext.jsx`) is the single source of truth for auth state. It exposes `user`, `isParent`, `isChild`, `hasRole`, `hasFamily` — all derived from the stored profile. The user profile is also cached in `localStorage` as `user_profile` to avoid loading flicker.

### Onboarding Flow (Frontend)

`App.jsx` enforces a 3-step onboarding gate:
1. Not logged in → `/login`
2. Logged in, no role → force `ChooseRole` page
3. Has role, no family → force `FamilySetup` page (create or join via `join_code`)
4. Fully set up → normal routes with `BottomNav`

### Backend Structure

```
app/
  main.py          # FastAPI app, CORS, router registration
  config.py        # Settings via pydantic-settings
  database.py      # Supabase client factory
  auth/
    dependencies.py  # get_current_user, require_parent, require_child
  models/
    schemas.py       # Pydantic request/response models
  routers/
    auth.py          # /api/v1/auth/* (register, login, set-role, me)
    families.py      # /api/v1/families/*
    dreams.py        # /api/v1/dreams/*
    tasks.py         # /api/v1/tasks/*
```

Use `require_parent` or `require_child` as FastAPI `Depends` to protect role-specific endpoints.

### Database Schema (Supabase/PostgreSQL)

- `profiles` — extends `auth.users`; has `role` (parent/child), `family_id`, `total_points`
- `families` — has a unique `join_code` for children to join
- `dreams` — child's wish items; status flow: `pending_approval → approved → in_progress → fulfilled`; only one dream can be `is_active` at a time; `earned_points` accumulates as tasks complete
- `tasks` — chores created by parents; status flow: `available → picked_up → pending_verification → completed`

RLS is enabled but all policies allow full access to the service role (the backend uses anon key with elevated trust).

### Frontend API Client

`src/lib/api.js` is a singleton `ApiClient` class. All API calls go through it. It reads/writes the token from `localStorage`. The frontend does **not** call Supabase directly for data — all data goes through the FastAPI backend. The `supabase.js` file exists but is only used implicitly via the backend.

### Role-Based UI

Pages conditionally render parent vs. child views using `isParent`/`isChild` from `useAuth()`. The same page component (e.g., `Tasks.jsx`, `Dreams.jsx`) handles both roles — parents see approve/reject actions, children see pickup/complete actions.

### Frontend Design System

- Design aesthetic: **"Bubbly Arcade"** — Duolingo-inspired, child-friendly, vibrant
- Fonts: Fredoka One (display) + Nunito (body) — loaded via Google Fonts in `index.css`
- All CSS variables and component classes are in `finkid-fe/src/styles/index.css`
- Every screen: `<div className="page">` → `page-hero` (with wave) → `<div className="page-content">`
- Hero color assignments: mint=parent home, coral=tasks, grape=dreams, auth pages use coral gradient
- Icons: **Phosphor only** (`react-icons/pi`). Fill variant for active/emphasis, outline for inactive. No Apple emoji as functional UI icons (decorative emoji in cards/empty states is fine).
