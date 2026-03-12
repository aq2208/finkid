import string
import random
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import (
    CreateFamilyRequest, JoinFamilyRequest, FamilyResponse,
)
from app.database import get_supabase_client
from app.auth.dependencies import get_current_user, require_parent

router = APIRouter(prefix="/api/v1/families", tags=["families"])


def generate_join_code(length: int = 6) -> str:
    """Generate a random alphanumeric join code."""
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))


@router.post("/")
async def create_family(request: CreateFamilyRequest, current_user: dict = Depends(get_current_user)):
    """Create a new family and assign the creator to it."""
    user_id = str(current_user["auth_user"].id)
    supabase = get_supabase_client()

    # Generate a unique join code
    join_code = generate_join_code()

    # Create family
    family = (
        supabase.table("families")
        .insert({
            "name": request.name,
            "join_code": join_code,
            "created_by": user_id,
        })
        .execute()
    )

    if not family.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create family",
        )

    family_id = family.data[0]["id"]

    # Update the user's profile with the family_id
    supabase.table("profiles").update({
        "family_id": family_id,
    }).eq("id", user_id).execute()

    return family.data[0]


@router.post("/join")
async def join_family(request: JoinFamilyRequest, current_user: dict = Depends(get_current_user)):
    """Join an existing family using a join code."""
    user_id = str(current_user["auth_user"].id)
    supabase = get_supabase_client()

    # Find family by join code
    family = (
        supabase.table("families")
        .select("*")
        .eq("join_code", request.join_code.upper())
        .maybe_single()
        .execute()
    )

    if not family.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family not found. Check the join code.",
        )

    family_id = family.data["id"]

    # Update user's profile with the family_id
    supabase.table("profiles").update({
        "family_id": family_id,
    }).eq("id", user_id).execute()

    return {"message": "Joined family successfully", "family": family.data}


@router.get("/me")
async def get_my_family(current_user: dict = Depends(get_current_user)):
    """Get the current user's family info and members."""
    profile = current_user.get("profile")
    if not profile or not profile.get("family_id"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not part of a family yet",
        )

    supabase = get_supabase_client()
    family_id = profile["family_id"]

    # Fetch family
    family = (
        supabase.table("families")
        .select("*")
        .eq("id", family_id)
        .single()
        .execute()
    )

    # Fetch members
    members = (
        supabase.table("profiles")
        .select("id, username, display_name, role, avatar_url, total_points")
        .eq("family_id", family_id)
        .execute()
    )

    result = family.data
    result["members"] = members.data if members.data else []

    return result


@router.post("/me/leave")
async def leave_family(current_user: dict = Depends(get_current_user)):
    """Leave the current family."""
    profile = current_user.get("profile")
    if not profile or not profile.get("family_id"):
        raise HTTPException(status_code=400, detail="You are not in a family")
    user_id = str(current_user["auth_user"].id)
    supabase = get_supabase_client()
    supabase.table("profiles").update({"family_id": None}).eq("id", user_id).execute()
    return {"message": "Left family successfully"}
