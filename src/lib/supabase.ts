import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create Supabase client with anon key for client-side
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type PIC = {
  id: string
  name: string
  phone: string
  email: string | null
  position: string | null
  division_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Division = {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type Category = {
  id: string
  name: string
  description: string | null
  color: string
  created_at: string
  updated_at: string
}

export type Subcategory = {
  id: string
  name: string
  description: string | null
  category_id: string
  category?: Category
  created_at: string
  updated_at: string
}

export type Expense = {
  id: string
  amount: number
  description: string
  item: string | null
  qty: number | null
  unit: string | null
  price_per_unit: number | null
  date: string
  ref: string | null
  batch_id: string
  batch_name: string | null
  division_id: string | null
  category_id: string | null
  subcategory_id: string | null
  pic_id: string | null
  division?: Division
  category?: Category
  subcategory?: Subcategory
  pic?: PIC
  created_at: string
}