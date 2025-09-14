"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { MobileSidebar } from "./mobile-sidebar"

interface MainLayoutProps {
  children: React.ReactNode
}

// Page titles mapping
const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/divisions": "Manajemen Divisi",
  "/categories": "Manajemen Kategori",
  "/reports": "Laporan Keuangan",
  "/reports/graphic": "Grafik Pengeluaran"
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  
  const pageTitle = pageTitles[pathname] || "Dashboard"

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