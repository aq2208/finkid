import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, families, dreams, tasks

app = FastAPI(
    title="Finkid API",
    description="Backend API for Finkid - Children's Financial Learning App",
    version="0.1.0",
)

# CORS middleware for frontend
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,https://app.aq2208.site,https://finkid-hazel.vercel.app").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(families.router)
app.include_router(dreams.router)
app.include_router(tasks.router)


@app.get("/")
async def root():
    return {"message": "🐷 Finkid API is running!", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
