"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar, Download, FileText, Filter, Printer, X } from "lucide-react"
import useCustomToast from "@/lib/use-toast"
// Local formatCurrency function
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(amount)
}
import { formatWIBDate } from "@/lib/timezone"
import * as XLSX from 'xlsx'

interface ExpenseData {
  id: string
  expense_number: string
  title: string
  total_amount: number
  date: string
  division?: { id: string; name: string }
  category?: { id: string; name: string }
  subcategory?: { id: string; name: string }
  pic?: { id: string; name: string }
  details?: any[]
  notes?: string
}

interface FilterState {
  dateFrom: string
  dateTo: string
  divisionId: string
  categoryId: string
  picId: string
}

export default function ExportReportPage() {
  const { success, error: showError } = useCustomToast()
  const printRef = useRef<HTMLDivElement>(null)

  const [expenses, setExpenses] = useState<ExpenseData[]>([])
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    divisionId: 'all',
    categoryId: 'all',
    picId: 'all'
  })

  const [filterOptions, setFilterOptions] = useState({
    divisions: [] as any[],
    categories: [] as any[],
    pics: [] as any[]
  })

  // Fetch expenses data
  const fetchExpenses = useCallback(async () => {
    try {
      const response = await fetch('/api/expenses')
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
        setFilteredExpenses(data)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
      showError("Error", "Gagal memuat data pengeluaran")
    } finally {
      setIsLoading(false)
    }
  }, [showError])

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [divisionsRes, categoriesRes, picsRes] = await Promise.all([
        fetch('/api/divisions'),
        fetch('/api/categories'),
        fetch('/api/pics')
      ])

      if (divisionsRes.ok) {
        const divisions = await divisionsRes.json()
        setFilterOptions(prev => ({ ...prev, divisions }))
      }

      if (categoriesRes.ok) {
        const categories = await categoriesRes.json()
        setFilterOptions(prev => ({ ...prev, categories }))
      }

      if (picsRes.ok) {
        const pics = await picsRes.json()
        setFilterOptions(prev => ({ ...prev, pics }))
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = expenses

    if (filters.dateFrom) {
      filtered = filtered.filter(exp =>
        new Date(exp.date) >= new Date(filters.dateFrom)
      )
    }

    if (filters.dateTo) {
      filtered = filtered.filter(exp =>
        new Date(exp.date) <= new Date(filters.dateTo)
      )
    }

    if (filters.divisionId !== 'all') {
      filtered = filtered.filter(exp =>
        exp.division?.id === filters.divisionId
      )
    }

    if (filters.categoryId !== 'all') {
      filtered = filtered.filter(exp =>
        exp.category?.id === filters.categoryId
      )
    }

    if (filters.picId !== 'all') {
      filtered = filtered.filter(exp =>
        exp.pic?.id === filters.picId
      )
    }

    setFilteredExpenses(filtered)
  }, [expenses, filters])

  useEffect(() => {
    fetchExpenses()
    fetchFilterOptions()
  }, [fetchExpenses, fetchFilterOptions])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      divisionId: 'all',
      categoryId: 'all',
      picId: 'all'
    })
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'dateFrom' || key === 'dateTo') {
      return value !== ''
    }
    return value !== 'all'
  })

  // Export to Excel
  const exportToExcel = async () => {
    setIsExporting(true)
    try {
      // Prepare data for Excel
      const excelData = filteredExpenses.map((exp, index) => ({
        'No': index + 1,
        'Nomor Expense': exp.expense_number,
        'Judul': exp.title,
        'Tanggal': formatWIBDate(exp.date),
        'Divisi': exp.division?.name || '',
        'Kategori': exp.category?.name || '',
        'Sub Kategori': exp.subcategory?.name || '',
        'PIC': exp.pic?.name || '',
        'Jumlah Item': (() => {
          try {
            const details = typeof exp.details === 'string'
              ? JSON.parse(exp.details)
              : exp.details
            return Array.isArray(details) ? details.length : 0
          } catch {
            return 0
          }
        })(),
        'Total Amount': exp.total_amount,
        'Notes': exp.notes || ''
      }))

      // Add summary row
      excelData.push({
        'No': '',
        'Nomor Expense': '',
        'Judul': 'TOTAL',
        'Tanggal': '',
        'Divisi': '',
        'Kategori': '',
        'Sub Kategori': '',
        'PIC': '',
        'Jumlah Item': filteredExpenses.length,
        'Total Amount': totalAmount,
        'Notes': ''
      } as any)

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      // Set column widths
      const colWidths = [
        { wch: 5 },  // No
        { wch: 15 }, // Nomor Expense
        { wch: 30 }, // Judul
        { wch: 12 }, // Tanggal
        { wch: 15 }, // Divisi
        { wch: 15 }, // Kategori
        { wch: 15 }, // Sub Kategori
        { wch: 15 }, // PIC
        { wch: 10 }, // Jumlah Item
        { wch: 15 }, // Total Amount
        { wch: 30 }  // Notes
      ]
      ws['!cols'] = colWidths

      // Style the summary row (last row)
      const summaryRowIndex = excelData.length
      const summaryCell = XLSX.utils.encode_cell({ r: summaryRowIndex - 1, c: 2 }) // Judul column
      if (ws[summaryCell]) {
        ws[summaryCell].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "FFE6E6" } }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Pengeluaran')

      // Generate filename with date
      const fileName = `laporan-pengeluaran-${new Date().toISOString().split('T')[0]}.xlsx`

      // Save file
      XLSX.writeFile(wb, fileName)

      success("Export Berhasil", `File ${fileName} telah didownload`)
    } catch (error) {
      console.error('Export error:', error)
      showError("Export Gagal", "Terjadi kesalahan saat export data")
    } finally {
      setIsExporting(false)
    }
  }

  // Print function
  const handlePrint = () => {
    window.print()
  }

  // Calculate totals
  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.total_amount, 0)
  const totalItems = filteredExpenses.length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data laporan...</p>
        </div>
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Export Laporan Pengeluaran</h1>
            <p className="text-gray-600">Export data pengeluaran dalam format Excel atau cetak PDF</p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={exportToExcel}
              disabled={isExporting}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export Excel'}
            </Button>

            <Button
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Cetak/Save PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Data
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Date From */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tanggal Dari</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tanggal Sampai</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>

              {/* Division */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Divisi</Label>
                <Select value={filters.divisionId} onValueChange={(value) => handleFilterChange('divisionId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Divisi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Divisi</SelectItem>
                    {filterOptions.divisions.map((division: any) => (
                      <SelectItem key={division.id} value={division.id}>
                        {division.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Kategori</Label>
                <Select value={filters.categoryId} onValueChange={(value) => handleFilterChange('categoryId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {filterOptions.categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PIC */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">PIC</Label>
                <Select value={filters.picId} onValueChange={(value) => handleFilterChange('picId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua PIC" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua PIC</SelectItem>
                    {filterOptions.pics.map((pic: any) => (
                      <SelectItem key={pic.id} value={pic.id}>
                        {pic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Display */}
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {filters.dateFrom && (
                <Badge variant="secondary">
                  Dari: {new Date(filters.dateFrom).toLocaleDateString('id-ID')}
                </Badge>
              )}
              {filters.dateTo && (
                <Badge variant="secondary">
                  Sampai: {new Date(filters.dateTo).toLocaleDateString('id-ID')}
                </Badge>
              )}
              {filters.divisionId !== 'all' && (
                <Badge variant="secondary">
                  Divisi: {filterOptions.divisions.find(d => d.id === filters.divisionId)?.name}
                </Badge>
              )}
              {filters.categoryId !== 'all' && (
                <Badge variant="secondary">
                  Kategori: {filterOptions.categories.find(c => c.id === filters.categoryId)?.name}
                </Badge>
              )}
              {filters.picId !== 'all' && (
                <Badge variant="secondary">
                  PIC: {filterOptions.pics.find(p => p.id === filters.picId)?.name}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-blue-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 font-medium">Total Pengeluaran</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(totalAmount)}</p>
                </div>
                <FileText className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 font-medium">Jumlah Expense</p>
                  <p className="text-3xl font-bold mt-1">{totalItems}</p>
                </div>
                <Calendar className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 font-medium">Rata-rata per Expense</p>
                  <p className="text-3xl font-bold mt-1">
                    {totalItems > 0 ? formatCurrency(totalAmount / totalItems) : formatCurrency(0)}
                  </p>
                </div>
                <Download className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Table - Printable */}
        <div ref={printRef} className="print:block">
          <Card>
            <CardHeader className="print:hidden">
              <CardTitle className="text-lg">Data Pengeluaran</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Tidak ada data pengeluaran sesuai filter
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full print:text-sm">
                    <thead className="bg-gray-50 print:bg-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-900">
                          No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-900">
                          Expense No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-900">
                          Judul
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-900">
                          Tanggal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-900">
                          Divisi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-900">
                          Kategori
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-900">
                          PIC
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-gray-900">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 print:divide-gray-300">
                      {filteredExpenses.map((expense, index) => (
                        <tr key={expense.id} className="print:border-b print:border-gray-300">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 print:py-2">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 print:py-2">
                            {expense.expense_number}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 print:py-2">
                            <div className="max-w-xs truncate">
                              {expense.title}
                            </div>
                            {expense.notes && (
                              <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                                {expense.notes}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 print:py-2">
                            {formatWIBDate(expense.date)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 print:py-2">
                            {expense.division?.name || '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 print:py-2">
                            {expense.category?.name || '-'}
                            {expense.subcategory?.name && (
                              <div className="text-xs text-gray-500">
                                {expense.subcategory.name}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 print:py-2">
                            {expense.pic?.name || '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-bold text-red-600 print:py-2">
                            {formatCurrency(expense.total_amount)}
                          </td>
                        </tr>
                      ))}
                      {/* Total Row */}
                      <tr className="bg-gray-50 print:bg-gray-100 font-bold">
                        <td colSpan={7} className="px-4 py-4 text-right text-sm print:py-2">
                          TOTAL:
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-bold text-red-600 print:py-2">
                          {formatCurrency(totalAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            font-size: 12px;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:text-gray-900 {
            color: #111827 !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
          .print\\:divide-gray-300 > * + * {
            border-color: #d1d5db !important;
          }
          .print\\:bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
          .print\\:py-2 {
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
          }
        }
      `}</style>
    </MainLayout>
  )
}
