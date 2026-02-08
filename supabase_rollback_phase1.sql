-- ============================================
-- KODRIX LMS - ROLLBACK Script (Phase 1)
-- ============================================
-- Use this ONLY if you need to undo the migration
-- Run in Supabase SQL Editor
-- ============================================

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_update_payment_total ON payment_transactions;
DROP FUNCTION IF EXISTS update_payment_total();

-- Drop tables (CASCADE will remove dependencies)
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS payments CASCADE;

-- Remove columns from profiles (uncomment if needed)
-- ALTER TABLE profiles DROP COLUMN IF EXISTS full_name;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS parent_name;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS parent_phone;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS subject_field;

-- ============================================
-- END OF ROLLBACK
-- ============================================
