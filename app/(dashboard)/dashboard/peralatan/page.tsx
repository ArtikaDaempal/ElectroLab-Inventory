'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Search, Filter, Edit2, Trash2, MoreVertical, 
  Package, Info, Download, RefreshCw, QrCode, Printer, FlaskConical, FileUp, CheckCircle
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/auth'
import DeleteConfirm from '@/components/ui/DeleteConfirm'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Peralatan {
  id: string; namaAlat: string; kategori: string; merek: string | null;
  kodeAlat: string; stokTotal: number; stokBaik: number; stokRusak: number;
  stokButuhPerbaikan: number; namaLab: string | null; prodi: string | null;
  kondisi: string | null; fotoUrl: string | null; createdAt: string; labId: string;
}

const PRODI_OPTIONS = [
  'Teknik Informatika',
  'Teknik Komputer',
  'Teknik Listrik'
]

export default function PeralatanPage() {
  const user = useAuthStore((s) => s.user)
  const isKepalaLab = user?.role === 'KEPALA_LAB'
  const [data, setData] = useState<Peralatan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [kategoriFilter, setKategoriFilter] = useState('all')
  const [labFilter, setLabFilter] = useState('all')
  const [prodiFilter, setProdiFilter] = useState('all')

  // KEPALA_LAB tidak menggunakan filter prodi — selalu tampil semua alat labnya
  const activeProdiFilter = isKepalaLab ? 'all' : prodiFilter

  useEffect(() => {
    // KEPALA_LAB tidak boleh memfilter ke lab lain — biarkan API yang enforce
    if (isKepalaLab) return
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('labId')
      if (id) {
        setLabFilter(id)
        window.history.replaceState(null, '', window.location.pathname)
      }
    }
  }, [isKepalaLab])

  const [labs, setLabs] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState<Peralatan | null>(null)
  const [showDelete, setShowDelete] = useState<Peralatan | null>(null)
  const [showQR, setShowQR] = useState<Peralatan | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  
  const [form, setForm] = useState({
    namaAlat: '', kategori: '', merek: '', kodeAlat: '',
    stokTotal: '0', stokBaik: '0', stokRusak: '0', stokButuhPerbaikan: '0',
    namaLab: '', prodi: '', kondisi: 'Baik', fotoUrl: '', labId: ''
  })

  const canManageEquipment = user?.role === 'KEPALA_LAB' || user?.role === 'KAJUR'

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (kategoriFilter !== 'all') params.append('kategori', kategoriFilter)
    // KEPALA_LAB: API sudah otomatis membatasi ke lab mereka sendiri
    if (!isKepalaLab && labFilter !== 'all') params.append('labId', labFilter)
    // KEPALA_LAB tidak menggunakan filter prodi
    if (activeProdiFilter !== 'all') params.append('prodi', activeProdiFilter)
    
    try {
      const res = await fetch(`/api/peralatan?${params.toString()}`)
      const result = await res.json()
      if (res.ok) setData(Array.isArray(result) ? result : [])
      
      const labRes = await fetch('/api/labs')
      const labResult = await labRes.json()
      if (labRes.ok) setLabs(Array.isArray(labResult) ? labResult : [])
    } catch (err) {
      toast.error('Gagal mengambil data peralatan')
    } finally {
      setLoading(false)
    }
  }, [search, kategoriFilter, labFilter, activeProdiFilter, isKepalaLab])

  const handleUpdateStatus = async (id: string, action: 'MARK_DAMAGED' | 'MARK_REPAIR' | 'FIXED') => {
    try {
      const res = await fetch(`/api/peralatan/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (res.ok) {
        toast.success(action === 'MARK_DAMAGED' ? 'Unit ditandai rusak' : 'Status diperbarui')
        fetchData()
      } else {
        const d = await res.json(); throw new Error(d.error)
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => { fetchData() }, 500)
    return () => clearTimeout(timer)
  }, [fetchData])

  const handleOpenEdit = (alat: Peralatan) => {
    setShowEdit(alat)
    setForm({
      namaAlat: alat.namaAlat, kategori: alat.kategori, merek: alat.merek || '',
      kodeAlat: alat.kodeAlat, stokTotal: String(alat.stokTotal), stokBaik: String(alat.stokBaik),
      stokRusak: String(alat.stokRusak), stokButuhPerbaikan: String(alat.stokButuhPerbaikan),
      namaLab: alat.namaLab || '', prodi: alat.prodi || '', kondisi: alat.kondisi || 'Baik',
      fotoUrl: alat.fotoUrl || '', labId: alat.labId || ''
    })
  }

  const handleSubmit = async () => {
    if (!form.namaAlat || !form.kategori || !form.kodeAlat) {
      toast.error('Lengkapi field wajib'); return
    }
    setSaving(true)
    try {
      const url = showEdit ? `/api/peralatan/${showEdit.id}` : '/api/peralatan'
      const res = await fetch(url, {
        method: showEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        toast.success(showEdit ? 'Peralatan diperbarui' : 'Peralatan ditambahkan')
        setShowAdd(false); setShowEdit(null); fetchData()
      } else {
        const d = await res.json(); throw new Error(d.error)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!showDelete) return
    setSaving(true)
    try {
      const res = await fetch(`/api/peralatan/${showDelete.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Alat berhasil dihapus')
        setShowDelete(null); fetchData()
      } else {
        const d = await res.json(); throw new Error(d.error)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setImporting(true)
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)

        if (data.length === 0) throw new Error('File Excel kosong')

        const mappedData = data.map((row: any) => {
          const getVal = (keys: string[]) => {
            const found = Object.keys(row).find(k => keys.includes(k.toUpperCase()))
            return found ? row[found] : null
          }

          return {
            namaAlat: getVal(['NAMA ALAT', 'NAMA', 'ALAT', 'NAME', 'EQUIPMENT']),
            kategori: getVal(['KATEGORI', 'CATEGORY', 'JENIS']),
            merek: getVal(['SPESIFIKASI / MERK', 'SPESIFIKASI/MERK', 'MERK', 'MEREK', 'BRAND', 'MODEL']),
            kodeAlat: getVal(['KODE ALAT', 'KODE', 'CODE', 'SKU']),
            stokTotal: getVal(['JUMLAH TOTAL', 'TOTAL', 'QTY', 'QUANTITY', 'STOK']),
            stokBaik: getVal(['BAIK', 'GOOD', 'NORMAL']),
            stokRusak: getVal(['RUSAK', 'BROKEN', 'DAMAGED']),
            stokButuhPerbaikan: getVal(['BUTUH PERBAIKAN', 'PERBAIKAN', 'REPAIR']),
            namaLab: getVal(['NAMA LAB', 'LAB', 'LABORATORIUM', 'ROOM']),
          }
        })

        const res = await fetch('/api/peralatan/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: mappedData })
        })
        const result = await res.json()
        if (res.ok) {
          toast.success(result.message)
          setShowImport(false)
          fetchData()
        } else {
          throw new Error(result.error)
        }
      } catch (err: any) {
        toast.error(err.message)
      } finally {
        setImporting(false)
        e.target.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  const downloadTemplate = () => {
    const template = [
      {
        'NO': 1,
        'NAMA ALAT': 'Transformator Arus (CT)',
        'KATEGORI': 'Sensor & Transduser',
        'SPESIFIKASI / MERK': 'Schneider LVCT 50/5A Panel',
        'JUMLAH TOTAL': 7,
        'BAIK': 6,
        'RUSAK': 1,
        'BUTUH PERBAIKAN': 1,
        'NAMA LAB': 'Laboratorium Konversi Energi Distribusi dan Proteksi'
      }
    ]
    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template Import')
    XLSX.writeFile(wb, 'Template_Import_Peralatan.xlsx')
  }

  const totalItems = data.length
  const totalStok = data.reduce((acc, curr) => acc + curr.stokTotal, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Package className="text-blue-400" /> Inventaris Peralatan
            </h1>
            <div className="px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold">
              {totalItems} ALAT / {totalStok} UNIT
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-1">Sesuai Format Laporan Inventaris Laboratorium</p>
        </div>
        {canManageEquipment && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImport(true)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <FileUp size={16} className="mr-2" /> Import Excel
            </Button>
            <Button onClick={() => { setShowAdd(true); setShowEdit(null); setForm({...form, labId: user?.labId || ''}) }} className="bg-blue-600 hover:bg-blue-700">
              <Plus size={16} className="mr-2" /> Tambah Alat
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 glass rounded-2xl border border-slate-700/50">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <Input placeholder="Cari nama alat..." className="pl-10 bg-slate-800/40 border-slate-700 text-white h-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        
        <Select value={kategoriFilter} onValueChange={(v) => setKategoriFilter(v || 'all')}>
          <SelectTrigger className="w-[160px] bg-slate-800/40 border-slate-700 text-white h-10">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white">
            <SelectItem value="all">Semua Kategori</SelectItem>
            {Array.from(new Set(data.map(d => d.kategori))).map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>

        {user?.role !== 'KAJUR' && !isKepalaLab && (
          <Select value={prodiFilter} onValueChange={(v) => setProdiFilter(v || 'all')}>
            <SelectTrigger className="w-[160px] bg-slate-800/40 border-slate-700 text-white h-10">
              <SelectValue placeholder="Prodi Teknik" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="all">Semua Prodi Teknik</SelectItem>
              {PRODI_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {!isKepalaLab && (
          <Select value={labFilter} onValueChange={(v) => setLabFilter(v || 'all')}>
            <SelectTrigger className="w-[180px] bg-slate-800/40 border-slate-700 text-white font-bold h-10">
              <SelectValue placeholder="Laboratorium">
                {labFilter === 'all' ? 'Semua Lab' : (labs.find(l => l.id === labFilter)?.nama || 'Semua Lab')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="w-max min-w-[var(--radix-select-trigger-width)] max-w-[420px] bg-slate-900 border-slate-800 text-white">
              <SelectItem value="all">Semua Lab</SelectItem>
              {labs.map(l => <SelectItem key={l.id} value={l.id}>{l.nama}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {isKepalaLab && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold h-10">
            <FlaskConical size={14} />
            <span>{labs.find(l => l.id === user?.labId)?.nama || 'Lab Anda'}</span>
          </div>
        )}
      </div>

      {/* Table Sesuai Format Gambar */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/80 text-white uppercase font-bold border-b border-slate-700 text-[10px]">
                <th rowSpan={2} className="px-3 py-4 text-center border-r border-slate-700 w-12">NO</th>
                <th rowSpan={2} className="px-4 py-4 border-r border-slate-700">NAMA ALAT</th>
                <th rowSpan={2} className="px-4 py-4 border-r border-slate-700">KATEGORI</th>
                <th rowSpan={2} className="px-4 py-4 border-r border-slate-700">SPESIFIKASI / MERK</th>
                <th rowSpan={2} className="px-3 py-4 text-center border-r border-slate-700">TOTAL</th>
                <th colSpan={3} className="px-4 py-2 text-center border-b border-r border-slate-700">KONDISI UNIT</th>
                <th rowSpan={2} className="px-4 py-4 border-r border-slate-700">NAMA LAB</th>
                <th rowSpan={2} className="px-3 py-4 text-center">AKSI</th>
              </tr>
              <tr className="bg-slate-800/50 text-white font-bold border-b border-slate-700 text-[9px]">
                <th className="px-2 py-2 text-center border-r border-slate-700 text-green-400">BAIK</th>
                <th className="px-2 py-2 text-center border-r border-slate-700 text-red-400">RUSAK</th>
                <th className="px-2 py-2 text-center border-r border-slate-700 text-amber-400">PERBAIKAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={10} className="p-4"><Skeleton className="h-8 w-full bg-slate-800" /></td></tr>
                ))
              ) : data.length === 0 ? (
                <tr><td colSpan={10} className="p-10 text-center text-slate-500">Data tidak ditemukan</td></tr>
              ) : data.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-800/20 transition-colors text-slate-300">
                  <td className="px-3 py-4 text-center border-r border-slate-800/50">{idx + 1}</td>
                  <td className="px-4 py-4 border-r border-slate-800/50">
                    <div className="font-bold text-white">{item.namaAlat}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{item.kodeAlat}</div>
                  </td>
                  <td className="px-4 py-4 border-r border-slate-800/50">{item.kategori}</td>
                  <td className="px-4 py-4 border-r border-slate-800/50">{item.merek || '-'}</td>
                  <td className="px-3 py-4 text-center font-bold text-white border-r border-slate-800/50">{item.stokTotal}</td>
                  <td className="px-2 py-4 text-center border-r border-slate-800/50 bg-green-500/5">{item.stokBaik}</td>
                  <td className="px-2 py-4 text-center border-r border-slate-800/50 bg-red-500/5">{item.stokRusak}</td>
                  <td className="px-2 py-4 text-center border-r border-slate-800/50 bg-amber-500/5">{item.stokButuhPerbaikan}</td>
                  <td className="px-4 py-4 border-r border-slate-800/50 text-[10px]">
                    <div className="font-semibold text-slate-300">{labs.find(l => l.id === item.labId)?.nama || item.namaLab || '-'}</div>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <button className="h-7 w-7 p-0 text-slate-500 hover:text-white transition-colors bg-transparent border-none outline-none cursor-pointer flex items-center justify-center">
                          <MoreVertical size={14} />
                        </button>
                      }/>
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-white">
                        {canManageEquipment && (
                          <DropdownMenuItem onClick={() => handleOpenEdit(item)}><Edit2 size={14} className="mr-2" /> Edit Alat</DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setShowQR(item)}><QrCode size={14} className="mr-2" /> QR Code</DropdownMenuItem>
                        {canManageEquipment && (
                          <DropdownMenuItem className="text-red-400" onClick={() => setShowDelete(item)}><Trash2 size={14} className="mr-2" /> Hapus Permanen</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog Tetap Sama */}
      <Dialog open={showAdd || !!showEdit} onOpenChange={(o) => { if(!o) { setShowAdd(false); setShowEdit(null) } }}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader><DialogTitle>{showEdit ? 'Edit Peralatan' : 'Tambah Peralatan'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label>Nama Alat*</Label>
              <Input value={form.namaAlat} onChange={(e) => setForm({...form, namaAlat: e.target.value})} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label>Kode Alat*</Label>
              <Input value={form.kodeAlat} onChange={(e) => setForm({...form, kodeAlat: e.target.value})} className="bg-slate-800 border-slate-700 font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Kategori*</Label>
              <Input value={form.kategori} onChange={(e) => setForm({...form, kategori: e.target.value})} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label>Spesifikasi / Merk</Label>
              <Input value={form.merek} onChange={(e) => setForm({...form, merek: e.target.value})} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="col-span-2 grid grid-cols-4 gap-3 bg-slate-800/30 p-3 rounded-lg border border-slate-700">
              <div className="space-y-1"><Label className="text-[10px]">TOTAL</Label><Input type="number" value={form.stokTotal} onChange={(e) => setForm({...form, stokTotal: e.target.value})} className="h-8 bg-slate-900" /></div>
              <div className="space-y-1"><Label className="text-[10px] text-green-500">BAIK</Label><Input type="number" value={form.stokBaik} onChange={(e) => setForm({...form, stokBaik: e.target.value})} className="h-8 bg-slate-900" /></div>
              <div className="space-y-1"><Label className="text-[10px] text-red-500">RUSAK</Label><Input type="number" value={form.stokRusak} onChange={(e) => setForm({...form, stokRusak: e.target.value})} className="h-8 bg-slate-900" /></div>
              <div className="space-y-1"><Label className="text-[10px] text-amber-500">PERBAIKAN</Label><Input type="number" value={form.stokButuhPerbaikan} onChange={(e) => setForm({...form, stokButuhPerbaikan: e.target.value})} className="h-8 bg-slate-900" /></div>
            </div>
            <div className="space-y-2">
              <Label>Laboratorium</Label>
              <Select value={form.labId} onValueChange={(v) => setForm({...form, labId: v || ''})} disabled={user?.role !== 'KAJUR'}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Pilih Lab">
                    {labs.find(l => l.id === form.labId)?.nama || 'Pilih Lab'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-max min-w-[var(--radix-select-trigger-width)] max-w-[420px] bg-slate-800 border-slate-700 text-white">
                  {labs.map(l => <SelectItem key={l.id} value={l.id}>{l.nama}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700 w-full">
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="text-blue-400" /> Import via Excel
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-center">
            <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 hover:border-blue-500/50 transition-colors cursor-pointer relative group">
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleImportExcel}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                disabled={importing}
              />
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <FileUp className="text-blue-500" />
                </div>
                <p className="text-sm text-slate-300">
                  {importing ? 'Sedang memproses...' : 'Klik atau seret file Excel ke sini'}
                </p>
                <p className="text-xs text-slate-500">Mendukung .xlsx dan .xls</p>
              </div>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-lg text-left space-y-2">
              <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Info size={12} /> PETUNJUK IMPORT
              </h4>
              <ul className="text-[11px] text-slate-500 space-y-1 list-disc pl-4">
                <li>Gunakan nama kolom yang sesuai (NAMA ALAT, KODE ALAT, KATEGORI, dll).</li>
                <li>Pastikan KODE ALAT tidak ada yang duplikat di sistem.</li>
                <li><strong>KATEGORI</strong> harus sesuai dengan daftar yang ada di sistem (misal: Elektronika, Mekanik, dll).</li>
                <li>Data akan otomatis dimasukkan ke laboratorium Anda saat ini.</li>
              </ul>
              <Button variant="link" size="sm" onClick={downloadTemplate} className="text-blue-400 p-0 h-auto text-xs">
                Unduh Template Excel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete & QR Dialogs */}
      <DeleteConfirm 
        open={!!showDelete} 
        onOpenChange={(o) => !o && setShowDelete(null)} 
        onConfirm={handleDelete} 
        loading={saving} 
        title="Hapus Peralatan?" 
        description={`Apakah Anda yakin ingin menghapus "${showDelete?.namaAlat}"? Tindakan ini tidak dapat dibatalkan.`} 
      />

      {/* QR Code Dialog */}
      <Dialog open={!!showQR} onOpenChange={(o) => !o && setShowQR(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="text-blue-400" /> Label QR Code Peralatan
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-10 space-y-6">
            <div className="p-6 bg-white rounded-2xl shadow-2xl shadow-blue-500/20" id="qr-container">
              <QRCodeSVG 
                value={`ITEM:${showQR?.kodeAlat}`}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">{showQR?.namaAlat}</h3>
              <p className="text-blue-400 font-mono font-bold tracking-widest">{showQR?.kodeAlat}</p>
              <p className="text-slate-500 text-xs mt-1 uppercase">{labs.find(l => l.id === showQR?.labId)?.nama || showQR?.namaLab}</p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowQR(null)} className="flex-1 border-slate-700">Tutup</Button>
            <Button onClick={() => window.print()} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Printer size={16} className="mr-2" /> Cetak Label
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
