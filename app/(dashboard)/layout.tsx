'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAuthStore } from '@/store/auth'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!user) router.push('/login')
  }, [user, router])

  useEffect(() => {
    const fetchPending = () => {
      if (user?.role === 'KEPALA_LAB' || user?.role === 'KAJUR') {
        fetch('/api/stats')
          .then(r => r.json())
          .then(d => {
            const count = (d.pendingUsers || 0) + (d.pendingLaporan || 0) + (d.pendingPeminjaman || 0)
            setPendingCount(count)
          })
          .catch(() => {})
      }
    }
    fetchPending()
    const interval = setInterval(fetchPending, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [user])

  if (!mounted || !user) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400" />
    </div>
  )

  const isFullPage = pathname === '/dashboard/pengembang'

  if (isFullPage) {
    return (
      <div className="min-h-screen w-full overflow-y-auto p-4 md:p-8 flex flex-col justify-between">
        <div className="flex-1 w-full max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-72 flex-shrink-0 flex-col">
        <Sidebar pendingCount={pendingCount} />
      </div>

      {/* Mobile sidebar via Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 border-0" style={{ background: 'transparent' }}>
          <Sidebar pendingCount={pendingCount} onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col justify-between">
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
