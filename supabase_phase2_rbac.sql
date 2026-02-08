-- ============================================
-- KODRIX LMS - Phase 2: RBAC & Teacher Assignment
-- ============================================

-- 1. Add teacher_id to classes table
ALTER TABLE classes 
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);

COMMENT ON COLUMN classes.teacher_id IS 'Assigned teacher for this class';

-- 2. Update RLS for Classes
-- Allow teachers to view classes they are assigned to
CREATE POLICY "Teachers can view assigned classes" ON classes
  FOR SELECT USING (
    teacher_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Allow teachers to update their assigned classes (optional, strictly speaking admin might do this)
-- Let's allow update for now
CREATE POLICY "Teachers can update assigned classes" ON classes
  FOR UPDATE USING (
    teacher_id = auth.uid()
  ) WITH CHECK (
    teacher_id = auth.uid()
  );

-- 3. Verify Profiles - ensure roles are correct
-- (No schema change, just comment)
