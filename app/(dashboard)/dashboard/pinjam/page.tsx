'use client'
import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ClipboardList, Package, Calendar, AlertCircle, 
  ChevronLeft, Info, Send, FlaskConical
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, Plus, Minus } from 'lucide-react'

interface Peralatan {
  id: string
  namaAlat: string
  kodeAlat: string
  stokBaik: number
  fotoUrl: string | null
  labId: string
}

interface Lab {
  id: string
  nama: string
}

function PinjamForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  
  const [peralatan, setPeralatan] = useState<Peralatan[]>([])
  const [labs, setLabs] = useState<Lab[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const cart = useCartStore()
  
  const [form, setForm] = useState({
    labId: '',
    alatId: searchParams.get('alatId') || '',
    jumlah: '1',
    tujuan: '',
    tanggalPinjam: new Date().toISOString().split('T')[0],
    tanggalKembali: ''
  })

  // Fetch Labs
  useEffect(() => {
    fetch('/api/labs')
      .then(r => r.json())
      .then(data => setLabs(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Gagal memuat daftar lab'))
  }, [])

  // Fetch Peralatan based on Lab
  const fetchPeralatan = useCallback(async (labId: string) => {
    if (!labId) {
      setPeralatan([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/peralatan?labId=${labId}`)
      const data = await res.json()
      setPeralatan(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error('Gagal memuat peralatan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // If we have an alatId from search params, we need to find its lab first
    const initialAlatId = searchParams.get('alatId')
    if (initialAlatId) {
      fetch(`/api/peralatan/${initialAlatId}`)
        .then(r => r.json())
        .then(data => {
          if (data?.labId) {
            setForm(f => ({ ...f, labId: data.labId || '' }))
            fetchPeralatan(data.labId)
          }
        })
    } else if (user?.labId) {
      setForm(f => ({ ...f, labId: user.labId || '' }))
      fetchPeralatan(user.labId || '')
    } else {
      setLoading(false)
    }
  }, [searchParams, user?.labId, fetchPeralatan])

  const handleLabChange = (id: string) => {
    setForm({ ...form, labId: id, alatId: '' })
    fetchPeralatan(id)
  }

  const selectedAlat = Array.isArray(peralatan) ? peralatan.find(p => p.id === form.alatId) : null

  // If cart has items, use them instead of the single alat selection
  const hasCart = cart.items.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const itemsToSubmit = hasCart ? cart.items : [
      { id: form.alatId, jumlah: Number(form.jumlah) }
    ]

    if (!form.labId || !form.tujuan || !form.tanggalPinjam) {
      toast.error('Mohon lengkapi semua field wajib')
      return
    }

    if (hasCart && cart.items.length === 0) {
      toast.error('Keranjang pinjaman kosong')
      return
    }

    if (!hasCart && !form.alatId) {
      toast.error('Pilih alat yang ingin dipinjam')
      return
    }

    setSaving(true)
    
    try {
      const res = await fetch('/api/peminjaman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: itemsToSubmit.map(it => ({ alatId: it.id, jumlah: it.jumlah }))
        })
      })
      
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Gagal mengirim permintaan')

      toast.success('Permintaan peminjaman berhasil dikirim!')
      cart.clearCart()
      router.push('/dashboard/peminjaman')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="text-slate-400 hover:text-white"
        >
          <ChevronLeft size={20} />
        </Button>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="text-teal-400" /> Form Peminjaman
          </h1>
          <p className="text-slate-400 text-sm">Lengkapi data untuk meminjam peralatan lab</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
            {/* Lab Selection - Important for Mahasiswa without lab */}
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Laboratorium*</Label>
              <Select value={form.labId} onValueChange={(v) => handleLabChange(v || '')}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-11">
                  <div className="flex items-center gap-2">
                    <FlaskConical size={16} className="text-indigo-400" />
                    <SelectValue placeholder="Pilih laboratorium...">
                      {labs.find(l => l.id === form.labId)?.nama || 'Pilih laboratorium...'}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {labs.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasCart ? (
              <div className="space-y-3">
                <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Alat yang akan dipinjam ({cart.items.length})</Label>
                {cart.items.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between group">
                    <div>
                      <p className="text-white font-bold">{item.namaAlat}</p>
                      <p className="text-slate-500 text-xs font-mono">{item.kodeAlat}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-700">
                        <button type="button" onClick={() => cart.updateJumlah(item.id, Math.max(1, item.jumlah - 1))} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white">
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{item.jumlah}</span>
                        <button type="button" onClick={() => cart.updateJumlah(item.id, Math.min(item.stokBaik, item.jumlah + 1))} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white">
                          <Plus size={14} />
                        </button>
                      </div>
                      <Button variant="ghost" size="icon" type="button" onClick={() => cart.removeItem(item.id)} className="text-red-400 hover:text-red-300">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" type="button" onClick={() => router.push('/dashboard/katalog')} className="w-full border-dashed border-slate-700 text-slate-400 hover:text-white">
                  + Tambah Alat Lainnya
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 space-y-2">
                  <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pilih Alat*</Label>
                  <Select 
                    value={form.alatId} 
                    onValueChange={(v) => setForm({...form, alatId: v || ''})}
                    disabled={!form.labId || loading}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-11">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-teal-500" />
                        <SelectValue placeholder={loading ? "Memuat alat..." : "Pilih alat yang ingin dipinjam..."} />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-80">
                      {peralatan.map(p => (
                        <SelectItem key={p.id} value={p.id} disabled={p.stokBaik <= 0}>
                          {p.namaAlat} ({p.kodeAlat}) - Tersedia: {p.stokBaik}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Jumlah*</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={form.jumlah}
                    onChange={(e) => setForm({...form, jumlah: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white h-11 text-center"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tanggal Pinjam*</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <Input 
                  type="date" 
                  value={form.tanggalPinjam}
                  onChange={(e) => setForm({...form, tanggalPinjam: e.target.value})}
                  className="pl-10 bg-slate-800 border-slate-700 text-white h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tujuan Peminjaman*</Label>
              <Textarea 
                placeholder="Misal: Praktikum Mikrokontroler, Tugas Akhir, dsb."
                value={form.tujuan}
                onChange={(e) => setForm({...form, tujuan: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Estimasi Tanggal Kembali (Opsional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <Input 
                  type="date" 
                  value={form.tanggalKembali}
                  onChange={(e) => setForm({...form, tanggalKembali: e.target.value})}
                  className="pl-10 bg-slate-800 border-slate-700 text-white h-11"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={saving || loading || (!form.alatId && !hasCart)}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 h-12 text-lg font-bold shadow-lg shadow-teal-500/20"
              >
                {saving ? 'Mengirim...' : (
                  <>
                    Kirim Permintaan <Send size={18} className="ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-5"
          >
            <h3 className="text-white font-bold flex items-center gap-2 mb-4">
              <Info size={18} className="text-teal-400" /> Informasi Alat
            </h3>
            {selectedAlat ? (
              <div className="space-y-4">
                <div className="aspect-video rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
                  {selectedAlat.fotoUrl ? (
                    <img src={selectedAlat.fotoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <Package size={48} />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Nama Alat</p>
                  <p className="text-white font-medium">{selectedAlat.namaAlat}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-slate-400 text-xs">Kode</p>
                    <p className="text-white text-sm font-mono">{selectedAlat.kodeAlat}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Stok Baik</p>
                    <p className="text-green-400 font-bold">{selectedAlat.stokBaik} unit</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-600">
                {loading && form.labId ? (
                   <Skeleton className="h-40 w-full bg-slate-800/50 rounded-xl" />
                ) : (
                  <>
                    <Package size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-xs">Pilih lab dan alat untuk detail</p>
                  </>
                )}
              </div>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20"
          >
            <h3 className="text-amber-400 font-bold flex items-center gap-2 mb-3">
              <AlertCircle size={18} /> Perhatian
            </h3>
            <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4">
              <li>Pastikan alat yang dipinjam dalam kondisi baik saat serah terima.</li>
              <li>Peminjaman harus disetujui oleh Kepala Lab atau Dosen.</li>
              <li>Keterlambatan pengembalian dapat dikenakan sanksi.</li>
              <li>Kerusakan alat adalah tanggung jawab peminjam.</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function PinjamPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
      </div>
    }>
      <PinjamForm />
    </Suspense>
  )
}
