'use client'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="glass-card p-10 max-w-lg w-full text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 border border-red-500/20"
        >
          <AlertTriangle size={40} />
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Terjadi Kesalahan Sistem</h2>
          <p className="text-slate-400 text-sm">
            Maaf, sistem mengalami kendala saat memuat halaman ini. Jangan khawatir, data Anda tetap aman.
          </p>
        </div>

        {error.digest && (
          <div className="py-2 px-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-[10px] text-slate-500 font-mono">ERROR_ID: {error.digest}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button 
            onClick={() => reset()}
            className="bg-slate-700 hover:bg-slate-600 text-white"
          >
            <RefreshCw size={18} className="mr-2" /> Coba Lagi
          </Button>
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            variant="outline"
            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
          >
            <Home size={18} className="mr-2" /> Ke Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
