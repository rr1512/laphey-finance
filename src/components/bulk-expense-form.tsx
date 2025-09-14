"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { type Division, type Category, type Subcategory } from "@/lib/supabase"

interface ExpenseItem {
  amount: string
  description: string
}

interface BulkExpenseFormProps {
  onExpensesAdded: () => void
}

export function BulkExpenseForm({ onExpensesAdded }: BulkExpenseFormProps) {
  const [batchName, setBatchName] = useState("")
  const [divisionId, setDivisionId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [subcategoryId, setSubcategoryId] = useState("")
  const [divisions, setDivisions] = useState<Division[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { amount: "", description: "" },
    { amount: "", description: "" }
  ])
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

  const addExpenseRow = () => {
    setExpenses([...expenses, { amount: "", description: "" }])
  }

  const removeExpenseRow = (index: number) => {
    if (expenses.length > 1) {
      setExpenses(expenses.filter((_, i) => i !== index))
    }
  }

  const updateExpense = (index: number, field: keyof ExpenseItem, value: string) => {
    const updatedExpenses = [...expenses]
    updatedExpenses[index][field] = value
    setExpenses(updatedExpenses)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    const validExpenses = expenses.filter(exp => 
      exp.amount && exp.description
    )

    if (validExpenses.length === 0) {
      alert("Harap isi minimal satu pengeluaran dengan lengkap")
      return
    }

    if (!batchName.trim()) {
      alert("Harap isi nama grup pengeluaran")
      return
    }

    if (!divisionId) {
      alert("Harap pilih divisi")
      return
    }

    if (!categoryId || !subcategoryId) {
      alert("Harap pilih kategori dan sub kategori")
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/expenses/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchName: batchName.trim(),
          divisionId,
          categoryId,
          subcategoryId,
          expenses: validExpenses.map(exp => ({
            amount: parseFloat(exp.amount),
            description: exp.description.trim()
          }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error inserting bulk expenses:', errorData.error)
        alert("Terjadi kesalahan saat menyimpan data")
        return
      }

      // Reset form
      setBatchName("")
      setDivisionId("")
      setCategoryId("")
      setSubcategoryId("")
      setExpenses([
        { amount: "", description: "" },
        { amount: "", description: "" }
      ])
      
      // Notify parent component
      onExpensesAdded()
      
      alert(`${validExpenses.length} pengeluaran berhasil ditambahkan!`)
      
    } catch (error) {
      console.error('Error:', error)
      alert("Terjadi kesalahan")
    } finally {
      setIsLoading(false)
    }
  }

  const totalAmount = expenses
    .filter(exp => exp.amount)
    .reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Tambah Pengeluaran (Multiple)</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Label htmlFor="batchName">Nama Grup Pengeluaran *</Label>
              <Input
                id="batchName"
                type="text"
                placeholder="Contoh: Belanja Bulanan, Trip Jakarta"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
              />
            </div>
          </div>

          {/* Expense Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-medium">Daftar Pengeluaran</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExpenseRow}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Tambah Baris
              </Button>
            </div>

            {expenses.map((expense, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Pengeluaran #{index + 1}
                  </span>
                  {expenses.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeExpenseRow(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`amount-${index}`}>Jumlah (Rp)</Label>
                    <Input
                      id={`amount-${index}`}
                      type="number"
                      placeholder="0"
                      value={expense.amount}
                      onChange={(e) => updateExpense(index, 'amount', e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`description-${index}`}>Keterangan</Label>
                    <Input
                      id={`description-${index}`}
                      type="text"
                      placeholder="Contoh: Pembelian ATK"
                      value={expense.description}
                      onChange={(e) => updateExpense(index, 'description', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          {totalAmount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-center">
                <span className="text-sm font-medium text-blue-800">Total: </span>
                <span className="text-lg font-bold text-blue-600">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR'
                  }).format(totalAmount)}
                </span>
              </div>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Menyimpan..." : "Simpan Semua Pengeluaran"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}