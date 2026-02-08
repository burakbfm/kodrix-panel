-- ============================================
-- KODRIX LMS - Phase 1 Database Migration
-- ============================================
-- Purpose: Update profiles table and create payments table
-- Instructions: Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. UPDATE PROFILES TABLE
-- ============================================

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS parent_name TEXT,
ADD COLUMN IF NOT EXISTS parent_phone TEXT,
ADD COLUMN IF NOT EXISTS subject_field TEXT;

-- Add comments for documentation
COMMENT ON COLUMN profiles.full_name IS 'Full name of user (student or teacher)';
COMMENT ON COLUMN profiles.parent_name IS 'Parent/Guardian name - applicable for students only';
COMMENT ON COLUMN profiles.parent_phone IS 'Parent/Guardian phone - applicable for students only';
COMMENT ON COLUMN profiles.subject_field IS 'Teaching subject/field - applicable for teachers only';

-- ============================================
-- 2. CREATE PAYMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agreed_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  remaining_balance DECIMAL(10, 2) GENERATED ALWAYS AS (agreed_amount - paid_amount) STORED,
  payment_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE payments IS 'Stores student payment information and balance tracking';
COMMENT ON COLUMN payments.agreed_amount IS 'Total agreed payment amount for the student (in TL)';
COMMENT ON COLUMN payments.paid_amount IS 'Total amount paid so far (in TL)';
COMMENT ON COLUMN payments.remaining_balance IS 'Automatically calculated - agreed_amount minus paid_amount';
COMMENT ON COLUMN payments.payment_date IS 'Date of most recent payment';
COMMENT ON COLUMN payments.notes IS 'Additional notes about payment agreement or status';

-- ============================================
-- 3. CREATE INDEXES
-- ============================================

-- Create index for faster student lookups
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date DESC);

-- ============================================
-- 4. SETUP ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything with payments
CREATE POLICY "Admins can manage all payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy: Students can view their own payment records
CREATE POLICY "Students can view own payments" ON payments
  FOR SELECT USING (
    student_id = auth.uid()
  );

-- ============================================
-- 5. CREATE PAYMENT HISTORY TABLE (OPTIONAL)
-- ============================================
-- This table stores individual payment transactions
-- while the main payments table stores the current state

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'other')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE payment_transactions IS 'Individual payment transaction history';
COMMENT ON COLUMN payment_transactions.amount IS 'Amount of this specific payment (in TL)';

-- Create index for payment lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions(payment_date DESC);

-- RLS for payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all payment transactions" ON payment_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Students can view own payment transactions" ON payment_transactions
  FOR SELECT USING (
    payment_id IN (
      SELECT id FROM payments WHERE student_id = auth.uid()
    )
  );

-- ============================================
-- 6. CREATE TRIGGER FOR UPDATING paid_amount
-- ============================================
-- Automatically update paid_amount when new transaction is added

CREATE OR REPLACE FUNCTION update_payment_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE payments
  SET 
    paid_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM payment_transactions
      WHERE payment_id = NEW.payment_id
    ),
    payment_date = NEW.payment_date,
    updated_at = NOW()
  WHERE id = NEW.payment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payment_total
AFTER INSERT ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_payment_total();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Uncomment and run these to verify the migration

-- Check profiles table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles'
-- ORDER BY ordinal_position;

-- Check payments table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'payments'
-- ORDER BY ordinal_position;

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('payments', 'payment_transactions');

-- ============================================
-- END OF MIGRATION
-- ============================================
