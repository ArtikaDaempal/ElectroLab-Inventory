'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlaskConical, Plus, Edit2, Trash2, RefreshCw, AlertTriangle, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import DeleteConfirm from '@/components/ui/DeleteConfirm'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Lab {
  id: string
  nama: string
  kode: string
  deskripsi: string | null
  prodi: string | null
  kepalaLab: { id: string, nama: string, email: string } | null
}

const PRODI_OPTIONS = [
  'Teknik Informatika',
  'Teknik Komputer',
  'Teknik Listrik'
]

export default function LabManagementPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (user && user.role !== 'KAJUR') {
      toast.error('Akses ditolak: Hanya KAJUR yang dapat mengelola laboratorium')
      router.push('/dashboard')
    }
  }, [user, router])

  const [labs, setLabs] = useState<Lab[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState<Lab | null>(null)
  const [showDelete, setShowDelete] = useState<Lab | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({ nama: '', kode: '', deskripsi: '', prodi: '', kepalaLabId: 'none' })

  const fetchLabs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/laboratorium')
      if (res.ok) setLabs(await res.json())
    } catch (err) {
      toast.error('Gagal mengambil data lab')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { 
    fetchLabs() 
    fetchUsers()
  }, [])

  const handleOpenAdd = () => {
    setForm({ nama: '', kode: '', deskripsi: '', prodi: '', kepalaLabId: 'none' })
    setShowAdd(true)
  }

  const handleOpenEdit = (lab: Lab) => {
    setShowEdit(lab)
    setForm({
      nama: lab.nama,
      kode: lab.kode,
      deskripsi: lab.deskripsi || '',
      prodi: lab.prodi || '',
      kepalaLabId: lab.kepalaLab?.id || 'none'
    })
  }

  const handleSubmit = async () => {
    if (!form.nama || !form.kode) {
      toast.error('Nama dan Kode wajib diisi')
      return
    }
    setSaving(true)
    try {
      const method = showEdit ? 'PUT' : 'POST'
      const res = await fetch('/api/laboratorium', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(showEdit ? { ...form, id: showEdit.id } : form)
      })
      if (res.ok) {
        toast.success(showEdit ? 'Lab diperbarui' : 'Lab ditambahkan')
        setShowAdd(false)
        setShowEdit(null)
        setForm({ nama: '', kode: '', deskripsi: '', prodi: '', kepalaLabId: 'none' })
        fetchLabs()
        fetchUsers() // Refresh list user untuk update status kepala lab
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

  const handleDelete = async () => {
    if (!showDelete) return
    setSaving(true)
    try {
      const res = await fetch(`/api/laboratorium?id=${showDelete.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Lab dihapus')
        setShowDelete(null)
        fetchLabs()
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

  const dosenOptions = users.filter(u => u.role === 'DOSEN' || u.role === 'KEPALA_LAB')

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="text-teal-400" /> Manajemen Laboratorium
          </h1>
          <p className="text-slate-400 text-sm mt-1">Kelola daftar unit laboratorium institusi beserta Kepala Lab</p>
        </motion.div>
        <Button 
          onClick={handleOpenAdd}
          className="bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20"
        >
          <Plus size={16} className="mr-2" /> Tambah Lab Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card h-44 animate-pulse bg-slate-800/50" />
          ))
        ) : (
          labs.map((lab) => (
            <motion.div 
              key={lab.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => router.push(`/dashboard/peralatan?labId=${lab.id}`)}
              className="glass-card p-6 group hover:border-teal-500/40 transition-all flex flex-col justify-between cursor-pointer border border-slate-800"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col gap-1">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
                      <FlaskConical size={20} />
                    </div>
                    {lab.prodi && (
                      <span className="text-[9px] font-bold text-teal-400/70 uppercase tracking-tighter mt-1">{lab.prodi}</span>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={(e) => { e.stopPropagation(); handleOpenEdit(lab) }}>
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400" onClick={(e) => { e.stopPropagation(); setShowDelete(lab) }}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <h3 className="text-white font-bold text-lg leading-tight">{lab.nama}</h3>
                <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase tracking-widest">{lab.kode}</p>
                <p className="text-slate-400 text-xs line-clamp-2 mt-3 italic">"{lab.deskripsi || 'Tidak ada deskripsi'}"</p>
                
                {lab.kepalaLab ? (
                  <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center gap-2 text-xs text-amber-400 font-medium">
                    <UserCheck size={14} className="shrink-0" />
                    <span className="truncate">Kepala: {lab.kepalaLab.nama}</span>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center gap-2 text-xs text-slate-500 italic">
                    <UserCheck size={14} className="shrink-0 text-slate-600" />
                    <span>Belum ditugaskan</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd || !!showEdit} onOpenChange={(o) => { if(!o) { setShowAdd(false); setShowEdit(null) } }}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{showEdit ? 'Edit Laboratorium' : 'Tambah Laboratorium'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Laboratorium*</Label>
              <Input value={form.nama} onChange={(e) => setForm({...form, nama: e.target.value})} placeholder="Misal: Lab Game Programming" className="bg-slate-800/50 border-slate-700 text-white" />
            </div>
            <div className="space-y-2">
              <Label>Prodi Teknik*</Label>
              <Select value={form.prodi} onValueChange={(v) => setForm({...form, prodi: v ?? ''})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Pilih Prodi Teknik" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  {PRODI_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kode Lab*</Label>
              <Input value={form.kode} onChange={(e) => setForm({...form, kode: e.target.value})} placeholder="Misal: LAB-GP" className="bg-slate-800/50 border-slate-700 text-white font-mono uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi Singkat</Label>
              <Input value={form.deskripsi} onChange={(e) => setForm({...form, deskripsi: e.target.value})} placeholder="Kapasitas atau fokus lab..." className="bg-slate-800/50 border-slate-700 text-white" />
            </div>
            
            <div className="space-y-2">
              <Label>Kepala Laboratorium</Label>
              <Select value={form.kepalaLabId} onValueChange={(v) => setForm({...form, kepalaLabId: v ?? 'none'})}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Pilih Kepala Lab">
                    {form.kepalaLabId === 'none' || !form.kepalaLabId 
                      ? 'Tanpa Kepala Lab' 
                      : (dosenOptions.find(d => d.id === form.kepalaLabId)?.nama || 'Tanpa Kepala Lab')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="none">Tanpa Kepala Lab</SelectItem>
                  {dosenOptions.map(d => {
                    const isAssignedElsewhere = d.labId && d.labId !== showEdit?.id
                    const currentLabName = isAssignedElsewhere ? (labs.find(l => l.id === d.labId)?.nama || 'Lab Lain') : ''
                    return (
                      <SelectItem key={d.id} value={d.id}>
                        {d.nama} {isAssignedElsewhere ? `(Kepala ${currentLabName})` : ''}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={saving} className="bg-teal-600 hover:bg-teal-700 w-full font-bold">
              {saving ? <RefreshCw className="animate-spin mr-2" size={16} /> : null}
              {showEdit ? 'Update Data Lab' : 'Simpan Laboratorium Baru'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirm 
        open={!!showDelete} 
        onOpenChange={(o) => !o && setShowDelete(null)}
        onConfirm={handleDelete}
        loading={saving}
        title="Hapus Laboratorium?"
        description={`Menghapus "${showDelete?.nama}" hanya bisa dilakukan jika tidak ada peralatan di dalamnya.`}
      />
    </div>
  )
}
