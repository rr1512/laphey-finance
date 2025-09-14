"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { ExpenseList } from "@/components/expense-list"
import { InvoiceSheet } from "@/components/expense-sheet"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function ExpensesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleInvoiceAdded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">List Invoice</h1>
            <p className="text-gray-600">Daftar semua invoice yang telah dibuat</p>
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
    </MainLayout>
  )
}
