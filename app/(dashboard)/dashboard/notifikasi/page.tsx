'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Clock, Info, User, ArrowLeftRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function NotifikasiPage() {
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        setNotifs(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
          <Bell size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Notifikasi Sistem</h1>
          <p className="text-slate-400 text-sm">Aktivitas dan pemberitahuan terbaru untuk Anda.</p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full bg-slate-800/50 rounded-2xl" />
          ))
        ) : notifs.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Bell size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500">Tidak ada notifikasi saat ini.</p>
          </div>
        ) : (
          notifs.map((n, idx) => (
            <motion.div 
              key={n.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-card p-5 flex items-start gap-4 group hover:border-teal-500/30 transition-all cursor-default relative overflow-hidden"
            >
              <div className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border",
                n.title.includes('Disetujui') || n.title.includes('Kembali') || n.title.includes('Selesai') 
                  ? "bg-green-500/10 text-green-400 border-green-500/20" :
                n.title.includes('Kerusakan') || n.title.includes('Ditolak')
                  ? "bg-red-500/10 text-red-400 border-red-500/20" :
                n.title.includes('User')
                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                "bg-teal-500/10 text-teal-400 border-teal-500/20"
              )}>
                {n.title.includes('Peminjaman') ? <ArrowLeftRight size={22} /> :
                 n.title.includes('Laporan') ? <Info size={22} /> :
                 <Bell size={22} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-white font-bold text-sm group-hover:text-teal-400 transition-colors uppercase tracking-tight">{n.title}</h3>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                    <Clock size={10} /> {new Date(n.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short' })} {new Date(n.createdAt).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' })}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{n.message}</p>
                
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/50">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800/50 text-[9px] font-bold text-slate-500 uppercase tracking-widest border border-slate-700/50">
                    LAB ELEKTRO
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-[9px] text-slate-600 font-mono">
                    {n.aksi || 'SYSTEM'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
