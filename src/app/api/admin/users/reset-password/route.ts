import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'

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
        { error: 'Akses ditolak. Hanya Super Admin yang dapat melakukan reset password.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, newPassword } = body

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'User ID dan password baru diperlukan' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      )
    }

    // Reset user password
    const success = await AuthService.resetUserPassword(userId, newPassword)

    if (!success) {
      return NextResponse.json(
        { error: 'Gagal reset password. User tidak ditemukan.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password berhasil direset'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}