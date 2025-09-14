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
      amount, 
      description, 
      division_id, 
      category_id, 
      subcategory_id, 
      pic_id,
      item,
      qty,
      unit,
      price_per_unit,
      date,
      ref
    } = body

    if (!amount || !division_id || !category_id || !subcategory_id || !pic_id) {
      return NextResponse.json(
        { error: 'Missing required fields (amount, division, category, subcategory, pic)' },
        { status: 400 }
      )
    }

    // For single expense, create individual batch
    const batchId = crypto.randomUUID()

    const { data, error } = await supabaseServer
      .from('expenses')
      .insert([{ 
        amount, 
        description: description || '', 
        division_id,
        category_id,
        subcategory_id,
        pic_id,
        item: item || null,
        qty: qty || null,
        unit: unit || null,
        price_per_unit: price_per_unit || null,
        date: convertToWIBISO(date || ''),
        ref: ref || null,
        batch_id: batchId,
        batch_name: null
      }])
      .select(`
        *,
        division:divisions(*),
        category:categories(*),
        subcategory:subcategories(*),
        pic:pics(*)
      `)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}