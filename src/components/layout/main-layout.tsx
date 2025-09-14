"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { MobileSidebar } from "./mobile-sidebar"
import { GlobalLoading } from "@/components/global-loading"
import { useAuth } from "@/lib/auth-context"

interface MainLayoutProps {
  children: React.ReactNode
}

// Page titles mapping
const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/settings": "Pengaturan Profile",
  "/divisions": "Manajemen Divisi",
  "/categories": "Manajemen Kategori",
  "/reports": "Laporan Keuangan",
  "/reports/expenses": "Daftar Invoice",
  "/reports/graphic": "Grafik Pengeluaran",
  "/admin/users": "Manajemen User"
}

// Pages that require superadmin role
const superAdminPages = [
  "/admin",
  "/admin/users"
]

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user, isLoading } = useAuth()

  const pageTitle = pageTitles[pathname] || "Dashboard"
  const requiresSuperAdmin = superAdminPages.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // Show loading while checking authentication
  if (isLoading) {
    return <GlobalLoading />
  }

  // Check authentication
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return <GlobalLoading />
  }

  // Check superadmin access
  if (requiresSuperAdmin && user?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Akses Ditolak</h1>
          <p className="text-gray-600">Hanya Super Admin yang dapat mengakses halaman ini</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={pageTitle}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="px-6 py-6 pb-[100px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
