import { MainLayout } from "@/components/layout/main-layout"
import { CategoryManagement } from "@/components/category-management"

export default function CategoriesPage() {
  return (
    <MainLayout>
      {/* Category Management */}
      <CategoryManagement />
    </MainLayout>
  )
}
