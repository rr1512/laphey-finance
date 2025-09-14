import { MainLayout } from "@/components/layout/main-layout"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  )
}