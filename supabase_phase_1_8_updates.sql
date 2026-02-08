-- ============================================
-- KODRIX LMS - PHASE 1.8 UPDATES
-- Teacher Payments & Analytics
-- ============================================

-- 1. Update Expenses Table to link to Teachers
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_teacher_id ON expenses(teacher_id);

-- 2. Analytics Function for Dashboard Chart
-- Returns monthly income (payments) vs expenses (including teacher payments)
CREATE OR REPLACE FUNCTION get_monthly_finance_stats()
RETURNS TABLE (
  month TEXT,
  income NUMERIC,
  expense NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH months AS (
    SELECT to_char(date_trunc('month', d), 'YYYY-MM') as m
    FROM generate_series(
      CURRENT_DATE - INTERVAL '11 months',
      CURRENT_DATE,
      '1 month'
    ) d
  ),
  incomes AS (
    SELECT 
      to_char(payment_date, 'YYYY-MM') as m,
      SUM(amount) as total
    FROM payment_transactions
    WHERE payment_date >= (CURRENT_DATE - INTERVAL '11 months')
    GROUP BY 1
  ),
  expense_data AS (
    SELECT 
      to_char(payment_date, 'YYYY-MM') as m,
      SUM(amount) as total
    FROM expenses
    WHERE payment_date >= (CURRENT_DATE - INTERVAL '11 months')
    GROUP BY 1
  )
  SELECT 
    months.m,
    COALESCE(incomes.total, 0) as income,
    COALESCE(expense_data.total, 0) as expense
  FROM months
  LEFT JOIN incomes ON months.m = incomes.m
  LEFT JOIN expense_data ON months.m = expense_data.m
  ORDER BY months.m;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_monthly_finance_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_finance_stats() TO service_role;
