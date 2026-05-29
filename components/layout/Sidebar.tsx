'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, AlertTriangle, ArrowLeftRight,
  Users, ScrollText, Download, User, BookOpen, ClipboardList,
  History, CheckSquare, X, FlaskConical, Settings
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
  roles: string[]
}

interface SidebarProps {
  pendingCount?: number
  onClose?: () => void
}

export default function Sidebar({ pendingCount = 0, onClose }: SidebarProps) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const [labName, setLabName] = useState<string>('')

  useEffect(() => {
    if (user?.labId) {
      fetch('/api/labs')
        .then(res => res.json())
        .then((data: any[]) => {
          if (Array.isArray(data)) {
            const lab = data.find(l => l.id === user.labId)
            if (lab) setLabName(lab.nama)
          }
        })
        .catch(() => {})
    }
  }, [user?.labId])

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: ['KEPALA_LAB', 'DOSEN', 'MAHASISWA', 'KAJUR'] },
    { href: '/dashboard/persetujuan', label: 'Persetujuan', icon: <CheckSquare size={18} />, badge: pendingCount, roles: ['KEPALA_LAB', 'KAJUR'] },
    { href: '/dashboard/peralatan', label: 'Peralatan', icon: <Package size={18} />, roles: ['KEPALA_LAB', 'KAJUR'] },
    { href: '/dashboard/opname', label: 'Stock Opname', icon: <CheckSquare size={18} />, roles: ['KEPALA_LAB'] },
    { href: '/dashboard/katalog', label: 'Katalog Alat', icon: <BookOpen size={18} />, roles: ['MAHASISWA', 'DOSEN', 'KAJUR'] },
    { href: '/dashboard/laporan', label: 'Laporan Kerusakan', icon: <AlertTriangle size={18} />, roles: ['KEPALA_LAB', 'DOSEN', 'MAHASISWA', 'KAJUR'] },
    { href: '/dashboard/peminjaman', label: 'Manajemen Peminjaman', icon: <ArrowLeftRight size={18} />, roles: ['KEPALA_LAB', 'KAJUR'] },
    { href: '/dashboard/pinjam', label: 'Pinjam Alat', icon: <ClipboardList size={18} />, roles: ['MAHASISWA', 'DOSEN'] },
    { href: '/dashboard/riwayat', label: 'Riwayat Pinjam', icon: <History size={18} />, roles: ['MAHASISWA', 'DOSEN'] },
    { href: '/dashboard/users', label: 'User Management', icon: <Users size={18} />, roles: ['KAJUR'] }, // Hanya KAJUR
    { href: '/dashboard/laboratorium', label: 'Manajemen Lab', icon: <FlaskConical size={18} />, roles: ['KAJUR'] },
    { href: '/dashboard/audit', label: 'Audit Log', icon: <ScrollText size={18} />, roles: ['KAJUR'] }, // Audit juga ke KAJUR saja
    { href: '/dashboard/export', label: 'Export Data', icon: <Download size={18} />, roles: ['KEPALA_LAB', 'KAJUR'] },
    { href: '/dashboard/profil', label: 'Profil', icon: <User size={18} />, roles: ['KEPALA_LAB', 'DOSEN', 'MAHASISWA', 'KAJUR'] },
  ]

  const filtered = navItems.filter((item) => user?.role && item.roles.includes(user.role))

  return (
    <aside className="flex flex-col h-full" style={{ width: '100%', background: 'rgba(15,23,42,0.95)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Logo */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 glow-blue-sm overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <img src="/logo.png" alt="Logo Poli" className="w-full h-full object-contain p-0.5" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Lab Elektro</p>
            <p className="text-blue-400 text-xs">Inventaris</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="mx-4 mb-4 p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <p className="text-white text-sm font-medium truncate">{user?.nama}</p>
        <p className="text-blue-400 text-xs mt-0.5 flex flex-col gap-0.5">
          <span>{user?.role?.replace('_', ' ')}</span>
          {(user?.role === 'KEPALA_LAB' || user?.role === 'DOSEN' || user?.role === 'MAHASISWA') && labName && (
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{labName}</span>
          )}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {filtered.map((item) => {
          const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn('sidebar-item', isActive && 'active')}
            >
              <span className={isActive ? 'text-blue-400' : 'text-slate-500'}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <Badge className="text-xs px-1.5 py-0.5 min-w-[20px] flex items-center justify-center"
                  style={{ background: '#ef4444', color: 'white', border: 'none' }}>
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-slate-500 text-[10px] text-center leading-normal max-w-[240px] mx-auto">
          © 2026 Sistem Inventaris Lab Elektro. Politeknik Negeri Manado. All Rights Reserved
        </p>
      </div>
    </aside>
  )
}
