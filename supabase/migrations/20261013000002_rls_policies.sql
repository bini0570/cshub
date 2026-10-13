-- ==============================================================================
-- CS HUB — Row Level Security (RLS) Policies Migration
-- Migration: 20261013000002_rls_policies.sql
-- Description: Strict zero-trust PostgreSQL RLS authorization policies
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- HELPER FUNCTIONS FOR AUTHORIZATION
-- ------------------------------------------------------------------------------

-- Check if current authenticated user has an active admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Prevent students from escalating their own role or status
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.role <> OLD.role OR NEW.status <> OLD.status THEN
      RAISE EXCEPTION 'Access denied: Non-administrators cannot modify roles or account status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_protect_profile_roles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- ------------------------------------------------------------------------------
-- 1. PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Anyone can view public author profiles (name, avatar, bio)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (status = 'active');

-- Users can update their own profile details
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins have full access to manage all profiles
CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 2. CATEGORIES & TAGS POLICIES
-- ------------------------------------------------------------------------------
-- Everyone can view categories and tags
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Tags are viewable by everyone"
  ON public.tags FOR SELECT
  USING (true);

-- Only admins can insert, update, delete categories & tags
CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins can manage tags"
  ON public.tags FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. CONTENT POLICIES
-- ------------------------------------------------------------------------------
-- Public visitors and users can read published public content
CREATE POLICY "Public content is viewable by everyone"
  ON public.content FOR SELECT
  USING (
    status = 'published' AND visibility = 'public'
    OR public.is_admin()
    OR (auth.uid() IS NOT NULL AND author_id = auth.uid())
  );

-- Admins can insert, update, delete any content
CREATE POLICY "Admins can manage all content"
  ON public.content FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. CONTENT_FILES POLICIES
-- ------------------------------------------------------------------------------
-- Viewable if the parent content is viewable
CREATE POLICY "Content files viewable if content published"
  ON public.content_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.content
      WHERE public.content.id = public.content_files.content_id
        AND public.content.status = 'published'
        AND public.content.visibility = 'public'
    )
    OR public.is_admin()
  );

CREATE POLICY "Admins can manage content files"
  ON public.content_files FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. CONTENT_CATEGORIES & CONTENT_TAGS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Content categories viewable by everyone"
  ON public.content_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage content categories"
  ON public.content_categories FOR ALL
  USING (public.is_admin());

CREATE POLICY "Content tags viewable by everyone"
  ON public.content_tags FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage content tags"
  ON public.content_tags FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. SUBMISSIONS POLICIES (Strict Student Privacy)
-- ------------------------------------------------------------------------------
-- Submitter can view only their own submissions; Admins can view all submissions
CREATE POLICY "Users can view their own submissions"
  ON public.submissions FOR SELECT
  USING (auth.uid() = submitter_id OR public.is_admin());

-- Authenticated students can create pending submissions for themselves
CREATE POLICY "Users can create their own submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = submitter_id
    AND status = 'pending'
  );

-- Students can update only when changes are requested or while pending
CREATE POLICY "Users can edit submissions when pending or changes requested"
  ON public.submissions FOR UPDATE
  USING (
    (auth.uid() = submitter_id AND status IN ('pending', 'changes_requested'))
    OR public.is_admin()
  )
  WITH CHECK (
    (auth.uid() = submitter_id AND status IN ('pending', 'changes_requested'))
    OR public.is_admin()
  );

-- Admins can update/delete any submission
CREATE POLICY "Admins can manage all submissions"
  ON public.submissions FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. SUBMISSION_FILES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view files for own submissions"
  ON public.submission_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions
      WHERE public.submissions.id = public.submission_files.submission_id
        AND (public.submissions.submitter_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Users can insert files for own submissions"
  ON public.submission_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.submissions
      WHERE public.submissions.id = public.submission_files.submission_id
        AND public.submissions.submitter_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "Admins can manage submission files"
  ON public.submission_files FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8. BOOKMARKS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own bookmarks"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 9. NOTIFICATIONS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark own notifications read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins or triggers can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_admin() OR auth.uid() IS NOT NULL);

-- ------------------------------------------------------------------------------
-- 10. REPORTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Anyone can submit a report"
  ON public.reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view and manage all reports"
  ON public.reports FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 11. CONTENT_EVENTS (Analytics tracking)
-- ------------------------------------------------------------------------------
CREATE POLICY "Anyone can record a view or download event"
  ON public.content_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view content events analytics"
  ON public.content_events FOR SELECT
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 12. ADMIN_AUDIT_LOGS & SITE_SETTINGS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins can view and create audit logs"
  ON public.admin_audit_logs FOR ALL
  USING (public.is_admin());

CREATE POLICY "Site settings viewable by everyone"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 13. SECURE FIRST-ADMIN BOOTSTRAP FUNCTION
-- ------------------------------------------------------------------------------
-- This function allows setting the initial super-admin only when NO admin currently exists.
-- Once an admin exists, this function will refuse to execute, preventing hostile takeover.
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(target_email TEXT)
RETURNS TEXT AS $$
DECLARE
  existing_admin_count INT;
  target_user_id UUID;
BEGIN
  -- Check if any admin already exists
  SELECT count(*) INTO existing_admin_count FROM public.profiles WHERE role IN ('admin', 'super_admin');
  IF existing_admin_count > 0 THEN
    RAISE EXCEPTION 'Bootstrap denied: System already has % administrator(s). Ask an existing admin to grant privileges.', existing_admin_count;
  END IF;

  -- Locate user ID by email in auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user "%" not found. Please register an account first.', target_email;
  END IF;

  -- Upgrade role
  UPDATE public.profiles
  SET role = 'super_admin', status = 'active'
  WHERE id = target_user_id;

  INSERT INTO public.admin_audit_logs (admin_id, action, target_type, target_id, details)
  VALUES (target_user_id, 'SYSTEM_BOOTSTRAP', 'profile', target_user_id::text, jsonb_build_object('email', target_email, 'role', 'super_admin'));

  RETURN 'Success: Super administrator role granted to ' || target_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
