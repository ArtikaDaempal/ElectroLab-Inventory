import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSessionUser } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  
  // KAJUR, KEPALA_LAB, dan DOSEN boleh mengubah alat
  if (!['KEPALA_LAB', 'DOSEN', 'KAJUR'].includes(user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const { data: old } = await supabase.from('Peralatan').select('*').eq('id', id).single()
  if (!old) return Response.json({ error: 'Peralatan tidak ditemukan' }, { status: 404 })

  // Validasi: KEPALA_LAB/DOSEN hanya bisa mengubah alat di lab mereka sendiri
  if (user.role !== 'KAJUR' && old.labId !== user.labId) {
    return Response.json({ error: 'Anda tidak memiliki akses ke alat di lab lain' }, { status: 403 })
  }

  const { 
    namaAlat, kategori, merek, kodeAlat, stokTotal, stokBaik, stokRusak, 
    stokButuhPerbaikan, namaLab, prodi, kondisi, fotoUrl 
  } = body

  const { data, error } = await supabase.from('Peralatan').update({
    namaAlat, kategori, merek, kodeAlat,
    stokTotal: Number(stokTotal) || 0,
    stokBaik: Number(stokBaik) || 0,
    stokRusak: Number(stokRusak) || 0,
    stokButuhPerbaikan: Number(stokButuhPerbaikan) || 0,
    namaLab, prodi, kondisi, fotoUrl,
    updatedAt: new Date().toISOString(),
  }).eq('id', id).select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  await createAuditLog({ 
    userId: user.id, 
    userName: user.nama, 
    aksi: 'UPDATE_PERALATAN', 
    tabel: 'Peralatan', 
    recordId: id, 
    dataLama: old, 
    dataBaru: data,
    labId: data.labId
  })
  return Response.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  
  if (!['KEPALA_LAB', 'KAJUR'].includes(user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { data: old } = await supabase.from('Peralatan').select('*').eq('id', id).single()
  if (!old) return Response.json({ error: 'Peralatan tidak ditemukan' }, { status: 404 })

  // Validasi: KEPALA_LAB hanya bisa menghapus alat di lab mereka sendiri
  if (user.role === 'KEPALA_LAB' && old.labId !== user.labId) {
    return Response.json({ error: 'Anda tidak memiliki akses untuk menghapus alat ini' }, { status: 403 })
  }

  const { error } = await supabase.from('Peralatan').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  
  await createAuditLog({ 
    userId: user.id, 
    userName: user.nama, 
    aksi: 'DELETE_PERALATAN', 
    tabel: 'Peralatan', 
    recordId: id, 
    dataLama: old,
    labId: old.labId
  })
  return Response.json({ ok: true })
}
