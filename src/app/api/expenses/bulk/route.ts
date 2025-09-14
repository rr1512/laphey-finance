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
    const body: BulkExpenseRequest = await request.json()
    const { batchName, divisionId, categoryId, subcategoryId, picId, date, ref, expenses } = body
    
    console.log('Bulk API received:', { 
      batchName, 
      expensesCount: expenses?.length, 
      firstExpense: expenses?.[0] 
    })

    if (!batchName || !divisionId || !categoryId || !subcategoryId || !picId || !expenses || expenses.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields (batchName, divisionId, categoryId, subcategoryId, picId, expenses)' },
        { status: 400 }
      )
    }

    // Validate all expenses
    for (const expense of expenses) {
      if (!expense.amount) {
        return NextResponse.json(
          { error: 'All expense fields are required (amount)' },
          { status: 400 }
        )
      }
    }

    // Generate a single batch ID for all expenses
    const batchId = crypto.randomUUID()

    // Prepare expenses with batch info
    const expensesWithBatch = expenses.map(expense => ({
      amount: expense.amount,
        description: expense.description || '',
      item: expense.item || null,
      qty: expense.qty || null,
      unit: expense.unit || null,
      price_per_unit: expense.price_per_unit || null,
      date: convertToWIBISO(date || ''),
      ref: ref || null,
      batch_id: batchId,
      batch_name: batchName,
      division_id: divisionId,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      pic_id: picId
    }))

    console.log('Inserting expenses:', expensesWithBatch.length, 'items')
    
    const { data, error } = await supabaseServer
      .from('expenses')
      .insert(expensesWithBatch)
      .select(`
        *,
        division:divisions(*),
        category:categories(*),
        subcategory:subcategories(*),
        pic:pics(*)
      `)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('Successfully inserted:', data.length, 'expenses')
    
    return NextResponse.json({
      message: `${data.length} expenses created successfully`,
      batchId,
      expenses: data
    }, { status: 201 })
    
  } catch (error) {
    console.error('Bulk insert error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}