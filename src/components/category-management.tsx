"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Tag, Palette } from "lucide-react"
import { type Category, type Subcategory } from "@/lib/supabase"

const colorOptions = [
  { value: '#3B82F6', label: 'Blue', class: 'bg-blue-500' },
  { value: '#10B981', label: 'Green', class: 'bg-green-500' },
  { value: '#8B5CF6', label: 'Purple', class: 'bg-purple-500' },
  { value: '#F59E0B', label: 'Orange', class: 'bg-orange-500' },
  { value: '#EF4444', label: 'Red', class: 'bg-red-500' },
  { value: '#06B6D4', label: 'Cyan', class: 'bg-cyan-500' },
  { value: '#84CC16', label: 'Lime', class: 'bg-lime-500' },
  { value: '#EC4899', label: 'Pink', class: 'bg-pink-500' },
]

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null)
  const [categoryFormData, setCategoryFormData] = useState({ name: "", description: "", color: "#3B82F6" })
  const [subcategoryFormData, setSubcategoryFormData] = useState({ name: "", description: "", category_id: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!categoryFormData.name.trim()) {
      alert("Nama kategori harus diisi")
      return
    }

    setIsSubmitting(true)

    try {
      const url = editingCategory 
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories'
      
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryFormData)
      })

      if (response.ok) {
        await fetchCategories()
        setIsCategoryDialogOpen(false)
        setEditingCategory(null)
        setCategoryFormData({ name: "", description: "", color: "#3B82F6" })
        alert(editingCategory ? "Kategori berhasil diupdate" : "Kategori berhasil ditambahkan")
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

  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!subcategoryFormData.name.trim() || !subcategoryFormData.category_id) {
      alert("Nama sub kategori dan kategori harus diisi")
      return
    }

    setIsSubmitting(true)

    try {
      const url = editingSubcategory 
        ? `/api/subcategories/${editingSubcategory.id}`
        : '/api/subcategories'
      
      const method = editingSubcategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subcategoryFormData)
      })

      if (response.ok) {
        await fetchCategories()
        setIsSubcategoryDialogOpen(false)
        setEditingSubcategory(null)
        setSubcategoryFormData({ name: "", description: "", category_id: "" })
        alert(editingSubcategory ? "Sub kategori berhasil diupdate" : "Sub kategori berhasil ditambahkan")
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

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryFormData({ 
      name: category.name, 
      description: category.description || "", 
      color: category.color 
    })
    setIsCategoryDialogOpen(true)
  }

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory)
    setSubcategoryFormData({
      name: subcategory.name,
      description: subcategory.description || "",
      category_id: subcategory.category_id
    })
    setIsSubcategoryDialogOpen(true)
  }

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Yakin ingin menghapus kategori "${category.name}"? Semua sub kategori akan ikut terhapus.`)) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchCategories()
        alert("Kategori berhasil dihapus")
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Terjadi kesalahan")
      }
    } catch (error) {
      console.error('Error:', error)
      alert("Terjadi kesalahan")
    }
  }

  const handleDeleteSubcategory = async (subcategory: Subcategory) => {
    if (!confirm(`Yakin ingin menghapus sub kategori "${subcategory.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/subcategories/${subcategory.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchCategories()
        alert("Sub kategori berhasil dihapus")
      } else {
        const errorData = await response.json()
        alert(errorData.error || "Terjadi kesalahan")
      }
    } catch (error) {
      console.error('Error:', error)
      alert("Terjadi kesalahan")
    }
  }

  const closeCategoryDialog = () => {
    setIsCategoryDialogOpen(false)
    setEditingCategory(null)
    setCategoryFormData({ name: "", description: "", color: "#3B82F6" })
  }

  const closeSubcategoryDialog = () => {
    setIsSubcategoryDialogOpen(false)
    setEditingSubcategory(null)
    setSubcategoryFormData({ name: "", description: "", category_id: "" })
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
        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Kategori
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Nama Kategori *</Label>
                <Input
                  id="categoryName"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="Contoh: Operasional, Pemasaran"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryDescription">Deskripsi</Label>
                <Input
                  id="categoryDescription"
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  placeholder="Deskripsi kategori (opsional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryColor">Warna</Label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setCategoryFormData({ ...categoryFormData, color: color.value })}
                      className={`w-8 h-8 rounded-full border-2 ${color.class} ${
                        categoryFormData.color === color.value ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : (editingCategory ? "Update" : "Simpan")}
                </Button>
                <Button type="button" variant="outline" onClick={closeCategoryDialog}>
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isSubcategoryDialogOpen} onOpenChange={setIsSubcategoryDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tambah Sub Kategori
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSubcategory ? "Edit Sub Kategori" : "Tambah Sub Kategori Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubcategorySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subcategoryCategory">Kategori *</Label>
                <Select value={subcategoryFormData.category_id} onValueChange={(value) => setSubcategoryFormData({ ...subcategoryFormData, category_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subcategoryName">Nama Sub Kategori *</Label>
                <Input
                  id="subcategoryName"
                  value={subcategoryFormData.name}
                  onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value })}
                  placeholder="Contoh: Alat Tulis Kantor, Iklan Online"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subcategoryDescription">Deskripsi</Label>
                <Input
                  id="subcategoryDescription"
                  value={subcategoryFormData.description}
                  onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, description: e.target.value })}
                  placeholder="Deskripsi sub kategori (opsional)"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : (editingSubcategory ? "Update" : "Simpan")}
                </Button>
                <Button type="button" variant="outline" onClick={closeSubcategoryDialog}>
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-gray-500">
              Belum ada kategori yang terdaftar
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      {category.description && (
                        <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCategory(category)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(category as any).subcategories?.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Sub Kategori:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(category as any).subcategories.map((subcategory: any) => (
                        <div
                          key={subcategory.id}
                          className="flex justify-between items-center p-2 border rounded hover:bg-gray-50"
                        >
                          <div>
                            <span className="text-sm font-medium">{subcategory.name}</span>
                            {subcategory.description && (
                              <p className="text-xs text-gray-500">{subcategory.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditSubcategory(subcategory)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteSubcategory(subcategory)}
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
                  <p className="text-sm text-gray-500">Belum ada sub kategori</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}