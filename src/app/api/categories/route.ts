import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { AuthService } from '@/lib/auth'

// Helper function for authentication
async function authenticate(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Token tidak ditemukan' },
      { status: 401 }
    )
  }

  const decoded = AuthService.verifyToken(accessToken)
  if (!decoded) {
    return NextResponse.json(
      { error: 'Token tidak valid' },
      { status: 401 }
    )
  }

  return null // Authentication successful
}

// GET - Fetch all categories with subcategories
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authError = await authenticate(request)
    if (authError) return authError
    const { data, error } = await supabaseServer
      .from('categories')
      .select(`
        *,
        subcategories (*)
      `)
      .order('name', { ascending: true })

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

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authError = await authenticate(request)
    if (authError) return authError

    const body = await request.json()
    const { name, description, color } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('categories')
      .insert([{ 
        name: name.trim(), 
        description: description?.trim() || null,
        color: color || '#3B82F6'
      }])
      .select()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'Category name already exists' },
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