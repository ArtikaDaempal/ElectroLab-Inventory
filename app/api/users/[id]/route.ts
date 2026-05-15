import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSessionUser } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  
  // Hanya KAJUR yang bisa mengelola user
  if (user.role !== 'KAJUR') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  
  // Ambil data user yang akan diubah
  const { data: old } = await supabase.from('User').select('*').eq('id', id).single()
  if (!old) return Response.json({ error: 'User tidak ditemukan' }, { status: 404 })


  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }
  if (body.role !== undefined) updates.role = body.role
  if (body.aktif !== undefined) updates.aktif = body.aktif
  if (body.nip !== undefined) updates.nip = body.nip
  if (body.nim !== undefined) updates.nim = body.nim
  
  if (body.approve === true) {
    updates.pendingApproval = false
    updates.approvedBy = user.id
    updates.approvedAt = new Date().toISOString()
    updates.aktif = true
  }
  if (body.approve === false) {
    updates.pendingApproval = false
    updates.aktif = false
  }

  const { data, error } = await supabase.from('User').update(updates).eq('id', id).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  
  await createAuditLog({ 
    userId: user.id, 
    userName: user.nama, 
    aksi: 'UPDATE_USER', 
    tabel: 'User', 
    recordId: id, 
    dataLama: old, 
    dataBaru: data,
    labId: user.labId || 'GLOBAL'
  })
  
  return Response.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  
  if (user.role !== 'KAJUR') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  if (id === user.id) return Response.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 })

  const { data: target } = await supabase.from('User').select('labId').eq('id', id).single()
  if (!target) return Response.json({ error: 'User tidak ditemukan' }, { status: 404 })


  const { error } = await supabase.from('User').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  
  await createAuditLog({ 
    userId: user.id, 
    userName: user.nama, 
    aksi: 'DELETE_USER', 
    tabel: 'User', 
    recordId: id,
    labId: user.labId || 'GLOBAL'
  })
  
  return Response.json({ ok: true })
}
