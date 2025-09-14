"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Division, type Category, type Subcategory } from "@/lib/supabase"

interface ExpenseFormProps {
  onExpenseAdded: () => void
}

export function ExpenseForm({ onExpenseAdded }: ExpenseFormProps) {
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [divisionId, setDivisionId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [subcategoryId, setSubcategoryId] = useState("")
  const [divisions, setDivisions] = useState<Division[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [divisionsRes, categoriesRes] = await Promise.all([
          fetch('/api/divisions'),
          fetch('/api/categories')
        ])
        
        if (divisionsRes.ok) {
          const divisionsData = await divisionsRes.json()
          setDivisions(divisionsData)
        }
        
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!categoryId) {
        setSubcategories([])
        setSubcategoryId("")
        return
      }

      try {
        const response = await fetch(`/api/subcategories?category_id=${categoryId}`)
        if (response.ok) {
          const data = await response.json()
          setSubcategories(data)
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error)
      }
    }
    fetchSubcategories()
  }, [categoryId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !description || !divisionId || !categoryId || !subcategoryId) {
      alert("Harap isi semua field termasuk divisi, kategori, dan sub kategori")
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description,
          division_id: divisionId,
          category_id: categoryId,
          subcategory_id: subcategoryId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error inserting expense:', errorData.error)
        alert("Terjadi kesalahan saat menyimpan data")
        return
      }

      // Reset form
      setAmount("")
      setDescription("")
      setDivisionId("")
      setCategoryId("")
      setSubcategoryId("")
      
      // Notify parent component
      onExpenseAdded()
      
      alert("Pengeluaran berhasil ditambahkan!")
      
    } catch (error) {
      console.error('Error:', error)
      alert("Terjadi kesalahan")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Tambah Pengeluaran</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="division">Divisi *</Label>
              <Select value={divisionId} onValueChange={setDivisionId}>
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
              <Label htmlFor="category">Kategori *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
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
              <Label htmlFor="subcategory">Sub Kategori *</Label>
              <Select value={subcategoryId} onValueChange={setSubcategoryId} disabled={!categoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih sub kategori" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah (Rp) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Keterangan *</Label>
              <Input
                id="description"
                type="text"
                placeholder="Contoh: Pembelian ATK"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Menyimpan..." : "Tambah Pengeluaran"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}