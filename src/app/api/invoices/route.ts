import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { convertToWIBISO } from '@/lib/timezone'

// GET - Fetch all invoices
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('invoices')
      .select(`
        *,
        division:divisions(*),
        category:categories(*),
        subcategory:subcategories(*),
        pic:pics(*),
        items:invoice_items(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/invoices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new invoice with items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      pic_id,
      division_id,
      category_id,
      subcategory_id,
      date,
      notes,
      items
    } = body

    if (!pic_id || !division_id || !category_id || !subcategory_id) {
      return NextResponse.json(
        { error: 'Missing required fields (pic_id, division_id, category_id, subcategory_id)' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invoice must have at least one item' },
        { status: 400 }
      )
    }

    // Validate items
    for (const item of items) {
      if (!item.item || !item.qty || !item.unit || !item.price_per_unit) {
        return NextResponse.json(
          { error: 'Each item must have item, qty, unit, and price_per_unit' },
          { status: 400 }
        )
      }
    }

    // Create invoice
    const { data: invoiceData, error: invoiceError } = await supabaseServer
      .from('invoices')
      .insert([{
        pic_id,
        division_id,
        category_id,
        subcategory_id,
        date: convertToWIBISO(date || ''),
        notes: notes || null
      }])
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError)
      return NextResponse.json({ error: invoiceError.message }, { status: 400 })
    }

    // Create invoice items
    const invoiceItems = items.map(item => ({
      invoice_id: invoiceData.id,
      item: item.item,
      qty: parseFloat(item.qty),
      unit: item.unit,
      price_per_unit: parseFloat(item.price_per_unit),
      amount: parseFloat(item.qty) * parseFloat(item.price_per_unit),
      description: item.description || null
    }))

    const { data: itemsData, error: itemsError } = await supabaseServer
      .from('invoice_items')
      .insert(invoiceItems)
      .select()

    if (itemsError) {
      console.error('Error creating invoice items:', itemsError)
      // Delete the invoice if items creation failed
      await supabaseServer
        .from('invoices')
        .delete()
        .eq('id', invoiceData.id)

      return NextResponse.json({ error: itemsError.message }, { status: 400 })
    }

    // Fetch complete invoice with items
    const { data: completeInvoice, error: fetchError } = await supabaseServer
      .from('invoices')
      .select(`
        *,
        division:divisions(*),
        category:categories(*),
        subcategory:subcategories(*),
        pic:pics(*),
        items:invoice_items(*)
      `)
      .eq('id', invoiceData.id)
      .single()

    if (fetchError) {
      console.error('Error fetching complete invoice:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 400 })
    }

    return NextResponse.json(completeInvoice, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/invoices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}