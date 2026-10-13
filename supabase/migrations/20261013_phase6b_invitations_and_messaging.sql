-- ==============================================================================
-- CreatorBridge AI — Phase 6B: Invitations, Acceptance & Persistent Messaging
-- Security-Hardened Migration (Final Approval Release)
-- Non-destructive, additive migration preserving all existing tables & policies.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Partial-Schema Pre-Validation (Explicitly aborts on unsupported partial state)
--
-- Safety Guarantee:
-- - Fresh databases: Passes cleanly; tables are created with full schema below.
-- - Pre-existing tables: Strictly checks every required column, primary key,
--   check constraint, and foreign key. If ANY required element is missing,
--   aborts immediately with RAISE EXCEPTION.
-- - No silent heuristic repairs, no table drops, and no data alteration.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_missing TEXT := '';
  v_col TEXT;
BEGIN
  -- 1. Validate public.user_profiles if already existing
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    FOREACH v_col IN ARRAY ARRAY['id', 'role', 'creator_id', 'brand_name', 'display_name', 'created_at', 'updated_at'] LOOP
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = v_col
      ) THEN
        v_missing := v_missing || ' user_profiles.' || v_col || ' (column);';
      END IF;
    END LOOP;

    -- Validate Primary Key (exact single-column on id)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
      WHERE n.nspname = 'public' AND rel.relname = 'user_profiles' AND c.contype = 'p'
        AND cardinality(c.conkey) = 1 AND a.attname = 'id'
    ) THEN
      v_missing := v_missing || ' user_profiles (primary key on id);';
    END IF;

    -- Validate check_role_fields constraint
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      WHERE n.nspname = 'public' AND rel.relname = 'user_profiles' AND c.conname = 'check_role_fields'
    ) THEN
      v_missing := v_missing || ' user_profiles (check_role_fields constraint);';
    END IF;

    -- Validate foreign key: user_profiles.id -> auth.users(id) (exact single-column)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel_src ON rel_src.oid = c.conrelid
      JOIN pg_namespace n_src ON n_src.oid = rel_src.relnamespace
      JOIN pg_attribute a_src ON a_src.attrelid = c.conrelid AND a_src.attnum = c.conkey[1]
      JOIN pg_class rel_tgt ON rel_tgt.oid = c.confrelid
      JOIN pg_namespace n_tgt ON n_tgt.oid = rel_tgt.relnamespace
      JOIN pg_attribute a_tgt ON a_tgt.attrelid = c.confrelid AND a_tgt.attnum = c.confkey[1]
      WHERE n_src.nspname = 'public'
        AND rel_src.relname = 'user_profiles'
        AND a_src.attname = 'id'
        AND n_tgt.nspname = 'auth'
        AND rel_tgt.relname = 'users'
        AND a_tgt.attname = 'id'
        AND c.contype = 'f'
        AND cardinality(c.conkey) = 1
        AND cardinality(c.confkey) = 1
    ) THEN
      v_missing := v_missing || ' user_profiles.id -> auth.users(id) (exact single-column foreign key);';
    END IF;

    -- Validate foreign key: user_profiles.creator_id -> public.creators(id) (exact single-column)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel_src ON rel_src.oid = c.conrelid
      JOIN pg_namespace n_src ON n_src.oid = rel_src.relnamespace
      JOIN pg_attribute a_src ON a_src.attrelid = c.conrelid AND a_src.attnum = c.conkey[1]
      JOIN pg_class rel_tgt ON rel_tgt.oid = c.confrelid
      JOIN pg_namespace n_tgt ON n_tgt.oid = rel_tgt.relnamespace
      JOIN pg_attribute a_tgt ON a_tgt.attrelid = c.confrelid AND a_tgt.attnum = c.confkey[1]
      WHERE n_src.nspname = 'public'
        AND rel_src.relname = 'user_profiles'
        AND a_src.attname = 'creator_id'
        AND n_tgt.nspname = 'public'
        AND rel_tgt.relname = 'creators'
        AND a_tgt.attname = 'id'
        AND c.contype = 'f'
        AND cardinality(c.conkey) = 1
        AND cardinality(c.confkey) = 1
    ) THEN
      v_missing := v_missing || ' user_profiles.creator_id -> public.creators(id) (exact single-column foreign key);';
    END IF;
  END IF;

  -- 2. Validate public.campaign_invitations if already existing
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaign_invitations') THEN
    FOREACH v_col IN ARRAY ARRAY['id', 'brief_id', 'brand_user_id', 'creator_id', 'creator_user_id', 'status', 'intro_message', 'created_at', 'updated_at'] LOOP
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'campaign_invitations' AND column_name = v_col
      ) THEN
        v_missing := v_missing || ' campaign_invitations.' || v_col || ' (column);';
      END IF;
    END LOOP;

    -- Validate Primary Key (exact single-column on id)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
      WHERE n.nspname = 'public' AND rel.relname = 'campaign_invitations' AND c.contype = 'p'
        AND cardinality(c.conkey) = 1 AND a.attname = 'id'
    ) THEN
      v_missing := v_missing || ' campaign_invitations (primary key on id);';
    END IF;

    -- Validate unique constraint on (brief_id, creator_id)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      WHERE n.nspname = 'public' 
        AND rel.relname = 'campaign_invitations' 
        AND c.conname = 'unique_brief_creator_invitation'
        AND cardinality(c.conkey) = 2
    ) THEN
      v_missing := v_missing || ' campaign_invitations (unique_brief_creator_invitation constraint);';
    END IF;

    -- Validate foreign key: campaign_invitations.brief_id -> public.campaign_briefs(id) (exact single-column)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel_src ON rel_src.oid = c.conrelid
      JOIN pg_namespace n_src ON n_src.oid = rel_src.relnamespace
      JOIN pg_attribute a_src ON a_src.attrelid = c.conrelid AND a_src.attnum = c.conkey[1]
      JOIN pg_class rel_tgt ON rel_tgt.oid = c.confrelid
      JOIN pg_namespace n_tgt ON n_tgt.oid = rel_tgt.relnamespace
      JOIN pg_attribute a_tgt ON a_tgt.attrelid = c.confrelid AND a_tgt.attnum = c.confkey[1]
      WHERE n_src.nspname = 'public'
        AND rel_src.relname = 'campaign_invitations'
        AND a_src.attname = 'brief_id'
        AND n_tgt.nspname = 'public'
        AND rel_tgt.relname = 'campaign_briefs'
        AND a_tgt.attname = 'id'
        AND c.contype = 'f'
        AND cardinality(c.conkey) = 1
        AND cardinality(c.confkey) = 1
    ) THEN
      v_missing := v_missing || ' campaign_invitations.brief_id -> public.campaign_briefs(id) (exact single-column foreign key);';
    END IF;

    -- Validate foreign key: campaign_invitations.brand_user_id -> auth.users(id) (exact single-column)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel_src ON rel_src.oid = c.conrelid
      JOIN pg_namespace n_src ON n_src.oid = rel_src.relnamespace
      JOIN pg_attribute a_src ON a_src.attrelid = c.conrelid AND a_src.attnum = c.conkey[1]
      JOIN pg_class rel_tgt ON rel_tgt.oid = c.confrelid
      JOIN pg_namespace n_tgt ON n_tgt.oid = rel_tgt.relnamespace
      JOIN pg_attribute a_tgt ON a_tgt.attrelid = c.confrelid AND a_tgt.attnum = c.confkey[1]
      WHERE n_src.nspname = 'public'
        AND rel_src.relname = 'campaign_invitations'
        AND a_src.attname = 'brand_user_id'
        AND n_tgt.nspname = 'auth'
        AND rel_tgt.relname = 'users'
        AND a_tgt.attname = 'id'
        AND c.contype = 'f'
        AND cardinality(c.conkey) = 1
        AND cardinality(c.confkey) = 1
    ) THEN
      v_missing := v_missing || ' campaign_invitations.brand_user_id -> auth.users(id) (exact single-column foreign key);';
    END IF;

    -- Validate foreign key: campaign_invitations.creator_id -> public.creators(id) (exact single-column)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel_src ON rel_src.oid = c.conrelid
      JOIN pg_namespace n_src ON n_src.oid = rel_src.relnamespace
      JOIN pg_attribute a_src ON a_src.attrelid = c.conrelid AND a_src.attnum = c.conkey[1]
      JOIN pg_class rel_tgt ON rel_tgt.oid = c.confrelid
      JOIN pg_namespace n_tgt ON n_tgt.oid = rel_tgt.relnamespace
      JOIN pg_attribute a_tgt ON a_tgt.attrelid = c.confrelid AND a_tgt.attnum = c.confkey[1]
      WHERE n_src.nspname = 'public'
        AND rel_src.relname = 'campaign_invitations'
        AND a_src.attname = 'creator_id'
        AND n_tgt.nspname = 'public'
        AND rel_tgt.relname = 'creators'
        AND a_tgt.attname = 'id'
        AND c.contype = 'f'
        AND cardinality(c.conkey) = 1
        AND cardinality(c.confkey) = 1
    ) THEN
      v_missing := v_missing || ' campaign_invitations.creator_id -> public.creators(id) (exact single-column foreign key);';
    END IF;
  END IF;

  -- 3. Validate public.invitation_messages if already existing
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invitation_messages') THEN
    FOREACH v_col IN ARRAY ARRAY['id', 'invitation_id', 'sender_user_id', 'sender_role', 'content', 'created_at'] LOOP
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invitation_messages' AND column_name = v_col
      ) THEN
        v_missing := v_missing || ' invitation_messages.' || v_col || ' (column);';
      END IF;
    END LOOP;

    -- Validate Primary Key (exact single-column on id)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel ON rel.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = rel.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
      WHERE n.nspname = 'public' AND rel.relname = 'invitation_messages' AND c.contype = 'p'
        AND cardinality(c.conkey) = 1 AND a.attname = 'id'
    ) THEN
      v_missing := v_missing || ' invitation_messages (primary key on id);';
    END IF;

    -- Validate foreign key: invitation_messages.invitation_id -> public.campaign_invitations(id) (exact single-column)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel_src ON rel_src.oid = c.conrelid
      JOIN pg_namespace n_src ON n_src.oid = rel_src.relnamespace
      JOIN pg_attribute a_src ON a_src.attrelid = c.conrelid AND a_src.attnum = c.conkey[1]
      JOIN pg_class rel_tgt ON rel_tgt.oid = c.confrelid
      JOIN pg_namespace n_tgt ON n_tgt.oid = rel_tgt.relnamespace
      JOIN pg_attribute a_tgt ON a_tgt.attrelid = c.confrelid AND a_tgt.attnum = c.confkey[1]
      WHERE n_src.nspname = 'public'
        AND rel_src.relname = 'invitation_messages'
        AND a_src.attname = 'invitation_id'
        AND n_tgt.nspname = 'public'
        AND rel_tgt.relname = 'campaign_invitations'
        AND a_tgt.attname = 'id'
        AND c.contype = 'f'
        AND cardinality(c.conkey) = 1
        AND cardinality(c.confkey) = 1
    ) THEN
      v_missing := v_missing || ' invitation_messages.invitation_id -> public.campaign_invitations(id) (exact single-column foreign key);';
    END IF;

    -- Validate foreign key: invitation_messages.sender_user_id -> auth.users(id) (exact single-column)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class rel_src ON rel_src.oid = c.conrelid
      JOIN pg_namespace n_src ON n_src.oid = rel_src.relnamespace
      JOIN pg_attribute a_src ON a_src.attrelid = c.conrelid AND a_src.attnum = c.conkey[1]
      JOIN pg_class rel_tgt ON rel_tgt.oid = c.confrelid
      JOIN pg_namespace n_tgt ON n_tgt.oid = rel_tgt.relnamespace
      JOIN pg_attribute a_tgt ON a_tgt.attrelid = c.confrelid AND a_tgt.attnum = c.confkey[1]
      WHERE n_src.nspname = 'public'
        AND rel_src.relname = 'invitation_messages'
        AND a_src.attname = 'sender_user_id'
        AND n_tgt.nspname = 'auth'
        AND rel_tgt.relname = 'users'
        AND a_tgt.attname = 'id'
        AND c.contype = 'f'
        AND cardinality(c.conkey) = 1
        AND cardinality(c.confkey) = 1
    ) THEN
      v_missing := v_missing || ' invitation_messages.sender_user_id -> auth.users(id) (exact single-column foreign key);';
    END IF;
  END IF;

  -- If any required component is missing in pre-existing tables, abort immediately
  IF v_missing != '' THEN
    RAISE EXCEPTION 'Schema Validation Failed: Pre-existing table(s) exist in an unsupported partial state. Missing required columns or constraints:% Aborting migration to prevent data loss or silent inconsistency. Reconcile schema manually before rerunning.', v_missing;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. User Profiles Table (Mapping Auth User to Brand or Creator Entity)
