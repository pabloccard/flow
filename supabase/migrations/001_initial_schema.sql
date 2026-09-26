-- ============================================================
-- CONTENT FLOW — DATABASE SCHEMA
-- ============================================================
-- This migration creates the complete database structure for
-- the Content Flow application, including:
-- - Profiles (user accounts)
-- - Workspaces (shared work environments)
-- - Workspace Members (user-workspace association)
-- - Workspace Settings (configurable preferences)
-- - Products (clothing items to promote)
-- - Videos (content production tasks)
-- - Publications (platform-specific publishing records)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CUSTOM TYPES
-- ============================================================

CREATE TYPE product_status AS ENUM (
  'researching',
  'validating',
  'approved',
  'paused',
  'discarded'
);

CREATE TYPE video_status AS ENUM (
  'pending',
  'creating',
  'editing',
  'reviewing',
  'done'
);

CREATE TYPE video_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

CREATE TYPE publication_platform AS ENUM (
  'tiktok_shop',
  'shopee_videos',
  'instagram_reels'
);

CREATE TYPE publication_status AS ENUM (
  'pending',
  'scheduled',
  'published',
  'blocked'
);

CREATE TYPE workspace_role AS ENUM (
  'owner',
  'admin',
  'member'
);

-- ============================================================
-- PROFILES TABLE
-- ============================================================
-- Stores user profile data, linked to Supabase Auth users.
-- Automatically created via trigger on auth.users insert.

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WORKSPACES TABLE
-- ============================================================

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Meu Workspace',
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WORKSPACE MEMBERS TABLE
-- ============================================================

CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role workspace_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- ============================================================
-- WORKSPACE SETTINGS TABLE
-- ============================================================

CREATE TABLE workspace_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  daily_video_goal INTEGER NOT NULL DEFAULT 10,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  cover_image_url TEXT,
  shopee_original_link TEXT,
  shopee_affiliate_link TEXT,
  tiktok_original_link TEXT,
  tiktok_affiliate_link TEXT,
  shopee_price DECIMAL(10, 2),
  tiktok_price DECIMAL(10, 2),
  shopee_commission DECIMAL(5, 2),
  tiktok_commission DECIMAL(5, 2),
  variant_info TEXT, -- color, size, variant details
  notes TEXT,
  status product_status NOT NULL DEFAULT 'researching',
  -- Validation checklist
  check_shopee_found BOOLEAN NOT NULL DEFAULT FALSE,
  check_tiktok_found BOOLEAN NOT NULL DEFAULT FALSE,
  check_variants_verified BOOLEAN NOT NULL DEFAULT FALSE,
  check_affiliate_links BOOLEAN NOT NULL DEFAULT FALSE,
  -- Assignment
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VIDEOS TABLE
-- ============================================================

CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  status video_status NOT NULL DEFAULT 'pending',
  priority video_priority NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  drive_link TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PUBLICATIONS TABLE
-- ============================================================

CREATE TABLE publications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  platform publication_platform NOT NULL,
  status publication_status NOT NULL DEFAULT 'pending',
  caption TEXT,
  scheduled_date TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  publication_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One publication per platform per video
  UNIQUE(video_id, platform)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Products
CREATE INDEX idx_products_workspace ON products(workspace_id);
CREATE INDEX idx_products_status ON products(workspace_id, status);
CREATE INDEX idx_products_assigned ON products(assigned_to);
CREATE INDEX idx_products_created_at ON products(workspace_id, created_at DESC);
CREATE INDEX idx_products_category ON products(workspace_id, category);

-- Videos
CREATE INDEX idx_videos_workspace ON videos(workspace_id);
CREATE INDEX idx_videos_product ON videos(product_id);
CREATE INDEX idx_videos_status ON videos(workspace_id, status);
CREATE INDEX idx_videos_assigned ON videos(assigned_to);
CREATE INDEX idx_videos_due_date ON videos(workspace_id, due_date);
CREATE INDEX idx_videos_completed_at ON videos(workspace_id, completed_at);

-- Publications
CREATE INDEX idx_publications_workspace ON publications(workspace_id);
CREATE INDEX idx_publications_video ON publications(video_id);
CREATE INDEX idx_publications_platform ON publications(workspace_id, platform);
CREATE INDEX idx_publications_status ON publications(workspace_id, status);
CREATE INDEX idx_publications_scheduled ON publications(workspace_id, scheduled_date);
CREATE INDEX idx_publications_published ON publications(workspace_id, published_at);

