import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { convertToWIBISO } from '@/lib/timezone'

// GET - Get single invoice with items
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

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
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching invoice:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/invoices/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update invoice and its items
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
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

    if (!id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

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

    // Update invoice
    const { data: invoiceData, error: invoiceError } = await supabaseServer
      .from('invoices')
      .update({
        pic_id,
        division_id,
        category_id,
        subcategory_id,
        date: convertToWIBISO(date || ''),
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (invoiceError) {
      console.error('Error updating invoice:', invoiceError)
      return NextResponse.json({ error: invoiceError.message }, { status: 400 })
    }

    // Delete existing items and create new ones
    const { error: deleteError } = await supabaseServer
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id)

    if (deleteError) {
      console.error('Error deleting existing items:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    // Create new invoice items
    const invoiceItems = items.map(item => ({
      invoice_id: id,
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
      return NextResponse.json({ error: itemsError.message }, { status: 400 })
    }

    // Fetch complete updated invoice with items
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
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching complete invoice:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 400 })
    }

    return NextResponse.json(completeInvoice)
  } catch (error) {
    console.error('Error in PUT /api/invoices/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete invoice (will cascade delete items)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Delete invoice (items will be deleted automatically due to CASCADE)
    const { error } = await supabaseServer
      .from('invoices')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting invoice:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/invoices/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}