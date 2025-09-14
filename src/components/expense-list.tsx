"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ExpenseSheet } from "@/components/expense-sheet"
import { Plus, Search, Filter, X, Calendar } from "lucide-react"
import { type Expense, type Division, type Category, type Subcategory, type PIC } from "@/lib/supabase"
import { formatWIBDate } from "@/lib/timezone"

interface ExpenseListProps {
  refreshTrigger: number
  onExpenseAdded?: () => void
}

interface GroupedExpenses {
  [batchId: string]: {
    batchName: string | null
    expenses: Expense[]
    total: number
    createdAt: string
  }
}

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
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [groupedExpenses, setGroupedExpenses] = useState<GroupedExpenses>({})
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

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      
      if (!response.ok) {
        console.error('Error fetching expenses')
        return
      }

      const data: Expense[] = await response.json()
      setExpenses(data)
      setFilteredExpenses(data)
      
    } catch (error) {
      console.error('Error:', error)
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
        setDivisions(divisionsData)
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }

      if (picsRes.ok) {
        const picsData = await picsRes.json()
        setPics(picsData)
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }

  const filterExpenses = (expenses: Expense[], filters: FilterState): Expense[] => {
    return expenses.filter(expense => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          expense.item?.toLowerCase().includes(searchLower) ||
          expense.description?.toLowerCase().includes(searchLower) ||
          expense.ref?.toLowerCase().includes(searchLower)
        
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

  const groupExpenses = (expenses: Expense[]): GroupedExpenses => {
      const grouped: GroupedExpenses = {}
    expenses.forEach(expense => {
        if (!grouped[expense.batch_id]) {
          grouped[expense.batch_id] = {
            batchName: expense.batch_name,
            expenses: [],
            total: 0,
            createdAt: expense.created_at
          }
        }
        grouped[expense.batch_id].expenses.push(expense)
        grouped[expense.batch_id].total += expense.amount
      })
    return grouped
  }

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
    fetchExpenses()
    fetchFilterOptions()
  }, [refreshTrigger])

  useEffect(() => {
    const grouped = groupExpenses(filteredExpenses)
    setGroupedExpenses(grouped)
    
    // Calculate total from filtered expenses
    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
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
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Memuat data...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <Card>
        <CardHeader className="pb-4">
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

        <CardContent className="space-y-4">
            {/* Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="space-y-1">
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
              <div className="space-y-1">
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
              <div className="space-y-1">
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
              <div className="space-y-1">
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
              <div className="space-y-1">
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
              <div className="space-y-1">
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
                      Pencarian: "{filters.search}"
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

      {/* Expense List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daftar Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {expenses.length === 0 
                ? "Belum ada pengeluaran yang tercatat"
                : "Tidak ada pengeluaran yang sesuai dengan filter"
              }
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedExpenses)
                .sort(([,a], [,b]) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(([batchId, batch]) => {
                  // Jika batch tidak memiliki nama dan hanya ada 1 expense, tampilkan langsung tanpa header
                  const isSingleIndividualExpense = !batch.batchName && batch.expenses.length === 1

                  return (
                    <div key={batchId} className={isSingleIndividualExpense ? "" : "border rounded-lg overflow-hidden"}>
                      {/* Batch Header - hanya tampilkan jika bukan single individual expense */}
                      {!isSingleIndividualExpense && (
                        <div className="bg-gray-50 px-4 py-3 border-b">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">
                                {batch.batchName || 'Pengeluaran Individual'}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {batch.expenses[0]?.division?.name || 'Divisi tidak diketahui'}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {formatDate(batch.expenses[0]?.date || batch.createdAt)} • {batch.expenses.length} item
                                </span>
                              </div>
                              {/* Show category, subcategory, PIC for bulk expenses */}
                              {batch.expenses.length > 1 && batch.expenses[0] && (
                                <p className="text-sm text-blue-600 font-medium mt-1">
                                  {batch.expenses[0].category?.name} • {batch.expenses[0].subcategory?.name} • PIC: {batch.expenses[0].pic?.name}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-red-600">
                                {formatCurrency(batch.total)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Batch Items */}
                      <div className={isSingleIndividualExpense ? "space-y-2" : "divide-y"}>
                        {batch.expenses.map((expense) => (
                          <div
                            key={expense.id}
                            className={isSingleIndividualExpense
                              ? "grid grid-cols-4 gap-3 items-start p-4 border rounded-lg hover:bg-gray-50"
                              : "grid grid-cols-4 gap-3 items-center p-4 hover:bg-gray-50"
                            }
                          >
                            {/* Kolom 1: Item */}
                            <div className="flex-1">
                              {/* Show badge only for individual expenses (not bulk) */}
                              {batch.expenses.length === 1 && (
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {expense.division?.name || 'Divisi tidak diketahui'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(expense.date)}
                                  </span>
                                </div>
                              )}
                              <h4 className="font-medium text-gray-900">
                                {expense.item || expense.description}
                              </h4>
                              {/* Show category, subcategory, PIC only for single expenses or individual batches */}
                              {batch.expenses.length === 1 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {expense.category?.name} • {expense.subcategory?.name} • PIC: {expense.pic?.name}
                                </div>
                              )}
                            </div>

                            {/* Kolom 2: Keterangan */}
                            <div className="flex-1">
                              {expense.item ? (
                                <span className="text-sm text-gray-600">
                                  {expense.description}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                              {expense.ref && (
                                <div className="text-xs text-purple-600 font-medium mt-1">
                                  Ref: {expense.ref}
                                </div>
                              )}
                            </div>

                            {/* Kolom 3: Qty @ Price */}
                            <div className="text-center">
                              {expense.qty && expense.unit && expense.price_per_unit ? (
                                <span className="text-sm text-blue-600 font-medium">
                                  {expense.qty} {expense.unit} @ {formatCurrency(expense.price_per_unit)}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </div>

                            {/* Kolom 4: Total Amount */}
                            <div className="text-right">
                              <p className="font-semibold text-gray-700">
                                {formatCurrency(expense.amount)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
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

      {/* Floating Action Button */}
      {onExpenseAdded && (
        <div className="fixed bottom-6 right-6 z-50">
          <ExpenseSheet onExpenseAdded={onExpenseAdded}>
            <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-shadow h-14 w-14">
              <Plus className="h-6 w-6" />
            </Button>
          </ExpenseSheet>
        </div>
      )}
    </div>
  )
}