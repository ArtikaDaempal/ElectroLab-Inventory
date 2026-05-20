'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeftRight, Search, Filter, CheckCircle2, XCircle, 
  Clock, Package, User, Calendar, MoreVertical, RefreshCw, Info
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/auth'
import StatusBadge from '@/components/ui/StatusBadge'
import { QRScanner } from '@/components/ui/QRScanner'
import { QRCodeSVG } from 'qrcode.react'
import { Printer, QrCode } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Peminjaman {
  id: string
  alatId: string
  labId: string
  peminjamId: string
  jumlah: number
  tujuan: string
  tanggalPinjam: string
  tanggalKembali: string | null
  status: 'PENDING' | 'DISETUJUI' | 'DITOLAK' | 'DIAMBIL' | 'DIKEMBALIKAN'
  catatan: string | null
  createdAt: string
  alat: {
    namaAlat: string
    kodeAlat: string
    fotoUrl: string | null
  } | null
  peminjam: {
    nama: string
    email: string
    nim: string | null
    role?: string
  } | null
}

interface GroupedPeminjaman {
  groupKey: string
  peminjam: Peminjaman['peminjam']
  tujuan: string
  tanggalPinjam: string
  tanggalKembali: string | null
  status: Peminjaman['status']
  createdAt: string
  items: Peminjaman[]
}

