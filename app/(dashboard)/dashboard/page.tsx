'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Package, CheckCircle, AlertTriangle, Users, TrendingUp, 
  RefreshCw, ArrowLeftRight, FileText, ClipboardCheck, Info, Plus,
  QrCode, Search, X
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import StatCard from '@/components/ui/StatCard'
import StockBarChart from '@/components/charts/StockBarChart'
import ReportDoughnutChart from '@/components/charts/ReportDoughnutChart'
import TrendLineChart from '@/components/charts/TrendLineChart'
import ConditionPieChart from '@/components/charts/ConditionPieChart'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { QRScanner } from '@/components/ui/QRScanner'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface StatsData {
  totalAlat: number; stokBaik: number; stokRusak: number; stokPerbaikan: number
  totalUsers: number; pendingUsers: number; pendingLaporan: number; pendingPeminjaman: number
  activePeminjaman: number;
  myActiveLoans: number; myPendingLoans: number; myReports: number;
  kategoriGroups: Record<string, number>
  laporanStatus: Record<string, number>
  trend: { months: string[]; laporan: number[]; peminjaman: number[] }
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const router = useRouter()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const [scannedTool, setScannedTool] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [labName, setLabName] = useState<string>('')

  useEffect(() => {
    if (user?.labId) {
      fetch('/api/labs')
        .then(res => res.json())
        .then((data: any[]) => {
          if (Array.isArray(data)) {
            const lab = data.find(l => l.id === user.labId)
            if (lab) setLabName(lab.nama)
          }
        })
        .catch(() => {})
    }
  }, [user?.labId])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stats')
      if (res.ok) setStats(await res.json())
    } finally { setLoading(false) }
  }

  useEffect(() => { 
    fetchStats() 
    const interval = setInterval(fetchStats, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam'

  const isStaff = user?.role === 'KAJUR' || user?.role === 'KEPALA_LAB'
  const isKaLab = user?.role === 'KEPALA_LAB'
  const isMahasiswa = user?.role === 'MAHASISWA'
  const isDosen = user?.role === 'DOSEN'

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{greeting}, <span className="gradient-text">{user?.nama?.split(' ')[0]}</span> 👋</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-slate-400 text-sm">Dashboard {user?.role === 'KAJUR' || user?.role === 'KEPALA_LAB' ? 'Admin' : user?.role}</span>
            <div className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
              {user?.role === 'KAJUR' ? 'DEPARTEMEN' : `LAB: ${labName || '...'}`}
            </div>
          </div>
        </div>
        <button onClick={fetchStats} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-blue-400 transition-colors glass">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </motion.div>

      {/* Role-Specific Content */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isStaff ? (
          <>
            <motion.div variants={fadeUp} className="cursor-pointer">
              <Link href="/dashboard/peralatan">
                <StatCard title="Total Alat" value={stats?.totalAlat ?? '-'} icon={<Package size={22} />}
                  color="blue" sub="Unit terdaftar" loading={loading} />
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="cursor-pointer">
              <Link href="/dashboard/peralatan">
                <StatCard title="Stok Baik" value={stats?.stokBaik ?? '-'} icon={<CheckCircle size={22} />}
                  color="green" sub="Kondisi siap pakai" loading={loading} />
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="cursor-pointer">
              <Link href="/dashboard/persetujuan">
                <StatCard title="Perlu Tindakan" value={(stats?.pendingLaporan ?? 0) + (stats?.pendingPeminjaman ?? 0)}
                  icon={<AlertTriangle size={22} />} color="amber" sub="Peminjaman & Laporan" loading={loading} />
              </Link>
            </motion.div>
            {user?.role === 'KAJUR' ? (
              <motion.div variants={fadeUp} className="cursor-pointer">
                <Link href="/dashboard/users">
                  <StatCard title="Total User" value={stats?.totalUsers ?? '-'} icon={<Users size={22} />}
                    color="indigo" sub="Mahasiswa, Dosen & Kepala Lab" loading={loading} />
                </Link>
              </motion.div>
            ) : (
              <motion.div variants={fadeUp} className="cursor-pointer">
                <Link href="/dashboard/peminjaman">
                  <StatCard title="Peminjaman" value={stats?.activePeminjaman ?? '-'} icon={<ArrowLeftRight size={22} />}
                    color="indigo" sub="Total transaksi aktif" loading={loading} />
                </Link>
              </motion.div>
            )}
          </>
        ) : (
          <>
            <motion.div variants={fadeUp} className="cursor-pointer">
              <Link href="/dashboard/peminjaman">
                <StatCard title="Pinjaman Aktif" value={stats?.myActiveLoans ?? '-'} icon={<ArrowLeftRight size={22} />}
                  color="indigo" sub="Sedang Anda pinjam" loading={loading} />
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="cursor-pointer">
              <Link href="/dashboard/peminjaman">
                <StatCard title="Menunggu" value={stats?.myPendingLoans ?? '-'} icon={<RefreshCw size={22} />}
                  color="amber" sub="Menunggu persetujuan" loading={loading} />
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="cursor-pointer">
              <Link href="/dashboard/laporan">
                <StatCard title="Laporan Saya" value={stats?.myReports ?? '-'} icon={<FileText size={22} />}
                  color="blue" sub="Total laporan kerusakan" loading={loading} />
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} className="cursor-pointer">
              <Link href="/dashboard/peralatan">
                <StatCard title="Alat Lab" value={stats?.totalAlat ?? '-'} icon={<Package size={22} />}
                  color="green" sub="Total alat tersedia" loading={loading} />
              </Link>
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Quick Actions for Mahasiswa, Dosen, & KaLab (Borrowing/Reporting) */}
      {(isMahasiswa || isDosen || isKaLab) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(isMahasiswa || isDosen) && (
            <div className="glass-card p-6 flex items-center justify-between group hover:border-blue-500/50 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold">Pinjam Alat</h3>
                  <p className="text-slate-500 text-xs">Ajukan peminjaman peralatan lab</p>
                </div>
              </div>
              <Link href="/dashboard/katalog">
                <Button variant="ghost" className="text-blue-400">Pilih Alat</Button>
              </Link>
            </div>
          )}
          <div className="glass-card p-6 flex items-center justify-between group hover:border-amber-500/50 transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold">Lapor Kerusakan</h3>
                <p className="text-slate-500 text-xs">Laporkan masalah pada alat lab</p>
              </div>
            </div>
            <Link href="/dashboard/laporan">
              <Button variant="ghost" className="text-amber-400">Buat Laporan</Button>
            </Link>
          </div>

          {/* Admin Scan Action (Kepala Lab Only) */}
          {isKaLab && (
            <div 
              onClick={() => setShowScanner(true)}
              className="glass-card p-6 flex items-center justify-between group hover:border-indigo-500/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  <QrCode size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold">Scan QR Alat</h3>
                  <p className="text-slate-500 text-xs">Identifikasi alat via kamera</p>
                </div>
              </div>
              <Button variant="ghost" className="text-indigo-400">Buka Kamera</Button>
            </div>
          )}
        </motion.div>
      )}

      {/* QR Scanner Component */}
      {showScanner && (
        <QRScanner 
          onClose={() => setShowScanner(false)}
          onScan={async (text) => {
            const qrText = text.trim()
            if (qrText.startsWith('ITEM:')) {
              const code = qrText.replace('ITEM:', '')
              setIsScanning(true)
              try {
                const res = await fetch(`/api/peralatan?kodeAlat=${code}`)
                const data = await res.json()
                if (data && data.length > 0) {
                  setScannedTool(data[0])
                } else {
                  toast.error(`Alat dengan kode ${code} tidak ditemukan.`)
                }
              } catch (err) {
                console.error(err)
                toast.error("Gagal memproses data alat.")
              } finally {
                setIsScanning(false)
                setShowScanner(false)
              }
            } else if (qrText.startsWith('VERIFY_GRP:')) {
              const groupKey = qrText.replace('VERIFY_GRP:', '')
              setShowScanner(false)
              toast.success("QR Surat Peminjaman terdeteksi. Mengalihkan...")
              router.push(`/dashboard/peminjaman?verifyGrp=${groupKey}`)
            } else {
              toast.error("Format QR Code tidak valid.")
              setShowScanner(false)
            }
          }}
        />
      )}

      {/* Scanned Result Dialog */}
      {scannedTool && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-white font-bold">Detail Alat Scanned</h3>
              <Button variant="ghost" size="icon" onClick={() => setScannedTool(null)} className="text-slate-400">
                <X size={20} />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                  <Package size={32} />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg leading-tight">{scannedTool.namaAlat}</h4>
                  <p className="text-blue-400 font-mono text-sm">{scannedTool.kodeAlat}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/50 p-2 rounded-lg">
                  <p className="text-slate-500 mb-1">KATEGORI</p>
                  <p className="text-white font-semibold">{scannedTool.kategori}</p>
                </div>
                <div className="bg-slate-800/50 p-2 rounded-lg">
                  <p className="text-slate-500 mb-1">STOK BAIK</p>
                  <p className="text-green-400 font-bold">{scannedTool.stokBaik} Unit</p>
                </div>
                <div className="bg-slate-800/50 p-2 rounded-lg col-span-2">
                  <p className="text-slate-500 mb-1">LABORATORIUM</p>
                  <p className="text-white">{scannedTool.namaLab}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-950/50 flex gap-2">
              <Button 
                onClick={() => setScannedTool(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white"
              >
                Tutup
              </Button>
              <Link href={`/dashboard/peralatan?search=${scannedTool.namaAlat}`} className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Kelola Alat
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      )}

      {/* Alerts for Staff */}
      {isStaff && (stats?.pendingUsers ?? 0) > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500">
              <Users size={20} />
            </div>
            <div>
              <p className="text-amber-200 text-sm font-bold">{stats?.pendingUsers} User Menunggu Persetujuan</p>
              <p className="text-amber-200/60 text-xs">Ada mahasiswa atau dosen baru yang mendaftar di lab Anda.</p>
            </div>
          </div>
          <Link href="/dashboard/persetujuan">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">Lihat Semua</Button>
          </Link>
        </motion.div>
      )}

      {/* Main Stats Charts (Staff only or limited for Mahasiswa) */}
      <div className={`grid grid-cols-1 ${isStaff ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${isStaff ? 'lg:col-span-2' : ''} glass-card p-6 flex flex-col`}>
          <h3 className="text-white font-bold mb-6 flex items-center gap-2">
            <div className="w-1.5 h-6 rounded-full bg-blue-500" /> {isStaff ? 'Stok Per Kategori' : 'Kategori Alat Tersedia'}
          </h3>
          <div className="flex-1 min-h-[250px]">
            <StockBarChart data={stats?.kategoriGroups ?? {}} loading={loading} />
          </div>
        </motion.div>

        {isStaff && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 flex flex-col">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 rounded-full bg-green-500" /> Kondisi Alat Saat Ini
            </h3>
            <div className="flex-1 min-h-[250px] flex items-center justify-center">
              <ConditionPieChart data={{ 
                stokBaik: stats?.stokBaik ?? 0, 
                stokRusak: stats?.stokRusak ?? 0, 
                stokPerbaikan: stats?.stokPerbaikan ?? 0 
              }} loading={loading} />
            </div>
          </motion.div>
        )}
      </div>

      {isStaff && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 flex flex-col">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 rounded-full bg-amber-500" /> Status Laporan Lab
            </h3>
            <div className="flex-1 min-h-[280px] flex items-center justify-center">
              <ReportDoughnutChart data={stats?.laporanStatus ?? {}} loading={loading} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 flex flex-col">
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 rounded-full bg-indigo-500" /> Tren Aktivitas Lab (6 Bulan)
            </h3>
            <div className="h-[280px]">
              <TrendLineChart data={stats?.trend ?? { months: [], laporan: [], peminjaman: [] }} loading={loading} />
            </div>
          </motion.div>
        </div>
      )}

      {!isStaff && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 flex flex-col">
          <h3 className="text-white font-bold mb-6 flex items-center gap-2">
            <div className="w-1.5 h-6 rounded-full bg-indigo-500" /> Panduan Penggunaan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <p className="text-white text-sm font-bold flex items-center gap-2"><ClipboardCheck size={14} className="text-blue-400" /> Prosedur Peminjaman</p>
              <p className="text-slate-400 text-xs mt-1">Pilih alat, isi formulir, dan tunggu persetujuan Kepala Lab sebelum mengambil alat.</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <p className="text-white text-sm font-bold flex items-center gap-2"><Info size={14} className="text-amber-400" /> Laporan Kerusakan</p>
              <p className="text-slate-400 text-xs mt-1">Wajib melaporkan kerusakan alat segera setelah penggunaan agar dapat diproses perbaikannya.</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
