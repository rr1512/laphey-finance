"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { InvoiceSheet } from "@/components/expense-sheet"
import { Plus, Search, Filter, X, Calendar, Edit, Edit3, Trash2 } from "lucide-react"
import { type Division, type Category, type Subcategory, type PIC } from "@/lib/supabase"
import { formatWIBDate } from "@/lib/timezone"
import useCustomToast from "@/lib/use-toast"

interface ExpenseListProps {
  refreshTrigger: number
  onExpenseAdded?: () => void
}

// Removed GroupedExpenses interface - not needed for invoice system

interface FilterState {
  search: string
  divisionId: string
  categoryId: string
  subcategoryId: string
  picId: string
  dateFrom: string
  dateTo: string
}

export function ExpenseList({ refreshTrigger, onExpenseAdded }: ExpenseListProps) {
  const { success, error: showError, info } = useCustomToast() as any

  const [expenses, setExpenses] = useState<any[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    divisionId: 'all',
    categoryId: 'all',
    subcategoryId: 'all',
    picId: 'all',
    dateFrom: '',
    dateTo: ''
  })
  
  // Filter options
  const [divisions, setDivisions] = useState<Division[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [pics, setPics] = useState<PIC[]>([])
  const [dateRangeOpen, setDateRangeOpen] = useState(false)

  // Edit state - can be Expense object or batch edit object
  const [editingExpense, setEditingExpense] = useState<any>(null)

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/expenses')

      if (!response.ok) {
        console.error('Error fetching expenses:', response.status, response.statusText)
        // Set empty array if fetch fails
        setExpenses([])
        setFilteredExpenses([])
        return
      }

      const data: any[] = await response.json()
      setExpenses(data || []) // Ensure we have an array
      setFilteredExpenses(data || [])

    } catch (error) {
      console.error('Error fetching expenses:', error)
      // Set empty array on error
      setExpenses([])
      setFilteredExpenses([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFilterOptions = async () => {
    try {
      const [divisionsRes, categoriesRes, picsRes] = await Promise.all([
        fetch('/api/divisions'),
        fetch('/api/categories'),
        fetch('/api/pics')
      ])

      if (divisionsRes.ok) {
        const divisionsData = await divisionsRes.json()
        setDivisions(divisionsData || [])
      } else {
        console.error('Error fetching divisions:', divisionsRes.status)
        setDivisions([])
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData || [])
      } else {
        console.error('Error fetching categories:', categoriesRes.status)
        setCategories([])
      }

      if (picsRes.ok) {
        const picsData = await picsRes.json()
        setPics(picsData || [])
      } else {
        console.error('Error fetching pics:', picsRes.status)
        setPics([])
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
      // Set empty arrays on error
      setDivisions([])
      setCategories([])
      setPics([])
    }
  }

  // Edit handlers
  const handleEditInvoice = (invoice: any) => {
    setEditingExpense(invoice)
  }

  const handleInvoiceUpdated = () => {
    setEditingExpense(null)
    fetchInvoices() // Refresh the list
    success("Invoice Berhasil Diupdate", "Data invoice telah diperbarui")
  }

  // Delete handler
  const handleDeleteInvoice = async (invoice: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus invoice "${invoice.title}"?\n\nTindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    try {
      const response = await fetch(`/api/expenses/${invoice.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        success("Invoice Berhasil Dihapus", `Invoice ${invoice.title} telah dihapus`)
        fetchInvoices() // Refresh the list
      } else {
        const data = await response.json()
        showError('Gagal Menghapus Invoice', data.error || 'Terjadi kesalahan saat menghapus invoice')
      }
    } catch (error) {
      showError('Terjadi Kesalahan', 'Silakan coba lagi atau hubungi administrator')
    }
  }

  const filterExpenses = (expenses: any[], filters: FilterState): any[] => {
    return expenses.filter(expense => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        let matchesSearch = false

        // Search in title
        if (expense.title?.toLowerCase().includes(searchLower)) {
          matchesSearch = true
        }

        // Search in notes
        if (expense.notes?.toLowerCase().includes(searchLower)) {
          matchesSearch = true
        }

        // Search in expense number
        if (expense.expense_number?.toLowerCase().includes(searchLower)) {
          matchesSearch = true
        }

        // Search in details (JSONB array)
        if (expense.details) {
          try {
            const details = typeof expense.details === 'string'
              ? JSON.parse(expense.details)
              : expense.details

            if (Array.isArray(details)) {
              details.forEach((item: any) => {
                if (item.item?.toLowerCase().includes(searchLower) ||
                    item.description?.toLowerCase().includes(searchLower)) {
                  matchesSearch = true
                }
              })
            }
          } catch (error) {
            // Ignore parsing errors
          }
        }

        if (!matchesSearch) return false
      }

      // Division filter
      if (filters.divisionId && filters.divisionId !== 'all' && expense.division_id !== filters.divisionId) {
        return false
      }

      // Category filter
      if (filters.categoryId && filters.categoryId !== 'all' && expense.category_id !== filters.categoryId) {
        return false
      }

      // Subcategory filter
      if (filters.subcategoryId && filters.subcategoryId !== 'all' && expense.subcategory_id !== filters.subcategoryId) {
        return false
      }

      // PIC filter
      if (filters.picId && filters.picId !== 'all' && expense.pic_id !== filters.picId) {
        return false
      }

      // Date filters
      if (filters.dateFrom) {
        const expenseDate = new Date(expense.date)
        const fromDate = new Date(filters.dateFrom)
        if (expenseDate < fromDate) return false
      }

      if (filters.dateTo) {
        const expenseDate = new Date(expense.date)
        const toDate = new Date(filters.dateTo)
        toDate.setHours(23, 59, 59, 999) // End of day
        if (expenseDate > toDate) return false
      }

      return true
    })
  }

// Removed groupExpenses function - not needed for invoice system

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    
    // Reset subcategory when category changes
    if (key === 'categoryId') {
      newFilters.subcategoryId = 'all'
    }
    
    setFilters(newFilters)
    const filtered = filterExpenses(expenses, newFilters)
    setFilteredExpenses(filtered)
  }

  const clearFilters = () => {
    const clearedFilters: FilterState = {
      search: '',
      divisionId: 'all',
      categoryId: 'all',
      subcategoryId: 'all',
      picId: 'all',
      dateFrom: '',
      dateTo: ''
    }
    setFilters(clearedFilters)
    setFilteredExpenses(expenses)
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'search' || key === 'dateFrom' || key === 'dateTo') {
      return value !== ''
    }
    return value !== 'all'
  })

  useEffect(() => {
    fetchInvoices()
    fetchFilterOptions()
  }, [refreshTrigger])

  useEffect(() => {
    // Calculate total from filtered invoices
    const totalAmount = filteredExpenses.reduce((sum: number, invoice: any) => sum + invoice.total_amount, 0)
    setTotal(totalAmount)
  }, [filteredExpenses])

  // Fetch subcategories when category changes
  useEffect(() => {
    if (filters.categoryId && filters.categoryId !== 'all') {
      fetch(`/api/subcategories?category_id=${filters.categoryId}`)
        .then(res => res.json())
        .then(data => setSubcategories(data))
        .catch(error => console.error('Error fetching subcategories:', error))
    } else {
      setSubcategories([])
    }
  }, [filters.categoryId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return formatWIBDate(dateString)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center text-gray-500">Memuat data...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Pengeluaran
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="-mt-4">
            {/* Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Cari</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input
                    placeholder="Item, deskripsi..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-9 h-9"
                  />
                </div>
              </div>

              {/* Division */}
              <div className="space-y-2">
                <Label htmlFor="division" className="text-xs font-medium text-gray-700">Divisi</Label>
                <Select
                  value={filters.divisionId}
                  onValueChange={(value) => handleFilterChange('divisionId', value)}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {divisions.map((division) => (
                      <SelectItem key={division.id} value={division.id}>
                        {division.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-medium text-gray-700">Kategori</Label>
                <Select
                  value={filters.categoryId}
                  onValueChange={(value) => handleFilterChange('categoryId', value)}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategory */}
              <div className="space-y-2">
                <Label htmlFor="subcategory" className="text-xs font-medium text-gray-700">Sub Kategori</Label>
                <Select
                  value={filters.subcategoryId}
                  onValueChange={(value) => handleFilterChange('subcategoryId', value)}
                  disabled={!filters.categoryId || filters.categoryId === 'all'}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {subcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PIC */}
              <div className="space-y-2">
                <Label htmlFor="pic" className="text-xs font-medium text-gray-700">PIC</Label>
                <Select
                  value={filters.picId}
                  onValueChange={(value) => handleFilterChange('picId', value)}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {pics.map((pic) => (
                      <SelectItem key={pic.id} value={pic.id}>
                        {pic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Tanggal</Label>
                <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-9 justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-3 w-3" />
                      <span className="text-xs truncate">
                        {filters.dateFrom && filters.dateTo
                          ? `${new Date(filters.dateFrom).toLocaleDateString('id-ID')} - ${new Date(filters.dateTo).toLocaleDateString('id-ID')}`
                          : filters.dateFrom
                          ? `Dari: ${new Date(filters.dateFrom).toLocaleDateString('id-ID')}`
                          : filters.dateTo
                          ? `Sampai: ${new Date(filters.dateTo).toLocaleDateString('id-ID')}`
                          : "Pilih"
                        }
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="start">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="dateFrom" className="text-sm font-medium">Tanggal Mulai</Label>
                        <Input
                          id="dateFrom"
                          type="date"
                          value={filters.dateFrom}
                          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateTo" className="text-sm font-medium">Tanggal Akhir</Label>
                        <Input
                          id="dateTo"
                          type="date"
                          value={filters.dateTo}
                          onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleFilterChange('dateFrom', '')
                            handleFilterChange('dateTo', '')
                            setDateRangeOpen(false)
                          }}
                        >
                          Clear
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setDateRangeOpen(false)}
                        >
                          OK
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium mb-2">Filter Aktif:</p>
                <div className="flex flex-wrap gap-2">
                  {filters.search && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      Pencarian: &quot;{filters.search}&quot;
                    </span>
                  )}
                  {filters.divisionId && filters.divisionId !== 'all' && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs inline-flex items-center gap-1">
                      <span>Divisi:</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-200 text-blue-900">
                        {divisions.find(d => d.id === filters.divisionId)?.name}
                      </span>
                    </span>
                  )}
                  {filters.categoryId && filters.categoryId !== 'all' && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      Kategori: {categories.find(c => c.id === filters.categoryId)?.name}
                    </span>
                  )}
                  {filters.subcategoryId && filters.subcategoryId !== 'all' && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      Sub Kategori: {subcategories.find(s => s.id === filters.subcategoryId)?.name}
                    </span>
                  )}
                  {filters.picId && filters.picId !== 'all' && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      PIC: {pics.find(p => p.id === filters.picId)?.name}
                    </span>
                  )}
                  {(filters.dateFrom || filters.dateTo) && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {filters.dateFrom && filters.dateTo
                        ? `${new Date(filters.dateFrom).toLocaleDateString('id-ID')} - ${new Date(filters.dateTo).toLocaleDateString('id-ID')}`
                        : filters.dateFrom
                        ? `Dari: ${new Date(filters.dateFrom).toLocaleDateString('id-ID')}`
                        : `Sampai: ${new Date(filters.dateTo).toLocaleDateString('id-ID')}`
                      }
                    </span>
                  )}
                </div>
          </div>
            )}
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {expenses.length === 0
                ? "Belum ada invoice yang tercatat"
                : "Tidak ada invoice yang sesuai dengan filter"
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expense
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Divisi
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PIC
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah Item
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses
                    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((invoice: any) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {invoice.expense_number}
                          </div>
                          {invoice.notes && (
                            <div className="text-sm text-gray-500 italic mt-1 truncate max-w-xs">
                              &quot;{invoice.notes}&quot;
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{formatDate(invoice.date)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {invoice.division?.name || 'Tidak diketahui'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="text-blue-600 font-medium">
                              {invoice.category?.name || 'Tidak ada'}
                            </div>
                            {invoice.subcategory?.name && (
                              <div className="text-gray-500 text-xs mt-1">
                                {invoice.subcategory.name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {invoice.pic?.name || 'Tidak ada'}
                            {invoice.pic?.position && (
                              <div className="text-xs text-gray-500">
                                {invoice.pic.position}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {(() => {
                              try {
                                const details = typeof invoice.details === 'string'
                                  ? JSON.parse(invoice.details)
                                  : invoice.details
                                return Array.isArray(details) ? details.length : 0
                              } catch {
                                return 0
                              }
                            })()} item
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-bold text-red-600">
                            {formatCurrency(invoice.total_amount)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditInvoice(invoice)}
                              className="h-8 px-3 text-xs"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteInvoice(invoice)}
                              className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Hapus
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Summary - Moved to bottom and smaller */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Total Pengeluaran
              {Object.entries(filters).some(([key, value]) => {
                if (key === 'search' || key === 'dateFrom' || key === 'dateTo') {
                  return value !== ''
                }
                return value !== 'all'
              }) && (
                <span className="text-xs text-gray-500 ml-1">
                  (Filtered)
                </span>
              )}
            </span>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(total)}
            </p>
            {Object.entries(filters).some(([key, value]) => {
              if (key === 'search' || key === 'dateFrom' || key === 'dateTo') {
                return value !== ''
              }
              return value !== 'all'
            }) && (
              <p className="text-xs text-gray-500">
                {filteredExpenses.length} dari {expenses.length} pengeluaran
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Invoice Sheet */}
      <InvoiceSheet
        editInvoice={editingExpense}
        onInvoiceUpdated={handleInvoiceUpdated}
        onClose={() => setEditingExpense(null)}
      />

      {/* Floating Action Button */}
      {onExpenseAdded && (
        <div className="fixed bottom-6 right-6 z-50">
          <InvoiceSheet onInvoiceAdded={onExpenseAdded}>
            <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-shadow h-14 w-14">
              <Plus className="h-6 w-6" />
            </Button>
          </InvoiceSheet>
        </div>
      )}
    </div>
  )
}