export default function PeminjamanPage() {
  const user = useAuthStore((s) => s.user)
  const [data, setData] = useState<Peminjaman[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  
  const [showProcess, setShowProcess] = useState<GroupedPeminjaman | null>(null)
  const [processForm, setProcessForm] = useState({ status: '', catatan: '' })
  const [saving, setSaving] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scannedResults, setScannedResults] = useState<GroupedPeminjaman[]>([])
  const [showPrint, setShowPrint] = useState<GroupedPeminjaman | null>(null)
  const [kepalaLab, setKepalaLab] = useState<{ nama: string, nip: string | null } | null>(null)

  useEffect(() => {
    if (showPrint && showPrint.items.length > 0) {
      const fetchKepalaLab = async () => {
        const labId = showPrint.items[0].labId
        try {
          const res = await fetch(`/api/users?role=KEPALA_LAB&labId=${labId}`)
          if (res.ok) {
            const users = await res.json()
            if (users && users.length > 0) {
              setKepalaLab(users[0])
            } else {
              setKepalaLab(null)
            }
          }
        } catch (err) {
          console.error('Gagal fetch kepala lab', err)
        }
      }
      fetchKepalaLab()
    } else {
      setKepalaLab(null)
    }
  }, [showPrint])

  const isAdmin = user?.role === 'KEPALA_LAB'

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
    try {
      const res = await fetch(`/api/peminjaman${params}`)
      if (res.ok) {
        const raw: Peminjaman[] = await res.json()
        setData(raw)
      }
    } catch (err) {
      toast.error('Gagal mengambil data peminjaman')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleProcess = async () => {
    if (!showProcess || !processForm.status) return
    
    setSaving(true)
    try {
      // Process all items in the group
      const promises = showProcess.items.map(item => 
        fetch(`/api/peminjaman/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(processForm)
        })
      )
      
      const results = await Promise.all(promises)
      const failed = results.filter(r => !r.ok)
      
      if (failed.length === 0) {
        toast.success(`Peminjaman berhasil diperbarui ke ${processForm.status.toLowerCase()}`)
        setShowProcess(null)
        fetchData()
      } else {
        toast.error(`Gagal memperbarui ${failed.length} item`)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const groupData = (list: Peminjaman[]): GroupedPeminjaman[] => {
    const groups: Record<string, GroupedPeminjaman> = {}
    list.forEach(item => {
      // Group by user, purpose, date, and creation time (truncated to minute)
      // This ensures items from the same submission batch are grouped together
      const minuteTimestamp = item.createdAt.substring(0, 16)
      const key = `${item.peminjamId}-${item.tujuan}-${item.tanggalPinjam}-${minuteTimestamp}`
      if (!groups[key]) {
        groups[key] = {
          groupKey: key,
          peminjam: item.peminjam,
          tujuan: item.tujuan,
          tanggalPinjam: item.tanggalPinjam,
          tanggalKembali: item.tanggalKembali,
          status: item.status,
          createdAt: item.createdAt,
          items: []
        }
      }
      groups[key].items.push(item)
    })
    return Object.values(groups)
  }

  const groupedData = groupData(data)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-amber-400'
      case 'DISETUJUI': return 'text-green-400'
      case 'DITOLAK': return 'text-red-400'
      case 'DIAMBIL': return 'text-blue-400'
      case 'DIKEMBALIKAN': return 'text-teal-400'
      default: return 'text-slate-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="text-teal-400" /> Manajemen Peminjaman
          </h1>
          <p className="text-slate-400 text-sm mt-1">Pantau dan kelola permintaan peminjaman alat</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
          {isAdmin && (
            <Button 
              onClick={() => setShowScanner(true)}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2 border-none shadow-lg shadow-indigo-500/20"
            >
              <QrCode size={18} />
              Scan QR Proses
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={fetchData}
            className="glass border-slate-700 text-slate-400 hover:text-teal-400"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-4"
      >
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || 'all')}>
          <SelectTrigger className="w-48 bg-slate-800/40 border-slate-700 text-white">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-500" />
              <SelectValue placeholder="Semua Status" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white">
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="PENDING">Menunggu</SelectItem>
            <SelectItem value="DISETUJUI">Disetujui</SelectItem>
            <SelectItem value="DITOLAK">Ditolak</SelectItem>
            <SelectItem value="DIAMBIL">Sedang Dipinjam</SelectItem>
            <SelectItem value="DIKEMBALIKAN">Selesai</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 gap-4">
        {loading && data.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full bg-slate-800/50 rounded-2xl" />
          ))
        ) : (
          <AnimatePresence>
            {groupedData.map((group, idx) => (
              <motion.div 
                key={group.groupKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-5 group hover:border-teal-500/30 transition-all relative overflow-hidden"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left: Alat Info List */}
                  <div className="flex flex-col gap-3 md:w-1/3">
                    {group.items.map((item, i) => (
                      <div key={item.id} className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-teal-500 border border-slate-700 shrink-0">
                          {item.alat?.fotoUrl ? (
                            <img src={item.alat.fotoUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Package size={18} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-bold truncate group-hover:text-teal-400 transition-colors">{item.alat?.namaAlat || 'Alat Dihapus'}</p>
                          <div className="flex items-center gap-2">
                             <p className="text-slate-500 text-[10px] font-mono">{item.alat?.kodeAlat || '-'}</p>
                             <span className="text-teal-500 text-[10px] font-bold">× {item.jumlah}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Middle: Peminjam Info */}
                  <div className="flex flex-col justify-center gap-2 md:w-1/3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                        <User size={14} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-slate-200 text-sm font-medium">{group.peminjam?.nama || 'User'}</p>
                          {group.peminjam?.role === 'DOSEN' && (
                            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                              Dosen (Prioritas)
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-[10px]">{group.peminjam?.nim || group.peminjam?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30">
                        <Calendar size={14} />
                      </div>
                      <p className="text-slate-400 text-xs">
                        {new Date(group.tanggalPinjam).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}
                        {group.tanggalKembali && ` - ${new Date(group.tanggalKembali).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}`}
                      </p>
                    </div>
                  </div>

                  {/* Right: Status & Actions */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 md:w-1/3 ml-auto">
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={group.status} />
                      <p className="text-[10px] text-slate-500">{new Date(group.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {new Date(group.createdAt).toLocaleDateString('id-ID')}</p>
                    </div>

                    <div className="flex gap-2">
                      {isAdmin && group.status === 'PENDING' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                            onClick={() => { setShowProcess(group); setProcessForm({ status: 'DITOLAK', catatan: '' }) }}
                          >
                            <XCircle size={14} className="mr-1.5" /> Tolak
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-8 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => { setShowProcess(group); setProcessForm({ status: 'DISETUJUI', catatan: '' }) }}
                          >
                            <CheckCircle2 size={14} className="mr-1.5" /> Setujui
                          </Button>
                        </>
                      )}
                      
                      {isAdmin && group.status === 'DISETUJUI' && (
                        <Button 
                          size="sm" 
                          className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => { setShowProcess(group); setProcessForm({ status: 'DIAMBIL', catatan: '' }) }}
                        >
                          Barang DIAMBIL
                        </Button>
                      )}

                      {isAdmin && group.status === 'DIAMBIL' && (
                        <Button 
                          size="sm" 
                          className="h-8 bg-teal-600 hover:bg-teal-700 text-white"
                          onClick={() => { setShowProcess(group); setProcessForm({ status: 'DIKEMBALIKAN', catatan: '' }) }}
                        >
                          Sudah DIKEMBALIKAN
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <button className="h-8 w-8 p-0 text-slate-400 hover:text-white transition-colors bg-transparent border-none outline-none cursor-pointer flex items-center justify-center">
                            <MoreVertical size={16} />
                          </button>
                        }/>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-white">
                          <DropdownMenuItem className="focus:bg-slate-800" onClick={() => toast.info(`Tujuan: ${group.tujuan}`)}>
                            <Info size={14} className="mr-2" /> Detail Tujuan
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-slate-800" onClick={() => setShowPrint(group)}>
                            <Printer size={14} className="mr-2" /> Cetak Surat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
                
                {/* Visual indicator line for pending */}
                {group.status === 'PENDING' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/50" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {!loading && data.length === 0 && (
          <div className="py-20 text-center glass-card">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 text-slate-600 mb-4">
              <ArrowLeftRight size={32} />
            </div>
            <h3 className="text-white font-medium">Tidak ada data peminjaman</h3>
            <p className="text-slate-500 text-sm">Semua permintaan telah diproses atau belum ada permintaan baru</p>
          </div>
        )}
      </div>

      {/* Process Dialog */}
      <Dialog open={!!showProcess} onOpenChange={(o) => !o && setShowProcess(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Konfirmasi {processForm.status === 'DISETUJUI' ? 'Persetujuan' : processForm.status === 'DITOLAK' ? 'Penolakan' : 'Update Status'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <p className="text-slate-400 text-xs">Peminjam:</p>
              <p className="text-white font-medium">{showProcess?.peminjam?.nama}</p>
              <p className="text-slate-400 text-xs mt-2">Alat yang dipinjam ({showProcess?.items.length}):</p>
              <div className="mt-1 space-y-1">
                {showProcess?.items.map(it => (
                  <p key={it.id} className="text-white text-xs flex justify-between">
                    <span>• {it.alat?.namaAlat}</span>
                    <span className="font-bold">{it.jumlah} Unit</span>
                  </p>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Catatan (Opsional)</Label>
              <Input 
                placeholder="Tambahkan catatan jika diperlukan..." 
                className="bg-slate-800 border-slate-700 text-white"
                value={processForm.catatan}
                onChange={(e) => setProcessForm({...processForm, catatan: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcess(null)} className="border-slate-700 bg-transparent text-slate-300">
              Batal
            </Button>
            <Button 
              className={processForm.status === 'DITOLAK' ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'}
              onClick={handleProcess}
              disabled={saving}
            >
              {saving ? 'Memproses...' : 'Konfirmasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Scanner Component */}
      {showScanner && (
        <QRScanner 
          onClose={() => setShowScanner(false)}
          onScan={(text) => {
            const qrText = text.trim()

            if (qrText.startsWith('ITEM:')) {
              const code = qrText.replace('ITEM:', '')
              // Cari peminjaman aktif yang memiliki alat dengan kode tersebut
              const results = data.filter(p => 
                p.alat?.kodeAlat === code && 
                ['DISETUJUI', 'DIAMBIL'].includes(p.status)
              )
              
              if (results.length > 0) {
                setScannedResults(groupData(results))
              } else {
                toast.error(`Tidak ditemukan peminjaman aktif untuk alat dengan kode: ${code}`)
              }
              setShowScanner(false)
            } else if (qrText.startsWith('VERIFY_GRP:')) {
              const groupKey = qrText.replace('VERIFY_GRP:', '')
              const result = groupedData.find(group => group.groupKey === groupKey)

              if (result) {
                setScannedResults([result])
              } else {
                toast.error('Data peminjaman dari QR surat tidak ditemukan.')
              }
              setShowScanner(false)
            } else {
              toast.error("Format QR Code tidak valid.")
              setShowScanner(false)
            }
          }}
        />
      )}

      {/* Scanned Results Dialog */}
      <Dialog open={scannedResults.length > 0} onOpenChange={(o) => !o && setScannedResults([])}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="text-indigo-400" /> Hasil Scan Peminjaman
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-xs text-slate-400">Ditemukan {scannedResults.length} data peminjaman:</p>
            {scannedResults.map(group => (
              <div key={group.groupKey} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-bold">{group.peminjam?.nama}</h4>
                    <p className="text-[10px] text-slate-500 uppercase">{group.peminjam?.nim || 'DOSEN'}</p>
                  </div>
                  <StatusBadge status={group.status} />
                </div>
                <div className="space-y-1.5 mt-1">
                  {group.items.map(it => (
                    <div key={it.id} className="flex items-center justify-between text-[11px] text-slate-300 bg-black/20 p-1.5 rounded">
                      <div className="flex items-center gap-2">
                        <Package size={12} className="text-blue-400" />
                        <span>{it.alat?.namaAlat}</span>
                      </div>
                      <span className="font-bold">{it.jumlah} Unit</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-1">
                  {group.status === 'DISETUJUI' && (
                    <Button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs h-8"
                      onClick={() => {
                        setScannedResults([])
                        setShowProcess(group)
                        setProcessForm({ status: 'DIAMBIL', catatan: '' })
                      }}
                    >
                      Konfirmasi Ambil
                    </Button>
                  )}
                  {group.status === 'DIAMBIL' && (
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8"
                      onClick={() => {
                        setScannedResults([])
                        setShowProcess(group)
                        setProcessForm({ status: 'DIKEMBALIKAN', catatan: '' })
                      }}
                    >
                      Selesaikan Kembali
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      {/* Print Dialog */}
      <Dialog open={!!showPrint} onOpenChange={(o) => !o && setShowPrint(null)}>
        <DialogContent className="bg-white text-slate-900 max-w-2xl p-0 overflow-hidden">
          <div className="p-8 space-y-6" id="printable-area">
            {/* Kop Surat */}
            <div className="flex items-center gap-4 border-b-2 border-slate-900 pb-4">
              <img src="/logo.png" alt="" className="w-16 h-16 object-contain" />
              <div className="text-center flex-1">
                <h2 className="text-lg font-bold uppercase">Kementerian Pendidikan Tinggi,</h2>
                <h2 className="text-lg font-bold uppercase">Sains, dan Teknologi</h2>
                <h3 className="text-md font-bold uppercase">Politeknik Negeri Manado</h3>
                <p className="text-[10px]">Jl. Raya Politeknik, Kelurahan Buha, Kecamatan Mapanget, Kota Manado, Sulawesi Utara, Kode Pos 95252.</p>
                <p className="text-[10px] font-bold">Laboratorium Teknik Elektro</p>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-md font-bold underline decoration-1">SURAT PEMINJAMAN ALAT</h4>
              <p className="text-[10px] font-mono text-slate-500">GROUP ID: {showPrint?.groupKey.split('-').pop()?.toUpperCase()}</p>
            </div>

            <div className="space-y-4 text-xs">
              <p>Yang bertanda tangan di bawah ini menerangkan bahwa:</p>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="w-32 py-1">Nama Peminjam</td>
                    <td className="w-4">:</td>
                    <td className="font-bold">{showPrint?.peminjam?.nama}</td>
                  </tr>
                  <tr>
                    <td className="py-1">NIM / Email</td>
                    <td>:</td>
                    <td>{showPrint?.peminjam?.nim || showPrint?.peminjam?.email}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Tujuan</td>
                    <td>:</td>
                    <td>{showPrint?.tujuan}</td>
                  </tr>
                </tbody>
              </table>

              <p>Telah meminjam peralatan berikut:</p>
              <table className="w-full border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-2 text-left">Nama Alat</th>
                    <th className="border border-slate-300 p-2 text-left">Kode Alat</th>
                    <th className="border border-slate-300 p-2 text-center">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {showPrint?.items.map(it => (
                    <tr key={it.id}>
                      <td className="border border-slate-300 p-2">{it.alat?.namaAlat}</td>
                      <td className="border border-slate-300 p-2 font-mono">{it.alat?.kodeAlat}</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">{it.jumlah} Unit</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-8 pt-4">
                <div>
                  <p>Tanggal Pinjam: <span className="font-bold">{showPrint && new Date(showPrint.tanggalPinjam).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}</span></p>
                  <p>Estimasi Kembali: <span className="font-bold">{showPrint?.tanggalKembali ? new Date(showPrint.tanggalKembali).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' }) : '-'}</span></p>
                </div>
                <div className="text-right">
                  <p>Status: <span className="font-bold uppercase">{showPrint?.status}</span></p>
                </div>
              </div>

              <div className="flex justify-between items-end pt-10">
                <div className="text-center">
                  <p className="mb-16">Peminjam,</p>
                  <p className="font-bold">({showPrint?.peminjam?.nama})</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="p-1 border border-slate-200 rounded">
                      <QRCodeSVG value={`VERIFY_GRP:${showPrint?.groupKey}`} size={80} />
                    </div>
                   <p className="text-[8px] mt-1 text-slate-400 font-mono">Digital Signature</p>
                </div>
                <div className="text-center">
                  <p className="mb-16">Kepala Laboratorium,</p>
                  <p className="font-bold underline">({kepalaLab?.nama || '.....................................'})</p>
                  <p className="text-[10px]">NIP. {kepalaLab?.nip || '.....................................'}</p>
                </div>
              </div>
            </div>
            
            <p className="text-[8px] text-slate-400 italic text-center border-t pt-4">
              Dokumen ini dihasilkan secara otomatis oleh Sistem Inventaris Lab Elektro Poli Manado. 
              Verifikasi keaslian dokumen dapat dilakukan dengan memindai kode QR di atas.
            </p>
          </div>
          <DialogFooter className="p-4 bg-slate-50 border-t">
            <Button variant="outline" onClick={() => setShowPrint(null)} className="border-slate-300">Tutup</Button>
            <Button 
              className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
              onClick={() => {
                const printContents = document.getElementById('printable-area')?.innerHTML;
                const originalContents = document.body.innerHTML;
                document.body.innerHTML = printContents || '';
                window.print();
                document.body.innerHTML = originalContents;
                window.location.reload(); // Reload to restore React state
              }}
            >
              <Printer size={16} /> Cetak Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
