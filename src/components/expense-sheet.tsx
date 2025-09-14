"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, User } from "lucide-react"
import { type Division, type Category, type Subcategory, type PIC } from "@/lib/supabase"
import { getWIBDateTimeLocal } from "@/lib/timezone"

interface ExpenseItem {
  item: string
  qty: string
  unit: string
  pricePerUnit: string
  description: string
  subTotal: number
}

interface ExpenseSheetProps {
  onExpenseAdded: () => void
  children: React.ReactNode
}

export function ExpenseSheet({ onExpenseAdded, children }: ExpenseSheetProps) {
  // Common state
  const [isOpen, setIsOpen] = useState(false)
  const [divisions, setDivisions] = useState<Division[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [pics, setPics] = useState<PIC[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [divisionId, setDivisionId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [subcategoryId, setSubcategoryId] = useState("")
  const [picId, setPicId] = useState("")

  // Form state
  const [expenseDate, setExpenseDate] = useState(() => getWIBDateTimeLocal())
  const [expenseRef, setExpenseRef] = useState("")
  const [batchName, setBatchName] = useState("")
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { item: "", qty: "", unit: "", pricePerUnit: "", description: "", subTotal: 0 }
  ])

  // Fetch initial data
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

  // Fetch subcategories when category changes
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

  // Fetch PICs when division changes
  useEffect(() => {
    const fetchPics = async () => {
      if (!divisionId) {
        setPics([])
        setPicId("")
        return
      }

      try {
        const response = await fetch(`/api/pics?division_id=${divisionId}`)
        if (response.ok) {
          const data = await response.json()
          setPics(data)
        }
      } catch (error) {
        console.error('Error fetching PICs:', error)
      }
    }
    fetchPics()
  }, [divisionId])


  // Reset form when sheet closes
  const resetForm = () => {
    setDivisionId("")
    setCategoryId("")
    setSubcategoryId("")
    setPicId("")
    setExpenseDate(() => getWIBDateTimeLocal())
    setExpenseRef("")
    setBatchName("")
    setExpenses([
      { item: "", qty: "", unit: "", pricePerUnit: "", description: "", subTotal: 0 }
    ])
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validExpenses = expenses.filter(exp => exp.item && exp.qty && exp.unit && exp.pricePerUnit)
    console.log('All expenses:', expenses)
    console.log('Valid expenses after filter:', validExpenses)

    if (validExpenses.length === 0) {
      alert("Harap isi minimal satu pengeluaran dengan lengkap (Item, QTY, Unit, dan Price @)")
      return
    }

    if (!divisionId || !categoryId || !subcategoryId || !picId) {
      alert("Harap isi semua field informasi umum")
      return
    }

    // Validate batch name for multiple expenses
    if (validExpenses.length > 1 && !batchName.trim()) {
      alert("Harap isi judul batch untuk pengeluaran dengan multiple item")
      return
    }

    setIsLoading(true)
    
    try {
      // Determine if this is single or bulk expense
      const isBulk = validExpenses.length > 1
      console.log('Valid expenses:', validExpenses.length, 'isBulk:', isBulk)
      
      if (isBulk) {
        // Use bulk API
        const response = await fetch('/api/expenses/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            batchName: batchName.trim() || `Pengeluaran ${new Date().toLocaleDateString('id-ID')}`,
            divisionId,
            categoryId,
            subcategoryId,
            picId,
            date: expenseDate,
            ref: expenseRef || null,
            expenses: validExpenses.map(exp => {
              const qty = parseFloat(exp.qty)
              const pricePerUnit = parseFloat(exp.pricePerUnit)
              const amount = qty * pricePerUnit
              return {
                amount: amount,
                description: exp.description?.trim() || '',
                item: exp.item,
                qty: qty,
                unit: exp.unit,
                price_per_unit: pricePerUnit
              }
            })
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error inserting bulk expenses:', errorData.error)
          alert(`Terjadi kesalahan saat menyimpan data: ${errorData.error}`)
          return
        }

        const result = await response.json()
        console.log('Bulk insert result:', result)
        alert(`${validExpenses.length} pengeluaran berhasil ditambahkan!`)
      } else {
        // Use single API
        const exp = validExpenses[0]
        const qty = parseFloat(exp.qty)
        const pricePerUnit = parseFloat(exp.pricePerUnit)
        const amount = qty * pricePerUnit

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            amount: amount,
            description: exp.description?.trim() || '',
            item: exp.item,
            qty: qty,
            unit: exp.unit,
            price_per_unit: pricePerUnit,
            date: expenseDate,
            ref: expenseRef || null,
          division_id: divisionId,
          category_id: categoryId,
          subcategory_id: subcategoryId,
          pic_id: picId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error inserting expense:', errorData.error)
        alert("Terjadi kesalahan saat menyimpan data")
        return
      }

      alert("Pengeluaran berhasil ditambahkan!")
      }

      resetForm()
      setIsOpen(false)
      onExpenseAdded()
      
    } catch (error) {
      console.error('Error:', error)
      alert("Terjadi kesalahan")
    } finally {
      setIsLoading(false)
    }
  }

  const addExpenseRow = () => {
    setExpenses([...expenses, { item: "", qty: "", unit: "", pricePerUnit: "", description: "", subTotal: 0 }])
  }

  const removeExpenseRow = (index: number) => {
    if (expenses.length > 1) {
      setExpenses(expenses.filter((_, i) => i !== index))
    }
  }

  const updateExpense = (index: number, field: keyof ExpenseItem, value: string | number) => {
    const updatedExpenses = [...expenses]
    
    if (field === 'subTotal') {
      updatedExpenses[index][field] = value as number
    } else {
      (updatedExpenses[index] as any)[field] = value
    }
    
    // Calculate sub total when qty or pricePerUnit changes
    if (field === 'qty' || field === 'pricePerUnit') {
      const qty = parseFloat(field === 'qty' ? value as string : updatedExpenses[index].qty) || 0
      const pricePerUnit = parseFloat(field === 'pricePerUnit' ? value as string : updatedExpenses[index].pricePerUnit) || 0
      updatedExpenses[index].subTotal = qty * pricePerUnit
    }
    
    setExpenses(updatedExpenses)
  }

  const totalBulkAmount = expenses
    .filter(exp => exp.qty && exp.pricePerUnit)
    .reduce((sum, exp) => sum + exp.subTotal, 0)

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) resetForm()
    }}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-[70vw] max-w-[70vw] sm:max-w-[70vw] overflow-y-auto p-8">
        <SheetHeader className="pb-8">
          <SheetTitle className="text-xl font-semibold">Tambah Pengeluaran</SheetTitle>
          <SheetDescription className="text-base">
            Pilih jenis input pengeluaran dan isi form dengan lengkap
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-10">
          {/* Two Box Layout with 2:1 ratio */}
          <div className="grid grid-cols-3 gap-6">
            {/* Box 1: Informasi Umum - Takes 2/3 width */}
            <div className="col-span-2 space-y-6 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Informasi Umum</h3>
              </div>
              
              <div className="space-y-4">
                {/* Row 1: Divisi & PIC */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-700">Divisi *</div>
                    <Select value={divisionId} onValueChange={setDivisionId}>
                      <SelectTrigger className="h-11 w-full">
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
                    <div className="text-sm font-semibold text-gray-700">PIC *</div>
                    <Select value={picId} onValueChange={setPicId} disabled={!divisionId}>
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Pilih PIC" />
                      </SelectTrigger>
                      <SelectContent>
                        {pics.map((pic) => (
                          <SelectItem key={pic.id} value={pic.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="font-medium">{pic.name}</div>
                                <div className="text-xs text-gray-500">{pic.position} • {pic.phone}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Kategori & Sub Kategori */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-700">Kategori *</div>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="h-11 w-full">
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
                    <div className="text-sm font-semibold text-gray-700">Sub Kategori *</div>
                    <Select value={subcategoryId} onValueChange={setSubcategoryId} disabled={!categoryId}>
                      <SelectTrigger className="h-11 w-full">
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
                </div>
              </div>
            </div>

            {/* Box 2: Tanggal & Referensi - Takes 1/3 width */}
            <div className="space-y-6 p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Tanggal & Referensi</h3>
              </div>
              
              <div className="space-y-4">
                {/* Header */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-sm font-semibold text-gray-700">Tanggal & Waktu</div>
                </div>
                
                {/* Data Row */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Input
                      type="datetime-local"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Header Row 2 */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-sm font-semibold text-gray-700">Referensi (Opsional)</div>
                </div>

                {/* Data Row 2 */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="INV-001, PO-123, dll"
                      value={expenseRef}
                      onChange={(e) => setExpenseRef(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Header Row 3 - Only show when multiple expenses */}
                {expenses.length > 1 && (
                  <>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="text-sm font-semibold text-gray-700">
                        Judul Batch *
                      </div>
                    </div>

                    {/* Data Row 3 */}
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Input
                          type="text"
                          placeholder="Masukkan judul batch pengeluaran..."
                          value={batchName}
                          onChange={(e) => setBatchName(e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Expense Form */}
          <div className="p-8 bg-white rounded-xl border border-gray-200 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                  <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <Label className="text-base font-semibold text-gray-900">Daftar Pengeluaran</Label>
                  </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addExpenseRow}
                    className="flex items-center gap-2 h-9 px-4"
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Baris
                    </Button>
                  </div>

                <div className="space-y-6">
                  {/* Header */}
                  <div className="grid grid-cols-6 gap-4">
                    <div className="text-sm font-semibold text-gray-700">Item</div>
                    <div className="text-sm font-semibold text-gray-700">QTY</div>
                    <div className="text-sm font-semibold text-gray-700">Unit</div>
                    <div className="text-sm font-semibold text-gray-700">Price @</div>
                    <div className="text-sm font-semibold text-gray-700">Keterangan (Opsional)</div>
                    <div className="text-sm font-semibold text-gray-700">Sub Total</div>
                  </div>
                  
                  {/* Data Rows */}
                  {expenses.map((expense, index) => (
                    <div key={index} className="grid grid-cols-6 gap-4 items-center">
                      <div>
                        <Input
                          id={`item-${index}`}
                          type="text"
                          placeholder="Pulpen"
                          value={expense.item}
                          onChange={(e) => updateExpense(index, 'item', e.target.value)}
                          className="h-11"
                        />
                      </div>
                      
                      <div>
                        <Input
                          id={`qty-${index}`}
                          type="number"
                          placeholder="5"
                          value={expense.qty}
                          onChange={(e) => updateExpense(index, 'qty', e.target.value)}
                          min="0"
                          step="0.01"
                          className="h-11"
                        />
                      </div>
                      
                      <div>
                        <Input
                          id={`unit-${index}`}
                          type="text"
                          placeholder="pcs"
                          value={expense.unit}
                          onChange={(e) => updateExpense(index, 'unit', e.target.value)}
                          className="h-11"
                        />
                      </div>
                      
                      <div>
                        <Input
                          id={`pricePerUnit-${index}`}
                          type="number"
                          placeholder="10000"
                          value={expense.pricePerUnit}
                          onChange={(e) => updateExpense(index, 'pricePerUnit', e.target.value)}
                          min="0"
                          step="0.01"
                          className="h-11"
                        />
                      </div>
                      
                      <div>
                        <Input
                          id={`description-${index}`}
                          type="text"
                          placeholder="ATK rapat"
                          value={expense.description}
                          onChange={(e) => updateExpense(index, 'description', e.target.value)}
                          className="h-11"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-11 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md px-3">
                          <span className="text-sm font-semibold text-gray-700">
                            {expense.qty && expense.pricePerUnit ? 
                              new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(expense.subTotal)
                              : 'Rp 0'
                            }
                        </span>
                        </div>
                        {expenses.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeExpenseRow(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-11 w-11 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                </div>

                {/* Total */}
                {totalBulkAmount > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8">
                    <div className="text-center">
                    <span className="text-sm font-medium text-blue-800">Total Pengeluaran: </span>
                    <span className="text-2xl font-bold text-blue-600">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR'
                        }).format(totalBulkAmount)}
                      </span>
                    </div>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                className="w-full h-14 text-base font-medium mt-6"
                  disabled={isLoading}
                >
                {isLoading ? "Menyimpan..." : expenses.length === 1 ? "Simpan Pengeluaran" : "Simpan Semua Pengeluaran"}
                </Button>
              </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}