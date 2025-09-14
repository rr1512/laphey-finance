-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, category_id) -- Unique subcategory name per category
);

-- Update expenses table to use category and subcategory references
ALTER TABLE expenses 
DROP COLUMN IF EXISTS category,
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id),
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_subcategory_id ON expenses(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Insert default categories and subcategories
INSERT INTO categories (name, description, color) VALUES 
('Operasional', 'Biaya operasional harian', '#3B82F6'),
('Pemasaran', 'Biaya marketing dan promosi', '#10B981'),
('IT & Teknologi', 'Biaya teknologi dan sistem', '#8B5CF6'),
('SDM', 'Biaya sumber daya manusia', '#F59E0B'),
('Keuangan', 'Biaya administrasi keuangan', '#EF4444'),
('Transportasi', 'Biaya perjalanan dan transport', '#06B6D4'),
('Konsumsi', 'Biaya makanan dan konsumsi', '#84CC16')
ON CONFLICT (name) DO NOTHING;

-- Get category IDs for subcategories
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
    SELECT id INTO operasional_id FROM categories WHERE name = 'Operasional';
    SELECT id INTO pemasaran_id FROM categories WHERE name = 'Pemasaran';
    SELECT id INTO it_id FROM categories WHERE name = 'IT & Teknologi';
    SELECT id INTO sdm_id FROM categories WHERE name = 'SDM';
    SELECT id INTO keuangan_id FROM categories WHERE name = 'Keuangan';
    SELECT id INTO transportasi_id FROM categories WHERE name = 'Transportasi';
    SELECT id INTO konsumsi_id FROM categories WHERE name = 'Konsumsi';

    -- Insert subcategories
    INSERT INTO subcategories (name, description, category_id) VALUES 
    -- Operasional
    ('Alat Tulis Kantor', 'Pembelian ATK', operasional_id),
    ('Utilities', 'Listrik, air, internet', operasional_id),
    ('Maintenance', 'Perawatan peralatan', operasional_id),
    ('Supplies', 'Perlengkapan kantor', operasional_id),
    
    -- Pemasaran
    ('Iklan Online', 'Google Ads, Facebook Ads, dll', pemasaran_id),
    ('Event & Exhibition', 'Pameran dan acara', pemasaran_id),
    ('Content Creation', 'Pembuatan konten marketing', pemasaran_id),
    ('Print Marketing', 'Brosur, spanduk, dll', pemasaran_id),
    
    -- IT & Teknologi
    ('Software License', 'Lisensi software', it_id),
    ('Hardware', 'Pembelian perangkat keras', it_id),
    ('Cloud Services', 'AWS, Google Cloud, dll', it_id),
    ('IT Support', 'Jasa IT dan maintenance', it_id),
    
    -- SDM
    ('Recruitment', 'Biaya rekrutmen', sdm_id),
    ('Training', 'Pelatihan karyawan', sdm_id),
    ('Employee Benefits', 'Tunjangan karyawan', sdm_id),
    ('Team Building', 'Acara team building', sdm_id),
    
    -- Keuangan
    ('Bank Charges', 'Biaya administrasi bank', keuangan_id),
    ('Tax & Legal', 'Pajak dan legal', keuangan_id),
    ('Accounting', 'Jasa akuntansi', keuangan_id),
    ('Insurance', 'Asuransi perusahaan', keuangan_id),
    
    -- Transportasi
    ('Fuel', 'Bahan bakar kendaraan', transportasi_id),
    ('Public Transport', 'Transportasi umum', transportasi_id),
    ('Vehicle Maintenance', 'Perawatan kendaraan', transportasi_id),
    ('Travel', 'Perjalanan dinas', transportasi_id),
    
    -- Konsumsi
    ('Meeting Catering', 'Konsumsi rapat', konsumsi_id),
    ('Employee Meals', 'Makan karyawan', konsumsi_id),
    ('Office Snacks', 'Snack kantor', konsumsi_id),
    ('Client Entertainment', 'Jamuan klien', konsumsi_id)
    
    ON CONFLICT (name, category_id) DO NOTHING;
END $$;