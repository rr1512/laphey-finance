-- Migration to add Item, QTY, Unit, and Price per Unit fields to expenses table

-- Add new columns to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS item VARCHAR(200),
ADD COLUMN IF NOT EXISTS qty DECIMAL(10,3),
ADD COLUMN IF NOT EXISTS unit VARCHAR(50),
ADD COLUMN IF NOT EXISTS price_per_unit DECIMAL(12,2);

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_expenses_item ON expenses(item);
CREATE INDEX IF NOT EXISTS idx_expenses_qty ON expenses(qty);
CREATE INDEX IF NOT EXISTS idx_expenses_unit ON expenses(unit);
CREATE INDEX IF NOT EXISTS idx_expenses_price_per_unit ON expenses(price_per_unit);

-- Add comments for documentation
COMMENT ON COLUMN expenses.item IS 'Item name/product description';
COMMENT ON COLUMN expenses.qty IS 'Quantity/amount of items';
COMMENT ON COLUMN expenses.unit IS 'Unit of measurement (pcs, kg, liter, etc.)';
COMMENT ON COLUMN expenses.price_per_unit IS 'Price per unit/item';