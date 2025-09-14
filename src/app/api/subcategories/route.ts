import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// GET - Fetch subcategories by category_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category_id')

    let query = supabaseServer
      .from('subcategories')
      .select(`
        *,
        category:categories(*)
      `)
      .order('name', { ascending: true })

    if (categoryId) {
      query = query.eq('category_id', categoryId)
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

// POST - Create new subcategory
export async function POST(request: NextRequest) {
  try {
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
      .insert([{ 
        name: name.trim(), 
        description: description?.trim() || null,
        category_id
      }])
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

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}