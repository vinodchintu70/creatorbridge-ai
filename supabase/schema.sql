-- ==============================================================================
-- CreatorBridge AI — Hardened Supabase Production Schema (Revision 2)
-- Safe for fresh databases, non-destructive, with zero RLS recursion.
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. Creators Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creators (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL CHECK (char_length(name) >= 2),
  handle TEXT NOT NULL UNIQUE CHECK (char_length(handle) >= 3),
  avatar_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 1000),
  location TEXT,
  specialization TEXT NOT NULL,
  rate_estimate TEXT,
  availability TEXT DEFAULT 'Available Now',
  skills TEXT[] DEFAULT '{}',
  primary_tools TEXT[] DEFAULT '{}',
  commercial_suitability TEXT DEFAULT 'Full IP Buyout',
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'pending_review')),
  verification_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. Private Creator Credentials (Isolated from Public SELECT Queries)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_credentials (
  creator_id TEXT PRIMARY KEY REFERENCES public.creators(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. Portfolio Items Table (Per-Project Workflow Lineage)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 3),
  description TEXT,
  content_type TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL,
  thumbnail_url TEXT,
  media_type TEXT DEFAULT 'video' CHECK (media_type IN ('video', 'image')),
  tools_used TEXT[] DEFAULT '{}',
  primary_model TEXT NOT NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  seed BIGINT,
  sampler TEXT,
  steps INTEGER CHECK (steps > 0),
  cfg_scale NUMERIC CHECK (cfg_scale >= 0),
  pipeline_nodes TEXT[] DEFAULT '{}',
  consistency_notes TEXT,
  production_technique TEXT,
  commercial_license TEXT DEFAULT 'Full IP Buyout',
  client_or_context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. Campaign Briefs Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaign_briefs (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) >= 5),
  brand_name TEXT NOT NULL CHECK (char_length(brand_name) >= 2),
  objective TEXT NOT NULL CHECK (char_length(objective) >= 15),
  target_audience TEXT NOT NULL,
  channels TEXT[] DEFAULT '{}',
  content_type TEXT NOT NULL,
  creative_style TEXT NOT NULL CHECK (char_length(creative_style) >= 10),
  aspect_ratio TEXT NOT NULL,
  duration TEXT,
  deliverables_count INTEGER NOT NULL DEFAULT 1 CHECK (deliverables_count >= 1 AND deliverables_count <= 50),
  preferred_tools TEXT[] DEFAULT '{}',
  required_skills TEXT[] DEFAULT '{}',
  commercial_usage TEXT NOT NULL,
  usage_territory TEXT NOT NULL DEFAULT 'Worldwide / Global',
  usage_duration TEXT NOT NULL DEFAULT 'Perpetual',
  model_safety_policy TEXT,
  budget_min NUMERIC NOT NULL CHECK (budget_min >= 0),
  budget_max NUMERIC NOT NULL CHECK (budget_max >= 0),
  currency TEXT NOT NULL DEFAULT 'INR' CHECK (currency IN ('INR', 'USD')),
  deadline DATE NOT NULL CHECK (deadline >= CURRENT_DATE),
  creative_constraints TEXT,
  reference_links TEXT,
  invited_creator_id TEXT REFERENCES public.creators(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_budget_range CHECK (budget_max >= budget_min)
);

-- Note on Backward Compatibility / Existing Databases:
-- For existing deployments created before Milestone 4, run this non-destructive migration in Supabase SQL Editor:
-- ALTER TABLE public.campaign_briefs ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR' CHECK (currency IN ('INR', 'USD'));
-- UPDATE public.campaign_briefs SET currency = 'USD' WHERE created_at < '2026-10-12T14:35:00Z' AND (currency IS NULL OR currency = 'INR');

