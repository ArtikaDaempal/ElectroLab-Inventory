import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSessionUser } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'


export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['KEPALA_LAB', 'DOSEN', 'KAJUR'].includes(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { status, catatan } = await req.json()

  const { data: old } = await supabase.from('Peminjaman').select('*, alat:alatId(stokBaik, namaAlat), peminjam:peminjamId(nama, email)').eq('id', id).single()
  if (!old) return Response.json({ error: 'Peminjaman tidak ditemukan' }, { status: 404 })

  // 1. If returning or rejected after approval, add stock back
  if ((status === 'DIKEMBALIKAN' || status === 'DITOLAK') && (old.status === 'DISETUJUI' || old.status === 'DIAMBIL')) {
    const { data: alat } = await supabase.from('Peralatan').select('stokBaik').eq('id', old.alatId).single()
    if (alat) {
      await supabase.from('Peralatan').update({
        stokBaik: alat.stokBaik + old.jumlah,
        updatedAt: new Date().toISOString(),
      }).eq('id', old.alatId)
    }
  }

  // 2. If approving from pending, reduce stock
  if (status === 'DISETUJUI' && old.status === 'PENDING') {
    const { data: alat } = await supabase.from('Peralatan').select('stokBaik').eq('id', old.alatId).single()
    if (!alat || alat.stokBaik < old.jumlah) return Response.json({ error: 'Stok tidak mencukupi' }, { status: 400 })
    await supabase.from('Peralatan').update({
      stokBaik: alat.stokBaik - old.jumlah,
      updatedAt: new Date().toISOString(),
    }).eq('id', old.alatId)
  }

  const { data, error } = await supabase.from('Peminjaman').update({
    status, catatan: catatan || null, updatedAt: new Date().toISOString(),
  }).eq('id', id).select().single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  
  await createAuditLog({ userId: user.id, userName: user.nama, aksi: `UPDATE_PEMINJAMAN_${status}`, tabel: 'Peminjaman', recordId: id, dataLama: old, dataBaru: data })
  return Response.json(data)
}
