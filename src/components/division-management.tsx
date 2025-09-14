"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Users, Phone, Mail, User } from "lucide-react"
import { type Division, type PIC } from "@/lib/supabase"

export function DivisionManagement() {
  const [divisions, setDivisions] = useState<Division[]>([])
  const [pics, setPics] = useState<PIC[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPicDialogOpen, setIsPicDialogOpen] = useState(false)
  const [editingDivision, setEditingDivision] = useState<Division | null>(null)
  const [editingPic, setEditingPic] = useState<PIC | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [picFormData, setPicFormData] = useState({ name: "", phone: "", email: "", position: "", division_id: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDivisionForPic, setSelectedDivisionForPic] = useState<string>("")

  const fetchDivisions = async () => {
    try {
      const response = await fetch('/api/divisions')
      if (response.ok) {
        const data = await response.json()
        setDivisions(data)
      }
    } catch (error) {
      console.error('Error fetching divisions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPics = async (divisionId?: string) => {
    try {
      const url = divisionId ? `/api/pics?division_id=${divisionId}` : '/api/pics'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setPics(data)
      }
    } catch (error) {
      console.error('Error fetching PICs:', error)
    }
  }

  useEffect(() => {
    fetchDivisions()
    fetchPics()
  }, [])

  const handlePicSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!picFormData.name.trim() || !picFormData.phone.trim() || !picFormData.division_id) {
      alert("Nama, nomor HP, dan divisi harus diisi")
      return
    }

    setIsSubmitting(true)

    try {
      const url = editingPic 
        ? `/api/pics/${editingPic.id}`
        : '/api/pics'
      
      const method = editingPic ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(picFormData)
      })

      if (response.ok) {
        await fetchPics()
        setIsPicDialogOpen(false)
        setEditingPic(null)
        setPicFormData({ name: "", phone: "", email: "", position: "", division_id: "" })
        alert(editingPic ? "PIC berhasil diupdate" : "PIC berhasil ditambahkan")
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Terjadi kesalahan")
      }
    } catch (error) {
      console.error('Error:', error)
      alert("Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditPic = (pic: PIC) => {
    setEditingPic(pic)
    setPicFormData({
      name: pic.name,
      phone: pic.phone,
      email: pic.email || "",
      position: pic.position || "",
      division_id: pic.division_id
    })
    setIsPicDialogOpen(true)
  }

  const handleDeletePic = async (pic: PIC) => {
    if (!confirm(`Yakin ingin menghapus PIC "${pic.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/pics/${pic.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchPics()
        alert("PIC berhasil dihapus")
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Terjadi kesalahan")
      }
    } catch (error) {
      console.error('Error:', error)
      alert("Terjadi kesalahan")
    }
  }

  const closePicDialog = () => {
    setIsPicDialogOpen(false)
    setEditingPic(null)
    setPicFormData({ name: "", phone: "", email: "", position: "", division_id: "" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert("Nama divisi harus diisi")
      return
    }

    setIsSubmitting(true)

    try {
      const url = editingDivision 
        ? `/api/divisions/${editingDivision.id}`
        : '/api/divisions'
      
      const method = editingDivision ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchDivisions()
        setIsDialogOpen(false)
        setEditingDivision(null)
        setFormData({ name: "", description: "" })
        alert(editingDivision ? "Divisi berhasil diupdate" : "Divisi berhasil ditambahkan")
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Terjadi kesalahan")
      }
    } catch (error) {
      console.error('Error:', error)
      alert("Terjadi kesalahan")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (division: Division) => {
    setEditingDivision(division)
    setFormData({ name: division.name, description: division.description || "" })
    setIsDialogOpen(true)
  }

  const handleDelete = async (division: Division) => {
    if (!confirm(`Yakin ingin menghapus divisi "${division.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/divisions/${division.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchDivisions()
        alert("Divisi berhasil dihapus")
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Terjadi kesalahan")
      }
    } catch (error) {
      console.error('Error:', error)
      alert("Terjadi kesalahan")
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingDivision(null)
    setFormData({ name: "", description: "" })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Memuat data...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Divisi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDivision ? "Edit Divisi" : "Tambah Divisi Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Divisi *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: IT, Finance, HR"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Deskripsi divisi (opsional)"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : (editingDivision ? "Update" : "Simpan")}
                </Button>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isPicDialogOpen} onOpenChange={setIsPicDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Tambah PIC
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPic ? "Edit PIC" : "Tambah PIC Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePicSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="picDivision">Divisi *</Label>
                <Select value={picFormData.division_id} onValueChange={(value) => setPicFormData({ ...picFormData, division_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih divisi" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((division) => (
                      <SelectItem key={division.id} value={division.id}>
                        {division.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="picName">Nama *</Label>
                <Input
                  id="picName"
                  value={picFormData.name}
                  onChange={(e) => setPicFormData({ ...picFormData, name: e.target.value })}
                  placeholder="Nama lengkap PIC"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="picPhone">Nomor HP *</Label>
                <Input
                  id="picPhone"
                  value={picFormData.phone}
                  onChange={(e) => setPicFormData({ ...picFormData, phone: e.target.value })}
                  placeholder="081234567890"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="picEmail">Email</Label>
                <Input
                  id="picEmail"
                  type="email"
                  value={picFormData.email}
                  onChange={(e) => setPicFormData({ ...picFormData, email: e.target.value })}
                  placeholder="email@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="picPosition">Jabatan</Label>
                <Input
                  id="picPosition"
                  value={picFormData.position}
                  onChange={(e) => setPicFormData({ ...picFormData, position: e.target.value })}
                  placeholder="Manager, Supervisor, dll"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : (editingPic ? "Update" : "Simpan")}
                </Button>
                <Button type="button" variant="outline" onClick={closePicDialog}>
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl">Manajemen Divisi & PIC</CardTitle>
        </CardHeader>
        <CardContent>
          {divisions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Belum ada divisi yang terdaftar
            </div>
          ) : (
            <div className="space-y-4">
              {divisions.map((division) => {
                const divisionPics = pics.filter(pic => pic.division_id === division.id)
                return (
                  <div key={division.id} className="border rounded-lg overflow-hidden">
                    {/* Division Header */}
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {division.name}
                          </h3>
                          {division.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {division.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Dibuat: {new Date(division.created_at).toLocaleDateString('id-ID')} • {divisionPics.length} PIC
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(division)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(division)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* PICs List */}
                    <div className="p-4">
                      {divisionPics.length > 0 ? (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            PIC (Person In Charge):
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {divisionPics.map((pic) => (
                              <div
                                key={pic.id}
                                className="flex justify-between items-start p-3 border rounded hover:bg-gray-50"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">{pic.name}</span>
                                  </div>
                                  {pic.position && (
                                    <p className="text-sm text-gray-600 ml-6">{pic.position}</p>
                                  )}
                                  <div className="flex items-center gap-4 mt-1 ml-6">
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3 text-gray-400" />
                                      <span className="text-xs text-gray-500">{pic.phone}</span>
                                    </div>
                                    {pic.email && (
                                      <div className="flex items-center gap-1">
                                        <Mail className="h-3 w-3 text-gray-400" />
                                        <span className="text-xs text-gray-500">{pic.email}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditPic(pic)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeletePic(pic)}
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Belum ada PIC untuk divisi ini</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}