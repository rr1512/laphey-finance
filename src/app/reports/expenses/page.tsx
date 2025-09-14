"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ExpenseList } from "@/components/expense-list"
import { ExpenseSheet } from "@/components/expense-sheet"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ExpensesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/reports">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Laporan
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">List Pengeluaran</h1>
              <p className="text-gray-600">Daftar semua pengeluaran yang telah dicatat</p>
            </div>
          </div>
          
          {/* Add Expense Button */}
          <ExpenseSheet onExpenseAdded={handleExpenseAdded}>
            <Button size="lg" className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Tambah Pengeluaran
            </Button>
          </ExpenseSheet>
        </div>

        {/* Expense List */}
        <ExpenseList refreshTrigger={refreshTrigger} onExpenseAdded={handleExpenseAdded} />
      </div>
    </DashboardLayout>
  )
}