'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, Mail, Shield, Calendar, 
  Lock, Edit3, Save, Camera, Key, Eye, EyeOff, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function ProfilPage() {
  const { user, setUser } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showOldPw, setShowOldPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [form, setForm] = useState({
    nama: user?.nama || '',
    nip: user?.nip || '',
    nim: user?.nim || '',
  })

  // Sync form when user changes
  useEffect(() => {
    setForm({ nama: user?.nama || '', nip: user?.nip || '', nim: user?.nim || '' })
  }, [user])

  const [pwForm, setPwForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nama.trim()) { toast.error('Nama tidak boleh kosong'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Profil berhasil diperbarui!')
        setUser({ ...user!, ...data })
        setEditing(false)
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui profil')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pwForm.oldPassword) { toast.error('Masukkan password saat ini'); return }
    if (pwForm.newPassword.length < 8) { toast.error('Password baru minimal 8 karakter'); return }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Password baru tidak cocok')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pwForm)
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Password berhasil diubah!')
        setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <User className="text-teal-400" /> Profil Saya
        </h1>
        <p className="text-slate-400 text-sm mt-1">Kelola informasi akun dan keamanan Anda</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: User Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6 flex flex-col items-center text-center space-y-4 h-fit"
        >
          <div className="relative group">
            <Avatar className="w-32 h-32 border-4 border-teal-500/20 shadow-2xl">
              <AvatarImage src="" />
              <AvatarFallback className="bg-slate-800 text-teal-400 text-4xl font-bold">
                {user?.nama?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 p-2 rounded-full bg-teal-500 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={16} />
            </button>
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-white">{user?.nama}</h2>
            <p className="text-teal-400 text-sm font-medium">{user?.role?.replace('_', ' ')}</p>
          </div>

          <div className="w-full pt-4 space-y-3 text-left">
            <div className="flex items-center gap-3 text-slate-400">
              <Mail size={16} className="text-teal-500/50" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Email</p>
                <p className="text-xs truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <Shield size={16} className="text-teal-500/50" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">ID / NIP / NIM</p>
                <p className="text-xs">{user?.nip || user?.nim || user?.id.substring(0, 8)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <Calendar size={16} className="text-teal-500/50" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Bergabung</p>
                <p className="text-xs">{new Date(user?.createdAt || '').toLocaleDateString('id-ID', { month:'long', year:'numeric' })}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 size={18} className="text-teal-400" /> Informasi Pribadi
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setEditing(!editing)}
                className="text-teal-400 hover:bg-teal-500/10"
              >
                {editing ? 'Batal' : 'Edit Profil'}
              </Button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs">Nama Lengkap</Label>
                <Input 
                  value={form.nama} 
                  disabled={!editing}
                  onChange={(e) => setForm({...form, nama: e.target.value})}
                  className="bg-slate-800/50 border-slate-700 text-white disabled:opacity-70"
                />
              </div>
              
              {user?.role === 'MAHASISWA' ? (
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">NIM (Nomor Induk Mahasiswa)</Label>
                  <Input 
                    value={form.nim} 
                    disabled={!editing}
                    onChange={(e) => setForm({...form, nim: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white disabled:opacity-70 font-mono"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">NIP (Nomor Induk Pegawai)</Label>
                  <Input 
                    value={form.nip} 
                    disabled={!editing}
                    onChange={(e) => setForm({...form, nip: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white disabled:opacity-70 font-mono"
                  />
                </div>
              )}

              {editing && (
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-700 w-full md:w-auto"
                >
                  <Save size={16} className="mr-2" /> Simpan Perubahan
                </Button>
              )}
            </form>
          </motion.div>

          {/* Password Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <Key size={18} className="text-amber-400" /> Keamanan Akun
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs">Password Saat Ini</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <Input 
                    type={showOldPw ? 'text' : 'password'}
                    value={pwForm.oldPassword}
                    onChange={(e) => setPwForm({...pwForm, oldPassword: e.target.value})}
                    className="pl-10 pr-10 bg-slate-800/50 border-slate-700 text-white"
                    placeholder="Masukkan password saat ini"
                  />
                  <button type="button" onClick={() => setShowOldPw(!showOldPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showOldPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">Password Baru</Label>
                  <div className="relative">
                    <Input 
                      type={showNewPw ? 'text' : 'password'}
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm({...pwForm, newPassword: e.target.value})}
                      className="bg-slate-800/50 border-slate-700 text-white pr-10"
                      placeholder="Min. 8 karakter"
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">Konfirmasi Password Baru</Label>
                  <Input 
                    type="password" 
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({...pwForm, confirmPassword: e.target.value})}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    placeholder="Ulangi password baru"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={loading || !pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword}
                variant="outline"
                className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 w-full md:w-auto"
              >
                {loading ? <><RefreshCw size={14} className="animate-spin mr-2" />Mengubah...</> : 'Ganti Password'}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
