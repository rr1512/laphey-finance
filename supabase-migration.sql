-- Migration script to add batch_id and batch_name to existing expenses table

-- Add new columns to existing expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS batch_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS batch_name VARCHAR(200);

-- Create index for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_expenses_batch_id ON expenses(batch_id);

-- Update existing records to have individual batch_ids (each expense gets its own batch)
UPDATE expenses 
SET batch_id = gen_random_uuid() 
WHERE batch_id IS NULL;