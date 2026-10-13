-- ==============================================================================
-- CreatorBridge AI — Trusted Administrative Provisioning Script
-- Run this in the Supabase SQL Editor (requires service-role / admin privileges)
--
-- Security Guarantees:
-- 1. Fails explicitly if ANY required test account is missing from auth.users
--    (no success-like notices or silently incomplete setups).
-- 2. Explicitly validates existing profiles against conflicting roles, creator
--    mappings, and ownership.
-- 3. If ANY conflict exists, raises an exception and aborts the entire transaction
--    immediately without altering any data.
-- 4. Authoritatively binds public.creators.user_id before inserting creator profiles,
--    satisfying the handle_user_profile_integrity trigger contract.
-- 5. Never uses ON CONFLICT DO UPDATE; never overwrites existing records.
-- ==============================================================================

DO $$
DECLARE
  v_brand_user_id UUID;
  v_elena_user_id UUID;
  v_kai_user_id UUID;
  v_existing_profile RECORD;
  v_creator_owner UUID;
  v_other_user_id UUID;
BEGIN
  -- ----------------------------------------------------------------------------
  -- 1. Resolve Required Auth Users by Verified Email (Fails explicitly if missing)
  -- ----------------------------------------------------------------------------
  SELECT id INTO v_brand_user_id FROM auth.users WHERE email = 'brand@creatorbridge.test';
  IF v_brand_user_id IS NULL THEN
    RAISE EXCEPTION 'Provisioning Aborted: Required test account "brand@creatorbridge.test" does not exist in auth.users. The auth user must be created (e.g., via Supabase Auth signup) before running provisioning.';
  END IF;

  SELECT id INTO v_elena_user_id FROM auth.users WHERE email = 'elena@creatorbridge.test';
  IF v_elena_user_id IS NULL THEN
    RAISE EXCEPTION 'Provisioning Aborted: Required test account "elena@creatorbridge.test" does not exist in auth.users. The auth user must be created before running provisioning.';
  END IF;

  SELECT id INTO v_kai_user_id FROM auth.users WHERE email = 'kai@creatorbridge.test';
  IF v_kai_user_id IS NULL THEN
    RAISE EXCEPTION 'Provisioning Aborted: Required test account "kai@creatorbridge.test" does not exist in auth.users. The auth user must be created before running provisioning.';
  END IF;

  -- ----------------------------------------------------------------------------
  -- 2. Provision / Validate Brand Account (brand@creatorbridge.test)
  -- ----------------------------------------------------------------------------
  SELECT * INTO v_existing_profile FROM public.user_profiles WHERE id = v_brand_user_id;
  IF FOUND THEN
    -- Strict conflict detection: Role must be 'brand', creator_id must be NULL
    IF v_existing_profile.role != 'brand' THEN
      RAISE EXCEPTION 'Provisioning Aborted: Existing profile for brand@creatorbridge.test (%) has conflicting role "%" (expected "brand").',
        v_brand_user_id, v_existing_profile.role;
    END IF;
    IF v_existing_profile.creator_id IS NOT NULL THEN
      RAISE EXCEPTION 'Provisioning Aborted: Existing profile for brand@creatorbridge.test (%) has conflicting creator_id "%" (brand accounts cannot have creator_id).',
        v_brand_user_id, v_existing_profile.creator_id;
    END IF;
    RAISE NOTICE 'Brand profile for brand@creatorbridge.test (%) verified without conflict.', v_brand_user_id;
  ELSE
    INSERT INTO public.user_profiles (id, role, brand_name, display_name)
    VALUES (v_brand_user_id, 'brand', 'Lumina Labs', 'Lumina Brand Studio');
    RAISE NOTICE 'Provisioned brand profile for brand@creatorbridge.test (%).', v_brand_user_id;
  END IF;

  -- ----------------------------------------------------------------------------
  -- 3. Provision / Validate Elena Rostova (creator-1)
  -- ----------------------------------------------------------------------------
  -- A. Verify catalog record exists
  SELECT user_id INTO v_creator_owner FROM public.creators WHERE id = 'creator-1';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Provisioning Aborted: Catalog creator "creator-1" does not exist in public.creators.';
  END IF;

  -- B. Verify catalog record is not owned by a different user
  IF v_creator_owner IS NOT NULL AND v_creator_owner != v_elena_user_id THEN
    RAISE EXCEPTION 'Provisioning Aborted: Catalog creator "creator-1" is already owned by user ID % (expected %).',
      v_creator_owner, v_elena_user_id;
  END IF;

  -- C. Verify no other user profile is currently claiming creator-1
  SELECT id INTO v_other_user_id FROM public.user_profiles WHERE creator_id = 'creator-1';
  IF FOUND AND v_other_user_id != v_elena_user_id THEN
    RAISE EXCEPTION 'Provisioning Aborted: Creator "creator-1" is already claimed in user_profiles by user ID % (expected %).',
      v_other_user_id, v_elena_user_id;
  END IF;

  -- D. Check existing profile for elena
  SELECT * INTO v_existing_profile FROM public.user_profiles WHERE id = v_elena_user_id;
  IF FOUND THEN
    IF v_existing_profile.role != 'creator' THEN
      RAISE EXCEPTION 'Provisioning Aborted: Existing profile for elena@creatorbridge.test (%) has conflicting role "%" (expected "creator").',
        v_elena_user_id, v_existing_profile.role;
    END IF;
    IF v_existing_profile.creator_id IS DISTINCT FROM 'creator-1' THEN
      RAISE EXCEPTION 'Provisioning Aborted: Existing profile for elena@creatorbridge.test (%) is linked to conflicting creator_id "%" (expected "creator-1").',
        v_elena_user_id, v_existing_profile.creator_id;
    END IF;
    RAISE NOTICE 'Creator profile for elena@creatorbridge.test (%) verified without conflict.', v_elena_user_id;
  ELSE
    -- Authoritatively bind catalog record before inserting profile
    UPDATE public.creators
    SET user_id = v_elena_user_id, verification_status = 'verified'
    WHERE id = 'creator-1';

    INSERT INTO public.user_profiles (id, role, creator_id, display_name)
    VALUES (v_elena_user_id, 'creator', 'creator-1', 'Elena Rostova');
    RAISE NOTICE 'Provisioned creator profile for elena@creatorbridge.test (%) bound to creator-1.', v_elena_user_id;
  END IF;

  -- ----------------------------------------------------------------------------
  -- 4. Provision / Validate Kai Takahashi (creator-2)
  -- ----------------------------------------------------------------------------
  -- A. Verify catalog record exists
  SELECT user_id INTO v_creator_owner FROM public.creators WHERE id = 'creator-2';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Provisioning Aborted: Catalog creator "creator-2" does not exist in public.creators.';
  END IF;

  -- B. Verify catalog record is not owned by a different user
  IF v_creator_owner IS NOT NULL AND v_creator_owner != v_kai_user_id THEN
    RAISE EXCEPTION 'Provisioning Aborted: Catalog creator "creator-2" is already owned by user ID % (expected %).',
      v_creator_owner, v_kai_user_id;
  END IF;

  -- C. Verify no other user profile is currently claiming creator-2
  SELECT id INTO v_other_user_id FROM public.user_profiles WHERE creator_id = 'creator-2';
  IF FOUND AND v_other_user_id != v_kai_user_id THEN
    RAISE EXCEPTION 'Provisioning Aborted: Creator "creator-2" is already claimed in user_profiles by user ID % (expected %).',
      v_other_user_id, v_kai_user_id;
  END IF;

  -- D. Check existing profile for kai
  SELECT * INTO v_existing_profile FROM public.user_profiles WHERE id = v_kai_user_id;
  IF FOUND THEN
    IF v_existing_profile.role != 'creator' THEN
      RAISE EXCEPTION 'Provisioning Aborted: Existing profile for kai@creatorbridge.test (%) has conflicting role "%" (expected "creator").',
        v_kai_user_id, v_existing_profile.role;
    END IF;
    IF v_existing_profile.creator_id IS DISTINCT FROM 'creator-2' THEN
      RAISE EXCEPTION 'Provisioning Aborted: Existing profile for kai@creatorbridge.test (%) is linked to conflicting creator_id "%" (expected "creator-2").',
        v_kai_user_id, v_existing_profile.creator_id;
    END IF;
    RAISE NOTICE 'Creator profile for kai@creatorbridge.test (%) verified without conflict.', v_kai_user_id;
  ELSE
    -- Authoritatively bind catalog record before inserting profile
    UPDATE public.creators
    SET user_id = v_kai_user_id, verification_status = 'verified'
    WHERE id = 'creator-2';

    INSERT INTO public.user_profiles (id, role, creator_id, display_name)
    VALUES (v_kai_user_id, 'creator', 'creator-2', 'Kai Takahashi');
    RAISE NOTICE 'Provisioned creator profile for kai@creatorbridge.test (%) bound to creator-2.', v_kai_user_id;
  END IF;
END $$;
