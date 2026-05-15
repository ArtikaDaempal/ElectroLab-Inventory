'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell, BellRing, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: string
  message: string
  createdAt: string
  data?: any
}

function parseUTC(dateStr: string): Date {
  // Supabase sometimes returns timestamps without Z suffix — force UTC parsing
  if (!dateStr) return new Date()
  const s = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
  return new Date(s)
}

function formatTime(dateStr: string): string {
  const date = parseUTC(dateStr)
  const diff = Date.now() - date.getTime()
  if (diff < 0) return 'baru saja'
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  if (hours < 48) return 'kemarin'
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

const typeIcon: Record<string, string> = {
  approval: '👤',
  laporan: '⚠️',
  peminjaman: '📦',
}

const typeLink: Record<string, string> = {
  approval: '/dashboard/users',
  laporan: '/dashboard/laporan',
  peminjaman: '/dashboard/peminjaman',
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) setNotifs(await res.json())
    } catch {}
  }

  const [readIds, setReadIds] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('read_notifications')
    if (saved) setReadIds(JSON.parse(saved))
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [])

  const markAsRead = (id: string) => {
    const newReadIds = [...new Set([...readIds, id])]
    setReadIds(newReadIds)
    localStorage.setItem('read_notifications', JSON.stringify(newReadIds))
  }

  const markAllAsRead = () => {
    const allIds = notifs.map(n => n.id)
    const newReadIds = [...new Set([...readIds, ...allIds])]
    setReadIds(newReadIds)
    localStorage.setItem('read_notifications', JSON.stringify(newReadIds))
  }

  const unreadNotifs = notifs.filter(n => !readIds.includes(n.id))

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
      >
        {unreadNotifs.length > 0 ? <BellRing size={20} className="text-teal-400" /> : <Bell size={20} />}
        {unreadNotifs.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold animate-pulse"
            style={{ background: '#ef4444', color: 'white' }}>
            {unreadNotifs.length > 9 ? '9+' : unreadNotifs.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ background: '#0f172a', border: '1px solid rgba(20,184,166,0.4)', boxShadow: '0 30px 60px rgba(0,0,0,0.9)' }}>
          <div className="p-4 border-b flex items-center justify-between bg-slate-900/50" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-white font-bold text-sm">Notifikasi</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Aktivitas Terbaru</p>
            </div>
            {unreadNotifs.length > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[9px] text-teal-400 hover:text-teal-300 font-bold uppercase transition-colors"
              >
                Tandai Dibaca
              </button>
            )}
          </div>

          {notifs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <Bell size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-xs">Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifs.map((n: any) => {
                const isRead = readIds.includes(n.id)
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      markAsRead(n.id)
                      setOpen(false)
                      router.push('/dashboard/notifikasi')
                    }}
                    className={`px-4 py-4 hover:bg-slate-800/80 transition-all border-b cursor-pointer group relative ${!isRead ? 'bg-teal-500/5' : ''}`}
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                  >
                    {!isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500" />
                    )}
                    <div className="flex gap-3 items-start">
                      <div className="shrink-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all ${
                          !isRead 
                            ? n.title.includes('Disetujui') || n.title.includes('Kembali') || n.title.includes('Selesai')
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : n.title.includes('Kerusakan') || n.title.includes('Ditolak')
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                            : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}>
                          <Bell size={18} className={!isRead ? 'animate-bounce-slow' : ''} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[11px] font-bold uppercase tracking-tight transition-colors ${!isRead ? 'text-white' : 'text-slate-400'}`}>
                          {n.title}
                        </p>
                        <p className={`text-[10px] mt-0.5 line-clamp-1 ${!isRead ? 'text-slate-300' : 'text-slate-500'}`}>
                          {n.message}
                        </p>
                        <p className="text-slate-500 text-[9px] mt-1.5 flex items-center gap-1 font-mono">
                          <Clock size={8} />{formatTime(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="p-3 bg-slate-900/80 text-center border-t flex justify-between items-center" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <button 
              onClick={() => router.push('/dashboard/notifikasi')}
              className="text-[9px] text-teal-500 hover:text-teal-400 font-bold uppercase"
            >
              Lihat Semua
            </button>
            <button 
              onClick={() => setOpen(false)} 
              className="text-[9px] text-slate-500 hover:text-slate-300 uppercase font-bold tracking-tighter"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
