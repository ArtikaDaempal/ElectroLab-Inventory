'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Search, UserCheck, UserX, 
  Trash2, RefreshCw, FlaskConical, MoreVertical, Link as LinkIcon, Copy, Check
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/auth'
import DeleteConfirm from '@/components/ui/DeleteConfirm'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface UserData {
  id: string
  email: string
  nama: string
  nip: string | null
  nim: string | null
  role: 'KEPALA_LAB' | 'DOSEN' | 'MAHASISWA' | 'KAJUR'
  aktif: boolean
  createdAt: string
  labId: string | null
  fotoUrl: string | null
}

import { useRouter } from 'next/navigation'

export default function UsersPage() {
  const router = useRouter()
  const currentUser = useAuthStore((s) => s.user)

  useEffect(() => {
    if (currentUser && currentUser.role !== 'KAJUR') {
      toast.error('Akses ditolak: Hanya KAJUR yang dapat mengelola user')
      router.push('/dashboard')
    }
  }, [currentUser, router])
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showDelete, setShowDelete] = useState<UserData | null>(null)
  const [saving, setSaving] = useState(false)
  const [labs, setLabs] = useState<any[]>([])
  
  const [showInvite, setShowInvite] = useState(false)
  const [inviteCodes, setInviteCodes] = useState<any[]>([])
  const [newCode, setNewCode] = useState({ code: '', role: 'KEPALA_LAB' })
  const [copied, setCopied] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const fetchInviteCodes = useCallback(async () => {
    try {
      const res = await fetch('/api/invite-codes')
      if (res.ok) {
        const data = await res.json()
        setInviteCodes(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      toast.error('Gagal mengambil daftar kode')
    }
  }, [])

  useEffect(() => {
    if (showInvite) {
      fetchInviteCodes()
    }
  }, [showInvite, fetchInviteCodes])

  const handleCreateCode = async () => {
    if (!newCode.code) return toast.error('Masukan kode terlebih dahulu')
    setIsCreating(true)
    try {
      const res = await fetch('/api/invite-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCode)
      })
      if (res.ok) {
        toast.success('Kode undangan berhasil dibuat (Berlaku 1 jam)')
        setNewCode({ ...newCode, code: '' })
        fetchInviteCodes()
      } else {
        const d = await res.json()
        throw new Error(d.error)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteCode = async (code: string) => {
    try {
      const res = await fetch('/api/invite-codes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      if (res.ok) {
        toast.success('Kode berhasil dihapus')
        fetchInviteCodes()
      }
    } catch (err) {
      toast.error('Gagal menghapus kode')
    }
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
    toast.success('Kode berhasil disalin')
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      const result = await res.json()
      if (res.ok) setUsers(Array.isArray(result) ? result : [])
      
      const labRes = await fetch('/api/labs')
      const labResult = await labRes.json()
      if (labRes.ok) setLabs(Array.isArray(labResult) ? labResult : [])
    } catch (err) {
      toast.error('Gagal mengambil data user')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleUpdateUser = async (id: string, updates: any) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (res.ok) {
        toast.success('User diperbarui')
        fetchUsers()
      } else {
        const d = await res.json()
        throw new Error(d.error)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!showDelete) return
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${showDelete.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('User berhasil dihapus')
        setShowDelete(null)
        fetchUsers()
      } else {
        const d = await res.json()
        throw new Error(d.error)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.nama.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-blue-400" /> Manajemen User
          </h1>
          <p className="text-slate-400 text-sm mt-1">Kelola daftar pengguna dan hak akses sistem</p>
        </motion.div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
             <Input 
               placeholder="Cari user..." 
               value={search} 
               onChange={(e) => setSearch(e.target.value)}
               className="bg-slate-800/50 border-slate-700 pl-9"
             />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchUsers}
              className="glass border-slate-700 text-slate-400 hover:text-blue-400"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </Button>
            {currentUser?.role === 'KAJUR' && (
              <Button onClick={() => setShowInvite(true)} className="bg-blue-600 hover:bg-blue-700">
                <LinkIcon size={16} className="mr-2" /> Kelola Kode Undangan
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="glass-card overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton className="h-14 w-full bg-slate-800/50 rounded-xl" key={i} />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800/50">
                  <th className="px-6 py-4 text-left font-semibold">User</th>
                  <th className="px-6 py-4 text-left font-semibold">Role</th>
                  <th className="px-6 py-4 text-left font-semibold">Laboratorium</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                <AnimatePresence>
                  {filteredUsers.map((u, idx) => (
                    <motion.tr 
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="group hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 border border-slate-700/50 shadow-sm">
                            <AvatarImage src={u.fotoUrl || ''} className="object-cover" />
                            <AvatarFallback className="bg-slate-800 text-teal-400 text-sm font-bold">
                              {u.nama.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white text-sm font-medium">{u.nama}</p>
                            <p className="text-slate-500 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={
                          u.role === 'KEPALA_LAB' ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' :
                          u.role === 'KAJUR' ? 'border-blue-500/30 text-blue-500 bg-blue-500/5' :
                          'border-slate-500/30 text-slate-400 bg-slate-500/5'
                        }>
                          {u.role.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                          <FlaskConical size={12} className="text-blue-500" />
                          {labs.find(l => l.id === u.labId)?.nama || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs flex items-center gap-1 ${u.aktif ? 'text-green-500' : 'text-red-500'}`}>
                          {u.aktif ? <UserCheck size={12} /> : <UserX size={12} />}
                          {u.aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <button className="h-8 w-8 p-0 text-slate-400 hover:text-white transition-colors bg-transparent border-none outline-none cursor-pointer flex items-center justify-center">
                              <MoreVertical size={16} />
                            </button>
                          }/>
                          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-white">
                            <DropdownMenuItem onClick={() => handleUpdateUser(u.id, { aktif: !u.aktif })}>
                              {u.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                            </DropdownMenuItem>
                            <div className="h-px bg-slate-800 my-1" />
                            <DropdownMenuItem 
                              className="text-red-400 focus:text-red-400"
                              onClick={() => setShowDelete(u)}
                            >
                              <Trash2 size={14} className="mr-2" />
                              Hapus User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteConfirm 
        open={!!showDelete} 
        onOpenChange={(o) => !o && setShowDelete(null)}
        onConfirm={handleDeleteUser}
        loading={saving}
        title="Hapus User?"
        description={`Apakah Anda yakin ingin menghapus "${showDelete?.nama}"?`}
      />


      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="text-blue-400" size={20} /> Kelola Kode Undangan
            </DialogTitle>
            <p className="text-xs text-slate-400 mt-1">Buat kode kustom sekali pakai dengan masa berlaku 1 jam.</p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Create Form */}
            <div className="glass-card p-4 space-y-4 bg-slate-800/20">
              <h3 className="text-sm font-semibold text-white">Buat Kode Baru</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Tulis Kode (Contoh: KEPALA-LAB)</Label>
                  <Input 
                    placeholder="Contoh: KEPALA-LAB" 
                    value={newCode.code}
                    onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                    className="bg-slate-900 border-slate-700 h-9 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Pilih Role</Label>
                  <Select value={newCode.role} onValueChange={(v: any) => setNewCode({ ...newCode, role: v })}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      <SelectItem value="KEPALA_LAB">Kepala Lab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={handleCreateCode} 
                disabled={isCreating}
                className="w-full bg-blue-600 hover:bg-blue-700 h-9 text-xs font-bold"
              >
                {isCreating ? <RefreshCw className="animate-spin mr-2" size={14} /> : null}
                Buat Kode Undangan
              </Button>
            </div>

            {/* List Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Daftar Kode Aktif & Riwayat</h3>
              <div className="rounded-lg border border-slate-800 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-800/50 text-slate-400">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Kode</th>
                      <th className="px-4 py-2 text-left font-medium">Role</th>
                      <th className="px-4 py-2 text-left font-medium">Status</th>
                      <th className="px-4 py-2 text-right font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {inviteCodes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">Belum ada kode yang dibuat</td>
                      </tr>
                    ) : inviteCodes.map((c: any) => {
                      const isExpired = new Date(c.expiresAt) < new Date()
                      const status = c.used ? 'used' : (isExpired ? 'expired' : 'active')
                      
                      return (
                        <tr key={c.code} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-3 font-mono text-blue-400 font-bold">{c.code}</td>
                          <td className="px-4 py-3 text-slate-300">{c.role.replace('_', ' ')}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                              status === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                              status === 'used' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                              "bg-red-500/10 text-red-500 border-red-500/20"
                            )}>
                              {status === 'active' ? 'Aktif' : status === 'used' ? 'Digunakan' : 'Expired'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            {status === 'active' && (
                              <button 
                                onClick={() => handleCopy(c.code)}
                                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                              >
                                {copied === c.code ? <Check size={14} className="text-blue-400" /> : <Copy size={14} />}
                              </button>
                            )}
                            <button 
                              onClick={() => handleDeleteCode(c.code)}
                              className="p-1.5 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t border-slate-800">
            <Button onClick={() => setShowInvite(false)} variant="outline" className="w-full border-slate-700 h-9 text-xs">Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
