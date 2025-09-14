import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabaseServer } from './supabase-server'

export interface User {
  id: string
  email: string
  name: string
  role: 'superadmin' | 'administrator'
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string // Optional, not used anymore
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-this-in-production'

export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  // Generate JWT tokens
  static generateTokens(user: User): AuthTokens {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        type: 'access'
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Changed to 7 days
    )

    // Refresh token not used anymore, but keep for compatibility
    const refreshToken = jwt.sign(
      {
        userId: user.id,
        type: 'refresh'
      },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    return { accessToken, refreshToken }
  }

  // Verify JWT token
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return null
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET)
    } catch (error) {
      return null
    }
  }

// Get user by email (for authentication - includes password)
static async getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  } catch (error) {
    console.error('Error getting user by email:', error)
    return null
  }
}

// Get user by email with password (internal use only)
static async getUserByEmailWithPassword(email: string): Promise<any> {
  try {
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) {
      return null
    }

    return data // Return full data including password
  } catch (error) {
    console.error('Error getting user by email with password:', error)
    return null
  }
}

  // Create user (for superadmin)
  static async createUser(email: string, password: string, name: string, role: 'superadmin' | 'administrator' = 'administrator'): Promise<User | null> {
    try {
      const hashedPassword = await AuthService.hashPassword(password)

      const { data, error } = await supabaseServer
        .from('users')
        .insert([{
          email,
          password: hashedPassword,
          name,
          role
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating user:', error)
        return null
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('Error creating user:', error)
      return null
    }
  }

  // Get all users (for superadmin)
  static async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabaseServer
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error getting users:', error)
        return []
      }

      return data.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }))
    } catch (error) {
      console.error('Error getting users:', error)
      return []
    }
  }

  // Update user role (for superadmin)
  static async updateUserRole(userId: string, role: 'superadmin' | 'administrator'): Promise<boolean> {
    try {
      const { error } = await supabaseServer
        .from('users')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) {
        console.error('Error updating user role:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error updating user role:', error)
      return false
    }
  }

  // Delete user (for superadmin)
  static async deleteUser(userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseServer
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) {
        console.error('Error deleting user:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting user:', error)
      return false
    }
  }

  // Update user profile (for current user)
  static async updateUserProfile(userId: string, updates: { name?: string; email?: string }): Promise<User | null> {
    try {
      const { data, error } = await supabaseServer
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error || !data) {
        console.error('Error updating user profile:', error)
        return null
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    } catch (error) {
      console.error('Error updating user profile:', error)
      return null
    }
  }

  // Update user profile (for admin)
  static async updateUserProfileAdmin(userId: string, name: string, email: string): Promise<boolean> {
    try {
      console.log('updateUserProfile called with userId:', userId)

      const { error: updateError } = await supabaseServer
        .from('users')
        .update({
          name,
          email,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating user profile:', updateError)
        return false
      }

      console.log('User profile updated successfully')
      return true
    } catch (error) {
      console.error('Error updating user profile:', error)
      return false
    }
  }

  // Reset user password (for admin)
  static async resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      console.log('resetUserPassword called with userId:', userId)

      // Hash new password
      const hashedPassword = await AuthService.hashPassword(newPassword)
      console.log('New password hashed successfully')

      // Update password
      const { error: updateError } = await supabaseServer
        .from('users')
        .update({
          password: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating password in database:', updateError)
        return false
      }

      console.log('Password reset successfully in database')
      return true
    } catch (error) {
      console.error('Error resetting user password:', error)
      return false
    }
  }

  // Change user password (for current user)
  static async changeUserPassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      console.log('changeUserPassword called with userId:', userId)

      // First, get the current user data to verify current password
      const { data: userData, error: fetchError } = await supabaseServer
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError || !userData) {
        console.error('Error fetching user for password change:', fetchError)
        return false
      }

      console.log('User data found:', { id: userData.id, email: userData.email, hasPassword: !!userData.password })

      // Verify current password
      const isCurrentPasswordValid = await AuthService.verifyPassword(currentPassword, userData.password)
      console.log('Password verification result:', isCurrentPasswordValid)

      if (!isCurrentPasswordValid) {
        console.log('Current password verification failed - password does not match')
        return false // Current password is incorrect
      }

      console.log('Password verification successful, hashing new password')

      // Hash new password
      const hashedNewPassword = await AuthService.hashPassword(newPassword)
      console.log('New password hashed successfully')

      // Update password
      const { error: updateError } = await supabaseServer
        .from('users')
        .update({
          password: hashedNewPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating password in database:', updateError)
        return false
      }

      console.log('Password updated successfully in database')
      return true
    } catch (error) {
      console.error('Error changing user password:', error)
      return false
    }
  }
}