'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, Search, Filter, Info, 
  Package, CheckCircle, AlertTriangle, ClipboardList
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { useCartStore } from '@/store/cart'
import { ShoppingCart, Plus as PlusIcon, Minus as MinusIcon, Trash2 } from 'lucide-react'

interface Peralatan {
  id: string
  namaAlat: string
  kategori: string
  merek: string | null
  kodeAlat: string
  stokTotal: number
  stokBaik: number
  stokRusak: number
  namaLab: string | null
  prodi: string | null
  fotoUrl: string | null
}

export default function KatalogPage() {
  const [data, setData] = useState<Peralatan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [kategoriFilter, setKategoriFilter] = useState('all')
  const [labFilter, setLabFilter] = useState('all')
  const [labs, setLabs] = useState<{id: string, nama: string}[]>([])
  const [showDetail, setShowDetail] = useState<Peralatan | null>(null)
  const user = useAuthStore((s) => s.user)
  const cart = useCartStore()
  const isKepalaLab = user?.role === 'KEPALA_LAB'
  const canBorrow = user?.role !== 'KAJUR' && user?.role !== 'KEPALA_LAB'
  const [isCartOpen, setIsCartOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (kategoriFilter !== 'all') params.append('kategori', kategoriFilter)
    // KEPALA_LAB: jangan kirim labId filter — API sudah otomatis membatasi ke lab mereka sendiri
    if (!isKepalaLab && labFilter !== 'all') params.append('labId', labFilter)
    
    try {
      const res = await fetch(`/api/peralatan?${params.toString()}`)
      if (res.ok) setData(await res.json())
    } catch (err) {
      toast.error('Gagal mengambil katalog')
    } finally {
      setLoading(false)
    }
  }, [search, kategoriFilter, labFilter, isKepalaLab])

  useEffect(() => {
    const timer = setTimeout(fetchData, 500)
    return () => clearTimeout(timer)
  }, [fetchData])

  useEffect(() => {
    fetch('/api/labs').then(r => r.json()).then(d => setLabs(Array.isArray(d) ? d : []))
  }, [])

  const kategoriList = Array.from(new Set(data.map(d => d.kategori))).filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="text-teal-400" /> Katalog Alat Laboratorium
        </h1>
        <p className="text-slate-400 text-sm mt-1">Cari dan lihat informasi alat yang tersedia untuk dipinjam</p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <Input 
            placeholder="Cari nama alat..." 
            className="pl-10 bg-slate-800/40 border-slate-700 text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={kategoriFilter} onValueChange={(value) => setKategoriFilter(value ?? 'all')}>
          <SelectTrigger className="w-full md:w-64 bg-slate-800/40 border-slate-700 text-white">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-500" />
              <SelectValue placeholder="Semua Kategori" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white">
            <SelectItem value="all">Semua Kategori</SelectItem>
            {kategoriList.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>

        {!isKepalaLab ? (
          <Select value={labFilter} onValueChange={(value) => setLabFilter(value ?? 'all')}>
            <SelectTrigger className="w-full md:w-64 bg-slate-800/40 border-slate-700 text-white">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-slate-500" />
                <SelectValue placeholder="Semua Lab" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="all">Semua Lab</SelectItem>
              {labs.map(l => <SelectItem key={l.id} value={l.id}>{l.nama}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-2 w-full md:w-64 px-3 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold">
            <BookOpen size={16} />
            <span>{labs.find(l => l.id === user?.labId)?.nama || 'Lab Anda'}</span>
          </div>
        )}
      </div>

      {/* List View */}
      <div className="space-y-3">
        {loading && data.length === 0 ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full bg-slate-800/50 rounded-xl" />
          ))
        ) : (
          <AnimatePresence>
            {data.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="glass-card p-4 flex flex-col md:flex-row items-start md:items-center gap-4 hover:border-teal-500/30 transition-all group"
              >
                {/* Icon/Mini Thumbnail */}
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-teal-400 border border-slate-700">
                  <Package size={24} />
                </div>

                {/* Info Utama */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white font-bold text-base truncate">{item.namaAlat}</h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      {item.kategori}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                    <span className="font-mono">{item.kodeAlat}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span>{item.namaLab || 'Semua Lab'}</span>
                  </div>
                </div>

                {/* Stok & Status */}
                <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1 px-4 border-l border-slate-800/50">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={14} className={item.stokBaik > 0 ? 'text-green-500' : 'text-slate-600'} />
                    <span className={`text-xs font-bold ${item.stokBaik > 0 ? 'text-slate-300' : 'text-slate-600'}`}>
                      {item.stokBaik} <span className="font-normal text-slate-500">Tersedia</span>
                    </span>
                  </div>
                  {item.stokBaik === 0 && (
                    <span className="text-[10px] text-red-500/70 font-medium italic">Stok Habis</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 md:flex-none text-slate-400 hover:text-white hover:bg-slate-800 h-9"
                    onClick={() => setShowDetail(item)}
                  >
                    <Info size={16} className="mr-1.5" /> Detail
                  </Button>
                  {canBorrow && (
                    <Button 
                      disabled={item.stokBaik === 0}
                      onClick={() => {
                        cart.addItem({
                          id: item.id,
                          namaAlat: item.namaAlat,
                          kodeAlat: item.kodeAlat,
                          jumlah: 1,
                          stokBaik: item.stokBaik
                        })
                        toast.success(`${item.namaAlat} ditambahkan ke keranjang`)
                      }}
                      className="flex-1 md:flex-none bg-teal-600/20 hover:bg-teal-600 text-teal-400 hover:text-white border border-teal-600/30 text-xs h-9"
                    >
                      <ShoppingCart size={16} className="mr-1.5" /> 
                      {cart.items.find(i => i.id === item.id) ? 'Tambah Lagi' : 'Pinjam Alat'}
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={(o) => !o && setShowDetail(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{showDetail?.namaAlat}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {showDetail?.fotoUrl && (
              <div className="h-48 bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
                <img src={showDetail.fotoUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Kode Alat</p>
                <p className="text-white text-sm font-mono">{showDetail?.kodeAlat}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Kategori</p>
                <p className="text-white text-sm">{showDetail?.kategori}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Laboratorium</p>
                <p className="text-white text-sm">{showDetail?.namaLab || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Program Studi</p>
                <p className="text-white text-sm">{showDetail?.prodi || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Merek</p>
                <p className="text-white text-sm">{showDetail?.merek || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Tersedia</p>
                <p className={`text-sm font-bold ${showDetail?.stokBaik ?? 0 > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {showDetail?.stokBaik} unit
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowDetail(null)} className="border-slate-700 bg-transparent text-slate-300">Tutup</Button>
            {canBorrow && (
              <Link href={`/dashboard/pinjam?alatId=${showDetail?.id}`}>
                <Button disabled={showDetail?.stokBaik === 0} className="bg-teal-600 hover:bg-teal-700">
                  Pinjam Sekarang
                </Button>
              </Link>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Floating Cart Button */}
      <AnimatePresence>
        {cart.items.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]"
          >
            <Button 
              size="lg"
              onClick={() => setIsCartOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-8 shadow-2xl shadow-teal-500/20 border border-teal-400/20 h-14"
            >
              <ShoppingCart size={20} className="mr-2" />
              Lihat Keranjang
              <span className="ml-3 w-6 h-6 rounded-full bg-white text-teal-600 flex items-center justify-center text-xs font-bold">
                {cart.items.length}
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="text-teal-400" /> Keranjang Peminjaman
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {cart.items.length === 0 ? (
              <p className="text-center text-slate-500 py-8">Keranjang kosong</p>
            ) : (
              cart.items.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{item.namaAlat}</p>
                    <p className="text-slate-500 text-[10px]">{item.kodeAlat}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-700">
                    <button 
                      onClick={() => cart.updateJumlah(item.id, Math.max(1, item.jumlah - 1))}
                      className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white"
                    >
                      <MinusIcon size={14} />
                    </button>
                    <span className="w-8 text-center text-xs font-bold">{item.jumlah}</span>
                    <button 
                      onClick={() => cart.updateJumlah(item.id, Math.min(item.stokBaik, item.jumlah + 1))}
                      className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white"
                    >
                      <PlusIcon size={14} />
                    </button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => cart.removeItem(item.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsCartOpen(false)} className="flex-1 border-slate-700 text-slate-300">
              Batal
            </Button>
            <Link href="/dashboard/pinjam" className="flex-1">
              <Button disabled={cart.items.length === 0} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                Lanjut Pinjam
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
