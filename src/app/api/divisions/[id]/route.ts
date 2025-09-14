import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// GET - Fetch single division
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseServer
      .from('divisions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Division not found' },
          { status: 404 }
        )
      }
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

// PUT - Update division
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Division name is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('divisions')
      .update({ 
        name: name.trim(), 
        description: description?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'Division name already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'Division not found' },
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

// DELETE - Delete division
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if division is used in any expenses
    const { data: expenses, error: expenseError } = await supabaseServer
      .from('expenses')
      .select('id')
      .eq('division_id', params.id)
      .limit(1)

    if (expenseError) {
      return NextResponse.json({ error: expenseError.message }, { status: 400 })
    }

    if (expenses && expenses.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete division that has expenses' },
        { status: 409 }
      )
    }

    const { data, error } = await supabaseServer
      .from('divisions')
      .delete()
      .eq('id', params.id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'Division not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Division deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}