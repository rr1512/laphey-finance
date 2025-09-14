"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ExpenseList } from "@/components/expense-list"
import { InvoiceSheet } from "@/components/invoice-sheet"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ExpensesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleInvoiceAdded = () => {
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
              <h1 className="text-2xl font-bold text-gray-900">List Invoice</h1>
              <p className="text-gray-600">Daftar semua invoice yang telah dibuat</p>
            </div>
          </div>
          
          {/* Add Invoice Button */}
          <InvoiceSheet onInvoiceAdded={handleInvoiceAdded}>
            <Button size="lg" className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Buat Invoice
            </Button>
          </InvoiceSheet>
        </div>

        {/* Invoice List */}
        <ExpenseList refreshTrigger={refreshTrigger} onExpenseAdded={handleInvoiceAdded} />
      </div>
    </DashboardLayout>
  )
}