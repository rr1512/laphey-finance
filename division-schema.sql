-- Create divisions table
CREATE TABLE IF NOT EXISTS divisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add division_id column to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS division_id UUID REFERENCES divisions(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_division_id ON expenses(division_id);
CREATE INDEX IF NOT EXISTS idx_divisions_name ON divisions(name);

-- Insert some default divisions
INSERT INTO divisions (name, description) VALUES 
('IT', 'Divisi Teknologi Informasi'),
('Finance', 'Divisi Keuangan'),
('HR', 'Divisi Sumber Daya Manusia'),
('Marketing', 'Divisi Pemasaran'),
('Operations', 'Divisi Operasional')
ON CONFLICT (name) DO NOTHING;