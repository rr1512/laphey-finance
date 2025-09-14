import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// GET - Fetch PICs by division_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const divisionId = searchParams.get('division_id')

    let query = supabaseServer
      .from('pics')
      .select(`
        *,
        division:divisions(*)
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (divisionId) {
      query = query.eq('division_id', divisionId)
    }

    const { data, error } = await query

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

// POST - Create new PIC
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, position, division_id } = body

    if (!name || !name.trim() || !phone || !phone.trim() || !division_id) {
      return NextResponse.json(
        { error: 'Name, phone number, and division are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('pics')
      .insert([{ 
        name: name.trim(), 
        phone: phone.trim(),
        email: email?.trim() || null,
        position: position?.trim() || null,
        division_id
      }])
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

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}