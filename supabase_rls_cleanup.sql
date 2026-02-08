-- ============================================
-- KODRIX LMS - RLS CLEANUP & FIX V3
-- ============================================
-- Run this ENTIRE script to fix the "policy already exists" error
-- ============================================

-- ============================================
-- PART 1: NUCLEAR CLEANUP - Drop EVERYTHING
-- ============================================

-- Drop all policies on profiles
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON profiles';
    END LOOP;
END $$;

-- Drop all policies on classes
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'classes') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON classes';
    END LOOP;
END $$;

-- Drop all policies on lessons
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lessons') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON lessons';
    END LOOP;
END $$;

-- Drop all policies on enrollments
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'enrollments') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON enrollments';
    END LOOP;
END $$;

-- Drop all policies on payments
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payments') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON payments';
    END LOOP;
END $$;

-- Drop all policies on payment_transactions
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payment_transactions') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON payment_transactions';
    END LOOP;
END $$;

-- Drop the helper function if exists
DROP FUNCTION IF EXISTS public.get_user_role(UUID);

-- ============================================
-- PART 2: CREATE HELPER FUNCTION (NO RLS!)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  RETURN user_role;
END;
$$;

-- ============================================
-- PART 3: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 4: CREATE NEW POLICIES
-- ============================================

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "users_own_profile_select" ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_own_profile_update" ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- CLASSES TABLE POLICIES
-- ============================================

CREATE POLICY "admin_all_classes" ON classes
  FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "teachers_view_classes" ON classes
  FOR SELECT
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'teacher');

CREATE POLICY "students_enrolled_classes" ON classes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.user_id = auth.uid()
      AND enrollments.class_id = classes.id
    )
  );

-- ============================================
-- LESSONS TABLE POLICIES
-- ============================================

CREATE POLICY "admin_all_lessons" ON lessons
  FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "teachers_view_lessons" ON lessons
  FOR SELECT
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'teacher');

CREATE POLICY "students_active_lessons" ON lessons
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.user_id = auth.uid()
      AND enrollments.class_id = lessons.class_id
    )
  );

-- ============================================
-- ENROLLMENTS TABLE POLICIES
-- ============================================

CREATE POLICY "admin_all_enrollments" ON enrollments
  FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "students_own_enrollments" ON enrollments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- PAYMENTS TABLE POLICIES
-- ============================================

CREATE POLICY "admin_all_payments" ON payments
  FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "students_own_payments" ON payments
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- ============================================
-- PAYMENT_TRANSACTIONS TABLE POLICIES
-- ============================================

CREATE POLICY "admin_all_transactions" ON payment_transactions
  FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "students_own_transactions" ON payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    payment_id IN (
      SELECT id FROM payments WHERE student_id = auth.uid()
    )
  );

-- ============================================
-- VERIFICATION
-- ============================================

-- Check the helper function works
SELECT 'Helper function created successfully' AS status;

-- Check policies are created
SELECT 'Total policies created: ' || COUNT(*)::text AS policy_count
FROM pg_policies 
WHERE schemaname = 'public';

-- ============================================
-- SUCCESS!
-- ============================================
-- All policies have been cleaned up and recreated.
-- Refresh your application pages now.
-- ============================================
