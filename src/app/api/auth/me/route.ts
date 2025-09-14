import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { AuthService } from '@/lib/auth'
import { z } from 'zod'

// Validation schema for profile update
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Nama tidak boleh kosong'),
  email: z.string().email('Email tidak valid')
})

// Validation schema for password change
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password lama diperlukan'),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
  confirmPassword: z.string().min(1, 'Konfirmasi password diperlukan')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password baru dan konfirmasi tidak cocok",
  path: ["confirmPassword"],
})

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production') as any

    if (!decoded) {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 401 }
      )
    }

    // Get fresh user data from database
    const user = await AuthService.getUserByEmail(decoded.email)

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
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
    })

  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Token tidak valid' },
      { status: 401 }
    )
  }
}

// PATCH - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production') as any

    if (!decoded) {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 401 }
      )
    }

    // Get current user data
    const currentUser = await AuthService.getUserByEmail(decoded.email)

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, email } = updateProfileSchema.parse(body)

    // Check if email is already taken by another user
    if (email !== currentUser.email) {
      const existingUser = await AuthService.getUserByEmail(email)
      if (existingUser && existingUser.id !== currentUser.id) {
        return NextResponse.json(
          { error: 'Email sudah digunakan oleh user lain' },
          { status: 400 }
        )
      }
    }

    // Update user profile
    const updatedUser = await AuthService.updateUserProfile(currentUser.id, { name, email })

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Gagal memperbarui profile' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      }
    })

  } catch (error) {
    console.error('Update profile error:', error)

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

// POST - Change user password
export async function POST(request: NextRequest) {
  try {
    console.log('Change password request received')

    // Get token from cookies
    const accessToken = request.cookies.get('accessToken')?.value
    console.log('Access token present:', !!accessToken)

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production') as any
    console.log('Token decoded:', decoded ? { userId: decoded.userId, email: decoded.email } : 'null')

    if (!decoded) {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 401 }
      )
    }

    // Get current user data
    const currentUser = await AuthService.getUserByEmail(decoded.email)
    console.log('Current user found:', currentUser ? { id: currentUser.id, email: currentUser.email } : 'null')

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    console.log('Request body received:', { ...body, currentPassword: '[HIDDEN]', newPassword: '[HIDDEN]', confirmPassword: '[HIDDEN]' })

    const { currentPassword, newPassword } = changePasswordSchema.parse(body)
    console.log('Validation passed, calling changeUserPassword')

    // Change password
    const success = await AuthService.changeUserPassword(currentUser.id, currentPassword, newPassword)
    console.log('Change password result:', success)

    if (!success) {
      return NextResponse.json(
        { error: 'Password lama salah atau gagal mengubah password' },
        { status: 400 }
      )
    }

    console.log('Password change successful')
    return NextResponse.json({
      success: true,
      message: 'Password berhasil diubah'
    })

  } catch (error) {
    console.error('Change password error:', error)

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