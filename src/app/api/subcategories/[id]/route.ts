import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// PUT - Update subcategory
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, category_id } = body

    if (!name || !name.trim() || !category_id) {
      return NextResponse.json(
        { error: 'Subcategory name and category are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('subcategories')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        category_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        category:categories(*)
      `)

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'Subcategory name already exists in this category' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'Subcategory not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete subcategory
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if subcategory is used in any expenses
    const { data: expenses, error: expenseError } = await supabaseServer
      .from('expenses')
      .select('id')
      .eq('subcategory_id', id)
      .limit(1)

    if (expenseError) {
      return NextResponse.json({ error: expenseError.message }, { status: 400 })
    }

    if (expenses && expenses.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete subcategory that has expenses' },
        { status: 409 }
      )
    }

    const { data, error } = await supabaseServer
      .from('subcategories')
      .delete()
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'Subcategory not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Subcategory deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}