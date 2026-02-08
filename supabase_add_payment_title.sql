-- Add title column to payments table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'title') THEN
        ALTER TABLE "payments" ADD COLUMN "title" TEXT DEFAULT 'Genel Anlaşma';
    END IF;
END $$;
