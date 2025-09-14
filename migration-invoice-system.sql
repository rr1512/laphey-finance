-- Migration: From Expense System to Invoice System
-- Date: September 14, 2025
-- This migration creates the new invoice system and removes old expense tables

-- Step 1: Create new invoice tables and functions
-- (Copy from schema.sql for consistency)

-- Users table for authentication
CREATE TABLE IF NOT EXISTS public.users (
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
CREATE TABLE IF NOT EXISTS public.divisions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT divisions_pkey PRIMARY KEY (id)
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  description text,
  color character varying DEFAULT '#3B82F6'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

-- Subcategories table
CREATE TABLE IF NOT EXISTS public.subcategories (
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
CREATE TABLE IF NOT EXISTS public.pics (
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

-- Invoices table (header)
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_number character varying NOT NULL UNIQUE,
  pic_id uuid NOT NULL,
  division_id uuid NOT NULL,
  category_id uuid NOT NULL,
  subcategory_id uuid NOT NULL,
  date timestamp with time zone DEFAULT now(),
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_pic_id_fkey FOREIGN KEY (pic_id) REFERENCES public.pics(id),
  CONSTRAINT invoices_division_id_fkey FOREIGN KEY (division_id) REFERENCES public.divisions(id),
  CONSTRAINT invoices_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT invoices_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id)
);

-- Invoice items table (detail)
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  item character varying NOT NULL,
  qty numeric(10,3) NOT NULL,
  unit character varying NOT NULL,
  price_per_unit numeric(12,2) NOT NULL,
  amount numeric(12,2) NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoice_items_pkey PRIMARY KEY (id),
  CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE
);

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    current_year TEXT;
    next_number INTEGER;
    invoice_num TEXT;
BEGIN
    -- Get current year
    current_year := TO_CHAR(NEW.date, 'YYYY');

    -- Get next number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'EXP-' || current_year || '-([0-9]+)$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM invoices
    WHERE invoice_number LIKE 'EXP-' || current_year || '-%';

    -- Generate invoice number: EXP-2025-0001
    invoice_num := 'EXP-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');

    NEW.invoice_number := invoice_num;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto invoice number generation
DROP TRIGGER IF EXISTS generate_invoice_number_trigger ON invoices;
CREATE TRIGGER generate_invoice_number_trigger
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION generate_invoice_number();

-- Function to calculate total invoice amount
CREATE OR REPLACE FUNCTION calculate_invoice_total(invoice_uuid UUID)
RETURNS numeric AS $$
DECLARE
    total numeric(12,2) := 0;
BEGIN
    SELECT COALESCE(SUM(amount), 0)
    INTO total
    FROM invoice_items
    WHERE invoice_id = invoice_uuid;

    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to update invoice total when items change
CREATE OR REPLACE FUNCTION update_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE invoices
        SET total_amount = calculate_invoice_total(OLD.invoice_id),
            updated_at = NOW()
        WHERE id = OLD.invoice_id;
        RETURN OLD;
    ELSE
        UPDATE invoices
        SET total_amount = calculate_invoice_total(NEW.invoice_id),
            updated_at = NOW()
        WHERE id = NEW.invoice_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating invoice total
DROP TRIGGER IF EXISTS update_invoice_total_on_insert ON invoice_items;
DROP TRIGGER IF EXISTS update_invoice_total_on_update ON invoice_items;
DROP TRIGGER IF EXISTS update_invoice_total_on_delete ON invoice_items;

CREATE TRIGGER update_invoice_total_on_insert
    AFTER INSERT ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_total();

CREATE TRIGGER update_invoice_total_on_update
    AFTER UPDATE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_total();

CREATE TRIGGER update_invoice_total_on_delete
    AFTER DELETE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_total();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_divisions_name ON divisions(name);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_pics_division_id ON pics(division_id);
