'use client'
import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2, FlaskConical, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Role = 'MAHASISWA' | 'DOSEN' | 'KEPALA_LAB'

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [form, setForm] = useState({ 
    nama: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    role: (searchParams.get('role') as Role) || 'MAHASISWA', 
    nim: '', 
    nip: '', 
    labId: searchParams.get('labId') || '',
    accessCode: searchParams.get('code') || '' 
  })
  const [labs, setLabs] = useState<any[]>([])
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    fetch('/api/labs').then(r => r.json()).then(setLabs).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Password tidak cocok'); return }
    if (!form.email.endsWith('@gmail.com')) { setError('Gunakan email Gmail (@gmail.com)'); return }
    if (form.password.length < 8) { setError('Password minimal 8 karakter'); return }
    if (form.role === 'KEPALA_LAB' && !form.labId) { setError('Silakan pilih laboratorium Anda'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { 
        setError(data.error || 'Gagal mendaftar')
        toast.error(data.error || 'Gagal mendaftar')
        return 
      }
      setSuccess(true)
      toast.success('Pendaftaran berhasil! Akun Anda sudah aktif.')
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
      toast.error('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="glass-card p-8 text-center fade-in-up">
        <div className="flex justify-center mb-4">
          <CheckCircle2 size={56} className="text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Pendaftaran Berhasil!</h2>
        <p className="text-slate-400 text-sm mb-4">
          Pendaftaran Anda berhasil! Akun Anda sudah aktif dan dapat langsung digunakan untuk masuk ke dashboard.
        </p>
        <Button onClick={() => router.push('/login')} className="w-full" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
          Kembali ke Login
        </Button>
      </div>
    )
  }

  return (
    <div className="glass-card p-8 fade-in-up">
      <h2 className="text-xl font-semibold text-white mb-2">Buat Akun Baru</h2>
      <p className="text-slate-400 text-sm mb-6">Daftar sebagai anggota lab</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-slate-300">Nama Lengkap</Label>
          <Input value={form.nama} onChange={(e) => set('nama', e.target.value)} required placeholder="Nama Lengkap" className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-slate-300">Email Gmail</Label>
          <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required placeholder="nama@gmail.com" className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500" />
        </div>

        {form.role === 'KEPALA_LAB' && (
          <div className="space-y-1.5">
            <Label className="text-slate-300">Pilih Laboratorium*</Label>
            <Select value={form.labId} onValueChange={(v) => set('labId', v)} required>
              <SelectTrigger className={`bg-slate-800/50 border-slate-700 text-white ${!form.labId && error ? 'border-red-500/50' : ''}`}>
                <div className="flex items-center gap-2">
                  <FlaskConical size={14} className="text-blue-500" />
                  <SelectValue placeholder="Pilih lab tempat Anda bernaung..." />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                {labs.length > 0 ? labs.map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.nama} ({l.kode})</SelectItem>
                )) : (
                  <div className="p-2 text-xs text-slate-500">Memuat laboratorium...</div>
                )}
              </SelectContent>
            </Select>
            {!form.labId && <p className="text-[10px] text-slate-500 italic">*Wajib memilih laboratorium</p>}
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-slate-300">Role*</Label>
          <Select value={form.role} onValueChange={(v) => {
            set('role', v)
            if (v === 'MAHASISWA') {
              set('nip', '')
              set('accessCode', '')
            } else if (v === 'DOSEN') {
              set('nim', '')
              set('accessCode', '')
            } else {
              set('nim', '')
            }
          }}>
            <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="MAHASISWA">Mahasiswa</SelectItem>
              <SelectItem value="DOSEN">Dosen</SelectItem>
              <SelectItem value="KEPALA_LAB">Admin Laboratorium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {form.role === 'MAHASISWA' && (
          <div className="space-y-1.5">
            <Label className="text-slate-300">NIM*</Label>
            <Input value={form.nim} onChange={(e) => set('nim', e.target.value)} required placeholder="NIM Mahasiswa" className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500" />
          </div>
        )}
        {(form.role === 'DOSEN' || form.role === 'KEPALA_LAB') && (
          <div className="space-y-1.5">
            <Label className="text-slate-300">NIP*</Label>
            <Input value={form.nip} onChange={(e) => set('nip', e.target.value)} required placeholder="NIP Dosen/Admin" className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500" />
          </div>
        )}

        {form.role === 'KEPALA_LAB' && (
          <div className="space-y-1.5">
            <Label className="text-blue-400 font-medium">Kode Undangan*</Label>
            <Input type="text" value={form.accessCode} onChange={(e) => set('accessCode', e.target.value)} required={form.role === 'KEPALA_LAB'} placeholder="Masukkan kode undangan" className="bg-slate-800/50 border-blue-500/30 text-white placeholder:text-slate-600 font-mono tracking-widest" />
            <p className="text-[10px] text-slate-500 italic">*Hubungi Kajur untuk mendapatkan kode ini</p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-slate-300">Password</Label>
          <div className="relative">
            <Input type={showPass ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} required placeholder="Min. 8 karakter" className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 pr-10" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-slate-300">Konfirmasi Password</Label>
          <Input type="password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} required placeholder="Ulangi password" className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500" />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={15} className="shrink-0" />{error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full font-semibold mt-2" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
          {loading ? <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Mendaftar...</span>
            : <span className="flex items-center gap-2"><UserPlus size={16} />Daftar</span>}
        </Button>
      </form>

      <p className="text-center text-slate-400 text-sm mt-6">
        Sudah punya akun?{' '}
        <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Masuk</Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="glass-card p-8 flex items-center justify-center">
        <RefreshCw size={24} className="animate-spin text-blue-500" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  )
}
