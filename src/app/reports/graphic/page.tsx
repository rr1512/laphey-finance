"use client"

import { useState, useEffect, useCallback } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Calendar, Filter } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts'

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
  details?: any // JSONB array of expense items
}

interface ChartData {
  name: string
  value: number
  color: string
}

interface FilterState {
  dateFrom: string
  dateTo: string
  divisionId: string
  categoryId: string
  chartType: 'bar' | 'pie' | 'line' | 'area'
  groupBy: 'category' | 'division' | 'month' | 'pic'
}

const COLORS = [
  '#1e40af', '#dc2626', '#059669', '#d97706', '#7c3aed',
  '#0891b2', '#db2777', '#65a30d', '#ea580c', '#4f46e5',
  '#0d9488', '#e11d48', '#0369a1', '#9333ea', '#ca8a04'
]

export default function GraphicPage() {
  const [expenses, setExpenses] = useState<ExpenseData[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    divisionId: 'all',
    categoryId: 'all',
    chartType: 'bar',
    groupBy: 'category'
  })

  const [filterOptions, setFilterOptions] = useState({
    divisions: [] as any[],
    categories: [] as any[]
  })

  // Fetch expenses data
  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    }
  }

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const [divisionsRes, categoriesRes] = await Promise.all([
        fetch('/api/divisions'),
        fetch('/api/categories')
      ])

      if (divisionsRes.ok) {
        const divisions = await divisionsRes.json()
        setFilterOptions(prev => ({ ...prev, divisions }))
      }

      if (categoriesRes.ok) {
        const categories = await categoriesRes.json()
        setFilterOptions(prev => ({ ...prev, categories }))
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }

  // Process data for charts
  const processChartData = useCallback(() => {
    let filteredExpenses = expenses

    // Apply filters
    if (filters.dateFrom) {
      filteredExpenses = filteredExpenses.filter(exp =>
        new Date(exp.date) >= new Date(filters.dateFrom)
      )
    }

    if (filters.dateTo) {
      filteredExpenses = filteredExpenses.filter(exp =>
        new Date(exp.date) <= new Date(filters.dateTo)
      )
    }

    if (filters.divisionId !== 'all') {
      filteredExpenses = filteredExpenses.filter(exp =>
        exp.division?.id === filters.divisionId
      )
    }

    if (filters.categoryId !== 'all') {
      filteredExpenses = filteredExpenses.filter(exp =>
        exp.category?.id === filters.categoryId
      )
    }

    // Group data based on groupBy
    const grouped = filteredExpenses.reduce((acc, exp) => {
      let key = ''
      switch (filters.groupBy) {
        case 'category':
          key = exp.category?.name || 'Tidak Berkategori'
          break
        case 'division':
          key = exp.division?.name || 'Tidak Ada Divisi'
          break
        case 'pic':
          key = exp.pic?.name || 'Tidak Ada PIC'
          break
        case 'month':
          key = new Date(exp.date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
          break
      }

      if (!acc[key]) {
        acc[key] = 0
      }
      acc[key] += exp.total_amount
      return acc
    }, {} as Record<string, number>)

    // Convert to chart data
    const chartData = Object.entries(grouped).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }))

    setChartData(chartData)
    setTotalAmount(filteredExpenses.reduce((sum, exp) => sum + exp.total_amount, 0))
    setIsLoading(false)
  }, [expenses, filters])

  useEffect(() => {
    fetchExpenses()
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    if (expenses.length > 0) {
      processChartData()
    }
  }, [expenses, filters, processChartData])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      divisionId: 'all',
      categoryId: 'all',
      chartType: 'bar',
      groupBy: 'category'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    }

    switch (filters.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                stroke="#fff"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#1e40af"
                strokeWidth={3}
                dot={{ fill: '#1e40af', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#1e40af', strokeWidth: 2, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#059669"
                fill="#059669"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat grafik expense...</p>
        </div>
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">


        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-pink-500 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 font-medium">Total Expense</p>
                  <p className="text-3xl font-bold mt-1">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <BarChart3 className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-cyan-500 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-100 font-medium">Jumlah Expense</p>
                  <p className="text-3xl font-bold mt-1">{expenses.length}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <TrendingUp className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-500 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 font-medium">Kategori Terpakai</p>
                  <p className="text-3xl font-bold mt-1">{chartData.length}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <PieChartIcon className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg border-0 overflow-hidden">
          <div className="bg-slate-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Filter className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Filter & Pengaturan</h3>
              </div>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
              >
                Reset Filter
              </Button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Mulai</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Akhir</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              {/* Division */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Divisi</label>
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
                <label className="text-sm font-medium">Kategori</label>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Chart Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipe Grafik</label>
                <Select value={filters.chartType} onValueChange={(value) => handleFilterChange('chartType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Bar Chart</SelectItem>
                    <SelectItem value="pie">Pie Chart</SelectItem>
                    <SelectItem value="line">Line Chart</SelectItem>
                    <SelectItem value="area">Area Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Group By */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Kelompokkan Berdasarkan</label>
                <Select value={filters.groupBy} onValueChange={(value) => handleFilterChange('groupBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="category">Kategori</SelectItem>
                    <SelectItem value="division">Divisi</SelectItem>
                    <SelectItem value="pic">PIC</SelectItem>
                    <SelectItem value="month">Bulan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow-lg border-0 overflow-hidden">
          <div className="bg-slate-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Visualisasi Expense</h3>
              </div>
              <Badge
                variant="outline"
                className="bg-white/10 text-white border-white/20"
              >
                {filters.groupBy === 'category' ? 'Per Kategori' :
                 filters.groupBy === 'division' ? 'Per Divisi' :
                 filters.groupBy === 'pic' ? 'Per PIC' : 'Per Bulan'}
              </Badge>
            </div>
          </div>
          <div className="p-6">
            {chartData.length > 0 ? (
              renderChart()
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada data untuk ditampilkan</p>
                <p className="text-sm text-gray-400 mt-2">Coba ubah filter atau pastikan ada data expense</p>
              </div>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-lg border-0 overflow-hidden">
          <div className="bg-slate-800 px-6 py-4">
            <h3 className="text-lg font-semibold text-white">Detail Data</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Kategori</th>
                    <th className="text-left p-2">Jumlah</th>
                    <th className="text-left p-2">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        {item.name}
                      </td>
                      <td className="p-2 font-medium">{formatCurrency(item.value)}</td>
                      <td className="p-2">
                        {((item.value / totalAmount) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
