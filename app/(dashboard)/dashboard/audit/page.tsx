'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  ScrollText, Search, Filter, Clock, User, 
  Database, Activity, RefreshCw, ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/auth'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface AuditLog {
  id: string
  userId: string
  userName: string
  aksi: string
  tabel: string
  recordId: string | null
  dataLama: any | null
  dataBaru: any | null
  createdAt: string
}

import { useRouter } from 'next/navigation'

export default function AuditPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (user && user.role !== 'KAJUR') {
      toast.error('Akses ditolak: Hanya KAJUR yang dapat melihat log audit')
      router.push('/dashboard')
    }
  }, [user, router])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [tabelFilter, setTabelFilter] = useState('all')
  const [limit, setLimit] = useState('50')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (tabelFilter !== 'all') params.append('tabel', tabelFilter)
    params.append('limit', limit)
    
    try {
      const res = await fetch(`/api/audit?${params.toString()}`)
      if (res.ok) setLogs(await res.json())
    } catch (err) {
      toast.error('Gagal mengambil audit log')
    } finally {
      setLoading(false)
    }
  }, [tabelFilter, limit])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const getAksiColor = (aksi: string) => {
    if (aksi.startsWith('CREATE')) return 'text-green-400 bg-green-400/10 border-green-500/20'
    if (aksi.startsWith('UPDATE')) return 'text-blue-400 bg-blue-400/10 border-blue-500/20'
    if (aksi.startsWith('DELETE')) return 'text-red-400 bg-red-400/10 border-red-500/20'
    return 'text-slate-400 bg-slate-400/10 border-slate-500/20'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ScrollText className="text-teal-400" /> Audit Log
          </h1>
          <p className="text-slate-400 text-sm mt-1">Riwayat aktivitas sistem dan perubahan data</p>
        </motion.div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchLogs}
            className="glass border-slate-700 text-slate-400 hover:text-teal-400"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-4"
      >
        <Select value={tabelFilter} onValueChange={(value) => setTabelFilter(value ?? 'all')}>
          <SelectTrigger className="w-48 bg-slate-800/40 border-slate-700 text-white">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-slate-500" />
              <SelectValue placeholder="Semua Tabel" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white">
            <SelectItem value="all">Semua Tabel</SelectItem>
            <SelectItem value="Peralatan">Peralatan</SelectItem>
            <SelectItem value="Peminjaman">Peminjaman</SelectItem>
            <SelectItem value="LaporanKerusakan">Laporan</SelectItem>
            <SelectItem value="User">User</SelectItem>
          </SelectContent>
        </Select>

        <Select value={limit} onValueChange={(value) => setLimit(value ?? '50')}>
          <SelectTrigger className="w-32 bg-slate-800/40 border-slate-700 text-white">
            <SelectValue placeholder="Limit" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white">
            <SelectItem value="20">20 Data</SelectItem>
            <SelectItem value="50">50 Data</SelectItem>
            <SelectItem value="100">100 Data</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Log List */}
      <div className="space-y-3">
        {loading && logs.length === 0 ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-slate-800/50 rounded-xl" />
          ))
        ) : (
          logs.map((log, idx) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
            >
              <Collapsible className="glass-card overflow-hidden group">
                <CollapsibleTrigger className="w-full text-left p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${
                    log.aksi.startsWith('CREATE') ? 'bg-green-500' : 
                    log.aksi.startsWith('UPDATE') ? 'bg-blue-500' : 
                    log.aksi.startsWith('DELETE') ? 'bg-red-500' : 'bg-slate-500'
                  }`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getAksiColor(log.aksi)}`}>
                        {log.aksi.replace('_', ' ')}
                      </span>
                      <span className="text-slate-500 text-[10px] font-mono">{log.tabel}</span>
                    </div>
                    <p className="text-white text-sm mt-1 truncate">
                      <span className="text-teal-400 font-medium">{log.userName}</span> melakukan <span className="text-slate-300">{log.aksi.toLowerCase().replace('_', ' ')}</span> pada {log.tabel}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 text-right shrink-0">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                      <Clock size={10} />
                      {new Date(log.createdAt).toLocaleString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit', day:'numeric', month:'short' })}
                    </div>
                    <ChevronDown size={14} className="text-slate-600 group-data-[state=open]:rotate-180 transition-transform" />
                  </div>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-10 pb-4 pt-2 border-t border-slate-800/50 bg-slate-900/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      {log.dataLama && (
                        <div className="space-y-2">
                          <p className="text-red-400/70 uppercase text-[10px] font-bold tracking-widest flex items-center gap-1">
                            <Activity size={10} /> Data Lama
                          </p>
                          <pre className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-slate-400 overflow-x-auto max-h-40">
                            {JSON.stringify(log.dataLama, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.dataBaru && (
                        <div className="space-y-2">
                          <p className="text-green-400/70 uppercase text-[10px] font-bold tracking-widest flex items-center gap-1">
                            <Activity size={10} /> Data Baru
                          </p>
                          <pre className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-slate-300 overflow-x-auto max-h-40">
                            {JSON.stringify(log.dataBaru, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-[10px] text-slate-600">
                      <div className="flex items-center gap-1">
                        <User size={10} /> ID User: {log.userId}
                      </div>
                      <div className="flex items-center gap-1">
                        <Database size={10} /> ID Record: {log.recordId || '-'}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          ))
        )}
        
        {!loading && logs.length === 0 && (
          <div className="py-20 text-center glass-card">
            <ScrollText size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500">Belum ada catatan aktivitas</p>
          </div>
        )}
      </div>
    </div>
  )
}
