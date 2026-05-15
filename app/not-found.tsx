'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FlaskConical, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 rounded-full opacity-10 blur-3xl bg-blue-500" />
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 rounded-full opacity-10 blur-3xl bg-indigo-500" />

      <div className="relative z-10 text-center max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/20">
            <FlaskConical size={48} className="text-white" />
          </div>

          <h1 className="text-8xl font-black text-white/5 absolute -top-12 left-1/2 -translate-x-1/2 select-none">404</h1>
          
          <h2 className="text-3xl font-bold text-white mb-3">Halaman Tidak Ditemukan</h2>
          <p className="text-slate-400 mb-8">
            Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan ke lokasi lain.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white px-4 h-8 text-sm font-medium transition-all cursor-pointer">
              <ArrowLeft size={18} className="mr-2" /> Kembali ke Dashboard
            </Link>
            <Link href="/" className="inline-flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 h-8 text-sm font-medium transition-all cursor-pointer">
              <Home size={18} className="mr-2" /> Beranda
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
