# Finkid Deployment Guide

## Architecture Overview

```
User types app.aq2208.site
        ↓
Cloudflare DNS → points to Vercel CDN
        ↓
Vercel serves the React app (static files)
        ↓
User's browser runs the React app
        ↓
React app calls https://finkid.onrender.com/api/v1/...
        ↓
Render runs your FastAPI server
        ↓
FastAPI queries Supabase database
        ↓
Data flows back up to the user
```

## Live URLs

| Service | URL |
|---------|-----|
| Frontend | https://app.aq2208.site |
| Backend | https://finkid.onrender.com |
| Database | Supabase (managed) |

---

## Phase 1: Code Changes

Before deploying, three changes were made to make the code work outside localhost.

### 1. CORS (`finkid-be/app/main.py`)

The backend was only allowing requests from `localhost:5173`. In production, requests come from `app.aq2208.site`, so allowed origins are now read from an environment variable:

```python
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
```

### 2. API URL (`finkid-fe/src/lib/api.js`)

The frontend was calling `/api/v1/...` (relative URL), which works locally because Vite proxies it to `localhost:8000`. In production there's no proxy, so the backend URL is now configurable:

```js
const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = `${BASE_URL}/api/v1`;
```

In dev, `VITE_API_URL` is unset → relative URL → Vite proxy handles it.
In production, `VITE_API_URL=https://finkid.onrender.com`.

### 3. Dockerfile (`finkid-be/Dockerfile`)

Render needs a recipe to run the Python app. The Dockerfile:
1. Starts from Python 3.11
2. Installs dependencies from `requirements.txt`
3. Copies the `app/` folder
4. Starts `uvicorn` on port 8000

---

## Phase 2: GitHub

Both Vercel and Render pull code from GitHub and redeploy automatically on every `git push`.

**Repo:** https://github.com/aq2208/finkid

> **Note:** The three subfolders (`finkid-be`, `finkid-fe`, `finkid-app`) previously had their own `.git` folders, which made Git treat them as submodules. Those were removed so all code is tracked in one unified repo.

---

## Servers and Domains — What These Platforms Actually Provide

### Do they rent you a server?

Yes — that's the core of it.

When you deploy to Render, you're renting a slice of their infrastructure (a virtual machine) to run your Docker container. You don't own the hardware — you're just paying (or using the free tier) to have your code run on their servers continuously. Same concept as renting an apartment instead of buying a house.

Vercel is slightly different — you're not renting a persistent server, you're paying for file storage and bandwidth on their CDN. There's no "machine" running your frontend, just files distributed globally across edge servers.

### Do they give you a custom domain?

No — they give you an **auto-generated subdomain on their own domain**:

- Render gave you `https://finkid.onrender.com` — this is **their** domain, they just put your app's name in front
- Vercel gives you something like `https://finkid-fe.vercel.app` — same idea

A **custom domain** (`aq2208.site`) is something you buy separately from a **domain registrar** (Namecheap, GoDaddy, Google Domains, etc.). You already own `aq2208.site`.

What Vercel and Render do is let you **point your own domain at their servers** — that's the "custom domain" feature. They don't sell or create domains, they just accept incoming traffic for a domain you already own and configured in DNS.

### The full picture of who owns what

```
Domain registrar (e.g. Namecheap)  → you buy and own aq2208.site
Cloudflare                          → manages DNS, routes app.aq2208.site → Vercel
Vercel                              → hosts your frontend files, accepts traffic for your domain
Render                              → rents you a server to run your backend
```

Each service has one job. None of them is a complete all-in-one solution.

---

## Platform Choices

### What is Vercel?

Vercel is a cloud platform built specifically for frontend applications. When you deploy a React/Vite app, Vercel builds it into a collection of static files (HTML, CSS, JavaScript) and distributes them across a global **CDN (Content Delivery Network)** — a network of servers spread around the world. When a user visits your site, the files are served from the server geographically closest to them, making load times very fast.

Vercel was built by the same team that created Next.js, and has first-class support for all major frontend frameworks including React, Vue, Svelte, and Next.js. It understands Vite projects out of the box — no build configuration needed.

