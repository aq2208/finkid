from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import (
    CreateDreamRequest, ApproveDreamRequest, RejectDreamRequest, DreamResponse,
)
from app.database import get_supabase_client
from app.auth.dependencies import get_current_user, require_parent, require_child

router = APIRouter(prefix="/api/v1/dreams", tags=["dreams"])


@router.post("/")
async def create_dream(request: CreateDreamRequest, current_user: dict = Depends(require_child)):
    """Child creates a new dream."""
    profile = current_user["profile"]
    if not profile.get("family_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must join a family first",
        )

    supabase = get_supabase_client()
    dream = (
        supabase.table("dreams")
        .insert({
            "child_id": profile["id"],
            "family_id": profile["family_id"],
            "title": request.title,
            "description": request.description,
            "image_url": request.image_url,
            "status": "pending_approval",
        })
        .execute()
    )

    if not dream.data:
        raise HTTPException(status_code=500, detail="Failed to create dream")

    return dream.data[0]


@router.get("/")
async def list_dreams(current_user: dict = Depends(get_current_user)):
    """List dreams. Children see own dreams, parents see all in family."""
    profile = current_user["profile"]
    if not profile.get("family_id"):
        raise HTTPException(status_code=400, detail="You must join a family first")

    supabase = get_supabase_client()

    query = supabase.table("dreams").select("*, profiles!dreams_child_id_fkey(display_name)")

    if profile["role"] == "child":
        query = query.eq("child_id", profile["id"])
    else:
        query = query.eq("family_id", profile["family_id"])

    result = query.order("created_at", desc=True).execute()

    # Flatten child name into the response
    dreams = []
    for dream in (result.data or []):
        child_profile = dream.pop("profiles", None)
        dream["child_name"] = child_profile.get("display_name") if child_profile else None
        dreams.append(dream)

    return dreams


@router.get("/{dream_id}")
async def get_dream(dream_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single dream by ID."""
    profile = current_user["profile"]
    supabase = get_supabase_client()

    dream = (
        supabase.table("dreams")
        .select("*")
        .eq("id", dream_id)
        .eq("family_id", profile["family_id"])
        .single()
        .execute()
    )

    if not dream.data:
        raise HTTPException(status_code=404, detail="Dream not found")

    return dream.data


@router.post("/{dream_id}/approve")
async def approve_dream(
    dream_id: str,
    request: ApproveDreamRequest,
    current_user: dict = Depends(require_parent),
):
    """Parent approves a dream and sets the target points."""
    profile = current_user["profile"]
    supabase = get_supabase_client()

    # Verify dream exists and is pending
    dream = (
        supabase.table("dreams")
        .select("*")
        .eq("id", dream_id)
        .eq("family_id", profile["family_id"])
        .eq("status", "pending_approval")
        .maybe_single()
        .execute()
    )

    if not dream.data:
        raise HTTPException(status_code=404, detail="Dream not found or not pending approval")

    # Update dream
    result = (
        supabase.table("dreams")
        .update({
            "status": "approved",
            "target_points": request.target_points,
        })
        .eq("id", dream_id)
        .execute()
    )

    return result.data[0] if result.data else {"message": "Dream approved"}


@router.post("/{dream_id}/reject")
async def reject_dream(
    dream_id: str,
    request: RejectDreamRequest,
    current_user: dict = Depends(require_parent),
):
    """Parent rejects a dream."""
    profile = current_user["profile"]
    supabase = get_supabase_client()

    result = (
        supabase.table("dreams")
        .update({
            "status": "rejected",
            "rejection_reason": request.reason,
        })
        .eq("id", dream_id)
        .eq("family_id", profile["family_id"])
        .eq("status", "pending_approval")
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Dream not found or not pending")

    return result.data[0]


@router.post("/{dream_id}/activate")
async def activate_dream(dream_id: str, current_user: dict = Depends(require_child)):
    """Child sets a dream as their active dream (receives points from tasks)."""
    profile = current_user["profile"]
    supabase = get_supabase_client()

    # Deactivate all other dreams for this child
    supabase.table("dreams").update({
        "is_active": False,
    }).eq("child_id", profile["id"]).execute()

    # Activate this dream
    result = (
        supabase.table("dreams")
        .update({"is_active": True})
        .eq("id", dream_id)
        .eq("child_id", profile["id"])
        .in_("status", ["approved", "in_progress"])
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Dream not found or cannot be activated")

    # Update status to in_progress if it was just approved
    if result.data[0].get("status") == "approved":
        supabase.table("dreams").update({
            "status": "in_progress",
        }).eq("id", dream_id).execute()

    return {"message": "Dream activated", "dream": result.data[0]}
