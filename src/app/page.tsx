"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { Receipt, Calendar, User, Building2, TrendingUp, FileText, Plus } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { InvoiceSheet } from "@/components/expense-sheet"

interface Expense {
  id: string
  title: string
  total_amount: number
  date: string
  created_at: string
  division: {
    name: string
  }
  category: {
    name: string
  }
  subcategory: {
    name: string
  }
  pic: {
    name: string
  }
}

export default function Home() {
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecentExpenses = async () => {
    try {
      const response = await fetch('/api/expenses')
      if (response.ok) {
        const data = await response.json()

        // Ambil hanya 3 expense terbaru
        setRecentExpenses(data.slice(0, 3))

        // Proses data untuk chart - 7 hari terakhir
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        // Filter data 7 hari terakhir
        const recentData = data.filter((expense: Expense) =>
          new Date(expense.date) >= sevenDaysAgo
        )

        // Kelompokkan berdasarkan tanggal
        const groupedData: { [key: string]: number } = {}
        recentData.forEach((expense: Expense) => {
          const date = new Date(expense.date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short'
          })
          groupedData[date] = (groupedData[date] || 0) + expense.total_amount
        })

        // Buat array untuk chart
        const chartArray = Object.entries(groupedData)
          .map(([date, amount]) => ({
            date,
            amount: Math.round(amount / 1000), // Konversi ke ribuan untuk display yang lebih baik
          }))
          .sort((a, b) => {
            // Sort berdasarkan tanggal
            const dateA = new Date(a.date.split(' ').reverse().join(' '))
            const dateB = new Date(b.date.split(' ').reverse().join(' '))
            return dateA.getTime() - dateB.getTime()
          })

        setChartData(chartArray)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentExpenses()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{`Tanggal: ${label}`}</p>
          <p className="text-sm text-blue-600">
            {`Total: Rp ${(payload[0].value * 1000).toLocaleString('id-ID')}`}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <MainLayout>
      {/* Header with Add Invoice Button */}
      <div className="flex justify-between items-center mb-6">
        <div></div>
        <InvoiceSheet onInvoiceAdded={fetchRecentExpenses}>
          <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            <Plus className="h-4 w-4" />
            Tambah Invoice
          </button>
        </InvoiceSheet>
      </div>

      <div className="space-y-6">
        {/* Expense Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tren Pengeluaran 7 Hari Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-pulse">
                  <div className="h-48 w-full bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : chartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="date"
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fontSize: 12 }}
                      label={{
                        value: 'Jumlah (Ribuan Rp)',
                        angle: -90,
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fontSize: 12 }
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2, fill: '#ffffff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada data</h3>
                  <p className="text-gray-600">Grafik akan muncul ketika ada pengeluaran dalam 7 hari terakhir</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Pengeluaran Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentExpenses.length > 0 ? (
              <div className="space-y-4">
                {recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{expense.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {expense.category.name}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(expense.date)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {expense.division.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {expense.pic.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(expense.total_amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada pengeluaran</h3>
                <p className="text-gray-600">Pengeluaran terbaru akan muncul di sini</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </MainLayout>
  )
}
