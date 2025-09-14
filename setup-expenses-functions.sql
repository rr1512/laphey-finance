-- Setup functions and triggers for expenses table
-- Run this after the expenses table is created

-- Step 1: Create function to generate expense number (fixed version)
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

    -- Get next number for this year (explicitly reference table.column to avoid ambiguity)
    SELECT COALESCE(MAX(CAST(SUBSTRING(e.expense_number FROM 'EXP-[0-9]{4}-([0-9]{4})') AS INTEGER)), 0) + 1
    INTO next_number
    FROM expenses e
    WHERE e.expense_number LIKE 'EXP-' || current_year || '-%';

    -- Format as EXP-YYYY-NNNN
    expense_number := 'EXP-' || current_year || '-' || LPAD(next_number::text, 4, '0');

    RETURN expense_number;
END;
$$;

-- Step 2: Create function to set expense number on insert
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

-- Step 3: Create trigger to auto-generate expense number
DROP TRIGGER IF EXISTS set_expense_number_trigger ON expenses;
CREATE TRIGGER set_expense_number_trigger
    BEFORE INSERT ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION set_expense_number();

-- Step 4: Create function to update updated_at
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Step 5: Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_expenses_updated_at_trigger ON expenses;
CREATE TRIGGER update_expenses_updated_at_trigger
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_expenses_updated_at();

-- Step 6: Add indexes for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_division ON expenses(division_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_pic ON expenses(pic_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_number ON expenses(expense_number);

-- Step 7: Add comments for documentation
COMMENT ON TABLE expenses IS 'Expenses table with JSONB details for invoice items';
COMMENT ON COLUMN expenses.expense_number IS 'Auto-generated expense number in format EXP-YYYY-NNNN';
COMMENT ON COLUMN expenses.title IS 'Title/description of the expense (required)';
COMMENT ON COLUMN expenses.details IS 'JSONB array containing expense item details';
COMMENT ON COLUMN expenses.total_amount IS 'Calculated total amount from all items';

-- Step 8: Test the setup by inserting a sample expense
-- Uncomment the lines below to test (replace with actual IDs):

-- INSERT INTO expenses (
--   title,
--   pic_id,
--   division_id,
--   category_id,
--   subcategory_id,
--   date,
--   total_amount,
--   details,
--   notes
-- ) VALUES (
--   'Test Expense',
--   (SELECT id FROM pics LIMIT 1),
--   (SELECT id FROM divisions LIMIT 1),
--   (SELECT id FROM categories LIMIT 1),
--   (SELECT id FROM subcategories LIMIT 1),
--   CURRENT_TIMESTAMP,
--   100000,
--   '[{"item": "Test Item", "qty": 1, "unit": "pcs", "price_per_unit": 100000, "amount": 100000, "description": "Test description"}]'::jsonb,
--   'Test notes'
-- );

-- Check if expense was created with auto-generated number:
-- SELECT expense_number, title FROM expenses WHERE title = 'Test Expense';