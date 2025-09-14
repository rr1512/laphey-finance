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
import useCustomToast from "@/lib/use-toast"
 
interface InvoiceItem {
  item: string
  qty: string
  unit: string
  pricePerUnit: string
  description: string
  subTotal: number
}

interface InvoiceSheetProps {
  onInvoiceAdded?: () => void
  editInvoice?: any // Invoice to edit
  onInvoiceUpdated?: () => void
  onClose?: () => void // Callback when sheet is closed
  children?: React.ReactNode
}

export function InvoiceSheet({ onInvoiceAdded, editInvoice, onInvoiceUpdated, onClose, children }: InvoiceSheetProps) {
  const { success, error: showError } = useCustomToast() as any

  // Common state
  const [isOpen, setIsOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
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
  const [expenses, setExpenses] = useState<InvoiceItem[]>([
    { item: "", qty: "", unit: "", pricePerUnit: "", description: "", subTotal: 0 }
  ])

  // State untuk formatted price display
  const [priceDisplays, setPriceDisplays] = useState<{ [key: number]: string }>({})

  // State untuk keterangan invoice (terpisah dari expenseRef)
  const [invoiceNotes, setInvoiceNotes] = useState("")

  // Format number with thousand separator
  const formatNumber = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '')
    // Add thousand separators
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  // Parse formatted number back to numeric value
  const parseNumber = (formattedValue: string) => {
    return formattedValue.replace(/,/g, '')
  }

  // Handle price input change with formatting
  const handlePriceChange = (index: number, value: string) => {
    const formattedValue = formatNumber(value)
    const numericValue = parseNumber(formattedValue)

    // Update display state
    setPriceDisplays(prev => ({
      ...prev,
      [index]: formattedValue
    }))

    // Update actual expense data
    const updatedExpenses = [...expenses]
    updatedExpenses[index].pricePerUnit = numericValue
    updatedExpenses[index].subTotal = parseFloat(updatedExpenses[index].qty || '0') * parseFloat(numericValue || '0')
    setExpenses(updatedExpenses)
  }

  // Initialize price displays
  useEffect(() => {
    const initialDisplays: { [key: number]: string } = {}
    expenses.forEach((expense, index) => {
      if (expense.pricePerUnit) {
        initialDisplays[index] = formatNumber(expense.pricePerUnit)
      }
    })
    setPriceDisplays(initialDisplays)
  }, [expenses])

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

  // Handle edit mode - populate form with invoice data
  useEffect(() => {
    if (editInvoice && !isEditMode) {
      setIsEditMode(true)
      setIsOpen(true) // Open the sheet when entering edit mode

      // Populate form with invoice data
      setDivisionId(editInvoice.division_id || "")
      setCategoryId(editInvoice.category_id || "")
      setSubcategoryId(editInvoice.subcategory_id || "")
      setPicId(editInvoice.pic_id || "")

      // Convert date to local datetime format
      const invoiceDate = new Date(editInvoice.date)
      const localDateTime = new Date(invoiceDate.getTime() - invoiceDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      setExpenseDate(localDateTime)

      setExpenseRef(editInvoice.ref || "")
      setInvoiceNotes(editInvoice.notes || "")
      setBatchName(editInvoice.title || "")

      // Check if this is expense edit with details (JSONB array)
      if (editInvoice.details) {
        try {
          // Parse JSONB details if it's a string
          const details = typeof editInvoice.details === 'string'
            ? JSON.parse(editInvoice.details)
            : editInvoice.details

          if (Array.isArray(details) && details.length > 0) {
            // Expense edit - populate with expense details
            setExpenses(details.map((item: any) => ({
              item: item.item || "",
              qty: item.qty?.toString() || "",
              unit: item.unit || "",
              pricePerUnit: item.price_per_unit?.toString() || "",
              description: item.description || "",
              subTotal: item.amount || 0
            })))
          } else {
            // Empty details - single empty item
            setExpenses([{
              item: "",
              qty: "",
              unit: "",
              pricePerUnit: "",
              description: "",
              subTotal: 0
            }])
          }
        } catch (error) {
          console.error('Error parsing expense details:', error)
          // Fallback - single empty item
          setExpenses([{
            item: "",
            qty: "",
            unit: "",
            pricePerUnit: "",
            description: "",
            subTotal: 0
          }])
        }
      } else {
        // Fallback - single empty item for new expenses
        setExpenses([{
          item: "",
          qty: "",
          unit: "",
          pricePerUnit: "",
          description: "",
          subTotal: 0
        }])
      }
    } else if (!editInvoice && isEditMode) {
      setIsEditMode(false)
      setIsOpen(false) // Close the sheet when exiting edit mode
    }
  }, [editInvoice, isEditMode])

  // Initialize price displays when expenses change (for edit mode)
  useEffect(() => {
    if (isEditMode && expenses.length > 0) {
      const initialDisplays: { [key: number]: string } = {}
      expenses.forEach((expense, index) => {
        if (expense.pricePerUnit) {
          initialDisplays[index] = formatNumber(expense.pricePerUnit)
        }
      })
      setPriceDisplays(initialDisplays)
    }
  }, [expenses, isEditMode])


  // Reset form when sheet closes
  const resetForm = () => {
    setDivisionId("")
    setCategoryId("")
    setSubcategoryId("")
    setPicId("")
    setExpenseDate(() => getWIBDateTimeLocal())
    setExpenseRef("")
    setBatchName("")
    setInvoiceNotes("")
    setExpenses([
      { item: "", qty: "", unit: "", pricePerUnit: "", description: "", subTotal: 0 }
    ])
    setPriceDisplays({})
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validExpenses = expenses.filter(exp => exp.item && exp.qty && exp.unit && exp.pricePerUnit)
    console.log('All expenses:', expenses)
    console.log('Valid expenses after filter:', validExpenses)

    if (validExpenses.length === 0) {
      showError("Data Tidak Lengkap", "Harap isi minimal satu pengeluaran dengan lengkap (Item, QTY, Unit, dan Price @)")
      return
    }

    if (!divisionId || !categoryId || !subcategoryId || !picId) {
      showError("Informasi Umum Belum Lengkap", "Harap isi semua field informasi umum")
      return
    }

    // For invoice system, we always allow multiple items
    // No validation needed for item count

    setIsLoading(true)

    try {
      if (isEditMode && editInvoice) {
        // Expense edit - update expense and its details
        const response = await fetch(`/api/expenses/${editInvoice.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pic_id: picId,
            division_id: divisionId,
            category_id: categoryId,
            subcategory_id: subcategoryId,
            date: expenseDate,
            reference: expenseRef || null,
            notes: invoiceNotes || null,
            title: batchName || null,
            details: validExpenses.map(exp => ({
              item: exp.item,
              qty: parseFloat(exp.qty),
              unit: exp.unit,
              price_per_unit: parseFloat(exp.pricePerUnit),
              amount: exp.subTotal,
              description: exp.description?.trim() || ''
            }))
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error updating expense:', errorData.error)
          showError("Gagal Mengupdate Expense", "Terjadi kesalahan saat mengupdate expense")
          return
        }

        success("Expense Berhasil Diupdate", `${editInvoice.expense_number || editInvoice.invoice_number} berhasil diupdate`)
        onInvoiceUpdated?.()
      } else {
        // Add mode - create new expense
        const response = await fetch('/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pic_id: picId,
            division_id: divisionId,
            category_id: categoryId,
            subcategory_id: subcategoryId,
            date: expenseDate,
            reference: expenseRef || null,
            notes: invoiceNotes || null,
            title: batchName || null,
            details: validExpenses.map(exp => ({
              item: exp.item,
              qty: parseFloat(exp.qty),
              unit: exp.unit,
              price_per_unit: parseFloat(exp.pricePerUnit),
              amount: exp.subTotal,
              description: exp.description?.trim() || ''
            }))
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error creating expense:', errorData.error)
          showError("Gagal Membuat Expense", "Terjadi kesalahan saat membuat expense")
          return
        }

        const result = await response.json()
        console.log('Expense create result:', result)
        success("Expense Berhasil Dibuat", `Expense ${result.expense_number} berhasil dibuat dengan ${validExpenses.length} item`)
        onInvoiceAdded?.()
      }

      resetForm()
      setIsOpen(false)

    } catch (error) {
      console.error('Error:', error)
      showError("Terjadi Kesalahan", "Silakan coba lagi atau hubungi administrator")
    } finally {
      setIsLoading(false)
    }
  }

  const addExpenseRow = () => {
    const newExpenses = [...expenses, { item: "", qty: "", unit: "", pricePerUnit: "", description: "", subTotal: 0 }]
    setExpenses(newExpenses)

    // Auto-focus to first input of new row after a short delay
    setTimeout(() => {
      const newIndex = newExpenses.length - 1
      const newInput = document.getElementById(`item-${newIndex}`)
      if (newInput) {
        newInput.focus()
      }
    }, 100)
  }

  const removeExpenseRow = (index: number) => {
    if (expenses.length > 1) {
      setExpenses(expenses.filter((_, i) => i !== index))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, field: keyof InvoiceItem) => {
    if (e.key === 'Enter') {
      e.preventDefault() // Prevent form submission
      addExpenseRow()
    }
  }

  const updateExpense = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedExpenses = [...expenses]

    if (field === 'subTotal') {
      updatedExpenses[index][field] = value as number
    } else {
      (updatedExpenses[index] as any)[field] = value
    }

    // Calculate sub total when qty or pricePerUnit changes
    if (field === 'qty') {
      const qty = parseFloat(value as string) || 0
      const pricePerUnit = parseFloat(updatedExpenses[index].pricePerUnit) || 0
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
      if (!open) {
        resetForm()
        if (isEditMode && onClose) {
          onClose() // Notify parent that edit mode is closed
        }
      }
    }}>
      {children && !isEditMode && (
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
      )}
      <SheetContent className="w-[70vw] max-w-[70vw] sm:max-w-[70vw] overflow-y-auto p-8">
        <SheetHeader className="pb-8">
          <SheetTitle className="text-xl font-semibold">
            {isEditMode ? 'Edit Invoice' : 'Buat Invoice'}
          </SheetTitle>
          <SheetDescription className="text-base">
            {isEditMode
              ? 'Edit detail invoice dan simpan perubahan'
              : 'Pilih jenis input dan isi form invoice dengan lengkap'
            }
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-10">
          {/* Single Box: All Fields in One Row */}
          <div className="space-y-6 p-8 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h3 className="text-lg font-semibold text-gray-900">Detail Invoice</h3>
            </div>

            <div className="space-y-4">
              {/* Single Row: All 6 Fields */}
              <div className="grid grid-cols-6 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-700">Divisi *</div>
                  <Select value={divisionId} onValueChange={setDivisionId}>
                    <SelectTrigger className="w-full bg-white border border-gray-300 rounded-md px-3">
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
                    <SelectTrigger className="w-full bg-white border border-gray-300 rounded-md px-3">
                      <SelectValue placeholder="Pilih PIC" />
                    </SelectTrigger>
                    <SelectContent>
                      {pics.map((pic) => (
                        <SelectItem key={pic.id} value={pic.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">{pic.name}</div>
                              <div className="text-xs text-gray-500">{pic.position}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-700">Kategori *</div>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className=" w-full bg-white border border-gray-300 rounded-md px-3">
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
                    <SelectTrigger className=" w-full bg-white border border-gray-300 rounded-md px-3">
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
                  <div className="text-sm font-semibold text-gray-700">Tanggal & Waktu</div>
                  <Input
                    type="datetime-local"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                      className="bg-white border border-gray-300 rounded-md px-3"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-700">Referensi</div>
                  <Input
                    type="text"
                    placeholder="INV-001, PO-123"
                    value={expenseRef}
                    onChange={(e) => setExpenseRef(e.target.value)}
                      className="bg-white border border-gray-300 rounded-md px-3"
                  />
                </div>
              </div>

              {/* Judul dan Keterangan */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-700">Judul Invoice *</div>
                  <Input
                    type="text"
                    placeholder="Masukkan judul invoice..."
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    className="bg-white border border-gray-300 rounded-md px-3"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-700">Keterangan (Opsional)</div>
                  <Input
                    type="text"
                    placeholder="Tambahkan catatan atau keterangan..."
                    value={invoiceNotes}
                    onChange={(e) => setInvoiceNotes(e.target.value)}
                    className="bg-white border border-gray-300 rounded-md px-3"
                  />
                </div>
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

                <div className="space-y-3">
                  {/* Header */}
                  <div className="grid gap-3" style={{ gridTemplateColumns: '0.3fr 2.5fr 0.5fr 0.5fr 0.8fr 1fr 1.4fr' }}>
                    <div className="text-sm font-semibold text-gray-700 text-center">#</div>
                    <div className="text-sm font-semibold text-gray-700">Item</div>
                    <div className="text-sm font-semibold text-gray-700 text-center">QTY</div>
                    <div className="text-sm font-semibold text-gray-700 text-center">Unit</div>
                    <div className="text-sm font-semibold text-gray-700 text-center">Price @</div>
                    <div className="text-sm font-semibold text-gray-700">Keterangan</div>
                    <div className="text-sm font-semibold text-gray-700 text-center">Sub Total</div>
                  </div>
                  
                  {/* Data Rows */}
                  {expenses.map((expense, index) => (
                    <div key={index} className="grid gap-3 items-center" style={{ gridTemplateColumns: '0.3fr 2.5fr 0.5fr 0.5fr 0.8fr 1fr 1.4fr' }}>
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                      </div>
                      <div>
                        <Input
                          id={`item-${index}`}
                          type="text"
                          placeholder="Pulpen"
                          value={expense.item}
                          onChange={(e) => updateExpense(index, 'item', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'item')}
                          className="bg-white border border-gray-300 rounded-md px-3"
                        />
                      </div>

                      <div>
                        <Input
                          id={`qty-${index}`}
                          type="number"
                          placeholder="5"
                          value={expense.qty}
                          onChange={(e) => updateExpense(index, 'qty', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'qty')}
                          min="0"
                          step="1"
                          className="bg-white border border-gray-300 rounded-md px-3 text-center"
                        />
                      </div>

                      <div>
                        <Input
                          id={`unit-${index}`}
                          type="text"
                          placeholder="pcs"
                          value={expense.unit}
                          onChange={(e) => updateExpense(index, 'unit', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'unit')}
                          className="bg-white border border-gray-300 rounded-md px-3 text-center"
                        />
                      </div>

                      <div>
                        <Input
                          id={`pricePerUnit-${index}`}
                          type="text"
                          placeholder="10,000"
                          value={priceDisplays[index] || formatNumber(expense.pricePerUnit)}
                          onChange={(e) => handlePriceChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'pricePerUnit')}
                          className="bg-white border border-gray-300 rounded-md px-3 text-center"
                        />
                      </div>

                      <div>
                        <Input
                          id={`description-${index}`}
                          type="text"
                          placeholder="ATK rapat"
                          value={expense.description}
                          onChange={(e) => updateExpense(index, 'description', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index, 'description')}
                          className="bg-white border border-gray-300 rounded-md px-3"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-[42px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-md px-3">
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
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-[42px] w-11 p-0"
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
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8">
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
                {isLoading
                  ? "Menyimpan..."
                  : isEditMode
                    ? "Update Invoice"
                    : expenses.length === 1
                      ? "Simpan Invoice"
                      : "Simpan Invoice"
                }
                </Button>
              </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
