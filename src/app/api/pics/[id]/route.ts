import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// PUT - Update PIC
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, phone, email, position, division_id, is_active } = body

    if (!name || !name.trim() || !phone || !phone.trim() || !division_id) {
      return NextResponse.json(
        { error: 'Name, phone number, and division are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('pics')
      .update({ 
        name: name.trim(), 
        phone: phone.trim(),
        email: email?.trim() || null,
        position: position?.trim() || null,
        division_id,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select(`
        *,
        division:divisions(*)
      `)

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'Phone number already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'PIC not found' },
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

// DELETE - Delete PIC (soft delete by setting is_active = false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if PIC is used in any expenses
    const { data: expenses, error: expenseError } = await supabaseServer
      .from('expenses')
      .select('id')
      .eq('pic_id', params.id)
      .limit(1)

    if (expenseError) {
      return NextResponse.json({ error: expenseError.message }, { status: 400 })
    }

    if (expenses && expenses.length > 0) {
      // Soft delete if PIC has expenses
      const { data, error } = await supabaseServer
        .from('pics')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      if (data.length === 0) {
        return NextResponse.json(
          { error: 'PIC not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ message: 'PIC deactivated successfully' })
    } else {
      // Hard delete if no expenses
      const { data, error } = await supabaseServer
        .from('pics')
        .delete()
        .eq('id', params.id)
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      if (data.length === 0) {
        return NextResponse.json(
          { error: 'PIC not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ message: 'PIC deleted successfully' })
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}