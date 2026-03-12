from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import get_supabase_client

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Verify the JWT token from Supabase and return the user data."""
    token = credentials.credentials
    try:
        supabase = get_supabase_client()
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

        # Fetch profile from profiles table
        profile = (
            supabase.table("profiles")
            .select("*")
            .eq("id", str(user_response.user.id))
            .maybe_single()
            .execute()
        )

        return {
            "auth_user": user_response.user,
            "profile": profile.data if profile.data else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )


async def require_parent(current_user: dict = Depends(get_current_user)):
    """Require the user to have the 'parent' role."""
    profile = current_user.get("profile")
    if not profile or profile.get("role") != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can perform this action",
        )
    return current_user


async def require_child(current_user: dict = Depends(get_current_user)):
    """Require the user to have the 'child' role."""
    profile = current_user.get("profile")
    if not profile or profile.get("role") != "child":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only children can perform this action",
        )
    return current_user
