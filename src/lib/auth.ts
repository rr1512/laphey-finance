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
  refreshToken: string
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
      { expiresIn: '1h' }
    )

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

  // Get user by email
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

  // Create user (for superadmin)
  static async createUser(email: string, password: string, name: string, role: 'superadmin' | 'administrator' = 'administrator'): Promise<User | null> {
    try {
      const hashedPassword = await this.hashPassword(password)

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
}

// Default users to create on first run
export const DEFAULT_USERS = [
  {
    email: 'superadmin@laphey.com',
    password: 'SuperAdmin123!',
    name: 'Super Administrator',
    role: 'superadmin' as const
  },
  {
    email: 'admin@laphey.com',
    password: 'Admin123!',
    name: 'Administrator',
    role: 'administrator' as const
  }
]