-- Workspace members
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-set completed_at when video status changes to 'done'
CREATE OR REPLACE FUNCTION handle_video_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'done' AND OLD.status = 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-set published_at when publication status changes to 'published'
CREATE OR REPLACE FUNCTION handle_publication_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    IF NEW.published_at IS NULL THEN
      NEW.published_at = NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default workspace and settings for new user
CREATE OR REPLACE FUNCTION create_default_workspace()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Create workspace
  INSERT INTO workspaces (name, created_by)
  VALUES ('Content Flow', NEW.id)
  RETURNING id INTO new_workspace_id;

  -- Add user as owner
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, NEW.id, 'owner');

  -- Create default settings
  INSERT INTO workspace_settings (workspace_id)
  VALUES (new_workspace_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create 3 publications when a video is created
CREATE OR REPLACE FUNCTION create_video_publications()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO publications (workspace_id, video_id, platform)
  VALUES
    (NEW.workspace_id, NEW.id, 'tiktok_shop'),
    (NEW.workspace_id, NEW.id, 'shopee_videos'),
    (NEW.workspace_id, NEW.id, 'instagram_reels');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Updated_at triggers
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_workspaces_updated
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_workspace_settings_updated
  BEFORE UPDATE ON workspace_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_videos_updated
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_publications_updated
  BEFORE UPDATE ON publications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Video status change handler
CREATE TRIGGER trg_video_status_change
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION handle_video_status_change();

-- Publication status change handler
CREATE TRIGGER trg_publication_status_change
  BEFORE UPDATE ON publications
  FOR EACH ROW EXECUTE FUNCTION handle_publication_status_change();

-- New user handler
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- New profile -> default workspace
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_workspace();

-- New video -> create publications
CREATE TRIGGER on_video_created
  AFTER INSERT ON videos
  FOR EACH ROW EXECUTE FUNCTION create_video_publications();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is a member of the workspace
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- PROFILES
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- WORKSPACES
CREATE POLICY "Members can view their workspaces"
  ON workspaces FOR SELECT
  TO authenticated
  USING (is_workspace_member(id));

CREATE POLICY "Authenticated users can create workspaces"
  ON workspaces FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owners can update workspaces"
  ON workspaces FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- WORKSPACE MEMBERS
CREATE POLICY "Members can view workspace members"
  ON workspace_members FOR SELECT
  TO authenticated
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Owners/admins can add members"
  ON workspace_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role IN ('owner', 'admin')
    )
    OR user_id = auth.uid() -- Allow self-insert during workspace creation
  );

CREATE POLICY "Owners can manage members"
  ON workspace_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'owner'
    )
  );

CREATE POLICY "Owners can remove members"
  ON workspace_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'owner'
    )
    OR user_id = auth.uid() -- Users can leave
  );

-- WORKSPACE SETTINGS
CREATE POLICY "Members can view settings"
  ON workspace_settings FOR SELECT
  TO authenticated
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Owners/admins can update settings"
  ON workspace_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = workspace_settings.workspace_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "System can insert settings"
  ON workspace_settings FOR INSERT
  TO authenticated
  WITH CHECK (is_workspace_member(workspace_id));

-- PRODUCTS
CREATE POLICY "Members can view products"
  ON products FOR SELECT
  TO authenticated
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can create products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Members can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (is_workspace_member(workspace_id));

-- VIDEOS
CREATE POLICY "Members can view videos"
  ON videos FOR SELECT
  TO authenticated
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can create videos"
  ON videos FOR INSERT
  TO authenticated
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Members can update videos"
  ON videos FOR UPDATE
  TO authenticated
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can delete videos"
  ON videos FOR DELETE
  TO authenticated
  USING (is_workspace_member(workspace_id));

-- PUBLICATIONS
CREATE POLICY "Members can view publications"
  ON publications FOR SELECT
  TO authenticated
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can create publications"
  ON publications FOR INSERT
  TO authenticated
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Members can update publications"
  ON publications FOR UPDATE
  TO authenticated
  USING (is_workspace_member(workspace_id));

CREATE POLICY "Members can delete publications"
  ON publications FOR DELETE
  TO authenticated
  USING (is_workspace_member(workspace_id));