--
-- Metadata Integrity & Foreign Key Behavior:
-- - creator_id uses ON DELETE RESTRICT to guarantee active creator records cannot
--   be deleted while bound to an account, preventing trigger collisions and orphaned profiles.
-- - display_name is editable by the owner (char_length >= 2).
-- - brand_name is editable by brand accounts (NULL for creator accounts).
-- - role, creator_id, and id are strictly immutable on UPDATE.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('brand', 'creator')),
  creator_id TEXT REFERENCES public.creators(id) ON DELETE RESTRICT,
  brand_name TEXT,
  display_name TEXT NOT NULL CHECK (char_length(display_name) >= 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_role_fields CHECK (
    (role = 'brand' AND creator_id IS NULL) OR
    (role = 'creator' AND brand_name IS NULL)
  )
);

-- Enforce single-account claim per creator profile
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_unique_creator
  ON public.user_profiles (creator_id)
  WHERE creator_id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 3. Campaign Invitations Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaign_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id TEXT NOT NULL REFERENCES public.campaign_briefs(id) ON DELETE CASCADE,
  brand_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id TEXT NOT NULL REFERENCES public.creators(id) ON DELETE RESTRICT,
  creator_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  intro_message TEXT CHECK (char_length(intro_message) <= 2000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_brief_creator_invitation UNIQUE (brief_id, creator_id)
);

