import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend root directory
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)


class Settings:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL", "")
        self.supabase_key = os.getenv("SUPABASE_KEY", "")

        if not self.supabase_url or not self.supabase_key:
            raise ValueError(
                f"Missing SUPABASE_URL or SUPABASE_KEY. "
                f"Make sure {env_path} exists and variables are declared."
            )

        if not self.supabase_key.startswith("ey"):
            raise ValueError(
                f"Your SUPABASE_KEY looks incorrect (starts with '{self.supabase_key[:5]}...'). "
                f"A valid Supabase API key is a JWT and must start with 'eyJ'. "
                f"Please check your Supabase Dashboard -> Settings -> API and copy the 'anon' public key."
            )

def get_settings() -> Settings:
    return Settings()
