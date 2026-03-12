from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# --- Auth & Profile ---

class RegisterRequest(BaseModel):
    email: str
    password: str
    username: str
    display_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class SetRoleRequest(BaseModel):
    role: str  # 'parent' or 'child'


class ProfileResponse(BaseModel):
    id: str
    username: str
    display_name: str
    role: Optional[str] = None
    family_id: Optional[str] = None
    avatar_url: Optional[str] = None
    total_points: int = 0
    created_at: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: dict


class UpdateProfileRequest(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None


# --- Family ---

class CreateFamilyRequest(BaseModel):
    name: str


class JoinFamilyRequest(BaseModel):
    join_code: str


class FamilyResponse(BaseModel):
    id: str
    name: str
    join_code: str
    created_by: str
    created_at: Optional[str] = None
    members: Optional[list] = None


# --- Dreams ---

class CreateDreamRequest(BaseModel):
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None


class ApproveDreamRequest(BaseModel):
    target_points: int


class RejectDreamRequest(BaseModel):
    reason: Optional[str] = None


class DreamResponse(BaseModel):
    id: str
    child_id: str
    family_id: str
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    target_points: Optional[int] = None
    earned_points: int = 0
    status: str
    is_active: bool = False
    rejection_reason: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    child_name: Optional[str] = None


# --- Tasks ---

class CreateTaskRequest(BaseModel):
    title: str
    description: Optional[str] = None
    points: int


class VerifyTaskRequest(BaseModel):
    approved: bool
    reason: Optional[str] = None


class TaskResponse(BaseModel):
    id: str
    family_id: str
    created_by: str
    title: str
    description: Optional[str] = None
    points: int
    status: str
    picked_up_by: Optional[str] = None
    completed_at: Optional[str] = None
    verified_at: Optional[str] = None
    verified_by: Optional[str] = None
    created_at: Optional[str] = None
    child_name: Optional[str] = None
