import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST() {
  try {
    // Check if users already exist
    const existingUsers = await AuthService.getAllUsers()

    if (existingUsers.length > 0) {
      // If users exist but have password issues, offer to fix them
      return NextResponse.json({
        success: false,
        message: 'Users already exist. Setup skipped.',
        existingUsers: existingUsers.length,
        note: 'If you have password issues, contact administrator to manually fix password hashing',
        availableEndpoints: {
          recreateUsers: 'DELETE all users first, then POST /api/setup'
        }
      })
    }

    // No default users will be created automatically
    return NextResponse.json({
      success: true,
      message: 'Setup completed - no default users created',
      note: 'This application does not create default users. Please create users manually through the admin interface.',
      existingUsers: 0
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { success: false, error: 'Setup failed' },
      { status: 500 }
    )
  }
}

// DELETE - Remove all users (dangerous operation)
export async function DELETE() {
  try {
    console.log('Deleting all users...')

    const { error } = await supabaseServer
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all users

    if (error) {
      console.error('Error deleting users:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete users' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'All users deleted successfully',
      warning: 'Database is now empty. Create users manually through the admin interface.'
    })

  } catch (error) {
    console.error('Delete users error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete users' },
      { status: 500 }
    )
  }
}