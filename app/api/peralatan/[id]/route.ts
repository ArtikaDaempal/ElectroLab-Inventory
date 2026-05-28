import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSessionUser } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  
  if (!['KEPALA_LAB', 'DOSEN', 'KAJUR'].includes(user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const { data: old } = await supabase.from('Peralatan').select('*').eq('id', id).single()
  if (!old) return Response.json({ error: 'Peralatan tidak ditemukan' }, { status: 404 })

  if (user.role !== 'KAJUR' && old.labId !== user.labId) {
    return Response.json({ error: 'Anda tidak memiliki akses ke alat di lab lain' }, { status: 403 })
  }

  const { 
    namaAlat, kategori, merek, kodeAlat, stokTotal, stokBaik, stokRusak, 
    stokButuhPerbaikan, namaLab, kondisi, fotoUrl 
  } = body

  // Ambil nama lab dari database dan lakukan sanitasi untuk menghindari bug trigger database
  const { data: labData } = await supabase.from('Laboratorium').select('nama').eq('id', old.labId).single()
  let sanitizedNamaLab = labData?.nama || null
  if (sanitizedNamaLab && (sanitizedNamaLab.toLowerCase().includes('listrik') || sanitizedNamaLab.toLowerCase().includes('mekanik'))) {
    sanitizedNamaLab = 'Lab TMIL'
  }

  const { data, error } = await supabase.from('Peralatan').update({
    namaAlat, kategori, merek, kodeAlat,
    stokTotal: Number(stokTotal) || 0,
    stokBaik: Number(stokBaik) || 0,
    stokRusak: Number(stokRusak) || 0,
    stokButuhPerbaikan: Number(stokButuhPerbaikan) || 0,
    namaLab: sanitizedNamaLab, prodi: null, kondisi, fotoUrl,
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { id } = await params
  const body = await req.json()
  const { action } = body // e.g. 'MARK_DAMAGED', 'MARK_REPAIR'

  const { data: old } = await supabase.from('Peralatan').select('*').eq('id', id).single()
  if (!old) return Response.json({ error: 'Peralatan tidak ditemukan' }, { status: 404 })

  if (user.role !== 'KAJUR' && old.labId !== user.labId) {
    return Response.json({ error: 'Akses ditolak' }, { status: 403 })
  }

  let updates: any = { updatedAt: new Date().toISOString() }

  if (action === 'MARK_DAMAGED') {
    if (old.stokBaik <= 0) return Response.json({ error: 'Stok baik habis' }, { status: 400 })
    updates.stokBaik = old.stokBaik - 1
    updates.stokRusak = old.stokRusak + 1
  } else if (action === 'MARK_REPAIR') {
    if (old.stokRusak <= 0) return Response.json({ error: 'Tidak ada stok rusak' }, { status: 400 })
    updates.stokRusak = old.stokRusak - 1
    updates.stokButuhPerbaikan = old.stokButuhPerbaikan + 1
  } else if (action === 'FIXED') {
    if (old.stokButuhPerbaikan <= 0 && old.stokRusak <= 0) return Response.json({ error: 'Tidak ada unit yang diperbaiki/rusak' }, { status: 400 })
    if (old.stokButuhPerbaikan > 0) {
      updates.stokButuhPerbaikan = old.stokButuhPerbaikan - 1
    } else {
      updates.stokRusak = old.stokRusak - 1
    }
    updates.stokBaik = old.stokBaik + 1
  }

  const { data, error } = await supabase.from('Peralatan').update(updates).eq('id', id).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })

  await createAuditLog({ 
    userId: user.id, 
    userName: user.nama, 
    aksi: 'UPDATE_STATUS_ALAT', 
    tabel: 'Peralatan', 
    recordId: id, 
    dataLama: old, 
    dataBaru: data,
    labId: data.labId
  })
  
  return Response.json(data)
}