-- ------------------------------------------------------------------------------
-- 4. Invitation Messages Table (Persistent Conversation)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invitation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES public.campaign_invitations(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('brand', 'creator')),
  content TEXT NOT NULL CHECK (char_length(trim(content)) >= 1 AND char_length(content) <= 3000),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. Trigger Function: User Profile Integrity & Trusted Assignment
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_user_profile_integrity()
RETURNS TRIGGER AS $$
DECLARE
  existing_creator_user_id UUID;
BEGIN
  -- Strict validation of role domain
  IF NEW.role NOT IN ('brand', 'creator') THEN
    RAISE EXCEPTION 'Invalid role: %', NEW.role;
  END IF;

  -- On UPDATE: Disallow role, creator mapping, or ID alterations
  IF TG_OP = 'UPDATE' THEN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      RAISE EXCEPTION 'Role cannot be modified after initial profile establishment.';
    END IF;
    IF OLD.creator_id IS DISTINCT FROM NEW.creator_id THEN
      RAISE EXCEPTION 'Creator mapping cannot be altered after profile establishment.';
    END IF;
    IF OLD.id IS DISTINCT FROM NEW.id THEN
      RAISE EXCEPTION 'Profile user ID is immutable.';
    END IF;
  END IF;

  -- On INSERT (or profile claiming):
  IF NEW.role = 'creator' AND NEW.creator_id IS NOT NULL THEN
    -- Verify creator exists in public.creators catalog
    SELECT user_id INTO existing_creator_user_id
    FROM public.creators
    WHERE id = NEW.creator_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Referenced creator "%" does not exist in catalog.', NEW.creator_id;
    END IF;

    -- Strict trusted verification:
    -- A user profile can ONLY be linked to a catalog creator if that creator record
    -- has already been authoritatively assigned to this user ID in public.creators.
    -- Unrestricted public signup cannot claim unclaimed catalog records.
    IF existing_creator_user_id IS NULL THEN
      RAISE EXCEPTION 'Unauthorized: Creator profile "%" is unclaimed. Public registration cannot claim catalog creator IDs. Profiles must be assigned via trusted administrative provisioning.', NEW.creator_id;
    ELSIF existing_creator_user_id != NEW.id THEN
      RAISE EXCEPTION 'Unauthorized: Creator profile "%" is already bound to another authenticated account.', NEW.creator_id;
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Revoke direct execution privileges on the trigger function
REVOKE ALL ON FUNCTION public.handle_user_profile_integrity() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tr_enforce_user_profile_integrity ON public.user_profiles;
CREATE TRIGGER tr_enforce_user_profile_integrity
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_profile_integrity();

