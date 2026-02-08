-- ============================================
-- KODRIX LMS - RLS FIX V3 (NO RECURSION)
-- ============================================
-- Purpose: Fix infinite recursion in RLS policies
-- Error: "infinite recursion detected in policy for relation profiles"
-- Solution: Use SECURITY DEFINER function to bypass RLS
-- ============================================

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "admin_full_access_profiles" ON profiles;
DROP POLICY IF EXISTS "users_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;

DROP POLICY IF EXISTS "Enable read access for all users" ON classes;
DROP POLICY IF EXISTS "Admins have full access to classes" ON classes;
DROP POLICY IF EXISTS "Teachers can view classes" ON classes;
DROP POLICY IF EXISTS "Students can view enrolled classes" ON classes;
DROP POLICY IF EXISTS "admin_full_access_classes" ON classes;
DROP POLICY IF EXISTS "students_view_enrolled_classes" ON classes;
DROP POLICY IF EXISTS "teachers_view_classes" ON classes;

DROP POLICY IF EXISTS "Enable read access for all users" ON lessons;
DROP POLICY IF EXISTS "Admins have full access to lessons" ON lessons;
DROP POLICY IF EXISTS "Teachers can view lessons" ON lessons;
DROP POLICY IF EXISTS "Students can view active lessons" ON lessons;
DROP POLICY IF EXISTS "admin_full_access_lessons" ON lessons;
DROP POLICY IF EXISTS "students_view_active_lessons" ON lessons;
DROP POLICY IF EXISTS "teachers_view_lessons" ON lessons;

DROP POLICY IF EXISTS "Enable read access for all users" ON enrollments;
DROP POLICY IF EXISTS "Admins have full access to enrollments" ON enrollments;
DROP POLICY IF EXISTS "Students can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "admin_full_access_enrollments" ON enrollments;
DROP POLICY IF EXISTS "students_view_own_enrollments" ON enrollments;

DROP POLICY IF EXISTS "Admins can manage all payments" ON payments;
DROP POLICY IF EXISTS "Students can view own payments" ON payments;
DROP POLICY IF EXISTS "admin_full_access_payments" ON payments;
DROP POLICY IF EXISTS "students_view_own_payments" ON payments;

DROP POLICY IF EXISTS "Admins can manage all payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Students can view own payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "admin_full_access_payment_transactions" ON payment_transactions;
DROP POLICY IF EXISTS "students_view_own_payment_transactions" ON payment_transactions;

-- ============================================
-- STEP 2: CREATE HELPER FUNCTION (NO RLS!)
-- ============================================

-- This function bypasses RLS to check user role
-- SECURITY DEFINER means it runs with creator's permissions
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
-- STEP 3: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: CREATE POLICIES USING HELPER FUNCTION
-- ============================================

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Admin: Full access to all profiles
CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Users: View own profile
CREATE POLICY "users_own_profile_select" ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users: Update own profile
CREATE POLICY "users_own_profile_update" ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- CLASSES TABLE POLICIES
-- ============================================

-- Admin: Full access
CREATE POLICY "admin_all_classes" ON classes
  FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Teachers: View all classes
CREATE POLICY "teachers_view_classes" ON classes
  FOR SELECT
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'teacher');

-- Students: View enrolled classes
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

-- Admin: Full access
CREATE POLICY "admin_all_lessons" ON lessons
  FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Teachers: View all lessons
CREATE POLICY "teachers_view_lessons" ON lessons
  FOR SELECT
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'teacher');

-- Students: View active lessons in enrolled classes
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

-- Admin: Full access
CREATE POLICY "admin_all_enrollments" ON enrollments
  FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Students: View own enrollments
CREATE POLICY "students_own_enrollments" ON enrollments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- PAYMENTS TABLE POLICIES
-- ============================================

-- Admin: Full access
CREATE POLICY "admin_all_payments" ON payments
  FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Students: View own payments
CREATE POLICY "students_own_payments" ON payments
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- ============================================
-- PAYMENT_TRANSACTIONS TABLE POLICIES
-- ============================================

-- Admin: Full access
CREATE POLICY "admin_all_transactions" ON payment_transactions
  FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Students: View own payment transactions
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
-- SELECT public.get_user_role(auth.uid());

-- Check your role
-- SELECT id, email, role FROM profiles WHERE id = auth.uid();

-- Test data access (should work now!)
-- SELECT COUNT(*) FROM profiles;
-- SELECT COUNT(*) FROM classes;

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If role is NULL, set it manually:
-- UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL@example.com';

-- Check all policies are created:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- ============================================
-- END OF RLS FIX V3
-- ============================================
