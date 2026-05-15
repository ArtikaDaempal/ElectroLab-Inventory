'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  History, Search, Filter, ArrowLeftRight, 
  Package, Calendar, Info, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import StatusBadge from '@/components/ui/StatusBadge'

interface Peminjaman {
  id: string
  jumlah: number
  tujuan: string
  tanggalPinjam: string
  tanggalKembali: string | null
  status: string
  catatan: string | null
  createdAt: string
  alat: {
    namaAlat: string
    kodeAlat: string
    fotoUrl: string | null
  } | null
}

export default function RiwayatPage() {
  const [data, setData] = useState<Peminjaman[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.append('my', 'true')
    if (statusFilter !== 'all') params.append('status', statusFilter)
    
    try {
      const res = await fetch(`/api/peminjaman?${params.toString()}`)
      if (res.ok) setData(await res.json())
    } catch (err) {
      toast.error('Gagal mengambil riwayat')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="text-teal-400" /> Riwayat Peminjaman
          </h1>
          <p className="text-slate-400 text-sm mt-1">Daftar semua permintaan dan peminjaman alat Anda</p>
        </motion.div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchData}
            className="glass border-slate-700 text-slate-400 hover:text-teal-400"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filter */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || 'all')}>
          <SelectTrigger className="w-48 bg-slate-800/40 border-slate-700 text-white">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-500" />
              <SelectValue placeholder="Filter Status" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white">
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="PENDING">Menunggu</SelectItem>
            <SelectItem value="DISETUJUI">Disetujui</SelectItem>
            <SelectItem value="DITOLAK">Ditolak</SelectItem>
            <SelectItem value="DIAMBIL">Dipinjam</SelectItem>
            <SelectItem value="DIKEMBALIKAN">Selesai</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* List */}
      <div className="space-y-4">
        {loading && data.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full bg-slate-800/50 rounded-2xl" />
          ))
        ) : (
          <AnimatePresence>
            {data.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-5 group hover:border-teal-500/30 transition-all border-l-4"
                style={{ 
                  borderLeftColor: 
                    item.status === 'PENDING' ? '#f59e0b' : 
                    item.status === 'DISETUJUI' ? '#22c55e' : 
                    item.status === 'DIAMBIL' ? '#3b82f6' : 
                    item.status === 'DIKEMBALIKAN' ? '#14b8a6' : '#ef4444' 
                }}
              >
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-teal-500 border border-slate-700 shrink-0 overflow-hidden">
                    {item.alat?.fotoUrl ? (
                      <img src={item.alat.fotoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package size={28} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-1">
                      <h3 className="text-white font-bold text-lg">{item.alat?.namaAlat || 'Alat Dihapus'}</h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-slate-500 text-xs font-mono mb-2">{item.alat?.kodeAlat || '-'}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <ArrowLeftRight size={14} className="text-teal-400" />
                        <span>{item.jumlah} Unit</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-teal-400" />
                        <span>{new Date(item.tanggalPinjam).toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Info size={14} className="text-teal-400" />
                        <span className="truncate max-w-[200px]">{item.tujuan}</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:text-right flex flex-col justify-center">
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Diajukan Pada</p>
                    <p className="text-slate-300 text-sm">{new Date(item.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}</p>
                    {item.catatan && (
                      <div className="mt-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-[10px] text-amber-400 max-w-[200px] ml-auto">
                        <p className="font-bold uppercase mb-0.5 text-[8px] text-slate-500">Catatan Admin:</p>
                        {item.catatan}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {!loading && data.length === 0 && (
          <div className="py-20 text-center glass-card">
            <History size={48} className="mx-auto text-slate-700 mb-4" />
            <h3 className="text-white font-medium">Belum ada riwayat</h3>
            <p className="text-slate-500 text-sm">Anda belum pernah meminjam alat laboratorium</p>
          </div>
        )}
      </div>
    </div>
  )
}
