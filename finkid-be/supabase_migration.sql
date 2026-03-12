-- Finkid Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Families Table
-- ============================================
CREATE TABLE IF NOT EXISTS families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    join_code TEXT UNIQUE NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Profiles Table (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('parent', 'child')),
    family_id UUID REFERENCES families(id),
    avatar_url TEXT,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add the FK from families.created_by to profiles after profiles exists
ALTER TABLE families
    ADD CONSTRAINT fk_families_created_by
    FOREIGN KEY (created_by) REFERENCES profiles(id);

-- ============================================
-- 3. Dreams Table
-- ============================================
CREATE TABLE IF NOT EXISTS dreams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID NOT NULL REFERENCES profiles(id),
    family_id UUID NOT NULL REFERENCES families(id),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    target_points INTEGER,
    earned_points INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending_approval'
        CHECK (status IN ('pending_approval', 'approved', 'in_progress', 'fulfilled', 'rejected')),
    is_active BOOLEAN DEFAULT FALSE,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. Tasks Table
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id),
    created_by UUID NOT NULL REFERENCES profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'picked_up', 'pending_verification', 'completed', 'rejected')),
    picked_up_by UUID REFERENCES profiles(id),
    completed_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_family_id ON profiles(family_id);
CREATE INDEX IF NOT EXISTS idx_dreams_child_id ON dreams(child_id);
CREATE INDEX IF NOT EXISTS idx_dreams_family_id ON dreams(family_id);
CREATE INDEX IF NOT EXISTS idx_dreams_status ON dreams(status);
CREATE INDEX IF NOT EXISTS idx_tasks_family_id ON tasks(family_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_picked_up_by ON tasks(picked_up_by);
CREATE INDEX IF NOT EXISTS idx_families_join_code ON families(join_code);

-- ============================================
-- 6. Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (our backend uses service role)
CREATE POLICY "Service role has full access to profiles"
    ON profiles FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to families"
    ON families FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to dreams"
    ON dreams FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to tasks"
    ON tasks FOR ALL
    USING (true)
    WITH CHECK (true);
