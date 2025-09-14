import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { List, ArrowRight, Download, PieChart } from "lucide-react"
import Link from "next/link"

export default function ReportsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                List Pengeluaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Lihat daftar lengkap semua pengeluaran yang telah dicatat dengan detail lengkap.
              </p>
              <Link href="/reports/expenses">
                <Button className="w-full flex items-center justify-center gap-2">
                  Lihat List Pengeluaran
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Grafik Pengeluaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Visualisasi data pengeluaran dalam bentuk grafik dan chart interaktif.
              </p>
              <Link href="/reports/graphic">
                <Button className="w-full flex items-center justify-center gap-2">
                  Lihat Grafik
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Laporan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Export data laporan ke Excel atau cetak PDF untuk keperluan pelaporan.
              </p>
              <Link href="/reports/export">
                <Button className="w-full flex items-center justify-center gap-2">
                  Export Laporan
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
