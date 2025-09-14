-- Finance App Database Schema - Invoice System
-- Updated schema as of September 14, 2025

-- Users table for authentication
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  password character varying NOT NULL,
  name character varying NOT NULL,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['superadmin'::character varying, 'administrator'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Divisions table
CREATE TABLE public.divisions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT divisions_pkey PRIMARY KEY (id)
);

-- Categories table
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  description text,
  color character varying DEFAULT '#3B82F6'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

-- Subcategories table
CREATE TABLE public.subcategories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  category_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subcategories_pkey PRIMARY KEY (id),
  CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);

-- PICs (Person In Charge) table
CREATE TABLE public.pics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  phone character varying NOT NULL UNIQUE,
  email character varying,
  position character varying,
  division_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pics_pkey PRIMARY KEY (id),
  CONSTRAINT pics_division_id_fkey FOREIGN KEY (division_id) REFERENCES public.divisions(id)
);

-- Expenses table (consolidated with JSONB details)
CREATE TABLE public.expenses (
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

-- Function to generate expense number
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
    SELECT COALESCE(MAX(CAST(SUBSTRING(expense_number FROM 'EXP-[0-9]{4}-([0-9]{4})') AS INTEGER)), 0) + 1
    INTO next_number
    FROM expenses
    WHERE expense_number LIKE 'EXP-' || current_year || '-%';

    -- Format as EXP-YYYY-NNNN
    expense_number := 'EXP-' || current_year || '-' || LPAD(next_number::text, 4, '0');

    RETURN expense_number;
END;
$$;

-- Function to set expense number on insert
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

-- Trigger to auto-generate expense number
CREATE TRIGGER set_expense_number_trigger
    BEFORE INSERT ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION set_expense_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_expenses_updated_at_trigger
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_expenses_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_divisions_name ON divisions(name);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_pics_division_id ON pics(division_id);
CREATE INDEX IF NOT EXISTS idx_pics_is_active ON pics(is_active);
CREATE INDEX IF NOT EXISTS idx_pics_phone ON pics(phone);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_number ON expenses(expense_number);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_division ON expenses(division_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_pic ON expenses(pic_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_divisions_updated_at BEFORE UPDATE ON divisions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pics_updated_at BEFORE UPDATE ON pics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE expenses IS 'Expenses table with JSONB details for invoice items';
COMMENT ON COLUMN expenses.expense_number IS 'Auto-generated expense number in format EXP-YYYY-NNNN';
COMMENT ON COLUMN expenses.title IS 'Title/description of the expense (required)';
COMMENT ON COLUMN expenses.details IS 'JSONB array containing expense item details';
COMMENT ON COLUMN expenses.total_amount IS 'Calculated total amount from all items';