**Key traits:**
- Optimized for static frontends and JavaScript frameworks
- Global CDN with edge caching
- Instant rollbacks to any previous deployment
- Automatic HTTPS, preview deployments per branch
- Generous free tier (no time limits, no cold starts)

### What is Render?

Render is a cloud platform for running server-side applications — anything that needs to be a continuously running process. Unlike Vercel which serves static files, Render actually runs your code as a live server. It supports Docker, so it can run any language or framework.

When you deploy to Render, it builds your Docker image and runs the container on a virtual machine in the cloud. Your FastAPI server stays running (on the free tier, until idle), listening for incoming HTTP requests just like it does on your laptop — except now it's accessible to the whole internet.

**Key traits:**
- Runs any language via Docker
- Supports web services, background workers, cron jobs, databases
- Automatic deploys from GitHub
- Free tier available (with cold start limitation)
- Simple alternative to AWS/GCP/Heroku

### Why Vercel for the frontend and Render for the backend?

This comes down to a fundamental difference between the two parts of the app:

**The frontend is static.** After `vite build` runs, you have a folder of plain files. No Python, no server logic — just HTML, CSS, and JavaScript. Any machine that can serve files can host it. Vercel is purpose-built for exactly this: take static files, put them on a CDN, serve them fast. It would be wasteful to use a full server (like Render) just to serve files.

**The backend is dynamic.** Your FastAPI app needs to actually run Python code on every request — query the database, validate tokens, compute responses. It needs a real, persistent process running in the cloud. Vercel can't do this (it only runs JavaScript serverless functions, not long-lived Python processes). Render is designed exactly for this: run your container, keep it alive, handle incoming requests.

| | Vercel | Render |
|--|--------|--------|
| Best for | Static files, JS frameworks | Long-running servers, APIs |
| How it works | CDN distribution | Docker container on a VM |
| Supports Python | No (only JS/edge functions) | Yes (any language via Docker) |
| Cold starts | Never | Yes (on free tier) |
| Free tier | Very generous | Available, with limitations |

**Why not use Render for both?** You could — Render can serve static files too. But Vercel's CDN is faster for frontends (files served from edge nodes worldwide vs. a single server in one region), and Vercel's free tier has no cold starts or usage limits for static sites.

**Why not use Vercel for both?** Vercel doesn't support running arbitrary server processes. You'd have to rewrite your FastAPI backend as serverless functions, which is a significant architectural change and doesn't support Python well.

**Alternatives considered:**
- **Railway** — similar to Render, slightly easier setup, but less generous free tier
- **Fly.io** — more powerful, but more complex configuration
- **AWS/GCP/Azure** — extremely capable, but overkill for a family app and require significant DevOps knowledge
- **Netlify** — similar to Vercel for frontends, either would work equally well

---

## Phase 3: Backend on Render