-- ------------------------------------------------------------------------------
-- 6. Private Brief Credentials (Isolated from Public SELECT Queries)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brief_credentials (
  brief_id TEXT PRIMARY KEY REFERENCES public.campaign_briefs(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. Trigger Function to Prevent Verification Status Elevation
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_creator_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Strict Check: Ordinary clients cannot modify verification_status
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    IF current_user IN ('anon', 'authenticated') THEN
      RAISE EXCEPTION 'Unauthorized: verification_status can only be changed by administrators.';
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_creator_update ON public.creators;
CREATE TRIGGER tr_protect_creator_update
  BEFORE UPDATE ON public.creators
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_creator_update();

-- ------------------------------------------------------------------------------
-- 8. Helper Functions for Ownership Checks (SECURITY DEFINER)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_creator_owner(target_creator_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  passed_token TEXT;
  creator_user_id UUID;
  stored_hash TEXT;
BEGIN
  -- 1. Check Authenticated User
  SELECT user_id INTO creator_user_id FROM public.creators WHERE id = target_creator_id;
  IF creator_user_id IS NOT NULL AND auth.uid() = creator_user_id THEN
    RETURN TRUE;
  END IF;

  -- 2. Check Header Token for Guest Creators
  BEGIN
    passed_token := current_setting('request.headers', true)::json->>'x-creator-token';
  EXCEPTION WHEN OTHERS THEN
    passed_token := NULL;
  END;

  IF passed_token IS NOT NULL THEN
    SELECT token_hash INTO stored_hash FROM public.creator_credentials WHERE creator_id = target_creator_id;
    IF stored_hash IS NOT NULL AND stored_hash = encode(digest(passed_token, 'sha256'), 'hex') THEN
      RETURN TRUE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.verify_brief_access(target_brief_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  passed_token TEXT;
  brief_user_id UUID;
  stored_hash TEXT;
BEGIN
  -- 1. Check Authenticated User
  SELECT user_id INTO brief_user_id FROM public.campaign_briefs WHERE id = target_brief_id;
  IF brief_user_id IS NOT NULL AND auth.uid() = brief_user_id THEN
    RETURN TRUE;
  END IF;

  -- 2. Check Header Token for Guest Brands
  BEGIN
    passed_token := current_setting('request.headers', true)::json->>'x-brief-token';
  EXCEPTION WHEN OTHERS THEN
    passed_token := NULL;
  END;

  IF passed_token IS NOT NULL THEN
    SELECT token_hash INTO stored_hash FROM public.brief_credentials WHERE brief_id = target_brief_id;
    IF stored_hash IS NOT NULL AND stored_hash = encode(digest(passed_token, 'sha256'), 'hex') THEN
      RETURN TRUE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 9. Enable Row Level Security (RLS) on All Tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_credentials ENABLE ROW LEVEL SECURITY;

-- Note: creator_credentials and brief_credentials have NO public policies.
-- They can never be queried or read by client applications directly.

-- Clean existing policies
DROP POLICY IF EXISTS "Allow public read access to creators" ON public.creators;
DROP POLICY IF EXISTS "Allow public insert to creators" ON public.creators;
DROP POLICY IF EXISTS "Public can view active creators" ON public.creators;
DROP POLICY IF EXISTS "Public can register as unverified creator" ON public.creators;
DROP POLICY IF EXISTS "Creator owner can update their profile" ON public.creators;
DROP POLICY IF EXISTS "Creator owner can delete their profile" ON public.creators;

DROP POLICY IF EXISTS "Allow public read access to portfolio items" ON public.portfolio_items;
DROP POLICY IF EXISTS "Allow public insert to portfolio items" ON public.portfolio_items;
DROP POLICY IF EXISTS "Public can view portfolio items" ON public.portfolio_items;
DROP POLICY IF EXISTS "Creator can add items to their portfolio" ON public.portfolio_items;
DROP POLICY IF EXISTS "Creator can update their portfolio items" ON public.portfolio_items;
DROP POLICY IF EXISTS "Creator can delete their portfolio items" ON public.portfolio_items;

DROP POLICY IF EXISTS "Allow public read access to campaign briefs" ON public.campaign_briefs;
DROP POLICY IF EXISTS "Allow public insert to campaign briefs" ON public.campaign_briefs;
DROP POLICY IF EXISTS "Allow public update to campaign briefs" ON public.campaign_briefs;
DROP POLICY IF EXISTS "Allow public delete to campaign briefs" ON public.campaign_briefs;
DROP POLICY IF EXISTS "Public can view published briefs only" ON public.campaign_briefs;
DROP POLICY IF EXISTS "Brands can create new campaign briefs" ON public.campaign_briefs;
DROP POLICY IF EXISTS "Brand owner can update their brief" ON public.campaign_briefs;
DROP POLICY IF EXISTS "Brand owner can delete their brief" ON public.campaign_briefs;

-- ------------------------------------------------------------------------------
-- 10. Complete Policy Definitions
-- ------------------------------------------------------------------------------

-- [CREATORS]
CREATE POLICY "Public can view active creators"
  ON public.creators FOR SELECT
  USING (true);

CREATE POLICY "Public can register as unverified creator"
  ON public.creators FOR INSERT
  WITH CHECK (verification_status = 'unverified');

CREATE POLICY "Creator owner can update their profile"
  ON public.creators FOR UPDATE
  USING (public.is_creator_owner(id));

CREATE POLICY "Creator owner can delete their profile"
  ON public.creators FOR DELETE
  USING (public.is_creator_owner(id));

-- [PORTFOLIO ITEMS]
CREATE POLICY "Public can view portfolio items"
  ON public.portfolio_items FOR SELECT
  USING (true);

CREATE POLICY "Creator can add items to their portfolio"
  ON public.portfolio_items FOR INSERT
  WITH CHECK (public.is_creator_owner(creator_id));

CREATE POLICY "Creator can update their portfolio items"
  ON public.portfolio_items FOR UPDATE
  USING (public.is_creator_owner(creator_id));

CREATE POLICY "Creator can delete their portfolio items"
  ON public.portfolio_items FOR DELETE
  USING (public.is_creator_owner(creator_id));

-- [CAMPAIGN BRIEFS]
CREATE POLICY "Public can view published briefs only"
  ON public.campaign_briefs FOR SELECT
  USING (
    status = 'published'
    OR public.verify_brief_access(id)
  );

CREATE POLICY "Brands can create new campaign briefs"
  ON public.campaign_briefs FOR INSERT
  WITH CHECK (
    budget_max >= budget_min
    AND budget_min >= 0
    AND char_length(title) >= 5
    AND char_length(brand_name) >= 2
  );

CREATE POLICY "Brand owner can update their brief"
  ON public.campaign_briefs FOR UPDATE
  USING (public.verify_brief_access(id));

CREATE POLICY "Brand owner can delete their brief"
  ON public.campaign_briefs FOR DELETE
  USING (public.verify_brief_access(id));

-- ------------------------------------------------------------------------------
-- 11. Performance Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_creators_specialization ON public.creators(specialization);
CREATE INDEX IF NOT EXISTS idx_portfolio_creator_id ON public.portfolio_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_briefs_status_created ON public.campaign_briefs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_briefs_invited_creator ON public.campaign_briefs(invited_creator_id);

-- ------------------------------------------------------------------------------
-- 12. Demonstration Seed Records
-- ------------------------------------------------------------------------------
INSERT INTO public.creators (
  id, name, handle, avatar_url, bio, location, specialization, rate_estimate, availability, skills, primary_tools, commercial_suitability, verification_status, verification_details
) VALUES
(
  'creator-1', 'Elena Rostova', '@elena_synapse',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'AI filmmaker & visual director specializing in luxury brand commercials, photorealistic lighting, and ComfyUI AnimateDiff pipelines.',
  'Berlin, Germany', 'AI Commercials', '₹10,000/hr • ₹2,50,000/campaign', 'Available Now',
  ARRAY['Character Consistency', 'Camera Motion Control', 'Color Grading', 'Inpainting/Outpainting', 'Audio-Driven Lip Sync'],
  ARRAY['Runway Gen-3', 'Flux.1 Dev', 'ComfyUI', 'ElevenLabs'],
  'Full IP Buyout', 'verified', 'Verified ComfyUI pipeline recipe hash #89a4f2; Runway Creative Partner ID #4492'
),
(
  'creator-2', 'Kai Takahashi', '@kai_worldbuilder',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'Environment artist and 3D concept architect crafting immersive sci-fi worlds, monumental architecture, and game cinematics.',
  'Tokyo, Japan', 'Cinematic Worldbuilding', '₹8,000/hr • ₹2,00,000/world-pack', 'Available Now',
  ARRAY['Environment Consistency', 'ControlNet Depth', '3D Matte Painting', 'Multi-Angle Worldbuilding', 'LoRA Training'],
  ARRAY['Flux.1 Dev', 'ComfyUI', 'Midjourney v6', 'Luma Dream Machine'],
  'Full IP Buyout', 'verified', 'Published open sci-fi architecture LoRA with 28k+ verified downloads on Civitai'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.portfolio_items (
  id, creator_id, title, description, content_type, aspect_ratio, thumbnail_url, media_type, tools_used,
  primary_model, prompt, negative_prompt, seed, sampler, steps, cfg_scale, pipeline_nodes, consistency_notes,
  production_technique, commercial_license, client_or_context
) VALUES
(
  'proj-101', 'creator-1', 'Obsidian Velvet — Luxury Perfume 30s',
  'Cinematic luxury commercial featuring an obsidian bottle emerging from liquid mercury with macro droplets and volumetric amber dawn rays.',
  'Video', '16:9 Landscape',
  'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=1200&q=80', 'video',
  ARRAY['Runway Gen-3', 'Flux.1 Dev', 'ComfyUI'],
  'Flux.1 Dev (BF16 Checkpoint) + Custom LoRA v2.4',
  'Cinematic 35mm anamorphic shot of a minimalist geometric perfume bottle crafted from frosted black obsidian, submerged in dark swirling liquid mercury with gold micro-caustics, volumetric amber side-lighting, 4k ultra-detailed',
  'plastic reflections, digital noise, cartoon, low bitrate, distorted text',
  48921045, 'Euler A', 32, 3.5,
  ARRAY['ControlNet Depth (Midas)', 'FaceDetailer / ObjectDetailer', 'AnimateDiff Motion Module v3', 'Topaz Video AI 4K 60fps'],
  'Custom LoRA trained on 38 studio lighting reference angles of the product bottle ensures zero silhouette warping across 8 camera orbit moves.',
  'Hybrid Text-to-Video + Image-to-Video projection with ControlNet Depth locking camera geometry.',
  'Full IP Buyout', 'Sample Brand Concept / Spec Reel'
)
ON CONFLICT (id) DO NOTHING;
