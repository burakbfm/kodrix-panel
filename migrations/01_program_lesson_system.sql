-- ============================================
-- MIGRATION: Program-Based Lesson System
-- ============================================
-- Updates for automatic lesson copying and enhanced features

-- ============================================
-- 1. UPDATE CLASS_LESSONS TABLE
-- ============================================

-- Add source lesson reference
ALTER TABLE class_lessons 
  ADD COLUMN IF NOT EXISTS source_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL;

-- Add lesson date (for scheduling)
ALTER TABLE class_lessons
  ADD COLUMN IF NOT EXISTS lesson_date DATE;

-- Add lesson time
ALTER TABLE class_lessons
  ADD COLUMN IF NOT EXISTS lesson_time TIME;

-- Add start date (when teacher activates)
ALTER TABLE class_lessons
  ADD COLUMN IF NOT EXISTS start_date DATE;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_class_lessons_source ON class_lessons(source_lesson_id);

-- ============================================
-- 2. UPDATE CLASS_PROGRAMS TABLE  
-- ============================================

-- Ensure only one active program per class
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_program_per_class 
  ON class_programs(class_id) 
  WHERE is_active = true;

-- ============================================
-- 3. UPDATE CLASS_ASSIGNMENTS TABLE
-- ============================================

-- Add submission type
ALTER TABLE class_assignments
  ADD COLUMN IF NOT EXISTS submission_type VARCHAR(20) DEFAULT 'both' 
  CHECK (submission_type IN ('file', 'text', 'both'));

-- Add start date
ALTER TABLE class_assignments
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- Add file size limit (in MB)
ALTER TABLE class_assignments
  ADD COLUMN IF NOT EXISTS max_file_size_mb INTEGER DEFAULT 10;

-- Add allowed file types (comma-separated)
ALTER TABLE class_assignments
  ADD COLUMN IF NOT EXISTS allowed_file_types TEXT DEFAULT 'pdf,doc,docx,txt,jpg,png';

-- ============================================
-- 4. AUTO-COPY TRIGGER FUNCTION
-- ============================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_copy_lessons_on_program_assign ON class_programs;
DROP FUNCTION IF EXISTS copy_program_lessons_to_class();

-- Create function to copy lessons when program is assigned
CREATE OR REPLACE FUNCTION copy_program_lessons_to_class()
RETURNS TRIGGER AS $$
BEGIN
  -- Only copy if program is being activated for the first time
  IF NEW.is_active = true AND (OLD IS NULL OR OLD.is_active = false) THEN
    
    -- Delete any existing lessons from previous programs
    DELETE FROM class_lessons 
    WHERE class_id = NEW.class_id AND program_id != NEW.program_id;
    
    -- Copy all lessons from the program's modules
    INSERT INTO class_lessons (
      class_id,
      program_id,
      source_lesson_id,
      title,
      module_name,
      description,
      duration_minutes,
      is_active,
      teacher_id,
      created_at,
      updated_at
    )
    SELECT 
      NEW.class_id,
      NEW.program_id,
      l.id,
      l.title,
      m.title,
      l.description,
      l.duration_minutes,
      false, -- Initially inactive
      NEW.teacher_id,
      TIMEZONE('utc', NOW()),
      TIMEZONE('utc', NOW())
    FROM lessons l
    JOIN modules m ON l.module_id = m.id
    WHERE m.program_id = NEW.program_id
    ORDER BY m.order, l.order;
    
    -- Log the copy operation
    RAISE NOTICE 'Copied % lessons from program % to class %', 
      (SELECT COUNT(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.program_id = NEW.program_id),
      NEW.program_id,
      NEW.class_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_copy_lessons_on_program_assign
  AFTER INSERT OR UPDATE ON class_programs
  FOR EACH ROW
  EXECUTE FUNCTION copy_program_lessons_to_class();

-- ============================================
-- 5. UPDATE QUIZ TABLES (already exist, just verify)
-- ============================================

-- Quizzes table is good
-- Add difficulty level if not exists
ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'medium'
  CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- ============================================
-- 6. UPDATE ASSIGNMENT SUBMISSIONS
-- ============================================

-- Ensure submission tracking is complete
ALTER TABLE class_assignment_submissions
  ADD COLUMN IF NOT EXISTS viewed_by_teacher BOOLEAN DEFAULT false;

ALTER TABLE class_assignment_submissions
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check class_lessons updates
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'class_lessons' 
AND column_name IN ('source_lesson_id', 'lesson_date', 'lesson_time', 'start_date');

-- Check class_programs constraint
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'class_programs' 
AND indexname = 'idx_one_active_program_per_class';

-- Check class_assignments updates
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'class_assignments' 
AND column_name IN ('submission_type', 'start_date', 'max_file_size_mb', 'allowed_file_types');

-- Check trigger exists
SELECT tgname, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trigger_copy_lessons_on_program_assign';
