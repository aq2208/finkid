from supabase import create_client, Client
from app.config import get_settings


def get_supabase_client() -> Client:
    """Get a Supabase client using the anon key."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)