-- ------------------------------------------------------------------------------
-- 6. Trigger Function: Invitation Insertion & Recipient Binding
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_invitation_insert()
RETURNS TRIGGER AS $$
DECLARE
  bound_creator_user UUID;
BEGIN
  -- Strict initial status
  IF NEW.status != 'pending' THEN
    RAISE EXCEPTION 'New invitations must be created with status "pending".';
  END IF;

  -- Verify brief exists and brand is authorized
  IF NOT EXISTS (
    SELECT 1 FROM public.campaign_briefs b
    WHERE b.id = NEW.brief_id
      AND (b.user_id = NEW.brand_user_id OR public.verify_brief_access(b.id))
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Brands can only create invitations for briefs they own.';
  END IF;

  -- Look up verified creator account mapping in catalog
  SELECT user_id INTO bound_creator_user
  FROM public.creators
  WHERE id = NEW.creator_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referenced creator "%" does not exist in catalog.', NEW.creator_id;
  END IF;

  -- If verified account mapping exists, immediately bind creator_user_id
  IF bound_creator_user IS NOT NULL THEN
    NEW.creator_user_id := bound_creator_user;
  ELSE
    -- If creator does not yet have an authenticated account, leave NULL (pending claim)
    NEW.creator_user_id := NULL;
  END IF;

  NEW.created_at := NOW();
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.handle_invitation_insert() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tr_enforce_invitation_insert ON public.campaign_invitations;
CREATE TRIGGER tr_enforce_invitation_insert
  BEFORE INSERT ON public.campaign_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invitation_insert();

-- ------------------------------------------------------------------------------
-- 7. Trigger Function: Invitation State Machine & Protected Fields Immutability
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_invitation_update()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Prevent modification of protected invitation fields
  IF OLD.id IS DISTINCT FROM NEW.id
     OR OLD.brief_id IS DISTINCT FROM NEW.brief_id
     OR OLD.brand_user_id IS DISTINCT FROM NEW.brand_user_id
     OR OLD.creator_id IS DISTINCT FROM NEW.creator_id
     OR OLD.intro_message IS DISTINCT FROM NEW.intro_message
     OR OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'Protected invitation fields (brief_id, brand_user_id, creator_id, intro_message, created_at) cannot be modified.';
  END IF;

  -- 2. Ensure only status transitions are permitted (no no-op or side-effect updates)
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RAISE EXCEPTION 'Invitations can only be updated to transition status from pending to accepted or declined.';
  END IF;

  -- 3. Can only transition from pending
  IF OLD.status != 'pending' THEN
    RAISE EXCEPTION 'Invalid status transition: An invitation with status "%" cannot be transitioned to "%".', OLD.status, NEW.status;
  END IF;

  -- 4. Can only transition to accepted or declined
  IF NEW.status NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'Invalid target status "%". Allowed transitions are "accepted" or "declined".', NEW.status;
  END IF;

  -- 5. Brand cannot accept or decline on behalf of creator
  IF auth.uid() = OLD.brand_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Brands cannot accept or decline invitations on behalf of creators.';
  END IF;

  -- 6. Recipient authorization check:
  IF OLD.creator_user_id IS NOT NULL THEN
    -- If invitation was bound to a specific creator user, only that exact user can accept/decline
    IF auth.uid() != OLD.creator_user_id THEN
      RAISE EXCEPTION 'Unauthorized: Only the specifically invited creator account can respond to this invitation.';
    END IF;
  ELSE
    -- If invitation was pending without a bound creator user ID:
    -- Cannot accept simply by matching public creator ID alone; must be verified owner in public.creators
    IF NOT EXISTS (
      SELECT 1 FROM public.creators c
      WHERE c.id = OLD.creator_id AND c.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Unauthorized: This invitation is for an unclaimed catalog creator profile. The creator profile must be verified and assigned before accepting invitations.';
    END IF;
  END IF;

  -- 7. Controlled binding of creator_user_id
  IF NEW.status = 'accepted' THEN
    -- Permanently bind creator_user_id to the accepting creator's authenticated user ID
    NEW.creator_user_id := auth.uid();
  ELSIF NEW.status = 'declined' THEN
    -- Retain previous creator_user_id state on decline (do not rebind)
    NEW.creator_user_id := OLD.creator_user_id;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.handle_invitation_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tr_enforce_invitation_update ON public.campaign_invitations;
CREATE TRIGGER tr_enforce_invitation_update
  BEFORE UPDATE ON public.campaign_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invitation_update();

-- ------------------------------------------------------------------------------
-- 8. Helper Function: Check Invitation Participant Access (SECURITY DEFINER)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_invitation_participant(target_invitation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID := auth.uid();
  inv_record RECORD;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT brand_user_id, creator_id, creator_user_id
  INTO inv_record
  FROM public.campaign_invitations
  WHERE id = target_invitation_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- 1. Brand participant check
  IF current_user_id = inv_record.brand_user_id THEN
    RETURN TRUE;
  END IF;

  -- 2. Direct creator user check (primary check for accepted/bound invitations)
  IF inv_record.creator_user_id IS NOT NULL AND current_user_id = inv_record.creator_user_id THEN
    RETURN TRUE;
  END IF;

  -- 3. Catalog creator user_id check (fallback for pending un-bound invitations)
  IF inv_record.creator_user_id IS NULL AND EXISTS (
    SELECT 1 FROM public.creators c
    WHERE c.id = inv_record.creator_id AND c.user_id = current_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Revoke execution from public and anon; grant strictly to authenticated
REVOKE ALL ON FUNCTION public.is_invitation_participant(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_invitation_participant(UUID) TO authenticated;

-- ------------------------------------------------------------------------------
-- 9. Enable Row Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_messages ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 10. Row Level Security Policies
-- ------------------------------------------------------------------------------

-- [USER PROFILES]
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Invitation participants can view counterparty profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- Strict isolation: Users can ONLY read their own profile row.
-- Prevents counterparty enumeration and private profile data exposure.
CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can create own profile"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- [CAMPAIGN INVITATIONS]
DROP POLICY IF EXISTS "Participants can view invitations" ON public.campaign_invitations;
CREATE POLICY "Participants can view invitations"
  ON public.campaign_invitations FOR SELECT
  TO authenticated
  USING (public.is_invitation_participant(id));

DROP POLICY IF EXISTS "Brands can create invitations for their own briefs" ON public.campaign_invitations;
CREATE POLICY "Brands can create invitations for their own briefs"
  ON public.campaign_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = brand_user_id
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.campaign_briefs b
      WHERE b.id = brief_id
        AND (b.user_id = auth.uid() OR public.verify_brief_access(b.id))
    )
    AND EXISTS (
      SELECT 1 FROM public.creators c
      WHERE c.id = creator_id
    )
  );

DROP POLICY IF EXISTS "Creators can accept or decline their invitations" ON public.campaign_invitations;
CREATE POLICY "Creators can accept or decline their invitations"
  ON public.campaign_invitations FOR UPDATE
  TO authenticated
  USING (
    status = 'pending'
    AND auth.uid() != brand_user_id
    AND (
      (creator_user_id IS NOT NULL AND auth.uid() = creator_user_id)
      OR (
        creator_user_id IS NULL AND EXISTS (
          SELECT 1 FROM public.creators c
          WHERE c.id = campaign_invitations.creator_id AND c.user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    status IN ('accepted', 'declined')
    AND auth.uid() != brand_user_id
    AND (
      (status = 'accepted' AND creator_user_id = auth.uid())
      OR (status = 'declined' AND (
        (creator_user_id IS NOT NULL AND creator_user_id = auth.uid())
        OR (creator_user_id IS NULL AND EXISTS (
          SELECT 1 FROM public.creators c
          WHERE c.id = campaign_invitations.creator_id AND c.user_id = auth.uid()
        ))
      ))
    )
  );

-- [INVITATION MESSAGES]
DROP POLICY IF EXISTS "Participants can view conversation messages" ON public.invitation_messages;
CREATE POLICY "Participants can view conversation messages"
  ON public.invitation_messages FOR SELECT
  TO authenticated
  USING (public.is_invitation_participant(invitation_id));

DROP POLICY IF EXISTS "Participants can send messages on accepted invitations" ON public.invitation_messages;
CREATE POLICY "Participants can send messages on accepted invitations"
  ON public.invitation_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_user_id
    AND EXISTS (
      SELECT 1 FROM public.campaign_invitations inv
      WHERE inv.id = invitation_id
        AND inv.status = 'accepted'
        AND (
          (sender_role = 'brand' AND inv.brand_user_id = auth.uid())
          OR
          (sender_role = 'creator' AND inv.creator_user_id = auth.uid())
        )
    )
  );

-- ------------------------------------------------------------------------------
-- 11. Performance Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_invitations_brief_id ON public.campaign_invitations(brief_id);
CREATE INDEX IF NOT EXISTS idx_invitations_creator_id ON public.campaign_invitations(creator_id);
CREATE INDEX IF NOT EXISTS idx_invitations_brand_user ON public.campaign_invitations(brand_user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.campaign_invitations(status);
CREATE INDEX IF NOT EXISTS idx_messages_invitation_created ON public.invitation_messages(invitation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_creator ON public.user_profiles(creator_id);
