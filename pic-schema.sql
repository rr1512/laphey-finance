-- Create PICs (Person In Charge) table
CREATE TABLE IF NOT EXISTS pics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE, -- Phone number sebagai unique identifier
  email VARCHAR(255),
  position VARCHAR(100),
  division_id UUID NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update expenses table to include PIC
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS pic_id UUID REFERENCES pics(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pics_division_id ON pics(division_id);
CREATE INDEX IF NOT EXISTS idx_pics_is_active ON pics(is_active);
CREATE INDEX IF NOT EXISTS idx_expenses_pic_id ON expenses(pic_id);
CREATE INDEX IF NOT EXISTS idx_pics_phone ON pics(phone);

-- Insert default PICs for existing divisions
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

    -- Insert default PICs if divisions exist
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