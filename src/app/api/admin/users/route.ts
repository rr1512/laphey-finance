import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { z } from 'zod'

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  name: z.string().min(1, 'Nama tidak boleh kosong'),
  role: z.enum(['superadmin', 'administrator'])
})

const updateUserSchema = z.object({
  userId: z.string().min(1, 'User ID diperlukan'),
  role: z.enum(['superadmin', 'administrator'])
})

const deleteUserSchema = z.object({
  userId: z.string().min(1, 'User ID diperlukan')
})

// GET - Get all users (Superadmin only)
export async function GET(request: NextRequest) {
  try {
    // Check authentication and role
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      )
    }

    const decoded = AuthService.verifyToken(accessToken)
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Super Admin yang dapat mengakses.' },
        { status: 403 }
      )
    }

    const users = await AuthService.getAllUsers()
    return NextResponse.json({ users })

  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Create new user (Superadmin only)
export async function POST(request: NextRequest) {
  try {
    // Check authentication and role
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      )
    }

    const decoded = AuthService.verifyToken(accessToken)
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Super Admin yang dapat mengakses.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    const user = await AuthService.createUser(
      validatedData.email,
      validatedData.password,
      validatedData.name,
      validatedData.role
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Gagal membuat user. Email mungkin sudah digunakan.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Create user error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PATCH - Update user role (Superadmin only)
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication and role
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      )
    }

    const decoded = AuthService.verifyToken(accessToken)
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Super Admin yang dapat mengakses.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, role } = updateUserSchema.parse(body)

    const success = await AuthService.updateUserRole(userId, role)

    if (!success) {
      return NextResponse.json(
        { error: 'Gagal memperbarui role user' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Role user berhasil diperbarui'
    })

  } catch (error) {
    console.error('Update user role error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Edit user (Superadmin only)
export async function PUT(request: NextRequest) {
  try {
    // Check authentication and role
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      )
    }

    const decoded = AuthService.verifyToken(accessToken)
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Super Admin yang dapat mengakses.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, name, email } = body

    if (!userId || !name || !email) {
      return NextResponse.json(
        { error: 'User ID, name, dan email diperlukan' },
        { status: 400 }
      )
    }

    // Update user
    const success = await AuthService.updateUserProfileAdmin(userId, name, email)

    if (!success) {
      return NextResponse.json(
        { error: 'Gagal memperbarui user' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User berhasil diperbarui'
    })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user (Superadmin only)
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and role
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      )
    }

    const decoded = AuthService.verifyToken(accessToken)
    if (!decoded || decoded.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya Super Admin yang dapat mengakses.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId } = deleteUserSchema.parse(body)

    // Prevent deleting superadmin users
    const users = await AuthService.getAllUsers()
    const userToDelete = users.find(u => u.id === userId)

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    if (userToDelete.role === 'superadmin') {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus Super Admin' },
        { status: 400 }
      )
    }

    const success = await AuthService.deleteUser(userId)

    if (!success) {
      return NextResponse.json(
        { error: 'Gagal menghapus user' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete user error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Data tidak valid', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}