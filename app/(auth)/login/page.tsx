'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ code?: string; msg: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError({ code: data.code, msg: data.error || 'Login gagal' })
        return
      }
      setUser(data.user)
      toast.success(`Selamat datang, ${data.user.nama}!`)
      router.push('/dashboard')
    } catch {
      setError({ msg: 'Terjadi kesalahan. Coba lagi.' })
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="glass-card p-8 fade-in-up">
      <h2 className="text-xl font-semibold text-white mb-2">Masuk ke Akun</h2>
      <p className="text-slate-400 text-sm mb-6">Gunakan email Gmail Anda</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-300">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nama@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-slate-300">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
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

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p>{error.msg}</p>

              {error.code === 'PENDING_APPROVAL' && (
                <p className="mt-1 text-xs text-amber-400">Akun Anda sedang menunggu persetujuan Kepala Lab.</p>
              )}
            </div>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full font-semibold mt-2"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
        >
          {loading ? (
            <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Masuk...</span>
          ) : (
            <span className="flex items-center gap-2"><LogIn size={16} />Masuk</span>
          )}
        </Button>
      </form>

      <p className="text-center text-slate-400 text-sm mt-6">
        Belum punya akun?{' '}
        <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
          Daftar di sini
        </Link>
      </p>
    </div>
  )
}
