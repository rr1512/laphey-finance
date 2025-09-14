import { DashboardLayout } from "@/components/dashboard-layout"
import { DivisionManagement } from "@/components/division-management"

export default function DivisionsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Manajemen Divisi
          </h1>
          <p className="text-green-100">
            Kelola divisi perusahaan untuk kategorisasi pengeluaran
          </p>
        </div>

        {/* Division Management */}
        <DivisionManagement />
      </div>
    </DashboardLayout>
  )
}