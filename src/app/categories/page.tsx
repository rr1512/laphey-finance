import { DashboardLayout } from "@/components/dashboard-layout"
import { CategoryManagement } from "@/components/category-management"

export default function CategoriesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Manajemen Kategori & Sub Kategori
          </h1>
          <p className="text-purple-100">
            Kelola kategori dan sub kategori untuk tracking dan analisis pengeluaran yang lebih detail
          </p>
        </div>

        {/* Category Management */}
        <CategoryManagement />
      </div>
    </DashboardLayout>
  )
}