-- Migration: Consolidate invoices and invoice_items into single expenses table
-- Date: September 14, 2025
-- Description: Migrate from 2-table system (invoices + invoice_items) to 1-table system (expenses) with JSONB details

-- Step 1: Drop old tables if they exist
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;

-- Step 2: Create expenses table with JSONB details column
CREATE TABLE expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  expense_number character varying NOT NULL UNIQUE,
  title character varying NOT NULL,
  pic_id uuid,
  division_id uuid,
  category_id uuid,
  subcategory_id uuid,
  date timestamp with time zone DEFAULT now(),
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  details jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_pic_id_fkey FOREIGN KEY (pic_id) REFERENCES public.pics(id),
  CONSTRAINT expenses_division_id_fkey FOREIGN KEY (division_id) REFERENCES public.divisions(id),
  CONSTRAINT expenses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT expenses_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id)
);

-- Step 3: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_division ON expenses(division_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_pic ON expenses(pic_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_number ON expenses(expense_number);

-- Step 4: Create function to generate expense number
CREATE OR REPLACE FUNCTION generate_expense_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    current_year text;
    next_number integer;
    expense_number text;
BEGIN
    -- Get current year
    current_year := to_char(CURRENT_DATE, 'YYYY');

    -- Get next number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(expenses.expense_number FROM 'EXP-[0-9]{4}-([0-9]{4})') AS INTEGER)), 0) + 1
    INTO next_number
    FROM expenses
    WHERE expenses.expense_number LIKE 'EXP-' || current_year || '-%';

    -- Format as EXP-YYYY-NNNN
    expense_number := 'EXP-' || current_year || '-' || LPAD(next_number::text, 4, '0');

    RETURN expense_number;
END;
$$;

-- Step 5: Create function to set expense number on insert
CREATE OR REPLACE FUNCTION set_expense_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only set expense_number if it's NULL (for new inserts)
    IF NEW.expense_number IS NULL THEN
        NEW.expense_number := generate_expense_number();
    END IF;
    RETURN NEW;
END;
$$;

-- Step 6: Create trigger to auto-generate expense number
CREATE TRIGGER set_expense_number_trigger
    BEFORE INSERT ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION set_expense_number();

-- Step 7: Create function to update updated_at
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Step 8: Create trigger to update updated_at
CREATE TRIGGER update_expenses_updated_at_trigger
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_expenses_updated_at();

-- Step 8: Add comments
COMMENT ON TABLE expenses IS 'Expenses table with JSONB details for invoice items';
COMMENT ON COLUMN expenses.expense_number IS 'Auto-generated expense number in format EXP-YYYY-NNNN';
COMMENT ON COLUMN expenses.title IS 'Title/description of the expense (required)';
COMMENT ON COLUMN expenses.details IS 'JSONB array containing expense item details';
COMMENT ON COLUMN expenses.total_amount IS 'Calculated total amount from all items';

-- Step 9: Verify migration
SELECT
    'Migration completed successfully' as status,
    COUNT(*) as total_expenses_migrated
FROM expenses;