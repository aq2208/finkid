import string
import random
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import (
    RegisterRequest, LoginRequest, SetRoleRequest,
    AuthResponse, ProfileResponse, UpdateProfileRequest,
)
from app.database import get_supabase_client
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register")
async def register(request: RegisterRequest):
    """Register a new user account."""
    try:
        supabase = get_supabase_client()

        # Create auth user
        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
        })

        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed",
            )

        # Create profile
        supabase.table("profiles").insert({
            "id": str(auth_response.user.id),
            "username": request.username,
            "display_name": request.display_name,
        }).execute()

        return {"message": "Registration successful", "user_id": str(auth_response.user.id)}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[REGISTER ERROR] {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login")
async def login(request: LoginRequest):
    """Login with email and password."""
    try:
        supabase = get_supabase_client()
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password,
        })

        if not auth_response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        # Fetch profile
        supabase_admin = get_supabase_client()
        profile = (
            supabase_admin.table("profiles")
            .select("*")
            .eq("id", str(auth_response.user.id))
            .maybe_single()
            .execute()
        )

        return {
            "access_token": auth_response.session.access_token,
            "refresh_token": auth_response.session.refresh_token,
            "user": profile.data if profile.data else {},
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.post("/set-role")
async def set_role(request: SetRoleRequest, current_user: dict = Depends(get_current_user)):
    """Set the user's role (parent or child)."""
    if request.role not in ("parent", "child"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'parent' or 'child'",
        )

    user_id = str(current_user["auth_user"].id)
    supabase = get_supabase_client()

    result = (
        supabase.table("profiles")
        .update({"role": request.role})
        .eq("id", user_id)
        .execute()
    )

    return {"message": f"Role set to {request.role}", "role": request.role}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get the current user's profile."""
    profile = current_user.get("profile")
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )
    return profile


@router.patch("/me")
async def update_me(request: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    """Update the current user's profile."""
    update_data = request.model_dump(exclude_none=True)
    if "display_name" in update_data and not update_data["display_name"].strip():
        raise HTTPException(status_code=400, detail="Display name cannot be empty")
    if not update_data:
        return current_user.get("profile")
    user_id = str(current_user["auth_user"].id)
    supabase = get_supabase_client()
    result = supabase.table("profiles").update(update_data).eq("id", user_id).execute()
    return result.data[0]
