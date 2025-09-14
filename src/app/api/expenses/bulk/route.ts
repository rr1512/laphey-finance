import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { convertToWIBISO } from '@/lib/timezone'

interface BulkExpenseRequest {
  batchName: string
  divisionId: string
  categoryId: string
  subcategoryId: string
  picId: string
  date?: string
  ref?: string
  expenses: {
    amount: number
    description: string
    item?: string
    qty?: number
    unit?: string
    price_per_unit?: number
  }[]
}

export async function POST(request: NextRequest) {
  try {
    // Bulk API is no longer needed - system now uses invoice-based structure
    return NextResponse.json(
      {
        error: 'Bulk expense API has been deprecated',
        message: 'Use /api/invoices for creating invoices with multiple items',
        migration: 'System now uses invoice-based structure where each invoice can have multiple items'
      },
      { status: 410 } // Gone
    )
  } catch (error) {
    console.error('Bulk API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}