from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import (
    CreateTaskRequest, VerifyTaskRequest, TaskResponse,
)
from app.database import get_supabase_client
from app.auth.dependencies import get_current_user, require_parent, require_child

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


@router.post("/")
async def create_task(request: CreateTaskRequest, current_user: dict = Depends(require_parent)):
    """Parent creates a new task in the family pool."""
    profile = current_user["profile"]
    if not profile.get("family_id"):
        raise HTTPException(status_code=400, detail="You must be in a family first")

    supabase = get_supabase_client()
    task = (
        supabase.table("tasks")
        .insert({
            "family_id": profile["family_id"],
            "created_by": profile["id"],
            "title": request.title,
            "description": request.description,
            "points": request.points,
            "status": "available",
        })
        .execute()
    )

    if not task.data:
        raise HTTPException(status_code=500, detail="Failed to create task")

    return task.data[0]


@router.get("/")
async def list_tasks(
    task_status: str = None,
    current_user: dict = Depends(get_current_user),
):
    """List tasks in the family pool. Optional status filter."""
    profile = current_user["profile"]
    if not profile.get("family_id"):
        raise HTTPException(status_code=400, detail="You must be in a family first")

    supabase = get_supabase_client()
    query = (
        supabase.table("tasks")
        .select("*, profiles!tasks_picked_up_by_fkey(display_name)")
        .eq("family_id", profile["family_id"])
    )

    if task_status:
        query = query.eq("status", task_status)

    result = query.order("created_at", desc=True).execute()

    # Flatten child name
    tasks = []
    for task in (result.data or []):
        child_profile = task.pop("profiles", None)
        task["child_name"] = child_profile.get("display_name") if child_profile else None
        tasks.append(task)

    return tasks


@router.get("/{task_id}")
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single task by ID."""
    profile = current_user["profile"]
    supabase = get_supabase_client()

    task = (
        supabase.table("tasks")
        .select("*")
        .eq("id", task_id)
        .eq("family_id", profile["family_id"])
        .single()
        .execute()
    )

    if not task.data:
        raise HTTPException(status_code=404, detail="Task not found")

    return task.data


@router.delete("/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(require_parent)):
    """Parent deletes a task (only if available)."""
    profile = current_user["profile"]
    supabase = get_supabase_client()

    result = (
        supabase.table("tasks")
        .delete()
        .eq("id", task_id)
        .eq("family_id", profile["family_id"])
        .eq("status", "available")
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found or not deletable")

    return {"message": "Task deleted"}


@router.post("/{task_id}/pickup")
async def pickup_task(task_id: str, current_user: dict = Depends(require_child)):
    """Child picks up a task from the pool."""
    profile = current_user["profile"]
    supabase = get_supabase_client()

    result = (
        supabase.table("tasks")
        .update({
            "status": "picked_up",
            "picked_up_by": profile["id"],
        })
        .eq("id", task_id)
        .eq("family_id", profile["family_id"])
        .eq("status", "available")
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found or already picked up")

    return result.data[0]


@router.post("/{task_id}/complete")
async def complete_task(task_id: str, current_user: dict = Depends(require_child)):
    """Child marks a task as done (pending parent verification)."""
    profile = current_user["profile"]
    supabase = get_supabase_client()

    result = (
        supabase.table("tasks")
        .update({
            "status": "pending_verification",
            "completed_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", task_id)
        .eq("picked_up_by", profile["id"])
        .eq("status", "picked_up")
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found or not in progress")

    return result.data[0]


@router.post("/{task_id}/verify")
async def verify_task(
    task_id: str,
    request: VerifyTaskRequest,
    current_user: dict = Depends(require_parent),
):
    """Parent verifies (approves or rejects) a task completion."""
    profile = current_user["profile"]
    supabase = get_supabase_client()

    # Get the task first
    task = (
        supabase.table("tasks")
        .select("*")
        .eq("id", task_id)
        .eq("family_id", profile["family_id"])
        .eq("status", "pending_verification")
        .maybe_single()
        .execute()
    )

    if not task.data:
        raise HTTPException(status_code=404, detail="Task not found or not pending verification")

    if request.approved:
        # Approve: mark completed, add points to child
        supabase.table("tasks").update({
            "status": "completed",
            "verified_at": datetime.now(timezone.utc).isoformat(),
            "verified_by": profile["id"],
        }).eq("id", task_id).execute()

        child_id = task.data["picked_up_by"]
        points = task.data["points"]

        # Add points to child's total
        child_profile = (
            supabase.table("profiles")
            .select("total_points")
            .eq("id", child_id)
            .single()
            .execute()
        )

        new_total = (child_profile.data.get("total_points") or 0) + points
        supabase.table("profiles").update({
            "total_points": new_total,
        }).eq("id", child_id).execute()

        # Add points to child's active dream
        active_dream = (
            supabase.table("dreams")
            .select("*")
            .eq("child_id", child_id)
            .eq("is_active", True)
            .maybe_single()
            .execute()
        )

        if active_dream and active_dream.data:
            new_earned = (active_dream.data.get("earned_points") or 0) + points
            update_data = {"earned_points": new_earned}

            # Check if dream is fulfilled
            target = active_dream.data.get("target_points") or 0
            if new_earned >= target and target > 0:
                update_data["status"] = "fulfilled"
                update_data["is_active"] = False

            supabase.table("dreams").update(update_data).eq(
                "id", active_dream.data["id"]
            ).execute()

        return {"message": "Task approved! Points awarded.", "points_awarded": points}

    else:
        # Reject: reset task to available
        supabase.table("tasks").update({
            "status": "available",
            "picked_up_by": None,
            "completed_at": None,
        }).eq("id", task_id).execute()

        return {"message": "Task completion rejected. Task returned to pool."}