**Platform:** [render.com](https://render.com) — runs server processes in Docker containers.

### Configuration

| Field | Value |
|-------|-------|
| Repo | `aq2208/finkid` |
| Root Directory | `finkid-be` |
| Runtime | Docker |
| Dockerfile Path | `./Dockerfile` |
| Instance Type | Free |
| Health Check Path | `/health` |

### Environment Variables

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon key |
| `ALLOWED_ORIGINS` | `https://app.aq2208.site` |

### What Render does on deploy

1. Clones the GitHub repo
2. Navigates into `finkid-be/`
3. Builds the Docker image (installs Python deps, copies `app/`)
4. Runs the container — starts `uvicorn` on port 8000
5. Exposes it at a public HTTPS URL

### Free Tier Limitation

Render shuts down the container after 15 minutes of inactivity. The first request after idle takes ~30 seconds to cold start. Subsequent requests are instant. Upgrade to the $7/mo Starter plan for always-on.

---

## Phase 4: Frontend on Vercel

**Platform:** [vercel.com](https://vercel.com) — serves static frontend files via global CDN.

### Configuration

| Field | Value |
|-------|-------|
| Repo | `aq2208/finkid` |
| Root Directory | `finkid-fe` |
| Framework | Vite (auto-detected) |

### Environment Variables

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_API_URL` | `https://finkid.onrender.com` |

### What Vercel does on deploy

1. Clones the GitHub repo
2. Navigates into `finkid-fe/`
3. Runs `npm install` then `vite build`
4. Compiles React into static HTML/CSS/JS in `dist/`
5. Distributes those files across a global CDN

> `VITE_*` env vars are baked into the JS bundle at build time — Vite replaces `import.meta.env.VITE_API_URL` with the literal string during the build.

### Custom Domain

`app.aq2208.site` is added in **Vercel → Project → Settings → Domains**.

---

## Phase 5: DNS on Cloudflare

### How custom domain pointing works

When you type `app.aq2208.site` into a browser, a whole chain of lookups happens before your browser knows where to send the request.

**Step 1: You own a domain**

You bought `aq2208.site` from a domain registrar. That registrar recorded you as the owner in a global database called the **DNS root** — essentially the internet's master address book. Because you own `aq2208.site`, you have the authority to decide where any subdomain (like `app.aq2208.site`) points.

**Step 2: Cloudflare manages your DNS**

You've delegated DNS management for `aq2208.site` to Cloudflare. This means when anyone in the world asks "where is `*.aq2208.site`?", Cloudflare is the one that answers. Cloudflare holds your DNS records — the actual table of name → address mappings.

**Step 3: You add a CNAME record in Cloudflare**

A **CNAME (Canonical Name)** record is an alias. It says:

> "Whoever is looking for `app.aq2208.site`, go look up `af82749a70d919ed.vercel-dns-017.com` instead — that's the real address."

That target address is Vercel's infrastructure. Vercel gave you that specific value because it's how their system knows to route traffic to your project specifically.

**Step 4: Vercel recognizes your domain**

On Vercel's side, you told it "I own `app.aq2208.site` and I want it to serve this project." Vercel then:
1. Waits for your CNAME to go live
2. Verifies you actually control the domain (by checking the CNAME points to them)
3. Automatically provisions a **TLS/SSL certificate** via Let's Encrypt, so the connection is HTTPS

**Step 5: What happens on every request**

```
Browser asks: "where is app.aq2208.site?"
        ↓
Cloudflare DNS answers: "it's an alias for af82749a70d919ed.vercel-dns-017.com"
        ↓
Browser asks: "where is af82749a70d919ed.vercel-dns-017.com?"
        ↓
That resolves to a Vercel edge server IP address
        ↓
Browser connects to that IP over HTTPS
        ↓
Vercel's server receives the request, sees the Host header says "app.aq2208.site"
        ↓
Vercel looks up which project owns that domain → your finkid frontend
        ↓
Serves the files
```

### Records Added

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `app` | `af82749a70d919ed.vercel-dns-017.com` | DNS only (grey cloud) |

### Why DNS only (grey cloud)?

Cloudflare has two modes for each DNS record:
- **Proxied (orange cloud):** Traffic flows through Cloudflare's servers first, then to Vercel. Cloudflare handles TLS.
- **DNS only (grey cloud):** Traffic goes directly from the user to Vercel. Vercel handles TLS.

Vercel needs to handle TLS itself because it provisions the SSL certificate for your domain. If Cloudflare intercepts the connection first (orange cloud), Vercel never sees the raw TLS handshake and can't verify or renew the certificate — breaking HTTPS. So you must use grey cloud for domains pointed at Vercel (and Render).

### Why does it take a few minutes?

DNS records don't update instantly worldwide. When you save the CNAME in Cloudflare, that change propagates to DNS servers all around the world. Each DNS server caches records for a period of time called **TTL (Time To Live)**. Cloudflare sets a low TTL so changes propagate in 1–5 minutes instead of the old standard of 24–48 hours.

---

## Redeploying

Both services redeploy automatically when you push to `main`:

```bash
git add .
git commit -m "your message"
git push
```

Render rebuilds the Docker image. Vercel rebuilds the static bundle. No manual action needed.

## Updating Environment Variables

- **Render:** Dashboard → your service → Environment → edit values → Manual Deploy to apply
- **Vercel:** Dashboard → project → Settings → Environment Variables → edit → Redeploy to apply
