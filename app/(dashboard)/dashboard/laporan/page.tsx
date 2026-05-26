'use client'
import { useState, useEffect, useCallback } from 'react'

function parseUTC(dateStr: string): Date {
  if (!dateStr) return new Date()
  const s = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
  return new Date(s)
}
import { motion } from 'framer-motion'
import {
  AlertTriangle, Plus, CheckCircle, Clock, Wrench, X,
  Trash2, RefreshCw, ImageOff, User, Tag, FileText, CalendarDays
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/store/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface Laporan {
  id: string
  alatId: string
  deskripsi: string
  status: string
  fotoUrl: string | null
  createdAt: string
  labId: string
  alat: { namaAlat: string; kodeAlat: string }
  pelapor?: { nama: string; email: string }
  diproses?: { nama: string }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  DILAPOR:  { label: 'Dilaporkan',       color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-500/30',  icon: AlertTriangle },
  DIPROSES: { label: 'Sedang Diproses',  color: 'text-indigo-400',  bg: 'bg-indigo-400/10',  border: 'border-indigo-500/30', icon: Wrench },
  SELESAI:  { label: 'Selesai',          color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-500/30',icon: CheckCircle },
  DITOLAK:  { label: 'Ditolak',          color: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-500/30',    icon: X },
}

const LEFT_BORDER_COLOR: Record<string, string> = {
  DILAPOR: '#f59e0b', DIPROSES: '#6366f1', SELESAI: '#10b981', DITOLAK: '#ef4444',
}

export default function LaporanPage() {
  const user = useAuthStore((s) => s.user)
  const [data, setData] = useState<Laporan[]>([])
  const [peralatan, setPeralatan] = useState<any[]>([])
  const [labs, setLabs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  // Detail modal
  const [detailItem, setDetailItem] = useState<Laporan | null>(null)
  const [updateStatus, setUpdateStatus] = useState('')
  const [saving, setSaving] = useState(false)

  // Add form
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ labId: '', alatId: '', deskripsi: '', fotoUrl: '' })
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const isAdmin = ['KEPALA_LAB', 'KAJUR'].includes(user?.role || '')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      const res = await fetch(`/api/laporan${params}`)
      const result = await res.json()
      if (res.ok) setData(Array.isArray(result) ? result : [])
      else toast.error(result.error || 'Gagal mengambil data laporan')
    } catch {
      toast.error('Koneksi gagal')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    fetch('/api/labs').then(r => r.json()).then(d => setLabs(Array.isArray(d) ? d : []))
  }, [])

  const fetchPeralatan = async (labId: string) => {
    if (!labId) return
    const res = await fetch(`/api/peralatan?labId=${labId}`)
    const d = await res.json()
    setPeralatan(Array.isArray(d) ? d : [])
  }

  const handleLabChange = (id: string) => {
    setForm({ ...form, labId: id, alatId: '' })
    fetchPeralatan(id)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!form.alatId || !form.deskripsi) { toast.error('Lengkapi data'); return }
    setSaving(true)
    let finalFotoUrl = form.fotoUrl
    if (selectedFile) {
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', selectedFile)
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const upData = await upRes.json()
        if (!upRes.ok) throw new Error(upData.error || 'Upload gagal')
        finalFotoUrl = upData.url
      } catch (err: any) {
        toast.error('Gagal mengupload foto: ' + err.message)
        setSaving(false); setUploading(false); return
      }
    }
    try {
      const res = await fetch('/api/laporan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fotoUrl: finalFotoUrl }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Gagal mengirim laporan')
      toast.success('Laporan berhasil dikirim')
      setShowAdd(false)
      setForm({ labId: '', alatId: '', deskripsi: '', fotoUrl: '' })
      setSelectedFile(null); setPreview(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false); setUploading(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!detailItem || !updateStatus) { toast.error('Pilih status'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/laporan/${detailItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: updateStatus }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Gagal update status')
      toast.success(`Status diperbarui ke "${STATUS_CONFIG[updateStatus]?.label}"`)
      setDetailItem({ ...detailItem, status: updateStatus })
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const openDetail = (item: Laporan) => {
    setDetailItem(item)
    setUpdateStatus(item.status)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-amber-500" /> Pelaporan Kerusakan
          </h1>
          <p className="text-slate-400 text-sm mt-1">Kelola dan pantau kondisi peralatan laboratorium</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || 'all')}>
            <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-700 text-white">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="DILAPOR">Dilaporkan</SelectItem>
              <SelectItem value="DIPROSES">Diproses</SelectItem>
              <SelectItem value="SELESAI">Selesai</SelectItem>
              <SelectItem value="DITOLAK">Ditolak</SelectItem>
            </SelectContent>
          </Select>
          {(user?.role === 'MAHASISWA' || user?.role === 'DOSEN') && (
            <Button onClick={() => setShowAdd(true)} className="bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/20">
              <Plus size={16} className="mr-2" /> Buat Laporan
            </Button>
          )}
        </div>
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && data.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-slate-800/40 animate-pulse" />)
        ) : data.length === 0 ? (
          <div className="col-span-full py-20 text-center glass-card">
            <AlertTriangle className="mx-auto text-slate-600 mb-2" size={40} />
            <p className="text-slate-500">Tidak ada laporan yang ditemukan</p>
          </div>
        ) : data.map((item) => {
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.DILAPOR
          const Icon = cfg.icon
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => openDetail(item)}
              className="glass-card overflow-hidden group hover:border-amber-500/30 transition-all border-l-4 cursor-pointer hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5"
              style={{ borderLeftColor: LEFT_BORDER_COLOR[item.status] || '#f59e0b' }}
            >
              {item.fotoUrl ? (
                <div className="h-40 w-full overflow-hidden border-b border-slate-800 relative">
                  <img src={item.fotoUrl} alt="Foto Kerusakan" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 right-2">
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                      <Icon size={9} /> {cfg.label}
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-white font-bold text-base line-clamp-1">{item.alat?.namaAlat}</h3>
                    <p className="text-slate-500 text-xs font-mono mt-0.5">{item.alat?.kodeAlat}</p>
                  </div>
                  {!item.fotoUrl && (
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                      <Icon size={9} /> {cfg.label}
                    </span>
                  )}
                </div>
                <p className="text-slate-300 text-sm line-clamp-2 italic leading-relaxed">"{item.deskripsi}"</p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                    <Clock size={11} />
                    {parseUTC(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <span className="text-[10px] text-blue-400 font-medium">Klik untuk detail →</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ===== MODAL DETAIL LAPORAN ===== */}
      {detailItem && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setDetailItem(null) }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#0f172a', border: '1px solid rgba(59,130,246,0.25)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" />
                <span className="text-white font-semibold text-sm">Detail Laporan Kerusakan</span>
              </div>
              <button onClick={() => setDetailItem(null)} className="text-slate-500 hover:text-white transition-colors p-1">
                <X size={18} />
              </button>
            </div>

            {/* Foto */}
            <div className="w-full h-52 bg-slate-900 relative overflow-hidden">
              {detailItem.fotoUrl ? (
                <img src={detailItem.fotoUrl} alt="Foto kerusakan" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                  <ImageOff size={36} className="mb-2" />
                  <span className="text-xs">Tidak ada foto</span>
                </div>
              )}
              {/* Status overlay */}
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-slate-900/90 to-transparent" />
              <div className="absolute bottom-3 left-4">
                {(() => {
                  const cfg = STATUS_CONFIG[detailItem.status] || STATUS_CONFIG.DILAPOR
                  const Icon = cfg.icon
                  return (
                    <span className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                      <Icon size={11} /> {cfg.label}
                    </span>
                  )
                })()}
              </div>
            </div>

            {/* Detail info */}
            <div className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Tag size={13} className="text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Alat</p>
                    <p className="text-white text-sm font-bold">{detailItem.alat?.namaAlat || '-'}</p>
                    <p className="text-slate-400 text-[10px] font-mono">{detailItem.alat?.kodeAlat || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User size={13} className="text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Pelapor</p>
                    <p className="text-slate-200 text-sm">{detailItem.pelapor?.nama || '-'}</p>
                    <p className="text-slate-500 text-[10px]">{detailItem.pelapor?.email || ''}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CalendarDays size={13} className="text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Dilaporkan Pada</p>
                  <p className="text-slate-200 text-sm">
                    {parseUTC(detailItem.createdAt).toLocaleString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <FileText size={13} className="text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Deskripsi Kerusakan</p>
                  <p className="text-slate-200 text-sm leading-relaxed bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                    {detailItem.deskripsi || '-'}
                  </p>
                </div>
              </div>

              {/* Update Status — hanya admin */}
              {isAdmin && detailItem.status !== 'SELESAI' && (
                <div className="pt-1">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Update Status</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                      const Icon = cfg.icon
                      const active = updateStatus === key
                      return (
                        <button
                          key={key}
                          onClick={() => setUpdateStatus(key)}
                          className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                            active ? `${cfg.color} ${cfg.bg} ${cfg.border}` : 'text-slate-500 bg-slate-800/50 border-slate-700/50 hover:border-slate-500'
                          }`}
                        >
                          <Icon size={13} />
                          {cfg.label.split(' ')[0]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => setDetailItem(null)}
                className="flex-1 py-2.5 rounded-xl text-sm text-slate-400 border border-slate-700 hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
              {isAdmin && detailItem.status !== 'SELESAI' && (
                <button
                  onClick={handleUpdateStatus}
                  disabled={saving || updateStatus === detailItem.status}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                >
                  {saving ? <><RefreshCw size={14} className="animate-spin" /> Menyimpan...</> : 'Simpan Status'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ===== DIALOG TAMBAH LAPORAN ===== */}
      <Dialog open={showAdd} onOpenChange={(o) => { setShowAdd(o); if (!o) { setPreview(null); setSelectedFile(null) } }}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={20} /> Buat Laporan Kerusakan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Laboratorium*</Label>
                <Select value={form.labId} onValueChange={(v) => handleLabChange(v || '')}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 h-10">
                    <SelectValue placeholder="Pilih lab">
                      {labs.find(l => l.id === form.labId)?.nama || 'Pilih lab'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="w-max min-w-[var(--radix-select-trigger-width)] max-w-[420px] bg-slate-800 border-slate-700 text-white">
                    {labs.map((l) => <SelectItem key={l.id} value={l.id}>{l.nama}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pilih Alat*</Label>
                <Select value={form.alatId} onValueChange={(v) => setForm({ ...form, alatId: v || '' })} disabled={!form.labId}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 h-10">
                    <SelectValue placeholder="Pilih alat">
                      {peralatan.find(p => p.id === form.alatId)?.namaAlat || 'Pilih alat'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {peralatan.map((p) => <SelectItem key={p.id} value={p.id}>{p.namaAlat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.alatId && (
              <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/20 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase text-teal-500/60 font-bold">Alat Terpilih</p>
                  <p className="text-white text-sm font-bold">{peralatan.find(p => p.id === form.alatId)?.namaAlat}</p>
                  <p className="text-slate-400 text-[10px] font-mono">{peralatan.find(p => p.id === form.alatId)?.kodeAlat}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-teal-500/60 font-bold">Kategori</p>
                  <p className="text-teal-400 text-[11px] font-bold">{peralatan.find(p => p.id === form.alatId)?.kategori}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Foto Kerusakan</Label>
              <div className="relative group">
                {preview ? (
                  <div className="relative h-40 w-full rounded-xl overflow-hidden border border-slate-700">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setPreview(null); setSelectedFile(null) }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:bg-slate-800/50 hover:border-teal-500/50 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="p-3 rounded-full bg-slate-800 text-slate-400 group-hover:text-teal-400 mb-2 transition-colors">
                        <Plus size={20} />
                      </div>
                      <p className="text-xs text-slate-400 font-medium">Klik untuk buka Kamera / File</p>
                      <p className="text-[10px] text-slate-500 mt-1">PNG, JPG atau JPEG</p>
                    </div>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Deskripsi Kerusakan*</Label>
              <textarea
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                placeholder="Jelaskan detail kerusakan alat..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 min-h-[100px] transition-all resize-none"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button onClick={handleSubmit} disabled={saving || uploading || !form.alatId} className="bg-teal-600 hover:bg-teal-700 w-full font-bold h-11 shadow-lg shadow-teal-600/20">
              {saving || uploading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="animate-spin" size={18} />
                  {uploading ? 'Mengupload Foto...' : 'Mengirim Laporan...'}
                </span>
              ) : 'Kirim Laporan Kerusakan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
