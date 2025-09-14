import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { convertToWIBISO } from '@/lib/timezone'
import { AuthService } from '@/lib/auth'

// GET - Get single expense
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = AuthService.verifyToken(accessToken)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 401 }
      )
    }
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Expense ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('expenses')
      .select(`
        *,
        division:divisions(*),
        category:categories(*),
        subcategory:subcategories(*),
        pic:pics(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/expenses/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update expense
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = AuthService.verifyToken(accessToken)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Expense ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      title,
      division_id,
      category_id,
      subcategory_id,
      pic_id,
      date,
      notes,
      details
    } = body

    // Validate required fields
    if (!title || !division_id || !category_id || !subcategory_id || !pic_id) {
      return NextResponse.json(
        { error: 'Missing required fields (title, division_id, category_id, subcategory_id, pic_id)' },
        { status: 400 }
      )
    }

    // Calculate total amount from details if provided
    let updateData: any = {
      title,
      pic_id,
      division_id,
      category_id,
      subcategory_id,
      notes: notes || null
    }

    if (details && Array.isArray(details)) {
      const totalAmount = details.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)
      updateData = {
        ...updateData,
        total_amount: totalAmount,
        details: JSON.stringify(details)
      }
    }

    if (date) {
      updateData = {
        ...updateData,
        date: convertToWIBISO(date)
      }
    }

    const { data, error } = await supabaseServer
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        division:divisions(*),
        category:categories(*),
        subcategory:subcategories(*),
        pic:pics(*)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/expenses/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete expense
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check authentication
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = AuthService.verifyToken(accessToken)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Expense ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseServer
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/expenses/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}