'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, FileSpreadsheet, FileText, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

function useDownload(endpoint: string, filename: string) {
  const [loading, setLoading] = useState(false)

  const download = async () => {
    setLoading(true)
    try {
      const res = await fetch(endpoint)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Gagal mengunduh data')
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success(`${filename} berhasil diunduh`)
    } catch {
      toast.error('Gagal mengunduh. Periksa koneksi Anda.')
    } finally {
      setLoading(false)
    }
  }

  return { loading, download }
}

export default function ExportPage() {
  const date = new Date().toISOString().split('T')[0]
  const inventaris = useDownload('/api/export', `peralatan_${date}.xlsx`)
  const peminjaman = useDownload('/api/export/peminjaman', `peminjaman_${date}.xlsx`)
  const laporan = useDownload('/api/export/laporan', `laporan_kerusakan_${date}.xlsx`)

  const cards = [
    {
      title: 'Laporan Inventaris Lengkap',
      desc: 'Daftar semua peralatan, kode, kategori, stok, dan kondisi terbaru',
      icon: FileSpreadsheet,
      iconColor: 'text-teal-400',
      iconBg: 'bg-teal-500/10 border-teal-500/20',
      btnStyle: 'from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 shadow-teal-500/20',
      label: 'Download Inventaris',
      ...inventaris,
    },
    {
      title: 'Laporan Peminjaman',
      desc: 'Seluruh riwayat peminjaman alat beserta status dan keterangan',
      icon: FileText,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      btnStyle: 'from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-500/20',
      label: 'Download Peminjaman',
      ...peminjaman,
    },
    {
      title: 'Laporan Kerusakan',
      desc: 'Riwayat semua laporan kerusakan alat beserta status penanganan',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      btnStyle: 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/20',
      label: 'Download Laporan Kerusakan',
      ...laporan,
    },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Download className="text-teal-400" /> Export Data
        </h1>
        <p className="text-slate-400 text-sm mt-1">Unduh laporan dan data inventaris dalam format Excel (.xlsx)</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-5">
        {cards.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5"
            >
              <div className={`w-14 h-14 rounded-2xl ${card.iconBg} border flex items-center justify-center shrink-0`}>
                <Icon size={28} className={card.iconColor} />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-white font-bold text-base">{card.title}</h3>
                <p className="text-slate-400 text-sm mt-1 mb-4">{card.desc}</p>
                <Button
                  onClick={card.download}
                  disabled={card.loading}
                  className={`bg-gradient-to-r ${card.btnStyle} shadow-lg font-bold px-6`}
                >
                  {card.loading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw size={15} className="animate-spin" /> Mengunduh...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Download size={15} /> {card.label}
                    </span>
                  )}
                </Button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
