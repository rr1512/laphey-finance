"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Building2, Receipt, BarChart3, Tags, List, ChevronDown, ChevronRight, PieChart, Shield, Users, Download } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"

interface SidebarProps {
  className?: string
}

// Base navigation items
const baseNavigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
    description: "Kelola pengeluaran"
  },
  {
    name: "Divisi",
    href: "/divisions",
    icon: Building2,
    description: "Manajemen divisi"
  },
  {
    name: "Kategori",
    href: "/categories",
    icon: Tags,
    description: "Kategori & sub kategori"
  },
  {
    name: "Laporan",
    href: "/reports",
    icon: BarChart3,
    description: "Laporan keuangan",
    hasSubmenu: true,
    submenu: [
      {
        name: "List Pengeluaran",
        href: "/reports/expenses",
        icon: List,
        description: "Daftar pengeluaran"
      },
      {
        name: "Grafik Pengeluaran",
        href: "/reports/graphic",
        icon: PieChart,
        description: "Visualisasi grafik"
      },
      {
        name: "Export Laporan",
        href: "/reports/export",
        icon: Download,
        description: "Export & cetak laporan"
      }
    ]
  }
]

// Admin menu item
const adminMenu = {
  name: "Admin",
  href: "/admin",
  icon: Shield,
  description: "Panel administrasi",
  hasSubmenu: true,
  submenu: [
    {
      name: "Manajemen User",
      href: "/admin/users",
      icon: Users,
      description: "Kelola user & role"
    }
  ]
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  // Build navigation array with conditional admin menu
  const navigation = [
    ...baseNavigation,
    ...(user?.role === 'superadmin' ? [adminMenu] : [])
  ]

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuName)
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    )
  }

  const isSubmenuActive = (submenu: any[]) => {
    return submenu.some(subItem => pathname === subItem.href)
  }

  return (
    <div className={cn("flex h-full w-64 flex-col bg-white border-r", className)}>
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <Receipt className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Finance App
            </h1>
            <p className="text-xs text-gray-500">Pencatat Keuangan</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const isSubmenuExpanded = expandedMenus.includes(item.name)
          const hasActiveSubmenu = item.hasSubmenu && isSubmenuActive(item.submenu || [])
          const Icon = item.icon
          
          return (
            <div key={item.name} className="space-y-1">
              {/* Main Menu Item */}
              {item.hasSubmenu ? (
                <button
                  className={cn(
                    "w-full h-12 px-3 py-2 rounded-md text-left transition-colors",
                    "flex items-center gap-3",
                    isActive || hasActiveSubmenu
                      ? "bg-blue-600 text-white hover:bg-blue-700" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={() => toggleSubmenu(item.name)}
                >
                  <Icon className="h-5 w-5" />
                  <div className="flex flex-col items-start flex-1">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className={cn(
                      "text-xs",
                      isActive || hasActiveSubmenu ? "text-blue-100" : "text-gray-500"
                    )}>
                      {item.description}
                    </span>
                  </div>
                  {isSubmenuExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <Link 
                  href={item.href} 
                  className={cn(
                    "w-full h-12 px-3 py-2 rounded-md text-left transition-colors block",
                    "flex items-center gap-3",
                    isActive
                      ? "bg-blue-600 text-white hover:bg-blue-700" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <div className="flex flex-col items-start flex-1">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className={cn(
                      "text-xs",
                      isActive ? "text-blue-100" : "text-gray-500"
                    )}>
                      {item.description}
                    </span>
                  </div>
                </Link>
              )}

              {/* Submenu */}
              {item.hasSubmenu && isSubmenuExpanded && (
                <div className="ml-6 space-y-1">
                  {item.submenu?.map((subItem) => {
                    const isSubActive = pathname === subItem.href
                    const SubIcon = subItem.icon
                    
                    return (
                      <Link 
                        key={subItem.name}
                        href={subItem.href} 
                        className={cn(
                          "w-full h-10 px-3 py-2 rounded-md text-left transition-colors block",
                          "flex items-center gap-3",
                          isSubActive 
                            ? "bg-blue-600 text-white hover:bg-blue-700" 
                            : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        <SubIcon className="h-4 w-4" />
                        <div className="flex flex-col items-start flex-1">
                          <span className="text-sm font-medium">{subItem.name}</span>
                          <span className={cn(
                            "text-xs",
                            isSubActive ? "text-blue-100" : "text-gray-500"
                          )}>
                            {subItem.description}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="text-xs text-gray-500 text-center">
          <p>© 2024 Finance App</p>
          <p>Versi 1.0</p>
        </div>
      </div>
    </div>
  )
}