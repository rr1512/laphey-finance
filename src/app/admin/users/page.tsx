"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Plus, Edit, Trash2, Shield, User as UserIcon, AlertTriangle, Key } from "lucide-react"
import useCustomToast from "@/lib/use-toast"

interface User {
  id: string
  email: string
  name: string
  role: 'superadmin' | 'administrator'
  createdAt: string
  updatedAt: string
}

export default function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'administrator' as 'superadmin' | 'administrator'
  })
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: ''
  })
  const [resetPasswordFormData, setResetPasswordFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { success, error: showError } = useCustomToast() as any

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Create user
  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        success('User Berhasil Dibuat', `User ${formData.name} telah ditambahkan ke sistem`)
        setFormData({ email: '', password: '', name: '', role: 'administrator' })
        setIsCreateDialogOpen(false)
        fetchUsers()
      } else {
        showError('Gagal Membuat User', data.error || 'Terjadi kesalahan saat membuat user')
      }
    } catch (error) {
      showError('Terjadi Kesalahan', 'Silakan coba lagi atau hubungi administrator')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update user role
  const updateUserRole = async (userId: string, role: 'superadmin' | 'administrator') => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role }),
      })

      if (response.ok) {
        const user = users.find(u => u.id === userId)
        success('Role Berhasil Diperbarui', `Role ${user?.name} telah diubah menjadi ${role}`)
        fetchUsers()
      } else {
        const data = await response.json()
        showError('Gagal Memperbarui Role', data.error || 'Terjadi kesalahan saat memperbarui role')
      }
    } catch (error) {
      showError('Terjadi Kesalahan', 'Silakan coba lagi atau hubungi administrator')
    }
  }

  // Delete user
  const deleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!confirm(`Apakah Anda yakin ingin menghapus user "${user?.name}"?`)) return

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        success('User Berhasil Dihapus', `User ${user?.name} telah dihapus dari sistem`)
        fetchUsers()
      } else {
        const data = await response.json()
        showError('Gagal Menghapus User', data.error || 'Terjadi kesalahan saat menghapus user')
      }
    } catch (error) {
      showError('Terjadi Kesalahan', 'Silakan coba lagi atau hubungi administrator')
    }
  }

  // Open edit dialog and set form data
  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setEditFormData({
      name: user.name,
      email: user.email
    })
    setIsEditDialogOpen(true)
  }

  // Edit user
  const editUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          ...editFormData
        }),
      })

      const data = await response.json()

      if (response.ok) {
        success('User Berhasil Diperbarui', `Data ${editFormData.name} telah diperbarui`)
        setIsEditDialogOpen(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        showError('Gagal Memperbarui User', data.error || 'Terjadi kesalahan saat memperbarui user')
      }
    } catch (error) {
      showError('Terjadi Kesalahan', 'Silakan coba lagi atau hubungi administrator')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open reset password dialog
  const openResetPasswordDialog = (user: User) => {
    setSelectedUser(user)
    setResetPasswordFormData({
      newPassword: '',
      confirmPassword: ''
    })
    setIsResetPasswordDialogOpen(true)
  }

  // Reset user password
  const resetUserPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    if (resetPasswordFormData.newPassword !== resetPasswordFormData.confirmPassword) {
      showError('Password Tidak Cocok', 'Password baru dan konfirmasi harus sama')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword: resetPasswordFormData.newPassword
        }),
      })

      const data = await response.json()

      if (response.ok) {
        success('Password Berhasil Direset', `Password ${selectedUser.name} telah direset`)
        setIsResetPasswordDialogOpen(false)
        setSelectedUser(null)
        setResetPasswordFormData({ newPassword: '', confirmPassword: '' })
      } else {
        showError('Gagal Reset Password', data.error || 'Terjadi kesalahan saat reset password')
      }
    } catch (error) {
      showError('Terjadi Kesalahan', 'Silakan coba lagi atau hubungi administrator')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Redirect if not superadmin
  if (user?.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
            <p className="text-gray-600">Hanya Super Admin yang dapat mengakses halaman ini.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data user...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen User</h1>
          <p className="text-gray-600">Kelola user dan role dalam sistem</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-700 hover:bg-slate-800">
              <Plus className="h-4 w-4 mr-2" />
              Tambah User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah User Baru</DialogTitle>
              <DialogDescription>
                Buat user baru dengan role yang sesuai
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Masukkan email"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Masukkan password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: 'superadmin' | 'administrator') =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrator">Administrator</SelectItem>
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Perbarui informasi user {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nama Lengkap</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="Masukkan email"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Reset password untuk user {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={resetUserPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Password Baru</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={resetPasswordFormData.newPassword}
                  onChange={(e) => setResetPasswordFormData({ ...resetPasswordFormData, newPassword: e.target.value })}
                  placeholder="Masukkan password baru"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={resetPasswordFormData.confirmPassword}
                  onChange={(e) => setResetPasswordFormData({ ...resetPasswordFormData, confirmPassword: e.target.value })}
                  placeholder="Konfirmasi password baru"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsResetPasswordDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Mereset...' : 'Reset Password'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total User</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Super Admin</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'superadmin').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Administrator</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'administrator').length}
                </p>
              </div>
              <UserIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Nama</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Dibuat</th>
                  <th className="text-left p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{user.name}</td>
                    <td className="p-3 text-gray-600">{user.email}</td>
                    <td className="p-3">
                      <Badge
                        variant={user.role === 'superadmin' ? 'default' : 'secondary'}
                        className={user.role === 'superadmin' ? 'bg-purple-600' : ''}
                      >
                        {user.role === 'superadmin' ? 'Super Admin' : 'Administrator'}
                      </Badge>
                    </td>
                    <td className="p-3 text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openResetPasswordDialog(user)}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </Button>

                        {user.role !== 'superadmin' && (
                          <>
                            <Select
                              value={user.role}
                              onValueChange={(value: 'superadmin' | 'administrator') =>
                                updateUserRole(user.id, value)
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="administrator">Admin</SelectItem>
                                <SelectItem value="superadmin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteUser(user.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Hapus User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
