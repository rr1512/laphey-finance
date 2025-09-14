-- Migration: Add date and ref fields to expenses table
-- Date: 2024-12-19

-- Add date field (default to current timestamp in WIB timezone)
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta');

-- Add ref field (optional reference)
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS ref VARCHAR(100);

-- Create index for date field for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

-- Create index for ref field for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_ref ON expenses(ref);

-- Add comments for documentation
COMMENT ON COLUMN expenses.date IS 'Tanggal dan waktu pengeluaran';
COMMENT ON COLUMN expenses.ref IS 'Referensi atau nomor dokumen pengeluaran (opsional)';