'use client'
import { Menu, LogOut, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import NotificationBell from './NotificationBell'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Link from 'next/link'

interface NavbarProps {
  onMenuClick: () => void
}

const roleLabel: Record<string, string> = {
  KEPALA_LAB: 'Kepala Lab',
  DOSEN: 'Dosen',
  MAHASISWA: 'Mahasiswa',
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuthStore()
  const initials = user?.nama?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-[100]"
      style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Mobile hamburger */}
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
        <Menu size={20} />
      </button>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger render={
            <button className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-700/50 transition-all cursor-pointer outline-none border-none bg-transparent">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.fotoUrl || ''} />
                <AvatarFallback className="text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-white text-xs font-medium leading-tight">{user?.nama}</p>
                <p className="text-blue-400 text-[10px]">{roleLabel[user?.role || ''] || user?.role}</p>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden md:block" />
            </button>
          }/>
          <DropdownMenuContent align="end" className="w-48" style={{ background: '#1e293b', border: '1px solid rgba(59,130,246,0.2)' }}>
            <DropdownMenuItem render={<Link href="/dashboard/profil">Profil Saya</Link>} className="text-slate-300 focus:text-white focus:bg-slate-700/50 cursor-pointer" />
            <DropdownMenuSeparator className="bg-slate-700/50" />
            <DropdownMenuItem onClick={logout} className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer">
              <LogOut size={14} className="mr-2" />Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
