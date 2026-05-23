'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Token reset tidak valid atau tidak ditemukan di URL.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!token) return

    if (password.length < 8) {
      toast.error('Password minimal 8 karakter')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Password tidak cocok')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mereset password')
      }
      setSuccess(true)
      toast.success('Password berhasil diubah!')
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="glass-card p-8 text-center space-y-6 fade-in-up">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mx-auto">
          <CheckCircle size={32} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Password Berhasil Diubah!</h2>
          <p className="text-slate-400 text-sm">Anda sekarang dapat masuk ke akun Anda menggunakan password baru Anda.</p>
        </div>
        <Link href="/login" className="block w-full">
          <Button className="w-full bg-green-600 hover:bg-green-700 font-semibold h-11">
            Masuk Sekarang
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="glass-card p-8 fade-in-up">
      <h2 className="text-xl font-semibold text-white mb-2">Buat Password Baru</h2>
      <p className="text-slate-400 text-sm mb-6">Masukkan password baru Anda di bawah ini</p>

      {error ? (
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full border-slate-700 text-slate-300">
              Kembali ke Login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pass" className="text-slate-300">Password Baru</Label>
            <div className="relative">
              <Input
                id="pass"
                type={showPass ? 'text' : 'password'}
                placeholder="Min. 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPass" className="text-slate-300">Konfirmasi Password Baru</Label>
            <Input
              id="confirmPass"
              type="password"
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full font-semibold mt-4 h-11"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Memperbarui...
              </span>
            ) : (
              'Perbarui Password'
            )}
          </Button>
        </form>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="glass-card p-8 text-center text-slate-400">
        Memuat halaman reset...
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
