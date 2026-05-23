'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, LogIn, AlertCircle, Lock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ code?: string; msg: string } | null>(null)

  // Forgot password state
  const [showForgotDialog, setShowForgotDialog] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [smtpNotConfigured, setSmtpNotConfigured] = useState(false)
  const [simulatedToken, setSimulatedToken] = useState('')

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
    } catch (err) {
      setError({ msg: 'Terjadi kesalahan. Coba lagi.' })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPasswordSubmit = async () => {
    if (!forgotEmail) return
    setForgotLoading(true)
    setSmtpNotConfigured(false)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === 'SMTP_NOT_CONFIGURED') {
          setSimulatedToken(data.token)
          setSmtpNotConfigured(true)
          setForgotSuccess(true)
          toast.warning('SMTP belum dikonfigurasi di .env.local!')
          return
        }
        throw new Error(data.error || 'Gagal mengirim konfirmasi')
      }
      setForgotSuccess(true)
      toast.success('Email reset password asli berhasil dikirim ke alamat Gmail Anda!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setForgotLoading(false)
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
          <div className="flex justify-between items-center">
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            <button 
              type="button" 
              onClick={() => {
                setForgotEmail('')
                setForgotSuccess(false)
                setSmtpNotConfigured(false)
                setShowForgotDialog(true)
              }}
              className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors bg-transparent border-none outline-none cursor-pointer"
            >
              Lupa Password?
            </button>
          </div>
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

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotDialog} onOpenChange={setShowForgotDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Lock size={20} className="text-blue-400" /> Lupa Password
            </DialogTitle>
          </DialogHeader>
          
          {forgotSuccess ? (
            <div className="space-y-4 py-2 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mx-auto">
                <CheckCircle size={24} />
              </div>
              <div className="space-y-2">
                {smtpNotConfigured ? (
                  <>
                    <p className="text-sm text-slate-300 text-left leading-relaxed">
                      Akun ditemukan! Namun email asli **belum terkirim** karena konfigurasi SMTP Gmail belum didefinisikan pada berkas <code className="text-amber-400 bg-amber-400/5 px-1 py-0.5 rounded font-mono text-xs">.env.local</code> Anda.
                    </p>
                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-left space-y-2 my-3 text-xs leading-relaxed">
                      <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">🛠️ CARA MENGAKTIFKAN EMAIL ASLI:</p>
                      <ol className="list-decimal pl-4 space-y-2 text-slate-300">
                        <li>Buka Google Akun pengirim Anda, lalu aktifkan <strong>Verifikasi 2 Langkah</strong>.</li>
                        <li>Masuk ke menu <strong>Sandi Aplikasi (App Passwords)</strong> di opsi Keamanan, buat sandi baru, dan salin kode 16 karakternya.</li>
                        <li>Buka berkas <code className="text-amber-400 font-mono">.env.local</code> Anda di VS Code, lalu tambahkan baris berikut:
                          <pre className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono text-emerald-400 mt-1 select-all">
SMTP_USER=emailpengirim@gmail.com
SMTP_PASS=sandiaplikasi16char
                          </pre>
                        </li>
                        <li>Mulai ulang dev server Anda (<code className="font-mono text-amber-400">npm run dev</code>).</li>
                      </ol>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-left space-y-1.5">
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">🔗 TAUTAN RESET SIMULASI (TESTING):</p>
                      <a 
                        href={`/reset-password?token=${simulatedToken}`}
                        className="text-xs text-blue-300 underline break-all block font-mono hover:text-blue-200"
                      >
                        /reset-password?token={simulatedToken}
                      </a>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-300">
                    Email konfirmasi reset password asli **berhasil dikirim** ke alamat Gmail <span className="font-bold text-white">{forgotEmail}</span>! Silakan periksa kotak masuk atau folder spam di Gmail Anda.
                  </p>
                )}
              </div>
              <Button 
                onClick={() => { setShowForgotDialog(false); setForgotSuccess(false); setSmtpNotConfigured(false) }} 
                className="w-full bg-slate-800 hover:bg-slate-700 text-white mt-4 h-11 font-semibold"
              >
                Tutup
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email" className="text-slate-300">Masukkan Email Akun Anda</Label>
                <Input 
                  id="forgot-email"
                  type="email"
                  placeholder="nama@gmail.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              
              <Button 
                onClick={handleForgotPasswordSubmit}
                disabled={forgotLoading || !forgotEmail}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 mt-4 font-semibold"
              >
                {forgotLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Mengirim...
                  </span>
                ) : (
                  'Kirim Email Konfirmasi'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
