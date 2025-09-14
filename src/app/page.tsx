"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ExpenseSheet } from "@/components/expense-sheet"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, Receipt, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Selamat Datang di Finance App
              </h1>
              <p className="text-blue-100">
                Kelola pengeluaran perusahaan dengan mudah dan terorganisir
              </p>
            </div>
            
            {/* Add Expense Button */}
            <ExpenseSheet onExpenseAdded={handleExpenseAdded}>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
                <Plus className="h-5 w-5 mr-2" />
                Tambah Pengeluaran
              </Button>
            </ExpenseSheet>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pengeluaran</p>
                  <p className="text-2xl font-bold text-gray-900">Rp 0</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transaksi</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Divisi Aktif</p>
                  <p className="text-2xl font-bold text-gray-900">5</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}