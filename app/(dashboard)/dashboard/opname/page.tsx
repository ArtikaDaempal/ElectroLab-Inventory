'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckSquare, AlertTriangle, Save, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/auth'

import { useRouter } from 'next/navigation'

interface Peralatan {
  id: string
  namaAlat: string
  kodeAlat: string
  stokBaik: number
  stokRusak: number
  stokButuhPerbaikan: number
  kategori: string
}

export default function OpnamePage() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()

  useEffect(() => {
    if (user && user.role === 'KAJUR') {
      toast.error('Akses ditolak: Hanya Admin Lab yang dapat melakukan Opname')
      router.push('/dashboard')
    }
  }, [user, router])

  const [data, setData] = useState<Peralatan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updates, setUpdates] = useState<Record<string, { stokBaik: number; stokRusak: number; stokButuhPerbaikan: number }>>({})

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/peralatan?labId=${user?.labId || ''}`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
        const initUpdates: Record<string, any> = {}
        result.forEach((item: Peralatan) => {
          initUpdates[item.id] = { 
            stokBaik: item.stokBaik, 
            stokRusak: item.stokRusak,
            stokButuhPerbaikan: item.stokButuhPerbaikan || 0
          }
        })
        setUpdates(initUpdates)
      }
    } catch {
      toast.error('Gagal mengambil data peralatan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.labId) fetchData()
  }, [user?.labId])

  const handleUpdate = (id: string, field: 'stokBaik' | 'stokRusak' | 'stokButuhPerbaikan', value: string) => {
    const num = parseInt(value) || 0
    setUpdates(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: Math.max(0, num) }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payloads = Object.keys(updates).map(id => ({
        id,
        stokBaik: updates[id].stokBaik,
        stokRusak: updates[id].stokRusak,
        stokButuhPerbaikan: updates[id].stokButuhPerbaikan,
      }))
      
      const res = await fetch('/api/opname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payloads })
      })
      
      if (!res.ok) throw new Error('Gagal menyimpan hasil opname')
      toast.success('Hasil Stock Opname berhasil disimpan!')
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="text-teal-400" /> Stock Opname
          </h1>
          <p className="text-slate-400 text-sm mt-1">Lakukan pengecekan fisik dan sesuaikan jumlah alat di lab Anda.</p>
        </motion.div>
        
        <Button 
          onClick={handleSave} 
          disabled={saving || loading || data.length === 0}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          {saving ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
          Simpan Opname
        </Button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-bold">Kode Alat</th>
                <th className="px-6 py-4 font-bold">Nama Alat</th>
                <th className="px-6 py-4 font-bold">Kategori</th>
                <th className="px-6 py-4 font-bold text-center">Fisik Baik</th>
                <th className="px-6 py-4 font-bold text-center">Butuh Perbaikan</th>
                <th className="px-6 py-4 font-bold text-center">Fisik Rusak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4"><Skeleton className="h-10 w-full bg-slate-800/50" /></td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500">Tidak ada data alat di lab ini.</td>
                </tr>
              ) : (
                data.map(item => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{item.kodeAlat}</td>
                    <td className="px-6 py-4 font-medium text-white">{item.namaAlat}</td>
                    <td className="px-6 py-4 text-xs">{item.kategori}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <input 
                          type="number" 
                          min="0"
                          value={updates[item.id]?.stokBaik ?? 0}
                          onChange={(e) => handleUpdate(item.id, 'stokBaik', e.target.value)}
                          className="w-20 bg-slate-900 border border-slate-700 rounded-md px-3 py-1 text-center text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <input 
                          type="number" 
                          min="0"
                          value={updates[item.id]?.stokButuhPerbaikan ?? 0}
                          onChange={(e) => handleUpdate(item.id, 'stokButuhPerbaikan', e.target.value)}
                          className="w-20 bg-slate-900 border border-slate-700 rounded-md px-3 py-1 text-center text-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <input 
                          type="number" 
                          min="0"
                          value={updates[item.id]?.stokRusak ?? 0}
                          onChange={(e) => handleUpdate(item.id, 'stokRusak', e.target.value)}
                          className="w-20 bg-slate-900 border border-slate-700 rounded-md px-3 py-1 text-center text-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