CREATE INDEX IF NOT EXISTS idx_pics_is_active ON pics(is_active);
CREATE INDEX IF NOT EXISTS idx_pics_phone ON pics(phone);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_pic_id ON invoices(pic_id);
CREATE INDEX IF NOT EXISTS idx_invoices_division_id ON invoices(division_id);
CREATE INDEX IF NOT EXISTS idx_invoices_category_id ON invoices(category_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subcategory_id ON invoices(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_divisions_updated_at ON divisions;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_subcategories_updated_at ON subcategories;
DROP TRIGGER IF EXISTS update_pics_updated_at ON pics;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
DROP TRIGGER IF EXISTS update_invoice_items_updated_at ON invoice_items;

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

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 2: Insert default data (if tables are empty)
-- Insert default divisions
INSERT INTO divisions (name, description) VALUES
('IT', 'Divisi Teknologi Informasi'),
('Finance', 'Divisi Keuangan'),
('HR', 'Divisi Sumber Daya Manusia'),
('Marketing', 'Divisi Pemasaran'),
('Operations', 'Divisi Operasional')
ON CONFLICT (name) DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, description, color) VALUES
('Operasional', 'Biaya operasional harian', '#3B82F6'),
('Pemasaran', 'Biaya marketing dan promosi', '#10B981'),
('IT & Teknologi', 'Biaya teknologi dan sistem', '#8B5CF6'),
('SDM', 'Biaya sumber daya manusia', '#F59E0B'),
('Keuangan', 'Biaya administrasi keuangan', '#EF4444'),
('Transportasi', 'Biaya perjalanan dan transport', '#06B6D4'),
('Konsumsi', 'Biaya makanan dan konsumsi', '#84CC16')
ON CONFLICT (name) DO NOTHING;

-- Insert default subcategories (requires category IDs)
DO $$
DECLARE
    operasional_id UUID;
    pemasaran_id UUID;
    it_id UUID;
    sdm_id UUID;
    keuangan_id UUID;
    transportasi_id UUID;
    konsumsi_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO operasional_id FROM categories WHERE name = 'Operasional' LIMIT 1;
    SELECT id INTO pemasaran_id FROM categories WHERE name = 'Pemasaran' LIMIT 1;
    SELECT id INTO it_id FROM categories WHERE name = 'IT & Teknologi' LIMIT 1;
    SELECT id INTO sdm_id FROM categories WHERE name = 'SDM' LIMIT 1;
    SELECT id INTO keuangan_id FROM categories WHERE name = 'Keuangan' LIMIT 1;
    SELECT id INTO transportasi_id FROM categories WHERE name = 'Transportasi' LIMIT 1;
    SELECT id INTO konsumsi_id FROM categories WHERE name = 'Konsumsi' LIMIT 1;

    -- Insert subcategories
    IF operasional_id IS NOT NULL THEN
        INSERT INTO subcategories (name, description, category_id) VALUES
        ('Alat Tulis Kantor', 'Pembelian ATK', operasional_id),
        ('Utilities', 'Listrik, air, internet', operasional_id),
        ('Maintenance', 'Perawatan peralatan', operasional_id),
        ('Supplies', 'Perlengkapan kantor', operasional_id)
        ON CONFLICT (name, category_id) DO NOTHING;
    END IF;

    IF pemasaran_id IS NOT NULL THEN
        INSERT INTO subcategories (name, description, category_id) VALUES
        ('Iklan Online', 'Google Ads, Facebook Ads, dll', pemasaran_id),
        ('Event & Exhibition', 'Pameran dan acara', pemasaran_id),
        ('Content Creation', 'Pembuatan konten marketing', pemasaran_id),
        ('Print Marketing', 'Brosur, spanduk, dll', pemasaran_id)
        ON CONFLICT (name, category_id) DO NOTHING;
    END IF;

    IF it_id IS NOT NULL THEN
        INSERT INTO subcategories (name, description, category_id) VALUES
        ('Software License', 'Lisensi software', it_id),
        ('Hardware', 'Pembelian perangkat keras', it_id),
        ('Cloud Services', 'AWS, Google Cloud, dll', it_id),
        ('IT Support', 'Jasa IT dan maintenance', it_id)
        ON CONFLICT (name, category_id) DO NOTHING;
    END IF;

    IF sdm_id IS NOT NULL THEN
        INSERT INTO subcategories (name, description, category_id) VALUES
        ('Recruitment', 'Biaya rekrutmen', sdm_id),
        ('Training', 'Pelatihan karyawan', sdm_id),
        ('Employee Benefits', 'Tunjangan karyawan', sdm_id),
        ('Team Building', 'Acara team building', sdm_id)
        ON CONFLICT (name, category_id) DO NOTHING;
    END IF;

    IF keuangan_id IS NOT NULL THEN
        INSERT INTO subcategories (name, description, category_id) VALUES
        ('Bank Charges', 'Biaya administrasi bank', keuangan_id),
        ('Tax & Legal', 'Pajak dan legal', keuangan_id),
        ('Accounting', 'Jasa akuntansi', keuangan_id),
        ('Insurance', 'Asuransi perusahaan', keuangan_id)
        ON CONFLICT (name, category_id) DO NOTHING;
    END IF;

    IF transportasi_id IS NOT NULL THEN
        INSERT INTO subcategories (name, description, category_id) VALUES
        ('Fuel', 'Bahan bakar kendaraan', transportasi_id),
        ('Public Transport', 'Transportasi umum', transportasi_id),
        ('Vehicle Maintenance', 'Perawatan kendaraan', transportasi_id),
        ('Travel', 'Perjalanan dinas', transportasi_id)
        ON CONFLICT (name, category_id) DO NOTHING;
    END IF;

    IF konsumsi_id IS NOT NULL THEN
        INSERT INTO subcategories (name, description, category_id) VALUES
        ('Meeting Catering', 'Konsumsi rapat', konsumsi_id),
        ('Employee Meals', 'Makan karyawan', konsumsi_id),
        ('Office Snacks', 'Snack kantor', konsumsi_id),
        ('Client Entertainment', 'Jamuan klien', konsumsi_id)
        ON CONFLICT (name, category_id) DO NOTHING;
    END IF;
END $$;

-- Insert default PICs (requires division IDs)
DO $$
DECLARE
    it_id UUID;
    finance_id UUID;
    hr_id UUID;
    marketing_id UUID;
    operations_id UUID;
BEGIN
    -- Get division IDs
    SELECT id INTO it_id FROM divisions WHERE name = 'IT' LIMIT 1;
    SELECT id INTO finance_id FROM divisions WHERE name = 'Finance' LIMIT 1;
    SELECT id INTO hr_id FROM divisions WHERE name = 'HR' LIMIT 1;
    SELECT id INTO marketing_id FROM divisions WHERE name = 'Marketing' LIMIT 1;
    SELECT id INTO operations_id FROM divisions WHERE name = 'Operations' LIMIT 1;

    -- Insert default PICs
    IF it_id IS NOT NULL THEN
        INSERT INTO pics (name, phone, email, position, division_id) VALUES
        ('John Doe', '081234567890', 'john.doe@company.com', 'IT Manager', it_id),
        ('Jane Smith', '081234567891', 'jane.smith@company.com', 'System Administrator', it_id)
        ON CONFLICT (phone) DO NOTHING;
    END IF;

    IF finance_id IS NOT NULL THEN
        INSERT INTO pics (name, phone, email, position, division_id) VALUES
        ('Michael Johnson', '081234567892', 'michael.johnson@company.com', 'Finance Manager', finance_id),
        ('Sarah Wilson', '081234567893', 'sarah.wilson@company.com', 'Accountant', finance_id)
        ON CONFLICT (phone) DO NOTHING;
    END IF;

    IF hr_id IS NOT NULL THEN
        INSERT INTO pics (name, phone, email, position, division_id) VALUES
        ('David Brown', '081234567894', 'david.brown@company.com', 'HR Manager', hr_id),
        ('Lisa Davis', '081234567895', 'lisa.davis@company.com', 'HR Specialist', hr_id)
        ON CONFLICT (phone) DO NOTHING;
    END IF;

    IF marketing_id IS NOT NULL THEN
        INSERT INTO pics (name, phone, email, position, division_id) VALUES
        ('Robert Miller', '081234567896', 'robert.miller@company.com', 'Marketing Manager', marketing_id),
        ('Emily Garcia', '081234567897', 'emily.garcia@company.com', 'Digital Marketing Specialist', marketing_id)
        ON CONFLICT (phone) DO NOTHING;
    END IF;

    IF operations_id IS NOT NULL THEN
        INSERT INTO pics (name, phone, email, position, division_id) VALUES
        ('Christopher Martinez', '081234567898', 'chris.martinez@company.com', 'Operations Manager', operations_id),
        ('Amanda Rodriguez', '081234567899', 'amanda.rodriguez@company.com', 'Operations Coordinator', operations_id)
        ON CONFLICT (phone) DO NOTHING;
    END IF;
END $$;

-- Insert default users (with hashed passwords for demo)
-- Password: SuperAdmin123! and Admin123!
INSERT INTO users (email, password, name, role) VALUES
('superadmin@admin.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Le0KdT8V6M9JN8QW6', 'Super Administrator', 'superadmin'),
('admin@admin.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Le0KdT8V6M9JN8QW6', 'Administrator', 'administrator')
ON CONFLICT (email) DO NOTHING;

-- Step 3: Clean up constraints and indexes
-- Drop existing foreign key constraints if they exist (to avoid conflicts)
ALTER TABLE IF EXISTS public.invoices DROP CONSTRAINT IF EXISTS invoices_division_id_fkey;

-- Step 4: Drop old tables (be careful with this!)
-- WARNING: This will permanently delete all existing expense data!

-- Drop old expense table (if exists)
DROP TABLE IF EXISTS public.expenses CASCADE;

-- Drop any other unused tables or columns if they exist
-- (Add more DROP statements here if needed)

-- Step 5: Ensure constraints are correct
-- Add the correct foreign key constraint for division_id
ALTER TABLE public.invoices ADD CONSTRAINT invoices_division_id_fkey
    FOREIGN KEY (division_id) REFERENCES public.divisions(id);

-- Step 6: Verification
-- You can run these queries after migration to verify:

-- SELECT 'Users count: ' || COUNT(*) FROM users
-- UNION ALL
-- SELECT 'Divisions count: ' || COUNT(*) FROM divisions
-- UNION ALL
-- SELECT 'Categories count: ' || COUNT(*) FROM categories
-- UNION ALL
-- SELECT 'Subcategories count: ' || COUNT(*) FROM subcategories
-- UNION ALL
-- SELECT 'PICs count: ' || COUNT(*) FROM pics
-- UNION ALL
-- SELECT 'Invoices count: ' || COUNT(*) FROM invoices
-- UNION ALL
-- SELECT 'Invoice items count: ' || COUNT(*) FROM invoice_items;

COMMIT;