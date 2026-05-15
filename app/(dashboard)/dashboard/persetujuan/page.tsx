'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckSquare, ArrowLeftRight, AlertTriangle, 
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/auth'
import Link from 'next/link'

interface PendingData {
  peminjaman: any[]
  laporan: any[]
}

export default function PersetujuanPage() {
  const [data, setData] = useState<PendingData>({ peminjaman: [], laporan: [] })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'peminjaman' | 'laporan'>('peminjaman')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, lRes] = await Promise.all([
        fetch('/api/peminjaman?status=PENDING'),
        fetch('/api/laporan?status=DILAPOR')
      ])
      
      const peminjamanRaw = pRes.ok ? await pRes.json() : []
      const laporanRaw = lRes.ok ? await lRes.json() : []
      
      setData({
        peminjaman: Array.isArray(peminjamanRaw) ? peminjamanRaw : [],
        laporan: Array.isArray(laporanRaw) ? laporanRaw : []
      })
    } catch (err) {
      toast.error('Gagal mengambil data persetujuan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAction = async (type: string, id: string, action: any) => {
    try {
      let url = ''
      let body = action

      if (type === 'peminjaman') url = `/api/peminjaman/${id}`
      if (type === 'laporan') url = `/api/laporan/${id}`

      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        toast.success('Persetujuan berhasil diproses')
        fetchData()
      } else {
        const d = await res.json()
        throw new Error(d.error)
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const counts = {
    peminjaman: data.peminjaman.length,
    laporan: data.laporan.length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="text-blue-400" /> Pusat Persetujuan
          </h1>
          <p className="text-slate-400 text-sm mt-1">Kelola persetujuan peminjaman dan laporan kerusakan</p>
        </motion.div>
        
        <Button 
          variant="outline" 
          onClick={fetchData}
          className="glass border-slate-700 text-slate-400 hover:text-blue-400"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-800/40 rounded-2xl w-fit border border-slate-700/50">
        <button 
          onClick={() => setActiveTab('peminjaman')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'peminjaman' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
        >
          <ArrowLeftRight size={16} /> Pinjam {counts.peminjaman > 0 && <span className="bg-white/20 px-1.5 rounded-md text-[10px] ml-1">{counts.peminjaman}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('laporan')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'laporan' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'}`}
        >
          <AlertTriangle size={16} /> Laporan {counts.laporan > 0 && <span className="bg-white/20 px-1.5 rounded-md text-[10px] ml-1">{counts.laporan}</span>}
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full bg-slate-800/50 rounded-2xl" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {activeTab === 'peminjaman' && data.peminjaman.length === 0 && <EmptyState icon={<ArrowLeftRight size={48} />} label="Tidak ada peminjaman menunggu approval" />}
              {activeTab === 'peminjaman' && data.peminjaman.map((p) => (
                <div key={p.id} className="glass-card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <ArrowLeftRight size={20} />
                    </div>
                    <div>
                      <p className="text-white font-bold">{p.peminjam?.nama} <span className="text-slate-500 font-normal">pinjam</span> {p.alat?.namaAlat}</p>
                      <p className="text-slate-500 text-xs">Jumlah: <span className="text-indigo-400">{p.jumlah}</span> • Tujuan: {p.tujuan}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8 border-slate-700 text-slate-400" onClick={() => handleAction('peminjaman', p.id, { status: 'DITOLAK' })}>Tolak</Button>
                    <Button size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700" onClick={() => handleAction('peminjaman', p.id, { status: 'DISETUJUI' })}>Setujui</Button>
                  </div>
                </div>
              ))}

              {activeTab === 'laporan' && data.laporan.length === 0 && <EmptyState icon={<AlertTriangle size={48} />} label="Tidak ada laporan kerusakan baru" />}
              {activeTab === 'laporan' && data.laporan.map((l) => (
                <div key={l.id} className="glass-card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/30">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <p className="text-white font-bold">{l.alat?.namaAlat}</p>
                      <p className="text-slate-400 text-xs line-clamp-1">Kerusakan: {l.deskripsi}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/dashboard/laporan">
                      <Button size="sm" variant="outline" className="h-8 border-slate-700 text-slate-400">Detail</Button>
                    </Link>
                    <Button size="sm" className="h-8 bg-amber-600 hover:bg-amber-700" onClick={() => handleAction('laporan', l.id, { status: 'DIPROSES' })}>Proses</Button>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

function EmptyState({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="py-20 text-center glass-card">
      <div className="inline-flex items-center justify-center mb-4 text-slate-700">
        {icon}
      </div>
      <p className="text-slate-500 text-sm">{label}</p>
    </div>
  )
}
