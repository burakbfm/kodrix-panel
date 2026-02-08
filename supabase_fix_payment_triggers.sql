-- ============================================
-- KODRIX LMS - FINANCE FIXES & EXPENSES (Phase 1.7)
-- ============================================

-- 1. Create Expenses Table for Teacher Payments / General Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  category TEXT DEFAULT 'teacher_payment', -- 'teacher_payment', 'other', 'salary', 'equipment'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything with expenses
DROP POLICY IF EXISTS "Admins can manage expenses" ON expenses;
CREATE POLICY "Admins can manage expenses" ON expenses
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 2. Comprehensive Payment Trigger Function
-- This handles INSERT, UPDATE, and DELETE on payment_transactions
-- ensuring the parent 'payments' table always has the correct total paid_amount
CREATE OR REPLACE FUNCTION handle_payment_transaction_change()
RETURNS TRIGGER AS $$
BEGIN
  -- IF DELETING
  IF (TG_OP = 'DELETE') THEN
    UPDATE payments
    SET paid_amount = paid_amount - OLD.amount,
        updated_at = NOW()
    WHERE id = OLD.payment_id;
    RETURN OLD;
  
  -- IF INSERTING
  ELSIF (TG_OP = 'INSERT') THEN
    UPDATE payments
    SET paid_amount = paid_amount + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.payment_id;
    RETURN NEW;
  
  -- IF UPDATING
  ELSIF (TG_OP = 'UPDATE') THEN
    UPDATE payments
    SET paid_amount = paid_amount - OLD.amount + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.payment_id;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers to avoid conflicts (clean slate)
DROP TRIGGER IF EXISTS update_payment_balance ON payment_transactions;
DROP TRIGGER IF EXISTS trg_payment_transaction_change ON payment_transactions;

-- Create the New Trigger
CREATE TRIGGER trg_payment_transaction_change
AFTER INSERT OR UPDATE OR DELETE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION handle_payment_transaction_change();
