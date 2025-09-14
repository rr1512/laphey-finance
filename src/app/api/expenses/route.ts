import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { convertToWIBISO } from '@/lib/timezone'

// GET - Fetch all expenses
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('expenses')
      .select(`
        *,
        division:divisions(*),
        category:categories(*),
        subcategory:subcategories(*),
        pic:pics(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      // New format fields (preferred)
      title,
      division_id,
      category_id,
      subcategory_id,
      pic_id,
      date,
      notes,
      details,

      // Legacy fields for backward compatibility
      amount,
      description,
      item,
      qty,
      unit,
      price_per_unit,
      ref
    } = body

    // Validate required fields for new format
    if (!title || !division_id || !category_id || !subcategory_id || !pic_id) {
      return NextResponse.json(
        { error: 'Missing required fields (title, division_id, category_id, subcategory_id, pic_id)' },
        { status: 400 }
      )
    }

    // If details provided, use new format
    if (details && Array.isArray(details)) {
      // Calculate total amount from details
      const totalAmount = details.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)

      const { data: expenseData, error: expenseError } = await supabaseServer
        .from('expenses')
        .insert([{
          title,
          pic_id,
          division_id,
          category_id,
          subcategory_id,
          date: convertToWIBISO(date || ''),
          total_amount: totalAmount,
          details: JSON.stringify(details),
          notes: notes || null
        }])
        .select(`
          *,
          division:divisions(*),
          category:categories(*),
          subcategory:subcategories(*),
          pic:pics(*)
        `)
        .single()

      if (expenseError) {
        return NextResponse.json({ error: expenseError.message }, { status: 400 })
      }

      return NextResponse.json(expenseData, { status: 201 })
    }

    // Backward compatibility: single item format
    if (amount && item) {
      const details = [{
        item: item,
        qty: qty || 1,
        unit: unit || 'pcs',
        price_per_unit: price_per_unit || amount,
        amount: amount,
        description: description || null
      }]

      const { data: expenseData, error: expenseError } = await supabaseServer
        .from('expenses')
        .insert([{
          title: title || item || 'Expense Item',
          pic_id,
          division_id,
          category_id,
          subcategory_id,
          date: convertToWIBISO(date || ''),
          total_amount: amount,
          details: JSON.stringify(details),
          notes: description || notes || null
        }])
        .select(`
          *,
          division:divisions(*),
          category:categories(*),
          subcategory:subcategories(*),
          pic:pics(*)
        `)
        .single()

      if (expenseError) {
        return NextResponse.json({ error: expenseError.message }, { status: 400 })
      }

      return NextResponse.json(expenseData, { status: 201 })
    }

    return NextResponse.json(
      { error: 'Invalid data format. Provide either details array or single item fields.' },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}